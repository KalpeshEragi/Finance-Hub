"""
@file main.py
@brief FastAPI application entry point for the AI Engine.

@description
This is the main entry point for the Personal Finance AI Engine.
It initializes the FastAPI application, configures CORS for cross-origin
requests from the Node.js backend, and registers all API routers.

@architecture
The AI Engine is a stateless microservice that:
- Receives JSON payloads from the Node.js backend
- Processes financial intelligence requests
- Returns deterministic, explainable results

@author HackVengers Team
@version 1.0.0
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging

# Initialize logging early
setup_logging()
logger = logging.getLogger(__name__)


# =============================================================================
# LIFESPAN CONTEXT MANAGER
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    @brief Modern lifespan handler for startup and shutdown events.
    
    @description
    Replaces deprecated on_event handlers. Runs startup code before yield,
    and shutdown code after yield.
    """
    # Startup
    logger.info(f"🚀 {settings.APP_NAME} v{settings.VERSION} starting...")
    logger.info(f"📊 Debug mode: {settings.DEBUG}")
    logger.info(f"🌐 CORS origins: {settings.CORS_ORIGINS}")
    
    yield  # Application runs here
    
    # Shutdown
    logger.info(f"👋 {settings.APP_NAME} shutting down...")


# Import routers after logging is set up
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

# =============================================================================
# APPLICATION INITIALIZATION
# =============================================================================

# Create FastAPI application instance with lifespan
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered Personal Finance Intelligence Engine",
    version=settings.VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# =============================================================================
# CORS CONFIGURATION
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# ROUTER REGISTRATION
# =============================================================================

# Health check endpoint
app.include_router(health.router, tags=["Health"])

# Transaction categorization
app.include_router(categorize.router, prefix="/categorize", tags=["Categorization"])

# Spending behavior analysis
app.include_router(behavior.router, prefix="/behavior", tags=["Behavior Analysis"])

# Credit and loan analysis
app.include_router(credit.router, prefix="/credit", tags=["Credit Analysis"])

# Tax estimation and ITR support
app.include_router(tax.router, prefix="/tax", tags=["Tax"])

# Goal-based savings planning
app.include_router(goals.router, prefix="/goals", tags=["Goals"])

# Digital Financial Twin simulation
app.include_router(digital_twin.router, prefix="/twin", tags=["Digital Twin"])

# Alerts and reminders
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])

# Document parsing (bank statements)
app.include_router(parse.router, prefix="/parse", tags=["Document Parsing"])

# =============================================================================
# ROOT ENDPOINT
# =============================================================================

@app.get("/", include_in_schema=False)
async def root():
    """
    @brief Root endpoint returning API information.
    
    @return dict Basic API information and available endpoints.
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs" if settings.DEBUG else "disabled",
        "endpoints": [
            "/health",
            "/categorize",
            "/behavior/analyze",
            "/credit/analyze",
            "/tax/estimate",
            "/tax/suggestions",
            "/goals/plan",
            "/twin/simulate",
            "/alerts/check",
        ],
    }



# =============================================================================
# DEVELOPMENT SERVER
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
