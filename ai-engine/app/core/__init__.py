"""
@file app/core/__init__.py
@brief Core module containing configuration and utilities.
"""

from .config import settings
from .logging import setup_logging

__all__ = ["settings", "setup_logging"]
