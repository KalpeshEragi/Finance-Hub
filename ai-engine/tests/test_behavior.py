"""
@file tests/test_behavior.py
@brief Tests for spending behavior analysis.

@description
Tests the 50-30-20 rule validation:
- Budget breakdown calculation
- Violation detection
- Health scoring
- Suggestion generation
"""

import pytest
from tests.conftest import assert_valid_response, assert_keys_present


class TestBehaviorAPI:
    """Test the /behavior/analyze API endpoint."""
    
    def test_analyze_balanced_budget(self, client):
        """Test analysis of a well-balanced budget."""
        payload = {
            "income": 100000,
            "transactions": [
                {"id": "1", "description": "Rent", "amount": 30000},
                {"id": "2", "description": "Groceries BigBasket", "amount": 10000},
                {"id": "3", "description": "Electricity Bill", "amount": 3000},
                {"id": "4", "description": "Petrol", "amount": 5000},
                {"id": "5", "description": "Netflix", "amount": 500},
                {"id": "6", "description": "Swiggy", "amount": 8000},
                {"id": "7", "description": "Amazon", "amount": 12000},
                {"id": "8", "description": "SIP Groww", "amount": 15000},
                {"id": "9", "description": "PPF", "amount": 5000},
            ],
        }
        
        response = client.post("/behavior/analyze", json=payload)
        data = assert_valid_response(response)
        
        # Check response structure
        assert_keys_present(data, [
            "budget_analysis", "actual", "target", "violations",
            "suggestions", "health_score", "category_breakdown",
            "total_spending", "savings_rate"
        ])
        
        # Health score should be reasonable
        assert 0 <= data["health_score"] <= 100
    
    def test_analyze_overspending_on_wants(self, client):
        """Test detection of wants overspending."""
        payload = {
            "income": 100000,
            "transactions": [
                {"id": "1", "description": "Rent", "amount": 25000},
                {"id": "2", "description": "Netflix", "amount": 500},
                {"id": "3", "description": "Swiggy", "amount": 15000},
                {"id": "4", "description": "Amazon Shopping", "amount": 25000},
                {"id": "5", "description": "Travel Makemytrip", "amount": 20000},
            ],
        }
        
        response = client.post("/behavior/analyze", json=payload)
        data = assert_valid_response(response)
        
        # Should detect wants exceeded
        violations = data["violations"]
        wants_violations = [v for v in violations if v["type"] == "wants_exceeded"]
        assert len(wants_violations) > 0, "Should detect wants overspending"
    
    def test_analyze_savings_deficit(self, client):
        """Test detection of savings deficit."""
        payload = {
            "income": 100000,
            "transactions": [
                {"id": "1", "description": "Rent", "amount": 40000},
                {"id": "2", "description": "Groceries", "amount": 15000},
                {"id": "3", "description": "Utilities", "amount": 5000},
                {"id": "4", "description": "Shopping Amazon", "amount": 35000},
                # Only 5% left for savings
            ],
        }
        
        response = client.post("/behavior/analyze", json=payload)
        data = assert_valid_response(response)
        
        # Should detect savings deficit
        violations = data["violations"]
        savings_violations = [v for v in violations if v["type"] == "savings_deficit"]
        assert len(savings_violations) > 0 or data["savings_rate"] < 20
    
    def test_analyze_response_structure(self, client, sample_transactions):
        """Test complete response structure."""
        payload = {
            "income": 100000,
            "transactions": sample_transactions,
        }
        
        response = client.post("/behavior/analyze", json=payload)
        data = assert_valid_response(response)
        
        # Check actual breakdown
        actual = data["actual"]
        assert_keys_present(actual, ["needs", "wants", "savings"])
        assert actual["needs"] >= 0
        assert actual["wants"] >= 0
        assert actual["savings"] >= 0
        
        # Check target breakdown
        target = data["target"]
        assert target["needs"] == 50.0
        assert target["wants"] == 30.0
        assert target["savings"] == 20.0
        
        # Check category breakdown
        assert len(data["category_breakdown"]) > 0
        for cat in data["category_breakdown"]:
            assert_keys_present(cat, ["category", "bucket", "amount", "percent", "transaction_count"])
    
    def test_analyze_empty_transactions_fails(self, client):
        """Test that empty transactions list is rejected."""
        payload = {
            "income": 100000,
            "transactions": [],
        }
        
        response = client.post("/behavior/analyze", json=payload)
        assert response.status_code == 422
    
    def test_analyze_generates_suggestions(self, client):
        """Test that suggestions are generated."""
        payload = {
            "income": 100000,
            "transactions": [
                {"id": "1", "description": "Rent", "amount": 25000},
                {"id": "2", "description": "Swiggy", "amount": 40000},  # High wants
            ],
        }
        
        response = client.post("/behavior/analyze", json=payload)
        data = assert_valid_response(response)
        
        # Should have suggestions if there are violations
        if data["violations"]:
            assert len(data["suggestions"]) > 0


class TestBehaviorService:
    """Test behavior service logic directly."""
    
    def test_bucket_classification(self):
        """Test correct bucket assignment."""
        from app.rules.budget_rules import classify_category
        
        # Needs categories
        assert classify_category("Groceries") == "needs"
        assert classify_category("Rent & Housing") == "needs"
        assert classify_category("Utilities") == "needs"
        assert classify_category("Healthcare") == "needs"
        
        # Wants categories
        assert classify_category("Food & Dining") == "wants"
        assert classify_category("Entertainment") == "wants"
        assert classify_category("Shopping") == "wants"
        
        # Savings categories
        assert classify_category("Investments") == "savings"
        assert classify_category("Savings") == "savings"
    
    def test_health_score_calculation(self):
        """Test health score ranges."""
        from app.rules.budget_rules import (
            calculate_health_score,
            BudgetBreakdown,
        )
        
        # Perfect 50-30-20 should have high score
        perfect = BudgetBreakdown(needs=50, wants=30, savings=20)
        score_perfect = calculate_health_score(perfect, [])
        assert score_perfect >= 90
        
        # Savings above target should be good
        saver = BudgetBreakdown(needs=45, wants=25, savings=30)
        score_saver = calculate_health_score(saver, [])
        assert score_saver >= 90
    
    def test_violation_detection(self):
        """Test violation detection logic."""
        from app.rules.budget_rules import validate_50_30_20, BudgetBreakdown
        
        # Over needs
        over_needs = BudgetBreakdown(needs=60, wants=25, savings=15)
        is_compliant, violations = validate_50_30_20(over_needs, 100000)
        assert not is_compliant
        assert any(v.violation_type == "needs_exceeded" for v in violations)
        
        # Over wants
        over_wants = BudgetBreakdown(needs=45, wants=40, savings=15)
        is_compliant, violations = validate_50_30_20(over_wants, 100000)
        assert not is_compliant
        assert any(v.violation_type == "wants_exceeded" for v in violations)
        
        # Under savings
        under_savings = BudgetBreakdown(needs=50, wants=40, savings=10)
        is_compliant, violations = validate_50_30_20(under_savings, 100000)
        assert not is_compliant
        assert any(v.violation_type == "savings_deficit" for v in violations)
