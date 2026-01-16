"""
@file app/rules/credit_rules.py
@brief Credit health evaluation rules and loan analysis.

@description
This module provides rules for evaluating credit/loan health:
- Debt-to-Income (DTI) ratio thresholds
- EMI burden assessment
- Prepayment benefit calculations
- Credit risk scoring

All calculations follow Indian banking norms and best practices.

@author HackVengers Team
@version 1.0.0
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


# =============================================================================
# CONSTANTS & THRESHOLDS
# =============================================================================

class RiskLevel(str, Enum):
    """Credit risk levels."""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


#: Debt-to-Income (DTI) ratio thresholds
#: DTI = (Total Monthly Debt Payments / Monthly Gross Income) * 100
DTI_THRESHOLDS: Dict[str, Dict[str, any]] = {
    "excellent": {
        "max": 20.0,
        "label": "Excellent",
        "description": "Very healthy debt level, room for more credit if needed",
        "risk_level": RiskLevel.LOW,
        "score_range": (90, 100),
    },
    "good": {
        "max": 35.0,
        "label": "Good",
        "description": "Manageable debt, but limit new loans",
        "risk_level": RiskLevel.LOW,
        "score_range": (70, 89),
    },
    "moderate": {
        "max": 43.0,
        "label": "Moderate",
        "description": "Approaching limit, avoid new debt",
        "risk_level": RiskLevel.MODERATE,
        "score_range": (50, 69),
    },
    "high": {
        "max": 50.0,
        "label": "High",
        "description": "Heavily indebted, focus on repayment",
        "risk_level": RiskLevel.HIGH,
        "score_range": (30, 49),
    },
    "critical": {
        "max": float('inf'),
        "label": "Critical",
        "description": "Over-leveraged, urgent action needed",
        "risk_level": RiskLevel.CRITICAL,
        "score_range": (0, 29),
    },
}

#: EMI burden thresholds (EMI/Income ratio)
#: Typically, banks cap EMI burden at 40-50% of income
EMI_BURDEN_THRESHOLDS: Dict[str, float] = {
    "safe": 30.0,      # Up to 30%: Safe
    "moderate": 40.0,  # 30-40%: Moderate
    "high": 50.0,      # 40-50%: High burden
    "critical": 100.0, # Above 50%: Critical
}

#: Maximum recommended FOIR (Fixed Obligations to Income Ratio)
MAX_RECOMMENDED_FOIR: float = 50.0

#: Months of late payment that significantly impact credit score
LATE_PAYMENT_SEVERE_THRESHOLD: int = 90  # 90+ DPD is severe

#: Payment discipline scoring weights
PAYMENT_SCORING: Dict[str, int] = {
    "on_time": 0,       # No penalty
    "1_30_days": 10,    # Minor penalty
    "31_60_days": 25,   # Moderate penalty
    "61_90_days": 40,   # Significant penalty
    "90_plus_days": 60, # Severe penalty
}


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class DTIEvaluation:
    """
    @class DTIEvaluation
    @brief Result of DTI ratio evaluation.
    """
    dti_ratio: float
    category: str
    label: str
    description: str
    risk_level: RiskLevel
    credit_score_impact: Tuple[int, int]


@dataclass
class LoanHealthMetrics:
    """
    @class LoanHealthMetrics
    @brief Health metrics for a single loan.
    """
    loan_name: str
    outstanding: float
    emi: float
    interest_rate: float
    remaining_months: int
    total_remaining_payment: float
    total_interest_remaining: float
    progress_percent: float
    on_track: bool
    risk_factors: List[str]


@dataclass
class PrepaymentBenefit:
    """
    @class PrepaymentBenefit
    @brief Analysis of prepayment benefits.
    """
    loan_name: str
    prepay_amount: float
    interest_saved: float
    tenure_reduced_months: int
    new_remaining_months: int
    roi_percentage: float
    recommendation: str


# =============================================================================
# CORE FUNCTIONS
# =============================================================================

def calculate_dti(
    total_monthly_emi: float,
    monthly_income: float
) -> float:
    """
    @brief Calculate Debt-to-Income ratio.
    
    @param total_monthly_emi Sum of all EMI payments
    @param monthly_income Gross monthly income
    @return DTI ratio as percentage (0-100+)
    
    @example
    >>> calculate_dti(40000, 100000)
    40.0
    """
    if monthly_income <= 0:
        return 100.0  # Maximum risk if no income
    
    return round((total_monthly_emi / monthly_income) * 100, 2)


def evaluate_dti(dti_ratio: float) -> DTIEvaluation:
    """
    @brief Evaluate DTI ratio and provide assessment.
    
    @param dti_ratio Debt-to-income ratio percentage
    @return DTIEvaluation with category and recommendations
    
    @example
    >>> eval_result = evaluate_dti(35.0)
    >>> eval_result.category
    'moderate'
    """
    prev_max = 0.0
    
    for category, thresholds in DTI_THRESHOLDS.items():
        if dti_ratio <= thresholds["max"]:
            return DTIEvaluation(
                dti_ratio=dti_ratio,
                category=category,
                label=thresholds["label"],
                description=thresholds["description"],
                risk_level=thresholds["risk_level"],
                credit_score_impact=thresholds["score_range"],
            )
        prev_max = thresholds["max"]
    
    # Fallback to critical (should not reach here due to inf max)
    critical = DTI_THRESHOLDS["critical"]
    return DTIEvaluation(
        dti_ratio=dti_ratio,
        category="critical",
        label=critical["label"],
        description=critical["description"],
        risk_level=critical["risk_level"],
        credit_score_impact=critical["score_range"],
    )


def calculate_emi_burden(
    total_emi: float,
    monthly_income: float
) -> Tuple[float, str, str]:
    """
    @brief Calculate EMI burden ratio and assess risk.
    
    @param total_emi Total monthly EMI payments
    @param monthly_income Monthly income
    @return Tuple of (burden_ratio, risk_level, message)
    
    @example
    >>> ratio, level, msg = calculate_emi_burden(35000, 100000)
    >>> level
    'moderate'
    """
    if monthly_income <= 0:
        return (100.0, "critical", "No income reported - EMI burden is unsustainable")
    
    burden_ratio = (total_emi / monthly_income) * 100
    
    if burden_ratio <= EMI_BURDEN_THRESHOLDS["safe"]:
        return (
            round(burden_ratio, 2),
            "safe",
            f"EMI burden at {burden_ratio:.1f}% is healthy. You have room for emergencies."
        )
    elif burden_ratio <= EMI_BURDEN_THRESHOLDS["moderate"]:
        return (
            round(burden_ratio, 2),
            "moderate",
            f"EMI burden at {burden_ratio:.1f}% is manageable but limits flexibility."
        )
    elif burden_ratio <= EMI_BURDEN_THRESHOLDS["high"]:
        return (
            round(burden_ratio, 2),
            "high",
            f"EMI burden at {burden_ratio:.1f}% is high. Avoid new loans."
        )
    else:
        return (
            round(burden_ratio, 2),
            "critical",
            f"EMI burden at {burden_ratio:.1f}% exceeds income capacity. Urgent action needed."
        )


def calculate_payment_discipline_score(
    payment_history: List[Dict[str, any]]
) -> int:
    """
    @brief Calculate payment discipline score from history.
    
    @param payment_history List of payment records with 'status' and 'days_late'
    @return Score from 0 (poor) to 100 (excellent)
    
    @details
    Scoring:
    - Starts at 100
    - Deducts points based on late payments
    - More recent late payments have higher impact
    
    @example
    >>> history = [{"status": "paid", "days_late": 0}, {"status": "missed", "days_late": 45}]
    >>> calculate_payment_discipline_score(history)
    75
    """
    if not payment_history:
        return 100  # No history = assume good
    
    score = 100
    total_payments = len(payment_history)
    
    # Weight recent payments more heavily
    for i, payment in enumerate(payment_history):
        recency_weight = 1 + (i / total_payments)  # Later entries = more recent
        days_late = payment.get("days_late", 0)
        
        if days_late == 0:
            penalty = 0
        elif days_late <= 30:
            penalty = PAYMENT_SCORING["1_30_days"]
        elif days_late <= 60:
            penalty = PAYMENT_SCORING["31_60_days"]
        elif days_late <= 90:
            penalty = PAYMENT_SCORING["61_90_days"]
        else:
            penalty = PAYMENT_SCORING["90_plus_days"]
        
        score -= penalty * recency_weight / total_payments
    
    return max(0, min(100, int(round(score))))


# =============================================================================
# PREPAYMENT ANALYSIS
# =============================================================================

def calculate_prepayment_benefit(
    outstanding: float,
    emi: float,
    interest_rate: float,
    remaining_months: int,
    prepay_amount: float
) -> PrepaymentBenefit:
    """
    @brief Calculate benefits of loan prepayment.
    
    @param outstanding Current outstanding principal
    @param emi Monthly EMI amount
    @param interest_rate Annual interest rate (percentage)
    @param remaining_months Remaining loan tenure
    @param prepay_amount Amount to prepay
    @return PrepaymentBenefit with savings analysis
    
    @details
    Calculates:
    - Interest saved over remaining tenure
    - Months reduced from tenure
    - Effective ROI of prepayment
    
    @example
    >>> benefit = calculate_prepayment_benefit(1000000, 15000, 8.5, 60, 200000)
    >>> benefit.interest_saved
    85000.0
    """
    if outstanding <= 0 or prepay_amount <= 0 or remaining_months <= 0:
        return PrepaymentBenefit(
            loan_name="",
            prepay_amount=0,
            interest_saved=0,
            tenure_reduced_months=0,
            new_remaining_months=remaining_months,
            roi_percentage=0,
            recommendation="Invalid loan parameters"
        )
    
    # Cap prepayment at outstanding amount
    actual_prepay = min(prepay_amount, outstanding)
    
    # Monthly interest rate
    monthly_rate = interest_rate / 100 / 12
    
    # Calculate total interest remaining without prepayment
    total_payment_original = emi * remaining_months
    interest_original = total_payment_original - outstanding
    
    # New outstanding after prepayment
    new_outstanding = outstanding - actual_prepay
    
    if new_outstanding <= 0:
        # Loan fully paid off
        return PrepaymentBenefit(
            loan_name="",
            prepay_amount=actual_prepay,
            interest_saved=round(interest_original, 2),
            tenure_reduced_months=remaining_months,
            new_remaining_months=0,
            roi_percentage=round((interest_original / actual_prepay) * 100, 2),
            recommendation="Full prepayment eliminates all remaining interest!"
        )
    
    # Calculate new tenure with same EMI
    if monthly_rate > 0 and emi > new_outstanding * monthly_rate:
        # Using EMI formula solved for n
        import math
        numerator = math.log(emi / (emi - new_outstanding * monthly_rate))
        denominator = math.log(1 + monthly_rate)
        new_months = int(math.ceil(numerator / denominator))
    else:
        # Simple division for zero/very low interest
        new_months = int(math.ceil(new_outstanding / emi))
    
    months_reduced = remaining_months - new_months
    
    # Calculate new total interest
    total_payment_new = emi * new_months
    interest_new = total_payment_new - new_outstanding
    
    # Interest saved
    interest_saved = interest_original - interest_new
    
    # ROI of prepayment (interest saved / prepayment amount)
    roi = (interest_saved / actual_prepay) * 100 if actual_prepay > 0 else 0
    
    # Generate recommendation
    if roi > 50:
        recommendation = f"Excellent: Prepaying saves {roi:.0f}% in interest! Highly recommended."
    elif roi > 25:
        recommendation = f"Good: Prepaying saves {roi:.0f}% in interest. Consider prepaying."
    elif roi > 10:
        recommendation = f"Moderate: {roi:.0f}% return. Compare with investment alternatives."
    else:
        recommendation = f"Low benefit ({roi:.0f}% return). Investing elsewhere may yield more."
    
    return PrepaymentBenefit(
        loan_name="",
        prepay_amount=actual_prepay,
        interest_saved=round(max(0, interest_saved), 2),
        tenure_reduced_months=max(0, months_reduced),
        new_remaining_months=max(0, new_months),
        roi_percentage=round(roi, 2),
        recommendation=recommendation
    )


def analyze_loan_portfolio(
    loans: List[Dict[str, any]],
    monthly_income: float
) -> Dict[str, any]:
    """
    @brief Analyze complete loan portfolio health.
    
    @param loans List of loan dictionaries with details
    @param monthly_income Monthly income
    @return Comprehensive portfolio analysis
    
    @details
    Analyzes:
    - Total outstanding debt
    - Combined DTI ratio
    - EMI burden
    - Per-loan health metrics
    - Prepayment recommendations
    """
    if not loans:
        return {
            "total_outstanding": 0,
            "total_emi": 0,
            "dti_ratio": 0,
            "emi_burden_ratio": 0,
            "overall_health_score": 100,
            "loan_metrics": [],
            "recommendations": ["No active loans - excellent financial position!"]
        }
    
    total_outstanding = sum(loan.get("outstanding", 0) for loan in loans)
    total_emi = sum(loan.get("emi", 0) for loan in loans)
    
    # Calculate ratios
    dti_ratio = calculate_dti(total_emi, monthly_income)
    dti_eval = evaluate_dti(dti_ratio)
    
    burden_ratio, burden_level, burden_msg = calculate_emi_burden(total_emi, monthly_income)
    
    # Analyze each loan
    loan_metrics = []
    high_rate_loans = []
    
    for loan in loans:
        name = loan.get("name", "Unknown Loan")
        outstanding = loan.get("outstanding", 0)
        principal = loan.get("principal", outstanding)
        emi = loan.get("emi", 0)
        rate = loan.get("interest_rate", 0)
        remaining = loan.get("remaining_months", 0)
        
        # Calculate progress
        progress = ((principal - outstanding) / principal * 100) if principal > 0 else 0
        
        # Calculate total remaining payment and interest
        total_remaining = emi * remaining
        interest_remaining = max(0, total_remaining - outstanding)
        
        # Risk factors
        risk_factors = []
        if rate > 12:
            risk_factors.append(f"High interest rate ({rate}%)")
            high_rate_loans.append(name)
        if remaining > 180:  # 15+ years remaining
            risk_factors.append("Long remaining tenure")
        
        loan_metrics.append(LoanHealthMetrics(
            loan_name=name,
            outstanding=outstanding,
            emi=emi,
            interest_rate=rate,
            remaining_months=remaining,
            total_remaining_payment=round(total_remaining, 2),
            total_interest_remaining=round(interest_remaining, 2),
            progress_percent=round(progress, 2),
            on_track=len(risk_factors) == 0,
            risk_factors=risk_factors
        ))
    
    # Calculate overall health score
    health_score = dti_eval.credit_score_impact[0]  # Base from DTI
    
    # Adjust for EMI burden
    if burden_level == "high":
        health_score -= 10
    elif burden_level == "critical":
        health_score -= 25
    
    # Adjust for high-rate loans
    health_score -= len(high_rate_loans) * 5
    
    health_score = max(0, min(100, health_score))
    
    # Generate recommendations
    recommendations = []
    
    if dti_eval.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
        recommendations.append("Focus on reducing debt before taking new loans")
    
    if high_rate_loans:
        recommendations.append(f"Consider refinancing high-rate loans: {', '.join(high_rate_loans)}")
    
    if burden_level in ["high", "critical"]:
        recommendations.append("EMI burden is straining finances - avoid new fixed obligations")
    
    if not recommendations:
        recommendations.append("Loan portfolio is healthy. Continue timely payments.")
    
    return {
        "total_outstanding": round(total_outstanding, 2),
        "total_emi": round(total_emi, 2),
        "dti_ratio": dti_ratio,
        "dti_evaluation": dti_eval,
        "emi_burden_ratio": burden_ratio,
        "emi_burden_level": burden_level,
        "emi_burden_message": burden_msg,
        "overall_health_score": health_score,
        "loan_metrics": loan_metrics,
        "recommendations": recommendations
    }


# =============================================================================
# CREDIT ALERT GENERATION
# =============================================================================

def generate_credit_alerts(
    dti_ratio: float,
    emi_burden: float,
    payment_score: int,
    loans: List[Dict[str, any]]
) -> List[Dict[str, any]]:
    """
    @brief Generate credit-related alerts.
    
    @param dti_ratio Current DTI ratio
    @param emi_burden EMI burden ratio
    @param payment_score Payment discipline score
    @param loans List of active loans
    @return List of alert dictionaries
    """
    alerts = []
    
    # DTI alerts
    if dti_ratio > 50:
        alerts.append({
            "type": "dti_critical",
            "severity": "high",
            "title": "Critical Debt Level",
            "message": f"Your debt-to-income ratio is {dti_ratio:.1f}%. This exceeds safe limits.",
            "action": "Prioritize debt reduction. Avoid new credit."
        })
    elif dti_ratio > 40:
        alerts.append({
            "type": "dti_high",
            "severity": "medium",
            "title": "High Debt Level",
            "message": f"Your DTI at {dti_ratio:.1f}% is approaching concerning levels.",
            "action": "Avoid new loans. Consider debt consolidation."
        })
    
    # EMI burden alerts
    if emi_burden > 50:
        alerts.append({
            "type": "emi_critical",
            "severity": "high",
            "title": "EMI Overload",
            "message": f"EMI payments consume {emi_burden:.1f}% of income.",
            "action": "Review loan terms. Consider loan restructuring."
        })
    
    # Payment discipline alerts
    if payment_score < 50:
        alerts.append({
            "type": "payment_discipline",
            "severity": "high",
            "title": "Poor Payment History",
            "message": "Multiple late/missed payments detected.",
            "action": "Set up auto-debit. Late payments hurt credit score."
        })
    elif payment_score < 70:
        alerts.append({
            "type": "payment_warning",
            "severity": "medium",
            "title": "Payment Attention Needed",
            "message": "Some delayed payments in recent history.",
            "action": "Ensure timely EMI payments to maintain credit score."
        })
    
    # High-rate loan alerts
    for loan in loans:
        if loan.get("interest_rate", 0) > 14:
            alerts.append({
                "type": "high_rate",
                "severity": "medium",
                "title": f"High Interest on {loan.get('name', 'Loan')}",
                "message": f"Interest rate of {loan['interest_rate']}% is above market average.",
                "action": "Explore refinancing options with other lenders."
            })
    
    return alerts
