"""
@file app/services/credit_service.py
@brief Credit and loan analysis service.

@description
This service provides comprehensive credit/loan health analysis:
- Debt-to-Income (DTI) ratio evaluation
- EMI burden assessment
- Payment discipline scoring
- Prepayment benefit calculations
- Credit risk alerts

@author HackVengers Team
@version 1.0.0
"""

from typing import Dict, List, Optional
import logging

from app.models.schemas import (
    CreditAnalyzeRequest,
    CreditAnalyzeResponse,
    LoanInput,
    PaymentHistory,
    PrepaymentAnalysis,
)
from app.rules.credit_rules import (
    calculate_dti,
    evaluate_dti,
    calculate_emi_burden,
    calculate_payment_discipline_score,
    calculate_prepayment_benefit,
    analyze_loan_portfolio,
    generate_credit_alerts,
    RiskLevel,
)

logger = logging.getLogger(__name__)


# =============================================================================
# INTERNAL HELPER FUNCTIONS
# =============================================================================

def _convert_payment_history(
    history: Optional[List[PaymentHistory]]
) -> List[Dict]:
    """
    @brief Convert PaymentHistory schemas to dictionaries.
    
    @param history List of PaymentHistory objects
    @return List of dictionaries for rules processing
    """
    if not history:
        return []
    
    return [
        {
            "loan": h.loan,
            "month": h.month,
            "status": h.status,
            "days_late": h.days_late,
        }
        for h in history
    ]


def _convert_loans(loans: List[LoanInput]) -> List[Dict]:
    """
    @brief Convert LoanInput schemas to dictionaries.
    
    @param loans List of LoanInput objects
    @return List of dictionaries for rules processing
    """
    return [
        {
            "name": loan.name,
            "principal": loan.principal,
            "outstanding": loan.outstanding,
            "emi": loan.emi,
            "interest_rate": loan.interest_rate,
            "remaining_months": loan.remaining_months,
            "start_date": loan.start_date,
        }
        for loan in loans
    ]


def _analyze_single_loan(loan: LoanInput) -> Dict:
    """
    @brief Analyze a single loan's health metrics.
    
    @param loan LoanInput object
    @return Analysis dictionary
    """
    # Calculate progress
    progress = 0.0
    if loan.principal > 0:
        progress = ((loan.principal - loan.outstanding) / loan.principal) * 100
    
    # Calculate remaining interest
    total_remaining = loan.emi * loan.remaining_months
    interest_remaining = max(0, total_remaining - loan.outstanding)
    
    # Identify risk factors
    risk_factors = []
    
    if loan.interest_rate > 14:
        risk_factors.append(f"High interest rate ({loan.interest_rate}%)")
    
    if loan.remaining_months > 180:
        risk_factors.append("Very long remaining tenure (15+ years)")
    elif loan.remaining_months > 120:
        risk_factors.append("Long remaining tenure (10+ years)")
    
    if loan.outstanding > loan.principal * 0.9:
        risk_factors.append("Very early in repayment (>90% outstanding)")
    
    # Determine priority for prepayment
    prepay_priority = "low"
    if loan.interest_rate > 12:
        prepay_priority = "high"
    elif loan.interest_rate > 9:
        prepay_priority = "medium"
    
    return {
        "name": loan.name,
        "principal": loan.principal,
        "outstanding": round(loan.outstanding, 2),
        "emi": loan.emi,
        "interest_rate": loan.interest_rate,
        "remaining_months": loan.remaining_months,
        "remaining_years": round(loan.remaining_months / 12, 1),
        "total_remaining_payment": round(total_remaining, 2),
        "interest_remaining": round(interest_remaining, 2),
        "progress_percent": round(progress, 2),
        "risk_factors": risk_factors,
        "prepay_priority": prepay_priority,
        "health": "good" if len(risk_factors) == 0 else ("concern" if len(risk_factors) == 1 else "at_risk"),
    }


def _generate_prepayment_recommendations(
    loans: List[LoanInput],
    monthly_income: float,
    available_surplus: Optional[float] = None
) -> List[PrepaymentAnalysis]:
    """
    @brief Generate prepayment recommendations for loans.
    
    @param loans List of loans
    @param monthly_income Monthly income
    @param available_surplus Optional surplus available for prepayment
    @return List of PrepaymentAnalysis objects
    
    @details
    Strategy:
    1. Prioritize highest interest rate loans first
    2. Calculate benefit of prepaying 1 month's EMI equivalent
    3. Provide ROI comparison
    """
    if not loans:
        return []
    
    # Default surplus to 10% of income if not specified
    if available_surplus is None:
        available_surplus = monthly_income * 0.10
    
    recommendations = []
    
    # Sort by interest rate (highest first)
    sorted_loans = sorted(loans, key=lambda x: x.interest_rate, reverse=True)
    
    for loan in sorted_loans[:3]:  # Top 3 high-rate loans
        # Calculate benefit of prepaying 1 EMI equivalent
        prepay_amount = min(loan.emi * 3, loan.outstanding * 0.1, available_surplus)
        
        if prepay_amount < 1000:  # Skip if too small
            continue
        
        benefit = calculate_prepayment_benefit(
            outstanding=loan.outstanding,
            emi=loan.emi,
            interest_rate=loan.interest_rate,
            remaining_months=loan.remaining_months,
            prepay_amount=prepay_amount
        )
        
        recommendations.append(PrepaymentAnalysis(
            loan_name=loan.name,
            prepay_amount=round(prepay_amount, 2),
            interest_saved=benefit.interest_saved,
            tenure_reduced_months=benefit.tenure_reduced_months,
            new_remaining_months=benefit.new_remaining_months,
        ))
    
    return recommendations


# =============================================================================
# PUBLIC API FUNCTIONS
# =============================================================================

def analyze_credit(request: CreditAnalyzeRequest) -> CreditAnalyzeResponse:
    """
    @brief Perform comprehensive credit health analysis.
    
    @param request CreditAnalyzeRequest with loans and income
    @return CreditAnalyzeResponse with complete analysis
    
    @details
    Analysis includes:
    1. Total debt position
    2. DTI ratio evaluation
    3. EMI burden assessment
    4. Payment discipline score
    5. Per-loan analysis
    6. Prepayment recommendations
    7. Risk alerts
    
    @example
    >>> request = CreditAnalyzeRequest(
    ...     loans=[LoanInput(name="Home Loan", ...)],
    ...     monthly_income=100000,
    ... )
    >>> response = analyze_credit(request)
    >>> response.debt_to_income
    35.5
    """
    loans = request.loans
    income = request.monthly_income
    payment_history = request.payment_history
    
    # Calculate totals
    total_outstanding = sum(loan.outstanding for loan in loans)
    total_emi = sum(loan.emi for loan in loans)
    
    # Calculate DTI ratio
    dti_ratio = calculate_dti(total_emi, income)
    dti_evaluation = evaluate_dti(dti_ratio)
    
    # Calculate EMI burden
    burden_ratio, burden_level, burden_message = calculate_emi_burden(total_emi, income)
    
    # Calculate payment discipline score
    history_dicts = _convert_payment_history(payment_history)
    payment_score = calculate_payment_discipline_score(history_dicts)
    
    # Analyze each loan
    loan_analysis = [_analyze_single_loan(loan) for loan in loans]
    
    # Generate prepayment recommendations
    prepayment_recs = _generate_prepayment_recommendations(loans, income)
    
    # Calculate overall credit health score
    # Weighted average: DTI (40%), EMI burden (30%), Payment discipline (30%)
    dti_score_min, dti_score_max = dti_evaluation.credit_score_impact
    dti_score = (dti_score_min + dti_score_max) / 2
    
    if burden_level == "safe":
        burden_score = 90
    elif burden_level == "moderate":
        burden_score = 70
    elif burden_level == "high":
        burden_score = 45
    else:
        burden_score = 20
    
    overall_health = int(
        dti_score * 0.4 +
        burden_score * 0.3 +
        payment_score * 0.3
    )
    overall_health = max(0, min(100, overall_health))
    
    # Generate credit alerts
    loan_dicts = _convert_loans(loans)
    alerts = generate_credit_alerts(dti_ratio, burden_ratio, payment_score, loan_dicts)
    
    return CreditAnalyzeResponse(
        total_outstanding=round(total_outstanding, 2),
        total_emi=round(total_emi, 2),
        debt_to_income=dti_ratio,
        emi_burden_ratio=burden_ratio,
        payment_discipline_score=payment_score,
        overall_credit_health=overall_health,
        loan_analysis=loan_analysis,
        prepayment_recommendations=prepayment_recs,
        alerts=alerts,
    )


def get_loan_comparison(
    loan1: LoanInput,
    loan2: LoanInput
) -> Dict:
    """
    @brief Compare two loans for refinancing decision.
    
    @param loan1 Current loan
    @param loan2 Alternative/refinance loan
    @return Comparison dictionary
    
    @note Useful for evaluating loan refinancing options.
    """
    analysis1 = _analyze_single_loan(loan1)
    analysis2 = _analyze_single_loan(loan2)
    
    # Calculate total cost difference
    cost1 = loan1.emi * loan1.remaining_months
    cost2 = loan2.emi * loan2.remaining_months
    
    savings = cost1 - cost2
    
    return {
        "current_loan": analysis1,
        "alternative_loan": analysis2,
        "total_cost_current": round(cost1, 2),
        "total_cost_alternative": round(cost2, 2),
        "savings_with_alternative": round(savings, 2),
        "recommendation": "Switch to alternative" if savings > 50000 else "Keep current loan",
        "monthly_emi_difference": round(loan1.emi - loan2.emi, 2),
    }


def calculate_debt_freedom_date(loans: List[LoanInput]) -> Dict:
    """
    @brief Calculate when all loans will be paid off.
    
    @param loans List of active loans
    @return Debt freedom analysis
    """
    if not loans:
        return {
            "already_debt_free": True,
            "message": "Congratulations! You have no active loans.",
        }
    
    # Find loan with longest remaining tenure
    max_months = max(loan.remaining_months for loan in loans)
    
    from datetime import date
    from app.utils.date_utils import add_months
    
    freedom_date = add_months(date.today(), max_months)
    years_remaining = max_months / 12
    
    # Total remaining payments
    total_remaining = sum(loan.emi * loan.remaining_months for loan in loans)
    
    return {
        "already_debt_free": False,
        "debt_freedom_date": freedom_date.isoformat(),
        "months_remaining": max_months,
        "years_remaining": round(years_remaining, 1),
        "total_remaining_payments": round(total_remaining, 2),
        "active_loans": len(loans),
        "message": f"You'll be debt-free by {freedom_date.strftime('%B %Y')} ({years_remaining:.1f} years)",
    }
