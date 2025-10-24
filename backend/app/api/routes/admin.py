"""
Admin Routes
Admin-specific operations: verification, approvals, disbursements
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Optional
from datetime import datetime
import uuid

from app.models.orphanage import Orphanage, OrphanageStatus
from app.models.campaign import Campaign, CampaignStatus
from app.models.report import Report, ReportStatus
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.user import User, UserRole
from app.core.security import get_current_user_token
from app.utils.email import send_orphanage_verification_email, send_fund_disbursement_email

router = APIRouter()


async def verify_admin(token_data: Dict):
    """Verify user is admin"""
    if token_data.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


@router.post("/orphanages/{orphanage_id}/verify")
async def verify_orphanage(
    orphanage_id: str,
    status: OrphanageStatus,
    rejection_reason: Optional[str] = None,
    token_data: Dict = Depends(get_current_user_token)
):
    """Verify or reject orphanage"""
    await verify_admin(token_data)
    
    orphanage = await Orphanage.get(orphanage_id)
    if not orphanage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orphanage not found")
    
    orphanage.status = status
    orphanage.rejection_reason = rejection_reason
    orphanage.verified_at = datetime.utcnow()
    
    admin_id = token_data.get("sub")
    admin = await User.get(admin_id)
    orphanage.verified_by = admin
    
    await orphanage.save()
    
    # Send email notification
    try:
        await send_orphanage_verification_email(
            email=orphanage.email,
            orphanage_name=orphanage.name,
            status=status.value,
            message=rejection_reason
        )
    except Exception as e:
        print(f"Failed to send verification email: {str(e)}")
    
    return {"message": f"Orphanage {status.value} successfully"}


@router.post("/campaigns/{campaign_id}/approve")
async def approve_campaign(
    campaign_id: str,
    approved: bool,
    rejection_reason: Optional[str] = None,
    token_data: Dict = Depends(get_current_user_token)
):
    """Approve or reject campaign"""
    await verify_admin(token_data)
    
    campaign = await Campaign.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    
    if approved:
        campaign.status = CampaignStatus.ACTIVE
        campaign.approved_at = datetime.utcnow()
        campaign.approved_by = token_data.get("sub")
    else:
        campaign.status = CampaignStatus.REJECTED
        campaign.rejection_reason = rejection_reason
    
    await campaign.save()
    
    return {"message": f"Campaign {'approved' if approved else 'rejected'} successfully"}


@router.post("/campaigns/{campaign_id}/disburse")
async def disburse_funds(
    campaign_id: str,
    amount: float,
    disbursement_method: str = "bank_transfer",
    disbursement_reference: Optional[str] = None,
    token_data: Dict = Depends(get_current_user_token)
):
    """Disburse funds to orphanage"""
    await verify_admin(token_data)
    
    campaign = await Campaign.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    
    # Validate amount
    available = campaign.raised_amount - campaign.disbursed_amount
    if amount > available:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient funds")
    
    # Update campaign
    campaign.disbursed_amount += amount
    await campaign.save()
    
    # Create transaction
    await campaign.fetch_link(Campaign.orphanage)
    transaction = Transaction(
        transaction_id=f"TXN{uuid.uuid4().hex[:12].upper()}",
        transaction_type=TransactionType.DISBURSEMENT,
        amount=amount,
        status=TransactionStatus.COMPLETED,
        campaign=campaign,
        orphanage=campaign.orphanage,
        disbursed_by=token_data.get("sub"),
        disbursement_method=disbursement_method,
        disbursement_reference=disbursement_reference,
        description=f"Fund disbursement for {campaign.title}"
    )
    await transaction.insert()
    
    # Send email notification
    try:
        await send_fund_disbursement_email(
            orphanage_email=campaign.orphanage.email,
            orphanage_name=campaign.orphanage.name,
            campaign_title=campaign.title,
            amount=amount
        )
    except Exception as e:
        print(f"Failed to send disbursement email: {str(e)}")
    
    return {
        "message": "Funds disbursed successfully",
        "transaction_id": transaction.transaction_id
    }


@router.get("/pending-verifications")
async def get_pending_verifications(token_data: Dict = Depends(get_current_user_token)):
    """Get all pending verifications"""
    await verify_admin(token_data)
    
    pending_orphanages = await Orphanage.find(
        Orphanage.status == OrphanageStatus.PENDING
    ).to_list()
    
    pending_campaigns = await Campaign.find(
        Campaign.status == CampaignStatus.PENDING_APPROVAL
    ).to_list()
    
    return {
        "orphanages": len(pending_orphanages),
        "campaigns": len(pending_campaigns)
    }


@router.get("/dashboard")
async def admin_dashboard(token_data: Dict = Depends(get_current_user_token)):
    """Get admin dashboard statistics"""
    await verify_admin(token_data)
    
    total_orphanages = await Orphanage.count()
    verified_orphanages = await Orphanage.find(
        Orphanage.status == OrphanageStatus.VERIFIED
    ).count()
    
    total_campaigns = await Campaign.count()
    active_campaigns = await Campaign.find(
        Campaign.status == CampaignStatus.ACTIVE
    ).count()
    
    # Calculate total donations
    from app.models.donation import Donation, DonationStatus
    completed_donations = await Donation.find(
        Donation.status == DonationStatus.COMPLETED
    ).to_list()
    total_donations = sum(d.amount for d in completed_donations)
    
    return {
        "total_orphanages": total_orphanages,
        "verified_orphanages": verified_orphanages,
        "total_campaigns": total_campaigns,
        "active_campaigns": active_campaigns,
        "total_donations": total_donations,
        "total_donors": len(set(str(d.donor.id) for d in completed_donations))
    }


@router.delete("/users")
async def delete_users(
    all: bool = True,
    role: Optional[UserRole] = None,
    keep_admin: bool = True,
    token_data: Dict = Depends(get_current_user_token)
):
    """Bulk delete users and their related data (admin only)

    Defaults to deleting ALL non-admin users and cascading orphanages/campaigns/donations/reports/transactions.
    Use with caution; recommended for development cleanup.
    """
    await verify_admin(token_data)

    # Build user filter
    from beanie.operators import In, Not
    user_query = {}
    if role:
        user_query["role"] = role
    elif all:
        if keep_admin:
            user_query["role"] = {"$ne": UserRole.ADMIN}

    users_to_delete = await User.find(user_query).to_list()
    if not users_to_delete:
        return {"deleted_users": 0, "deleted_orphanages": 0, "deleted_campaigns": 0, "deleted_donations": 0, "deleted_reports": 0, "deleted_transactions": 0}

    user_ids = [u.id for u in users_to_delete]

    # Cascade: Orphanages owned by these users
    from app.models.orphanage import Orphanage
    orphanages = await Orphanage.find(In(Orphanage.user.id, user_ids)).to_list()
    orphanage_ids = [o.id for o in orphanages]

    # Campaigns under these orphanages
    from app.models.campaign import Campaign
    campaigns = []
    if orphanage_ids:
        campaigns = await Campaign.find(In(Campaign.orphanage.id, orphanage_ids)).to_list()
    campaign_ids = [c.id for c in campaigns]

    # Delete donations for those campaigns
    from app.models.donation import Donation
    deleted_donations = 0
    if campaign_ids:
        res = await Donation.find(In(Donation.campaign.id, campaign_ids)).delete()
        deleted_donations = res.matched_count if hasattr(res, "matched_count") else 0

    # Delete reports for those orphanages
    from app.models.report import Report
    deleted_reports = 0
    if orphanage_ids:
        res = await Report.find(In(Report.orphanage.id, orphanage_ids)).delete()
        deleted_reports = res.matched_count if hasattr(res, "matched_count") else 0

    # Delete transactions for those orphanages or campaigns
    from app.models.transaction import Transaction
    deleted_transactions = 0
    if orphanage_ids:
        res = await Transaction.find(In(Transaction.orphanage.id, orphanage_ids)).delete()
        deleted_transactions += res.matched_count if hasattr(res, "matched_count") else 0
    if campaign_ids:
        res = await Transaction.find(In(Transaction.campaign.id, campaign_ids)).delete()
        deleted_transactions += res.matched_count if hasattr(res, "matched_count") else 0

    # Delete campaigns
    deleted_campaigns = 0
    if campaign_ids:
        res = await Campaign.find(In(Campaign.id, campaign_ids)).delete()
        deleted_campaigns = res.matched_count if hasattr(res, "matched_count") else 0

    # Delete orphanages
    deleted_orphanages = 0
    if orphanage_ids:
        res = await Orphanage.find(In(Orphanage.id, orphanage_ids)).delete()
        deleted_orphanages = res.matched_count if hasattr(res, "matched_count") else 0

    # Finally delete users
    res = await User.find(In(User.id, user_ids)).delete()
    deleted_users = res.matched_count if hasattr(res, "matched_count") else len(user_ids)

    return {
        "deleted_users": deleted_users,
        "deleted_orphanages": deleted_orphanages,
        "deleted_campaigns": deleted_campaigns,
        "deleted_donations": deleted_donations,
        "deleted_reports": deleted_reports,
        "deleted_transactions": deleted_transactions,
    }
