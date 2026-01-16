"""
@file app/services/goal_service.py
@brief Goal-based financial planning service.

@description
This service helps users plan and track financial goals:
- Feasibility analysis for each goal
- Required monthly savings calculation
- Priority-based allocation strategy
- Progress tracking and projections

@author HackVengers Team
@version 1.0.0
"""

from typing import Dict, List, Optional
from datetime import date
import logging

from app.models.schemas import (
    GoalPlanRequest,
    GoalPlanResponse,
    GoalInput,
    GoalAnalysis,
)
from app.utils.math import (
    calculate_required_sip,
    calculate_sip_future_value,
    round_currency,
)
from app.utils.date_utils import months_between, add_months

logger = logging.getLogger(__name__)


# =============================================================================
# CONSTANTS
# =============================================================================

#: Default expected return rate for goal projections (conservative)
DEFAULT_RETURN_RATE: float = 8.0  # 8% annual

#: Minimum months considered for goal planning
MIN_GOAL_MONTHS: int = 1


# =============================================================================
# INTERNAL HELPER FUNCTIONS
# =============================================================================

def _calculate_months_to_goal(deadline: date, from_date: Optional[date] = None) -> int:
    """
    @brief Calculate months remaining to goal deadline.
    
    @param deadline Goal deadline date
    @param from_date Starting date (default: today)
    @return Number of months remaining
    """
    if from_date is None:
        from_date = date.today()
    
    if deadline <= from_date:
        return 0
    
    return max(MIN_GOAL_MONTHS, months_between(from_date, deadline))


def _analyze_single_goal(
    goal: GoalInput,
    available_monthly: float,
    expected_return: float = DEFAULT_RETURN_RATE
) -> GoalAnalysis:
    """
    @brief Analyze a single goal's feasibility.
    
    @param goal GoalInput object
    @param available_monthly Available monthly amount for this goal
    @param expected_return Expected annual return rate
    @return GoalAnalysis with complete assessment
    
    @details
    Calculates:
    - Remaining amount needed
    - Required monthly savings
    - Whether goal is achievable with allocation
    - Projected completion date
    """
    today = date.today()
    months_remaining = _calculate_months_to_goal(goal.deadline)
    remaining_amount = max(0, goal.target - goal.current)
    
    # If goal is already achieved
    if remaining_amount <= 0:
        return GoalAnalysis(
            name=goal.name,
            target=goal.target,
            current=goal.current,
            remaining=0,
            deadline=goal.deadline,
            months_remaining=months_remaining,
            required_monthly=0,
            suggested_allocation=0,
            achievable=True,
            projected_completion=today,
            months_delayed=0,
        )
    
    # If deadline has passed
    if months_remaining <= 0:
        # Calculate how long it would take from now
        if available_monthly > 0:
            months_needed = _months_to_accumulate(
                remaining_amount,
                available_monthly,
                expected_return
            )
            projected = add_months(today, months_needed)
        else:
            months_needed = 999
            projected = None
        
        return GoalAnalysis(
            name=goal.name,
            target=goal.target,
            current=goal.current,
            remaining=round_currency(remaining_amount),
            deadline=goal.deadline,
            months_remaining=0,
            required_monthly=round_currency(remaining_amount),  # Need full amount
            suggested_allocation=round_currency(available_monthly),
            achievable=False,
            projected_completion=projected,
            months_delayed=months_needed,
        )
    
    # Calculate required monthly SIP to reach goal
    required_monthly = calculate_required_sip(
        target_amount=remaining_amount,
        annual_return=expected_return,
        months=months_remaining
    )
    
    # Check if achievable with available amount
    achievable = available_monthly >= required_monthly * 0.95  # 5% tolerance
    
    # Calculate projected completion
    if available_monthly >= required_monthly:
        projected_completion = goal.deadline
        months_delayed = 0
    else:
        # Calculate how long it would actually take
        months_needed = _months_to_accumulate(
            remaining_amount,
            available_monthly,
            expected_return
        )
        projected_completion = add_months(today, months_needed)
        months_delayed = max(0, months_needed - months_remaining)
    
    return GoalAnalysis(
        name=goal.name,
        target=goal.target,
        current=goal.current,
        remaining=round_currency(remaining_amount),
        deadline=goal.deadline,
        months_remaining=months_remaining,
        required_monthly=round_currency(required_monthly),
        suggested_allocation=round_currency(min(available_monthly, required_monthly * 1.1)),
        achievable=achievable,
        projected_completion=projected_completion,
        months_delayed=months_delayed,
    )


def _months_to_accumulate(
    target: float,
    monthly_sip: float,
    annual_return: float
) -> int:
    """
    @brief Calculate months needed to accumulate a target amount.
    
    @param target Target amount to accumulate
    @param monthly_sip Monthly SIP amount
    @param annual_return Annual return rate
    @return Number of months needed
    """
    if monthly_sip <= 0:
        return 999  # Effectively infinite
    
    # Binary search for months needed
    low, high = 1, 600  # Max 50 years
    
    while low < high:
        mid = (low + high) // 2
        fv = calculate_sip_future_value(monthly_sip, annual_return, mid)
        
        if fv >= target:
            high = mid
        else:
            low = mid + 1
    
    return low


def _allocate_to_goals(
    goals: List[GoalInput],
    total_available: float
) -> Dict[str, float]:
    """
    @brief Allocate available savings across goals by priority.
    
    @param goals List of goals with priorities
    @param total_available Total monthly amount available
    @return Dictionary mapping goal name to allocated amount
    
    @details
    Allocation strategy:
    1. Sort goals by priority (1 = highest)
    2. Goals with closer deadlines get slight priority boost
    3. Allocate proportionally based on weighted priority
    """
    if not goals or total_available <= 0:
        return {}
    
    # Calculate weighted priority for each goal
    today = date.today()
    weights = {}
    
    for goal in goals:
        # Base priority (inverted so priority 1 has highest weight)
        base_weight = 11 - goal.priority  # Priority 1 -> weight 10
        
        # Urgency bonus for closer deadlines
        months_to_deadline = _calculate_months_to_goal(goal.deadline)
        urgency_bonus = max(0, 5 - (months_to_deadline / 12))  # Bonus for < 5 years
        
        # Progress penalty (goals closer to completion need less)
        progress = goal.current / goal.target if goal.target > 0 else 0
        progress_factor = 1 - (progress * 0.5)  # 50% complete = 0.75 weight
        
        weights[goal.name] = (base_weight + urgency_bonus) * progress_factor
    
    # Calculate total weight
    total_weight = sum(weights.values())
    if total_weight <= 0:
        total_weight = 1
    
    # Allocate proportionally
    allocations = {}
    for goal in goals:
        allocation = (weights[goal.name] / total_weight) * total_available
        allocations[goal.name] = round_currency(allocation)
    
    return allocations


def _generate_recommendations(
    analysis: List[GoalAnalysis],
    total_required: float,
    available: float
) -> List[Dict]:
    """
    @brief Generate actionable recommendations based on analysis.
    
    @param analysis List of goal analyses
    @param total_required Total monthly amount required
    @param available Available monthly amount
    @return List of recommendation dictionaries
    """
    recommendations = []
    
    # Check overall feasibility
    shortfall = total_required - available
    if shortfall > 0:
        recommendations.append({
            "type": "shortfall",
            "priority": "high",
            "message": f"Monthly shortfall of ₹{shortfall:,.0f} to meet all goals",
            "action": "Increase income or reduce expenses to close the gap",
        })
    
    # Check for at-risk goals
    at_risk = [a for a in analysis if not a.achievable and a.remaining > 0]
    for goal in at_risk:
        recommendations.append({
            "type": "goal_at_risk",
            "priority": "high",
            "message": f"'{goal.name}' unlikely to be met by deadline",
            "action": f"Increase allocation or extend deadline by {goal.months_delayed} months",
        })
    
    # Check for goals that can be accelerated
    achievable = [a for a in analysis if a.achievable and a.suggested_allocation > a.required_monthly]
    for goal in achievable[:2]:  # Top 2
        extra = goal.suggested_allocation - goal.required_monthly
        recommendations.append({
            "type": "acceleration_possible",
            "priority": "low",
            "message": f"'{goal.name}' can be achieved earlier with surplus allocation",
            "action": f"Extra ₹{extra:,.0f}/month could speed up completion",
        })
    
    # General advice if all on track
    if not at_risk:
        recommendations.append({
            "type": "on_track",
            "priority": "info",
            "message": "All goals are on track to be achieved!",
            "action": "Maintain current savings discipline",
        })
    
    return recommendations


# =============================================================================
# PUBLIC API FUNCTIONS
# =============================================================================

def plan_goals(request: GoalPlanRequest) -> GoalPlanResponse:
    """
    @brief Create comprehensive goal plan with feasibility analysis.
    
    @param request GoalPlanRequest with goals and financial details
    @return GoalPlanResponse with analysis and recommendations
    
    @details
    Planning process:
    1. Allocate available savings across goals by priority
    2. Analyze each goal's feasibility
    3. Calculate total monthly requirements
    4. Generate actionable recommendations
    
    @example
    >>> request = GoalPlanRequest(
    ...     goals=[GoalInput(name="Car", target=500000, deadline=date(2026, 1, 1))],
    ...     monthly_income=100000,
    ...     current_savings_rate=20000,
    ...     available_for_goals=15000,
    ... )
    >>> response = plan_goals(request)
    >>> response.all_achievable
    True
    """
    goals = request.goals
    available = request.available_for_goals
    
    if not goals:
        return GoalPlanResponse(
            analysis=[],
            total_required_monthly=0,
            available_monthly=available,
            shortfall=0,
            all_achievable=True,
            recommendations=[{
                "type": "no_goals",
                "priority": "info",
                "message": "No goals defined. Consider setting financial targets!",
                "action": "Define goals like emergency fund, car, house, retirement",
            }],
        )
    
    # Sort goals by priority
    sorted_goals = sorted(goals, key=lambda g: g.priority)
    
    # Allocate available amount to goals
    allocations = _allocate_to_goals(sorted_goals, available)
    
    # Analyze each goal
    analysis = []
    total_required = 0
    
    for goal in sorted_goals:
        allocated = allocations.get(goal.name, available / len(goals))
        goal_analysis = _analyze_single_goal(goal, allocated)
        analysis.append(goal_analysis)
        total_required += goal_analysis.required_monthly
    
    # Calculate shortfall
    shortfall = max(0, total_required - available)
    all_achievable = all(a.achievable for a in analysis)
    
    # Generate recommendations
    recommendations = _generate_recommendations(analysis, total_required, available)
    
    return GoalPlanResponse(
        analysis=analysis,
        total_required_monthly=round_currency(total_required),
        available_monthly=round_currency(available),
        shortfall=round_currency(shortfall),
        all_achievable=all_achievable,
        recommendations=recommendations,
    )


def calculate_goal_progress(
    goal: GoalInput,
    monthly_contribution: float,
    expected_return: float = DEFAULT_RETURN_RATE
) -> Dict:
    """
    @brief Calculate detailed progress for a single goal.
    
    @param goal GoalInput object
    @param monthly_contribution Monthly amount being saved
    @param expected_return Expected annual return
    @return Progress dictionary with projections
    """
    today = date.today()
    months_remaining = _calculate_months_to_goal(goal.deadline)
    remaining = max(0, goal.target - goal.current)
    
    # Progress so far
    progress_percent = (goal.current / goal.target * 100) if goal.target > 0 else 0
    
    # Project future value at deadline
    projected_at_deadline = goal.current + calculate_sip_future_value(
        monthly_contribution,
        expected_return,
        months_remaining
    )
    
    # Will we hit target?
    will_achieve = projected_at_deadline >= goal.target
    surplus_or_shortfall = projected_at_deadline - goal.target
    
    return {
        "goal_name": goal.name,
        "target": goal.target,
        "current": goal.current,
        "remaining": round_currency(remaining),
        "progress_percent": round(progress_percent, 2),
        "deadline": goal.deadline.isoformat(),
        "months_remaining": months_remaining,
        "monthly_contribution": monthly_contribution,
        "projected_at_deadline": round_currency(projected_at_deadline),
        "will_achieve": will_achieve,
        "surplus_or_shortfall": round_currency(surplus_or_shortfall),
        "on_track": will_achieve,
    }


def prioritize_goals(goals: List[GoalInput]) -> List[Dict]:
    """
    @brief Suggest priority ordering for goals.
    
    @param goals List of goals
    @return Suggested priority ordering with reasoning
    
    @details
    Priority factors:
    1. Emergency fund always first
    2. Debt repayment second
    3. Urgency (deadline proximity)
    4. User-assigned priority
    """
    priority_order = []
    
    for goal in goals:
        # Base urgency from deadline
        months = _calculate_months_to_goal(goal.deadline)
        urgency_score = 100 - min(100, months)  # Closer deadline = higher score
        
        # Special goal types get priority boosts
        name_lower = goal.name.lower()
        type_boost = 0
        goal_type = "general"
        
        if "emergency" in name_lower or "emergency fund" in name_lower:
            type_boost = 50
            goal_type = "emergency_fund"
        elif "debt" in name_lower or "loan" in name_lower:
            type_boost = 40
            goal_type = "debt_repayment"
        elif "health" in name_lower or "insurance" in name_lower:
            type_boost = 30
            goal_type = "protection"
        elif "retirement" in name_lower or "pension" in name_lower:
            type_boost = 20
            goal_type = "retirement"
        elif "child" in name_lower or "education" in name_lower:
            type_boost = 25
            goal_type = "education"
        
        # Factor in user priority (inverse: 1 is highest)
        user_priority_score = (11 - goal.priority) * 5
        
        total_score = urgency_score + type_boost + user_priority_score
        
        priority_order.append({
            "goal_name": goal.name,
            "goal_type": goal_type,
            "suggested_priority": 0,  # Will be assigned after sorting
            "user_priority": goal.priority,
            "urgency_score": urgency_score,
            "type_boost": type_boost,
            "total_score": total_score,
            "reasoning": _get_priority_reasoning(goal_type, months),
        })
    
    # Sort by score descending and assign priorities
    priority_order.sort(key=lambda x: x["total_score"], reverse=True)
    for i, item in enumerate(priority_order):
        item["suggested_priority"] = i + 1
    
    return priority_order


def _get_priority_reasoning(goal_type: str, months_to_deadline: int) -> str:
    """Generate reasoning for priority suggestion."""
    reasoning = {
        "emergency_fund": "Emergency fund provides financial security foundation - prioritize first",
        "debt_repayment": "Clearing debt reduces interest burden and improves financial health",
        "protection": "Insurance and health coverage protect against financial emergencies",
        "retirement": "Retirement savings benefit from long-term compounding - start early",
        "education": "Education funding has fixed deadlines - plan well in advance",
        "general": "Balance based on deadline urgency and personal importance",
    }
    
    base = reasoning.get(goal_type, reasoning["general"])
    
    if months_to_deadline < 12:
        base += " ⚠️ Deadline within 1 year - urgent attention needed"
    elif months_to_deadline < 24:
        base += " 📅 Deadline within 2 years - focus required"
    
    return base
