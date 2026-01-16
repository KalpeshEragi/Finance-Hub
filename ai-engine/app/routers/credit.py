"""
@file app/routers/credit.py
@brief Credit and loan analysis endpoint.

@description
Handles credit health analysis requests.
Evaluates loan portfolio, DTI ratios, and provides
prepayment recommendations.
"""

from fastapi import APIRouter, HTTPException
import logging

from app.models.schemas import (
    CreditAnalyzeRequest,
    CreditAnalyzeResponse,
)
from app.services.credit_service import analyze_credit

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/analyze", response_model=CreditAnalyzeResponse)
async def analyze_credit_health(request: CreditAnalyzeRequest) -> CreditAnalyzeResponse:
    """
    @brief Analyze credit/loan portfolio health.
    
    @param request CreditAnalyzeRequest with loans and income
    @return CreditAnalyzeResponse with comprehensive analysis
    
    @details
    Analysis includes:
    - Total outstanding debt
    - Debt-to-Income (DTI) ratio
    - EMI burden ratio
    - Payment discipline score
    - Per-loan analysis with risk factors
    - Prepayment recommendations
    - Credit risk alerts
    
    Key metrics:
    - DTI < 20%: Excellent
    - DTI 20-35%: Good
    - DTI 35-43%: Moderate
    - DTI > 43%: High risk
    
    @example
    POST /credit/analyze
    {
        "loans": [
            {
                "name": "Home Loan",
                "principal": 5000000,
                "outstanding": 4500000,
                "emi": 45000,
                "interest_rate": 8.5,
                "remaining_months": 180
            }
        ],
        "monthly_income": 150000
    }
    """
    try:
        logger.info(
            f"Analyzing credit: loans={len(request.loans)}, "
            f"income=₹{request.monthly_income:,.0f}"
        )
        
        response = analyze_credit(request)
        
        logger.info(
            f"Credit analysis complete: DTI={response.debt_to_income:.1f}%, "
            f"health_score={response.overall_credit_health}"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Credit analysis error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Credit analysis failed: {str(e)}"
        )
