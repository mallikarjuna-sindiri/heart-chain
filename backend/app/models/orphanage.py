"""
Orphanage Model
Represents orphanage organizations
"""
from beanie import Document, Link
from pydantic import Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.models.user import User


class OrphanageStatus(str, Enum):
    """Orphanage verification status"""
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class Orphanage(Document):
    """Orphanage document model"""
    
    # Basic Information
    name: str = Field(..., index=True)
    registration_number: str = Field(..., unique=True, index=True)
    description: str
    
    # Contact Information
    email: EmailStr
    phone: str
    website: Optional[str] = None
    
    # Location
    address: str
    city: str
    state: str
    pincode: str
    country: str = "India"
    
    # Verification
    status: OrphanageStatus = OrphanageStatus.PENDING
    verification_documents: List[str] = []  # URLs to uploaded documents
    verified_by: Optional[Link[User]] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    # Details
    capacity: int  # Number of children
    current_occupancy: int = 0
    established_year: Optional[int] = None
    
    # Media
    logo: Optional[str] = None
    images: List[str] = []
    
    # Owner (linked user)
    user: Link[User]
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "orphanages"
        indexes = ["name", "status", "registration_number"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Hope Children's Home",
                "registration_number": "ORG123456",
                "description": "Providing care and education to underprivileged children",
                "email": "contact@hopechildrenshome.org",
                "phone": "+919876543210",
                "address": "123 Main Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "capacity": 50,
                "current_occupancy": 35
            }
        }
