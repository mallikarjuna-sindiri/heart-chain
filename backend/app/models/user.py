"""
User Model
Represents users (Orphanage, Donor, Admin)
"""
from beanie import Document
from pydantic import EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""
    ORPHANAGE = "orphanage"
    DONOR = "donor"
    ADMIN = "admin"


class User(Document):
    """User document model"""
    
    email: EmailStr = Field(..., unique=True, index=True)
    hashed_password: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Profile image
    profile_image: Optional[str] = None
    
    # Metadata
    last_login: Optional[datetime] = None
    
    class Settings:
        name = "users"
        indexes = ["email", "role"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "full_name": "John Doe",
                "role": "donor",
                "phone": "+919876543210",
                "is_active": True
            }
        }
