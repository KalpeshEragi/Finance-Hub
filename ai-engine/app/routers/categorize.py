"""
@file app/routers/categorize.py
@brief Transaction categorization endpoint.

@description
Handles transaction categorization requests.
Assigns categories and 50-30-20 buckets to transactions
based on keyword matching rules.
"""

from fastapi import APIRouter, HTTPException
import logging

from app.models.schemas import (
    CategorizeRequest,
    CategorizeResponse,
)
from app.services.categorization_service import categorize_bulk

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=CategorizeResponse)
async def categorize_transactions(request: CategorizeRequest) -> CategorizeResponse:
    """
    @brief Categorize multiple transactions.
    
    @param request CategorizeRequest with list of transactions
    @return CategorizeResponse with categorized transactions
    
    @details
    For each transaction:
    - Matches description/merchant against keyword rules
    - Assigns category (e.g., "Food & Dining", "Utilities")
    - Assigns 50-30-20 bucket (needs/wants/savings)
    - Provides confidence score
    
    @example
    POST /categorize
    {
        "transactions": [
            {"id": "1", "description": "Swiggy Order", "amount": 500},
            {"id": "2", "description": "Rent Payment", "amount": 25000}
        ]
    }
    
    Response:
    {
        "results": [
            {"id": "1", "category": "Food & Dining", "bucket": "wants", "confidence": 0.85},
            {"id": "2", "category": "Rent & Housing", "bucket": "needs", "confidence": 0.95}
        ],
        "total": 2,
        "categorized": 2,
        "uncategorized": 0
    }
    """
    try:
        logger.info(f"Categorizing {len(request.transactions)} transactions")
        
        result = categorize_bulk(request.transactions)
        
        logger.info(
            f"Categorization complete: {result['categorized']}/{result['total']} "
            f"successfully categorized"
        )
        
        return CategorizeResponse(
            results=result["results"],
            total=result["total"],
            categorized=result["categorized"],
            uncategorized=result["uncategorized"],
        )
        
    except Exception as e:
        logger.error(f"Categorization error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Categorization failed: {str(e)}"
        )
