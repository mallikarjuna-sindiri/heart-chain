"""
User Routes
User profile management endpoints
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import Dict, Optional
from pydantic import BaseModel
import os

from app.models.user import User
from app.core.security import get_current_user_token, hash_password
from app.schemas.auth import UserResponse


router = APIRouter()


@router.get("/profile", response_model=UserResponse)
async def get_profile(token_data: Dict = Depends(get_current_user_token)):
    """Get current user profile"""
    user_id = token_data.get("sub")
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        profile_image=user.profile_image,
        created_at=user.created_at.isoformat()
    )


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


@router.put("/profile")
async def update_profile(
    update: UserProfileUpdate,
    token_data: Dict = Depends(get_current_user_token)
):
    """Update user profile (JSON body with full_name/phone)"""
    user_id = token_data.get("sub")
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    if update.full_name is not None:
        user.full_name = update.full_name
    if update.phone is not None:
        user.phone = update.phone
    
    from datetime import datetime
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return {"message": "Profile updated successfully"}


@router.post("/profile/image")
async def upload_profile_image(
    file: UploadFile = File(...),
    token_data: Dict = Depends(get_current_user_token)
):
    """Upload profile image, persist file, and update user.profile_image URL"""
    user_id = token_data.get("sub")
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Validate basic content type
    filename = file.filename or "upload.jpg"
    ext = filename.split(".")[-1].lower()
    if ext not in {"jpg", "jpeg", "png"}:
        raise HTTPException(status_code=400, detail="Only JPG/PNG allowed")

    uploads_dir = os.path.join(os.getcwd(), "uploads", "users")
    os.makedirs(uploads_dir, exist_ok=True)

    from datetime import datetime
    safe_name = f"avatar_{user_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}.{ext}"
    path = os.path.join(uploads_dir, safe_name)

    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)

    public_url = f"/uploads/users/{safe_name}"

    user.profile_image = public_url
    from datetime import datetime as dt
    user.updated_at = dt.utcnow()
    await user.save()

    return {"url": public_url}


@router.delete("/profile")
async def delete_account(
    password: str,
    token_data: Dict = Depends(get_current_user_token)
):
    """Delete user account (requires password confirmation)"""
    from app.core.security import verify_password
    
    user_id = token_data.get("sub")
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify password
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # Soft delete (deactivate)
    user.is_active = False
    await user.save()
    
    return {"message": "Account deleted successfully"}
