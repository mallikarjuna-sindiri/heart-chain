"""
Upload Routes
Handle file uploads (logos, documents) and return accessible URLs.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import Optional
import os
import uuid

from app.core.config import settings

router = APIRouter()


def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def validate_file(file: UploadFile):
    # Validate extension
    filename = file.filename or "upload.bin"
    ext = filename.split(".")[-1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type .{ext} not allowed"
        )


@router.post("/orphanage-logo")
async def upload_orphanage_logo(
    file: UploadFile = File(...),
):
    """Upload an orphanage logo and return its URL.

    Public endpoint to support logo upload during registration. The file is validated
    for type and size. Post-registration flows can still restrict usage at the
    consuming endpoints.
    """
    validate_file(file)

    # Prepare path
    folder = os.path.join(settings.UPLOAD_DIR, "orphanages")
    ensure_dir(folder)

    ext = (file.filename or "upload").split(".")[-1].lower()
    name = f"{uuid.uuid4().hex}.{ext}"
    disk_path = os.path.join(folder, name)

    # Save file
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    with open(disk_path, "wb") as f:
        f.write(content)

    url = f"/uploads/orphanages/{name}"
    return {"url": url}
