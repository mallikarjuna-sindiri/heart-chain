"""
Donation Routes
Donation creation, Razorpay integration, and webhooks
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request, Header
from typing import Dict, Optional
from datetime import datetime
import uuid

from app.models.donation import Donation, DonationStatus
from app.models.campaign import Campaign
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.core.security import get_current_user_token
from app.utils.razorpay import create_payment_order, verify_payment_signature, verify_webhook_signature
from app.utils.email import send_donation_confirmation_email

router = APIRouter()


@router.post("/create-order")
async def create_donation_order(
    campaign_id: str,
    amount: float,
    is_anonymous: bool = False,
    message: Optional[str] = None,
    token_data: Dict = Depends(get_current_user_token)
):
    """Create Razorpay order for donation"""
    # Get campaign
    campaign = await Campaign.get(campaign_id)
    if not campaign or campaign.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Campaign not available")
    
    # Get user
    user_id = token_data.get("sub")
    user = await User.get(user_id)
    
    # Create Razorpay order
    notes = {
        "campaign_id": campaign_id,
        "donor_id": user_id,
        "donor_email": user.email
    }
    order = create_payment_order(amount=amount, notes=notes)
    
    # Create donation record
    donation = Donation(
        donor=user,
        donor_name=user.full_name,
        donor_email=user.email,
        donor_phone=user.phone,
        campaign=campaign,
        amount=amount,
        razorpay_order_id=order["id"],
        is_anonymous=is_anonymous,
        message=message,
        status=DonationStatus.INITIATED
    )
    await donation.insert()
    
    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "donation_id": str(donation.id)
    }


@router.post("/verify-payment")
async def verify_donation_payment(
    donation_id: str,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    token_data: Dict = Depends(get_current_user_token)
):
    """Verify payment after Razorpay checkout"""
    donation = await Donation.get(donation_id)
    
    if not donation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donation not found")
    
    # Verify signature
    is_valid = verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    
    if not is_valid:
        donation.status = DonationStatus.FAILED
        await donation.save()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment verification failed")
    
    # Update donation
    donation.razorpay_payment_id = razorpay_payment_id
    donation.razorpay_signature = razorpay_signature
    donation.status = DonationStatus.COMPLETED
    donation.transaction_date = datetime.utcnow()
    await donation.save()
    
    # Update campaign raised amount
    await donation.fetch_link(Donation.campaign)
    campaign = donation.campaign
    campaign.raised_amount += donation.amount
    campaign.total_donors += 1
    await campaign.save()
    
    # Create transaction record
    transaction = Transaction(
        transaction_id=f"TXN{uuid.uuid4().hex[:12].upper()}",
        transaction_type=TransactionType.DONATION,
        amount=donation.amount,
        status=TransactionStatus.COMPLETED,
        campaign=campaign,
        orphanage=campaign.orphanage,
        donor=donation.donor,
        donation=donation,
        payment_gateway="razorpay",
        gateway_transaction_id=razorpay_payment_id,
        gateway_order_id=razorpay_order_id,
        description=f"Donation to {campaign.title}"
    )
    await transaction.insert()
    
    # Send confirmation email
    try:
        await send_donation_confirmation_email(
            donor_email=donation.donor_email,
            donor_name=donation.donor_name,
            campaign_title=campaign.title,
            amount=donation.amount,
            transaction_id=transaction.transaction_id
        )
    except Exception as e:
        print(f"Failed to send confirmation email: {str(e)}")
    
    return {
        "message": "Donation successful",
        "transaction_id": transaction.transaction_id,
        "donation_id": str(donation.id)
    }


@router.get("/my-donations")
async def get_my_donations(token_data: Dict = Depends(get_current_user_token)):
    """Get current user's donations"""
    from beanie import PydanticObjectId
    
    user_id = token_data.get("sub")
    donations = await Donation.find(
        Donation.donor.id == PydanticObjectId(user_id)
    ).sort("-created_at").to_list()
    
    result = []
    for d in donations:
        await d.fetch_link(Donation.campaign)
        result.append({
            "id": str(d.id),
            "amount": d.amount,
            "status": d.status,
            "campaign_title": d.campaign.title if d.campaign else None,
            "transaction_date": d.transaction_date.isoformat() if d.transaction_date else None,
            "created_at": d.created_at.isoformat()
        })
    
    return result


@router.get("/{donation_id}")
async def get_donation(
    donation_id: str,
    token_data: Dict = Depends(get_current_user_token)
):
    """Get donation details"""
    donation = await Donation.get(donation_id)
    
    if not donation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donation not found")
    
    # Check authorization
    user_id = token_data.get("sub")
    await donation.fetch_link(Donation.donor)
    
    if str(donation.donor.id) != user_id and token_data.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    await donation.fetch_link(Donation.campaign)
    
    return {
        "id": str(donation.id),
        "donor_name": donation.donor_name,
        "amount": donation.amount,
        "status": donation.status,
        "campaign": {
            "id": str(donation.campaign.id),
            "title": donation.campaign.title
        } if donation.campaign else None,
        "is_anonymous": donation.is_anonymous,
        "message": donation.message,
        "transaction_date": donation.transaction_date.isoformat() if donation.transaction_date else None,
        "created_at": donation.created_at.isoformat()
    }


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None)
):
    """Handle Razorpay webhooks"""
    body = await request.body()
    
    # Verify webhook signature
    if not verify_webhook_signature(body, x_razorpay_signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")
    
    # Process webhook event
    import json
    payload = json.loads(body)
    event = payload.get("event")
    
    # Handle payment.captured event
    if event == "payment.captured":
        # TODO: Process payment captured event
        pass
    
    return {"status": "ok"}
