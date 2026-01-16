"""
@file app/routers/alerts.py
@brief Alerts and compliance check endpoint.

@description
Handles financial alerts and deadline reminders.
Checks for tax deadlines, insurance renewals, and budget violations.
"""

from fastapi import APIRouter, HTTPException
import logging

from app.models.schemas import (
    AlertCheckRequest,
    AlertCheckResponse,
)
from app.services.alert_service import check_alerts, get_tax_calendar

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/check", response_model=AlertCheckResponse)
async def check_financial_alerts(request: AlertCheckRequest) -> AlertCheckResponse:
    """
    @brief Check all financial alerts and compliance items.
    
    @param request AlertCheckRequest with current date and financial state
    @return AlertCheckResponse with applicable alerts
    
    @details
    Checks for:
    - ITR filing deadline
    - Advance tax installments
    - Insurance policy renewals
    - Budget overspending
    
    Each alert includes:
    - Severity (high/medium/low/info)
    - Due date (if applicable)
    - Recommended action
    
    @example
    POST /alerts/check
    {
        "current_date": "2024-07-15",
        "financial_state": {
            "filing_status": {
                "itr_filed_current_fy": false,
                "last_itr_date": null
            },
            "advance_tax": {
                "paid_q1": 0,
                "estimated_liability": 100000
            },
            "insurance": [
                {"type": "health", "expiry": "2024-08-01", "premium": 25000}
            ],
            "budgets": [
                {"category": "Food & Dining", "limit": 15000, "spent": 18000}
            ]
        }
    }
    """
    try:
        logger.info(f"Checking alerts for date: {request.current_date}")
        
        response = check_alerts(request)
        
        logger.info(
            f"Alert check complete: total={response.total_alerts}, "
            f"high_priority={response.high_priority_count}"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Alert check error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Alert check failed: {str(e)}"
        )


@router.get("/calendar")
async def get_tax_calendar_endpoint(fy: str = None):
    """
    @brief Get tax calendar for a financial year.
    
    @param fy Financial year (e.g., "2024-25") or None for current
    @return List of important tax dates
    
    @example
    GET /alerts/calendar?fy=2024-25
    
    Response:
    [
        {"date": "2024-06-15", "event": "Advance Tax Q1", ...},
        {"date": "2024-09-15", "event": "Advance Tax Q2", ...},
        ...
    ]
    """
    try:
        calendar = get_tax_calendar(fy)
        
        return {
            "financial_year": fy or "current",
            "calendar": calendar,
        }
        
    except Exception as e:
        logger.error(f"Tax calendar error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Tax calendar failed: {str(e)}"
        )
