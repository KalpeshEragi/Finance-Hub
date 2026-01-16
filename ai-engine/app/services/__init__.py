"""
@file app/services/__init__.py
@brief Core services package initialization.

@description
This package contains all business logic services:
- Transaction categorization
- Spending behavior analysis (50-30-20)
- Credit/loan analysis
- Tax estimation and suggestions
- Goal planning
- Alert generation
- Digital Twin simulation
"""

from app.services.categorization_service import (
    categorize_transaction,
    categorize_bulk,
)
from app.services.behavior_service import (
    analyze_spending,
)
from app.services.credit_service import (
    analyze_credit,
)
from app.services.tax_service import (
    estimate_tax,
    get_tax_suggestions,
)
from app.services.goal_service import (
    plan_goals,
)
from app.services.alert_service import (
    check_alerts,
)

__all__ = [
    "categorize_transaction",
    "categorize_bulk",
    "analyze_spending",
    "analyze_credit",
    "estimate_tax",
    "get_tax_suggestions",
    "plan_goals",
    "check_alerts",
]
