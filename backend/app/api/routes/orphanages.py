"""
Orphanage Routes
Orphanage registration, profile management, and verification
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional
from beanie import PydanticObjectId

from app.models.orphanage import Orphanage, OrphanageStatus
from app.models.user import User
from app.schemas.orphanage import OrphanageCreate, OrphanageUpdate, OrphanageResponse
from app.core.security import get_current_user_token, require_role


router = APIRouter()


@router.post("/", response_model=OrphanageResponse, status_code=status.HTTP_201_CREATED)
async def register_orphanage(
    orphanage_data: OrphanageCreate,
    token_data: Dict = Depends(get_current_user_token)
):
    """
    Register a new orphanage (orphanage role only)
    
    Creates orphanage profile with pending verification status
    """
    # Check if user is orphanage role
    if token_data.get("role") != "orphanage":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only orphanage accounts can register orphanages"
        )
    
    user_id = token_data.get("sub")
    user = await User.get(user_id)
    
    # Check if user already has an orphanage
    existing = await Orphanage.find_one(Orphanage.user.id == PydanticObjectId(user_id))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a registered orphanage"
        )
    
    # Check if registration number is unique
    existing_reg = await Orphanage.find_one(
        Orphanage.registration_number == orphanage_data.registration_number
    )
    if existing_reg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration number already exists"
        )
    
    # Create orphanage
    orphanage = Orphanage(
        **orphanage_data.dict(),
        user=user,
        status=OrphanageStatus.PENDING
    )
    await orphanage.insert()
    
    return OrphanageResponse(
        id=str(orphanage.id),
        **orphanage.dict(exclude={"id", "user", "verified_by"}),
        created_at=orphanage.created_at.isoformat() if getattr(orphanage, "created_at", None) else None
    )


@router.get("/my", response_model=OrphanageResponse)
async def get_my_orphanage(token_data: Dict = Depends(get_current_user_token)):
    """Get current user's orphanage"""
    if token_data.get("role") != "orphanage":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only orphanage accounts can access this endpoint"
        )
    
    user_id = token_data.get("sub")
    orphanage = await Orphanage.find_one(Orphanage.user.id == PydanticObjectId(user_id))
    
    if not orphanage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orphanage not found"
        )
    
    return OrphanageResponse(
        id=str(orphanage.id),
        **orphanage.dict(exclude={"id", "user", "verified_by"}),
        created_at=orphanage.created_at.isoformat() if getattr(orphanage, "created_at", None) else None
    )

@router.get("/my/summary")
async def get_my_orphanage_summary(token_data: Dict = Depends(get_current_user_token)):
    """Summary for current orphanage: stats, projects, recent donations, and documents"""
    if token_data.get("role") != "orphanage":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only orphanage accounts can access this endpoint"
        )

    user_id = token_data.get("sub")
    orphanage = await Orphanage.find_one(Orphanage.user.id == PydanticObjectId(user_id))
    if not orphanage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orphanage not found")

    # Campaigns
    from app.models.campaign import Campaign
    campaigns = await Campaign.find(Campaign.orphanage.id == orphanage.id).to_list()

    # Reports
    from app.models.report import Report
    reports = await Report.find(Report.orphanage.id == orphanage.id).to_list()

    # Donations via Donation model filtered by campaigns
    from app.models.donation import Donation
    from beanie.operators import In
    campaign_ids = [c.id for c in campaigns]
    donations = []
    if campaign_ids:
        donations = await Donation.find(In(Donation.campaign.id, campaign_ids)).sort("-created_at").limit(5).to_list()

    # Compute stats
    total_raised = sum(c.raised_amount for c in campaigns)
    total_disbursed = sum(c.disbursed_amount for c in campaigns)
    available_balance = max(total_raised - total_disbursed, 0)

    avg_progress = 0
    active_with_target = [c for c in campaigns if c.target_amount > 0]
    if active_with_target:
        avg_progress = sum(min(c.raised_amount / c.target_amount * 100.0, 100.0) for c in active_with_target) / len(active_with_target)

    total_utilized = sum(r.amount_utilized for r in reports)
    unreported_funds = max(total_raised - total_utilized, 0)

    return {
        "orphanage": {
            "id": str(orphanage.id),
            "name": orphanage.name,
            "city": orphanage.city,
            "state": orphanage.state,
            "status": orphanage.status,
        },
        "stats": {
            "available_balance": available_balance,
            "average_progress": round(avg_progress, 2),
            "unreported_funds": unreported_funds,
        },
        "projects": [
            {
                "id": str(c.id),
                "title": c.title,
                "target_amount": c.target_amount,
                "raised_amount": c.raised_amount,
                "percent": min(c.raised_amount / c.target_amount * 100.0, 100.0) if c.target_amount else 0,
                "total_donors": c.total_donors,
                "status": c.status,
            }
            for c in campaigns
        ],
        "recent_donations": [
            {
                "id": str(d.id),
                "donor_name": d.donor_name if not d.is_anonymous else "Anonymous",
                "amount": d.amount,
                "created_at": d.created_at.isoformat() if getattr(d, "created_at", None) else None,
                "status": d.status,
            }
            for d in donations
        ],
        "documents": [
            {
                "id": str(r.id),
                "title": r.title,
                "status": r.status,
                "submitted_at": r.submitted_at.isoformat(),
            }
            for r in sorted(reports, key=lambda x: x.submitted_at, reverse=True)[:5]
        ],
    }


@router.get("/my/payouts")
async def get_my_payouts(token_data: Dict = Depends(get_current_user_token)):
    """List payout (disbursement) transactions for the current orphanage"""
    if token_data.get("role") != "orphanage":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only orphanage accounts can access this endpoint"
        )

    user_id = token_data.get("sub")
    orphanage = await Orphanage.find_one(Orphanage.user.id == PydanticObjectId(user_id))
    if not orphanage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orphanage not found")

    from app.models.transaction import Transaction, TransactionType
    payouts = await Transaction.find({
        "orphanage": orphanage.id,
        "transaction_type": TransactionType.DISBURSEMENT,
    }).sort("-transaction_date").to_list()

    return [
        {
            "id": str(t.id),
            "transaction_id": t.transaction_id,
            "amount": t.amount,
            "currency": t.currency,
            "status": t.status,
            "method": t.disbursement_method,
            "reference": t.disbursement_reference,
            "transaction_date": t.transaction_date.isoformat(),
        }
        for t in payouts
    ]


@router.get("/{orphanage_id}", response_model=OrphanageResponse)
async def get_orphanage(orphanage_id: str):
    """Get orphanage by ID (public)

    Note: Declared after '/my/*' routes to avoid path conflicts where '/my' could be treated as an ID.
    """
    orphanage = await Orphanage.get(orphanage_id)

    if not orphanage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orphanage not found"
        )

    return OrphanageResponse(
        id=str(orphanage.id),
        **orphanage.dict(exclude={"id", "user", "verified_by"}),
        created_at=orphanage.created_at.isoformat()
    )


@router.post("/upload-logo")
async def upload_logo(file: UploadFile = File(...), token_data: Dict = Depends(get_current_user_token)):
    """Upload orphanage logo image and return a public URL (orphanage/admin only)."""
    role = token_data.get("role")
    if role not in ("orphanage", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    import os
    from datetime import datetime
    uploads_dir = os.path.join(os.getcwd(), "uploads", "orphanages")
    os.makedirs(uploads_dir, exist_ok=True)

    # Build safe filename
    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    filename = f"logo_{ts}{ext}"
    filepath = os.path.join(uploads_dir, filename)

    # Save file
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)

    public_url = f"/uploads/orphanages/{filename}"
    return {"url": public_url}


# Note: Avoid strict response_model validation here to tolerate legacy/bad data during development
@router.get("/")
async def list_orphanages(
    status: Optional[OrphanageStatus] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0)
):
    """
    List orphanages with optional filters
    
    - **status**: Filter by verification status
    - **city**: Filter by city
    - **state**: Filter by state
    """
    query = {}
    
    if status:
        query["status"] = status
    if city:
        query["city"] = city
    if state:
        query["state"] = state
    
    # Always show latest first so newly registered appear at the top
    orphanages = (
        await Orphanage
        .find(query)
        .sort("-created_at")
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    
    results = []
    for o in orphanages:
        data = o.dict(exclude={"id", "user", "verified_by"})
        data["id"] = str(o.id)
        data["created_at"] = o.created_at.isoformat() if getattr(o, "created_at", None) else None
        # Ensure status is the raw enum value (e.g., 'pending', 'verified')
        try:
            enum_status = getattr(o, "status", None)
            data["status"] = enum_status.value if hasattr(enum_status, "value") else str(enum_status)
        except Exception:
            data["status"] = str(getattr(o, "status", ""))
        results.append(data)
    return results


@router.put("/{orphanage_id}", response_model=OrphanageResponse)
async def update_orphanage(
    orphanage_id: str,
    orphanage_data: OrphanageUpdate,
    token_data: Dict = Depends(get_current_user_token)
):
    """Update orphanage profile (owner only)"""
    if token_data.get("role") != "orphanage":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only orphanage accounts can update orphanages"
        )
    
    orphanage = await Orphanage.get(orphanage_id)
    
    if not orphanage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orphanage not found"
        )
    
    # Check ownership
    user_id = token_data.get("sub")
    if str(orphanage.user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this orphanage"
        )
    
    # Update fields
    update_data = orphanage_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(orphanage, field, value)
    
    from datetime import datetime
    orphanage.updated_at = datetime.utcnow()
    await orphanage.save()
    
    return OrphanageResponse(
        id=str(orphanage.id),
        **orphanage.dict(exclude={"id", "user", "verified_by"}),
        created_at=orphanage.created_at.isoformat() if getattr(orphanage, "created_at", None) else None
    )


@router.delete("/{orphanage_id}")
async def delete_orphanage(
    orphanage_id: str,
    token_data: Dict = Depends(get_current_user_token)
):
    """Delete orphanage (owner only)"""
    if token_data.get("role") != "orphanage":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only orphanage accounts can delete orphanages"
        )
    
    orphanage = await Orphanage.get(orphanage_id)
    
    if not orphanage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orphanage not found"
        )
    
    # Check ownership
    user_id = token_data.get("sub")
    if str(orphanage.user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this orphanage"
        )
    
    await orphanage.delete()
    
    return {"message": "Orphanage deleted successfully"}
