"""
@file app/services/alert_service.py
@brief Alert and compliance checking service.

@description
This service generates financial alerts and reminders:
- Tax filing deadlines (ITR, advance tax)
- Insurance renewal reminders
- Budget violation alerts
- General compliance checks

@author HackVengers Team
@version 1.0.0
"""

from typing import Dict, List, Optional
from datetime import date
import uuid
import logging

from app.models.schemas import (
    AlertCheckRequest,
    AlertCheckResponse,
    Alert,
    AlertSeverity,
    FinancialState,
    FilingStatus,
    AdvanceTaxStatus,
    InsuranceInfo,
    BudgetStatus,
)
from app.utils.date_utils import (
    get_financial_year,
    get_fy_dates,
    get_next_tax_deadline,
    days_until,
)

logger = logging.getLogger(__name__)


# =============================================================================
# CONSTANTS
# =============================================================================

#: Days before deadline to show warning
DEADLINE_WARNING_DAYS = 30
DEADLINE_URGENT_DAYS = 7

#: Budget overspend threshold (percentage)
BUDGET_WARNING_THRESHOLD = 80  # 80% used
BUDGET_CRITICAL_THRESHOLD = 100  # 100% or more used

#: Insurance renewal warning days
INSURANCE_WARNING_DAYS = 60
INSURANCE_URGENT_DAYS = 14


# =============================================================================
# INTERNAL HELPER FUNCTIONS
# =============================================================================

def _generate_alert_id() -> str:
    """Generate unique alert ID."""
    return f"alert_{uuid.uuid4().hex[:8]}"


def _check_tax_filing_deadlines(
    current_date: date,
    filing_status: Optional[FilingStatus]
) -> List[Alert]:
    """
    @brief Check tax filing related deadlines.
    
    @param current_date Current date for calculations
    @param filing_status ITR filing status
    @return List of tax-related alerts
    """
    alerts = []
    fy = get_financial_year(current_date)
    fy_start, fy_end = get_fy_dates(fy)
    
    # Get next tax deadline
    deadline_name, deadline_date, days_left = get_next_tax_deadline(current_date)
    
    # ITR deadline checks
    itr_deadline = date(fy_end.year, 7, 31)  # July 31 of next year
    days_to_itr = days_until(itr_deadline, current_date)
    
    if filing_status and not filing_status.itr_filed_current_fy:
        if 0 < days_to_itr <= DEADLINE_URGENT_DAYS:
            alerts.append(Alert(
                id=_generate_alert_id(),
                type="itr_deadline_urgent",
                severity=AlertSeverity.HIGH,
                title="ITR Filing Deadline Imminent!",
                message=f"Only {days_to_itr} days left to file ITR for FY {fy}. Late filing attracts penalty.",
                due_date=itr_deadline,
                action="File ITR immediately on incometax.gov.in",
            ))
        elif 0 < days_to_itr <= DEADLINE_WARNING_DAYS:
            alerts.append(Alert(
                id=_generate_alert_id(),
                type="itr_deadline_warning",
                severity=AlertSeverity.MEDIUM,
                title="ITR Filing Deadline Approaching",
                message=f"{days_to_itr} days left to file ITR for FY {fy}. Gather documents now.",
                due_date=itr_deadline,
                action="Prepare Form 16, investment proofs, and bank statements",
            ))
    
    # Advance tax deadline checks
    if days_left <= DEADLINE_URGENT_DAYS and days_left > 0:
        alerts.append(Alert(
            id=_generate_alert_id(),
            type="advance_tax_urgent",
            severity=AlertSeverity.HIGH,
            title=f"Advance Tax Due in {days_left} Days",
            message=f"Next advance tax installment due on {deadline_date.strftime('%B %d, %Y')}",
            due_date=deadline_date,
            action="Calculate and pay advance tax to avoid interest u/s 234C",
        ))
    elif days_left <= DEADLINE_WARNING_DAYS and days_left > DEADLINE_URGENT_DAYS:
        alerts.append(Alert(
            id=_generate_alert_id(),
            type="advance_tax_reminder",
            severity=AlertSeverity.MEDIUM,
            title="Advance Tax Installment Due Soon",
            message=f"Advance tax due on {deadline_date.strftime('%B %d')} ({days_left} days)",
            due_date=deadline_date,
            action="Estimate tax liability and prepare for payment",
        ))
    
    return alerts


def _check_advance_tax_compliance(
    current_date: date,
    advance_tax: Optional[AdvanceTaxStatus]
) -> List[Alert]:
    """
    @brief Check advance tax payment compliance.
    
    @param current_date Current date
    @param advance_tax Advance tax payment status
    @return List of compliance alerts
    """
    if not advance_tax:
        return []
    
    alerts = []
    fy = get_financial_year(current_date)
    fy_start, fy_end = get_fy_dates(fy)
    
    # Calculate expected payments by quarter
    estimated = advance_tax.estimated_liability
    if estimated <= 10000:
        return []  # No advance tax needed below 10K
    
    # Quarter deadlines and cumulative expectations
    quarters = [
        ("Q1", date(fy_start.year, 6, 15), 0.15),   # 15% by June 15
        ("Q2", date(fy_start.year, 9, 15), 0.45),   # 45% by Sep 15
        ("Q3", date(fy_start.year, 12, 15), 0.75),  # 75% by Dec 15
        ("Q4", date(fy_end.year, 3, 15), 1.00),     # 100% by Mar 15
    ]
    
    paid_amounts = [
        advance_tax.paid_q1,
        advance_tax.paid_q1 + advance_tax.paid_q2,
        advance_tax.paid_q1 + advance_tax.paid_q2 + advance_tax.paid_q3,
        advance_tax.paid_q1 + advance_tax.paid_q2 + advance_tax.paid_q3 + advance_tax.paid_q4,
    ]
    
    for i, (quarter, deadline, cumulative_pct) in enumerate(quarters):
        if current_date > deadline:
            # Check if this quarter's target was met
            expected = estimated * cumulative_pct
            paid = paid_amounts[i]
            shortfall = expected - paid
            
            if shortfall > 5000:  # Significant shortfall
                alerts.append(Alert(
                    id=_generate_alert_id(),
                    type="advance_tax_shortfall",
                    severity=AlertSeverity.MEDIUM,
                    title=f"Advance Tax Shortfall in {quarter}",
                    message=f"Paid ₹{paid:,.0f} vs expected ₹{expected:,.0f}. Shortfall: ₹{shortfall:,.0f}",
                    due_date=None,
                    action="Pay shortfall in next installment to minimize interest",
                ))
    
    return alerts


def _check_insurance_renewals(
    current_date: date,
    insurance_list: Optional[List[InsuranceInfo]]
) -> List[Alert]:
    """
    @brief Check insurance policy renewals.
    
    @param current_date Current date
    @param insurance_list List of insurance policies
    @return List of renewal alerts
    """
    if not insurance_list:
        return []
    
    alerts = []
    
    for policy in insurance_list:
        days_to_expiry = days_until(policy.expiry, current_date)
        
        if days_to_expiry < 0:
            # Already expired
            alerts.append(Alert(
                id=_generate_alert_id(),
                type="insurance_expired",
                severity=AlertSeverity.HIGH,
                title=f"{policy.type.title()} Insurance Expired!",
                message=f"Policy expired on {policy.expiry.strftime('%B %d, %Y')}. You are unprotected!",
                due_date=policy.expiry,
                action="Renew immediately or purchase new policy",
            ))
        elif days_to_expiry <= INSURANCE_URGENT_DAYS:
            alerts.append(Alert(
                id=_generate_alert_id(),
                type="insurance_expiring_urgent",
                severity=AlertSeverity.HIGH,
                title=f"{policy.type.title()} Insurance Expiring Soon!",
                message=f"Policy expires in {days_to_expiry} days. Premium: ₹{policy.premium:,.0f}",
                due_date=policy.expiry,
                action="Renew now to avoid coverage gap",
            ))
        elif days_to_expiry <= INSURANCE_WARNING_DAYS:
            alerts.append(Alert(
                id=_generate_alert_id(),
                type="insurance_renewal_reminder",
                severity=AlertSeverity.MEDIUM,
                title=f"{policy.type.title()} Insurance Renewal Due",
                message=f"Policy expires on {policy.expiry.strftime('%B %d')} ({days_to_expiry} days)",
                due_date=policy.expiry,
                action=f"Compare plans and budget ₹{policy.premium:,.0f} for renewal",
            ))
    
    return alerts


def _check_budget_violations(
    current_date: date,
    budgets: Optional[List[BudgetStatus]]
) -> List[Alert]:
    """
    @brief Check budget spending violations.
    
    @param current_date Current date
    @param budgets List of budget statuses
    @return List of budget alerts
    """
    if not budgets:
        return []
    
    alerts = []
    
    for budget in budgets:
        if budget.limit <= 0:
            continue
        
        usage_percent = (budget.spent / budget.limit) * 100
        overspent = budget.spent - budget.limit
        
        if usage_percent >= BUDGET_CRITICAL_THRESHOLD:
            alerts.append(Alert(
                id=_generate_alert_id(),
                type="budget_exceeded",
                severity=AlertSeverity.HIGH,
                title=f"{budget.category} Budget Exceeded!",
                message=f"Spent ₹{budget.spent:,.0f} of ₹{budget.limit:,.0f} limit. Over by ₹{overspent:,.0f}",
                due_date=None,
                action=f"Cut {budget.category} spending immediately this month",
            ))
        elif usage_percent >= BUDGET_WARNING_THRESHOLD:
            remaining = budget.limit - budget.spent
            alerts.append(Alert(
                id=_generate_alert_id(),
                type="budget_warning",
                severity=AlertSeverity.MEDIUM,
                title=f"{budget.category} Budget at {usage_percent:.0f}%",
                message=f"Only ₹{remaining:,.0f} remaining in {budget.category} budget",
                due_date=None,
                action=f"Slow down {budget.category} spending to stay within limit",
            ))
    
    return alerts


def _get_upcoming_deadlines(current_date: date) -> List[Dict]:
    """
    @brief Get list of upcoming financial deadlines.
    
    @param current_date Current date
    @return List of upcoming deadline dictionaries
    """
    fy = get_financial_year(current_date)
    fy_start, fy_end = get_fy_dates(fy)
    
    # All important deadlines
    deadlines = [
        {
            "name": "Advance Tax Q1",
            "date": date(fy_start.year, 6, 15),
            "description": "First installment (15% of estimated tax)",
        },
        {
            "name": "Advance Tax Q2",
            "date": date(fy_start.year, 9, 15),
            "description": "Second installment (45% cumulative)",
        },
        {
            "name": "Advance Tax Q3",
            "date": date(fy_start.year, 12, 15),
            "description": "Third installment (75% cumulative)",
        },
        {
            "name": "Advance Tax Q4",
            "date": date(fy_end.year, 3, 15),
            "description": "Final installment (100%)",
        },
        {
            "name": "ITR Filing (Non-Audit)",
            "date": date(fy_end.year, 7, 31),
            "description": f"Due date for ITR filing for FY {fy}",
        },
        {
            "name": "Belated ITR",
            "date": date(fy_end.year, 12, 31),
            "description": "Last date to file belated return (with penalty)",
        },
        {
            "name": "80C Investments",
            "date": date(fy_end.year, 3, 31),
            "description": "Last date for tax-saving investments",
        },
    ]
    
    # Filter to upcoming only
    upcoming = []
    for d in deadlines:
        days = days_until(d["date"], current_date)
        if 0 <= days <= 90:  # Within next 90 days
            upcoming.append({
                **d,
                "date": d["date"].isoformat(),
                "days_remaining": days,
            })
    
    # Sort by date
    upcoming.sort(key=lambda x: x["days_remaining"])
    
    return upcoming


# =============================================================================
# PUBLIC API FUNCTIONS
# =============================================================================

def check_alerts(request: AlertCheckRequest) -> AlertCheckResponse:
    """
    @brief Check all financial alerts and compliance items.
    
    @param request AlertCheckRequest with current date and financial state
    @return AlertCheckResponse with all applicable alerts
    
    @details
    Checks:
    1. Tax filing deadlines
    2. Advance tax compliance
    3. Insurance renewals
    4. Budget violations
    
    @example
    >>> request = AlertCheckRequest(
    ...     current_date=date.today(),
    ...     financial_state=FinancialState(...),
    ... )
    >>> response = check_alerts(request)
    >>> response.total_alerts
    3
    """
    current_date = request.current_date
    state = request.financial_state
    
    all_alerts: List[Alert] = []
    
    # Check tax filing deadlines
    all_alerts.extend(_check_tax_filing_deadlines(
        current_date,
        state.filing_status
    ))
    
    # Check advance tax compliance
    all_alerts.extend(_check_advance_tax_compliance(
        current_date,
        state.advance_tax
    ))
    
    # Check insurance renewals
    all_alerts.extend(_check_insurance_renewals(
        current_date,
        state.insurance
    ))
    
    # Check budget violations
    all_alerts.extend(_check_budget_violations(
        current_date,
        state.budgets
    ))
    
    # Sort by severity (high first)
    severity_order = {
        AlertSeverity.HIGH: 0,
        AlertSeverity.MEDIUM: 1,
        AlertSeverity.LOW: 2,
        AlertSeverity.INFO: 3,
    }
    all_alerts.sort(key=lambda a: severity_order.get(a.severity, 4))
    
    # Get upcoming deadlines
    upcoming = _get_upcoming_deadlines(current_date)
    
    # Count high priority
    high_priority_count = sum(1 for a in all_alerts if a.severity == AlertSeverity.HIGH)
    
    return AlertCheckResponse(
        alerts=all_alerts,
        upcoming=upcoming,
        total_alerts=len(all_alerts),
        high_priority_count=high_priority_count,
    )


def get_tax_calendar(fy: Optional[str] = None) -> List[Dict]:
    """
    @brief Get complete tax calendar for a financial year.
    
    @param fy Financial year (default: current)
    @return List of all tax-related dates
    """
    if fy is None:
        fy = get_financial_year()
    
    fy_start, fy_end = get_fy_dates(fy)
    
    return [
        {
            "date": date(fy_start.year, 6, 15).isoformat(),
            "event": "Advance Tax - 1st Installment",
            "amount": "15% of estimated tax",
            "penalty_section": "234C",
        },
        {
            "date": date(fy_start.year, 9, 15).isoformat(),
            "event": "Advance Tax - 2nd Installment",
            "amount": "45% of estimated tax (cumulative)",
            "penalty_section": "234C",
        },
        {
            "date": date(fy_start.year, 12, 15).isoformat(),
            "event": "Advance Tax - 3rd Installment",
            "amount": "75% of estimated tax (cumulative)",
            "penalty_section": "234C",
        },
        {
            "date": date(fy_end.year, 3, 15).isoformat(),
            "event": "Advance Tax - 4th Installment",
            "amount": "100% of estimated tax",
            "penalty_section": "234C",
        },
        {
            "date": date(fy_end.year, 3, 31).isoformat(),
            "event": "FY End / 80C Deadline",
            "amount": "Complete tax-saving investments",
            "penalty_section": "N/A",
        },
        {
            "date": date(fy_end.year, 7, 31).isoformat(),
            "event": "ITR Filing Due (Non-Audit)",
            "amount": "File before to avoid penalty",
            "penalty_section": "234F (₹1,000-10,000)",
        },
        {
            "date": date(fy_end.year, 12, 31).isoformat(),
            "event": "Belated ITR Last Date",
            "amount": "With ₹5,000-10,000 penalty",
            "penalty_section": "234F",
        },
    ]
