"""
@file app/routers/health.py
@brief Health check endpoint.

@description
Provides a simple health check endpoint for monitoring and
load balancer health probes.
"""

from datetime import datetime
from fastapi import APIRouter

from app.models.schemas import HealthResponse
from app.core.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    @brief Health check endpoint.
    
    @return HealthResponse with status and version
    
    @details
    Used by:
    - Kubernetes liveness/readiness probes
    - Load balancer health checks
    - Monitoring systems
    """
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        timestamp=datetime.now(),
    )
