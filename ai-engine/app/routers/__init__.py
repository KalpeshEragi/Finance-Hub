"""
@file app/routers/__init__.py
@brief API routers package initialization.

@description
This package contains all FastAPI routers for the AI Engine API.
Each router handles a specific domain of functionality.
"""

from app.routers import (
    health,
    categorize,
    behavior,
    credit,
    tax,
    goals,
    digital_twin,
    alerts,
    parse,
)

__all__ = [
    "health",
    "categorize",
    "behavior",
    "credit",
    "tax",
    "goals",
    "digital_twin",
    "alerts",
    "parse",
]
