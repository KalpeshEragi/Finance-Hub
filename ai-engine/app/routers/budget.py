"""
@file app/routers/budget.py
@brief API Router for Budget Agent.

@description
Exposes endpoints for the Budget Agent to analyze spending
and provide recommendations.

@author HackVengers Team
@version 1.0.0
"""

from typing import List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.services import budget_agent_service
from app.models.schemas import TransactionInput

router = APIRouter()

class BudgetAnalysisRequest(BaseModel):
    transactions: List[TransactionInput]
    user_id: str

@router.post("/analyze", response_model=budget_agent_service.BudgetAnalysisResponse)
async def analyze_budget(request: BudgetAnalysisRequest):
    """
    @brief Analyze spending and get budget recommendations.
    
    @param request BudgetAnalysisRequest with list of transactions
    @return BudgetAnalysisResponse with savings advice
    """
    try:
        return budget_agent_service.analyze_spending(request.transactions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
