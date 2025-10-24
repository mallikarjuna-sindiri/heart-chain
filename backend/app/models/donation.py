"""
Donation Model
Represents donations made by donors to campaigns
"""
from beanie import Document, Link
from pydantic import Field, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

from app.models.user import User
from app.models.campaign import Campaign


class DonationStatus(str, Enum):
    """Donation status enumeration"""
    INITIATED = "initiated"
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    """Payment method enumeration"""
    RAZORPAY = "razorpay"
    UPI = "upi"
    CARD = "card"
    NETBANKING = "netbanking"
    WALLET = "wallet"


class Donation(Document):
    """Donation document model"""
    
    # Donor information
    donor: Link[User]
    donor_name: str
    donor_email: EmailStr
    donor_phone: Optional[str] = None
    
    # Campaign
    campaign: Link[Campaign]
    
    # Payment details
    amount: float
    currency: str = "INR"
    payment_method: Optional[PaymentMethod] = None
    
    # Razorpay
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    
    # Status
    status: DonationStatus = DonationStatus.INITIATED
    
    # Metadata
    is_anonymous: bool = False
    message: Optional[str] = None  # Message from donor
    transaction_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Tax receipt
    receipt_number: Optional[str] = None
    receipt_url: Optional[str] = None
    
    class Settings:
        name = "donations"
        indexes = ["donor", "campaign", "status", "razorpay_order_id"]
    
    class Config:
        json_schema_extra = {
            "example": {
                "donor_name": "John Doe",
                "donor_email": "john@example.com",
                "amount": 5000.0,
                "currency": "INR",
                "is_anonymous": False,
                "message": "Happy to help!"
            }
        }
