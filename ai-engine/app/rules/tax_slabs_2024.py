"""
@file app/rules/tax_slabs_2024.py
@brief India Income Tax slabs and calculation for FY 2024-25.

@description
This module contains:
- Old regime tax slabs (with deductions like 80C, 80D, HRA)
- New regime tax slabs (simplified, fewer deductions)
- Deduction limits under various sections
- Tax calculation functions for both regimes

Reference: Income Tax Act 1961, as amended by Finance Act 2024

@author HackVengers Team
@version 1.0.0
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


# =============================================================================
# CONSTANTS & TYPES
# =============================================================================

class TaxRegime(str, Enum):
    """Tax regime options in India."""
    OLD = "old"
    NEW = "new"


# =============================================================================
# OLD REGIME TAX SLABS (FY 2024-25)
# =============================================================================

#: Old regime tax slabs for FY 2024-25
#: Format: (upper_limit, rate) - lower limit is previous slab's upper + 1
#: None as upper_limit means no upper bound
OLD_REGIME_SLABS: List[Tuple[Optional[int], float]] = [
    (250000, 0.00),      # Up to 2.5L: Nil
    (500000, 0.05),      # 2.5L - 5L: 5%
    (1000000, 0.20),     # 5L - 10L: 20%
    (None, 0.30),        # Above 10L: 30%
]

#: Standard deduction for salaried individuals (Old Regime)
OLD_REGIME_STANDARD_DEDUCTION: int = 50000

#: Rebate under 87A for income up to 5L (Old Regime)
OLD_REGIME_87A_LIMIT: int = 500000
OLD_REGIME_87A_MAX_REBATE: int = 12500


# =============================================================================
# NEW REGIME TAX SLABS (FY 2024-25)
# =============================================================================

#: New regime tax slabs for FY 2024-25 (updated in Budget 2024)
#: More slabs with lower rates, but fewer deductions allowed
NEW_REGIME_SLABS: List[Tuple[Optional[int], float]] = [
    (300000, 0.00),      # Up to 3L: Nil
    (700000, 0.05),      # 3L - 7L: 5%
    (1000000, 0.10),     # 7L - 10L: 10%
    (1200000, 0.15),     # 10L - 12L: 15%
    (1500000, 0.20),     # 12L - 15L: 20%
    (None, 0.30),        # Above 15L: 30%
]

#: Standard deduction for salaried individuals (New Regime - Budget 2024)
NEW_REGIME_STANDARD_DEDUCTION: int = 75000

#: Rebate under 87A for income up to 7L (New Regime)
NEW_REGIME_87A_LIMIT: int = 700000
NEW_REGIME_87A_MAX_REBATE: int = 25000


# =============================================================================
# DEDUCTION LIMITS
# =============================================================================

@dataclass
class DeductionLimit:
    """
    @class DeductionLimit
    @brief Configuration for a tax deduction section.
    
    @param section Section number (e.g., "80C")
    @param max_limit Maximum deduction allowed
    @param description Human-readable description
    @param applicable_old Whether applicable in old regime
    @param applicable_new Whether applicable in new regime
    @param investment_options Example investment options
    """
    section: str
    max_limit: int
    description: str
    applicable_old: bool
    applicable_new: bool
    investment_options: List[str]


#: Comprehensive deduction limits for various sections
DEDUCTION_LIMITS: Dict[str, DeductionLimit] = {
    "80C": DeductionLimit(
        section="80C",
        max_limit=150000,
        description="Investments like PPF, ELSS, LIC, EPF, NSC, etc.",
        applicable_old=True,
        applicable_new=False,
        investment_options=["PPF", "ELSS Mutual Funds", "Life Insurance Premium", 
                           "NSC", "5-Year FD", "EPF", "Sukanya Samriddhi"]
    ),
    "80CCD_1B": DeductionLimit(
        section="80CCD(1B)",
        max_limit=50000,
        description="Additional NPS contribution beyond 80C",
        applicable_old=True,
        applicable_new=True,  # NPS is allowed in new regime
        investment_options=["National Pension System (NPS)"]
    ),
    "80D": DeductionLimit(
        section="80D",
        max_limit=100000,
        description="Health insurance premium (self + family + parents)",
        applicable_old=True,
        applicable_new=False,
        investment_options=["Health Insurance", "Preventive Health Checkup"]
    ),
    "80E": DeductionLimit(
        section="80E",
        max_limit=0,  # No limit, but only interest portion
        description="Education loan interest (no upper limit)",
        applicable_old=True,
        applicable_new=False,
        investment_options=["Education Loan Interest"]
    ),
    "80G": DeductionLimit(
        section="80G",
        max_limit=0,  # Varies by donation type
        description="Donations to approved charities",
        applicable_old=True,
        applicable_new=False,
        investment_options=["PM CARES Fund (100%)", "NGOs (50%)", "Religious Trusts (50%)"]
    ),
    "80TTA": DeductionLimit(
        section="80TTA",
        max_limit=10000,
        description="Interest on savings account",
        applicable_old=True,
        applicable_new=False,
        investment_options=["Savings Account Interest"]
    ),
    "80TTB": DeductionLimit(
        section="80TTB",
        max_limit=50000,
        description="Interest income for senior citizens",
        applicable_old=True,
        applicable_new=False,
        investment_options=["FD/RD Interest", "Savings Account Interest"]
    ),
    "24B": DeductionLimit(
        section="24(b)",
        max_limit=200000,
        description="Home loan interest (self-occupied property)",
        applicable_old=True,
        applicable_new=False,
        investment_options=["Home Loan Interest"]
    ),
}

#: Health & Education Cess rate
CESS_RATE: float = 0.04  # 4%

#: Surcharge rates based on income
SURCHARGE_SLABS: List[Tuple[int, int, float]] = [
    (5000000, 10000000, 0.10),    # 50L - 1Cr: 10%
    (10000000, 20000000, 0.15),   # 1Cr - 2Cr: 15%
    (20000000, 50000000, 0.25),   # 2Cr - 5Cr: 25%
    (50000000, None, 0.37),       # Above 5Cr: 37%
]


# =============================================================================
# TAX CALCULATION FUNCTIONS
# =============================================================================

@dataclass
class SlabBreakdown:
    """
    @class SlabBreakdown
    @brief Tax calculation for a single slab.
    """
    slab_description: str
    income_in_slab: float
    rate: float
    tax_amount: float


@dataclass
class TaxResult:
    """
    @class TaxResult
    @brief Complete tax calculation result.
    """
    regime: TaxRegime
    gross_total_income: float
    total_deductions: float
    taxable_income: float
    slab_breakdown: List[SlabBreakdown]
    tax_before_cess: float
    surcharge: float
    cess: float
    total_tax: float
    effective_rate: float
    rebate_87a: float


def _calculate_slab_tax(
    taxable_income: float,
    slabs: List[Tuple[Optional[int], float]]
) -> Tuple[float, List[SlabBreakdown]]:
    """
    @brief Calculate tax using given slabs.
    
    @param taxable_income Net taxable income after deductions
    @param slabs List of (upper_limit, rate) tuples
    @return Tuple of (total_tax, list of slab breakdowns)
    
    @private Internal function used by calculate_tax()
    """
    total_tax = 0.0
    breakdown: List[SlabBreakdown] = []
    remaining = taxable_income
    prev_limit = 0
    
    for i, (upper_limit, rate) in enumerate(slabs):
        if remaining <= 0:
            break
        
        # Calculate income falling in this slab
        if upper_limit is None:
            slab_income = remaining
            slab_desc = f"Above ₹{prev_limit:,}"
        else:
            slab_income = min(remaining, upper_limit - prev_limit)
            if prev_limit == 0:
                slab_desc = f"Up to ₹{upper_limit:,}"
            else:
                slab_desc = f"₹{prev_limit:,} - ₹{upper_limit:,}"
        
        # Skip if no income in this slab
        if slab_income <= 0:
            prev_limit = upper_limit if upper_limit else prev_limit
            continue
        
        slab_tax = slab_income * rate
        total_tax += slab_tax
        remaining -= slab_income
        
        breakdown.append(SlabBreakdown(
            slab_description=slab_desc,
            income_in_slab=round(slab_income, 2),
            rate=rate * 100,
            tax_amount=round(slab_tax, 2)
        ))
        
        prev_limit = upper_limit if upper_limit else prev_limit
    
    return round(total_tax, 2), breakdown


def _calculate_surcharge(tax_before_surcharge: float, taxable_income: float) -> float:
    """
    @brief Calculate surcharge based on income level.
    
    @param tax_before_surcharge Tax amount before surcharge
    @param taxable_income Net taxable income
    @return Surcharge amount
    """
    for lower, upper, rate in SURCHARGE_SLABS:
        if upper is None and taxable_income > lower:
            return round(tax_before_surcharge * rate, 2)
        elif taxable_income > lower and taxable_income <= upper:
            return round(tax_before_surcharge * rate, 2)
    return 0.0


def calculate_tax(
    gross_income: float,
    deductions: Dict[str, float],
    regime: TaxRegime,
    is_salaried: bool = True,
    is_senior_citizen: bool = False
) -> TaxResult:
    """
    @brief Calculate income tax for given income and deductions.
    
    @param gross_income Gross total income
    @param deductions Dictionary of section -> amount claimed
    @param regime Tax regime (old/new)
    @param is_salaried Whether taxpayer is salaried (for standard deduction)
    @param is_senior_citizen Whether taxpayer is senior citizen (60+)
    @return TaxResult with complete breakdown
    
    @details
    Calculation steps:
    1. Apply standard deduction (if salaried)
    2. Apply section-wise deductions (80C, 80D, etc.)
    3. Calculate slab-wise tax
    4. Apply rebate u/s 87A if eligible
    5. Calculate surcharge if applicable
    6. Add 4% health & education cess
    
    @example
    >>> deductions = {"80C": 150000, "80D": 25000}
    >>> result = calculate_tax(1200000, deductions, TaxRegime.OLD)
    >>> result.total_tax
    118300.0
    """
    # Select regime-specific parameters
    if regime == TaxRegime.OLD:
        slabs = OLD_REGIME_SLABS
        std_deduction = OLD_REGIME_STANDARD_DEDUCTION if is_salaried else 0
        rebate_limit = OLD_REGIME_87A_LIMIT
        rebate_max = OLD_REGIME_87A_MAX_REBATE
    else:
        slabs = NEW_REGIME_SLABS
        std_deduction = NEW_REGIME_STANDARD_DEDUCTION if is_salaried else 0
        rebate_limit = NEW_REGIME_87A_LIMIT
        rebate_max = NEW_REGIME_87A_MAX_REBATE
    
    # Calculate total deductions
    total_deductions = std_deduction
    
    for section, amount in deductions.items():
        if section in DEDUCTION_LIMITS:
            limit_info = DEDUCTION_LIMITS[section]
            
            # Check if deduction is applicable for this regime
            if regime == TaxRegime.OLD and not limit_info.applicable_old:
                continue
            if regime == TaxRegime.NEW and not limit_info.applicable_new:
                continue
            
            # Apply limit (if max_limit is 0, no limit applies)
            if limit_info.max_limit > 0:
                allowed = min(amount, limit_info.max_limit)
            else:
                allowed = amount
            
            total_deductions += allowed
    
    # Calculate taxable income
    taxable_income = max(0, gross_income - total_deductions)
    
    # Calculate slab-wise tax
    tax_before_rebate, slab_breakdown = _calculate_slab_tax(taxable_income, slabs)
    
    # Apply rebate u/s 87A
    rebate_87a = 0.0
    if taxable_income <= rebate_limit:
        rebate_87a = min(tax_before_rebate, rebate_max)
    
    tax_after_rebate = max(0, tax_before_rebate - rebate_87a)
    
    # Calculate surcharge (if income is high)
    surcharge = _calculate_surcharge(tax_after_rebate, taxable_income)
    tax_plus_surcharge = tax_after_rebate + surcharge
    
    # Calculate cess (4% on tax + surcharge)
    cess = round(tax_plus_surcharge * CESS_RATE, 2)
    
    # Total tax liability
    total_tax = round(tax_plus_surcharge + cess, 2)
    
    # Effective tax rate
    effective_rate = round((total_tax / gross_income * 100), 2) if gross_income > 0 else 0.0
    
    return TaxResult(
        regime=regime,
        gross_total_income=gross_income,
        total_deductions=total_deductions,
        taxable_income=taxable_income,
        slab_breakdown=slab_breakdown,
        tax_before_cess=tax_after_rebate + surcharge,
        surcharge=surcharge,
        cess=cess,
        total_tax=total_tax,
        effective_rate=effective_rate,
        rebate_87a=rebate_87a
    )


def compare_regimes(
    gross_income: float,
    deductions: Dict[str, float],
    is_salaried: bool = True
) -> Dict[str, any]:
    """
    @brief Compare tax liability under both regimes.
    
    @param gross_income Gross total income
    @param deductions Deductions claimed
    @param is_salaried Whether taxpayer is salaried
    @return Dictionary with comparison results and recommendation
    
    @example
    >>> comparison = compare_regimes(1200000, {"80C": 150000, "80D": 25000})
    >>> comparison["recommended_regime"]
    'old'
    """
    old_result = calculate_tax(gross_income, deductions, TaxRegime.OLD, is_salaried)
    new_result = calculate_tax(gross_income, deductions, TaxRegime.NEW, is_salaried)
    
    savings = abs(old_result.total_tax - new_result.total_tax)
    
    if old_result.total_tax <= new_result.total_tax:
        recommended = TaxRegime.OLD
        explanation = (
            f"Old regime saves ₹{savings:,.0f} due to deductions worth "
            f"₹{old_result.total_deductions:,.0f}"
        )
    else:
        recommended = TaxRegime.NEW
        explanation = (
            f"New regime saves ₹{savings:,.0f} due to lower slab rates. "
            f"Your deductions (₹{old_result.total_deductions:,.0f}) don't offset the rate benefit."
        )
    
    return {
        "old_regime": old_result,
        "new_regime": new_result,
        "recommended_regime": recommended,
        "savings_with_recommended": savings,
        "explanation": explanation,
    }


def get_deduction_suggestions(
    current_deductions: Dict[str, float],
    gross_income: float,
    regime: TaxRegime = TaxRegime.OLD
) -> List[Dict[str, any]]:
    """
    @brief Suggest deductions to maximize tax savings.
    
    @param current_deductions Currently claimed deductions
    @param gross_income Gross income (to estimate tax savings)
    @param regime Tax regime being used
    @return List of suggestions with potential savings
    
    @details
    For each section where limit isn't fully utilized:
    - Calculate remaining room
    - Estimate tax savings at marginal rate
    - Suggest investment options
    """
    suggestions = []
    
    # Estimate marginal tax rate based on income
    if gross_income > 1000000:
        marginal_rate = 0.30
    elif gross_income > 500000:
        marginal_rate = 0.20
    else:
        marginal_rate = 0.05
    
    # Add cess effect
    marginal_rate_with_cess = marginal_rate * (1 + CESS_RATE)
    
    for section, limit_info in DEDUCTION_LIMITS.items():
        # Skip if not applicable for this regime
        if regime == TaxRegime.OLD and not limit_info.applicable_old:
            continue
        if regime == TaxRegime.NEW and not limit_info.applicable_new:
            continue
        
        # Skip sections with no defined limit
        if limit_info.max_limit == 0:
            continue
        
        current = current_deductions.get(section, 0)
        gap = limit_info.max_limit - current
        
        if gap > 1000:  # Only suggest if at least ₹1000 room
            potential_savings = round(gap * marginal_rate_with_cess, 2)
            
            suggestions.append({
                "section": limit_info.section,
                "current": current,
                "limit": limit_info.max_limit,
                "gap": gap,
                "options": limit_info.investment_options,
                "potential_tax_savings": potential_savings,
                "description": limit_info.description,
            })
    
    # Sort by potential savings (highest first)
    suggestions.sort(key=lambda x: x["potential_tax_savings"], reverse=True)
    
    return suggestions
