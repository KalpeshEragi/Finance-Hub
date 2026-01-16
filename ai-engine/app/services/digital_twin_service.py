"""
@file app/services/digital_twin_service.py
@brief Digital Financial Twin simulation service.

@description
This service provides the Digital Financial Twin - a simulation engine
that projects the user's financial future based on current state,
habits, and various scenarios.

Scenarios supported:
- baseline: No changes to current behavior
- increased_savings: 10% reduction in wants spending
- aggressive_savings: 25% reduction in wants spending
- job_loss: Income = 0 for N months
- emi_prepayment: Lump sum loan prepayment

@author HackVengers Team
@version 1.0.0
"""

from typing import Dict, List, Optional
from datetime import date
import logging
import copy

from app.models.schemas import (
    TwinSimulateRequest,
    TwinSimulateResponse,
    TwinCurrentState,
    MonthlyExpenses,
    EMIInput,
    GoalInput,
    SimulationAssumptions,
    MonthlySnapshot,
    ProjectionSummary,
    ScenarioType,
)
from app.utils.date_utils import add_months, get_year_month_string
from app.utils.math import round_currency, compound_interest

logger = logging.getLogger(__name__)


# =============================================================================
# CONSTANTS
# =============================================================================

#: Default simulation assumptions
DEFAULT_ASSUMPTIONS = SimulationAssumptions(
    income_growth_rate=0.08,    # 8% annual income growth
    inflation_rate=0.06,        # 6% annual inflation
    savings_return_rate=0.07,   # 7% return on savings
)

#: Scenario modifiers (multipliers for wants spending)
SCENARIO_MODIFIERS: Dict[ScenarioType, Dict] = {
    ScenarioType.BASELINE: {
        "wants_multiplier": 1.0,
        "needs_multiplier": 1.0,
        "income_multiplier": 1.0,
        "description": "No changes to current behavior",
    },
    ScenarioType.INCREASED_SAVINGS: {
        "wants_multiplier": 0.90,  # 10% reduction
        "needs_multiplier": 1.0,
        "income_multiplier": 1.0,
        "description": "10% reduction in discretionary spending",
    },
    ScenarioType.AGGRESSIVE_SAVINGS: {
        "wants_multiplier": 0.75,  # 25% reduction
        "needs_multiplier": 0.95,  # 5% needs reduction too
        "income_multiplier": 1.0,
        "description": "25% reduction in wants, 5% in needs",
    },
    ScenarioType.JOB_LOSS: {
        "wants_multiplier": 0.30,  # Drastic reduction
        "needs_multiplier": 0.70,  # Cut needs too
        "income_multiplier": 0.0,  # No income
        "description": "Zero income, survival mode spending",
    },
    ScenarioType.EMI_PREPAYMENT: {
        "wants_multiplier": 0.85,  # 15% reduction to fund prepayment
        "needs_multiplier": 1.0,
        "income_multiplier": 1.0,
        "description": "Redirect savings to loan prepayment",
    },
}


# =============================================================================
# INTERNAL SIMULATION ENGINE
# =============================================================================

class FinancialTwinEngine:
    """
    @class FinancialTwinEngine
    @brief Core simulation engine for the Digital Financial Twin.
    
    Simulates month-by-month financial progression including:
    - Income with growth
    - Expenses with inflation
    - EMI payments and loan completion
    - Savings accumulation with returns
    - Goal progress tracking
    """
    
    def __init__(
        self,
        current_state: TwinCurrentState,
        emis: List[EMIInput],
        goals: List[GoalInput],
        assumptions: SimulationAssumptions,
        scenario: ScenarioType,
    ):
        """
        @brief Initialize the simulation engine.
        
        @param current_state Current financial state
        @param emis Active EMIs
        @param goals Financial goals
        @param assumptions Simulation assumptions
        @param scenario Scenario to simulate
        """
        self.initial_state = current_state
        self.emis = self._prepare_emis(emis)
        self.goals = self._prepare_goals(goals)
        self.assumptions = assumptions
        self.scenario = scenario
        self.modifiers = SCENARIO_MODIFIERS[scenario]
        
        # State tracking
        self.current_savings = current_state.savings
        self.current_debt = current_state.debt
        self.current_assets = current_state.assets
        
        # Monthly values (will be updated with growth/inflation)
        self.monthly_income = current_state.monthly_income
        self.monthly_needs = current_state.monthly_expenses.needs
        self.monthly_wants = current_state.monthly_expenses.wants
        self.monthly_emis = current_state.monthly_expenses.emis
        self.monthly_savings_target = current_state.monthly_expenses.savings
        
        # Tracking
        self.snapshots: List[MonthlySnapshot] = []
        self.goals_achieved: List[str] = []
        self.total_savings_added = 0.0
        self.total_debt_reduced = 0.0
    
    def _prepare_emis(self, emis: List[EMIInput]) -> List[Dict]:
        """Prepare EMI list with tracking info."""
        return [
            {
                "name": emi.name,
                "monthly_amount": emi.monthly_amount,
                "remaining_months": emi.remaining_months,
                "interest_rate": emi.interest_rate,
                "active": True,
            }
            for emi in emis
        ]
    
    def _prepare_goals(self, goals: List[GoalInput]) -> List[Dict]:
        """Prepare goals list with tracking info."""
        return [
            {
                "name": goal.name,
                "target": goal.target,
                "current": goal.current,
                "deadline": goal.deadline,
                "priority": goal.priority,
                "achieved": goal.current >= goal.target,
            }
            for goal in goals
        ]
    
    def simulate(self, months: int) -> List[MonthlySnapshot]:
        """
        @brief Run the full simulation.
        
        @param months Number of months to simulate
        @return List of monthly snapshots
        """
        start_date = date.today()
        
        for month_num in range(1, months + 1):
            snapshot = self._simulate_month(month_num, start_date)
            self.snapshots.append(snapshot)
            
            # Apply annual adjustments at year boundaries
            if month_num % 12 == 0:
                self._apply_annual_adjustments()
        
        return self.snapshots
    
    def _simulate_month(self, month_num: int, start_date: date) -> MonthlySnapshot:
        """
        @brief Simulate a single month.
        
        @param month_num Month number from start (1-indexed)
        @param start_date Simulation start date
        @return MonthlySnapshot for this month
        """
        current_month = add_months(start_date, month_num - 1)
        month_str = get_year_month_string(current_month)
        
        # Calculate income (with scenario modifier)
        income = self.monthly_income * self.modifiers["income_multiplier"]
        
        # Calculate expenses (with scenario modifiers)
        needs = self.monthly_needs * self.modifiers["needs_multiplier"]
        wants = self.monthly_wants * self.modifiers["wants_multiplier"]
        
        # Calculate active EMIs
        active_emi_total = 0.0
        for emi in self.emis:
            if emi["active"] and emi["remaining_months"] > 0:
                active_emi_total += emi["monthly_amount"]
                emi["remaining_months"] -= 1
                if emi["remaining_months"] <= 0:
                    emi["active"] = False
        
        # Total outflow
        total_expenses = needs + wants + active_emi_total
        
        # Net savings this month
        savings_flow = income - total_expenses
        
        # Add return on existing savings (monthly compounding)
        monthly_return_rate = self.assumptions.savings_return_rate / 12
        savings_return = self.current_savings * monthly_return_rate
        
        # Update cumulative savings
        self.current_savings += savings_flow + savings_return
        self.current_savings = max(0, self.current_savings)  # Can't go negative
        
        if savings_flow > 0:
            self.total_savings_added += savings_flow
        
        # Update debt (EMI payments reduce principal)
        principal_paid = active_emi_total * 0.4  # Rough estimate: 40% goes to principal
        self.current_debt = max(0, self.current_debt - principal_paid)
        self.total_debt_reduced += principal_paid
        
        # Calculate net worth
        networth = self.current_savings + self.current_assets - self.current_debt
        
        # Update goal progress
        goal_progress = self._update_goal_progress(savings_flow, current_month)
        
        return MonthlySnapshot(
            month=month_num,
            date=month_str,
            income=round_currency(income),
            expenses={
                "needs": round_currency(needs),
                "wants": round_currency(wants),
                "emis": round_currency(active_emi_total),
                "total": round_currency(total_expenses),
            },
            savings_flow=round_currency(savings_flow),
            cumulative_savings=round_currency(self.current_savings),
            debt_remaining=round_currency(self.current_debt),
            networth=round_currency(networth),
            goal_progress=goal_progress,
        )
    
    def _apply_annual_adjustments(self):
        """Apply annual growth rates (income, inflation)."""
        # Income growth
        self.monthly_income *= (1 + self.assumptions.income_growth_rate)
        
        # Expenses inflation
        self.monthly_needs *= (1 + self.assumptions.inflation_rate)
        self.monthly_wants *= (1 + self.assumptions.inflation_rate)
    
    def _update_goal_progress(
        self,
        savings_flow: float,
        current_date: date
    ) -> List[Dict]:
        """
        @brief Update and return goal progress.
        
        @param savings_flow Net savings for this month
        @param current_date Current simulation date
        @return List of goal status dictionaries
        """
        progress = []
        
        # Distribute savings to goals proportionally by priority
        available_for_goals = max(0, savings_flow * 0.5)  # 50% to goals
        
        # Sort by priority (lower = higher priority)
        active_goals = [g for g in self.goals if not g["achieved"]]
        active_goals.sort(key=lambda x: x["priority"])
        
        # Allocate to highest priority goal first
        remaining = available_for_goals
        for goal in active_goals:
            if remaining <= 0:
                break
            
            needed = goal["target"] - goal["current"]
            contribution = min(remaining, needed)
            goal["current"] += contribution
            remaining -= contribution
            
            # Check if achieved
            if goal["current"] >= goal["target"] and not goal["achieved"]:
                goal["achieved"] = True
                self.goals_achieved.append(goal["name"])
        
        # Build progress report
        for goal in self.goals:
            percent = (goal["current"] / goal["target"] * 100) if goal["target"] > 0 else 0
            remaining_amount = max(0, goal["target"] - goal["current"])
            on_track = goal["achieved"] or (current_date <= goal["deadline"])
            
            progress.append({
                "name": goal["name"],
                "target": goal["target"],
                "current": round_currency(goal["current"]),
                "progress_percent": round(min(100, percent), 2),
                "remaining": round_currency(remaining_amount),
                "achieved": goal["achieved"],
                "on_track": on_track,
            })
        
        return progress
    
    def get_summary(self) -> ProjectionSummary:
        """
        @brief Generate projection summary.
        
        @return ProjectionSummary with key metrics
        """
        initial_networth = (
            self.initial_state.savings +
            self.initial_state.assets -
            self.initial_state.debt
        )
        
        final_snapshot = self.snapshots[-1] if self.snapshots else None
        final_networth = final_snapshot.networth if final_snapshot else initial_networth
        final_savings = final_snapshot.cumulative_savings if final_snapshot else self.initial_state.savings
        final_debt = final_snapshot.debt_remaining if final_snapshot else self.initial_state.debt
        
        # Identify at-risk goals
        goals_at_risk = []
        for goal in self.goals:
            if not goal["achieved"]:
                shortfall = goal["target"] - goal["current"]
                goals_at_risk.append({
                    "name": goal["name"],
                    "target": goal["target"],
                    "projected": round_currency(goal["current"]),
                    "shortfall": round_currency(shortfall),
                    "deadline": goal["deadline"].isoformat(),
                })
        
        return ProjectionSummary(
            initial_networth=round_currency(initial_networth),
            final_networth=round_currency(final_networth),
            networth_change=round_currency(final_networth - initial_networth),
            total_savings_added=round_currency(self.total_savings_added),
            total_debt_reduced=round_currency(self.total_debt_reduced),
            final_savings=round_currency(final_savings),
            final_debt=round_currency(final_debt),
            goals_achieved=self.goals_achieved,
            goals_at_risk=goals_at_risk,
        )


# =============================================================================
# PUBLIC API FUNCTIONS
# =============================================================================

def simulate(request: TwinSimulateRequest) -> TwinSimulateResponse:
    """
    @brief Run Digital Twin simulation.
    
    @param request TwinSimulateRequest with current state and parameters
    @return TwinSimulateResponse with complete projection
    
    @details
    The simulation engine:
    1. Takes current financial state as starting point
    2. Projects month-by-month based on income, expenses, EMIs
    3. Applies scenario modifiers (e.g., reduced spending)
    4. Tracks goal progress
    5. Calculates net worth trajectory
    6. Generates recommendations
    
    @example
    >>> request = TwinSimulateRequest(
    ...     current_state=TwinCurrentState(...),
    ...     projection_months=12,
    ...     scenario=ScenarioType.BASELINE,
    ... )
    >>> response = simulate(request)
    >>> response.summary.networth_change
    125000.0
    """
    # Use defaults if not provided
    assumptions = request.assumptions or DEFAULT_ASSUMPTIONS
    
    # Initialize engine
    engine = FinancialTwinEngine(
        current_state=request.current_state,
        emis=request.emis,
        goals=request.goals,
        assumptions=assumptions,
        scenario=request.scenario,
    )
    
    # Run simulation
    snapshots = engine.simulate(request.projection_months)
    summary = engine.get_summary()
    
    # Generate recommendations based on results
    recommendations = _generate_recommendations(
        request.scenario,
        summary,
        request.current_state,
        request.projection_months,
    )
    
    return TwinSimulateResponse(
        scenario=request.scenario,
        projection_months=request.projection_months,
        monthly_snapshots=snapshots,
        summary=summary,
        recommendations=recommendations,
    )


def compare_scenarios(
    current_state: TwinCurrentState,
    emis: List[EMIInput],
    goals: List[GoalInput],
    projection_months: int = 12,
) -> Dict:
    """
    @brief Compare multiple scenarios side by side.
    
    @param current_state Current financial state
    @param emis Active EMIs
    @param goals Financial goals
    @param projection_months Months to project
    @return Comparison dictionary with all scenarios
    
    @details
    Runs simulation for all scenarios and compares:
    - Final net worth
    - Goals achieved
    - Savings accumulated
    """
    scenarios_to_compare = [
        ScenarioType.BASELINE,
        ScenarioType.INCREASED_SAVINGS,
        ScenarioType.AGGRESSIVE_SAVINGS,
    ]
    
    results = {}
    
    for scenario in scenarios_to_compare:
        request = TwinSimulateRequest(
            current_state=current_state,
            emis=emis,
            goals=goals,
            projection_months=projection_months,
            scenario=scenario,
        )
        
        response = simulate(request)
        
        results[scenario.value] = {
            "final_networth": response.summary.final_networth,
            "networth_change": response.summary.networth_change,
            "goals_achieved": len(response.summary.goals_achieved),
            "goals_at_risk": len(response.summary.goals_at_risk),
            "total_savings": response.summary.total_savings_added,
            "description": SCENARIO_MODIFIERS[scenario]["description"],
        }
    
    # Find best scenario
    best_scenario = max(results.items(), key=lambda x: x[1]["final_networth"])
    
    return {
        "scenarios": results,
        "best_scenario": best_scenario[0],
        "best_networth": best_scenario[1]["final_networth"],
        "recommendation": f"'{best_scenario[0]}' yields highest net worth",
    }


def _generate_recommendations(
    scenario: ScenarioType,
    summary: ProjectionSummary,
    current_state: TwinCurrentState,
    months: int,
) -> List[Dict]:
    """
    @brief Generate actionable recommendations from simulation.
    
    @param scenario Simulated scenario
    @param summary Projection summary
    @param current_state Initial state
    @param months Projection period
    @return List of recommendation dictionaries
    """
    recommendations = []
    
    # Net worth trajectory
    if summary.networth_change > 0:
        monthly_growth = summary.networth_change / months
        recommendations.append({
            "type": "positive_trajectory",
            "priority": "info",
            "title": "Positive Financial Trajectory",
            "message": f"Your net worth grows by ₹{summary.networth_change:,.0f} over {months} months",
            "action": f"Continue current path - averaging ₹{monthly_growth:,.0f}/month growth",
        })
    else:
        recommendations.append({
            "type": "negative_trajectory",
            "priority": "high",
            "title": "Net Worth Declining",
            "message": f"Projected net worth decreases by ₹{abs(summary.networth_change):,.0f}",
            "action": "Urgent: Reduce expenses or increase income to reverse trend",
        })
    
    # Goals at risk
    if summary.goals_at_risk:
        for goal in summary.goals_at_risk[:3]:  # Top 3
            recommendations.append({
                "type": "goal_at_risk",
                "priority": "high",
                "title": f"'{goal['name']}' May Not Be Met",
                "message": f"Shortfall of ₹{goal['shortfall']:,.0f} projected by deadline",
                "action": "Increase savings or extend deadline",
            })
    
    # Scenario-specific recommendations
    if scenario == ScenarioType.BASELINE:
        recommendations.append({
            "type": "scenario_suggestion",
            "priority": "medium",
            "title": "Consider Increased Savings",
            "message": "Try the 'increased_savings' scenario to see potential gains",
            "action": "Small lifestyle changes can significantly improve outcomes",
        })
    
    if scenario == ScenarioType.JOB_LOSS:
        # Calculate runway
        initial_savings = current_state.savings
        monthly_burn = (
            current_state.monthly_expenses.needs * 0.7 +
            current_state.monthly_expenses.emis
        )
        runway_months = int(initial_savings / monthly_burn) if monthly_burn > 0 else 0
        
        recommendations.append({
            "type": "emergency_runway",
            "priority": "high",
            "title": f"Emergency Runway: {runway_months} Months",
            "message": f"Current savings cover {runway_months} months of essential expenses",
            "action": "Build 6-month emergency fund for security",
        })
    
    # Debt payoff celebration
    if summary.final_debt == 0 and current_state.debt > 0:
        recommendations.append({
            "type": "debt_freedom",
            "priority": "info",
            "title": "🎉 Debt-Free by End of Projection!",
            "message": "All debts will be cleared within this period",
            "action": "Redirect EMI amounts to investments after payoff",
        })
    
    # Savings milestone
    if summary.final_savings > current_state.savings * 2:
        recommendations.append({
            "type": "savings_milestone",
            "priority": "info",
            "title": "Savings Will Double!",
            "message": f"Projected savings: ₹{summary.final_savings:,.0f}",
            "action": "Consider diversifying into equity for higher returns",
        })
    
    return recommendations


def get_scenario_descriptions() -> Dict[str, str]:
    """
    @brief Get descriptions of all available scenarios.
    
    @return Dictionary mapping scenario name to description
    """
    return {
        scenario.value: SCENARIO_MODIFIERS[scenario]["description"]
        for scenario in ScenarioType
    }
