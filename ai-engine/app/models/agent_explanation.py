"""
@file agent_explanation.py
@brief Pydantic models for Agent Explanation Layer.

@description
Defines input/output schemas for the Investment Agent's explanation system.
Takes readiness, risk profile, and recommendations as input.
Outputs human-readable, structured explanations.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


# =============================================================================
# ENUMS
# =============================================================================

class ReadinessStatus(str, Enum):
    """Investment readiness status."""
    READY = "READY"
    CAUTION = "CAUTION"
    NOT_READY = "NOT_READY"


class RiskProfileTier(str, Enum):
    """Risk profile classification."""
    STABILITY_FOCUSED = "Stability-Focused"
    GROWTH_READY = "Growth-Ready"
    GROWTH_OPTIMIZED = "Growth-Optimized"


class InsightType(str, Enum):
    """Type of insight for display."""
    STRENGTH = "strength"
    CAUTION = "caution"
    BLOCKER = "blocker"


# =============================================================================
# INPUT MODELS
# =============================================================================

class BlockerInput(BaseModel):
    """Blocker from readiness evaluation."""
    rule_id: str = Field(..., description="Rule identifier (R1-R8)")
    severity: Literal["high", "medium", "low"]
    description: str
    message: str
    action_required: str


class ReadinessInput(BaseModel):
    """Investment readiness result."""
    status: ReadinessStatus
    score: int = Field(..., ge=0, le=100)
    blockers: List[BlockerInput] = []
    reasons: List[str] = []


class SignalInput(BaseModel):
    """Single risk profile signal."""
    value: float
    level: str
    description: str


class RiskProfileInput(BaseModel):
    """Risk profile classification result."""
    profile: RiskProfileTier
    confidence: int = Field(..., ge=0, le=100)
    reasoning: List[str] = []
    signals: dict = Field(default_factory=dict)


class RecommendationInput(BaseModel):
    """Investment recommendation."""
    id: str
    type: str
    name: str
    allocation: str  # "10-15%"
    monthly_amount: int
    reason: str
    action_item: str
    priority: int
    risk_level: Literal["low", "medium", "high"]
    tax_benefit: bool


class FinancialContextInput(BaseModel):
    """User's financial context."""
    monthly_income: float
    monthly_surplus: float
    savings_rate: float
    emergency_fund_months: float
    debt_to_income_ratio: float


class AgentExplanationInput(BaseModel):
    """Complete input for explanation generation."""
    readiness: ReadinessInput
    risk_profile: RiskProfileInput
    recommendations: List[RecommendationInput]
    financial_context: FinancialContextInput


# =============================================================================
# OUTPUT MODELS
# =============================================================================

class KeyInsight(BaseModel):
    """Single insight for display."""
    type: InsightType
    message: str
    priority: int = Field(default=1, ge=1, le=3)


class AgentExplanationOutput(BaseModel):
    """Complete agent explanation output."""
    headline: str = Field(..., description="Main headline based on readiness")
    summary: List[str] = Field(
        ..., 
        description="2-3 concise bullet points",
        min_items=1,
        max_items=3
    )
    key_insights: List[KeyInsight] = Field(
        default_factory=list,
        description="Strengths, cautions, and blockers"
    )
    action_plan: List[str] = Field(
        ...,
        description="2-3 specific next steps",
        min_items=1,
        max_items=3
    )
    personal_note: str = Field(..., description="Encouraging closing remark")
    metadata: dict = Field(
        default_factory=dict,
        description="Additional metadata for frontend"
    )


class AgentSummaryOutput(BaseModel):
    """Lightweight summary for quick display."""
    headline: str
    summary: List[str]
    readiness_status: ReadinessStatus
    risk_profile: RiskProfileTier
