"""
@file tests/conftest.py
@brief pytest configuration and shared fixtures.

@description
Contains fixtures used across all test modules:
- TestClient for API testing
- Sample data factories
- Common test utilities
"""

import pytest
from datetime import date
from fastapi.testclient import TestClient

from main import app


# =============================================================================
# API CLIENT FIXTURE
# =============================================================================

@pytest.fixture(scope="module")
def client():
    """
    @brief Create TestClient for API testing.
    
    @return TestClient instance
    """
    with TestClient(app) as test_client:
        yield test_client


# =============================================================================
# SAMPLE DATA FIXTURES
# =============================================================================

@pytest.fixture
def sample_transactions():
    """
    @brief Sample transactions for testing.
    
    @return List of transaction dictionaries
    """
    return [
        {
            "id": "txn_001",
            "description": "Swiggy Order #12345",
            "merchant": "Swiggy",
            "amount": 450.00,
            "date": "2024-08-15",
        },
        {
            "id": "txn_002",
            "description": "Monthly Rent Payment",
            "merchant": None,
            "amount": 25000.00,
            "date": "2024-08-01",
        },
        {
            "id": "txn_003",
            "description": "Amazon Prime Subscription",
            "merchant": "Amazon",
            "amount": 1499.00,
            "date": "2024-08-10",
        },
        {
            "id": "txn_004",
            "description": "Electricity Bill - TATA Power",
            "merchant": "TATA Power",
            "amount": 2500.00,
            "date": "2024-08-05",
        },
        {
            "id": "txn_005",
            "description": "SIP Investment - Groww",
            "merchant": "Groww",
            "amount": 10000.00,
            "date": "2024-08-01",
        },
    ]


@pytest.fixture
def sample_loans():
    """
    @brief Sample loans for credit testing.
    
    @return List of loan dictionaries
    """
    return [
        {
            "name": "Home Loan",
            "principal": 5000000,
            "outstanding": 4200000,
            "emi": 45000,
            "interest_rate": 8.5,
            "remaining_months": 180,
        },
        {
            "name": "Car Loan",
            "principal": 800000,
            "outstanding": 350000,
            "emi": 18000,
            "interest_rate": 9.5,
            "remaining_months": 24,
        },
    ]


@pytest.fixture
def sample_income():
    """
    @brief Sample income data for tax testing.
    
    @return Income dictionary
    """
    return {
        "salary": 1200000,
        "rental": 0,
        "business": 0,
        "capital_gains_short": 0,
        "capital_gains_long": 0,
        "other": 0,
    }


@pytest.fixture
def sample_deductions():
    """
    @brief Sample deductions for tax testing.
    
    @return Deductions dictionary
    """
    return {
        "section_80c": 150000,
        "section_80d": 25000,
        "section_80g": 0,
        "section_80e": 0,
        "section_80ccd_1b": 50000,
        "home_loan_interest": 0,
        "hra": 0,
        "lta": 0,
    }


@pytest.fixture
def sample_goals():
    """
    @brief Sample goals for planning tests.
    
    @return List of goal dictionaries
    """
    return [
        {
            "name": "Emergency Fund",
            "target": 300000,
            "current": 100000,
            "deadline": "2025-06-01",
            "priority": 1,
        },
        {
            "name": "New Car",
            "target": 800000,
            "current": 150000,
            "deadline": "2026-12-01",
            "priority": 3,
        },
        {
            "name": "House Down Payment",
            "target": 2000000,
            "current": 500000,
            "deadline": "2028-01-01",
            "priority": 2,
        },
    ]


@pytest.fixture
def sample_current_state():
    """
    @brief Sample current state for Digital Twin testing.
    
    @return Current state dictionary
    """
    return {
        "savings": 500000,
        "debt": 4550000,
        "assets": 200000,
        "monthly_income": 150000,
        "monthly_expenses": {
            "needs": 45000,
            "wants": 25000,
            "emis": 63000,
            "savings": 17000,
        },
    }


@pytest.fixture
def sample_emis():
    """
    @brief Sample EMIs for Digital Twin testing.
    
    @return List of EMI dictionaries
    """
    return [
        {
            "name": "Home Loan",
            "monthly_amount": 45000,
            "remaining_months": 180,
            "interest_rate": 8.5,
        },
        {
            "name": "Car Loan",
            "monthly_amount": 18000,
            "remaining_months": 24,
            "interest_rate": 9.5,
        },
    ]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def assert_valid_response(response, expected_status=200):
    """
    @brief Assert response is valid with expected status.
    
    @param response Response object
    @param expected_status Expected HTTP status code
    """
    assert response.status_code == expected_status, f"Expected {expected_status}, got {response.status_code}: {response.text}"
    return response.json()


def assert_keys_present(data, required_keys):
    """
    @brief Assert all required keys are present in data.
    
    @param data Dictionary to check
    @param required_keys List of required keys
    """
    for key in required_keys:
        assert key in data, f"Missing required key: {key}"
