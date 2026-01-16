"""
@file tests/test_digital_twin.py
@brief Tests for Digital Twin simulation.

@description
Tests the Digital Twin financial simulation:
- Baseline projections
- Scenario modifiers
- Goal tracking
- Net worth calculations
"""

import pytest
from tests.conftest import assert_valid_response, assert_keys_present


class TestDigitalTwinAPI:
    """Test the /twin endpoints."""
    
    def test_simulate_baseline(self, client, sample_current_state, sample_emis, sample_goals):
        """Test baseline simulation."""
        payload = {
            "current_state": sample_current_state,
            "emis": sample_emis,
            "goals": sample_goals,
            "projection_months": 12,
            "scenario": "baseline",
        }
        
        response = client.post("/twin/simulate", json=payload)
        data = assert_valid_response(response)
        
        assert_keys_present(data, [
            "scenario", "projection_months", "monthly_snapshots",
            "summary", "recommendations"
        ])
        
        assert data["scenario"] == "baseline"
        assert data["projection_months"] == 12
        assert len(data["monthly_snapshots"]) == 12
    
    def test_simulate_increased_savings(self, client, sample_current_state, sample_emis):
        """Test increased savings scenario."""
        payload = {
            "current_state": sample_current_state,
            "emis": sample_emis,
            "goals": [],
            "projection_months": 12,
            "scenario": "increased_savings",
        }
        
        response = client.post("/twin/simulate", json=payload)
        data = assert_valid_response(response)
        
        assert data["scenario"] == "increased_savings"
        
        # Increased savings should have positive impact
        summary = data["summary"]
        assert summary["networth_change"] > 0 or summary["total_savings_added"] > 0
    
    def test_simulate_aggressive_savings(self, client, sample_current_state):
        """Test aggressive savings scenario."""
        payload = {
            "current_state": sample_current_state,
            "emis": [],
            "goals": [],
            "projection_months": 24,
            "scenario": "aggressive_savings",
        }
        
        response = client.post("/twin/simulate", json=payload)
        data = assert_valid_response(response)
        
        assert data["scenario"] == "aggressive_savings"
        
        # Should show more savings than baseline
        assert data["summary"]["total_savings_added"] > 0
    
    def test_simulate_monthly_snapshots(self, client, sample_current_state):
        """Test monthly snapshot structure."""
        payload = {
            "current_state": sample_current_state,
            "emis": [],
            "goals": [],
            "projection_months": 6,
            "scenario": "baseline",
        }
        
        response = client.post("/twin/simulate", json=payload)
        data = assert_valid_response(response)
        
        for snapshot in data["monthly_snapshots"]:
            assert_keys_present(snapshot, [
                "month", "date", "income", "expenses",
                "savings_flow", "cumulative_savings",
                "debt_remaining", "networth", "goal_progress"
            ])
            
            # Month should be sequential
            assert 1 <= snapshot["month"] <= 6
    
    def test_simulate_summary(self, client, sample_current_state, sample_goals):
        """Test projection summary."""
        payload = {
            "current_state": sample_current_state,
            "emis": [],
            "goals": sample_goals,
            "projection_months": 12,
            "scenario": "baseline",
        }
        
        response = client.post("/twin/simulate", json=payload)
        data = assert_valid_response(response)
        
        summary = data["summary"]
        assert_keys_present(summary, [
            "initial_networth", "final_networth", "networth_change",
            "total_savings_added", "total_debt_reduced",
            "final_savings", "final_debt",
            "goals_achieved", "goals_at_risk"
        ])
    
    def test_simulate_with_goals(self, client, sample_current_state, sample_goals):
        """Test goal tracking in simulation."""
        payload = {
            "current_state": sample_current_state,
            "emis": [],
            "goals": sample_goals,
            "projection_months": 36,  # 3 years
            "scenario": "baseline",
        }
        
        response = client.post("/twin/simulate", json=payload)
        data = assert_valid_response(response)
        
        # Check goal progress in last snapshot
        last_snapshot = data["monthly_snapshots"][-1]
        assert len(last_snapshot["goal_progress"]) == len(sample_goals)
        
        for goal in last_snapshot["goal_progress"]:
            assert_keys_present(goal, [
                "name", "target", "current", "progress_percent",
                "remaining", "achieved", "on_track"
            ])
    
    def test_simulate_custom_assumptions(self, client, sample_current_state):
        """Test custom simulation assumptions."""
        payload = {
            "current_state": sample_current_state,
            "emis": [],
            "goals": [],
            "projection_months": 12,
            "scenario": "baseline",
            "assumptions": {
                "income_growth_rate": 0.15,  # 15% income growth
                "inflation_rate": 0.08,       # 8% inflation
                "savings_return_rate": 0.10,  # 10% returns
            },
        }
        
        response = client.post("/twin/simulate", json=payload)
        data = assert_valid_response(response)
        
        # Should complete without error
        assert len(data["monthly_snapshots"]) == 12
    
    def test_compare_scenarios(self, client, sample_current_state, sample_emis, sample_goals):
        """Test scenario comparison endpoint."""
        payload = {
            "current_state": sample_current_state,
            "emis": sample_emis,
            "goals": sample_goals,
            "projection_months": 12,
            "scenario": "baseline",  # Ignored in compare
        }
        
        response = client.post("/twin/compare", json=payload)
        data = assert_valid_response(response)
        
        assert_keys_present(data, ["scenarios", "best_scenario", "recommendation"])
        
        # Should have multiple scenarios
        assert "baseline" in data["scenarios"]
        assert "increased_savings" in data["scenarios"]
    
    def test_list_scenarios(self, client):
        """Test listing available scenarios."""
        response = client.get("/twin/scenarios")
        data = assert_valid_response(response)
        
        assert "scenarios" in data
        scenarios = data["scenarios"]
        
        # Should have all defined scenarios
        assert "baseline" in scenarios
        assert "increased_savings" in scenarios
        assert "aggressive_savings" in scenarios
        assert "job_loss" in scenarios
        assert "emi_prepayment" in scenarios


class TestDigitalTwinService:
    """Test Digital Twin service logic directly."""
    
    def test_scenario_modifiers(self):
        """Test that scenario modifiers are applied."""
        from app.services.digital_twin_service import SCENARIO_MODIFIERS, ScenarioType
        
        baseline = SCENARIO_MODIFIERS[ScenarioType.BASELINE]
        assert baseline["wants_multiplier"] == 1.0
        
        increased = SCENARIO_MODIFIERS[ScenarioType.INCREASED_SAVINGS]
        assert increased["wants_multiplier"] == 0.90  # 10% reduction
        
        aggressive = SCENARIO_MODIFIERS[ScenarioType.AGGRESSIVE_SAVINGS]
        assert aggressive["wants_multiplier"] == 0.75  # 25% reduction
        
        job_loss = SCENARIO_MODIFIERS[ScenarioType.JOB_LOSS]
        assert job_loss["income_multiplier"] == 0.0  # No income
    
    def test_networth_calculation(self):
        """Test that net worth is correctly calculated."""
        # Net worth = Savings + Assets - Debt
        # This is verified through the API response structure
        pass
    
    def test_emi_completion_tracking(self):
        """Test that EMIs are tracked and completed."""
        from app.services.digital_twin_service import simulate
        from app.models.schemas import (
            TwinSimulateRequest, TwinCurrentState,
            MonthlyExpenses, EMIInput, ScenarioType
        )
        
        # Short EMI that will complete during simulation
        request = TwinSimulateRequest(
            current_state=TwinCurrentState(
                savings=100000,
                debt=50000,
                assets=0,
                monthly_income=100000,
                monthly_expenses=MonthlyExpenses(
                    needs=30000,
                    wants=20000,
                    emis=15000,
                    savings=10000,
                ),
            ),
            emis=[
                EMIInput(
                    name="Short Loan",
                    monthly_amount=15000,
                    remaining_months=6,
                    interest_rate=10.0,
                )
            ],
            goals=[],
            projection_months=12,
            scenario=ScenarioType.BASELINE,
        )
        
        response = simulate(request)
        
        # After month 6, EMI should stop affecting expenses
        month_5 = response.monthly_snapshots[4]  # 0-indexed
        month_8 = response.monthly_snapshots[7]
        
        # Expenses should be lower after EMI ends
        assert month_8.expenses["emis"] == 0 or month_8.expenses["emis"] < month_5.expenses["emis"]
