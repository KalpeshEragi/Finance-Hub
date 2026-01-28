"""
@file investment_readiness_service.py
@brief Investment Readiness Gate - Core evaluation logic.

@description
Pure function that evaluates whether a user is financially ready to invest
based on their complete ledger snapshot. This gate controls all downstream
investment recommendations.

Target Audience: College students & young professionals (18-25, flexible income)
- May have limited/variable income
- Often lack emergency funds
- May have high-interest debt (credit cards)
- Need clear, actionable guidance

Rules are designed to be protective but not overly restrictive.
"""

from typing import List, Tuple
from app.models.investment_readiness import (
    LedgerSnapshotInput,
    InvestmentReadinessOutput,
    ReadinessStatus,
    ReadinessBlocker,
    BlockerSeverity,
)


# =============================================================================
# RULE THRESHOLDS (Configurable)
# =============================================================================

class ReadinessThresholds:
    """
    Thresholds for investment readiness rules.
    Tuned for young professionals with variable income.
    """
    # R1: Emergency Fund Coverage (months)
    EMERGENCY_FUND_MIN = 3.0
    EMERGENCY_FUND_CAUTION = 2.0
    
    # R2: EMI-to-Income Ratio (percentage)
    EMI_TO_INCOME_MAX = 40.0
    EMI_TO_INCOME_CAUTION = 30.0
    
    # R3: High-Interest Debt (APR percentage)
    HIGH_INTEREST_THRESHOLD = 15.0
    
    # R4: Savings Rate (percentage)
    SAVINGS_RATE_MIN = 10.0
    SAVINGS_RATE_TARGET = 20.0
    
    # R5: Budget Adherence (percentage)
    BUDGET_ADHERENCE_MIN = 50.0
    BUDGET_ADHERENCE_TARGET = 70.0
    
    # R8: Goal Progress (percentage)
    GOAL_PROGRESS_MIN = 10.0
    
    # Scoring
    SCORE_READY_THRESHOLD = 70
    SCORE_CAUTION_THRESHOLD = 40


# =============================================================================
# SCORING PENALTIES
# =============================================================================

class ScoringPenalties:
    """Point deductions for each rule violation."""
    NO_EMERGENCY_FUND = 30
    LOW_EMERGENCY_FUND = 15
    HIGH_EMI_RATIO = 25
    MODERATE_EMI_RATIO = 10
    HIGH_INTEREST_DEBT = 20
    POOR_SAVINGS_RATE = 10
    LOW_SAVINGS_RATE = 5
    POOR_BUDGET_ADHERENCE = 10
    LOW_BUDGET_ADHERENCE = 5
    NEGATIVE_BALANCE = 30
    NO_INCOME = 50
    STALLED_GOALS = 5


# =============================================================================
# RULE EVALUATION FUNCTIONS
# =============================================================================

def _evaluate_emergency_fund(
    coverage: float,
) -> Tuple[int, List[ReadinessBlocker], List[str]]:
    """
    R1: Emergency Fund Coverage
    < 2 months: NOT_READY (high severity)
    2-3 months: CAUTION (medium severity)
    >= 3 months: OK
    """
    penalty = 0
    blockers = []
    recommendations = []
    
    if coverage < ReadinessThresholds.EMERGENCY_FUND_CAUTION:
        # Critical - no meaningful emergency fund
        penalty = ScoringPenalties.NO_EMERGENCY_FUND
        blockers.append(ReadinessBlocker(
            rule="R1",
            description="Emergency Fund Coverage",
            current=round(coverage, 1),
            threshold=ReadinessThresholds.EMERGENCY_FUND_MIN,
            severity=BlockerSeverity.HIGH,
            message=f"Only {coverage:.1f} months of expenses saved. Build to 3+ months first."
        ))
        recommendations.append(
            f"Build emergency fund to cover 3 months of expenses before investing"
        )
    elif coverage < ReadinessThresholds.EMERGENCY_FUND_MIN:
        # Caution - partial emergency fund
        penalty = ScoringPenalties.LOW_EMERGENCY_FUND
        blockers.append(ReadinessBlocker(
            rule="R1",
            description="Emergency Fund Coverage",
            current=round(coverage, 1),
            threshold=ReadinessThresholds.EMERGENCY_FUND_MIN,
            severity=BlockerSeverity.MEDIUM,
            message=f"Emergency fund covers {coverage:.1f} months (target: 3 months)"
        ))
        recommendations.append(
            "Continue building emergency fund while starting small investments"
        )
    
    return penalty, blockers, recommendations


def _evaluate_emi_to_income(
    emi_ratio: float,
) -> Tuple[int, List[ReadinessBlocker], List[str]]:
    """
    R2: EMI-to-Income Ratio
    > 40%: NOT_READY (high severity)
    30-40%: CAUTION (medium severity)
    < 30%: OK
    """
    penalty = 0
    blockers = []
    recommendations = []
    
    if emi_ratio > ReadinessThresholds.EMI_TO_INCOME_MAX:
        penalty = ScoringPenalties.HIGH_EMI_RATIO
        blockers.append(ReadinessBlocker(
            rule="R2",
            description="EMI-to-Income Ratio",
            current=round(emi_ratio, 1),
            threshold=ReadinessThresholds.EMI_TO_INCOME_MAX,
            severity=BlockerSeverity.HIGH,
            message=f"EMI burden at {emi_ratio:.1f}% of income (max: 40%). Reduce debt first."
        ))
        recommendations.append(
            "Focus on reducing EMI burden before investing. Consider debt consolidation."
        )
    elif emi_ratio > ReadinessThresholds.EMI_TO_INCOME_CAUTION:
        penalty = ScoringPenalties.MODERATE_EMI_RATIO
        blockers.append(ReadinessBlocker(
            rule="R2",
            description="EMI-to-Income Ratio",
            current=round(emi_ratio, 1),
            threshold=ReadinessThresholds.EMI_TO_INCOME_MAX,
            severity=BlockerSeverity.MEDIUM,
            message=f"EMI at {emi_ratio:.1f}% - approaching limit. Be cautious with new debt."
        ))
        recommendations.append(
            "Avoid taking new loans. Prioritize paying off existing EMIs."
        )
    
    return penalty, blockers, recommendations


def _evaluate_high_interest_debt(
    loans: list,
) -> Tuple[int, List[ReadinessBlocker], List[str]]:
    """
    R3: High-Interest Debt (Credit Cards, Personal Loans)
    Any debt > 15% APR: NOT_READY
    """
    penalty = 0
    blockers = []
    recommendations = []
    
    high_interest_loans = [
        loan for loan in loans
        if loan.interestRate > ReadinessThresholds.HIGH_INTEREST_THRESHOLD
        and loan.status == "active"
    ]
    
    if high_interest_loans:
        penalty = ScoringPenalties.HIGH_INTEREST_DEBT
        total_high_interest = sum(loan.outstanding for loan in high_interest_loans)
        highest_rate = max(loan.interestRate for loan in high_interest_loans)
        
        blockers.append(ReadinessBlocker(
            rule="R3",
            description="High-Interest Debt",
            current=highest_rate,
            threshold=ReadinessThresholds.HIGH_INTEREST_THRESHOLD,
            severity=BlockerSeverity.HIGH,
            message=f"₹{total_high_interest:,.0f} in high-interest debt ({highest_rate:.1f}% APR). Pay this first!"
        ))
        recommendations.append(
            f"Clear high-interest debt (₹{total_high_interest:,.0f}) before investing. "
            "No investment beats paying off 15%+ APR debt."
        )
    
    return penalty, blockers, recommendations


def _evaluate_savings_rate(
    savings_rate: float,
) -> Tuple[int, List[ReadinessBlocker], List[str]]:
    """
    R4: Savings Rate
    < 10%: CAUTION (medium severity)
    10-20%: OK but could improve
    >= 20%: Excellent
    """
    penalty = 0
    blockers = []
    recommendations = []
    
    if savings_rate < ReadinessThresholds.SAVINGS_RATE_MIN:
        penalty = ScoringPenalties.POOR_SAVINGS_RATE
        blockers.append(ReadinessBlocker(
            rule="R4",
            description="Savings Rate",
            current=round(savings_rate, 1),
            threshold=ReadinessThresholds.SAVINGS_RATE_MIN,
            severity=BlockerSeverity.MEDIUM,
            message=f"Savings rate at {savings_rate:.1f}% (target: 20%). Low investable surplus."
        ))
        recommendations.append(
            "Increase savings rate by reducing discretionary spending. "
            "Track expenses to find areas to cut back."
        )
    elif savings_rate < ReadinessThresholds.SAVINGS_RATE_TARGET:
        penalty = ScoringPenalties.LOW_SAVINGS_RATE
        blockers.append(ReadinessBlocker(
            rule="R4",
            description="Savings Rate",
            current=round(savings_rate, 1),
            threshold=ReadinessThresholds.SAVINGS_RATE_TARGET,
            severity=BlockerSeverity.LOW,
            message=f"Savings rate at {savings_rate:.1f}% - good but aim for 20%"
        ))
        recommendations.append(
            "You can invest, but try to increase savings rate to 20% over time."
        )
    
    return penalty, blockers, recommendations


def _evaluate_budget_adherence(
    adherence: float,
) -> Tuple[int, List[ReadinessBlocker], List[str]]:
    """
    R5: Budget Adherence
    < 50%: CAUTION (spending out of control)
    50-70%: OK but needs improvement
    >= 70%: Good discipline
    """
    penalty = 0
    blockers = []
    recommendations = []
    
    if adherence < ReadinessThresholds.BUDGET_ADHERENCE_MIN:
        penalty = ScoringPenalties.POOR_BUDGET_ADHERENCE
        blockers.append(ReadinessBlocker(
            rule="R5",
            description="Budget Adherence",
            current=round(adherence, 1),
            threshold=ReadinessThresholds.BUDGET_ADHERENCE_MIN,
            severity=BlockerSeverity.MEDIUM,
            message=f"Only {adherence:.0f}% of budgets met. Spending discipline needed."
        ))
        recommendations.append(
            "Work on staying within budgets before investing. "
            "Uncontrolled spending will undermine investments."
        )
    elif adherence < ReadinessThresholds.BUDGET_ADHERENCE_TARGET:
        penalty = ScoringPenalties.LOW_BUDGET_ADHERENCE
        blockers.append(ReadinessBlocker(
            rule="R5",
            description="Budget Adherence",
            current=round(adherence, 1),
            threshold=ReadinessThresholds.BUDGET_ADHERENCE_TARGET,
            severity=BlockerSeverity.LOW,
            message=f"Budget adherence at {adherence:.0f}% - room for improvement"
        ))
    
    return penalty, blockers, recommendations


def _evaluate_net_balance(
    net_balance: float,
) -> Tuple[int, List[ReadinessBlocker], List[str]]:
    """
    R6: Negative Net Balance
    netBalance < 0: NOT_READY
    """
    penalty = 0
    blockers = []
    recommendations = []
    
    if net_balance < 0:
        penalty = ScoringPenalties.NEGATIVE_BALANCE
        blockers.append(ReadinessBlocker(
            rule="R6",
            description="Negative Net Balance",
            current=net_balance,
            threshold=0,
            severity=BlockerSeverity.HIGH,
            message=f"Spending exceeds income by ₹{abs(net_balance):,.0f}. Cannot invest with deficit."
        ))
        recommendations.append(
            "You're spending more than you earn. Cut expenses immediately before thinking about investments."
        )
    
    return penalty, blockers, recommendations


def _evaluate_income_data(
    total_income: float,
) -> Tuple[int, List[ReadinessBlocker], List[str]]:
    """
    R7: No Income Recorded
    totalIncome = 0: NOT_READY (no data to assess)
    """
    penalty = 0
    blockers = []
    recommendations = []
    
    if total_income == 0:
        penalty = ScoringPenalties.NO_INCOME
        blockers.append(ReadinessBlocker(
            rule="R7",
            description="No Income Data",
            current=0,
            threshold=1,
            severity=BlockerSeverity.HIGH,
            message="No income recorded. Add income transactions for accurate assessment."
        ))
        recommendations.append(
            "Add your income transactions to get personalized investment readiness analysis."
        )
    
    return penalty, blockers, recommendations


def _evaluate_goal_progress(
    goal_progress: float,
    active_goals: int,
) -> Tuple[int, List[ReadinessBlocker], List[str]]:
    """
    R8: Stalled Goal Progress
    < 10% on active goals: CAUTION
    """
    penalty = 0
    blockers = []
    recommendations = []
    
    if active_goals > 0 and goal_progress < ReadinessThresholds.GOAL_PROGRESS_MIN:
        penalty = ScoringPenalties.STALLED_GOALS
        blockers.append(ReadinessBlocker(
            rule="R8",
            description="Stalled Goal Progress",
            current=round(goal_progress, 1),
            threshold=ReadinessThresholds.GOAL_PROGRESS_MIN,
            severity=BlockerSeverity.LOW,
            message=f"Goal progress at {goal_progress:.0f}%. Consider prioritizing existing goals."
        ))
        recommendations.append(
            "You have active financial goals with low progress. "
            "Balance investments with goal contributions."
        )
    
    return penalty, blockers, recommendations


# =============================================================================
# MAIN EVALUATION FUNCTION
# =============================================================================

def evaluate_investment_readiness(
    snapshot: LedgerSnapshotInput,
) -> InvestmentReadinessOutput:
    """
    Evaluate investment readiness based on ledger snapshot.
    
    This is a PURE FUNCTION:
    - No database access
    - No side effects
    - Deterministic output for same input
    
    Args:
        snapshot: Complete ledger snapshot from /ledger/snapshot endpoint
        
    Returns:
        InvestmentReadinessOutput with status, score, blockers, recommendations
    """
    # Initialize scoring
    base_score = 100
    total_penalty = 0
    all_blockers: List[ReadinessBlocker] = []
    all_recommendations: List[str] = []
    reasons: List[str] = []
    
    # Extract key metrics
    dashboard = snapshot.dashboard
    budget = snapshot.budget
    loans = snapshot.loans
    goals = snapshot.goals
    risk = snapshot.riskIndicators
    
    # ==========================================================================
    # RULE EVALUATIONS
    # ==========================================================================
    
    # R1: Emergency Fund
    penalty, blockers, recs = _evaluate_emergency_fund(risk.emergencyFundCoverage)
    total_penalty += penalty
    all_blockers.extend(blockers)
    all_recommendations.extend(recs)
    
    # R2: EMI-to-Income Ratio
    penalty, blockers, recs = _evaluate_emi_to_income(risk.debtToIncomeRatio)
    total_penalty += penalty
    all_blockers.extend(blockers)
    all_recommendations.extend(recs)
    
    # R3: High-Interest Debt
    penalty, blockers, recs = _evaluate_high_interest_debt(loans.loans)
    total_penalty += penalty
    all_blockers.extend(blockers)
    all_recommendations.extend(recs)
    
    # R4: Savings Rate
    penalty, blockers, recs = _evaluate_savings_rate(risk.savingsRate)
    total_penalty += penalty
    all_blockers.extend(blockers)
    all_recommendations.extend(recs)
    
    # R5: Budget Adherence
    penalty, blockers, recs = _evaluate_budget_adherence(risk.budgetAdherence)
    total_penalty += penalty
    all_blockers.extend(blockers)
    all_recommendations.extend(recs)
    
    # R6: Negative Balance
    penalty, blockers, recs = _evaluate_net_balance(dashboard.netBalance)
    total_penalty += penalty
    all_blockers.extend(blockers)
    all_recommendations.extend(recs)
    
    # R7: Income Data
    penalty, blockers, recs = _evaluate_income_data(dashboard.totalIncome)
    total_penalty += penalty
    all_blockers.extend(blockers)
    all_recommendations.extend(recs)
    
    # R8: Goal Progress
    penalty, blockers, recs = _evaluate_goal_progress(
        goals.overallProgress, 
        goals.activeGoals
    )
    total_penalty += penalty
    all_blockers.extend(blockers)
    all_recommendations.extend(recs)
    
    # ==========================================================================
    # CALCULATE FINAL SCORE & STATUS
    # ==========================================================================
    
    final_score = max(0, base_score - total_penalty)
    
    # Determine status based on score and high-severity blockers
    high_severity_blockers = [
        b for b in all_blockers 
        if b.severity == BlockerSeverity.HIGH
    ]
    
    if high_severity_blockers or final_score < ReadinessThresholds.SCORE_CAUTION_THRESHOLD:
        status = ReadinessStatus.NOT_READY
    elif final_score < ReadinessThresholds.SCORE_READY_THRESHOLD:
        status = ReadinessStatus.CAUTION
    else:
        status = ReadinessStatus.READY
    
    # Build reasons list from blockers
    for blocker in all_blockers:
        if blocker.severity in [BlockerSeverity.HIGH, BlockerSeverity.MEDIUM]:
            reasons.append(blocker.message)
    
    # Add positive message if ready
    if status == ReadinessStatus.READY:
        reasons.append("Your finances are in good shape - you're ready to invest!")
        all_recommendations.append(
            "Consider starting with low-risk options like PPF, index funds, or SIPs."
        )
    
    # Deduplicate recommendations
    unique_recommendations = list(dict.fromkeys(all_recommendations))
    
    return InvestmentReadinessOutput(
        status=status,
        score=final_score,
        reasons=reasons,
        blockers=all_blockers,
        recommendations=unique_recommendations,
    )
