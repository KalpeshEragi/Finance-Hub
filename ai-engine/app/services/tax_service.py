"""
@file app/services/tax_service.py
@brief Tax estimation and ITR support service.

@description
This service provides India-specific tax calculations:
- Tax estimation under both Old and New regimes (FY 2024-25)
- Regime comparison and recommendation
- Deduction optimization suggestions
- ITR summary preparation

@author HackVengers Team
@version 1.0.0
"""

from typing import Dict, List, Optional
import logging

from app.models.schemas import (
    TaxEstimateRequest,
    TaxEstimateResponse,
    TaxEstimateResult,
    TaxSlabBreakdown,
    DeductionSuggestion,
    IncomeInput,
    DeductionInput,
    TaxRegime as SchemaTaxRegime,
)
from app.rules.tax_slabs_2024 import (
    calculate_tax,
    compare_regimes,
    get_deduction_suggestions,
    TaxRegime,
    TaxResult,
    DEDUCTION_LIMITS,
)

logger = logging.getLogger(__name__)


# =============================================================================
# INTERNAL HELPER FUNCTIONS
# =============================================================================

def _calculate_gross_income(income: IncomeInput) -> float:
    """
    @brief Calculate gross total income from all sources.
    
    @param income IncomeInput object with income breakdown
    @return Total gross income
    """
    return (
        income.salary +
        income.rental +
        income.business +
        income.capital_gains_short +
        income.capital_gains_long +
        income.other
    )


def _convert_deductions(
    deductions: Optional[DeductionInput]
) -> Dict[str, float]:
    """
    @brief Convert DeductionInput schema to dictionary.
    
    @param deductions DeductionInput object
    @return Dictionary mapping section to amount
    """
    if not deductions:
        return {}
    
    return {
        "80C": deductions.section_80c,
        "80D": deductions.section_80d,
        "80G": deductions.section_80g,
        "80E": deductions.section_80e,
        "80CCD_1B": deductions.section_80ccd_1b,
        "24B": deductions.home_loan_interest,
    }


def _convert_tax_result(result: TaxResult) -> TaxEstimateResult:
    """
    @brief Convert internal TaxResult to API schema.
    
    @param result TaxResult from rules module
    @return TaxEstimateResult schema
    """
    # Convert slab breakdown
    slab_breakdown = [
        TaxSlabBreakdown(
            slab=s.slab_description,
            income_in_slab=s.income_in_slab,
            rate=s.rate,
            tax=s.tax_amount,
        )
        for s in result.slab_breakdown
    ]
    
    return TaxEstimateResult(
        regime=SchemaTaxRegime(result.regime.value),
        gross_total_income=result.gross_total_income,
        total_deductions=result.total_deductions,
        taxable_income=result.taxable_income,
        tax_before_cess=result.tax_before_cess,
        cess=result.cess,
        total_tax=result.total_tax,
        effective_rate=result.effective_rate,
        slab_breakdown=slab_breakdown,
    )


def _generate_explanation(
    recommended: TaxRegime,
    old_tax: float,
    new_tax: float,
    deductions: float
) -> str:
    """
    @brief Generate human-readable explanation for regime recommendation.
    
    @param recommended Recommended regime
    @param old_tax Tax under old regime
    @param new_tax Tax under new regime
    @param deductions Total deductions claimed
    @return Explanation string
    """
    savings = abs(old_tax - new_tax)
    
    if recommended == TaxRegime.OLD:
        return (
            f"Old regime saves ₹{savings:,.0f} because your deductions "
            f"(₹{deductions:,.0f}) significantly reduce taxable income. "
            f"Maximize 80C and 80D investments to maintain this advantage."
        )
    else:
        return (
            f"New regime saves ₹{savings:,.0f} due to lower tax rates across slabs. "
            f"Your current deductions (₹{deductions:,.0f}) don't offset the rate benefit. "
            f"Consider if increasing deductions could flip the recommendation."
        )


# =============================================================================
# PUBLIC API FUNCTIONS
# =============================================================================

def estimate_tax(request: TaxEstimateRequest) -> TaxEstimateResponse:
    """
    @brief Estimate income tax under both regimes with comparison.
    
    @param request TaxEstimateRequest with income and deductions
    @return TaxEstimateResponse with complete analysis
    
    @details
    Process:
    1. Calculate gross total income
    2. Calculate tax under Old regime (with deductions)
    3. Calculate tax under New regime (limited deductions)
    4. Compare and recommend optimal regime
    5. Generate deduction optimization suggestions
    
    @example
    >>> request = TaxEstimateRequest(
    ...     financial_year="2024-25",
    ...     income=IncomeInput(salary=1200000),
    ...     deductions=DeductionInput(section_80c=150000),
    ... )
    >>> response = estimate_tax(request)
    >>> response.recommended_regime
    TaxRegime.OLD
    """
    # Calculate gross income
    gross_income = _calculate_gross_income(request.income)
    
    # Convert deductions to dictionary format
    deductions_dict = _convert_deductions(request.deductions)
    
    # Determine if salaried (for standard deduction)
    is_salaried = request.income.salary > 0
    
    # Calculate tax under both regimes
    old_result = calculate_tax(
        gross_income=gross_income,
        deductions=deductions_dict,
        regime=TaxRegime.OLD,
        is_salaried=is_salaried,
    )
    
    new_result = calculate_tax(
        gross_income=gross_income,
        deductions=deductions_dict,
        regime=TaxRegime.NEW,
        is_salaried=is_salaried,
    )
    
    # Determine recommended regime
    if old_result.total_tax <= new_result.total_tax:
        recommended = TaxRegime.OLD
        savings = new_result.total_tax - old_result.total_tax
    else:
        recommended = TaxRegime.NEW
        savings = old_result.total_tax - new_result.total_tax
    
    # Generate explanation
    explanation = _generate_explanation(
        recommended,
        old_result.total_tax,
        new_result.total_tax,
        old_result.total_deductions,
    )
    
    # Get deduction suggestions (only relevant for old regime)
    suggestions_raw = get_deduction_suggestions(
        deductions_dict,
        gross_income,
        TaxRegime.OLD,
    )
    
    # Convert to schema format
    deduction_suggestions = [
        DeductionSuggestion(
            section=s["section"],
            current=s["current"],
            limit=s["limit"],
            gap=s["gap"],
            options=s["options"],
            potential_tax_savings=s["potential_tax_savings"],
        )
        for s in suggestions_raw
    ]
    
    return TaxEstimateResponse(
        old_regime=_convert_tax_result(old_result),
        new_regime=_convert_tax_result(new_result),
        recommended_regime=SchemaTaxRegime(recommended.value),
        savings_with_recommended=round(savings, 2),
        explanation=explanation,
        deduction_suggestions=deduction_suggestions,
    )


def get_tax_suggestions(
    income: IncomeInput,
    current_deductions: Optional[DeductionInput] = None
) -> List[Dict]:
    """
    @brief Get tax-saving suggestions based on current deductions.
    
    @param income Income breakdown
    @param current_deductions Currently claimed deductions
    @return List of suggestion dictionaries
    
    @details
    Analyzes gaps in deduction utilization and suggests
    specific investment options to reduce tax liability.
    """
    gross_income = _calculate_gross_income(income)
    deductions_dict = _convert_deductions(current_deductions)
    
    suggestions = get_deduction_suggestions(
        deductions_dict,
        gross_income,
        TaxRegime.OLD,
    )
    
    # Enrich with actionable advice
    enriched = []
    for s in suggestions:
        advice = _get_investment_advice(s["section"], s["gap"])
        enriched.append({
            **s,
            "action_items": advice,
        })
    
    return enriched


def _get_investment_advice(section: str, gap: float) -> List[str]:
    """
    @brief Get specific investment advice for a section.
    
    @param section Tax section (e.g., "80C")
    @param gap Amount of unused limit
    @return List of specific action items
    """
    advice = {
        "80C": [
            f"Invest ₹{gap:,.0f} in ELSS mutual funds for tax saving with growth potential",
            "Increase EPF voluntary contribution (VPF) for guaranteed returns",
            "Add to PPF account for tax-free returns",
        ],
        "80CCD_1B": [
            f"Invest ₹{min(gap, 50000):,.0f} in NPS for additional deduction",
            "NPS offers market-linked returns with tax benefits",
        ],
        "80D": [
            "Buy/upgrade health insurance for self and family",
            "Consider super top-up health insurance",
            "Get preventive health checkup (₹5,000 additional)",
        ],
        "24B": [
            "Home loan interest provides significant deduction",
            "Consider prepaying to reduce interest or claiming full benefit",
        ],
    }
    
    return advice.get(section, ["Consult a tax advisor for this section"])


def prepare_itr_summary(
    income: IncomeInput,
    deductions: Optional[DeductionInput],
    regime: SchemaTaxRegime
) -> Dict:
    """
    @brief Prepare ITR filing summary data.
    
    @param income Income breakdown
    @param deductions Deductions claimed
    @param regime Chosen tax regime
    @return ITR summary dictionary
    
    @details
    Provides structured data for ITR-1 (Sahaj) filing.
    Suitable for salaried individuals with basic income sources.
    """
    gross = _calculate_gross_income(income)
    deductions_dict = _convert_deductions(deductions)
    
    # Calculate tax for chosen regime
    result = calculate_tax(
        gross_income=gross,
        deductions=deductions_dict,
        regime=TaxRegime(regime.value),
        is_salaried=income.salary > 0,
    )
    
    # Determine ITR form type
    if income.business > 0:
        itr_form = "ITR-3"  # Business income
        form_note = "Business/Profession income requires ITR-3"
    elif income.capital_gains_short > 0 or income.capital_gains_long > 0:
        itr_form = "ITR-2"  # Capital gains
        form_note = "Capital gains require ITR-2"
    elif income.rental > 0 and income.rental > 250000:
        itr_form = "ITR-2"  # Multiple house property
        form_note = "Rental income above ₹2.5L requires ITR-2"
    else:
        itr_form = "ITR-1"  # Sahaj
        form_note = "Eligible for simple ITR-1 (Sahaj)"
    
    return {
        "form_type": itr_form,
        "form_note": form_note,
        "financial_year": "2024-25",
        "assessment_year": "2025-26",
        "regime": regime.value,
        "income_summary": {
            "salary": income.salary,
            "house_property": income.rental,
            "business": income.business,
            "capital_gains": income.capital_gains_short + income.capital_gains_long,
            "other_sources": income.other,
            "gross_total_income": gross,
        },
        "deduction_summary": deductions_dict,
        "total_deductions": result.total_deductions,
        "taxable_income": result.taxable_income,
        "tax_liability": result.total_tax,
        "filing_deadline": "July 31, 2025",
        "advance_tax_applicable": result.total_tax > 10000,
    }
