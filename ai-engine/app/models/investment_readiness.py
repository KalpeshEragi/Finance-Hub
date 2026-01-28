"""
@file investment_readiness.py
@brief Pydantic schemas for Investment Readiness Gate.

@description
Defines input/output models for the Investment Readiness evaluation.
The Investment Agent uses these to receive ledger snapshot data and
return readiness assessment.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from enum import Enum


# =============================================================================
# ENUMS
# =============================================================================

class ReadinessStatus(str, Enum):
    """Investment readiness status."""
    READY = "READY"
    NOT_READY = "NOT_READY"
    CAUTION = "CAUTION"


class BlockerSeverity(str, Enum):
    """Severity level for readiness blockers."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# =============================================================================
# INPUT SCHEMAS (From Ledger Snapshot)
# =============================================================================

class CategoryBreakdownInput(BaseModel):
    """Expense category breakdown."""
    category: str
    amount: float
    percentage: float


class MonthlyTrendInput(BaseModel):
    """Monthly income/expense trend."""
    month: str
    year: int
    income: float
    expense: float
    netSavings: float


class DashboardMetrics(BaseModel):
    """Dashboard metrics from ledger snapshot."""
    totalIncome: float = 0
    totalExpense: float = 0
    netBalance: float = 0
    savingsRate: float = 0
    transactionCount: int = 0
    categoryBreakdown: List[CategoryBreakdownInput] = Field(default_factory=list)
    monthlyTrends: List[MonthlyTrendInput] = Field(default_factory=list)


class BudgetItemInput(BaseModel):
    """Individual budget item."""
    category: str
    limit: float
    spent: float
    percentage: float
    status: Literal["ok", "warning", "exceeded"]


class BudgetMetrics(BaseModel):
    """Budget metrics from ledger snapshot."""
    totalBudget: float = 0
    totalSpent: float = 0
    remaining: float = 0
    adherenceRate: float = 100  # Default to 100% if no budgets
    budgets: List[BudgetItemInput] = Field(default_factory=list)


class LoanItemInput(BaseModel):
    """Individual loan item."""
    name: str
    loanType: str
    outstanding: float
    emi: float
    interestRate: float
    status: str


class LoanMetrics(BaseModel):
    """Loan metrics from ledger snapshot."""
    totalLoans: int = 0
    activeLoans: int = 0
    totalOutstanding: float = 0
    totalMonthlyEMI: float = 0
    totalPrincipal: float = 0
    averageInterestRate: float = 0
    loans: List[LoanItemInput] = Field(default_factory=list)


class GoalItemInput(BaseModel):
    """Individual goal item."""
    name: str
    category: str = "General"
    targetAmount: float
    savedAmount: float
    progress: float
    deadline: Optional[str] = None
    status: str


class GoalMetrics(BaseModel):
    """Goal metrics from ledger snapshot."""
    totalGoals: int = 0
    activeGoals: int = 0
    completedGoals: int = 0
    totalTargetAmount: float = 0
    totalSavedAmount: float = 0
    overallProgress: float = 0
    goals: List[GoalItemInput] = Field(default_factory=list)


class RiskIndicatorsInput(BaseModel):
    """Risk indicators from ledger snapshot."""
    savingsRate: float = 0
    debtToIncomeRatio: float = 0  # Will be treated as EMI-to-Income
    budgetAdherence: float = 100
    goalProgress: float = 0
    emergencyFundCoverage: float = 0  # Months of expenses covered
    investmentReadiness: bool = False
    riskLevel: Literal["low", "moderate", "high"] = "moderate"


class LedgerSnapshotInput(BaseModel):
    """
    Complete ledger snapshot input from Node.js backend.
    This is the READ-ONLY contract from /ledger/snapshot.
    """
    dashboard: DashboardMetrics = Field(default_factory=DashboardMetrics)
    budget: BudgetMetrics = Field(default_factory=BudgetMetrics)
    loans: LoanMetrics = Field(default_factory=LoanMetrics)
    goals: GoalMetrics = Field(default_factory=GoalMetrics)
    riskIndicators: RiskIndicatorsInput = Field(default_factory=RiskIndicatorsInput)


# =============================================================================
# OUTPUT SCHEMAS
# =============================================================================

class ReadinessBlocker(BaseModel):
    """A specific blocker preventing investment readiness."""
    rule: str  # Rule ID (e.g., "R1", "R2")
    description: str
    current: float
    threshold: float
    severity: BlockerSeverity
    message: str


class InvestmentReadinessOutput(BaseModel):
    """
    Output of the Investment Readiness Gate evaluation.
    
    This controls all downstream investment decisions.
    """
    status: ReadinessStatus
    score: int = Field(ge=0, le=100, description="Readiness score 0-100")
    reasons: List[str] = Field(description="Human-readable explanation of status")
    blockers: List[ReadinessBlocker] = Field(
        default_factory=list,
        description="Specific issues blocking readiness"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Actionable suggestions to improve readiness"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "CAUTION",
                "score": 55,
                "reasons": [
                    "Emergency fund covers only 1.5 months (need 3+)",
                    "Savings rate at 16% (below 20% target)"
                ],
                "blockers": [
                    {
                        "rule": "R1",
                        "description": "Emergency Fund Coverage",
                        "current": 1.5,
                        "threshold": 3,
                        "severity": "high",
                        "message": "Build emergency fund to 3 months before investing"
                    }
                ],
                "recommendations": [
                    "Build emergency fund to 3 months of expenses before investing",
                    "Increase savings rate by reducing discretionary spending"
                ]
            }
        }
