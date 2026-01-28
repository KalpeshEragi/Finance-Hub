"""
@file agent_explanation_service.py
@brief Agent Explanation Layer - Core logic.

@description
Generates human-readable, personalized explanations that serve as the
Investment Agent's voice. Combines readiness, risk profile, and recommendations
into actionable guidance.

Supports two modes:
1. Template-based: Deterministic, fast, reliable fallback
2. LLM-enhanced: Personalized tone via Gemini API (optional)
"""

import os
from typing import List, Optional
import google.generativeai as genai

from app.models.agent_explanation import (
    AgentExplanationInput,
    AgentExplanationOutput,
    AgentSummaryOutput,
    KeyInsight,
    InsightType,
    ReadinessStatus,
    RiskProfileTier,
)


# =============================================================================
# CONFIGURATION
# =============================================================================

# Gemini API Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyAuQ3caLyVvd3HIb2KRmwyIc0Z-jHQL9c0")
USE_LLM_ENHANCEMENT = os.getenv("USE_LLM_ENHANCEMENT", "true").lower() == "true"

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


# =============================================================================
# TEMPLATE-BASED GENERATION (Fallback)
# =============================================================================

def _generate_headline(status: ReadinessStatus) -> str:
    """Generate headline based on readiness status."""
    headlines = {
        ReadinessStatus.READY: "You're Ready to Start Investing! 🎉",
        ReadinessStatus.CAUTION: "Almost There — A Few Adjustments Needed",
        ReadinessStatus.NOT_READY: "Let's Build Your Foundation First 🏗️",
    }
    return headlines.get(status, "Let's Review Your Financial Position")


def _generate_summary_points(data: AgentExplanationInput) -> List[str]:
    """Generate 2-3 summary bullet points."""
    points = []
    
    # Point 1: Risk profile context
    profile = data.risk_profile.profile
    confidence = data.risk_profile.confidence
    
    if profile == RiskProfileTier.GROWTH_OPTIMIZED:
        points.append(f"Your {profile.value} profile supports aggressive equity exposure.")
    elif profile == RiskProfileTier.GROWTH_READY:
        points.append(f"Your {profile.value} profile supports moderate equity exposure.")
    else:
        points.append(f"Your {profile.value} profile suggests a conservative approach.")
    
    # Point 2: Top blocker or strength
    if data.readiness.blockers:
        top_blocker = data.readiness.blockers[0]
        points.append(f"Priority: {top_blocker.description}")
    elif data.readiness.status == ReadinessStatus.READY:
        points.append(f"Readiness score of {data.readiness.score}/100 — excellent foundation.")
    
    # Point 3: Top recommendation
    if data.recommendations:
        rec = data.recommendations[0]
        points.append(f"Start with {rec.allocation} of income in {rec.name}.")
    
    return points[:3]


def _generate_key_insights(data: AgentExplanationInput) -> List[KeyInsight]:
    """Extract key insights from all sources."""
    insights = []
    
    # Add blockers (highest priority)
    for blocker in data.readiness.blockers[:2]:
        insights.append(KeyInsight(
            type=InsightType.BLOCKER if blocker.severity == "high" else InsightType.CAUTION,
            message=blocker.message,
            priority=1 if blocker.severity == "high" else 2
        ))
    
    # Add strengths from risk profile reasoning
    for reason in data.risk_profile.reasoning[:2]:
        if "stable" in reason.lower() or "excellent" in reason.lower() or "strong" in reason.lower():
            insights.append(KeyInsight(
                type=InsightType.STRENGTH,
                message=reason,
                priority=2
            ))
        elif "caution" in reason.lower() or "volatile" in reason.lower():
            insights.append(KeyInsight(
                type=InsightType.CAUTION,
                message=reason,
                priority=2
            ))
    
    # Limit to 4 insights
    return sorted(insights, key=lambda x: x.priority)[:4]


def _generate_action_plan(data: AgentExplanationInput) -> List[str]:
    """Generate 2-3 specific action steps."""
    actions = []
    
    # If NOT_READY, focus on fixing blockers
    if data.readiness.status == ReadinessStatus.NOT_READY and data.readiness.blockers:
        top_blocker = data.readiness.blockers[0]
        actions.append(top_blocker.action_required)
    
    # Add recommendation actions
    for rec in data.recommendations[:2]:
        if rec.monthly_amount > 0:
            amount_str = f"₹{rec.monthly_amount:,}"
            actions.append(f"Start {amount_str}/month in {rec.name}.")
        else:
            actions.append(rec.action_item)
    
    # Add automation step if READY or CAUTION
    if data.readiness.status != ReadinessStatus.NOT_READY:
        actions.append("Set up auto-debit for consistent, hassle-free investing.")
    
    return actions[:3]


def _generate_personal_note(data: AgentExplanationInput) -> str:
    """Generate encouraging personal note."""
    status = data.readiness.status
    savings_rate = data.financial_context.savings_rate
    
    if status == ReadinessStatus.READY:
        if savings_rate > 25:
            return f"With a {savings_rate:.0f}% savings rate, you're ahead of most young Indians. Let compounding work for you!"
        else:
            return "You're in a great position to start. Even small, consistent investments grow into significant wealth over time."
    
    elif status == ReadinessStatus.CAUTION:
        return "You're on the right track! Address the small gaps and you'll be fully investment-ready soon."
    
    else:
        ef_months = data.financial_context.emergency_fund_months
        if ef_months < 2:
            return f"Building your emergency fund (currently {ef_months:.1f} months) is the best investment right now. Investing can wait."
        else:
            return "Focus on strengthening your financial foundation first. Investing with weak basics leads to stress, not wealth."


def generate_template_explanation(data: AgentExplanationInput) -> AgentExplanationOutput:
    """Generate explanation using templates (deterministic fallback)."""
    return AgentExplanationOutput(
        headline=_generate_headline(data.readiness.status),
        summary=_generate_summary_points(data),
        key_insights=_generate_key_insights(data),
        action_plan=_generate_action_plan(data),
        personal_note=_generate_personal_note(data),
        metadata={
            "generation_mode": "template",
            "readiness_status": data.readiness.status.value,
            "risk_profile": data.risk_profile.profile.value,
            "confidence": data.risk_profile.confidence,
        }
    )


# =============================================================================
# LLM-ENHANCED GENERATION (Gemini)
# =============================================================================

def _build_llm_prompt(data: AgentExplanationInput) -> str:
    """Build prompt for Gemini API."""
    
    # Format blockers
    blockers_text = ""
    if data.readiness.blockers:
        blockers_text = "\n".join([
            f"  - [{b.severity.upper()}] {b.description}: {b.message}"
            for b in data.readiness.blockers[:3]
        ])
    else:
        blockers_text = "  None"
    
    # Format recommendations
    recs_text = "\n".join([
        f"  {i+1}. {r.name} ({r.allocation} of income, ₹{r.monthly_amount:,}/month)"
        for i, r in enumerate(data.recommendations[:2])
    ])
    
    prompt = f"""You are an Investment Agent providing personalized financial guidance to a young Indian professional (age 18-25, income ₹20K-50K/month).

USER'S FINANCIAL PROFILE:
- Readiness Status: {data.readiness.status.value}
- Readiness Score: {data.readiness.score}/100
- Risk Profile: {data.risk_profile.profile.value}
- Profile Confidence: {data.risk_profile.confidence}%
- Monthly Income: ₹{data.financial_context.monthly_income:,.0f}
- Monthly Surplus: ₹{data.financial_context.monthly_surplus:,.0f}
- Savings Rate: {data.financial_context.savings_rate:.1f}%
- Emergency Fund: {data.financial_context.emergency_fund_months:.1f} months
- Debt-to-Income: {data.financial_context.debt_to_income_ratio:.1f}%

BLOCKERS:
{blockers_text}

RECOMMENDATIONS:
{recs_text or "  None"}

YOUR TASK:
Generate a personalized, encouraging explanation with these exact sections:
1. HEADLINE: One catchy, appropriate headline (include emoji)
2. SUMMARY: Exactly 3 concise bullet points (max 15 words each)
3. ACTION_PLAN: Exactly 3 specific, actionable steps
4. PERSONAL_NOTE: One encouraging sentence (max 20 words)

RULES:
- Be encouraging but honest
- Use simple language (no jargon)
- Reference specific numbers from their profile
- NO market predictions or return promises
- Focus on behavior and habits, not products

Format your response as:
HEADLINE: [your headline]
SUMMARY:
- [point 1]
- [point 2]
- [point 3]
ACTION_PLAN:
1. [step 1]
2. [step 2]
3. [step 3]
PERSONAL_NOTE: [your note]"""

    return prompt


def _parse_llm_response(response_text: str, data: AgentExplanationInput) -> AgentExplanationOutput:
    """Parse LLM response into structured output."""
    lines = response_text.strip().split("\n")
    
    headline = ""
    summary = []
    action_plan = []
    personal_note = ""
    
    current_section = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line.startswith("HEADLINE:"):
            headline = line.replace("HEADLINE:", "").strip()
            current_section = "headline"
        elif line.startswith("SUMMARY:"):
            current_section = "summary"
        elif line.startswith("ACTION_PLAN:"):
            current_section = "action"
        elif line.startswith("PERSONAL_NOTE:"):
            personal_note = line.replace("PERSONAL_NOTE:", "").strip()
            current_section = "note"
        elif current_section == "summary" and line.startswith("-"):
            summary.append(line[1:].strip())
        elif current_section == "action" and (line[0].isdigit() or line.startswith("-")):
            # Remove number prefix and clean
            action = line.lstrip("0123456789.-) ").strip()
            if action:
                action_plan.append(action)
    
    # Fallback to template if parsing failed
    if not headline or len(summary) < 2 or len(action_plan) < 2:
        template_result = generate_template_explanation(data)
        return AgentExplanationOutput(
            headline=headline or template_result.headline,
            summary=summary if len(summary) >= 2 else template_result.summary,
            key_insights=_generate_key_insights(data),
            action_plan=action_plan if len(action_plan) >= 2 else template_result.action_plan,
            personal_note=personal_note or template_result.personal_note,
            metadata={
                "generation_mode": "llm_partial",
                "readiness_status": data.readiness.status.value,
                "risk_profile": data.risk_profile.profile.value,
            }
        )
    
    return AgentExplanationOutput(
        headline=headline,
        summary=summary[:3],
        key_insights=_generate_key_insights(data),  # Always use template for structured insights
        action_plan=action_plan[:3],
        personal_note=personal_note,
        metadata={
            "generation_mode": "llm",
            "readiness_status": data.readiness.status.value,
            "risk_profile": data.risk_profile.profile.value,
        }
    )


async def generate_llm_explanation(data: AgentExplanationInput) -> AgentExplanationOutput:
    """Generate explanation using Gemini LLM."""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = _build_llm_prompt(data)
        
        response = model.generate_content(prompt)
        
        if response and response.text:
            return _parse_llm_response(response.text, data)
        else:
            # Fallback to template
            return generate_template_explanation(data)
            
    except Exception as e:
        print(f"LLM generation failed: {e}")
        # Fallback to template
        return generate_template_explanation(data)


# =============================================================================
# MAIN FUNCTION
# =============================================================================

async def generate_explanation(
    data: AgentExplanationInput,
    use_llm: bool = True
) -> AgentExplanationOutput:
    """
    Generate agent explanation.
    
    Args:
        data: Complete input with readiness, profile, recommendations
        use_llm: Whether to use LLM enhancement (default: True)
    
    Returns:
        Structured explanation output
    """
    if use_llm and USE_LLM_ENHANCEMENT and GEMINI_API_KEY:
        return await generate_llm_explanation(data)
    else:
        return generate_template_explanation(data)


def generate_summary(data: AgentExplanationInput) -> AgentSummaryOutput:
    """Generate lightweight summary (always template-based for speed)."""
    return AgentSummaryOutput(
        headline=_generate_headline(data.readiness.status),
        summary=_generate_summary_points(data),
        readiness_status=data.readiness.status,
        risk_profile=data.risk_profile.profile,
    )
