"""
@file app/utils/date_utils.py
@brief Date and financial year utilities.

@description
This module provides date utilities specific to Indian financial context:
- Financial year calculations (April-March)
- Date difference calculations
- Tax deadline awareness
- Tenure and projection date helpers

@author HackVengers Team
@version 1.0.0
"""

from datetime import date, datetime, timedelta
from typing import Tuple, Optional, List
from dateutil.relativedelta import relativedelta


# =============================================================================
# CONSTANTS
# =============================================================================

#: Indian financial year starts in April
FY_START_MONTH = 4  # April

#: Important tax deadlines (month, day) format
TAX_DEADLINES = {
    "advance_tax_q1": (6, 15),   # June 15
    "advance_tax_q2": (9, 15),   # September 15
    "advance_tax_q3": (12, 15),  # December 15
    "advance_tax_q4": (3, 15),   # March 15
    "itr_due_date": (7, 31),     # July 31 (non-audit cases)
    "itr_belated": (12, 31),     # December 31 (belated return)
}


# =============================================================================
# FINANCIAL YEAR FUNCTIONS
# =============================================================================

def get_financial_year(ref_date: Optional[date] = None) -> str:
    """
    @brief Get the financial year for a given date.
    
    @param ref_date Reference date (default: today)
    @return Financial year string (e.g., "2024-25")
    
    @details
    Indian FY runs April 1 to March 31.
    - April 2024 belongs to FY 2024-25
    - March 2025 belongs to FY 2024-25
    
    @example
    >>> get_financial_year(date(2024, 8, 15))
    '2024-25'
    >>> get_financial_year(date(2025, 2, 1))
    '2024-25'
    """
    if ref_date is None:
        ref_date = date.today()
    
    # If month >= April, FY starts this year
    # If month < April, FY started previous year
    if ref_date.month >= FY_START_MONTH:
        start_year = ref_date.year
    else:
        start_year = ref_date.year - 1
    
    end_year = start_year + 1
    
    return f"{start_year}-{str(end_year)[-2:]}"


def get_fy_dates(fy_string: Optional[str] = None) -> Tuple[date, date]:
    """
    @brief Get start and end dates for a financial year.
    
    @param fy_string Financial year (e.g., "2024-25") or None for current FY
    @return Tuple of (start_date, end_date)
    
    @example
    >>> start, end = get_fy_dates("2024-25")
    >>> start
    date(2024, 4, 1)
    >>> end
    date(2025, 3, 31)
    """
    if fy_string is None:
        fy_string = get_financial_year()
    
    # Parse "2024-25" format
    try:
        start_year = int(fy_string.split("-")[0])
    except (ValueError, IndexError):
        # Fallback to current FY
        start_year = date.today().year if date.today().month >= FY_START_MONTH else date.today().year - 1
    
    start_date = date(start_year, 4, 1)
    end_date = date(start_year + 1, 3, 31)
    
    return start_date, end_date


def get_assessment_year(fy_string: str) -> str:
    """
    @brief Get assessment year for a financial year.
    
    @param fy_string Financial year (e.g., "2024-25")
    @return Assessment year (e.g., "2025-26")
    
    @details
    Assessment Year (AY) is the year following the Financial Year.
    Income earned in FY 2024-25 is assessed in AY 2025-26.
    
    @example
    >>> get_assessment_year("2024-25")
    '2025-26'
    """
    try:
        start_year = int(fy_string.split("-")[0])
    except (ValueError, IndexError):
        return ""
    
    ay_start = start_year + 1
    ay_end = ay_start + 1
    
    return f"{ay_start}-{str(ay_end)[-2:]}"


def get_current_fy_quarter(ref_date: Optional[date] = None) -> int:
    """
    @brief Get current quarter of the financial year.
    
    @param ref_date Reference date (default: today)
    @return Quarter number (1-4)
    
    @details
    - Q1: April-June
    - Q2: July-September
    - Q3: October-December
    - Q4: January-March
    
    @example
    >>> get_current_fy_quarter(date(2024, 8, 15))
    2
    """
    if ref_date is None:
        ref_date = date.today()
    
    month = ref_date.month
    
    if month in [4, 5, 6]:
        return 1
    elif month in [7, 8, 9]:
        return 2
    elif month in [10, 11, 12]:
        return 3
    else:  # 1, 2, 3
        return 4


def get_fy_progress(ref_date: Optional[date] = None) -> float:
    """
    @brief Get progress through current financial year (0-100%).
    
    @param ref_date Reference date (default: today)
    @return Progress percentage
    
    @example
    >>> get_fy_progress(date(2024, 10, 1))  # October = halfway
    50.0
    """
    if ref_date is None:
        ref_date = date.today()
    
    fy = get_financial_year(ref_date)
    fy_start, fy_end = get_fy_dates(fy)
    
    total_days = (fy_end - fy_start).days + 1
    elapsed_days = (ref_date - fy_start).days + 1
    
    progress = (elapsed_days / total_days) * 100
    
    return round(min(100.0, max(0.0, progress)), 2)


# =============================================================================
# DATE DIFFERENCE FUNCTIONS
# =============================================================================

def days_until(target_date: date, from_date: Optional[date] = None) -> int:
    """
    @brief Calculate days until a target date.
    
    @param target_date Target date
    @param from_date Starting date (default: today)
    @return Number of days (negative if target is in past)
    
    @example
    >>> days_until(date(2024, 12, 31), date(2024, 12, 1))
    30
    """
    if from_date is None:
        from_date = date.today()
    
    return (target_date - from_date).days


def months_between(
    start_date: date,
    end_date: date,
    include_partial: bool = True
) -> int:
    """
    @brief Calculate months between two dates.
    
    @param start_date Starting date
    @param end_date Ending date
    @param include_partial Whether to include partial months
    @return Number of months
    
    @example
    >>> months_between(date(2024, 1, 1), date(2024, 6, 15))
    6  # With partial
    >>> months_between(date(2024, 1, 1), date(2024, 6, 15), include_partial=False)
    5  # Without partial
    """
    if end_date < start_date:
        start_date, end_date = end_date, start_date
    
    # Calculate full years and months difference
    year_diff = end_date.year - start_date.year
    month_diff = end_date.month - start_date.month
    day_diff = end_date.day - start_date.day
    
    total_months = year_diff * 12 + month_diff
    
    if include_partial:
        if day_diff > 0:
            total_months += 1
    else:
        if day_diff < 0:
            total_months -= 1
    
    return max(0, total_months)


def add_months(ref_date: date, months: int) -> date:
    """
    @brief Add months to a date.
    
    @param ref_date Starting date
    @param months Number of months to add (can be negative)
    @return Resulting date
    
    @example
    >>> add_months(date(2024, 1, 31), 1)
    date(2024, 2, 29)  # Handles month-end correctly
    """
    return ref_date + relativedelta(months=months)


def get_month_end(ref_date: date) -> date:
    """
    @brief Get the last day of the month for a given date.
    
    @param ref_date Reference date
    @return Last day of that month
    
    @example
    >>> get_month_end(date(2024, 2, 15))
    date(2024, 2, 29)
    """
    # Go to first of next month, then back one day
    if ref_date.month == 12:
        next_month_first = date(ref_date.year + 1, 1, 1)
    else:
        next_month_first = date(ref_date.year, ref_date.month + 1, 1)
    
    return next_month_first - timedelta(days=1)


def get_year_month_string(ref_date: date) -> str:
    """
    @brief Get YYYY-MM string for a date.
    
    @param ref_date Reference date
    @return String in YYYY-MM format
    
    @example
    >>> get_year_month_string(date(2024, 8, 15))
    '2024-08'
    """
    return ref_date.strftime("%Y-%m")


# =============================================================================
# TAX DEADLINE FUNCTIONS
# =============================================================================

def get_next_tax_deadline(
    ref_date: Optional[date] = None
) -> Tuple[str, date, int]:
    """
    @brief Get the next upcoming tax deadline.
    
    @param ref_date Reference date (default: today)
    @return Tuple of (deadline_name, deadline_date, days_until)
    
    @example
    >>> name, deadline, days = get_next_tax_deadline(date(2024, 6, 1))
    >>> name
    'advance_tax_q1'
    >>> deadline
    date(2024, 6, 15)
    """
    if ref_date is None:
        ref_date = date.today()
    
    current_fy = get_financial_year(ref_date)
    fy_start, fy_end = get_fy_dates(current_fy)
    
    # Build list of upcoming deadlines
    deadlines = []
    
    for name, (month, day) in TAX_DEADLINES.items():
        # Determine year based on whether deadline is before or after April
        if month >= 4:
            deadline_year = fy_start.year
        else:
            deadline_year = fy_end.year
        
        deadline_date = date(deadline_year, month, day)
        
        if deadline_date >= ref_date:
            days = days_until(deadline_date, ref_date)
            deadlines.append((name, deadline_date, days))
    
    # Sort by days and return nearest
    if deadlines:
        deadlines.sort(key=lambda x: x[2])
        return deadlines[0]
    
    # If all deadlines passed, return first of next FY
    next_fy_start = date(fy_end.year + 1, 4, 1)
    return ("advance_tax_q1", date(next_fy_start.year, 6, 15), days_until(date(next_fy_start.year, 6, 15), ref_date))


def get_all_fy_deadlines(fy_string: Optional[str] = None) -> List[Tuple[str, date]]:
    """
    @brief Get all tax deadlines for a financial year.
    
    @param fy_string Financial year (default: current)
    @return List of (deadline_name, deadline_date) tuples
    """
    if fy_string is None:
        fy_string = get_financial_year()
    
    fy_start, fy_end = get_fy_dates(fy_string)
    deadlines = []
    
    for name, (month, day) in TAX_DEADLINES.items():
        if month >= 4:
            year = fy_start.year
        else:
            year = fy_end.year
        
        deadlines.append((name, date(year, month, day)))
    
    # Sort chronologically
    deadlines.sort(key=lambda x: x[1])
    
    return deadlines


# =============================================================================
# PROJECTION DATE UTILITIES
# =============================================================================

def generate_projection_months(
    start_date: Optional[date] = None,
    num_months: int = 12
) -> List[Tuple[str, date]]:
    """
    @brief Generate list of future months for projection.
    
    @param start_date Starting date (default: today)
    @param num_months Number of months to generate
    @return List of (YYYY-MM string, first day of month) tuples
    
    @example
    >>> months = generate_projection_months(date(2024, 8, 15), 3)
    >>> months
    [('2024-08', date(2024, 8, 1)), ('2024-09', date(2024, 9, 1)), ('2024-10', date(2024, 10, 1))]
    """
    if start_date is None:
        start_date = date.today()
    
    # Start from first of current month
    current = date(start_date.year, start_date.month, 1)
    
    result = []
    for i in range(num_months):
        month_date = add_months(current, i)
        result.append((get_year_month_string(month_date), month_date))
    
    return result


def parse_date_string(date_string: str) -> Optional[date]:
    """
    @brief Parse common date string formats.
    
    @param date_string Date string in various formats
    @return Parsed date or None if invalid
    
    @details
    Supported formats:
    - YYYY-MM-DD
    - DD/MM/YYYY  
    - DD-MM-YYYY
    - YYYY/MM/DD
    """
    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%Y/%m/%d",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_string.strip(), fmt).date()
        except ValueError:
            continue
    
    return None
