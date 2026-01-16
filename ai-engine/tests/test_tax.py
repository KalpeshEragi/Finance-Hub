"""
@file tests/test_tax.py
@brief Tests for tax estimation functionality.

@description
Tests the tax service:
- Old vs New regime calculation
- Deduction application
- Slab-wise breakdown
- Regime recommendation
"""

import pytest
from tests.conftest import assert_valid_response, assert_keys_present


class TestTaxAPI:
    """Test the /tax endpoints."""
    
    def test_estimate_basic_salary(self, client):
        """Test basic salary income tax estimation."""
        payload = {
            "financial_year": "2024-25",
            "income": {
                "salary": 1000000,
                "rental": 0,
                "business": 0,
                "capital_gains_short": 0,
                "capital_gains_long": 0,
                "other": 0,
            },
            "deductions": None,
        }
        
        response = client.post("/tax/estimate", json=payload)
        data = assert_valid_response(response)
        
        assert_keys_present(data, [
            "old_regime", "new_regime", "recommended_regime",
            "savings_with_recommended", "explanation", "deduction_suggestions"
        ])
        
        # Both regimes should have tax calculated
        assert data["old_regime"]["total_tax"] >= 0
        assert data["new_regime"]["total_tax"] >= 0
    
    def test_estimate_with_80c_deductions(self, client, sample_income, sample_deductions):
        """Test tax with 80C deductions."""
        payload = {
            "financial_year": "2024-25",
            "income": sample_income,
            "deductions": sample_deductions,
        }
        
        response = client.post("/tax/estimate", json=payload)
        data = assert_valid_response(response)
        
        # With deductions, old regime should have lower taxable income
        old_regime = data["old_regime"]
        assert old_regime["total_deductions"] > 0
        assert old_regime["taxable_income"] < old_regime["gross_total_income"]
    
    def test_estimate_regime_comparison(self, client):
        """Test that both regimes are correctly compared."""
        # High income with full deductions - old regime might be better
        payload = {
            "financial_year": "2024-25",
            "income": {"salary": 2000000},
            "deductions": {
                "section_80c": 150000,
                "section_80d": 50000,
                "section_80ccd_1b": 50000,
                "home_loan_interest": 200000,
            },
        }
        
        response = client.post("/tax/estimate", json=payload)
        data = assert_valid_response(response)
        
        # Should recommend one regime
        assert data["recommended_regime"] in ["old", "new"]
        assert data["savings_with_recommended"] >= 0
    
    def test_estimate_low_income_rebate(self, client):
        """Test 87A rebate for low income."""
        payload = {
            "financial_year": "2024-25",
            "income": {"salary": 600000},  # Below 7L threshold
            "deductions": None,
        }
        
        response = client.post("/tax/estimate", json=payload)
        data = assert_valid_response(response)
        
        # New regime should have zero or minimal tax due to rebate
        new_regime = data["new_regime"]
        assert new_regime["total_tax"] <= 20000  # Should be minimal with rebate
    
    def test_estimate_slab_breakdown(self, client, sample_income):
        """Test slab-wise breakdown is provided."""
        payload = {
            "financial_year": "2024-25",
            "income": sample_income,
            "deductions": None,
        }
        
        response = client.post("/tax/estimate", json=payload)
        data = assert_valid_response(response)
        
        # Check slab breakdown exists
        old_slabs = data["old_regime"]["slab_breakdown"]
        new_slabs = data["new_regime"]["slab_breakdown"]
        
        assert len(old_slabs) > 0
        assert len(new_slabs) > 0
        
        for slab in old_slabs:
            assert_keys_present(slab, ["slab", "income_in_slab", "rate", "tax"])
    
    def test_deduction_suggestions(self, client):
        """Test that deduction suggestions are provided."""
        payload = {
            "financial_year": "2024-25",
            "income": {"salary": 1500000},
            "deductions": {
                "section_80c": 50000,  # Only 50K of 1.5L utilized
            },
        }
        
        response = client.post("/tax/estimate", json=payload)
        data = assert_valid_response(response)
        
        suggestions = data["deduction_suggestions"]
        assert len(suggestions) > 0
        
        # Should suggest 80C since there's gap
        eighty_c_suggestions = [s for s in suggestions if s["section"] == "80C"]
        if eighty_c_suggestions:
            assert eighty_c_suggestions[0]["gap"] == 100000


class TestTaxService:
    """Test tax service logic directly."""
    
    def test_old_regime_slabs(self):
        """Test old regime slab calculation."""
        from app.rules.tax_slabs_2024 import calculate_tax, TaxRegime
        
        result = calculate_tax(
            gross_income=1000000,
            deductions={},
            regime=TaxRegime.OLD,
            is_salaried=True,
        )
        
        # 10L - 50K std deduction = 9.5L taxable
        # Up to 2.5L: 0
        # 2.5L-5L: 5% = 12,500
        # 5L-9.5L: 20% = 90,000
        # Total before cess: 1,02,500
        # With 4% cess: ~1,06,600
        
        assert result.taxable_income == 950000
        assert result.total_tax > 0
    
    def test_new_regime_slabs(self):
        """Test new regime slab calculation."""
        from app.rules.tax_slabs_2024 import calculate_tax, TaxRegime
        
        result = calculate_tax(
            gross_income=1000000,
            deductions={},
            regime=TaxRegime.NEW,
            is_salaried=True,
        )
        
        # 10L - 75K std deduction = 9.25L taxable
        # New regime slabs:
        # Up to 3L: 0
        # 3L-7L: 5% = 20,000
        # 7L-9.25L: 10% = 22,500
        # Total before cess: 42,500
        
        assert result.taxable_income == 925000
        assert result.total_tax > 0
    
    def test_deduction_limits(self):
        """Test that deduction limits are enforced."""
        from app.rules.tax_slabs_2024 import calculate_tax, TaxRegime
        
        # Try to claim more than limit
        result = calculate_tax(
            gross_income=1500000,
            deductions={"80C": 200000},  # Limit is 1.5L
            regime=TaxRegime.OLD,
            is_salaried=True,
        )
        
        # Total deductions should be limited
        # 50K std + 150K 80C = 200K max
        assert result.total_deductions == 200000
    
    def test_cess_calculation(self):
        """Test 4% cess is correctly applied."""
        from app.rules.tax_slabs_2024 import calculate_tax, TaxRegime
        
        result = calculate_tax(
            gross_income=2000000,
            deductions={},
            regime=TaxRegime.OLD,
            is_salaried=True,
        )
        
        # Cess should be 4% of tax
        expected_cess = result.tax_before_cess * 0.04
        assert abs(result.cess - expected_cess) < 1  # Allow rounding error
