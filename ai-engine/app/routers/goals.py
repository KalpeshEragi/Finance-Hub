"""
@file app/routers/goals.py
@brief Goal planning endpoint.

@description
Handles financial goal planning and analysis.
Provides feasibility assessment and allocation recommendations.
"""

from fastapi import APIRouter, HTTPException
import logging

from app.models.schemas import (
    GoalPlanRequest,
    GoalPlanResponse,
)
from app.services.goal_service import plan_goals

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/plan", response_model=GoalPlanResponse)
async def plan_financial_goals(request: GoalPlanRequest) -> GoalPlanResponse:
    """
    @brief Create goal plan with feasibility analysis.
    
    @param request GoalPlanRequest with goals and financial details
    @return GoalPlanResponse with analysis and recommendations
    
    @details
    For each goal, calculates:
    - Required monthly savings (SIP)
    - Whether goal is achievable with current allocation
    - Projected completion date
    - Months delayed if not achievable
    
    Also provides:
    - Priority-based allocation strategy
    - Shortfall analysis
    - Actionable recommendations
    
    @example
    POST /goals/plan
    {
        "goals": [
            {
                "name": "New Car",
                "target": 800000,
                "current": 100000,
                "deadline": "2026-01-01",
                "priority": 2
            },
            {
                "name": "Emergency Fund",
                "target": 300000,
                "current": 50000,
                "deadline": "2025-06-01",
                "priority": 1
            }
        ],
        "monthly_income": 100000,
        "current_savings_rate": 20000,
        "available_for_goals": 15000
    }
    """
    try:
        logger.info(
            f"Planning goals: count={len(request.goals)}, "
            f"available=₹{request.available_for_goals:,.0f}"
        )
        
        response = plan_goals(request)
        
        logger.info(
            f"Goal planning complete: all_achievable={response.all_achievable}, "
            f"shortfall=₹{response.shortfall:,.0f}"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Goal planning error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Goal planning failed: {str(e)}"
        )
