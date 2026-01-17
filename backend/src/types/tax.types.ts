/**
 * @file tax.types.ts
 * @description TypeScript type definitions for tax estimation functionality.
 * 
 * This module provides types for Indian income tax calculations including:
 * - Tax profile management
 * - Old vs New tax regime comparison
 * - Deduction tracking (80C, 80D, HRA, etc.)
 * - Tax estimation and projections
 * 
 * @note Tax slabs and rules are based on Indian Income Tax Act (simplified for hackathon)
 */

import { Document, Types } from 'mongoose';

// =============================================================================
// TAX REGIME TYPES
// =============================================================================

/**
 * @type TaxRegime
 * @description Indian tax regime options.
 * - 'old': Traditional regime with deductions
 * - 'new': New simplified regime with lower rates but fewer deductions
 */
export type TaxRegime = 'old' | 'new';

// =============================================================================
// TAX PROFILE TYPES
// =============================================================================

/**
 * @interface ITaxProfileBase
 * @description Base tax profile properties.
 * Stores user's income sources and deduction claims.
 */
export interface ITaxProfileBase {
    /** Reference to the user */
    userId: Types.ObjectId;

    /** Financial year (e.g., '2024-25') */
    financialYear: string;

    /** User's preferred tax regime */
    preferredRegime: TaxRegime;

    /** Income sources */
    income: IncomeDetails;

    /** Claimed deductions */
    deductions: DeductionDetails;
}

/**
 * @interface ITaxProfile
 * @description Full tax profile document.
 */
export interface ITaxProfile extends Document, ITaxProfileBase {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// INCOME TYPES
// =============================================================================

/**
 * @interface IncomeDetails
 * @description Breakdown of user's income sources.
 */
export interface IncomeDetails {
    /** Salary income (before deductions) */
    salary: number;

    /** Rental income from property */
    rental: number;

    /** Income from other sources (interest, dividends, etc.) */
    otherSources: number;

    /** Business/professional income */
    business: number;

    /** Capital gains */
    capitalGains: {
        shortTerm: number;
        longTerm: number;
    };
}

/**
 * @interface IncomeInput
 * @description Input for adding/updating income.
 */
export interface IncomeInput {
    /** Type of income */
    type: 'salary' | 'rental' | 'business' | 'other' | 'capital_gains_short' | 'capital_gains_long';

    /** Income amount */
    amount: number;

    /** Description or source */
    description?: string;

    /** Period (monthly/annual) */
    period?: 'monthly' | 'annual';
}

// =============================================================================
// DEDUCTION TYPES
// =============================================================================

/**
 * @interface DeductionDetails
 * @description Tax deductions under various sections.
 * All values are annual amounts.
 */
export interface DeductionDetails {
    /** Section 80C: Investments (PPF, ELSS, LIC, etc.) - Max ₹1.5L */
    section80C: number;

    /** Section 80D: Health Insurance Premium - Max ₹25K-₹100K */
    section80D: number;

    /** Section 80G: Donations to eligible charities */
    section80G: number;

    /** Section 24: Home Loan Interest - Max ₹2L for self-occupied */
    homeLoanInterest: number;

    /** HRA Exemption (if applicable) */
    hra: number;

    /** Leave Travel Allowance */
    lta: number;

    /** Standard Deduction (₹50,000 for salaried) */
    standardDeduction: number;

    /** Professional Tax (typically ₹2,400/year) */
    professionalTax: number;

    /** NPS contribution - Section 80CCD(1B) - Additional ₹50K */
    nps: number;
}

/**
 * @interface DeductionInput
 * @description Input for claiming a deduction.
 */
export interface DeductionInput {
    /** Type/section of deduction */
    type: keyof DeductionDetails;

    /** Amount claimed */
    amount: number;

    /** Supporting document reference */
    documentRef?: string;
}

// =============================================================================
// TAX ESTIMATION TYPES
// =============================================================================

/**
 * @interface TaxSlab
 * @description A tax slab definition.
 */
export interface TaxSlab {
    /** Minimum income for this slab */
    min: number;

    /** Maximum income for this slab (Infinity for highest) */
    max: number;

    /** Tax rate as percentage */
    rate: number;
}

/**
 * @interface TaxEstimate
 * @description Calculated tax estimate for a regime.
 */
export interface TaxEstimate {
    /** Tax regime used for calculation */
    regime: TaxRegime;

    /** Gross total income */
    grossIncome: number;

    /** Total deductions claimed */
    totalDeductions: number;

    /** Taxable income after deductions */
    taxableIncome: number;

    /** Tax before cess */
    taxBeforeCess: number;

    /** Health & Education Cess (4%) */
    cess: number;

    /** Total tax liability */
    totalTax: number;

    /** Effective tax rate */
    effectiveTaxRate: number;

    /** Slab-wise tax breakdown */
    slabBreakdown: Array<{
        slab: string;
        income: number;
        tax: number;
        rate: number;
    }>;
}

/**
 * @interface TaxComparison
 * @description Comparison between old and new tax regimes.
 */
export interface TaxComparison {
    /** Estimate under old regime */
    oldRegime: TaxEstimate;

    /** Estimate under new regime */
    newRegime: TaxEstimate;

    /** Recommended regime */
    recommended: TaxRegime;

    /** Potential savings by choosing recommended */
    savings: number;

    /** Recommendation explanation */
    explanation: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * @interface TaxEstimateResponse
 * @description Response for GET /tax/estimate endpoint.
 */
export interface TaxEstimateResponse {
    success: true;
    data: TaxComparison;
}

/**
 * @interface TaxRegimeResponse
 * @description Response for GET /tax/regime endpoint.
 */
export interface TaxRegimeResponse {
    success: true;
    data: {
        /** Current preferred regime */
        currentRegime: TaxRegime;

        /** Regime comparison */
        comparison: TaxComparison;

        /** AI-powered suggestion */
        suggestion?: {
            recommendedRegime: TaxRegime;
            reason: string;
        };
    };
}

/**
 * @interface TaxDeductionsResponse
 * @description Response for GET /tax/deductions endpoint.
 */
export interface TaxDeductionsResponse {
    success: true;
    data: {
        /** Current claimed deductions */
        claimed: DeductionDetails;

        /** Maximum allowed for each section */
        limits: Partial<Record<keyof DeductionDetails, number>>;

        /** Remaining room for each section */
        remaining: Partial<Record<keyof DeductionDetails, number>>;

        /** Deduction suggestions */
        suggestions: DeductionSuggestion[];
    };
}

/**
 * @interface DeductionSuggestion
 * @description AI-suggested deduction opportunity.
 */
export interface DeductionSuggestion {
    /** Section this applies to */
    section: string;

    /** Suggestion title */
    title: string;

    /** Detailed description */
    description: string;

    /** Potential tax savings */
    potentialSavings: number;

    /** Priority level */
    priority: 'high' | 'medium' | 'low';
}

/**
 * @interface ITRRecommendation
 * @description ITR Form selection recommendation.
 */
export interface ITRRecommendation {
    /** Recommended ITR Form (e.g. ITR-1, ITR-2) */
    form: string;

    /** Reason for this recommendation */
    reason: string;

    /** Detailed description of the form's applicability */
    description: string;
}

// =============================================================================
// TAX GUIDANCE TYPES (Rule-Based System)
// =============================================================================

/**
 * @interface TaxGuidanceInput
 * @description Input for rule-based tax guidance.
 */
export interface TaxGuidanceInput {
    /** Type of individual */
    individualType: 'salaried' | 'self_employed' | 'business_owner';

    /** Annual income range */
    incomeRange: '0-5L' | '5-10L' | '10-15L' | '15-25L' | '25-50L' | '50L+';

    /** Age group */
    ageGroup: 'below_60' | '60_to_80' | 'above_80';

    /** Regime preference */
    regimePreference: 'not_decided' | 'old' | 'new';

    /** Optional deductions (all default to false) */
    deductions?: {
        hasEPF?: boolean;
        hasPPF?: boolean;
        hasELSS?: boolean;
        hasNPS?: boolean;
        hasHomeLoan?: boolean;
        hasEducationLoan?: boolean;
        hasHealthInsurance?: boolean;
    };
}

/**
 * @interface TaxSavingSuggestion
 * @description A single tax-saving suggestion.
 */
export interface TaxSavingSuggestion {
    section: string;
    title: string;
    benefit: string;
    maxDeduction: number;
    applicable: boolean;
    priority: 'high' | 'medium' | 'low';
}

/**
 * @interface TaxGuidanceOutput
 * @description Output from rule-based tax guidance.
 */
export interface TaxGuidanceOutput {
    /** ITR Form recommendation */
    itrForm: {
        suggested: string;
        reason: string;
    };

    /** Regime comparison */
    regimeComparison: {
        oldRegimeBenefits: string[];
        newRegimeBenefits: string[];
        recommendation: string;
        estimatedDifference?: string;
        isEstimate: true;
    };

    /** Tax saving suggestions */
    suggestions: TaxSavingSuggestion[];

    /** Disclaimers */
    disclaimers: string[];
}


// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * @constant DEDUCTION_LIMITS
 * @description Maximum deduction limits under various sections (FY 2024-25).
 */
export const DEDUCTION_LIMITS: Partial<Record<keyof DeductionDetails, number>> = {
    section80C: 150000,           // ₹1.5 Lakh
    section80D: 75000,            // ₹25K self + ₹50K parents (senior)
    homeLoanInterest: 200000,     // ₹2 Lakh for self-occupied
    standardDeduction: 50000,     // ₹50K (old regime only)
    nps: 50000,                   // Additional ₹50K under 80CCD(1B)
};
