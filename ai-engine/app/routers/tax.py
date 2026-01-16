"""
@file app/routers/tax.py
@brief Tax estimation and suggestions endpoints.

@description
Handles income tax estimation and optimization.
Supports both Old and New regimes for FY 2024-25.
"""

from fastapi import APIRouter, HTTPException
import logging

from app.models.schemas import (
    TaxEstimateRequest,
    TaxEstimateResponse,
    IncomeInput,
    DeductionInput,
)
from app.services.tax_service import estimate_tax, get_tax_suggestions

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/estimate", response_model=TaxEstimateResponse)
async def estimate_income_tax(request: TaxEstimateRequest) -> TaxEstimateResponse:
    """
    @brief Estimate income tax under both regimes.
    
    @param request TaxEstimateRequest with income and deductions
    @return TaxEstimateResponse with comparison and recommendation
    
    @details
    Calculates tax under:
    - Old Regime (with deductions: 80C, 80D, HRA, etc.)
    - New Regime (simplified slabs, limited deductions)
    
    Compares both and recommends the optimal regime.
    Also provides deduction optimization suggestions.
    
    FY 2024-25 highlights:
    - New regime has better slabs (up to 3L tax-free)
    - Standard deduction ₹75,000 in new regime
    - Section 87A rebate up to ₹25,000 in new regime
    
    @example
    POST /tax/estimate
    {
        "financial_year": "2024-25",
        "income": {
            "salary": 1200000,
            "rental": 0
        },
        "deductions": {
            "section_80c": 150000,
            "section_80d": 25000
        }
    }
    """
    try:
        logger.info(
            f"Estimating tax for FY {request.financial_year}"
        )
        
        response = estimate_tax(request)
        
        logger.info(
            f"Tax estimation complete: Old=₹{response.old_regime.total_tax:,.0f}, "
            f"New=₹{response.new_regime.total_tax:,.0f}, "
            f"Recommended={response.recommended_regime.value}"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Tax estimation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Tax estimation failed: {str(e)}"
        )


@router.post("/suggestions")
async def get_deduction_suggestions(
    income: IncomeInput,
    deductions: DeductionInput = None,
):
    """
    @brief Get tax-saving deduction suggestions.
    
    @param income Income breakdown
    @param deductions Current deductions (optional)
    @return List of suggestions with potential savings
    
    @details
    Analyzes current deductions and suggests:
    - Which sections have unutilized limits
    - Specific investment options for each section
    - Potential tax savings at marginal rate
    
    @example
    POST /tax/suggestions
    {
        "income": {"salary": 1200000},
        "deductions": {"section_80c": 100000}
    }
    
    Response suggests investing ₹50,000 more in 80C
    """
    try:
        suggestions = get_tax_suggestions(income, deductions)
        
        return {
            "suggestions": suggestions,
            "total_potential_savings": sum(s.get("potential_tax_savings", 0) for s in suggestions),
            "message": "Maximize these deductions to reduce tax liability",
        }
        
    except Exception as e:
        logger.error(f"Tax suggestions error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Tax suggestions failed: {str(e)}"
        )
