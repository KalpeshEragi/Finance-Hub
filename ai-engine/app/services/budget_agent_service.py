"""
@file app/services/budget_agent_service.py
@brief Budget Agent service for personalized spending advice.

@description
The Budget Agent analyzes user spending patterns to identify areas for potential savings.
It focuses on discretionary spending (WANTS) and suggests realistic cuts based on
financial best practices (e.g., 50-30-20 rule).

Features:
- Identifies top discretionary spending categories
- Generates actionable recommendations to reduce spending
- Estimates potential monthly savings
- Prioritizes "WANTS" over "NEEDS" for cuts

@author HackVengers Team
@version 1.0.0
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging

from app.models.schemas import TransactionInput, BucketType
from app.services import categorization_service

logger = logging.getLogger(__name__)

# =============================================================================
# SCHEMAS
# =============================================================================

class BudgetRecommendation(BaseModel):
    category: str
    current_spending: float
    recommended_limit: float
    potential_savings: float
    reason: str
    action_item: str
    priority: int  # 1 = Highest priority to cut

class BudgetAnalysisResponse(BaseModel):
    total_spending: float
    needs_spending: float
    wants_spending: float
    savings_spending: float
    recommendations: List[BudgetRecommendation]
    estimated_monthly_savings: float

# =============================================================================
# CONSTANTS
# =============================================================================

# Conservative reduction targets for actionable advice
REDUCTION_TARGET_PERCENT = 0.15  # Suggest cutting 15% of discretionary spending
MINIMUM_SPEND_THRESHOLD = 500.0  # Ignore categories with < 500 spending

# Priorities for specific categories (can be expanded)
CATEGORY_PRIORITY = {
    "Entertainment": 1,
    "Dining Out": 1,
    "Shopping": 2,
    "Subscriptions": 2,
    "Travel": 3,
    "Hobbies": 3,
    "Other": 4,
}

# =============================================================================
# CORE LOGIC
# =============================================================================

def analyze_spending(transactions: List[TransactionInput]) -> BudgetAnalysisResponse:
    """
    @brief Analyze transactions and generate budget recommendations.
    
    @param transactions List of financial transactions
    @return BudgetAnalysisResponse with savings suggestions
    """
    if not transactions:
        return BudgetAnalysisResponse(
            total_spending=0,
            needs_spending=0,
            wants_spending=0,
            savings_spending=0,
            recommendations=[],
            estimated_monthly_savings=0
        )

    # 1. Aggegrate spending by category and bucket
    category_totals: Dict[str, float] = {}
    bucket_totals: Dict[str, float] = {
        "needs": 0.0,
        "wants": 0.0,
        "savings": 0.0
    }
    
    # Categorize and sum up
    categorized_results = categorization_service.categorize_bulk(transactions)
    
    for result in categorized_results["results"]:
        # Find matching transaction to get amount (since result doesn't have amount)
        # We assume order matches or we need to look up. 
        # Actually categorize_bulk returns CategorizedTransaction which has ID.
        # We need the amount from the input list.
        # Let's map IDs to amounts first.
        pass

    # Map ID to Amount for O(1) lookup
    id_to_amount = {t.id: t.amount for t in transactions}
    
    for result in categorized_results["results"]:
        amount = id_to_amount.get(result.id, 0)
        category = result.category
        bucket_val = result.bucket.value  # 'needs', 'wants', 'savings'
        
        # Update totals
        category_totals[category] = category_totals.get(category, 0) + amount
        bucket_totals[bucket_val] = bucket_totals.get(bucket_val, 0) + amount

    total_spending = sum(bucket_totals.values())
    
    # 2. Identify candidates for cutting (WANTS bucket)
    candidates: List[Dict[str, Any]] = []
    
    # Get all categories that fall into WANTS (we need to know which ones are wants)
    # The categorization service returns the bucket for each transaction.
    # We can infer category bucket from the majority, or just re-check rule.
    # For simplicity, we'll re-check the global rules or trust the aggregation.
    
    # Let's aggregate by (Category, Bucket) just in case
    cat_bucket_map = {}
    
    for result in categorized_results["results"]:
        if result.category not in cat_bucket_map:
            cat_bucket_map[result.category] = result.bucket.value
            
    for category, amount in category_totals.items():
        bucket = cat_bucket_map.get(category, "wants") # Default to wants if unknown
        
        if bucket == "wants" and amount > MINIMUM_SPEND_THRESHOLD:
            priority = CATEGORY_PRIORITY.get(category, 5)
            # Higher spending = Higher priority to cut
            # We combine static priority with spending amount for ranking
            score = (amount / 1000) + (10 - priority) 
            
            candidates.append({
                "category": category,
                "amount": amount,
                "score": score,
                "priority": priority
            })

    # Sort candidates by score (highest first)
    candidates.sort(key=lambda x: x["score"], reverse=True)
    
    # 3. Generate Top 2-3 Recommendations
    recommendations: List[BudgetRecommendation] = []
    top_candidates = candidates[:3]
    
    total_savings = 0.0
    
    for item in top_candidates:
        category = item["category"]
        current = item["amount"]
        
        # Suggest valid reduction
        savings = round(current * REDUCTION_TARGET_PERCENT, 2)
        new_limit = round(current - savings, 2)
        
        rec = BudgetRecommendation(
            category=category,
            current_spending=current,
            recommended_limit=new_limit,
            potential_savings=savings,
            reason=f"Spending on {category} accounts for a significant portion of your wants.",
            action_item=f"Try to reduce {category} expenses by 15% this month.",
            priority=item["priority"]
        )
        recommendations.append(rec)
        total_savings += savings

    return BudgetAnalysisResponse(
        total_spending=round(total_spending, 2),
        needs_spending=round(bucket_totals.get("needs", 0), 2),
        wants_spending=round(bucket_totals.get("wants", 0), 2),
        savings_spending=round(bucket_totals.get("savings", 0), 2),
        recommendations=recommendations,
        estimated_monthly_savings=round(total_savings, 2)
    )
