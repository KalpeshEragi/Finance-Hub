"""
@file agent_explanation.py (router)
@brief API router for Agent Explanation Layer.

@endpoints
POST /agent/explanation - Full explanation with LLM enhancement
POST /agent/summary - Lightweight summary (template-only)
"""

from fastapi import APIRouter, HTTPException
from app.models.agent_explanation import (
    AgentExplanationInput,
    AgentExplanationOutput,
    AgentSummaryOutput,
)
from app.services.agent_explanation_service import (
    generate_explanation,
    generate_summary,
)


router = APIRouter(
    prefix="/agent",
    tags=["Investment Agent"],
    responses={
        500: {"description": "Internal Server Error"},
    },
)


@router.post(
    "/explanation",
    response_model=AgentExplanationOutput,
    summary="Generate full agent explanation",
    description="""
    Generates a comprehensive, human-readable explanation combining:
    - Investment Readiness (status, score, blockers)
    - Risk Profile (tier, confidence, signals)
    - Recommendations (instruments, allocations)
    
    Supports LLM enhancement for personalized tone.
    Falls back to template-based generation if LLM fails.
    """
)
async def get_explanation(data: AgentExplanationInput) -> AgentExplanationOutput:
    """Generate full explanation with optional LLM enhancement."""
    try:
        result = await generate_explanation(data, use_llm=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation generation failed: {str(e)}")


@router.post(
    "/explanation/template",
    response_model=AgentExplanationOutput,
    summary="Generate template-based explanation",
    description="Fast, deterministic explanation without LLM."
)
async def get_template_explanation(data: AgentExplanationInput) -> AgentExplanationOutput:
    """Generate explanation using templates only (no LLM)."""
    try:
        result = await generate_explanation(data, use_llm=False)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template generation failed: {str(e)}")


@router.post(
    "/summary",
    response_model=AgentSummaryOutput,
    summary="Get lightweight summary",
    description="Fast headline + 3 bullet points for UI display."
)
async def get_summary(data: AgentExplanationInput) -> AgentSummaryOutput:
    """Generate lightweight summary (always template-based)."""
    try:
        return generate_summary(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")
