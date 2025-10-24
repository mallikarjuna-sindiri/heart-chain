"""
Report Model
Represents utilization reports submitted by orphanages
"""
from beanie import Document, Link
from pydantic import Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.models.campaign import Campaign
from app.models.orphanage import Orphanage


class ReportStatus(str, Enum):
    """Report verification status"""
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    REVISION_REQUIRED = "revision_required"


class ReportType(str, Enum):
    """Type of report"""
    UTILIZATION = "utilization"
    PROGRESS = "progress"
    COMPLETION = "completion"
    QUARTERLY = "quarterly"


class Report(Document):
    """Report document model"""
    
    # Basic Information
    title: str
    description: str
    report_type: ReportType = ReportType.UTILIZATION
    
    # Relations
    campaign: Link[Campaign]
    orphanage: Link[Orphanage]
    
    # Financial
    amount_utilized: float
    
    # Report Details
    beneficiaries_count: int  # Number of children benefited
    activities_conducted: List[str] = []
    
    # Media
    images: List[str] = []  # Photos of activities/purchases
    receipts: List[str] = []  # Bills and receipts
    documents: List[str] = []  # Additional documents
    
    # Status
    status: ReportStatus = ReportStatus.SUBMITTED
    verified_by: Optional[str] = None  # Admin user ID
    verified_at: Optional[datetime] = None
    verification_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    # Timeline
    reporting_period_start: datetime
    reporting_period_end: datetime
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "reports"
        indexes = ["campaign", "orphanage", "status", "report_type"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Educational Materials Utilization Report - Q1 2024",
                "description": "Report on usage of funds for educational materials",
                "report_type": "utilization",
                "amount_utilized": 45000.0,
                "beneficiaries_count": 50,
                "activities_conducted": [
                    "Purchased textbooks for 50 children",
                    "Distributed uniforms",
                    "Organized stationery distribution"
                ]
            }
        }
