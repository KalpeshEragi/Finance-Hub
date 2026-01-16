"""
@file tests/test_categorization.py
@brief Tests for transaction categorization functionality.

@description
Tests the categorization service and API endpoint:
- Keyword matching
- Category assignment
- 50-30-20 bucket classification
- Confidence scoring
- Bulk categorization
"""

import pytest
from tests.conftest import assert_valid_response, assert_keys_present


class TestCategorizationAPI:
    """Test the /categorize API endpoint."""
    
    def test_categorize_single_transaction(self, client):
        """Test categorizing a single transaction."""
        payload = {
            "transactions": [
                {
                    "id": "test_001",
                    "description": "Swiggy Order",
                    "amount": 500.00,
                }
            ]
        }
        
        response = client.post("/categorize", json=payload)
        data = assert_valid_response(response)
        
        assert data["total"] == 1
        assert len(data["results"]) == 1
        
        result = data["results"][0]
        assert result["id"] == "test_001"
        assert result["category"] == "Food & Dining"
        assert result["bucket"] == "wants"
        assert result["confidence"] >= 0.5
    
    def test_categorize_bulk_transactions(self, client, sample_transactions):
        """Test categorizing multiple transactions."""
        payload = {"transactions": sample_transactions}
        
        response = client.post("/categorize", json=payload)
        data = assert_valid_response(response)
        
        assert data["total"] == len(sample_transactions)
        assert len(data["results"]) == len(sample_transactions)
        assert data["categorized"] + data["uncategorized"] == data["total"]
    
    def test_categorize_needs_bucket(self, client):
        """Test that essential expenses get 'needs' bucket."""
        payload = {
            "transactions": [
                {"id": "1", "description": "Monthly Rent", "amount": 25000},
                {"id": "2", "description": "Electricity Bill", "amount": 2000},
                {"id": "3", "description": "Grocery BigBasket", "amount": 5000},
            ]
        }
        
        response = client.post("/categorize", json=payload)
        data = assert_valid_response(response)
        
        for result in data["results"]:
            assert result["bucket"] == "needs", f"Expected 'needs' for {result['category']}"
    
    def test_categorize_wants_bucket(self, client):
        """Test that discretionary expenses get 'wants' bucket."""
        payload = {
            "transactions": [
                {"id": "1", "description": "Netflix Subscription", "amount": 499},
                {"id": "2", "description": "Zomato Dinner", "amount": 800},
                {"id": "3", "description": "Amazon Shopping", "amount": 2500},
            ]
        }
        
        response = client.post("/categorize", json=payload)
        data = assert_valid_response(response)
        
        for result in data["results"]:
            assert result["bucket"] == "wants", f"Expected 'wants' for {result['category']}"
    
    def test_categorize_savings_bucket(self, client):
        """Test that investments get 'savings' bucket."""
        payload = {
            "transactions": [
                {"id": "1", "description": "SIP Groww Mutual Fund", "amount": 10000},
                {"id": "2", "description": "PPF Deposit", "amount": 50000},
            ]
        }
        
        response = client.post("/categorize", json=payload)
        data = assert_valid_response(response)
        
        for result in data["results"]:
            assert result["bucket"] == "savings", f"Expected 'savings' for {result['category']}"
    
    def test_categorize_unknown_transaction(self, client):
        """Test categorization of unknown transaction."""
        payload = {
            "transactions": [
                {
                    "id": "unknown_001",
                    "description": "Random XYZ Transfer ABC123",
                    "amount": 1000,
                }
            ]
        }
        
        response = client.post("/categorize", json=payload)
        data = assert_valid_response(response)
        
        result = data["results"][0]
        # Unknown transactions should have low confidence
        assert result["confidence"] <= 0.5 or result["category"] == "Uncategorized"
    
    def test_categorize_with_merchant(self, client):
        """Test that merchant name is used for categorization."""
        payload = {
            "transactions": [
                {
                    "id": "merchant_001",
                    "description": "Order #12345",  # Vague description
                    "merchant": "Dominos",  # Clear merchant
                    "amount": 700,
                }
            ]
        }
        
        response = client.post("/categorize", json=payload)
        data = assert_valid_response(response)
        
        result = data["results"][0]
        assert result["category"] == "Food & Dining"
    
    def test_categorize_preserves_existing_category(self, client):
        """Test that pre-assigned category is preserved."""
        payload = {
            "transactions": [
                {
                    "id": "preset_001",
                    "description": "Unknown Transaction",
                    "amount": 5000,
                    "category": "Custom Category",  # Pre-assigned
                }
            ]
        }
        
        response = client.post("/categorize", json=payload)
        data = assert_valid_response(response)
        
        result = data["results"][0]
        assert result["category"] == "Custom Category"
        assert result["confidence"] == 1.0
    
    def test_categorize_empty_list_fails(self, client):
        """Test that empty transaction list is rejected."""
        payload = {"transactions": []}
        
        response = client.post("/categorize", json=payload)
        # Should fail validation
        assert response.status_code == 422
    
    def test_categorize_response_format(self, client, sample_transactions):
        """Test response structure matches schema."""
        payload = {"transactions": sample_transactions}
        
        response = client.post("/categorize", json=payload)
        data = assert_valid_response(response)
        
        # Check top-level keys
        assert_keys_present(data, ["results", "total", "categorized", "uncategorized"])
        
        # Check result item keys
        for result in data["results"]:
            assert_keys_present(result, ["id", "category", "bucket", "confidence"])


class TestCategorizationService:
    """Test categorization service logic directly."""
    
    def test_keyword_matching_case_insensitive(self):
        """Test that keyword matching is case-insensitive."""
        from app.services.categorization_service import categorize_transaction
        from app.models.schemas import TransactionInput
        
        txn_lower = TransactionInput(id="1", description="swiggy order", amount=500)
        txn_upper = TransactionInput(id="2", description="SWIGGY ORDER", amount=500)
        txn_mixed = TransactionInput(id="3", description="Swiggy Order", amount=500)
        
        result_lower = categorize_transaction(txn_lower)
        result_upper = categorize_transaction(txn_upper)
        result_mixed = categorize_transaction(txn_mixed)
        
        # All should get same category
        assert result_lower.category == result_upper.category == result_mixed.category
    
    def test_multi_word_keyword_matching(self):
        """Test matching of multi-word keywords."""
        from app.services.categorization_service import categorize_transaction
        from app.models.schemas import TransactionInput
        
        txn = TransactionInput(
            id="1", 
            description="Tata Power Electricity Bill Payment",
            amount=3000
        )
        
        result = categorize_transaction(txn)
        assert result.category == "Utilities"
        assert result.bucket.value == "needs"
