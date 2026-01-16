"""
@file app/services/behavior_service.py
@brief Spending behavior analysis service.

@description
This service analyzes spending behavior against the 50-30-20 rule:
- 50% for Needs (essentials)
- 30% for Wants (discretionary)
- 20% for Savings (investments, debt repayment)

Provides:
- Budget compliance checking
- Violation detection
- Reallocation suggestions
- Health scoring

@author HackVengers Team
@version 1.0.0
"""

from typing import Dict, List, Optional
from datetime import date
import logging

from app.models.schemas import (
    TransactionInput,
    BehaviorAnalyzeRequest,
    BehaviorAnalyzeResponse,
    BudgetBreakdown,
    BudgetViolation as BudgetViolationSchema,
    ReallocationSuggestion,
    CategorySpending,
    BucketType,
)
from app.services.categorization_service import categorize_transaction
from app.rules.budget_rules import (
    classify_category,
    calculate_bucket_totals,
    calculate_budget_breakdown,
    validate_50_30_20,
    calculate_health_score,
    generate_reallocation_suggestions,
    TARGET_PERCENTAGES,
    BudgetBreakdown as RulesBudgetBreakdown,
)

logger = logging.getLogger(__name__)


# =============================================================================
# CORE ANALYSIS FUNCTIONS
# =============================================================================

def _aggregate_by_category(
    transactions: List[TransactionInput],
) -> Dict[str, Dict]:
    """
    @brief Aggregate transactions by category.
    
    @param transactions List of transactions to analyze
    @return Dict mapping category to aggregated data
    
    @details
    For each category, tracks:
    - Total amount
    - Transaction count
    - Assigned bucket
    """
    category_data: Dict[str, Dict] = {}
    
    for txn in transactions:
        # Categorize transaction
        categorized = categorize_transaction(txn)
        category = categorized.category
        bucket = categorized.bucket.value
        
        if category not in category_data:
            category_data[category] = {
                "amount": 0.0,
                "count": 0,
                "bucket": bucket,
            }
        
        category_data[category]["amount"] += txn.amount
        category_data[category]["count"] += 1
    
    return category_data


def _calculate_savings_rate(
    income: float,
    needs_spending: float,
    wants_spending: float,
    savings_allocation: float
) -> float:
    """
    @brief Calculate actual savings rate.
    
    @param income Monthly income
    @param needs_spending Total needs spending
    @param wants_spending Total wants spending
    @param savings_allocation Explicit savings/investments
    @return Savings rate as percentage
    
    @details
    Savings rate = ((Income - Needs - Wants) + Explicit Savings) / Income
    
    This accounts for both:
    1. Money left after spending (implicit)
    2. Money explicitly allocated to savings (investments, etc.)
    """
    if income <= 0:
        return 0.0
    
    # Implicit savings (what's left)
    implicit_savings = income - needs_spending - wants_spending
    
    # Use higher of implicit or explicit
    effective_savings = max(implicit_savings, savings_allocation)
    
    savings_rate = (effective_savings / income) * 100
    
    return round(max(0, savings_rate), 2)


# =============================================================================
# PUBLIC API FUNCTIONS
# =============================================================================

def analyze_spending(request: BehaviorAnalyzeRequest) -> BehaviorAnalyzeResponse:
    """
    @brief Analyze spending behavior against 50-30-20 rule.
    
    @param request BehaviorAnalyzeRequest with income and transactions
    @return BehaviorAnalyzeResponse with comprehensive analysis
    
    @details
    Analysis steps:
    1. Categorize all transactions
    2. Aggregate by category and bucket
    3. Calculate percentages against income
    4. Detect 50-30-20 violations
    5. Generate improvement suggestions
    6. Calculate health score
    
    @example
    >>> request = BehaviorAnalyzeRequest(
    ...     income=100000,
    ...     transactions=[...],
    ... )
    >>> response = analyze_spending(request)
    >>> response.health_score
    75
    """
    income = request.income
    transactions = request.transactions
    
    # Aggregate transactions by category
    category_data = _aggregate_by_category(transactions)
    
    # Calculate totals by bucket
    category_amounts = {cat: data["amount"] for cat, data in category_data.items()}
    bucket_totals = calculate_bucket_totals(category_amounts)
    
    # Total spending
    total_spending = sum(bucket_totals.values())
    
    # Calculate actual breakdown (as percentage of income, not spending)
    if income > 0:
        actual_breakdown = RulesBudgetBreakdown(
            needs=(bucket_totals["needs"] / income) * 100,
            wants=(bucket_totals["wants"] / income) * 100,
            savings=(bucket_totals["savings"] / income) * 100,
        )
    else:
        actual_breakdown = RulesBudgetBreakdown(needs=0, wants=0, savings=0)
    
    # Target breakdown
    target_breakdown = BudgetBreakdown(
        needs=TARGET_PERCENTAGES["needs"],
        wants=TARGET_PERCENTAGES["wants"],
        savings=TARGET_PERCENTAGES["savings"],
    )
    
    # Validate against 50-30-20 rule
    is_compliant, violations = validate_50_30_20(actual_breakdown, income)
    
    # Calculate health score
    health_score = calculate_health_score(actual_breakdown, violations)
    
    # Generate suggestions
    suggestions_raw = generate_reallocation_suggestions(
        actual_breakdown,
        violations,
        income,
        category_amounts
    )
    
    # Convert violations to schema format
    violation_schemas = [
        BudgetViolationSchema(
            type=v.violation_type,
            actual=v.actual,
            limit=v.limit,
            excess_or_shortfall=v.excess_or_shortfall,
            message=v.message,
        )
        for v in violations
    ]
    
    # Convert suggestions to schema format
    suggestion_schemas = [
        ReallocationSuggestion(
            action=s["action"],
            recommendation=s["recommendation"],
            potential_savings=s["potential_savings"],
            impact_description=s["impact_description"],
        )
        for s in suggestions_raw
    ]
    
    # Build category breakdown for response
    category_breakdown = []
    for category, data in category_data.items():
        percent = (data["amount"] / total_spending * 100) if total_spending > 0 else 0
        category_breakdown.append(CategorySpending(
            category=category,
            bucket=BucketType(data["bucket"]),
            amount=round(data["amount"], 2),
            percent=round(percent, 2),
            transaction_count=data["count"],
        ))
    
    # Sort by amount descending
    category_breakdown.sort(key=lambda x: x.amount, reverse=True)
    
    # Calculate savings rate
    savings_rate = _calculate_savings_rate(
        income,
        bucket_totals["needs"],
        bucket_totals["wants"],
        bucket_totals["savings"]
    )
    
    # Build comprehensive analysis object
    budget_analysis = {
        "is_compliant": is_compliant,
        "needs_status": _get_bucket_status(actual_breakdown.needs, TARGET_PERCENTAGES["needs"], "needs"),
        "wants_status": _get_bucket_status(actual_breakdown.wants, TARGET_PERCENTAGES["wants"], "wants"),
        "savings_status": _get_bucket_status(actual_breakdown.savings, TARGET_PERCENTAGES["savings"], "savings"),
        "bucket_totals": {
            "needs": round(bucket_totals["needs"], 2),
            "wants": round(bucket_totals["wants"], 2),
            "savings": round(bucket_totals["savings"], 2),
        },
        "summary": _generate_summary(is_compliant, violations, health_score),
    }
    
    return BehaviorAnalyzeResponse(
        budget_analysis=budget_analysis,
        actual=BudgetBreakdown(
            needs=round(actual_breakdown.needs, 2),
            wants=round(actual_breakdown.wants, 2),
            savings=round(actual_breakdown.savings, 2),
        ),
        target=target_breakdown,
        violations=violation_schemas,
        suggestions=suggestion_schemas,
        health_score=health_score,
        category_breakdown=category_breakdown,
        total_spending=round(total_spending, 2),
        savings_rate=savings_rate,
    )


def _get_bucket_status(actual: float, target: float, bucket_type: str) -> Dict:
    """
    @brief Get status for a single bucket.
    
    @param actual Actual percentage
    @param target Target percentage
    @param bucket_type Type of bucket (needs/wants/savings)
    @return Status dictionary
    """
    difference = actual - target
    
    if bucket_type == "savings":
        # For savings, higher is better
        if actual >= target:
            status = "excellent" if actual >= target + 5 else "on_track"
            color = "green"
        else:
            status = "below_target"
            color = "red" if actual < target - 5 else "yellow"
    else:
        # For needs/wants, lower is better
        if actual <= target:
            status = "excellent" if actual <= target - 5 else "on_track"
            color = "green"
        else:
            status = "over_budget"
            color = "red" if actual > target + 5 else "yellow"
    
    return {
        "actual": round(actual, 2),
        "target": target,
        "difference": round(difference, 2),
        "status": status,
        "color": color,
    }


def _generate_summary(
    is_compliant: bool,
    violations: List,
    health_score: int
) -> str:
    """
    @brief Generate human-readable summary.
    
    @param is_compliant Whether budget is compliant
    @param violations List of violations
    @param health_score Budget health score
    @return Summary string
    """
    if is_compliant:
        if health_score >= 90:
            return "🎉 Excellent! Your spending perfectly follows the 50-30-20 rule."
        else:
            return "✅ Good job! Your budget is balanced within acceptable limits."
    
    # Build summary based on violations
    issues = []
    for v in violations:
        if v.violation_type == "needs_exceeded":
            issues.append("Needs spending is high")
        elif v.violation_type == "wants_exceeded":
            issues.append("Wants spending is high")
        elif v.violation_type == "savings_deficit":
            issues.append("Savings are below target")
    
    if health_score < 40:
        severity = "⚠️ Urgent attention needed: "
    elif health_score < 60:
        severity = "📊 Room for improvement: "
    else:
        severity = "💡 Minor adjustments suggested: "
    
    return severity + ", ".join(issues) + "."


def get_spending_trends(
    transactions: List[TransactionInput],
    period_months: int = 3
) -> Dict:
    """
    @brief Analyze spending trends over time.
    
    @param transactions All transactions
    @param period_months Number of months to analyze
    @return Trend analysis dictionary
    
    @note This is a placeholder for future trend analysis.
          Requires date-grouped transactions for meaningful results.
    """
    # Group by month
    monthly_data: Dict[str, Dict] = {}
    
    for txn in transactions:
        if txn.date:
            month_key = txn.date.strftime("%Y-%m")
        else:
            month_key = "unknown"
        
        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "needs": 0.0,
                "wants": 0.0,
                "savings": 0.0,
                "total": 0.0,
            }
        
        categorized = categorize_transaction(txn)
        bucket = categorized.bucket.value
        
        monthly_data[month_key][bucket] += txn.amount
        monthly_data[month_key]["total"] += txn.amount
    
    return {
        "monthly_breakdown": monthly_data,
        "months_analyzed": len(monthly_data),
    }
