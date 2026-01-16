"""
@file app/core/logging.py
@brief Structured logging configuration for the AI Engine.

@description
This module sets up application-wide logging with:
- Structured JSON format for production
- Human-readable format for development
- Log level configuration via environment

@usage
    from app.core.logging import setup_logging
    setup_logging()
"""

import logging
import sys
from typing import Optional

from .config import settings


def setup_logging(log_level: Optional[str] = None) -> None:
    """
    @brief Configure application-wide logging.
    
    @description
    Sets up logging handlers with appropriate formatters based on
    the debug mode. In debug mode, uses human-readable format.
    In production, could be extended to use JSON format.
    
    @param log_level Optional log level override (DEBUG, INFO, WARNING, ERROR).
                     Defaults to DEBUG if settings.DEBUG, else INFO.
    
    @example
        setup_logging()
        setup_logging("WARNING")  # Override log level
    """
    # Determine log level
    if log_level:
        level = getattr(logging, log_level.upper(), logging.INFO)
    else:
        level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    # Define format
    if settings.DEBUG:
        # Human-readable format for development
        log_format = (
            "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"
        )
        date_format = "%Y-%m-%d %H:%M:%S"
    else:
        # Compact format for production
        log_format = "%(asctime)s | %(levelname)s | %(message)s"
        date_format = "%Y-%m-%d %H:%M:%S"
    
    # Configure root logger
    logging.basicConfig(
        level=level,
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
        force=True,  # Override any existing configuration
    )
    
    # Suppress noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    # Log initialization
    logger = logging.getLogger(__name__)
    logger.debug(f"Logging initialized at level: {logging.getLevelName(level)}")


def get_logger(name: str) -> logging.Logger:
    """
    @brief Get a named logger instance.
    
    @description
    Factory function for creating loggers with consistent configuration.
    Use this instead of logging.getLogger() directly for consistency.
    
    @param name Logger name (typically __name__ of the calling module).
    
    @return logging.Logger Configured logger instance.
    
    @example
        logger = get_logger(__name__)
        logger.info("Processing request...")
    """
    return logging.getLogger(name)
