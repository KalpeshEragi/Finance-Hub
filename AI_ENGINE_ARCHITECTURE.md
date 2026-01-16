# 🧠 AI Engine Architecture Design

## Executive Summary

Designing a **Python FastAPI microservice** that provides financial intelligence to the existing Node.js backend. The engine focuses on **explainable, rule-based logic** suitable for an Indian fintech hackathon MVP.

---

## Table of Contents

1. [Phase 1: AI Engine Architecture](#phase-1-ai-engine-architecture)
2. [Phase 2: Service Boundaries](#phase-2-service-boundaries)
3. [Phase 3: Digital Twin Logic](#phase-3-digital-twin-logic-mathematical-definition)
4. [Phase 4: 50-30-20 Enforcement Strategy](#phase-4-50-30-20-enforcement-strategy)
5. [Phase 5: Tax Logic Flow](#phase-5-tax-logic-flow-india-specific)
6. [Phase 6: API Contracts](#phase-6-api-contracts)
7. [Phase 7: Test Strategy](#phase-7-test-strategy)
8. [Implementation Phases](#implementation-phases)

---

## Phase 1: AI Engine Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Node.js Backend                              │
│              (Express, MongoDB, JWT Auth)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/JSON
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Engine (FastAPI)                           │
├─────────────────────────────────────────────────────────────────┤
│  Routers (Thin API Layer)                                        │
│  ├── /categorize                                                 │
│  ├── /behavior                                                   │
│  ├── /credit                                                     │
│  ├── /tax                                                        │
│  ├── /goals                                                      │
│  ├── /twin                                                       │
│  └── /alerts                                                     │
├─────────────────────────────────────────────────────────────────┤
│  Services (Business Logic)                                       │
│  ├── categorization_service.py                                   │
│  ├── behavior_service.py                                         │
│  ├── credit_service.py                                           │
│  ├── tax_service.py                                              │
│  ├── goal_service.py                                             │
│  ├── digital_twin_service.py                                     │
│  └── alert_service.py                                            │
├─────────────────────────────────────────────────────────────────┤
│  Rules Engine (Deterministic Logic)                              │
│  ├── category_rules.py                                           │
│  ├── budget_rules.py (50-30-20)                                  │
│  ├── tax_rules.py (ITR, Deductions)                              │
│  └── projection_rules.py                                         │
├─────────────────────────────────────────────────────────────────┤
│  Core (Config, Exceptions, Constants)                            │
│  Models (Pydantic Schemas)                                       │
│  Utils (Date, Currency, Calculators)                             │
└─────────────────────────────────────────────────────────────────┘
```

### Proposed Directory Structure

```
ai-engine/
├── main.py                          # FastAPI app entry point
├── requirements.txt
├── .env.example
├── app/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py               # Environment config
│   │   ├── constants.py            # India-specific constants
│   │   ├── exceptions.py           # Custom exceptions
│   │   └── enums.py                # Category enums, tax regimes
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── categorization.py       # POST /categorize
│   │   ├── behavior.py             # POST /behavior/analyze
│   │   ├── credit.py               # POST /credit/analyze
│   │   ├── tax.py                  # POST /tax/estimate, /tax/suggestions
│   │   ├── goals.py                # POST /goals/plan
│   │   ├── twin.py                 # POST /twin/simulate
│   │   └── alerts.py               # POST /alerts/check
│   ├── services/
│   │   ├── __init__.py
│   │   ├── categorization_service.py
│   │   ├── behavior_service.py
│   │   ├── credit_service.py
│   │   ├── tax_service.py
│   │   ├── goal_service.py
│   │   ├── digital_twin_service.py
│   │   └── alert_service.py
│   ├── rules/
│   │   ├── __init__.py
│   │   ├── category_rules.py       # Merchant → Category mapping
│   │   ├── budget_rules.py         # 50-30-20 classification
│   │   ├── tax_rules.py            # ITR, slabs, deductions
│   │   ├── credit_rules.py         # EMI, loan health checks
│   │   └── projection_rules.py     # Growth, inflation assumptions
│   ├── models/
│   │   ├── __init__.py
│   │   ├── transaction.py          # Transaction schemas
│   │   ├── budget.py               # Budget schemas
│   │   ├── tax.py                  # Tax schemas
│   │   ├── goal.py                 # Goal schemas
│   │   ├── twin.py                 # Digital Twin I/O schemas
│   │   └── common.py               # Shared schemas
│   └── utils/
│       ├── __init__.py
│       ├── date_utils.py           # FY calculations
│       ├── currency_utils.py       # Rounding, formatting
│       └── calculations.py         # Compound interest, EMI calc
└── tests/
    ├── __init__.py
    ├── test_categorization.py
    ├── test_behavior.py
    ├── test_tax.py
    ├── test_twin.py
    └── fixtures/
        └── sample_data.py
```

---

## Phase 2: Service Boundaries

| Service | Responsibility | Inputs | Outputs |
|---------|---------------|--------|---------|
| **categorization_service** | Map transactions to categories | Transaction list | Categorized transactions |
| **behavior_service** | Spending patterns, 50-30-20 analysis, overspend detection | Transactions + Income | Budget breakdown, violations, suggestions |
| **credit_service** | EMI tracking, loan health, repayment discipline | Loans + Payments | Credit health score, alerts |
| **tax_service** | Tax estimation, deduction detection, regime comparison | Income + Deductions | Tax estimate, ITR prep data |
| **goal_service** | Savings goals, progress tracking, required monthly savings | Goals + Current savings | Progress %, projections |
| **digital_twin_service** | Future financial simulation | Full financial state | Projected state at T+n |
| **alert_service** | Deadline reminders, compliance checks | Dates + Financial state | Alert list |

### Data Flow Principle

```
Node.js Backend → [Clean JSON Payload] → AI Engine → [Structured Response] → Backend
```

The AI Engine:
- **NEVER** accesses MongoDB directly
- **NEVER** stores state (stateless microservice)
- **ALWAYS** receives complete context in request
- **ALWAYS** returns deterministic, explainable results

---

## Phase 3: Digital Twin Logic (Mathematical Definition)

### Core Concept

The Digital Twin projects a user's financial future based on:
- **Current state** (balances, income, expenses)
- **Behavioral patterns** (spending by category)
- **Commitments** (EMIs, SIPs, insurance premiums)
- **Goals** (target amounts with deadlines)

### Mathematical Model

#### State at Time T

```
S(t) = {
    networth: NW(t),
    savings: SAV(t),
    debt: DEBT(t),
    monthly_income: INC,
    monthly_expenses: EXP(t),
    goals: [G₁, G₂, ...],
    emis: [EMI₁, EMI₂, ...]
}
```

#### Projection Formula (Monthly Step)

For each month `t → t+1`:

```python
# Income (assumed stable, or apply growth rate)
income(t+1) = INC × (1 + income_growth_rate)^(1/12)

# Fixed Expenses (EMIs, insurance, rent)
fixed_exp(t+1) = Σ EMI + fixed_costs

# Variable Expenses (from behavioral patterns)
variable_exp(t+1) = historical_avg_variable × (1 + inflation_rate)^(1/12)

# Total Expenses
total_exp(t+1) = fixed_exp(t+1) + variable_exp(t+1)

# Savings Flow
savings_flow(t+1) = income(t+1) - total_exp(t+1) - tax_liability(t+1)/12

# Updated Savings Balance
SAV(t+1) = SAV(t) + savings_flow(t+1)

# Debt Reduction (if EMIs include principal)
DEBT(t+1) = DEBT(t) - principal_paid(t+1)

# Net Worth
NW(t+1) = SAV(t+1) - DEBT(t+1) + asset_appreciation
```

#### Scenario Modifiers

| Scenario | Modifier |
|----------|----------|
| **Baseline** | No changes |
| **Increased Savings** | `variable_exp × 0.9` (10% cut to wants) |
| **Job Loss** | `income = 0` for N months |
| **EMI Prepayment** | Reduce `DEBT(t)`, recalculate EMIs |
| **New Goal** | Add to savings target |

#### Output Structure

```python
{
    "projection_months": 12,
    "monthly_snapshots": [
        {
            "month": 1,
            "date": "2026-02",
            "income": 80000,
            "expenses": 55000,
            "savings_flow": 18000,
            "cumulative_savings": 218000,
            "debt_remaining": 450000,
            "networth": -232000,
            "goal_progress": {
                "Emergency Fund": {"current": 50000, "target": 100000, "percent": 50}
            }
        },
        // ... more months
    ],
    "summary": {
        "total_savings_added": 216000,
        "debt_reduced": 120000,
        "networth_change": 336000,
        "goals_achievable": ["Emergency Fund"],
        "goals_at_risk": []
    }
}
```

---

## Phase 4: 50-30-20 Enforcement Strategy

### Category Classification

```python
CATEGORY_CLASSIFICATION = {
    # NEEDS (50%) - Essential, survival
    "needs": [
        "Rent & Housing",
        "Groceries",
        "Utilities",
        "Healthcare",
        "Insurance",
        "Transportation (Commute)",
        "Education",
        "EMI Payments",
        "Childcare",
    ],
    
    # WANTS (30%) - Discretionary, lifestyle
    "wants": [
        "Food & Dining",
        "Entertainment",
        "Shopping",
        "Travel & Vacation",
        "Subscriptions",
        "Personal Care",
        "Gifts",
        "Hobbies",
    ],
    
    # SAVINGS (20%) - Future security
    "savings": [
        "Investments",
        "Mutual Funds",
        "Fixed Deposits",
        "PPF",
        "NPS",
        "Emergency Fund",
        "Goal Savings",
    ]
}
```

### Enforcement Logic

```python
def analyze_50_30_20(income: float, expenses: List[Expense]) -> BudgetAnalysis:
    """
    Analyzes spending against the 50-30-20 rule.
    
    Returns:
        - Actual percentages
        - Violations
        - Reallocation suggestions
    """
    # Step 1: Classify all expenses
    needs_total = sum(e.amount for e in expenses if classify(e.category) == "needs")
    wants_total = sum(e.amount for e in expenses if classify(e.category) == "wants")
    savings_total = sum(e.amount for e in expenses if classify(e.category) == "savings")
    
    # Step 2: Calculate percentages
    total = needs_total + wants_total + savings_total
    actual = {
        "needs": (needs_total / income) * 100,
        "wants": (wants_total / income) * 100,
        "savings": (savings_total / income) * 100,
    }
    
    # Step 3: Detect violations
    violations = []
    if actual["needs"] > 50:
        violations.append({
            "type": "needs_exceeded",
            "actual": actual["needs"],
            "limit": 50,
            "excess": needs_total - (income * 0.5)
        })
    if actual["wants"] > 30:
        violations.append({
            "type": "wants_exceeded",
            "actual": actual["wants"],
            "limit": 30,
            "excess": wants_total - (income * 0.3)
        })
    if actual["savings"] < 20:
        violations.append({
            "type": "savings_deficit",
            "actual": actual["savings"],
            "required": 20,
            "shortfall": (income * 0.2) - savings_total
        })
    
    # Step 4: Generate suggestions
    suggestions = generate_reallocation_suggestions(actual, violations)
    
    return BudgetAnalysis(
        actual=actual,
        target={"needs": 50, "wants": 30, "savings": 20},
        violations=violations,
        suggestions=suggestions,
        health_score=calculate_budget_health(violations)
    )
```

### Reallocation Suggestions

```python
def generate_reallocation_suggestions(actual, violations):
    suggestions = []
    
    if any(v["type"] == "wants_exceeded" for v in violations):
        # Identify top discretionary spends
        suggestions.append({
            "action": "reduce_wants",
            "recommendation": "Reduce dining out and entertainment by 20%",
            "potential_savings": calculate_reduction_impact(wants, 0.2),
            "impact_on_savings": "Would increase savings rate by X%"
        })
    
    if any(v["type"] == "savings_deficit" for v in violations):
        suggestions.append({
            "action": "automate_savings",
            "recommendation": "Set up automatic SIP of ₹X on salary day",
            "target_amount": required_savings - actual_savings
        })
    
    return suggestions
```

---

## Phase 5: Tax Logic Flow (India-Specific)

### Tax Computation Pipeline

```
Input: {income_sources, deductions, regime_preference}
         │
         ▼
┌─────────────────────────────────────┐
│  1. Aggregate Gross Total Income     │
│     - Salary                         │
│     - Rental                         │
│     - Capital Gains                  │
│     - Other Sources                  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  2. Apply Deductions (Old Regime)    │
│     - 80C (₹1.5L max)               │
│     - 80D (₹25K-50K)                │
│     - 80E (Education loan interest)  │
│     - HRA, LTA, Standard Deduction   │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  3. Compute Taxable Income           │
│     Old: GTI - Deductions            │
│     New: GTI - Std Deduction (50K)   │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  4. Apply Tax Slabs                  │
│     Old Regime Slabs                 │
│     New Regime Slabs (FY 2024-25)    │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  5. Add Cess (4%)                    │
│  6. Compare Regimes                  │
│  7. Generate Recommendations         │
└─────────────────────────────────────┘
         │
         ▼
Output: {tax_old, tax_new, recommended_regime, savings, deduction_suggestions}
```

### Tax Rules (FY 2024-25)

```python
TAX_SLABS = {
    "old": [
        {"min": 0, "max": 250000, "rate": 0},
        {"min": 250001, "max": 500000, "rate": 5},
        {"min": 500001, "max": 1000000, "rate": 20},
        {"min": 1000001, "max": float("inf"), "rate": 30},
    ],
    "new": [
        {"min": 0, "max": 300000, "rate": 0},
        {"min": 300001, "max": 600000, "rate": 5},
        {"min": 600001, "max": 900000, "rate": 10},
        {"min": 900001, "max": 1200000, "rate": 15},
        {"min": 1200001, "max": 1500000, "rate": 20},
        {"min": 1500001, "max": float("inf"), "rate": 30},
    ]
}

DEDUCTION_LIMITS = {
    "80C": 150000,
    "80D_self": 25000,
    "80D_parents": 25000,  # 50000 if senior
    "80E": float("inf"),   # No limit for education loan interest
    "80CCD_1B": 50000,     # NPS
    "standard_deduction": 50000,
    "home_loan_interest": 200000,
}
```

### Deduction Suggestion Logic

```python
def suggest_deductions(current_deductions, income):
    suggestions = []
    
    # 80C gap
    if current_deductions.get("80C", 0) < 150000:
        gap = 150000 - current_deductions.get("80C", 0)
        suggestions.append({
            "section": "80C",
            "gap": gap,
            "options": ["PPF", "ELSS", "Life Insurance Premium", "5-yr FD"],
            "tax_savings": gap * 0.3  # Assuming 30% bracket
        })
    
    # 80D gap
    if current_deductions.get("80D", 0) < 25000:
        suggestions.append({
            "section": "80D",
            "recommendation": "Get health insurance for self/family",
            "max_benefit": 25000
        })
    
    # NPS
    if current_deductions.get("80CCD_1B", 0) < 50000:
        suggestions.append({
            "section": "80CCD(1B)",
            "recommendation": "Invest in NPS for additional ₹50,000 deduction",
            "tax_savings": 15000  # at 30% bracket
        })
    
    return suggestions
```

---

## Phase 6: API Contracts

### Health Check

```
GET /health

Response:
{
    "status": "ok",
    "version": "1.0.0"
}
```

### Categorization

```
POST /categorize

Request:
{
    "transactions": [
        {
            "id": "tx1",
            "description": "Swiggy Order",
            "merchant": "Swiggy",
            "amount": 450
        }
    ]
}

Response:
{
    "results": [
        {
            "id": "tx1",
            "category": "Food & Dining",
            "bucket": "wants",
            "confidence": 0.95
        }
    ]
}
```

### Behavior Analysis

```
POST /behavior/analyze

Request:
{
    "user_id": "user123",
    "income": 80000,
    "transactions": [...],
    "period": {
        "start": "2026-01-01",
        "end": "2026-01-31"
    }
}

Response:
{
    "budget_analysis": {
        "actual": {"needs": 45, "wants": 38, "savings": 17},
        "target": {"needs": 50, "wants": 30, "savings": 20},
        "violations": [
            {
                "type": "wants_exceeded",
                "actual": 38,
                "limit": 30,
                "excess": 6400
            },
            {
                "type": "savings_deficit",
                "actual": 17,
                "required": 20,
                "shortfall": 2400
            }
        ],
        "suggestions": [
            {
                "action": "reduce_wants",
                "recommendation": "Reduce dining out by 20%",
                "potential_savings": 3000
            }
        ],
        "health_score": 72
    },
    "spending_patterns": {
        "top_categories": [
            {"category": "Food & Dining", "amount": 15000, "percent": 18.75}
        ],
        "month_over_month": {
            "change_percent": 5.2,
            "trend": "increasing"
        },
        "anomalies": []
    }
}
```

### Tax Estimation

```
POST /tax/estimate

Request:
{
    "financial_year": "2024-25",
    "income": {
        "salary": 1200000,
        "rental": 0,
        "capital_gains": {
            "short_term": 0,
            "long_term": 0
        },
        "other": 50000
    },
    "deductions": {
        "80C": 100000,
        "80D": 15000,
        "home_loan_interest": 0,
        "nps": 0
    }
}

Response:
{
    "old_regime": {
        "gross_total_income": 1250000,
        "total_deductions": 165000,
        "taxable_income": 1085000,
        "tax_before_cess": 119500,
        "cess": 4780,
        "total_tax": 124280,
        "effective_rate": 9.94
    },
    "new_regime": {
        "gross_total_income": 1250000,
        "total_deductions": 50000,
        "taxable_income": 1200000,
        "tax_before_cess": 120000,
        "cess": 4800,
        "total_tax": 124800,
        "effective_rate": 9.98
    },
    "recommended_regime": "old",
    "savings_with_recommended": 520,
    "deduction_suggestions": [
        {
            "section": "80C",
            "current": 100000,
            "limit": 150000,
            "gap": 50000,
            "options": ["PPF", "ELSS", "Life Insurance"],
            "potential_tax_savings": 15600
        },
        {
            "section": "80CCD(1B)",
            "current": 0,
            "limit": 50000,
            "gap": 50000,
            "options": ["NPS"],
            "potential_tax_savings": 15600
        }
    ]
}
```

### Digital Twin Simulation

```
POST /twin/simulate

Request:
{
    "current_state": {
        "savings": 200000,
        "debt": 500000,
        "assets": 0,
        "monthly_income": 80000,
        "monthly_expenses": {
            "needs": 35000,
            "wants": 25000,
            "emis": 15000
        }
    },
    "emis": [
        {
            "name": "Car Loan",
            "monthly_amount": 15000,
            "remaining_principal": 300000,
            "remaining_months": 24,
            "interest_rate": 9.5
        }
    ],
    "goals": [
        {
            "name": "Emergency Fund",
            "target": 300000,
            "current": 50000,
            "deadline": "2026-12-31",
            "priority": 1
        }
    ],
    "projection_months": 12,
    "scenario": "baseline",
    "assumptions": {
        "income_growth_rate": 0.08,
        "inflation_rate": 0.06,
        "savings_return_rate": 0.07
    }
}

Response:
{
    "scenario": "baseline",
    "projection_months": 12,
    "monthly_snapshots": [
        {
            "month": 1,
            "date": "2026-02",
            "income": 80000,
            "expenses": {
                "needs": 35000,
                "wants": 25000,
                "emis": 15000,
                "total": 75000
            },
            "savings_flow": 5000,
            "cumulative_savings": 205000,
            "debt_remaining": 487500,
            "networth": -282500,
            "goal_progress": [
                {
                    "name": "Emergency Fund",
                    "current": 55000,
                    "target": 300000,
                    "percent": 18.33,
                    "on_track": false
                }
            ]
        }
        // ... more months
    ],
    "summary": {
        "initial_networth": -300000,
        "final_networth": -180000,
        "networth_change": 120000,
        "total_savings_added": 60000,
        "total_debt_reduced": 180000,
        "final_savings": 260000,
        "final_debt": 320000,
        "goals_achievable": [],
        "goals_at_risk": [
            {
                "name": "Emergency Fund",
                "reason": "Savings rate too low",
                "projected_completion": "2027-08",
                "months_delayed": 8
            }
        ]
    },
    "recommendations": [
        {
            "type": "increase_savings",
            "message": "To achieve Emergency Fund goal on time, increase monthly savings by ₹15,833",
            "action": "Consider reducing wants by 25%"
        },
        {
            "type": "emi_prepayment",
            "message": "Prepaying ₹50,000 on car loan would save ₹12,500 in interest",
            "impact": "Reduces loan tenure by 4 months"
        }
    ]
}
```

### Goal Planning

```
POST /goals/plan

Request:
{
    "goals": [
        {
            "name": "Car Down Payment",
            "target": 500000,
            "current": 100000,
            "deadline": "2027-06-01",
            "priority": 1
        },
        {
            "name": "Vacation",
            "target": 150000,
            "current": 20000,
            "deadline": "2026-12-01",
            "priority": 2
        }
    ],
    "monthly_income": 80000,
    "current_savings_rate": 15000,
    "available_for_goals": 10000
}

Response:
{
    "analysis": [
        {
            "goal": "Car Down Payment",
            "target": 500000,
            "current": 100000,
            "remaining": 400000,
            "deadline": "2027-06-01",
            "months_remaining": 17,
            "required_monthly": 23529,
            "suggested_allocation": 7000,
            "achievable_with_current": false,
            "achievable_deadline": "2028-10-01",
            "months_delayed": 16
        },
        {
            "goal": "Vacation",
            "target": 150000,
            "current": 20000,
            "remaining": 130000,
            "deadline": "2026-12-01",
            "months_remaining": 10,
            "required_monthly": 13000,
            "suggested_allocation": 3000,
            "achievable_with_current": false,
            "achievable_deadline": "2027-08-01",
            "months_delayed": 8
        }
    ],
    "total_required_monthly": 36529,
    "available_monthly": 10000,
    "shortfall": 26529,
    "recommendations": [
        {
            "type": "prioritize",
            "message": "Focus on Car Down Payment first (higher priority)",
            "allocation": {"Car Down Payment": 7000, "Vacation": 3000}
        },
        {
            "type": "increase_savings",
            "message": "Reduce wants by 30% to add ₹7,500/month to goals",
            "impact": "Vacation becomes achievable in 12 months"
        },
        {
            "type": "extend_deadline",
            "message": "Extending Car deadline to Dec 2027 makes it achievable",
            "new_required_monthly": 16667
        }
    ]
}
```

### Credit Analysis

```
POST /credit/analyze

Request:
{
    "loans": [
        {
            "name": "Home Loan",
            "principal": 3000000,
            "outstanding": 2500000,
            "emi": 28000,
            "interest_rate": 8.5,
            "tenure_months": 180,
            "start_date": "2023-01-01"
        },
        {
            "name": "Car Loan",
            "principal": 500000,
            "outstanding": 300000,
            "emi": 15000,
            "interest_rate": 9.5,
            "tenure_months": 48,
            "start_date": "2024-06-01"
        }
    ],
    "monthly_income": 100000,
    "payment_history": [
        {"loan": "Home Loan", "month": "2026-01", "status": "paid", "days_late": 0},
        {"loan": "Car Loan", "month": "2026-01", "status": "paid", "days_late": 2}
    ]
}

Response:
{
    "debt_summary": {
        "total_outstanding": 2800000,
        "total_emi": 43000,
        "debt_to_income": 43,
        "status": "moderate"
    },
    "health_metrics": {
        "payment_discipline_score": 95,
        "emi_burden_score": 65,
        "overall_credit_health": 78
    },
    "loan_analysis": [
        {
            "name": "Home Loan",
            "remaining_tenure_months": 144,
            "total_interest_remaining": 1152000,
            "prepayment_benefit": {
                "if_prepay_100000": {
                    "interest_saved": 85000,
                    "tenure_reduced_months": 6
                }
            }
        }
    ],
    "alerts": [
        {
            "type": "high_dti",
            "message": "Debt-to-Income ratio is 43%. Consider limiting new debt.",
            "severity": "warning"
        }
    ],
    "recommendations": [
        {
            "type": "prepayment",
            "loan": "Car Loan",
            "message": "Prepay ₹50,000 to save ₹12,500 interest",
            "priority": "medium"
        }
    ]
}
```

### Alerts Check

```
POST /alerts/check

Request:
{
    "user_id": "user123",
    "current_date": "2026-01-16",
    "financial_state": {
        "filing_status": {
            "itr_filed_current_fy": false,
            "last_itr_date": "2025-07-31"
        },
        "advance_tax": {
            "paid_q1": 0,
            "paid_q2": 0,
            "paid_q3": 25000,
            "estimated_liability": 120000
        },
        "insurance": {
            "health": {"expiry": "2026-03-15", "premium": 25000},
            "term": {"expiry": "2026-12-01", "premium": 15000}
        }
    },
    "budgets": [
        {"category": "Food & Dining", "limit": 15000, "spent": 18500}
    ]
}

Response:
{
    "alerts": [
        {
            "id": "alert_1",
            "type": "tax_deadline",
            "severity": "high",
            "title": "Advance Tax Q4 Due",
            "message": "Q4 advance tax due by 15-Mar-2026. Pending: ₹95,000",
            "due_date": "2026-03-15",
            "action": "Pay advance tax to avoid interest u/s 234C"
        },
        {
            "id": "alert_2",
            "type": "insurance_renewal",
            "severity": "medium",
            "title": "Health Insurance Expiring",
            "message": "Health insurance expires on 15-Mar-2026. Renew to maintain coverage.",
            "due_date": "2026-03-15",
            "action": "Renew health insurance"
        },
        {
            "id": "alert_3",
            "type": "budget_exceeded",
            "severity": "warning",
            "title": "Budget Exceeded: Food & Dining",
            "message": "Spent ₹18,500 vs budget of ₹15,000 (123%)",
            "overspend": 3500,
            "action": "Review dining expenses"
        }
    ],
    "upcoming": [
        {
            "type": "itr_deadline",
            "message": "ITR filing deadline: 31-Jul-2026",
            "days_until": 196
        }
    ]
}
```

---

## Phase 7: Test Strategy

### Test Categories

| Category | Description | Example |
|----------|-------------|---------|
| **Unit Tests** | Individual rule functions | `test_classify_category()` |
| **Service Tests** | Service methods with mock data | `test_behavior_service.analyze()` |
| **Integration Tests** | Full API endpoint tests | `POST /tax/estimate` |
| **Scenario Tests** | Edge cases, boundary conditions | Zero income, max deductions |

### Sample Test Cases

```python
# tests/test_tax.py

def test_old_regime_with_full_80c():
    """User utilizing full 80C should benefit from old regime."""
    result = tax_service.estimate({
        "income": {"salary": 1000000},
        "deductions": {"80C": 150000, "80D": 25000}
    })
    assert result["recommended_regime"] == "old"
    assert result["old_regime"]["total_tax"] < result["new_regime"]["total_tax"]


def test_new_regime_for_low_deductions():
    """User with no deductions should prefer new regime."""
    result = tax_service.estimate({
        "income": {"salary": 800000},
        "deductions": {}
    })
    assert result["recommended_regime"] == "new"


def test_50_30_20_violation_detection():
    """Detect when wants exceed 30%."""
    result = behavior_service.analyze({
        "income": 100000,
        "transactions": [
            {"category": "Rent", "amount": 30000},      # needs
            {"category": "Dining", "amount": 40000},    # wants - OVER!
            {"category": "Investments", "amount": 10000} # savings
        ]
    })
    assert any(v["type"] == "wants_exceeded" for v in result["violations"])


def test_digital_twin_baseline():
    """Baseline projection should show positive savings growth."""
    result = twin_service.simulate({
        "current_state": {
            "savings": 100000,
            "monthly_income": 80000,
            "monthly_expenses": {"needs": 30000, "wants": 20000}
        },
        "projection_months": 6
    })
    assert result["summary"]["final_savings"] > 100000


def test_goal_achievability():
    """Goal with sufficient savings rate should be achievable."""
    result = goal_service.plan({
        "goals": [{"name": "Test", "target": 60000, "deadline": "2026-07-01"}],
        "monthly_income": 80000,
        "current_savings_rate": 15000,
        "available_for_goals": 10000
    })
    assert result["analysis"][0]["achievable_with_current"] == True


def test_credit_high_dti_alert():
    """Should alert when DTI exceeds 40%."""
    result = credit_service.analyze({
        "loans": [{"emi": 50000}],
        "monthly_income": 100000
    })
    assert any(a["type"] == "high_dti" for a in result["alerts"])
```

### Mock Fixtures

```python
# tests/fixtures/sample_data.py

SAMPLE_TRANSACTIONS = [
    {"id": "1", "description": "Swiggy", "amount": 500, "category": "Food & Dining"},
    {"id": "2", "description": "Amazon", "amount": 2000, "category": "Shopping"},
    {"id": "3", "description": "Electricity Bill", "amount": 1500, "category": "Utilities"},
    {"id": "4", "description": "Movie Tickets", "amount": 800, "category": "Entertainment"},
    {"id": "5", "description": "Zerodha SIP", "amount": 5000, "category": "Investments"},
    {"id": "6", "description": "Rent", "amount": 25000, "category": "Rent & Housing"},
    {"id": "7", "description": "Groceries", "amount": 8000, "category": "Groceries"},
    {"id": "8", "description": "Fuel", "amount": 3000, "category": "Transportation"},
]

SAMPLE_USER_STATE = {
    "income": 80000,
    "savings": 150000,
    "debt": 300000,
    "emis": [
        {"name": "Car Loan", "amount": 12000, "remaining_months": 24}
    ],
    "goals": [
        {"name": "Emergency Fund", "target": 200000, "current": 50000}
    ]
}

SAMPLE_TAX_PROFILE = {
    "financial_year": "2024-25",
    "income": {
        "salary": 1000000,
        "rental": 0,
        "other": 50000
    },
    "deductions": {
        "80C": 100000,
        "80D": 20000,
        "nps": 30000
    }
}
```

---

## Implementation Phases

### Recommended Order

| Phase | Components | Effort |
|-------|------------|--------|
| **1. Foundation** | `main.py`, `config.py`, directory structure, `requirements.txt` | 1 hour |
| **2. Core Rules** | `category_rules.py`, `budget_rules.py`, `tax_rules.py` | 2 hours |
| **3. Models** | All Pydantic schemas in `models/` | 1 hour |
| **4. Services** | `categorization_service.py`, `behavior_service.py` | 2 hours |
| **5. Tax Service** | `tax_service.py` with full ITR logic | 2 hours |
| **6. Digital Twin** | `digital_twin_service.py` with projections | 3 hours |
| **7. Routers** | All API endpoints | 1 hour |
| **8. Tests** | Unit + integration tests | 2 hours |

### Total Estimated Time: ~14 hours

---

## Key Design Principles

1. **Deterministic** - Same input always produces same output
2. **Explainable** - Every calculation has a clear rationale
3. **Stateless** - No database access, no session state
4. **India-Specific** - Tax laws, financial norms for Indian context
5. **Rule-Based First** - ML is not required for MVP
6. **Finance-Safe** - Conservative assumptions, clear disclaimers

---

## Next Steps

To proceed with implementation, confirm:

1. ✅ Architecture approved?
2. ✅ Service boundaries approved?
3. ✅ API contracts approved?
4. ✅ Start with Phase 1 (Foundation)?

Once confirmed, I will begin building the `ai-engine/` directory.
