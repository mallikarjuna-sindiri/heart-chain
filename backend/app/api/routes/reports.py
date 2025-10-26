"""
Report Routes
Utilization reports submission and verification
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import Dict, List, Optional
from datetime import datetime

from app.models.report import Report, ReportStatus, ReportType
from app.models.campaign import Campaign
from app.models.orphanage import Orphanage
from app.core.security import get_current_user_token

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_report(
    campaign_id: str,
    title: str,
    description: str,
    report_type: ReportType,
    amount_utilized: float,
    beneficiaries_count: int,
    activities_conducted: List[str],
    reporting_period_start: datetime,
    reporting_period_end: datetime,
    token_data: Dict = Depends(get_current_user_token)
):
    """Submit utilization report (orphanage only)"""
    if token_data.get("role") != "orphanage":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Orphanage role required")
    
    campaign = await Campaign.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    
    await campaign.fetch_link(Campaign.orphanage)
    
    # Verify ownership
    from beanie import PydanticObjectId
    user_id = token_data.get("sub")
    if str(campaign.orphanage.user.id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    report = Report(
        title=title,
        description=description,
        report_type=report_type,
        campaign=campaign,
        orphanage=campaign.orphanage,
        amount_utilized=amount_utilized,
        beneficiaries_count=beneficiaries_count,
        activities_conducted=activities_conducted,
        reporting_period_start=reporting_period_start,
        reporting_period_end=reporting_period_end,
        status=ReportStatus.SUBMITTED
    )
    await report.insert()
    
    return {"id": str(report.id), "message": "Report submitted successfully"}


@router.get("/campaign/{campaign_id}")
async def get_campaign_reports(campaign_id: str):
    """Get reports for a campaign"""
    campaign = await Campaign.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    
    from beanie import PydanticObjectId
    reports = await Report.find(
        Report.campaign.id == PydanticObjectId(campaign_id)
    ).sort("-submitted_at").to_list()
    
    result = []
    for r in reports:
        result.append({
            "id": str(r.id),
            "title": r.title,
            "report_type": r.report_type,
            "amount_utilized": r.amount_utilized,
            "beneficiaries_count": r.beneficiaries_count,
            "status": r.status,
            "submitted_at": r.submitted_at.isoformat(),
            "verified_at": r.verified_at.isoformat() if r.verified_at else None
        })
    
    return result


@router.get("/{report_id}")
async def get_report(report_id: str):
    """Get report details"""
    report = await Report.get(report_id)
    
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    
    await report.fetch_link(Report.campaign)
    await report.fetch_link(Report.orphanage)
    
    return {
        "id": str(report.id),
        "title": report.title,
        "description": report.description,
        "report_type": report.report_type,
        "campaign": {
            "id": str(report.campaign.id),
            "title": report.campaign.title
        } if report.campaign else None,
        "orphanage": {
            "id": str(report.orphanage.id),
            "name": report.orphanage.name
        } if report.orphanage else None,
        "amount_utilized": report.amount_utilized,
        "beneficiaries_count": report.beneficiaries_count,
        "activities_conducted": report.activities_conducted,
        "images": report.images,
        "receipts": report.receipts,
        "status": report.status,
        "submitted_at": report.submitted_at.isoformat(),
        "verified_at": report.verified_at.isoformat() if report.verified_at else None,
        "verification_notes": report.verification_notes
    }


@router.post("/{report_id}/verify")
async def verify_report(
    report_id: str,
    status: ReportStatus,
    verification_notes: Optional[str] = None,
    rejection_reason: Optional[str] = None,
    token_data: Dict = Depends(get_current_user_token)
):
    """Verify report (admin only)"""
    if token_data.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    
    report.status = status
    report.verified_by = token_data.get("sub")
    report.verified_at = datetime.utcnow()
    report.verification_notes = verification_notes
    report.rejection_reason = rejection_reason
    
    await report.save()
    
    return {"message": "Report verified successfully"}


@router.get("/")
async def list_reports(
    status: Optional[ReportStatus] = None,
    token_data: Dict = Depends(get_current_user_token)
):
    """List reports (admin sees all, orphanage sees own)"""
    query = {}
    
    if status:
        query["status"] = status
    
    # If orphanage, filter by their orphanage
    if token_data.get("role") == "orphanage":
        from beanie import PydanticObjectId
        user_id = token_data.get("sub")
        orphanage = await Orphanage.find_one(Orphanage.user.id == PydanticObjectId(user_id))
        if orphanage:
            query["orphanage"] = orphanage.id
    
    reports = await Report.find(query).sort("-submitted_at").to_list()
    
    result = []
    for r in reports:
        result.append({
            "id": str(r.id),
            "title": r.title,
            "report_type": r.report_type,
            "amount_utilized": r.amount_utilized,
            "status": r.status,
            "submitted_at": r.submitted_at.isoformat()
        })
    
    return result


@router.get("/public/recent")
async def list_recent_public_reports(limit: int = 6):
    """Public: list recent verified reports to showcase activities/impact on donor dashboard"""
    reports = (
        await Report
        .find({"status": ReportStatus.VERIFIED})
        .sort("-submitted_at")
        .limit(limit)
        .to_list()
    )

    result = []
    for r in reports:
        try:
            await r.fetch_link(Report.campaign)
            await r.fetch_link(Report.orphanage)
        except Exception:
            pass
        result.append({
            "id": str(r.id),
            "title": r.title,
            "report_type": r.report_type,
            "amount_utilized": r.amount_utilized,
            "beneficiaries_count": r.beneficiaries_count,
            "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
            "orphanage": {
                "id": str(r.orphanage.id) if getattr(r, "orphanage", None) else None,
                "name": getattr(getattr(r, "orphanage", None), "name", None),
                "city": getattr(getattr(r, "orphanage", None), "city", None),
            },
            "campaign": {
                "id": str(r.campaign.id) if getattr(r, "campaign", None) else None,
                "title": getattr(getattr(r, "campaign", None), "title", None),
            },
        })
    return result
