"""
Orphanage Schemas
Pydantic models for orphanage operations
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from app.models.orphanage import OrphanageStatus


class OrphanageCreate(BaseModel):
    """Orphanage registration schema"""
    # All fields mandatory for registration (as requested)
    name: str = Field(..., min_length=3)
    registration_number: str
    description: str = Field(..., min_length=1)  # remove 50-char requirement
    email: EmailStr
    phone: str
    website: Optional[str] = None  # not mandatory per request
    address: str
    city: str
    state: str
    pincode: str
    country: str = "India"
    capacity: int = Field(..., gt=0)
    current_occupancy: int = Field(..., ge=0)
    established_year: int  # now required
    # Media
    logo: str  # now required
    images: List[str] = []


class OrphanageUpdate(BaseModel):
    """Orphanage update schema"""
    name: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    capacity: Optional[int] = None
    current_occupancy: Optional[int] = None


class OrphanageResponse(BaseModel):
    """Orphanage response schema"""
    id: str
    name: str
    registration_number: str
    description: str
    email: EmailStr
    phone: str
    website: Optional[str] = None
    address: str
    city: str
    state: str
    pincode: str
    country: str
    capacity: int
    current_occupancy: int
    established_year: Optional[int] = None
    status: OrphanageStatus
    verification_documents: List[str] = []
    logo: Optional[str] = None
    images: List[str] = []
    created_at: str
    
    class Config:
        from_attributes = True


class OrphanageVerification(BaseModel):
    """Orphanage verification schema (admin only)"""
    orphanage_id: str
    status: OrphanageStatus
    rejection_reason: Optional[str] = None
