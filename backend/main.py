"""
Heart-Chain Backend API
FastAPI application for transparent donation and orphanage support platform
"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.core.config import settings
from app.core.database import init_db, close_db, get_db
from app.core.bootstrap import ensure_admin_user
from app.api.routes import auth, users, orphanages, campaigns, donations, admin, reports
from app.api.routes import uploads


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup database connection"""
    await init_db()
    # Ensure default admin user exists after DB is ready
    try:
        await ensure_admin_user()
    except Exception as e:
        # Don't crash the app if bootstrap fails; log instead
        print(f"⚠️  Admin bootstrap error: {e}")
    yield
    await close_db()


app = FastAPI(
    title="Heart-Chain API",
    description="Transparent donation and orphanage support platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    # In development, allow LAN IP origins like http://192.168.x.x:5173
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|(?:[0-9]{1,3}\.){3}[0-9]{1,3})(:\d+)?$" if settings.ENVIRONMENT == "development" else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(orphanages.router, prefix="/api/orphanages", tags=["Orphanages"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["Campaigns"])
app.include_router(donations.router, prefix="/api/donations", tags=["Donations"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["Uploads"])

# Static file serving for uploaded media
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Heart-Chain API is running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected"
    }


@app.get("/health/db")
async def db_health_check():
    """Database connectivity health check using MongoDB ping"""
    try:
        # Get current DB client and ping the admin database to verify connectivity
        client = get_db()
        if client is None:
            return {"status": "error", "message": "Database client not initialized"}
        await client.admin.command("ping")
        return {"status": "ok", "database": settings.DATABASE_NAME}
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
