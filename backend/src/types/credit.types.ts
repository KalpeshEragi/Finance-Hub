/**
 * @file credit.types.ts
 * @description TypeScript type definitions for credit score functionality.
 * 
 * @important
 * All credit scores in this application are SIMULATED/ESTIMATED credit health
 * scores based on transaction patterns and financial behavior. They are NOT
 * actual credit bureau scores (like CIBIL, FICO, etc.).
 * 
 * @architecture
 * The credit module provides:
 * - Simulated credit health score (300-850 range)
 * - Contributing factors analysis
 * - Personalized recommendations
 * - Historical score snapshots
 */

import { Document, Types } from 'mongoose';

// =============================================================================
// CREDIT SCORE TYPES
// =============================================================================

/**
 * @interface ICreditSnapshotBase
 * @description Base credit snapshot properties.
 * A snapshot captures the credit health at a specific point in time.
 */
export interface ICreditSnapshotBase {
    /** Reference to the user */
    userId: Types.ObjectId;

    /** 
     * Simulated credit health score (300-850)
     * @important This is NOT an actual credit bureau score
     */
    score: number;

    /** Factors contributing to the score */
    factors: CreditFactor[];

    /** Personalized recommendations for improvement */
    recommendations: CreditRecommendation[];

    /** Score rating category */
    rating: CreditRating;
}

/**
 * @interface ICreditSnapshot
 * @description Full credit snapshot document.
 */
export interface ICreditSnapshot extends Document, ICreditSnapshotBase {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// CREDIT RATING
// =============================================================================

/**
 * @type CreditRating
 * @description Credit health rating categories.
 */
export type CreditRating = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor';

/**
 * @constant CREDIT_RATING_RANGES
 * @description Score ranges for each rating category.
 */
export const CREDIT_RATING_RANGES = {
    'Excellent': { min: 750, max: 850 },
    'Good': { min: 700, max: 749 },
    'Fair': { min: 650, max: 699 },
    'Poor': { min: 550, max: 649 },
    'Very Poor': { min: 300, max: 549 },
} as const;

// =============================================================================
// CREDIT FACTORS
// =============================================================================

/**
 * @interface CreditFactor
 * @description A factor that influences the credit health score.
 */
export interface CreditFactor {
    /** Factor name (e.g., 'Payment History', 'Spending Patterns') */
    name: string;

    /** Factor score (0-100) */
    score: number;

    /** Weight of this factor in overall score (0-1) */
    weight: number;

    /** Impact level on score */
    impact: 'positive' | 'neutral' | 'negative';

    /** Detailed description */
    description: string;
}

/**
 * @enum CreditFactorType
 * @description Types of factors we analyze.
 */
export enum CreditFactorType {
    PAYMENT_CONSISTENCY = 'Payment Consistency',
    SPENDING_PATTERNS = 'Spending Patterns',
    SAVINGS_RATE = 'Savings Rate',
    BUDGET_ADHERENCE = 'Budget Adherence',
    FINANCIAL_DIVERSITY = 'Financial Diversity',
}

// =============================================================================
// CREDIT RECOMMENDATIONS
// =============================================================================

/**
 * @interface CreditRecommendation
 * @description A personalized recommendation to improve credit health.
 */
export interface CreditRecommendation {
    /** Recommendation ID */
    id: string;

    /** Short title */
    title: string;

    /** Detailed recommendation text */
    description: string;

    /** Priority level */
    priority: 'high' | 'medium' | 'low';

    /** Related factor that this recommendation addresses */
    relatedFactor: string;

    /** Estimated score improvement if followed */
    potentialImpact: number;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * @interface CreditScoreResponse
 * @description Response for GET /credit/score endpoint.
 * 
 * @important The label must always indicate this is an estimated/simulated score
 */
export interface CreditScoreResponse {
    success: true;
    data: {
        /** 
         * Score label - MUST always indicate this is simulated
         * @example "Estimated / Simulated Credit Health Score"
         */
        label: 'Estimated / Simulated Credit Health Score';

        /** The simulated score value (300-850) */
        score: number;

        /** Rating category */
        rating: CreditRating;

        /** Score change since last calculation */
        change?: {
            value: number;
            direction: 'up' | 'down' | 'unchanged';
            period: string;
        };

        /** When the score was last calculated */
        lastUpdated: Date;
    };
}

/**
 * @interface CreditFactorsResponse
 * @description Response for GET /credit/factors endpoint.
 */
export interface CreditFactorsResponse {
    success: true;
    data: {
        /** All contributing factors */
        factors: CreditFactor[];

        /** Overall assessment */
        summary: string;
    };
}

/**
 * @interface CreditRecommendationsResponse
 * @description Response for GET /credit/recommendations endpoint.
 */
export interface CreditRecommendationsResponse {
    success: true;
    data: {
        /** Personalized recommendations */
        recommendations: CreditRecommendation[];

        /** Total potential score improvement */
        totalPotentialImprovement: number;
    };
}

// =============================================================================
// CALCULATION TYPES (INTERNAL)
// =============================================================================

/**
 * @interface CreditCalculationInput
 * @description Input data for credit score calculation.
 * Used internally by the credit service.
 */
export interface CreditCalculationInput {
    /** User ID */
    userId: string;

    /** Total income in analysis period */
    totalIncome: number;

    /** Total expenses in analysis period */
    totalExpenses: number;

    /** Monthly expense breakdown by category */
    monthlyExpenses: Map<string, number>;

    /** Budget adherence percentage */
    budgetAdherence: number;

    /** Number of months with consistent transactions */
    consistencyMonths: number;

    /** Average savings rate */
    savingsRate: number;
}

/**
 * @interface CreditScoreBreakdown
 * @description Detailed breakdown of score calculation.
 * Useful for debugging and transparency.
 */
export interface CreditScoreBreakdown {
    /** Base score before adjustments */
    baseScore: number;

    /** Adjustments applied */
    adjustments: Array<{
        factor: string;
        adjustment: number;
        reason: string;
    }>;

    /** Final calculated score */
    finalScore: number;
}
