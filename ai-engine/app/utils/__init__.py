"""
@file app/utils/__init__.py
@brief Utility functions package initialization.

@description
This package contains utility functions for:
- Financial mathematical calculations
- Date and financial year utilities
"""

from app.utils.math import (
    calculate_emi,
    compound_interest,
    round_currency,
    calculate_sip_future_value,
)
from app.utils.date_utils import (
    get_financial_year,
    get_fy_dates,
    days_until,
    months_between,
)

__all__ = [
    "calculate_emi",
    "compound_interest",
    "round_currency",
    "calculate_sip_future_value",
    "get_financial_year",
    "get_fy_dates",
    "days_until",
    "months_between",
]
