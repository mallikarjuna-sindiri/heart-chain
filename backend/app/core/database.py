"""
Database Configuration
MongoDB connection with Beanie ODM
"""
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from typing import Optional

from app.core.config import settings
from app.models.user import User
from app.models.orphanage import Orphanage
from app.models.campaign import Campaign
from app.models.donation import Donation
from app.models.report import Report
from app.models.transaction import Transaction


# Global database client
db_client = None


async def init_db():
    """Initialize database connection and Beanie ODM"""
    global db_client
    
    # Create Motor client
    db_client = AsyncIOMotorClient(settings.MONGODB_URL)
    
    # Initialize Beanie with document models
    await init_beanie(
        database=db_client[settings.DATABASE_NAME],
        document_models=[
            User,
            Orphanage,
            Campaign,
            Donation,
            Report,
            Transaction
        ]
    )
    
    print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_db():
    """Close database connection"""
    global db_client
    if db_client:
        db_client.close()
        print("✅ Database connection closed")


def get_db():
    """Dependency to get database client"""
    return db_client
