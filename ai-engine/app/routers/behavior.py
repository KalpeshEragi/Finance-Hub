"""
@file app/routers/behavior.py
@brief Spending behavior analysis endpoint.

@description
Handles spending behavior analysis requests.
Evaluates transactions against the 50-30-20 budgeting rule
and provides health scoring and recommendations.
"""

from fastapi import APIRouter, HTTPException
import logging

from app.models.schemas import (
    BehaviorAnalyzeRequest,
    BehaviorAnalyzeResponse,
)
from app.services.behavior_service import analyze_spending

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/analyze", response_model=BehaviorAnalyzeResponse)
async def analyze_behavior(request: BehaviorAnalyzeRequest) -> BehaviorAnalyzeResponse:
    """
    @brief Analyze spending behavior against 50-30-20 rule.
    
    @param request BehaviorAnalyzeRequest with income and transactions
    @return BehaviorAnalyzeResponse with comprehensive analysis
    
    @details
    Analysis includes:
    - Actual vs target budget breakdown
    - Rule violations detection
    - Health score (0-100)
    - Reallocation suggestions
    - Per-category spending breakdown
    
    The 50-30-20 rule:
    - 50% for Needs (essentials: rent, utilities, groceries)
    - 30% for Wants (discretionary: dining, entertainment)
    - 20% for Savings (investments, debt repayment)
    
    @example
    POST /behavior/analyze
    {
        "income": 100000,
        "transactions": [
            {"id": "1", "description": "Rent", "amount": 30000},
            {"id": "2", "description": "Netflix", "amount": 500}
        ]
    }
    """
    try:
        logger.info(
            f"Analyzing behavior: income=₹{request.income:,.0f}, "
            f"transactions={len(request.transactions)}"
        )
        
        response = analyze_spending(request)
        
        logger.info(
            f"Behavior analysis complete: health_score={response.health_score}, "
            f"violations={len(response.violations)}"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Behavior analysis error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Behavior analysis failed: {str(e)}"
        )
