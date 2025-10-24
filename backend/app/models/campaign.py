"""
Campaign Model
Represents funding campaigns created by orphanages
"""
from beanie import Document, Link
from pydantic import Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.models.orphanage import Orphanage


class CampaignCategory(str, Enum):
    """Campaign category enumeration"""
    EDUCATION = "education"
    FOOD = "food"
    MEDICAL = "medical"
    INFRASTRUCTURE = "infrastructure"
    CLOTHING = "clothing"
    EMERGENCY = "emergency"
    OTHER = "other"


class CampaignStatus(str, Enum):
    """Campaign status enumeration"""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    ACTIVE = "active"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CLOSED = "closed"


class Campaign(Document):
    """Campaign document model"""
    
    # Basic Information
    title: str = Field(..., index=True)
    description: str
    category: CampaignCategory
    
    # Financial
    target_amount: float
    raised_amount: float = 0.0
    disbursed_amount: float = 0.0
    
    # Timeline
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    
    # Status
    status: CampaignStatus = CampaignStatus.DRAFT
    approved_by: Optional[str] = None  # Admin user ID
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    # Media
    images: List[str] = []
    documents: List[str] = []
    
    # Relations
    orphanage: Link[Orphanage]
    
    # Metadata
    total_donors: int = 0
    is_featured: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "campaigns"
        indexes = ["title", "status", "category", "orphanage"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Educational Materials for 50 Children",
                "description": "Help us provide books, uniforms, and supplies",
                "category": "education",
                "target_amount": 100000.0,
                "start_date": "2024-01-01T00:00:00",
                "end_date": "2024-06-30T23:59:59"
            }
        }
