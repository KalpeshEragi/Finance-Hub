"""
@file app/utils/math.py
@brief Financial mathematical calculations.

@description
This module provides optimized financial calculation functions:
- EMI (Equated Monthly Installment) calculation
- Compound interest calculations
- SIP (Systematic Investment Plan) future value
- Currency rounding utilities

All functions are deterministic and use standard financial formulas.

@author HackVengers Team
@version 1.0.0
"""

import math
from typing import Optional
from decimal import Decimal, ROUND_HALF_UP


# =============================================================================
# CONSTANTS
# =============================================================================

#: Standard rounding precision for currency (2 decimal places)
CURRENCY_DECIMAL_PLACES = 2

#: Months per year (used in annualized calculations)
MONTHS_PER_YEAR = 12


# =============================================================================
# EMI CALCULATIONS
# =============================================================================

def calculate_emi(
    principal: float,
    annual_rate: float,
    tenure_months: int
) -> float:
    """
    @brief Calculate EMI using standard amortization formula.
    
    @param principal Loan principal amount
    @param annual_rate Annual interest rate (percentage, e.g., 8.5 for 8.5%)
    @param tenure_months Loan tenure in months
    @return Monthly EMI amount
    
    @details
    Uses the standard EMI formula:
    EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
    
    Where:
    - P = Principal loan amount
    - r = Monthly interest rate (annual_rate / 12 / 100)
    - n = Tenure in months
    
    @note Returns principal/tenure if interest rate is 0 (zero-interest loan)
    
    @example
    >>> calculate_emi(1000000, 8.5, 240)  # 10L loan, 8.5%, 20 years
    8678.23
    """
    if principal <= 0 or tenure_months <= 0:
        return 0.0
    
    # Handle zero interest rate
    if annual_rate <= 0:
        return round_currency(principal / tenure_months)
    
    # Convert annual rate to monthly rate (as decimal)
    monthly_rate = annual_rate / 100 / MONTHS_PER_YEAR
    
    # Calculate (1 + r)^n
    power_factor = math.pow(1 + monthly_rate, tenure_months)
    
    # EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
    emi = principal * monthly_rate * power_factor / (power_factor - 1)
    
    return round_currency(emi)


def calculate_loan_schedule(
    principal: float,
    annual_rate: float,
    tenure_months: int
) -> list:
    """
    @brief Generate amortization schedule for a loan.
    
    @param principal Loan principal amount
    @param annual_rate Annual interest rate (percentage)
    @param tenure_months Loan tenure in months
    @return List of dictionaries with monthly payment breakdown
    
    @details
    Each entry contains:
    - month: Month number
    - emi: EMI amount
    - principal_component: Principal paid in this EMI
    - interest_component: Interest paid in this EMI
    - outstanding: Remaining principal after this EMI
    
    @note This is an expensive operation for long tenures.
          Use judiciously for UI display purposes.
    """
    if principal <= 0 or tenure_months <= 0:
        return []
    
    emi = calculate_emi(principal, annual_rate, tenure_months)
    monthly_rate = annual_rate / 100 / MONTHS_PER_YEAR
    
    schedule = []
    outstanding = principal
    
    for month in range(1, tenure_months + 1):
        interest_component = outstanding * monthly_rate
        principal_component = emi - interest_component
        outstanding = max(0, outstanding - principal_component)
        
        schedule.append({
            "month": month,
            "emi": round_currency(emi),
            "principal_component": round_currency(principal_component),
            "interest_component": round_currency(interest_component),
            "outstanding": round_currency(outstanding)
        })
    
    return schedule


def calculate_total_interest(
    principal: float,
    annual_rate: float,
    tenure_months: int
) -> float:
    """
    @brief Calculate total interest paid over loan tenure.
    
    @param principal Loan principal amount
    @param annual_rate Annual interest rate (percentage)
    @param tenure_months Loan tenure in months
    @return Total interest amount
    
    @example
    >>> calculate_total_interest(1000000, 8.5, 240)
    1082774.0  # Over 10L interest on 10L loan in 20 years
    """
    if principal <= 0 or tenure_months <= 0:
        return 0.0
    
    emi = calculate_emi(principal, annual_rate, tenure_months)
    total_payment = emi * tenure_months
    total_interest = total_payment - principal
    
    return round_currency(max(0, total_interest))


# =============================================================================
# COMPOUND INTEREST & GROWTH
# =============================================================================

def compound_interest(
    principal: float,
    annual_rate: float,
    years: float,
    compounds_per_year: int = 12
) -> float:
    """
    @brief Calculate compound interest (future value).
    
    @param principal Initial principal amount
    @param annual_rate Annual interest rate (percentage)
    @param years Time period in years (can be fractional)
    @param compounds_per_year Number of times interest compounds per year
    @return Future value after compounding
    
    @details
    Uses standard compound interest formula:
    A = P × (1 + r/n)^(n×t)
    
    Where:
    - P = Principal
    - r = Annual rate (as decimal)
    - n = Compounds per year
    - t = Time in years
    
    @example
    >>> compound_interest(100000, 8.0, 5)  # 1L at 8%, 5 years
    148985.0
    """
    if principal <= 0 or years <= 0:
        return principal
    
    if annual_rate <= 0:
        return round_currency(principal)
    
    rate = annual_rate / 100
    n = compounds_per_year
    t = years
    
    future_value = principal * math.pow(1 + rate / n, n * t)
    
    return round_currency(future_value)


def calculate_cagr(
    initial_value: float,
    final_value: float,
    years: float
) -> float:
    """
    @brief Calculate Compound Annual Growth Rate (CAGR).
    
    @param initial_value Starting value
    @param final_value Ending value
    @param years Time period in years
    @return CAGR as percentage
    
    @details
    CAGR = ((FV/PV)^(1/n) - 1) × 100
    
    @example
    >>> calculate_cagr(100000, 200000, 5)  # Doubled in 5 years
    14.87
    """
    if initial_value <= 0 or final_value <= 0 or years <= 0:
        return 0.0
    
    cagr = (math.pow(final_value / initial_value, 1 / years) - 1) * 100
    
    return round(cagr, 2)


# =============================================================================
# SIP & INVESTMENT CALCULATIONS
# =============================================================================

def calculate_sip_future_value(
    monthly_sip: float,
    annual_return: float,
    months: int
) -> float:
    """
    @brief Calculate future value of SIP investments.
    
    @param monthly_sip Monthly SIP amount
    @param annual_return Expected annual return rate (percentage)
    @param months Investment duration in months
    @return Future value of SIP
    
    @details
    Uses future value of annuity formula:
    FV = P × [((1 + r)^n - 1) / r] × (1 + r)
    
    Where:
    - P = Monthly SIP amount
    - r = Monthly return rate
    - n = Number of months
    
    @example
    >>> calculate_sip_future_value(10000, 12.0, 120)  # 10K/month, 12%, 10 years
    2323391.0
    """
    if monthly_sip <= 0 or months <= 0:
        return 0.0
    
    if annual_return <= 0:
        return round_currency(monthly_sip * months)
    
    # Monthly return rate
    monthly_rate = annual_return / 100 / MONTHS_PER_YEAR
    
    # Future value of annuity formula
    power_factor = math.pow(1 + monthly_rate, months)
    fv = monthly_sip * ((power_factor - 1) / monthly_rate) * (1 + monthly_rate)
    
    return round_currency(fv)


def calculate_required_sip(
    target_amount: float,
    annual_return: float,
    months: int
) -> float:
    """
    @brief Calculate required monthly SIP to reach a target.
    
    @param target_amount Target corpus amount
    @param annual_return Expected annual return rate (percentage)
    @param months Investment duration in months
    @return Required monthly SIP amount
    
    @details
    Reverse of SIP future value formula.
    
    @example
    >>> calculate_required_sip(10000000, 12.0, 240)  # 1Cr in 20 years at 12%
    10020.0
    """
    if target_amount <= 0 or months <= 0:
        return 0.0
    
    if annual_return <= 0:
        return round_currency(target_amount / months)
    
    # Monthly return rate
    monthly_rate = annual_return / 100 / MONTHS_PER_YEAR
    
    # Reverse future value formula
    power_factor = math.pow(1 + monthly_rate, months)
    required_sip = target_amount / (((power_factor - 1) / monthly_rate) * (1 + monthly_rate))
    
    return round_currency(required_sip)


def calculate_lumpsum_vs_sip(
    lumpsum: float,
    sip: float,
    annual_return: float,
    months: int
) -> dict:
    """
    @brief Compare lumpsum vs SIP investment outcomes.
    
    @param lumpsum Lumpsum investment amount
    @param sip Monthly SIP amount
    @param annual_return Expected annual return rate (percentage)
    @param months Investment duration in months
    @return Comparison dictionary with both outcomes
    """
    years = months / MONTHS_PER_YEAR
    
    lumpsum_fv = compound_interest(lumpsum, annual_return, years)
    sip_fv = calculate_sip_future_value(sip, annual_return, months)
    sip_total_invested = sip * months
    
    return {
        "lumpsum": {
            "invested": lumpsum,
            "future_value": lumpsum_fv,
            "profit": round_currency(lumpsum_fv - lumpsum),
            "returns_percent": round((lumpsum_fv / lumpsum - 1) * 100, 2) if lumpsum > 0 else 0
        },
        "sip": {
            "monthly_amount": sip,
            "total_invested": sip_total_invested,
            "future_value": sip_fv,
            "profit": round_currency(sip_fv - sip_total_invested),
            "returns_percent": round((sip_fv / sip_total_invested - 1) * 100, 2) if sip_total_invested > 0 else 0
        }
    }


# =============================================================================
# CURRENCY UTILITIES
# =============================================================================

def round_currency(amount: float, decimal_places: int = CURRENCY_DECIMAL_PLACES) -> float:
    """
    @brief Round amount to standard currency precision.
    
    @param amount Amount to round
    @param decimal_places Number of decimal places (default: 2)
    @return Rounded amount
    
    @details
    Uses banker's rounding (ROUND_HALF_UP) for consistent results.
    
    @example
    >>> round_currency(1234.567)
    1234.57
    >>> round_currency(1234.5)
    1234.50
    """
    if amount is None:
        return 0.0
    
    decimal_amount = Decimal(str(amount))
    rounded = decimal_amount.quantize(
        Decimal(10) ** -decimal_places,
        rounding=ROUND_HALF_UP
    )
    
    return float(rounded)


def format_inr(amount: float, include_symbol: bool = True) -> str:
    """
    @brief Format amount in Indian numbering system (lakhs, crores).
    
    @param amount Amount in INR
    @param include_symbol Whether to include ₹ symbol
    @return Formatted string
    
    @example
    >>> format_inr(1234567.89)
    '₹12,34,567.89'
    >>> format_inr(10000000)
    '₹1,00,00,000.00'
    """
    amount = round_currency(amount)
    
    # Split into integer and decimal parts
    is_negative = amount < 0
    amount = abs(amount)
    integer_part = int(amount)
    decimal_part = round((amount - integer_part) * 100)
    
    # Format integer part in Indian system
    s = str(integer_part)
    if len(s) > 3:
        # First 3 digits from right, then pairs
        result = s[-3:]
        s = s[:-3]
        while s:
            result = s[-2:] + ',' + result
            s = s[:-2]
    else:
        result = s
    
    # Add decimal part
    formatted = f"{result}.{decimal_part:02d}"
    
    # Add negative sign and symbol
    if is_negative:
        formatted = "-" + formatted
    
    if include_symbol:
        formatted = "₹" + formatted
    
    return formatted


def parse_inr(formatted: str) -> float:
    """
    @brief Parse INR formatted string back to float.
    
    @param formatted Formatted string (e.g., '₹12,34,567.89')
    @return Float amount
    """
    # Remove currency symbol and commas
    cleaned = formatted.replace('₹', '').replace(',', '').strip()
    
    try:
        return float(cleaned)
    except ValueError:
        return 0.0
