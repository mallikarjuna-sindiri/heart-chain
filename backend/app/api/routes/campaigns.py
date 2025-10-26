"""
Campaign Routes
Campaign creation, management, and browsing
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Dict, List, Optional
from beanie import PydanticObjectId
from datetime import datetime

from app.models.campaign import Campaign, CampaignStatus, CampaignCategory
from enum import Enum
from app.models.orphanage import Orphanage, OrphanageStatus
from app.core.security import get_current_user_token

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_campaign(
    title: str,
    description: str,
    category: CampaignCategory | str,
    target_amount: float,
    end_date: Optional[datetime] = None,
    token_data: Dict = Depends(get_current_user_token)
):
    """Create a new campaign (orphanage role only)"""
    if token_data.get("role") != "orphanage":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Orphanage role required")
    
    user_id = token_data.get("sub")
    orphanage = await Orphanage.find_one(Orphanage.user.id == PydanticObjectId(user_id))
    
    # Ensure orphanage exists and is verified (handle Enum safely)
    if not orphanage:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Orphanage must be verified")
    orphan_status = getattr(orphanage.status, "value", orphanage.status)
    if orphan_status != OrphanageStatus.VERIFIED.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Orphanage must be verified")
    
    # Normalize category if passed as a string
    try:
        if isinstance(category, str):
            category = CampaignCategory(category)
    except Exception:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid category")

    # Auto-activate campaigns created by a verified orphanage — orphanage itself is recorded as approver
    try:
        campaign = Campaign(
            title=title,
            description=description,
            category=category,  # type: ignore[arg-type]
            target_amount=target_amount,
            end_date=end_date,
            orphanage=orphanage,
            status=CampaignStatus.ACTIVE,
            approved_at=datetime.utcnow(),
            # Use current user id as approver to avoid dereferencing Link objects
            approved_by=str(user_id),
        )
        await campaign.insert()
        return {"id": str(campaign.id), "message": "Campaign created successfully"}
    except Exception as e:
        # Surface detailed error to client for debugging during development
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to create campaign: {str(e)}")


@router.get("/")
async def list_campaigns(
    status: Optional[CampaignStatus] = None,
    category: Optional[CampaignCategory] = None,
    orphanage_id: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0)
):
    """List campaigns with filters

    Optional orphanage_id filter enables showing campaigns on a specific orphanage's public profile.
    """
    # Build expression-based filters to avoid enum/link serialization pitfalls
    expr = None
    if status:
        cond = (Campaign.status == status)
        expr = cond if expr is None else (expr & cond)
    if category:
        cond = (Campaign.category == category)
        expr = cond if expr is None else (expr & cond)
    if orphanage_id:
        from beanie import PydanticObjectId
        cond = (Campaign.orphanage.id == PydanticObjectId(orphanage_id))
        expr = cond if expr is None else (expr & cond)

    campaigns = await Campaign.find(expr or {}).skip(skip).limit(limit).to_list()
    
    result = []
    for c in campaigns:
        await c.fetch_link(Campaign.orphanage)
        result.append({
            "id": str(c.id),
            "title": c.title,
            "description": c.description,
            "category": c.category.value if isinstance(c.category, Enum) else c.category,
            "target_amount": c.target_amount,
            "raised_amount": c.raised_amount,
            "status": c.status.value if isinstance(c.status, Enum) else c.status,
            "orphanage_name": c.orphanage.name if c.orphanage else None,
            "orphanage_id": str(c.orphanage.id) if c.orphanage else None,
            "created_at": c.created_at.isoformat()
        })
    
    return result


@router.get("/public/active")
async def list_public_active_campaigns(
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0)
):
    """Public: List active campaigns only (no auth required).

    Uses Beanie field comparisons to avoid enum serialization pitfalls and returns
    normalized primitive values to the client.
    """
    campaigns = (
        await Campaign
        .find(Campaign.status == CampaignStatus.ACTIVE)
        .skip(skip)
        .limit(limit)
        .to_list()
    )

    result = []
    for c in campaigns:
        await c.fetch_link(Campaign.orphanage)
        result.append({
            "id": str(c.id),
            "title": c.title,
            "description": c.description,
            "category": getattr(c.category, "value", c.category),
            "target_amount": c.target_amount,
            "raised_amount": c.raised_amount,
            "status": getattr(c.status, "value", c.status),
            "orphanage_name": c.orphanage.name if c.orphanage else None,
            "orphanage_id": str(c.orphanage.id) if c.orphanage else None,
            "created_at": c.created_at.isoformat(),
        })
    return result


@router.get("/my")
async def list_my_campaigns(token_data: Dict = Depends(get_current_user_token)):
    """List campaigns belonging to the current orphanage user"""
    if token_data.get("role") != "orphanage":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Orphanage role required")

    user_id = token_data.get("sub")
    orphanage = await Orphanage.find_one(Orphanage.user.id == PydanticObjectId(user_id))
    if not orphanage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orphanage not found")

    campaigns = await Campaign.find(Campaign.orphanage.id == orphanage.id).sort("-created_at").to_list()

    return [
        {
            "id": str(c.id),
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "target_amount": c.target_amount,
            "raised_amount": c.raised_amount,
            "disbursed_amount": c.disbursed_amount,
            "status": c.status,
            "total_donors": c.total_donors,
            "created_at": c.created_at.isoformat(),
        }
        for c in campaigns
    ]


@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str):
    """Get campaign details"""
    campaign = await Campaign.get(campaign_id)
    
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    
    await campaign.fetch_link(Campaign.orphanage)
    
    return {
        "id": str(campaign.id),
        "title": campaign.title,
        "description": campaign.description,
        "category": campaign.category,
        "target_amount": campaign.target_amount,
        "raised_amount": campaign.raised_amount,
        "disbursed_amount": campaign.disbursed_amount,
        "status": campaign.status,
        "start_date": campaign.start_date.isoformat(),
        "end_date": campaign.end_date.isoformat() if campaign.end_date else None,
        "orphanage": {
            "id": str(campaign.orphanage.id),
            "name": campaign.orphanage.name,
            "city": campaign.orphanage.city
        } if campaign.orphanage else None,
        "total_donors": campaign.total_donors,
        "created_at": campaign.created_at.isoformat()
    }


@router.put("/{campaign_id}")
async def update_campaign(
    campaign_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    target_amount: Optional[float] = None,
    token_data: Dict = Depends(get_current_user_token)
):
    """Update campaign (owner only)"""
    campaign = await Campaign.get(campaign_id)
    
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    
    await campaign.fetch_link(Campaign.orphanage)
    user_id = token_data.get("sub")
    # Fetch the current user's orphanage and compare IDs to avoid dereferencing nested Link objects
    owner_orphanage = await Orphanage.find_one(Orphanage.user.id == PydanticObjectId(user_id))
    if not owner_orphanage or str(campaign.orphanage.id) != str(owner_orphanage.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    if title:
        campaign.title = title
    if description:
        campaign.description = description
    if target_amount:
        campaign.target_amount = target_amount
    
    campaign.updated_at = datetime.utcnow()
    await campaign.save()
    
    return {"message": "Campaign updated successfully"}


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    token_data: Dict = Depends(get_current_user_token)
):
    """Delete campaign (owner only)"""
    campaign = await Campaign.get(campaign_id)
    
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    
    await campaign.fetch_link(Campaign.orphanage)
    user_id = token_data.get("sub")
    # Compare orphanage ownership without accessing nested Link fields
    owner_orphanage = await Orphanage.find_one(Orphanage.user.id == PydanticObjectId(user_id))
    if (not owner_orphanage or str(campaign.orphanage.id) != str(owner_orphanage.id)) and token_data.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    await campaign.delete()
    
    return {"message": "Campaign deleted successfully"}
