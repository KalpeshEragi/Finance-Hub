/**
 * @file ai.types.ts
 * @description TypeScript type definitions for AI Engine integration.
 * 
 * This module defines the contracts for communicating with the AI Engine service:
 * - Transaction categorization requests/responses
 * - Tax suggestion requests/responses
 * - Error handling types
 * 
 * @architecture
 * The AI Engine is a separate microservice that provides:
 * - Smart categorization of transactions based on description/merchant
 * - Tax optimization suggestions based on spending patterns
 * 
 * Communication happens via REST API calls using Axios.
 */

// =============================================================================
// CATEGORIZATION TYPES
// =============================================================================

/**
 * @interface CategoryRequest
 * @description Request body for transaction categorization.
 */
export interface CategoryRequest {
    /** Array of transactions to categorize */
    transactions: CategoryTransactionInput[];
}

/**
 * @interface CategoryTransactionInput
 * @description Single transaction input for categorization.
 */
export interface CategoryTransactionInput {
    /** Transaction ID for correlation */
    id: string;

    /** Transaction description */
    description: string;

    /** Merchant name (if available) */
    merchant?: string;

    /** Transaction amount */
    amount: number;

    /** Transaction type */
    type: 'income' | 'expense';
}

/**
 * @interface CategoryResponse
 * @description Response from categorization endpoint.
 */
export interface CategoryResponse {
    /** Success indicator */
    success: boolean;

    /** Categorization results */
    results: CategoryResult[];

    /** Processing metadata */
    metadata?: {
        totalProcessed: number;
        processingTimeMs: number;
    };
}

/**
 * @interface CategoryResult
 * @description Single categorization result.
 */
export interface CategoryResult {
    /** Original transaction ID */
    transactionId: string;

    /** Suggested category */
    category: string;

    /** Confidence score (0-1) */
    confidence: number;

    /** Alternative categories (optional) */
    alternatives?: Array<{
        category: string;
        confidence: number;
    }>;
}

// =============================================================================
// TAX SUGGESTION TYPES
// =============================================================================

/**
 * @interface TaxSuggestionRequest
 * @description Request body for tax optimization suggestions.
 */
export interface TaxSuggestionRequest {
    /** User's gross income */
    grossIncome: number;

    /** Current deductions claimed */
    currentDeductions: {
        section80C?: number;
        section80D?: number;
        section80G?: number;
        homeLoanInterest?: number;
        hra?: number;
        nps?: number;
    };

    /** Spending breakdown by category */
    spendingByCategory?: Record<string, number>;

    /** Current tax regime preference */
    currentRegime?: 'old' | 'new';
}

/**
 * @interface TaxSuggestionResponse
 * @description Response from tax suggestion endpoint.
 */
export interface TaxSuggestionResponse {
    /** Success indicator */
    success: boolean;

    /** Tax optimization suggestions */
    suggestions: TaxSuggestion[];

    /** Recommended regime */
    recommendedRegime: 'old' | 'new';

    /** Potential savings summary */
    potentialSavings: {
        total: number;
        byRegimeSwitch: number;
        byDeductions: number;
    };
}

/**
 * @interface TaxSuggestion
 * @description Single tax optimization suggestion.
 */
export interface TaxSuggestion {
    /** Suggestion ID */
    id: string;

    /** Deduction section this applies to */
    section: string;

    /** Suggestion title */
    title: string;

    /** Detailed recommendation */
    description: string;

    /** Potential tax savings if implemented */
    potentialSavings: number;

    /** Remaining limit in this section */
    remainingLimit: number;

    /** Priority level */
    priority: 'high' | 'medium' | 'low';
}

// =============================================================================
// SPENDING ANALYSIS TYPES
// =============================================================================

/**
 * @interface SpendingAnalysisRequest
 * @description Request for spending pattern analysis.
 */
export interface SpendingAnalysisRequest {
    /** Monthly spending by category */
    monthlySpending: Array<{
        month: string;
        categories: Record<string, number>;
    }>;

    /** Monthly income */
    monthlyIncome: number[];
}

/**
 * @interface SpendingAnalysisResponse
 * @description Response with spending insights.
 */
export interface SpendingAnalysisResponse {
    /** Success indicator */
    success: boolean;

    /** Detected patterns */
    patterns: SpendingPattern[];

    /** Anomalies detected */
    anomalies: SpendingAnomaly[];

    /** General insights */
    insights: string[];
}

/**
 * @interface SpendingPattern
 * @description Detected spending pattern.
 */
export interface SpendingPattern {
    /** Pattern type */
    type: 'recurring' | 'seasonal' | 'increasing' | 'decreasing';

    /** Affected category */
    category: string;

    /** Pattern description */
    description: string;

    /** Pattern strength (0-1) */
    strength: number;
}

/**
 * @interface SpendingAnomaly
 * @description Unusual spending detection.
 */
export interface SpendingAnomaly {
    /** Month where anomaly was detected */
    month: string;

    /** Affected category */
    category: string;

    /** Anomaly description */
    description: string;

    /** Severity level */
    severity: 'high' | 'medium' | 'low';

    /** Actual vs expected difference */
    deviation: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * @interface AIEngineError
 * @description Error response from AI Engine.
 */
export interface AIEngineError {
    /** Error indicator */
    success: false;

    /** Error message */
    message: string;

    /** Error code */
    code: string;

    /** Additional details */
    details?: unknown;
}

/**
 * @type AIEngineResponse
 * @description Union type for all AI Engine responses.
 */
export type AIEngineResponse<T> = T | AIEngineError;

// =============================================================================
// EXPORTS
// =============================================================================

export default {
    // Types are only exported, not values
};

// =============================================================================
// BUDGET AGENT TYPES
// =============================================================================

export interface BudgetAnalysisRequest {
    transactions: CategoryTransactionInput[];
    user_id: string;
}

export interface BudgetRecommendation {
    category: string;
    current_spending: number;
    recommended_limit: number;
    potential_savings: number;
    reason: string;
    action_item: string;
    priority: number;
}

export interface BudgetAnalysisResponse {
    total_spending: number;
    needs_spending: number;
    wants_spending: number;
    savings_spending: number;
    recommendations: BudgetRecommendation[];
    estimated_monthly_savings: number;
}
