"""
@file app/routers/digital_twin.py
@brief Digital Financial Twin simulation endpoint.

@description
Handles Digital Twin simulation requests.
Projects financial future based on current state and scenarios.
"""

from fastapi import APIRouter, HTTPException
import logging

from app.models.schemas import (
    TwinSimulateRequest,
    TwinSimulateResponse,
    ScenarioType,
)
from app.services.digital_twin_service import simulate, compare_scenarios

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/simulate", response_model=TwinSimulateResponse)
async def run_simulation(request: TwinSimulateRequest) -> TwinSimulateResponse:
    """
    @brief Run Digital Twin financial simulation.
    
    @param request TwinSimulateRequest with current state and parameters
    @return TwinSimulateResponse with projections
    
    @details
    The Digital Twin simulates your financial future:
    - Month-by-month projections
    - Income growth and expense inflation
    - EMI payments and loan completion tracking
    - Savings accumulation with returns
    - Goal progress monitoring
    
    Available scenarios:
    - baseline: No changes to current behavior
    - increased_savings: 10% reduction in wants
    - aggressive_savings: 25% reduction in wants
    - job_loss: Zero income survival simulation
    - emi_prepayment: Impact of loan prepayment
    
    @example
    POST /twin/simulate
    {
        "current_state": {
            "savings": 500000,
            "debt": 1000000,
            "assets": 200000,
            "monthly_income": 100000,
            "monthly_expenses": {
                "needs": 35000,
                "wants": 20000,
                "emis": 25000,
                "savings": 20000
            }
        },
        "emis": [
            {"name": "Car Loan", "monthly_amount": 25000, "remaining_months": 24, "interest_rate": 9}
        ],
        "goals": [
            {"name": "House Down Payment", "target": 2000000, "current": 500000, "deadline": "2027-01-01", "priority": 1}
        ],
        "projection_months": 24,
        "scenario": "baseline"
    }
    """
    try:
        logger.info(
            f"Running simulation: scenario={request.scenario.value}, "
            f"months={request.projection_months}"
        )
        
        response = simulate(request)
        
        logger.info(
            f"Simulation complete: final_networth=₹{response.summary.final_networth:,.0f}, "
            f"networth_change=₹{response.summary.networth_change:,.0f}"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Simulation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Simulation failed: {str(e)}"
        )


@router.post("/compare")
async def compare_twin_scenarios(request: TwinSimulateRequest):
    """
    @brief Compare multiple scenarios side-by-side.
    
    @param request TwinSimulateRequest (scenario field is ignored)
    @return Comparison of baseline, increased_savings, aggressive_savings
    
    @details
    Automatically runs simulation for multiple scenarios:
    - baseline
    - increased_savings
    - aggressive_savings
    
    Returns comparison with recommendation for best outcome.
    
    @example
    POST /twin/compare
    (Same body as /simulate, scenario is ignored)
    
    Response:
    {
        "scenarios": {
            "baseline": {"final_networth": 1500000, ...},
            "increased_savings": {"final_networth": 1650000, ...},
            "aggressive_savings": {"final_networth": 1850000, ...}
        },
        "best_scenario": "aggressive_savings",
        "recommendation": "..."
    }
    """
    try:
        comparison = compare_scenarios(
            current_state=request.current_state,
            emis=request.emis,
            goals=request.goals,
            projection_months=request.projection_months,
        )
        
        return comparison
        
    except Exception as e:
        logger.error(f"Scenario comparison error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Scenario comparison failed: {str(e)}"
        )


@router.get("/scenarios")
async def list_scenarios():
    """
    @brief List available simulation scenarios.
    
    @return Dictionary of scenario names and descriptions
    """
    from app.services.digital_twin_service import get_scenario_descriptions
    
    return {
        "scenarios": get_scenario_descriptions(),
        "default": "baseline",
    }
