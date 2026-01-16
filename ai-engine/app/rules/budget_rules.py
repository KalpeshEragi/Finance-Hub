"""
@file app/rules/budget_rules.py
@brief 50-30-20 budget classification rules and validation.

@description
This module implements the 50-30-20 budgeting rule:
- 50% for Needs (essentials like rent, utilities, groceries)
- 30% for Wants (non-essentials like dining, entertainment)
- 20% for Savings (investments, emergency fund, debt repayment)

Functions provide classification, validation, and compliance checking.

@author HackVengers Team
@version 1.0.0
"""

from typing import Dict, List, Tuple, Literal
from dataclasses import dataclass


# =============================================================================
# CONSTANTS
# =============================================================================

#: Target percentages for 50-30-20 rule
TARGET_PERCENTAGES: Dict[str, float] = {
    "needs": 50.0,
    "wants": 30.0,
    "savings": 20.0,
}

#: Tolerance for rule compliance (allow minor deviations)
COMPLIANCE_TOLERANCE: float = 2.0  # 2% tolerance

#: Category to bucket mapping
#: Each category is assigned to a 50-30-20 bucket (needs/wants/savings)
CATEGORY_BUCKETS: Dict[str, str] = {
    # NEEDS - Essential expenses (target: 50%)
    "Groceries": "needs",
    "Rent & Housing": "needs",
    "Utilities": "needs",
    "Transportation": "needs",
    "Healthcare": "needs",
    "Insurance": "needs",
    "Education": "needs",
    "EMI & Loan": "needs",
    "Government & Taxes": "needs",
    "Childcare": "needs",
    "ATM Withdrawal": "needs",
    "Bank Charges": "needs",
    
    # WANTS - Non-essential expenses (target: 30%)
    "Food & Dining": "wants",
    "Shopping": "wants",
    "Entertainment": "wants",
    "Travel & Vacation": "wants",
    "Personal Care": "wants",
    "Fitness & Sports": "wants",
    "Pet Care": "wants",
    "Gifts": "wants",
    
    # SAVINGS - Investments & savings (target: 20%)
    "Investments": "savings",
    "Savings": "savings",
    "Charity & Donations": "savings",
    
    # DEFAULT
    "Uncategorized": "wants",  # Treat unknown as wants (conservative)
}


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class BudgetBreakdown:
    """
    @class BudgetBreakdown
    @brief Holds the percentage breakdown for each bucket.
    
    @param needs Percentage spent on needs
    @param wants Percentage spent on wants
    @param savings Percentage allocated to savings
    """
    needs: float
    wants: float
    savings: float
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary representation."""
        return {
            "needs": round(self.needs, 2),
            "wants": round(self.wants, 2),
            "savings": round(self.savings, 2),
        }


@dataclass
class BudgetViolation:
    """
    @class BudgetViolation
    @brief Represents a 50-30-20 rule violation.
    
    @param violation_type Type of violation (needs_exceeded, wants_exceeded, savings_deficit)
    @param actual Actual percentage
    @param limit Target limit percentage
    @param excess_or_shortfall Amount over/under in absolute terms (INR)
    @param message Human-readable violation message
    """
    violation_type: Literal["needs_exceeded", "wants_exceeded", "savings_deficit"]
    actual: float
    limit: float
    excess_or_shortfall: float
    message: str


# =============================================================================
# CORE FUNCTIONS
# =============================================================================

def classify_category(category: str) -> str:
    """
    @brief Classify a spending category into a 50-30-20 bucket.
    
    @param category The category name to classify
    @return str The bucket type: "needs", "wants", or "savings"
    
    @note Returns "wants" as default for unknown categories (conservative approach)
    
    @example
    >>> classify_category("Groceries")
    'needs'
    >>> classify_category("Entertainment")
    'wants'
    >>> classify_category("Unknown Category")
    'wants'
    """
    return CATEGORY_BUCKETS.get(category, "wants")


def calculate_bucket_totals(
    category_amounts: Dict[str, float]
) -> Dict[str, float]:
    """
    @brief Calculate total spending per bucket from category amounts.
    
    @param category_amounts Dictionary mapping category names to amounts
    @return Dict[str, float] Total amounts per bucket (needs, wants, savings)
    
    @example
    >>> amounts = {"Groceries": 5000, "Entertainment": 2000, "Investments": 3000}
    >>> calculate_bucket_totals(amounts)
    {'needs': 5000.0, 'wants': 2000.0, 'savings': 3000.0}
    """
    bucket_totals: Dict[str, float] = {
        "needs": 0.0,
        "wants": 0.0,
        "savings": 0.0,
    }
    
    for category, amount in category_amounts.items():
        bucket = classify_category(category)
        bucket_totals[bucket] += amount
    
    return bucket_totals


def calculate_budget_breakdown(
    bucket_totals: Dict[str, float],
    total_spending: float
) -> BudgetBreakdown:
    """
    @brief Calculate percentage breakdown from bucket totals.
    
    @param bucket_totals Dictionary of amounts per bucket
    @param total_spending Total spending amount
    @return BudgetBreakdown Percentage breakdown object
    
    @note Returns 0% for all buckets if total_spending is 0
    
    @example
    >>> totals = {"needs": 50000, "wants": 30000, "savings": 20000}
    >>> breakdown = calculate_budget_breakdown(totals, 100000)
    >>> breakdown.needs
    50.0
    """
    if total_spending <= 0:
        return BudgetBreakdown(needs=0.0, wants=0.0, savings=0.0)
    
    return BudgetBreakdown(
        needs=(bucket_totals["needs"] / total_spending) * 100,
        wants=(bucket_totals["wants"] / total_spending) * 100,
        savings=(bucket_totals["savings"] / total_spending) * 100,
    )


def validate_50_30_20(
    actual: BudgetBreakdown,
    income: float,
    tolerance: float = COMPLIANCE_TOLERANCE
) -> Tuple[bool, List[BudgetViolation]]:
    """
    @brief Validate spending against 50-30-20 rule.
    
    @param actual Actual budget breakdown percentages
    @param income Monthly income for calculating absolute violations
    @param tolerance Allowed deviation percentage (default: 2%)
    @return Tuple of (is_compliant, list of violations)
    
    @details
    Checks three rules:
    1. Needs should not exceed 50% (+ tolerance)
    2. Wants should not exceed 30% (+ tolerance)
    3. Savings should meet at least 20% (- tolerance)
    
    @example
    >>> actual = BudgetBreakdown(needs=55.0, wants=35.0, savings=10.0)
    >>> is_compliant, violations = validate_50_30_20(actual, income=100000)
    >>> is_compliant
    False
    >>> len(violations)
    3
    """
    violations: List[BudgetViolation] = []
    
    # Check needs (should not exceed 50%)
    needs_limit = TARGET_PERCENTAGES["needs"] + tolerance
    if actual.needs > needs_limit:
        excess_percent = actual.needs - TARGET_PERCENTAGES["needs"]
        excess_amount = (excess_percent / 100) * income
        violations.append(BudgetViolation(
            violation_type="needs_exceeded",
            actual=round(actual.needs, 2),
            limit=TARGET_PERCENTAGES["needs"],
            excess_or_shortfall=round(excess_amount, 2),
            message=f"Needs spending at {actual.needs:.1f}% exceeds the 50% target by ₹{excess_amount:,.0f}"
        ))
    
    # Check wants (should not exceed 30%)
    wants_limit = TARGET_PERCENTAGES["wants"] + tolerance
    if actual.wants > wants_limit:
        excess_percent = actual.wants - TARGET_PERCENTAGES["wants"]
        excess_amount = (excess_percent / 100) * income
        violations.append(BudgetViolation(
            violation_type="wants_exceeded",
            actual=round(actual.wants, 2),
            limit=TARGET_PERCENTAGES["wants"],
            excess_or_shortfall=round(excess_amount, 2),
            message=f"Wants spending at {actual.wants:.1f}% exceeds the 30% target by ₹{excess_amount:,.0f}"
        ))
    
    # Check savings (should meet at least 20%)
    savings_floor = TARGET_PERCENTAGES["savings"] - tolerance
    if actual.savings < savings_floor:
        shortfall_percent = TARGET_PERCENTAGES["savings"] - actual.savings
        shortfall_amount = (shortfall_percent / 100) * income
        violations.append(BudgetViolation(
            violation_type="savings_deficit",
            actual=round(actual.savings, 2),
            limit=TARGET_PERCENTAGES["savings"],
            excess_or_shortfall=round(shortfall_amount, 2),
            message=f"Savings at {actual.savings:.1f}% is below the 20% target by ₹{shortfall_amount:,.0f}"
        ))
    
    is_compliant = len(violations) == 0
    return is_compliant, violations


def calculate_health_score(
    actual: BudgetBreakdown,
    violations: List[BudgetViolation]
) -> int:
    """
    @brief Calculate a 0-100 budget health score.
    
    @param actual Actual budget breakdown
    @param violations List of detected violations
    @return int Health score from 0 (poor) to 100 (excellent)
    
    @details
    Scoring algorithm:
    - Start with 100 points
    - Deduct points for each violation based on severity
    - Bonus points for exceeding savings target
    - Minimum score is 0
    
    @example
    >>> actual = BudgetBreakdown(needs=48, wants=28, savings=24)
    >>> health_score = calculate_health_score(actual, [])
    >>> health_score
    100
    """
    score = 100
    
    for violation in violations:
        if violation.violation_type == "needs_exceeded":
            # Heavier penalty for needs overspending
            excess = violation.actual - TARGET_PERCENTAGES["needs"]
            score -= min(excess * 2, 30)  # Max 30 point deduction
            
        elif violation.violation_type == "wants_exceeded":
            excess = violation.actual - TARGET_PERCENTAGES["wants"]
            score -= min(excess * 1.5, 25)  # Max 25 point deduction
            
        elif violation.violation_type == "savings_deficit":
            # Heaviest penalty for not saving enough
            shortfall = TARGET_PERCENTAGES["savings"] - violation.actual
            score -= min(shortfall * 3, 40)  # Max 40 point deduction
    
    # Bonus for exceeding savings target
    if actual.savings > TARGET_PERCENTAGES["savings"]:
        bonus = min((actual.savings - TARGET_PERCENTAGES["savings"]) * 0.5, 10)
        score += bonus
    
    # Clamp score between 0 and 100
    return max(0, min(100, int(round(score))))


def generate_reallocation_suggestions(
    actual: BudgetBreakdown,
    violations: List[BudgetViolation],
    income: float,
    category_spending: Dict[str, float]
) -> List[Dict[str, str]]:
    """
    @brief Generate actionable suggestions to fix budget violations.
    
    @param actual Actual budget breakdown
    @param violations Current violations
    @param income Monthly income
    @param category_spending Spending per category
    @return List of suggestion dictionaries
    
    @details
    Generates specific recommendations such as:
    - Reduce dining out expenses
    - Cancel unused subscriptions
    - Move excess wants spending to savings
    """
    suggestions: List[Dict[str, str]] = []
    
    if not violations:
        suggestions.append({
            "action": "maintain_course",
            "recommendation": "Your budget is well-balanced. Keep following the 50-30-20 rule!",
            "potential_savings": 0,
            "impact_description": "You're on track to build wealth steadily.",
        })
        return suggestions
    
    # Track total potential reallocation
    total_wants = (actual.wants / 100) * income
    total_needs = (actual.needs / 100) * income
    
    for violation in violations:
        if violation.violation_type == "wants_exceeded":
            # Find top wants categories to reduce
            wants_categories = [
                (cat, amt) for cat, amt in category_spending.items()
                if classify_category(cat) == "wants" and amt > 0
            ]
            wants_categories.sort(key=lambda x: x[1], reverse=True)
            
            for cat, amt in wants_categories[:3]:
                reduction_target = min(amt * 0.2, violation.excess_or_shortfall / 3)
                suggestions.append({
                    "action": f"reduce_{cat.lower().replace(' ', '_')}",
                    "recommendation": f"Reduce {cat} spending by ₹{reduction_target:,.0f}/month",
                    "potential_savings": round(reduction_target, 2),
                    "impact_description": f"This moves you closer to the 30% wants target",
                })
        
        elif violation.violation_type == "needs_exceeded":
            suggestions.append({
                "action": "audit_needs",
                "recommendation": "Review needs expenses - ensure no 'wants' are misclassified",
                "potential_savings": round(violation.excess_or_shortfall * 0.3, 2),
                "impact_description": "Some 'needs' may actually be optional subscriptions",
            })
        
        elif violation.violation_type == "savings_deficit":
            target_additional_savings = violation.excess_or_shortfall
            suggestions.append({
                "action": "increase_savings",
                "recommendation": f"Set up automatic SIP of ₹{target_additional_savings:,.0f}/month",
                "potential_savings": round(target_additional_savings, 2),
                "impact_description": "Automate savings before spending to hit 20% target",
            })
            
            # Suggest cutting from wants if overspending there
            if actual.wants > TARGET_PERCENTAGES["wants"]:
                suggestions.append({
                    "action": "redirect_wants",
                    "recommendation": f"Move ₹{target_additional_savings/2:,.0f} from wants to savings",
                    "potential_savings": round(target_additional_savings / 2, 2),
                    "impact_description": "Small lifestyle adjustments compound into wealth",
                })
    
    return suggestions


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_bucket_color(bucket: str) -> str:
    """
    @brief Get color code for a bucket (for UI rendering).
    
    @param bucket Bucket type (needs/wants/savings)
    @return str Hex color code
    """
    colors = {
        "needs": "#3B82F6",   # Blue
        "wants": "#F59E0B",   # Amber
        "savings": "#10B981", # Emerald
    }
    return colors.get(bucket, "#6B7280")  # Gray default


def get_target_for_bucket(bucket: str) -> float:
    """
    @brief Get target percentage for a bucket.
    
    @param bucket Bucket type
    @return float Target percentage
    """
    return TARGET_PERCENTAGES.get(bucket, 0.0)
