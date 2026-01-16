"""
@file app/models/schemas.py
@brief Pydantic schemas for all API request/response models.

@description
This module contains all the data models used across the AI Engine.
Schemas are organized by feature domain and follow consistent patterns:
- Request models end with 'Request'
- Response models end with 'Response'
- Nested/reusable models have descriptive names

All models use Pydantic v2 for validation and serialization.

@note
All monetary amounts are in INR (Indian Rupees).
All percentages are expressed as 0-100 (not 0-1).
"""

from typing import List, Optional, Dict, Any, Literal
from datetime import date as Date, datetime as DateTime
from pydantic import BaseModel, Field, field_validator
from enum import Enum


# =============================================================================
# ENUMERATIONS
# =============================================================================

class BucketType(str, Enum):
    """
    @enum BucketType
    @brief 50-30-20 budget bucket classification.
    """
    NEEDS = "needs"
    WANTS = "wants"
    SAVINGS = "savings"


class TaxRegime(str, Enum):
    """
    @enum TaxRegime
    @brief Indian income tax regime options.
    """
    OLD = "old"
    NEW = "new"


class AlertSeverity(str, Enum):
    """
    @enum AlertSeverity
    @brief Alert importance levels.
    """
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ScenarioType(str, Enum):
    """
    @enum ScenarioType
    @brief Digital Twin simulation scenarios.
    """
    BASELINE = "baseline"
    INCREASED_SAVINGS = "increased_savings"
    AGGRESSIVE_SAVINGS = "aggressive_savings"
    JOB_LOSS = "job_loss"
    EMI_PREPAYMENT = "emi_prepayment"


# =============================================================================
# COMMON / SHARED MODELS
# =============================================================================

class HealthResponse(BaseModel):
    """
    @class HealthResponse
    @brief Health check endpoint response.
    """
    status: str = Field(default="ok", description="Service status")
    version: str = Field(description="API version")
    timestamp: DateTime = Field(default_factory=DateTime.now)


# =============================================================================
# TRANSACTION MODELS
# =============================================================================

class TransactionInput(BaseModel):
    """
    @class TransactionInput
    @brief Single transaction for categorization.
    
    @field id Unique transaction identifier from backend.
    @field description Transaction description/narration.
    @field merchant Optional merchant name.
    @field amount Transaction amount in INR.
    @field date Optional transaction date.
    @field category Optional pre-assigned category.
    """
    id: str = Field(description="Unique transaction ID")
    description: str = Field(description="Transaction description")
    merchant: Optional[str] = Field(default=None, description="Merchant name")
    amount: float = Field(gt=0, description="Amount in INR")
    date: Optional[Date] = Field(default=None, description="Transaction date")
    category: Optional[str] = Field(default=None, description="Pre-assigned category")


class CategorizedTransaction(BaseModel):
    """
    @class CategorizedTransaction
    @brief Transaction with assigned category and bucket.
    """
    id: str = Field(description="Transaction ID")
    category: str = Field(description="Assigned category")
    bucket: BucketType = Field(description="50-30-20 bucket (needs/wants/savings)")
    confidence: float = Field(ge=0, le=1, description="Categorization confidence 0-1")
    matched_keyword: Optional[str] = Field(default=None, description="Keyword that matched")


class CategorizeRequest(BaseModel):
    """
    @class CategorizeRequest
    @brief Request to categorize multiple transactions.
    """
    transactions: List[TransactionInput] = Field(
        min_length=1, 
        max_length=1000,
        description="List of transactions to categorize"
    )


class CategorizeResponse(BaseModel):
    """
    @class CategorizeResponse
    @brief Response containing categorized transactions.
    """
    results: List[CategorizedTransaction] = Field(description="Categorized transactions")
    total: int = Field(description="Total transactions processed")
    categorized: int = Field(description="Successfully categorized count")
    uncategorized: int = Field(description="Uncategorized count (low confidence)")


# =============================================================================
# BEHAVIOR ANALYSIS MODELS
# =============================================================================

class BudgetBreakdown(BaseModel):
    """
    @class BudgetBreakdown
    @brief 50-30-20 budget breakdown percentages.
    """
    needs: float = Field(ge=0, description="Needs percentage")
    wants: float = Field(ge=0, description="Wants percentage")
    savings: float = Field(ge=0, description="Savings percentage")


class BudgetViolation(BaseModel):
    """
    @class BudgetViolation
    @brief Details of a 50-30-20 rule violation.
    """
    type: Literal["needs_exceeded", "wants_exceeded", "savings_deficit"] = Field(
        description="Type of violation"
    )
    actual: float = Field(description="Actual percentage")
    limit: float = Field(description="Allowed limit")
    excess_or_shortfall: float = Field(description="Amount over/under limit in INR")
    message: str = Field(description="Human-readable explanation")


class ReallocationSuggestion(BaseModel):
    """
    @class ReallocationSuggestion
    @brief Suggestion for budget reallocation.
    """
    action: str = Field(description="Suggested action ID")
    recommendation: str = Field(description="Human-readable recommendation")
    potential_savings: float = Field(description="Potential monthly savings in INR")
    impact_description: str = Field(description="Impact on budget health")


class CategorySpending(BaseModel):
    """
    @class CategorySpending
    @brief Spending aggregated by category.
    """
    category: str = Field(description="Category name")
    bucket: BucketType = Field(description="50-30-20 bucket")
    amount: float = Field(description="Total spent in INR")
    percent: float = Field(description="Percentage of total spending")
    transaction_count: int = Field(description="Number of transactions")


class BehaviorAnalyzeRequest(BaseModel):
    """
    @class BehaviorAnalyzeRequest
    @brief Request for spending behavior analysis.
    """
    income: float = Field(gt=0, description="Monthly income in INR")
    transactions: List[TransactionInput] = Field(
        min_length=1,
        description="Transactions for the analysis period"
    )
    period_start: Optional[Date] = Field(default=None, description="Period start date")
    period_end: Optional[Date] = Field(default=None, description="Period end date")


class BehaviorAnalyzeResponse(BaseModel):
    """
    @class BehaviorAnalyzeResponse
    @brief Response with comprehensive spending analysis.
    """
    budget_analysis: Dict[str, Any] = Field(description="50-30-20 compliance analysis")
    actual: BudgetBreakdown = Field(description="Actual spending breakdown")
    target: BudgetBreakdown = Field(description="Target 50-30-20 breakdown")
    violations: List[BudgetViolation] = Field(description="Rule violations detected")
    suggestions: List[ReallocationSuggestion] = Field(description="Improvement suggestions")
    health_score: int = Field(ge=0, le=100, description="Budget health score 0-100")
    category_breakdown: List[CategorySpending] = Field(description="Per-category spending")
    total_spending: float = Field(description="Total spending in INR")
    savings_rate: float = Field(description="Actual savings rate percentage")


# =============================================================================
# CREDIT ANALYSIS MODELS
# =============================================================================

class LoanInput(BaseModel):
    """
    @class LoanInput
    @brief Loan/EMI details for analysis.
    """
    name: str = Field(description="Loan name (e.g., 'Home Loan')")
    principal: float = Field(gt=0, description="Original principal amount")
    outstanding: float = Field(ge=0, description="Current outstanding amount")
    emi: float = Field(gt=0, description="Monthly EMI amount")
    interest_rate: float = Field(ge=0, le=50, description="Annual interest rate %")
    remaining_months: int = Field(gt=0, description="Remaining tenure in months")
    start_date: Optional[Date] = Field(default=None, description="Loan start date")


class PaymentHistory(BaseModel):
    """
    @class PaymentHistory
    @brief Single EMI payment record.
    """
    loan: str = Field(description="Loan name")
    month: str = Field(description="Payment month (YYYY-MM)")
    status: Literal["paid", "missed", "partial"] = Field(description="Payment status")
    days_late: int = Field(ge=0, default=0, description="Days late if applicable")


class PrepaymentAnalysis(BaseModel):
    """
    @class PrepaymentAnalysis
    @brief Analysis of prepayment benefits.
    """
    loan_name: str = Field(description="Loan name")
    prepay_amount: float = Field(description="Prepayment amount considered")
    interest_saved: float = Field(description="Interest saved over remaining tenure")
    tenure_reduced_months: int = Field(description="Months reduced from tenure")
    new_remaining_months: int = Field(description="New remaining months after prepayment")


class CreditAnalyzeRequest(BaseModel):
    """
    @class CreditAnalyzeRequest
    @brief Request for credit/loan analysis.
    """
    loans: List[LoanInput] = Field(min_length=1, description="List of active loans")
    monthly_income: float = Field(gt=0, description="Monthly income in INR")
    payment_history: Optional[List[PaymentHistory]] = Field(
        default=None, 
        description="Recent payment history"
    )


class CreditAnalyzeResponse(BaseModel):
    """
    @class CreditAnalyzeResponse
    @brief Comprehensive credit health analysis.
    """
    total_outstanding: float = Field(description="Total outstanding debt")
    total_emi: float = Field(description="Total monthly EMI")
    debt_to_income: float = Field(description="DTI ratio percentage")
    emi_burden_ratio: float = Field(description="EMI to income ratio %")
    payment_discipline_score: int = Field(ge=0, le=100, description="Payment discipline 0-100")
    overall_credit_health: int = Field(ge=0, le=100, description="Overall score 0-100")
    loan_analysis: List[Dict[str, Any]] = Field(description="Per-loan analysis")
    prepayment_recommendations: List[PrepaymentAnalysis] = Field(
        description="Prepayment suggestions"
    )
    alerts: List[Dict[str, Any]] = Field(description="Credit risk alerts")


# =============================================================================
# TAX MODELS
# =============================================================================

class IncomeInput(BaseModel):
    """
    @class IncomeInput
    @brief Income breakdown by source.
    """
    salary: float = Field(ge=0, default=0, description="Salary income")
    rental: float = Field(ge=0, default=0, description="Rental income")
    business: float = Field(ge=0, default=0, description="Business/profession income")
    capital_gains_short: float = Field(ge=0, default=0, description="Short-term capital gains")
    capital_gains_long: float = Field(ge=0, default=0, description="Long-term capital gains")
    other: float = Field(ge=0, default=0, description="Other sources")


class DeductionInput(BaseModel):
    """
    @class DeductionInput
    @brief Tax deductions claimed.
    """
    section_80c: float = Field(ge=0, default=0, le=150000, description="80C investments")
    section_80d: float = Field(ge=0, default=0, le=100000, description="80D health insurance")
    section_80g: float = Field(ge=0, default=0, description="80G donations")
    section_80e: float = Field(ge=0, default=0, description="80E education loan interest")
    section_80ccd_1b: float = Field(ge=0, default=0, le=50000, description="80CCD(1B) NPS")
    home_loan_interest: float = Field(ge=0, default=0, le=200000, description="Home loan interest")
    hra: float = Field(ge=0, default=0, description="HRA exemption")
    lta: float = Field(ge=0, default=0, description="LTA exemption")


class TaxSlabBreakdown(BaseModel):
    """
    @class TaxSlabBreakdown
    @brief Tax calculated per slab.
    """
    slab: str = Field(description="Slab range description")
    income_in_slab: float = Field(description="Income falling in this slab")
    rate: float = Field(description="Tax rate %")
    tax: float = Field(description="Tax for this slab")


class TaxEstimateResult(BaseModel):
    """
    @class TaxEstimateResult
    @brief Tax estimation for a single regime.
    """
    regime: TaxRegime = Field(description="Tax regime")
    gross_total_income: float = Field(description="GTI before deductions")
    total_deductions: float = Field(description="Total deductions claimed")
    taxable_income: float = Field(description="Income after deductions")
    tax_before_cess: float = Field(description="Tax before cess")
    cess: float = Field(description="4% health & education cess")
    total_tax: float = Field(description="Final tax liability")
    effective_rate: float = Field(description="Effective tax rate %")
    slab_breakdown: List[TaxSlabBreakdown] = Field(description="Slab-wise breakdown")


class DeductionSuggestion(BaseModel):
    """
    @class DeductionSuggestion
    @brief Tax-saving deduction suggestion.
    """
    section: str = Field(description="Section number (e.g., '80C')")
    current: float = Field(description="Currently claimed amount")
    limit: float = Field(description="Maximum limit")
    gap: float = Field(description="Unclaimed room")
    options: List[str] = Field(description="Investment options")
    potential_tax_savings: float = Field(description="Tax savings at max bracket")


class TaxEstimateRequest(BaseModel):
    """
    @class TaxEstimateRequest
    @brief Request for tax estimation.
    """
    financial_year: str = Field(
        default="2024-25", 
        pattern=r"^\d{4}-\d{2}$",
        description="Financial year (e.g., '2024-25')"
    )
    income: IncomeInput = Field(description="Income breakdown")
    deductions: Optional[DeductionInput] = Field(
        default=None, 
        description="Deductions claimed"
    )


class TaxEstimateResponse(BaseModel):
    """
    @class TaxEstimateResponse
    @brief Complete tax estimation with regime comparison.
    """
    old_regime: TaxEstimateResult = Field(description="Old regime calculation")
    new_regime: TaxEstimateResult = Field(description="New regime calculation")
    recommended_regime: TaxRegime = Field(description="Recommended regime")
    savings_with_recommended: float = Field(description="Savings vs other regime")
    explanation: str = Field(description="Why this regime is recommended")
    deduction_suggestions: List[DeductionSuggestion] = Field(
        description="Tax-saving suggestions"
    )


# =============================================================================
# GOAL PLANNING MODELS
# =============================================================================

class GoalInput(BaseModel):
    """
    @class GoalInput
    @brief Single financial goal.
    """
    name: str = Field(description="Goal name")
    target: float = Field(gt=0, description="Target amount in INR")
    current: float = Field(ge=0, default=0, description="Current progress")
    deadline: Date = Field(description="Target completion date")
    priority: int = Field(ge=1, le=10, default=5, description="Priority 1-10 (1=highest)")


class GoalAnalysis(BaseModel):
    """
    @class GoalAnalysis
    @brief Analysis of a single goal's feasibility.
    """
    name: str = Field(description="Goal name")
    target: float = Field(description="Target amount")
    current: float = Field(description="Current progress")
    remaining: float = Field(description="Amount still needed")
    deadline: Date = Field(description="Target deadline")
    months_remaining: int = Field(description="Months until deadline")
    required_monthly: float = Field(description="Required monthly savings")
    suggested_allocation: float = Field(description="Suggested allocation from budget")
    achievable: bool = Field(description="Is goal achievable with current allocation")
    projected_completion: Optional[Date] = Field(description="Projected completion date")
    months_delayed: int = Field(default=0, description="Months delayed if not achievable")


class GoalPlanRequest(BaseModel):
    """
    @class GoalPlanRequest
    @brief Request for goal planning analysis.
    """
    goals: List[GoalInput] = Field(min_length=1, description="Financial goals")
    monthly_income: float = Field(gt=0, description="Monthly income")
    current_savings_rate: float = Field(ge=0, description="Current monthly savings")
    available_for_goals: float = Field(ge=0, description="Amount available for goals")


class GoalPlanResponse(BaseModel):
    """
    @class GoalPlanResponse
    @brief Complete goal planning analysis.
    """
    analysis: List[GoalAnalysis] = Field(description="Per-goal analysis")
    total_required_monthly: float = Field(description="Total monthly savings needed")
    available_monthly: float = Field(description="Available monthly amount")
    shortfall: float = Field(description="Monthly shortfall if any")
    all_achievable: bool = Field(description="All goals achievable with current plan")
    recommendations: List[Dict[str, Any]] = Field(description="Recommendations")


# =============================================================================
# DIGITAL TWIN MODELS
# =============================================================================

class MonthlyExpenses(BaseModel):
    """
    @class MonthlyExpenses
    @brief Monthly expense breakdown.
    """
    needs: float = Field(ge=0, description="Needs spending")
    wants: float = Field(ge=0, description="Wants spending")
    emis: float = Field(ge=0, default=0, description="EMI payments")
    savings: float = Field(ge=0, default=0, description="Savings/investments")


class EMIInput(BaseModel):
    """
    @class EMIInput
    @brief EMI details for simulation.
    """
    name: str = Field(description="Loan name")
    monthly_amount: float = Field(gt=0, description="Monthly EMI")
    remaining_months: int = Field(gt=0, description="Remaining months")
    interest_rate: float = Field(ge=0, description="Annual interest rate %")


class TwinCurrentState(BaseModel):
    """
    @class TwinCurrentState
    @brief Current financial state for simulation.
    """
    savings: float = Field(ge=0, description="Current savings balance")
    debt: float = Field(ge=0, default=0, description="Total outstanding debt")
    assets: float = Field(ge=0, default=0, description="Liquid assets value")
    monthly_income: float = Field(gt=0, description="Monthly income")
    monthly_expenses: MonthlyExpenses = Field(description="Monthly expense breakdown")


class SimulationAssumptions(BaseModel):
    """
    @class SimulationAssumptions
    @brief Assumptions for future projection.
    """
    income_growth_rate: float = Field(ge=0, le=0.5, default=0.08, description="Annual income growth")
    inflation_rate: float = Field(ge=0, le=0.3, default=0.06, description="Annual inflation")
    savings_return_rate: float = Field(ge=0, le=0.3, default=0.07, description="Annual return on savings")


class MonthlySnapshot(BaseModel):
    """
    @class MonthlySnapshot
    @brief Financial state at a single month in projection.
    """
    month: int = Field(description="Month number from start")
    date: str = Field(description="Month as YYYY-MM")
    income: float = Field(description="Projected income")
    expenses: Dict[str, float] = Field(description="Expense breakdown")
    savings_flow: float = Field(description="Net savings for month")
    cumulative_savings: float = Field(description="Total savings balance")
    debt_remaining: float = Field(description="Remaining debt")
    networth: float = Field(description="Net worth (assets - debt)")
    goal_progress: List[Dict[str, Any]] = Field(description="Goal progress status")


class ProjectionSummary(BaseModel):
    """
    @class ProjectionSummary
    @brief Summary of multi-month projection.
    """
    initial_networth: float = Field(description="Starting net worth")
    final_networth: float = Field(description="Ending net worth")
    networth_change: float = Field(description="Change in net worth")
    total_savings_added: float = Field(description="Total savings added")
    total_debt_reduced: float = Field(description="Total debt paid down")
    final_savings: float = Field(description="Final savings balance")
    final_debt: float = Field(description="Final debt balance")
    goals_achieved: List[str] = Field(description="Goals completed in period")
    goals_at_risk: List[Dict[str, Any]] = Field(description="Goals unlikely to be met")


class TwinSimulateRequest(BaseModel):
    """
    @class TwinSimulateRequest
    @brief Request for Digital Twin simulation.
    """
    current_state: TwinCurrentState = Field(description="Current financial state")
    emis: List[EMIInput] = Field(default=[], description="Active EMIs")
    goals: List[GoalInput] = Field(default=[], description="Financial goals")
    projection_months: int = Field(
        ge=1, 
        le=120, 
        default=12,
        description="Months to project (max 10 years)"
    )
    scenario: ScenarioType = Field(
        default=ScenarioType.BASELINE,
        description="Simulation scenario"
    )
    assumptions: Optional[SimulationAssumptions] = Field(
        default=None,
        description="Custom assumptions"
    )


class TwinSimulateResponse(BaseModel):
    """
    @class TwinSimulateResponse
    @brief Complete Digital Twin simulation results.
    """
    scenario: ScenarioType = Field(description="Scenario simulated")
    projection_months: int = Field(description="Months projected")
    monthly_snapshots: List[MonthlySnapshot] = Field(description="Month-by-month projection")
    summary: ProjectionSummary = Field(description="Projection summary")
    recommendations: List[Dict[str, Any]] = Field(description="Action recommendations")


# =============================================================================
# ALERT MODELS
# =============================================================================

class InsuranceInfo(BaseModel):
    """
    @class InsuranceInfo
    @brief Insurance policy information.
    """
    type: str = Field(description="Insurance type (health, term, etc)")
    expiry: Date = Field(description="Policy expiry date")
    premium: float = Field(ge=0, description="Annual premium")


class FilingStatus(BaseModel):
    """
    @class FilingStatus
    @brief ITR filing status.
    """
    itr_filed_current_fy: bool = Field(default=False, description="ITR filed this FY")
    last_itr_date: Optional[Date] = Field(default=None, description="Last ITR filing date")


class AdvanceTaxStatus(BaseModel):
    """
    @class AdvanceTaxStatus
    @brief Advance tax payment status.
    """
    paid_q1: float = Field(ge=0, default=0, description="Q1 (Jun 15) payment")
    paid_q2: float = Field(ge=0, default=0, description="Q2 (Sep 15) payment")
    paid_q3: float = Field(ge=0, default=0, description="Q3 (Dec 15) payment")
    paid_q4: float = Field(ge=0, default=0, description="Q4 (Mar 15) payment")
    estimated_liability: float = Field(ge=0, default=0, description="Estimated annual tax")


class BudgetStatus(BaseModel):
    """
    @class BudgetStatus
    @brief Budget usage status.
    """
    category: str = Field(description="Category name")
    limit: float = Field(description="Budget limit")
    spent: float = Field(description="Amount spent")


class FinancialState(BaseModel):
    """
    @class FinancialState
    @brief Financial state for alert generation.
    """
    filing_status: Optional[FilingStatus] = Field(default=None)
    advance_tax: Optional[AdvanceTaxStatus] = Field(default=None)
    insurance: Optional[List[InsuranceInfo]] = Field(default=None)
    budgets: Optional[List[BudgetStatus]] = Field(default=None)


class Alert(BaseModel):
    """
    @class Alert
    @brief Single alert/reminder.
    """
    id: str = Field(description="Unique alert ID")
    type: str = Field(description="Alert type")
    severity: AlertSeverity = Field(description="Importance level")
    title: str = Field(description="Alert title")
    message: str = Field(description="Detailed message")
    due_date: Optional[Date] = Field(default=None, description="Due date if applicable")
    action: str = Field(description="Recommended action")


class AlertCheckRequest(BaseModel):
    """
    @class AlertCheckRequest
    @brief Request for alert/compliance check.
    """
    current_date: Date = Field(description="Today's date for calculations")
    financial_state: FinancialState = Field(description="Current financial state")


class AlertCheckResponse(BaseModel):
    """
    @class AlertCheckResponse
    @brief Response with all applicable alerts.
    """
    alerts: List[Alert] = Field(description="Active alerts")
    upcoming: List[Dict[str, Any]] = Field(description="Upcoming deadlines")
    total_alerts: int = Field(description="Total alert count")
    high_priority_count: int = Field(description="High priority alert count")
