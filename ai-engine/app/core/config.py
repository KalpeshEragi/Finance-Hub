"""
@file app/core/config.py
@brief Application configuration using Pydantic Settings.

@description
This module provides centralized configuration management for the AI Engine.
All settings are loaded from environment variables with sensible defaults.
Configuration is validated at startup using Pydantic.

@usage
    from app.core.config import settings
    print(settings.APP_NAME)
"""

from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    @class Settings
    @brief Application settings with environment variable support.
    
    @description
    All settings can be overridden via environment variables.
    Environment variable names match the field names (case-insensitive).
    
    @example
        # Set via environment:
        export APP_NAME="My AI Engine"
        export DEBUG=true
    """
    
    # =========================================================================
    # APPLICATION SETTINGS
    # =========================================================================
    
    APP_NAME: str = "Personal Finance AI Engine"
    """@brief Application display name."""
    
    VERSION: str = "1.0.0"
    """@brief Semantic version number."""
    
    DEBUG: bool = True
    """@brief Enable debug mode (enables /docs, detailed errors)."""
    
    # =========================================================================
    # SERVER SETTINGS
    # =========================================================================
    
    HOST: str = "0.0.0.0"
    """@brief Host address to bind the server."""
    
    PORT: int = 8000
    """@brief Port number for the server."""
    
    # =========================================================================
    # CORS SETTINGS
    # =========================================================================
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",      # Next.js frontend
        "http://localhost:5000",      # Node.js backend
        "http://localhost:5173",      # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5000",
    ]
    """@brief Allowed origins for CORS requests."""
    
    # =========================================================================
    # FINANCIAL DEFAULTS
    # =========================================================================
    
    DEFAULT_CURRENCY: str = "INR"
    """@brief Default currency code (Indian Rupee)."""
    
    FINANCIAL_YEAR_START_MONTH: int = 4
    """@brief Financial year starts in April (month 4)."""
    
    DEFAULT_INFLATION_RATE: float = 0.06
    """@brief Default annual inflation rate (6%)."""
    
    DEFAULT_SAVINGS_RETURN_RATE: float = 0.07
    """@brief Default annual return on savings (7%)."""
    
    DEFAULT_INCOME_GROWTH_RATE: float = 0.08
    """@brief Default annual income growth rate (8%)."""
    
    # =========================================================================
    # 50-30-20 BUDGET RULE DEFAULTS
    # =========================================================================
    
    BUDGET_NEEDS_PERCENT: float = 50.0
    """@brief Maximum percentage of income for needs."""
    
    BUDGET_WANTS_PERCENT: float = 30.0
    """@brief Maximum percentage of income for wants."""
    
    BUDGET_SAVINGS_PERCENT: float = 20.0
    """@brief Minimum percentage of income for savings."""
    
    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    @brief Factory function for cached settings instance.
    
    @description
    Uses LRU cache to ensure settings are only loaded once.
    This improves performance by avoiding repeated file/env parsing.
    
    @return Settings Cached settings instance.
    """
    return Settings()


# Global settings instance
settings = get_settings()
