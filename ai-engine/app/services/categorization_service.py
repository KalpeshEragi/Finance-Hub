"""
@file app/services/categorization_service.py
@brief Transaction categorization service.

@description
This service handles automatic categorization of financial transactions
using keyword-based matching against a predefined category ruleset.

Features:
- Single and bulk transaction categorization
- Confidence scoring for each categorization
- 50-30-20 bucket assignment
- Fallback to "Uncategorized" for unknown merchants

@author HackVengers Team
@version 1.0.0
"""

import json
import re
from typing import Dict, List, Tuple, Optional
from pathlib import Path
from functools import lru_cache
import logging

from app.models.schemas import (
    TransactionInput,
    CategorizedTransaction,
    BucketType,
)

logger = logging.getLogger(__name__)


# =============================================================================
# CATEGORY DATA LOADING
# =============================================================================

@lru_cache(maxsize=1)
def _load_categories() -> Dict:
    """
    @brief Load category rules from JSON file.
    
    @return Dictionary with category rules
    
    @note Uses LRU cache to load only once per application lifetime.
          This significantly improves performance for bulk operations.
    """
    categories_path = Path(__file__).parent.parent / "rules" / "categories.json"
    
    try:
        with open(categories_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            logger.info(f"Loaded {len(data.get('categories', {}))} categories from rules")
            return data
    except FileNotFoundError:
        logger.error(f"Categories file not found: {categories_path}")
        return {
            "categories": {},
            "default_category": "Uncategorized",
            "default_bucket": "wants",
            "default_confidence": 0.30
        }
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in categories file: {e}")
        return {
            "categories": {},
            "default_category": "Uncategorized",
            "default_bucket": "wants",
            "default_confidence": 0.30
        }


def _build_keyword_index() -> Dict[str, Tuple[str, str, float]]:
    """
    @brief Build inverted index from keywords to categories.
    
    @return Dict mapping lowercase keyword to (category, bucket, confidence)
    
    @details
    Pre-builds an index for O(1) keyword lookup instead of 
    iterating through all categories for each transaction.
    """
    data = _load_categories()
    index: Dict[str, Tuple[str, str, float]] = {}
    
    for category, info in data.get("categories", {}).items():
        bucket = info.get("bucket", "wants")
        confidence = info.get("confidence", 0.75)
        
        for keyword in info.get("keywords", []):
            # Store lowercase keyword for case-insensitive matching
            index[keyword.lower()] = (category, bucket, confidence)
    
    return index


# Build index at module load time for performance
_KEYWORD_INDEX: Dict[str, Tuple[str, str, float]] = {}


def _get_keyword_index() -> Dict[str, Tuple[str, str, float]]:
    """Get or build keyword index (lazy initialization)."""
    global _KEYWORD_INDEX
    if not _KEYWORD_INDEX:
        _KEYWORD_INDEX = _build_keyword_index()
    return _KEYWORD_INDEX


# =============================================================================
# CORE CATEGORIZATION LOGIC
# =============================================================================

def _clean_text(text: str) -> str:
    """
    @brief Clean and normalize text for matching.
    
    @param text Raw text to clean
    @return Normalized lowercase text
    
    @details
    - Converts to lowercase
    - Removes special characters except spaces
    - Collapses multiple spaces
    """
    if not text:
        return ""
    
    # Lowercase
    text = text.lower()
    
    # Remove special characters (keep alphanumeric and spaces)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    
    # Collapse multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def _find_best_match(
    description: str,
    merchant: Optional[str] = None
) -> Tuple[str, str, float, Optional[str]]:
    """
    @brief Find best matching category for a transaction.
    
    @param description Transaction description/narration
    @param merchant Optional merchant name (higher priority)
    @return Tuple of (category, bucket, confidence, matched_keyword)
    
    @details
    Matching strategy:
    1. Try exact merchant name match (if provided)
    2. Try keywords in merchant name
    3. Try keywords in description
    4. Return default if no match
    
    Confidence is boosted for keyword matches based on:
    - Match position (earlier = higher confidence)
    - Match length (longer keywords = higher confidence)
    """
    index = _get_keyword_index()
    defaults = _load_categories()
    
    # Combine and clean search texts
    texts_to_search = []
    if merchant:
        texts_to_search.append((_clean_text(merchant), 1.0))  # Full confidence for merchant
    texts_to_search.append((_clean_text(description), 0.9))   # Slight penalty for description
    
    best_match = None
    best_confidence = 0.0
    matched_keyword = None
    
    for search_text, text_multiplier in texts_to_search:
        if not search_text:
            continue
        
        # Split into words
        words = search_text.split()
        
        # Try multi-word combinations (longer matches are better)
        for length in range(min(4, len(words)), 0, -1):
            for i in range(len(words) - length + 1):
                phrase = ' '.join(words[i:i + length])
                
                if phrase in index:
                    category, bucket, base_confidence = index[phrase]
                    
                    # Adjust confidence based on:
                    # - Text source (merchant vs description)
                    # - Match length bonus
                    # - Position bonus (earlier match = better)
                    length_bonus = min(0.1, length * 0.02)
                    position_bonus = max(0, 0.05 - (i * 0.01))
                    
                    adjusted_confidence = min(1.0, 
                        base_confidence * text_multiplier + length_bonus + position_bonus
                    )
                    
                    if adjusted_confidence > best_confidence:
                        best_confidence = adjusted_confidence
                        best_match = (category, bucket)
                        matched_keyword = phrase
        
        # Also try single-word exact matches
        for word in words:
            if word in index and len(word) >= 3:  # Minimum 3 chars for single word
                category, bucket, base_confidence = index[word]
                adjusted_confidence = base_confidence * text_multiplier * 0.9  # Slight penalty for single word
                
                if adjusted_confidence > best_confidence:
                    best_confidence = adjusted_confidence
                    best_match = (category, bucket)
                    matched_keyword = word
    
    if best_match:
        return (best_match[0], best_match[1], round(best_confidence, 2), matched_keyword)
    
    # Return defaults
    return (
        defaults.get("default_category", "Uncategorized"),
        defaults.get("default_bucket", "wants"),
        defaults.get("default_confidence", 0.30),
        None
    )


# =============================================================================
# PUBLIC API FUNCTIONS
# =============================================================================

def categorize_transaction(transaction: TransactionInput) -> CategorizedTransaction:
    """
    @brief Categorize a single transaction.
    
    @param transaction TransactionInput with description and optional merchant
    @return CategorizedTransaction with assigned category and bucket
    
    @details
    If the transaction already has a category, it will be preserved
    with confidence 1.0. Otherwise, automatic categorization is applied.
    
    @example
    >>> txn = TransactionInput(id="1", description="Swiggy Order", amount=500)
    >>> result = categorize_transaction(txn)
    >>> result.category
    'Food & Dining'
    >>> result.bucket
    BucketType.WANTS
    """
    # If already categorized, preserve it
    if transaction.category:
        from app.rules.budget_rules import classify_category
        bucket = classify_category(transaction.category)
        
        return CategorizedTransaction(
            id=transaction.id,
            category=transaction.category,
            bucket=BucketType(bucket),
            confidence=1.0,
            matched_keyword=None
        )
    
    # Perform automatic categorization
    category, bucket, confidence, matched_keyword = _find_best_match(
        transaction.description,
        transaction.merchant
    )
    
    return CategorizedTransaction(
        id=transaction.id,
        category=category,
        bucket=BucketType(bucket),
        confidence=confidence,
        matched_keyword=matched_keyword
    )


def categorize_bulk(transactions: List[TransactionInput]) -> Dict:
    """
    @brief Categorize multiple transactions in bulk.
    
    @param transactions List of TransactionInput objects
    @return Dictionary with results and statistics
    
    @details
    Optimized for bulk processing:
    - Loads category rules once
    - Processes all transactions in single pass
    - Returns aggregate statistics
    
    @example
    >>> txns = [
    ...     TransactionInput(id="1", description="Swiggy", amount=500),
    ...     TransactionInput(id="2", description="Rent Payment", amount=25000),
    ... ]
    >>> result = categorize_bulk(txns)
    >>> result["total"]
    2
    >>> result["categorized"]
    2
    """
    if not transactions:
        return {
            "results": [],
            "total": 0,
            "categorized": 0,
            "uncategorized": 0
        }
    
    # Ensure index is loaded
    _get_keyword_index()
    
    results: List[CategorizedTransaction] = []
    categorized_count = 0
    uncategorized_count = 0
    
    for txn in transactions:
        result = categorize_transaction(txn)
        results.append(result)
        
        # Count based on confidence threshold
        if result.confidence >= 0.5:
            categorized_count += 1
        else:
            uncategorized_count += 1
    
    return {
        "results": results,
        "total": len(transactions),
        "categorized": categorized_count,
        "uncategorized": uncategorized_count
    }


def get_category_stats(results: List[CategorizedTransaction]) -> Dict:
    """
    @brief Get statistics from categorization results.
    
    @param results List of CategorizedTransaction objects
    @return Dictionary with category-wise statistics
    """
    if not results:
        return {}
    
    stats: Dict[str, Dict] = {}
    
    for result in results:
        if result.category not in stats:
            stats[result.category] = {
                "count": 0,
                "bucket": result.bucket.value,
                "avg_confidence": 0.0,
                "total_confidence": 0.0
            }
        
        stats[result.category]["count"] += 1
        stats[result.category]["total_confidence"] += result.confidence
    
    # Calculate averages
    for category in stats:
        count = stats[category]["count"]
        stats[category]["avg_confidence"] = round(
            stats[category]["total_confidence"] / count, 2
        )
        del stats[category]["total_confidence"]
    
    return stats


def reload_categories() -> bool:
    """
    @brief Force reload of category rules.
    
    @return True if successful
    
    @note Use this after updating categories.json to pick up changes
          without restarting the application.
    """
    global _KEYWORD_INDEX
    
    try:
        # Clear caches
        _load_categories.cache_clear()
        _KEYWORD_INDEX = _build_keyword_index()
        logger.info("Category rules reloaded successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to reload categories: {e}")
        return False
