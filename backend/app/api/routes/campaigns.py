"""
Campaign Routes
Campaign creation, management, and browsing
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Dict, List, Optional
from beanie import PydanticObjectId
from datetime import datetime

from app.models.campaign import Campaign, CampaignStatus, CampaignCategory
from app.models.orphanage import Orphanage
from app.core.security import get_current_user_token

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_campaign(
    title: str,
    description: str,
    category: CampaignCategory,
    target_amount: float,
    end_date: Optional[datetime] = None,
    token_data: Dict = Depends(get_current_user_token)
):
    """Create a new campaign (orphanage role only)"""
    if token_data.get("role") != "orphanage":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Orphanage role required")
    
    user_id = token_data.get("sub")
    orphanage = await Orphanage.find_one(Orphanage.user.id == PydanticObjectId(user_id))
    
    if not orphanage or orphanage.status != "verified":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Orphanage must be verified")
    
    campaign = Campaign(
        title=title,
        description=description,
        category=category,
        target_amount=target_amount,
        end_date=end_date,
        orphanage=orphanage,
        status=CampaignStatus.PENDING_APPROVAL
    )
    await campaign.insert()
    
    return {"id": str(campaign.id), "message": "Campaign created successfully"}


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
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if orphanage_id:
        from beanie import PydanticObjectId
        query["orphanage"] = PydanticObjectId(orphanage_id)
    
    campaigns = await Campaign.find(query).skip(skip).limit(limit).to_list()
    
    result = []
    for c in campaigns:
        await c.fetch_link(Campaign.orphanage)
        result.append({
            "id": str(c.id),
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "target_amount": c.target_amount,
            "raised_amount": c.raised_amount,
            "status": c.status,
            "orphanage_name": c.orphanage.name if c.orphanage else None,
            "created_at": c.created_at.isoformat()
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
    
    if str(campaign.orphanage.user.id) != user_id:
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
    
    if str(campaign.orphanage.user.id) != user_id and token_data.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    await campaign.delete()
    
    return {"message": "Campaign deleted successfully"}
