"""
Transaction Model
Represents all financial transactions (donations and disbursements)
"""
from beanie import Document, Link
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum

from app.models.user import User
from app.models.campaign import Campaign
from app.models.orphanage import Orphanage
from app.models.donation import Donation


class TransactionType(str, Enum):
    """Transaction type enumeration"""
    DONATION = "donation"
    DISBURSEMENT = "disbursement"
    REFUND = "refund"


class TransactionStatus(str, Enum):
    """Transaction status"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REVERSED = "reversed"


class Transaction(Document):
    """Transaction document model for transparency ledger"""
    
    # Transaction Details
    transaction_id: str = Field(..., unique=True, index=True)
    transaction_type: TransactionType
    amount: float
    currency: str = "INR"
    
    # Status
    status: TransactionStatus = TransactionStatus.PENDING
    
    # Relations (Optional based on transaction type)
    campaign: Optional[Link[Campaign]] = None
    orphanage: Optional[Link[Orphanage]] = None
    donor: Optional[Link[User]] = None
    donation: Optional[Link[Donation]] = None
    
    # Payment Gateway Details
    payment_gateway: Optional[str] = None  # e.g., "razorpay"
    gateway_transaction_id: Optional[str] = None
    gateway_order_id: Optional[str] = None
    
    # Disbursement Details (for admin disbursements)
    disbursed_by: Optional[str] = None  # Admin user ID
    disbursement_method: Optional[str] = None  # e.g., "bank_transfer"
    disbursement_reference: Optional[str] = None
    
    # Notes
    description: Optional[str] = None
    notes: Optional[str] = None
    
    # Timeline
    transaction_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "transactions"
        indexes = [
            "transaction_id",
            "transaction_type",
            "status",
            "campaign",
            "orphanage",
            "donor"
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": "TXN123456789",
                "transaction_type": "donation",
                "amount": 5000.0,
                "currency": "INR",
                "status": "completed",
                "payment_gateway": "razorpay",
                "description": "Donation to Educational Materials Campaign"
            }
        }
