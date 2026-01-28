"""
@file test_investment_readiness.py
@brief Tests for Investment Readiness Gate functionality.

@description
Tests the Investment Readiness service and API endpoint:
- Rule evaluations (R1-R8)
- Score calculation
- Status determination
- Blocker generation
- Recommendation generation
"""

import pytest
from tests.conftest import assert_valid_response, assert_keys_present


# =============================================================================
# TEST DATA FIXTURES
# =============================================================================

@pytest.fixture
def healthy_snapshot():
    """A financially healthy user - should be READY."""
    return {
        "dashboard": {
            "totalIncome": 50000,
            "totalExpense": 30000,
            "netBalance": 20000,
            "savingsRate": 40,
            "transactionCount": 50,
            "categoryBreakdown": [],
            "monthlyTrends": []
        },
        "budget": {
            "totalBudget": 35000,
            "totalSpent": 30000,
            "remaining": 5000,
            "adherenceRate": 85,
            "budgets": []
        },
        "loans": {
            "totalLoans": 1,
            "activeLoans": 1,
            "totalOutstanding": 100000,
            "totalMonthlyEMI": 5000,
            "totalPrincipal": 150000,
            "averageInterestRate": 10.5,
            "loans": [
                {
                    "name": "Car Loan",
                    "loanType": "vehicle",
                    "outstanding": 100000,
                    "emi": 5000,
                    "interestRate": 10.5,
                    "status": "active"
                }
            ]
        },
        "goals": {
            "totalGoals": 2,
            "activeGoals": 1,
            "completedGoals": 1,
            "totalTargetAmount": 200000,
            "totalSavedAmount": 80000,
            "overallProgress": 40,
            "goals": []
        },
        "riskIndicators": {
            "savingsRate": 40,
            "debtToIncomeRatio": 10,
            "budgetAdherence": 85,
            "goalProgress": 40,
            "emergencyFundCoverage": 6,
            "investmentReadiness": True,
            "riskLevel": "low"
        }
    }


@pytest.fixture
def no_emergency_fund_snapshot():
    """User with no emergency fund - should be NOT_READY."""
    return {
        "dashboard": {
            "totalIncome": 35000,
            "totalExpense": 28000,
            "netBalance": 7000,
            "savingsRate": 20,
            "transactionCount": 30,
            "categoryBreakdown": [],
            "monthlyTrends": []
        },
        "budget": {
            "totalBudget": 30000,
            "totalSpent": 28000,
            "remaining": 2000,
            "adherenceRate": 75,
            "budgets": []
        },
        "loans": {
            "totalLoans": 0,
            "activeLoans": 0,
            "totalOutstanding": 0,
            "totalMonthlyEMI": 0,
            "totalPrincipal": 0,
            "averageInterestRate": 0,
            "loans": []
        },
        "goals": {
            "totalGoals": 1,
            "activeGoals": 1,
            "completedGoals": 0,
            "totalTargetAmount": 100000,
            "totalSavedAmount": 15000,
            "overallProgress": 15,
            "goals": []
        },
        "riskIndicators": {
            "savingsRate": 20,
            "debtToIncomeRatio": 0,
            "budgetAdherence": 75,
            "goalProgress": 15,
            "emergencyFundCoverage": 0.5,
            "investmentReadiness": False,
            "riskLevel": "moderate"
        }
    }


@pytest.fixture
def high_emi_snapshot():
    """User with high EMI burden - should be NOT_READY."""
    return {
        "dashboard": {
            "totalIncome": 40000,
            "totalExpense": 38000,
            "netBalance": 2000,
            "savingsRate": 5,
            "transactionCount": 40,
            "categoryBreakdown": [],
            "monthlyTrends": []
        },
        "budget": {
            "totalBudget": 35000,
            "totalSpent": 35000,
            "remaining": 0,
            "adherenceRate": 60,
            "budgets": []
        },
        "loans": {
            "totalLoans": 2,
            "activeLoans": 2,
            "totalOutstanding": 500000,
            "totalMonthlyEMI": 20000,
            "totalPrincipal": 600000,
            "averageInterestRate": 12,
            "loans": [
                {
                    "name": "Personal Loan",
                    "loanType": "personal",
                    "outstanding": 200000,
                    "emi": 10000,
                    "interestRate": 14,
                    "status": "active"
                },
                {
                    "name": "Car Loan",
                    "loanType": "vehicle",
                    "outstanding": 300000,
                    "emi": 10000,
                    "interestRate": 10,
                    "status": "active"
                }
            ]
        },
        "goals": {
            "totalGoals": 0,
            "activeGoals": 0,
            "completedGoals": 0,
            "totalTargetAmount": 0,
            "totalSavedAmount": 0,
            "overallProgress": 0,
            "goals": []
        },
        "riskIndicators": {
            "savingsRate": 5,
            "debtToIncomeRatio": 50,
            "budgetAdherence": 60,
            "goalProgress": 0,
            "emergencyFundCoverage": 1,
            "investmentReadiness": False,
            "riskLevel": "high"
        }
    }


@pytest.fixture
def high_interest_debt_snapshot():
    """User with high-interest debt (credit card) - should be NOT_READY."""
    return {
        "dashboard": {
            "totalIncome": 45000,
            "totalExpense": 35000,
            "netBalance": 10000,
            "savingsRate": 22,
            "transactionCount": 35,
            "categoryBreakdown": [],
            "monthlyTrends": []
        },
        "budget": {
            "totalBudget": 38000,
            "totalSpent": 35000,
            "remaining": 3000,
            "adherenceRate": 80,
            "budgets": []
        },
        "loans": {
            "totalLoans": 1,
            "activeLoans": 1,
            "totalOutstanding": 80000,
            "totalMonthlyEMI": 4000,
            "totalPrincipal": 80000,
            "averageInterestRate": 24,
            "loans": [
                {
                    "name": "Credit Card Debt",
                    "loanType": "credit_card",
                    "outstanding": 80000,
                    "emi": 4000,
                    "interestRate": 24,
                    "status": "active"
                }
            ]
        },
        "goals": {
            "totalGoals": 1,
            "activeGoals": 1,
            "completedGoals": 0,
            "totalTargetAmount": 100000,
            "totalSavedAmount": 30000,
            "overallProgress": 30,
            "goals": []
        },
        "riskIndicators": {
            "savingsRate": 22,
            "debtToIncomeRatio": 9,
            "budgetAdherence": 80,
            "goalProgress": 30,
            "emergencyFundCoverage": 4,
            "investmentReadiness": False,
            "riskLevel": "moderate"
        }
    }


@pytest.fixture
def caution_snapshot():
    """User with minor issues - should be CAUTION."""
    return {
        "dashboard": {
            "totalIncome": 30000,
            "totalExpense": 25000,
            "netBalance": 5000,
            "savingsRate": 17,
            "transactionCount": 25,
            "categoryBreakdown": [],
            "monthlyTrends": []
        },
        "budget": {
            "totalBudget": 28000,
            "totalSpent": 25000,
            "remaining": 3000,
            "adherenceRate": 65,
            "budgets": []
        },
        "loans": {
            "totalLoans": 0,
            "activeLoans": 0,
            "totalOutstanding": 0,
            "totalMonthlyEMI": 0,
            "totalPrincipal": 0,
            "averageInterestRate": 0,
            "loans": []
        },
        "goals": {
            "totalGoals": 2,
            "activeGoals": 2,
            "completedGoals": 0,
            "totalTargetAmount": 150000,
            "totalSavedAmount": 10000,
            "overallProgress": 7,
            "goals": []
        },
        "riskIndicators": {
            "savingsRate": 17,
            "debtToIncomeRatio": 0,
            "budgetAdherence": 65,
            "goalProgress": 7,
            "emergencyFundCoverage": 2.5,
            "investmentReadiness": False,
            "riskLevel": "moderate"
        }
    }


@pytest.fixture
def negative_balance_snapshot():
    """User with negative balance - should be NOT_READY."""
    return {
        "dashboard": {
            "totalIncome": 25000,
            "totalExpense": 30000,
            "netBalance": -5000,
            "savingsRate": -20,
            "transactionCount": 30,
            "categoryBreakdown": [],
            "monthlyTrends": []
        },
        "budget": {
            "totalBudget": 25000,
            "totalSpent": 30000,
            "remaining": -5000,
            "adherenceRate": 40,
            "budgets": []
        },
        "loans": {
            "totalLoans": 0,
            "activeLoans": 0,
            "totalOutstanding": 0,
            "totalMonthlyEMI": 0,
            "totalPrincipal": 0,
            "averageInterestRate": 0,
            "loans": []
        },
        "goals": {
            "totalGoals": 0,
            "activeGoals": 0,
            "completedGoals": 0,
            "totalTargetAmount": 0,
            "totalSavedAmount": 0,
            "overallProgress": 0,
            "goals": []
        },
        "riskIndicators": {
            "savingsRate": -20,
            "debtToIncomeRatio": 0,
            "budgetAdherence": 40,
            "goalProgress": 0,
            "emergencyFundCoverage": 0,
            "investmentReadiness": False,
            "riskLevel": "high"
        }
    }


# =============================================================================
# API ENDPOINT TESTS
# =============================================================================

class TestInvestmentReadinessAPI:
    """Test the /investment/readiness API endpoint."""

    def test_readiness_healthy_user_returns_ready(self, client, healthy_snapshot):
        """Test that a healthy user gets READY status."""
        response = client.post("/investment/readiness", json=healthy_snapshot)
        data = assert_valid_response(response)
        
        assert data["status"] == "READY"
        assert data["score"] >= 70
        assert len(data["recommendations"]) > 0

    def test_readiness_no_emergency_fund_returns_not_ready(self, client, no_emergency_fund_snapshot):
        """Test that no emergency fund triggers NOT_READY."""
        response = client.post("/investment/readiness", json=no_emergency_fund_snapshot)
        data = assert_valid_response(response)
        
        assert data["status"] == "NOT_READY"
        assert data["score"] < 70
        # Should have R1 blocker
        r1_blockers = [b for b in data["blockers"] if b["rule"] == "R1"]
        assert len(r1_blockers) > 0

    def test_readiness_high_emi_returns_not_ready(self, client, high_emi_snapshot):
        """Test that high EMI-to-income ratio triggers NOT_READY."""
        response = client.post("/investment/readiness", json=high_emi_snapshot)
        data = assert_valid_response(response)
        
        assert data["status"] == "NOT_READY"
        # Should have R2 blocker
        r2_blockers = [b for b in data["blockers"] if b["rule"] == "R2"]
        assert len(r2_blockers) > 0

    def test_readiness_high_interest_debt_returns_not_ready(self, client, high_interest_debt_snapshot):
        """Test that high-interest debt triggers NOT_READY."""
        response = client.post("/investment/readiness", json=high_interest_debt_snapshot)
        data = assert_valid_response(response)
        
        assert data["status"] == "NOT_READY"
        # Should have R3 blocker
        r3_blockers = [b for b in data["blockers"] if b["rule"] == "R3"]
        assert len(r3_blockers) > 0

    def test_readiness_caution_user(self, client, caution_snapshot):
        """Test that minor issues trigger CAUTION status."""
        response = client.post("/investment/readiness", json=caution_snapshot)
        data = assert_valid_response(response)
        
        # Should be either CAUTION or NOT_READY depending on scoring
        assert data["status"] in ["CAUTION", "NOT_READY"]
        assert data["score"] < 70
        assert len(data["blockers"]) > 0

    def test_readiness_negative_balance_returns_not_ready(self, client, negative_balance_snapshot):
        """Test that negative balance triggers NOT_READY."""
        response = client.post("/investment/readiness", json=negative_balance_snapshot)
        data = assert_valid_response(response)
        
        assert data["status"] == "NOT_READY"
        # Should have R6 blocker
        r6_blockers = [b for b in data["blockers"] if b["rule"] == "R6"]
        assert len(r6_blockers) > 0

    def test_readiness_response_format(self, client, healthy_snapshot):
        """Test that response has correct structure."""
        response = client.post("/investment/readiness", json=healthy_snapshot)
        data = assert_valid_response(response)
        
        assert_keys_present(data, ["status", "score", "reasons", "blockers", "recommendations"])
        assert data["status"] in ["READY", "CAUTION", "NOT_READY"]
        assert 0 <= data["score"] <= 100
        assert isinstance(data["reasons"], list)
        assert isinstance(data["blockers"], list)
        assert isinstance(data["recommendations"], list)

    def test_readiness_blockers_have_required_fields(self, client, no_emergency_fund_snapshot):
        """Test that blockers have all required fields."""
        response = client.post("/investment/readiness", json=no_emergency_fund_snapshot)
        data = assert_valid_response(response)
        
        for blocker in data["blockers"]:
            assert_keys_present(
                blocker, 
                ["rule", "description", "current", "threshold", "severity", "message"]
            )
            assert blocker["severity"] in ["high", "medium", "low"]

    def test_readiness_rules_endpoint(self, client):
        """Test the /investment/readiness/rules endpoint."""
        response = client.get("/investment/readiness/rules")
        data = assert_valid_response(response)
        
        assert "rules" in data
        assert "scoring" in data
        assert len(data["rules"]) == 8  # R1-R8
        
        # Check scoring thresholds
        assert data["scoring"]["base_score"] == 100
        assert data["scoring"]["ready_threshold"] == 70
        assert data["scoring"]["caution_threshold"] == 40


# =============================================================================
# SERVICE UNIT TESTS
# =============================================================================

class TestInvestmentReadinessService:
    """Test the investment readiness service logic directly."""

    def test_evaluate_returns_correct_type(self):
        """Test that evaluate function returns correct output type."""
        from app.services.investment_readiness_service import evaluate_investment_readiness
        from app.models.investment_readiness import LedgerSnapshotInput, InvestmentReadinessOutput
        
        snapshot = LedgerSnapshotInput()  # Empty snapshot
        result = evaluate_investment_readiness(snapshot)
        
        assert isinstance(result, InvestmentReadinessOutput)

    def test_empty_snapshot_not_ready(self):
        """Test that an empty snapshot (no income) is NOT_READY."""
        from app.services.investment_readiness_service import evaluate_investment_readiness
        from app.models.investment_readiness import LedgerSnapshotInput
        
        snapshot = LedgerSnapshotInput()  # All defaults (zero values)
        result = evaluate_investment_readiness(snapshot)
        
        assert result.status.value == "NOT_READY"
        # Should have R7 blocker (no income data)
        r7_blockers = [b for b in result.blockers if b.rule == "R7"]
        assert len(r7_blockers) > 0

    def test_score_never_negative(self):
        """Test that score is never negative even with many violations."""
        from app.services.investment_readiness_service import evaluate_investment_readiness
        from app.models.investment_readiness import (
            LedgerSnapshotInput, 
            DashboardMetrics,
            RiskIndicatorsInput,
        )
        
        # Create worst-case scenario
        snapshot = LedgerSnapshotInput(
            dashboard=DashboardMetrics(
                totalIncome=0,
                totalExpense=50000,
                netBalance=-50000,
                savingsRate=-100,
            ),
            riskIndicators=RiskIndicatorsInput(
                savingsRate=-100,
                debtToIncomeRatio=100,
                budgetAdherence=0,
                emergencyFundCoverage=0,
            )
        )
        
        result = evaluate_investment_readiness(snapshot)
        
        assert result.score >= 0
        assert result.score <= 100

    def test_perfect_score_possible(self):
        """Test that a perfect user can get score >= 70."""
        from app.services.investment_readiness_service import evaluate_investment_readiness
        from app.models.investment_readiness import (
            LedgerSnapshotInput,
            DashboardMetrics,
            BudgetMetrics,
            GoalMetrics,
            RiskIndicatorsInput,
        )
        
        snapshot = LedgerSnapshotInput(
            dashboard=DashboardMetrics(
                totalIncome=100000,
                totalExpense=50000,
                netBalance=50000,
                savingsRate=50,
            ),
            budget=BudgetMetrics(
                adherenceRate=100,
            ),
            goals=GoalMetrics(
                activeGoals=1,
                overallProgress=50,
            ),
            riskIndicators=RiskIndicatorsInput(
                savingsRate=50,
                debtToIncomeRatio=5,
                budgetAdherence=100,
                goalProgress=50,
                emergencyFundCoverage=12,
            )
        )
        
        result = evaluate_investment_readiness(snapshot)
        
        assert result.status.value == "READY"
        assert result.score >= 70
