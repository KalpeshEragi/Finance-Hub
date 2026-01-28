"""
@file investment_readiness.py
@brief API router for Investment Readiness Gate.

@description
Provides the /investment/readiness endpoint for evaluating
whether a user is ready to invest based on their ledger snapshot.
"""

from fastapi import APIRouter, HTTPException
from app.models.investment_readiness import (
    LedgerSnapshotInput,
    InvestmentReadinessOutput,
)
from app.services.investment_readiness_service import evaluate_investment_readiness

router = APIRouter(prefix="/investment", tags=["Investment Agent"])


@router.post(
    "/readiness",
    response_model=InvestmentReadinessOutput,
    summary="Evaluate Investment Readiness",
    description="""
    Evaluate whether a user is financially ready to invest.
    
    This is the Investment Readiness Gate - a decision layer that controls
    all downstream investment recommendations.
    
    **Input:** Complete ledger snapshot from /ledger/snapshot endpoint
    
    **Output:**
    - `status`: READY | CAUTION | NOT_READY
    - `score`: 0-100 readiness score
    - `reasons`: Human-readable explanations
    - `blockers`: Specific issues preventing readiness
    - `recommendations`: Actionable suggestions
    
    **Rules evaluated:**
    - R1: Emergency Fund Coverage (≥3 months)
    - R2: EMI-to-Income Ratio (<40%)
    - R3: High-Interest Debt (none >15% APR)
    - R4: Savings Rate (≥10%, target 20%)
    - R5: Budget Adherence (≥50%)
    - R6: Positive Net Balance
    - R7: Income Data Present
    - R8: Goal Progress (≥10% if active goals)
    """,
)
async def check_investment_readiness(
    snapshot: LedgerSnapshotInput,
) -> InvestmentReadinessOutput:
    """
    Check if user is ready to invest based on their financial snapshot.
    
    This endpoint receives the ledger snapshot from the Node.js backend
    and returns a comprehensive readiness assessment.
    """
    try:
        result = evaluate_investment_readiness(snapshot)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error evaluating investment readiness: {str(e)}"
        )


@router.get(
    "/readiness/rules",
    summary="Get Readiness Rules",
    description="Get the list of rules used for investment readiness evaluation.",
)
async def get_readiness_rules():
    """
    Return the rules and thresholds used for readiness evaluation.
    Useful for UI display and transparency.
    """
    return {
        "rules": [
            {
                "id": "R1",
                "name": "Emergency Fund Coverage",
                "description": "Must have at least 3 months of expenses saved",
                "threshold": 3,
                "unit": "months",
                "severity": "high",
            },
            {
                "id": "R2",
                "name": "EMI-to-Income Ratio",
                "description": "Monthly EMI should not exceed 40% of income",
                "threshold": 40,
                "unit": "percent",
                "severity": "high",
            },
            {
                "id": "R3",
                "name": "High-Interest Debt",
                "description": "No active debt above 15% APR (credit cards, personal loans)",
                "threshold": 15,
                "unit": "percent APR",
                "severity": "high",
            },
            {
                "id": "R4",
                "name": "Savings Rate",
                "description": "Should save at least 10% of income (target: 20%)",
                "threshold": 10,
                "unit": "percent",
                "severity": "medium",
            },
            {
                "id": "R5",
                "name": "Budget Adherence",
                "description": "At least 50% of budgets should be met",
                "threshold": 50,
                "unit": "percent",
                "severity": "medium",
            },
            {
                "id": "R6",
                "name": "Positive Net Balance",
                "description": "Income should exceed expenses",
                "threshold": 0,
                "unit": "currency",
                "severity": "high",
            },
            {
                "id": "R7",
                "name": "Income Data Present",
                "description": "Must have income transactions recorded for assessment",
                "threshold": 1,
                "unit": "transactions",
                "severity": "high",
            },
            {
                "id": "R8",
                "name": "Goal Progress",
                "description": "Active goals should have at least 10% progress",
                "threshold": 10,
                "unit": "percent",
                "severity": "low",
            },
        ],
        "scoring": {
            "base_score": 100,
            "ready_threshold": 70,
            "caution_threshold": 40,
        },
    }
