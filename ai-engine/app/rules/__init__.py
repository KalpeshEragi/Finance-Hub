"""
@file app/rules/__init__.py
@brief Rules engine package initialization.

@description
This package contains all rule-based logic for financial intelligence:
- Category classification rules
- 50-30-20 budget allocation rules
- India-specific tax slabs and deductions
- Credit health evaluation rules

All rules are deterministic and explainable - no ML involved.
"""

from app.rules.budget_rules import (
    CATEGORY_BUCKETS,
    classify_category,
    validate_50_30_20,
)
from app.rules.tax_slabs_2024 import (
    calculate_tax,
    OLD_REGIME_SLABS,
    NEW_REGIME_SLABS,
    DEDUCTION_LIMITS,
)
from app.rules.credit_rules import (
    DTI_THRESHOLDS,
    evaluate_dti,
    calculate_prepayment_benefit,
)

__all__ = [
    "CATEGORY_BUCKETS",
    "classify_category",
    "validate_50_30_20",
    "calculate_tax",
    "OLD_REGIME_SLABS",
    "NEW_REGIME_SLABS",
    "DEDUCTION_LIMITS",
    "DTI_THRESHOLDS",
    "evaluate_dti",
    "calculate_prepayment_benefit",
]
