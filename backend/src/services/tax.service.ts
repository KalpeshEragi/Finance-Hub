/**
 * @file tax.service.ts
 * @description Tax estimation and optimization service.
 * 
 * This service handles:
 * - Tax profile management
 * - Income and deduction tracking
 * - Tax estimation for old vs new regimes
 * - Regime comparison and recommendations
 * 
 * @note Based on Indian Income Tax Act (simplified for hackathon)
 */

import mongoose from 'mongoose';
import TaxProfile from '../models/taxProfile.model';
import { aiClient } from '../integrations/ai-engine/ai.client';
import { getFinancialYear } from '../utils/date';
import { TAX_SLABS, DEDUCTION_LIMITS } from '../config/constants';
import type {
    TaxRegime,
    TaxEstimate,
    TaxComparison,
    IncomeInput,
    DeductionDetails,
} from '../types/tax.types';

// =============================================================================
// PROFILE MANAGEMENT
// =============================================================================

/**
 * @function getOrCreateProfile
 * @description Gets existing tax profile or creates new one for current FY.
 */
async function getOrCreateProfile(userId: string, financialYear?: string) {
    const fy = financialYear || getFinancialYear().label;

    let profile = await TaxProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        financialYear: fy,
    });

    if (!profile) {
        profile = await TaxProfile.create({
            userId: new mongoose.Types.ObjectId(userId),
            financialYear: fy,
            preferredRegime: 'new',
            income: {
                salary: 0,
                rental: 0,
                otherSources: 0,
                business: 0,
                capitalGains: { shortTerm: 0, longTerm: 0 },
            },
            deductions: {
                section80C: 0,
                section80D: 0,
                section80G: 0,
                homeLoanInterest: 0,
                hra: 0,
                lta: 0,
                standardDeduction: 75000,
                professionalTax: 0,
                nps: 0,
            },
        });
    }

    return profile;
}

// =============================================================================
// INCOME MANAGEMENT
// =============================================================================

/**
 * @function addIncome
 * @description Adds or updates income in user's tax profile.
 * 
 * @param userId - User ID
 * @param input - Income type and amount
 */
export async function addIncome(
    userId: string,
    input: IncomeInput
): Promise<{ success: true; message: string }> {
    const profile = await getOrCreateProfile(userId);

    // Update the appropriate income field
    switch (input.type) {
        case 'salary':
            profile.income.salary = input.period === 'monthly'
                ? input.amount * 12
                : input.amount;
            break;
        case 'rental':
            profile.income.rental = input.period === 'monthly'
                ? input.amount * 12
                : input.amount;
            break;
        case 'business':
            profile.income.business = input.amount;
            break;
        case 'other':
            profile.income.otherSources = input.amount;
            break;
        case 'capital_gains_short':
            profile.income.capitalGains.shortTerm = input.amount;
            break;
        case 'capital_gains_long':
            profile.income.capitalGains.longTerm = input.amount;
            break;
    }

    await profile.save();

    return {
        success: true,
        message: `Income updated: ${input.type} = ₹${input.amount.toLocaleString()}`,
    };
}

/**
 * @function updateDeductions
 * @description Updates deductions in user's tax profile.
 */
export async function updateDeductions(
    userId: string,
    deductions: Partial<DeductionDetails>
): Promise<{ success: true; data: import('../models/taxProfile.model').ITaxProfile }> {
    const profile = await getOrCreateProfile(userId);

    // Merge deductions
    profile.deductions = {
        ...profile.deductions,
        ...deductions,
    };

    await profile.save();

    return {
        success: true,
        data: profile,
    };
}

// =============================================================================
// TAX ESTIMATION
// =============================================================================

/**
 * @function getEstimate
 * @description Calculates tax estimates for both regimes.
 * 
 * @param userId - User ID
 * @returns Tax comparison between old and new regimes
 */
export async function getEstimate(userId: string): Promise<TaxComparison> {
    const profile = await getOrCreateProfile(userId);

    const grossIncome =
        profile.income.salary +
        profile.income.rental +
        profile.income.otherSources +
        profile.income.business +
        profile.income.capitalGains.shortTerm +
        profile.income.capitalGains.longTerm;

    // Calculate for both regimes
    const oldRegimeEstimate = calculateTaxForRegime('old', grossIncome, profile.deductions);

    // For New Regime, only standard deduction applies (handled in calculateTaxForRegime)
    const newRegimeDeductions: DeductionDetails = {
        section80C: 0,
        section80D: 0,
        section80G: 0,
        homeLoanInterest: 0,
        hra: 0,
        lta: 0,
        nps: 0,
        standardDeduction: 75000, // Will be overwritten by regime-specific logic
        professionalTax: profile.deductions.professionalTax, // This is allowed in new regime
    };
    const newRegimeEstimate = calculateTaxForRegime('new', grossIncome, newRegimeDeductions);

    // Determine recommended regime
    const recommended = oldRegimeEstimate.totalTax <= newRegimeEstimate.totalTax ? 'old' : 'new';
    const savings = Math.abs(oldRegimeEstimate.totalTax - newRegimeEstimate.totalTax);

    return {
        oldRegime: oldRegimeEstimate,
        newRegime: newRegimeEstimate,
        recommended,
        savings,
        explanation: recommended === 'old'
            ? `Old regime saves ₹${savings.toLocaleString()} due to your deductions`
            : `New regime saves ₹${savings.toLocaleString()} with lower base rates`,
    };
}

/**
 * @function calculateTaxForRegime
 * @description Calculates detailed tax breakdown for a regime.
 */
function calculateTaxForRegime(
    regime: TaxRegime,
    grossIncome: number,
    deductions: DeductionDetails
): TaxEstimate {
    // Use regime-specific standard deduction
    const standardDeduction = regime === 'old'
        ? (DEDUCTION_LIMITS.standardDeductionOld || 50000)
        : (DEDUCTION_LIMITS.standardDeductionNew || 75000);

    // Calculate total deductions
    const totalDeductions =
        deductions.section80C +
        deductions.section80D +
        deductions.section80G +
        deductions.homeLoanInterest +
        deductions.hra +
        deductions.lta +
        standardDeduction +
        deductions.professionalTax +
        deductions.nps;

    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    // Get applicable slabs
    const slabs = regime === 'old' ? TAX_SLABS.OLD : TAX_SLABS.NEW;

    // Calculate slab-wise tax
    let remainingIncome = taxableIncome;
    let taxBeforeCess = 0;
    const slabBreakdown: TaxEstimate['slabBreakdown'] = [];

    for (const slab of slabs) {
        if (remainingIncome <= 0) break;

        const slabRange = slab.max - slab.min;
        const incomeInSlab = Math.min(remainingIncome, slabRange);
        const taxInSlab = (incomeInSlab * slab.rate) / 100;

        if (incomeInSlab > 0) {
            slabBreakdown.push({
                slab: slab.max === Infinity
                    ? `Above ₹${slab.min.toLocaleString()}`
                    : `₹${slab.min.toLocaleString()} - ₹${slab.max.toLocaleString()}`,
                income: incomeInSlab,
                tax: taxInSlab,
                rate: slab.rate,
            });
        }

        taxBeforeCess += taxInSlab;
        remainingIncome -= incomeInSlab;
    }

    // Add 4% health and education cess
    const cess = taxBeforeCess * 0.04;
    const totalTax = Math.round(taxBeforeCess + cess);

    // Calculate effective tax rate
    const effectiveTaxRate = grossIncome > 0
        ? (totalTax / grossIncome) * 100
        : 0;

    return {
        regime,
        grossIncome,
        totalDeductions,
        taxableIncome,
        taxBeforeCess: Math.round(taxBeforeCess),
        cess: Math.round(cess),
        totalTax,
        effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100,
        slabBreakdown,
    };
}

// =============================================================================
// REGIME AND DEDUCTIONS
// =============================================================================

/**
 * @function getRegime
 * @description Gets current regime preference with comparison.
 */
export async function getRegime(userId: string): Promise<{
    currentRegime: TaxRegime;
    comparison: TaxComparison;
}> {
    const profile = await getOrCreateProfile(userId);
    const comparison = await getEstimate(userId);

    return {
        currentRegime: profile.preferredRegime,
        comparison,
    };
}

/**
 * @function getDeductions
 * @description Gets current deductions with limits and suggestions.
 */
export async function getDeductions(userId: string): Promise<{
    claimed: DeductionDetails;
    limits: Partial<Record<keyof DeductionDetails, number>>;
    remaining: Partial<Record<keyof DeductionDetails, number>>;
    suggestions: Array<{ section: string; title: string; description: string; potentialSavings: number; priority: 'high' | 'medium' | 'low' }>;
}> {
    const profile = await getOrCreateProfile(userId);

    // Calculate remaining room in each section
    const remaining: Partial<Record<keyof DeductionDetails, number>> = {};

    for (const [key, limit] of Object.entries(DEDUCTION_LIMITS)) {
        const claimed = profile.deductions[key as keyof DeductionDetails] || 0;
        remaining[key as keyof DeductionDetails] = Math.max(0, (limit ?? 0) - claimed);
    }

    // Generate suggestions based on underutilized deductions
    const suggestions = [];

    if ((remaining.section80C || 0) > 0) {
        suggestions.push({
            section: '80C',
            title: 'Maximize Section 80C',
            description: `Invest in PPF, ELSS, or life insurance to claim remaining ₹${remaining.section80C?.toLocaleString()}`,
            potentialSavings: Math.round((remaining.section80C || 0) * 0.3),
            priority: 'high' as const,
        });
    }

    if ((remaining.section80D || 0) > 20000) {
        suggestions.push({
            section: '80D',
            title: 'Health Insurance Deduction',
            description: 'Get health insurance coverage for yourself and family',
            potentialSavings: Math.round((remaining.section80D || 0) * 0.3),
            priority: 'medium' as const,
        });
    }

    if ((remaining.nps || 0) > 0) {
        suggestions.push({
            section: '80CCD(1B)',
            title: 'NPS Investment',
            description: `Invest in NPS for additional ₹${remaining.nps?.toLocaleString()} deduction`,
            potentialSavings: Math.round((remaining.nps || 0) * 0.3),
            priority: 'medium' as const,
        });
    }

    return {
        claimed: profile.deductions,
        limits: DEDUCTION_LIMITS,
        remaining,
        suggestions,
    };
}

/**
 * @function getITRRecommendation
 * @description Determines the correct ITR form based on income profile.
 */
export async function getITRRecommendation(userId: string): Promise<import('../types/tax.types').ITRRecommendation> {
    const profile = await getOrCreateProfile(userId);
    const income = profile.income;
    const totalIncome =
        income.salary +
        income.rental +
        income.business +
        income.otherSources +
        (income.capitalGains?.shortTerm ?? 0) +
        (income.capitalGains?.longTerm ?? 0);

    let form = "ITR-1";
    let reason = "Your income primarily comes from salary and other sources.";
    let description = "For individuals being a resident (other than not ordinarily resident) having total income upto Rs.50 lakh, having Income from Salaries, one house property, other sources (Interest etc.), and agricultural income upto Rs.5000.";

    if (income.business > 0) {
        form = "ITR-3";
        reason = "You have income from business or profession.";
        description = "For individuals and HUFs having income from proprietary business or profession.";
    } else if (income.capitalGains.shortTerm > 0 || income.capitalGains.longTerm > 0) {
        form = "ITR-2";
        reason = "You have capital gains from investments.";
        description = "For Individuals and HUFs not having income from profits and gains of business or profession.";
    } else if (totalIncome > 5000000) {
        form = "ITR-2";
        reason = "Your total income exceeds ₹50 Lakhs.";
        description = "For Individuals and HUFs not having income from profits and gains of business or profession.";
    } else if (income.rental > 0) {
        // Technically ITR-1 allows one house property. We assume simple case here.
        // If complex, logic would be more intricate.
        form = "ITR-1";
        reason = "You have rental income from a house property.";
    }

    return {
        form,
        reason,
        description
    };
}

// =============================================================================
// RULE-BASED TAX GUIDANCE
// =============================================================================

/**
 * @function getTaxGuidance
 * @description Provides rule-based tax guidance without exact calculations.
 */
export function getTaxGuidance(
    input: import('../types/tax.types').TaxGuidanceInput
): import('../types/tax.types').TaxGuidanceOutput {
    const { individualType, incomeRange, ageGroup, regimePreference, deductions = {} } = input;

    // =========================================================================
    // A) ITR FORM SUGGESTION (Rule-Based)
    // =========================================================================
    let itrForm = { suggested: 'ITR-1', reason: '' };

    if (individualType === 'business_owner') {
        itrForm = {
            suggested: 'ITR-3 or ITR-4',
            reason: 'You have business income. ITR-4 (Sugam) for presumptive taxation, ITR-3 for regular business.'
        };
    } else if (individualType === 'self_employed') {
        itrForm = {
            suggested: 'ITR-4 (Sugam)',
            reason: 'For professionals opting for presumptive taxation under Section 44ADA.'
        };
    } else if (incomeRange === '50L+') {
        itrForm = {
            suggested: 'ITR-2',
            reason: 'Your income exceeds ₹50 Lakhs, which requires ITR-2 instead of ITR-1.'
        };
    } else {
        itrForm = {
            suggested: 'ITR-1 (Sahaj)',
            reason: 'For salaried individuals with total income up to ₹50 Lakhs from salary, one house property, and other sources.'
        };
    }

    // =========================================================================
    // B) REGIME COMPARISON (Explainable, Not Exact)
    // =========================================================================
    const oldRegimeBenefits = [
        '80C: Up to ₹1.5L (EPF, PPF, ELSS, LIC)',
        '80D: Up to ₹25K-₹1L (Health Insurance)',
        '80CCD(1B): Additional ₹50K (NPS)',
        'Section 24: Home Loan Interest up to ₹2L',
        'Standard Deduction: ₹50K',
        'HRA Exemption (if applicable)'
    ];

    const newRegimeBenefits = [
        'Lower tax slab rates',
        'Standard Deduction: ₹75K (FY 2025-26)',
        'Simpler filing - no need to track investments',
        'No documentation required for deductions'
    ];

    // Estimate regime recommendation based on deduction usage
    const hasSignificantDeductions =
        deductions.hasEPF ||
        deductions.hasPPF ||
        deductions.hasELSS ||
        deductions.hasHomeLoan ||
        deductions.hasNPS;

    let regimeRecommendation = '';
    let estimatedDifference = '';

    if (regimePreference === 'old') {
        regimeRecommendation = 'You prefer Old Regime. Ensure you maximize deductions to benefit from it.';
    } else if (regimePreference === 'new') {
        regimeRecommendation = 'You prefer New Regime. No action needed on deductions for tax purposes.';
    } else if (hasSignificantDeductions) {
        regimeRecommendation = 'You have deductions like EPF/PPF/NPS/Home Loan. Old Regime may save you ₹15K-₹50K depending on total deductions.';
        estimatedDifference = '₹15,000 - ₹50,000 (estimate)';
    } else {
        regimeRecommendation = 'With limited deductions, New Regime\'s lower rates are likely better for you.';
    }

    // =========================================================================
    // C) TAX SAVING SUGGESTIONS (Rule-Based, Never Suggest Taking Loans)
    // =========================================================================
    const suggestions: import('../types/tax.types').TaxSavingSuggestion[] = [];

    // 80C suggestions
    if (!deductions.hasEPF && !deductions.hasPPF && !deductions.hasELSS) {
        suggestions.push({
            section: '80C',
            title: 'Start Tax-Saving Investments',
            benefit: 'Reduce taxable income by up to ₹1.5 Lakhs',
            maxDeduction: 150000,
            applicable: true,
            priority: 'high'
        });
    } else if (deductions.hasEPF && !deductions.hasPPF && !deductions.hasELSS) {
        suggestions.push({
            section: '80C',
            title: 'Maximize 80C Beyond EPF',
            benefit: 'If EPF doesn\'t fully cover ₹1.5L, consider PPF or ELSS',
            maxDeduction: 150000,
            applicable: true,
            priority: 'medium'
        });
    }

    // 80D - Health Insurance
    if (!deductions.hasHealthInsurance) {
        const maxDeduction = ageGroup === 'above_80' ? 100000 : (ageGroup === '60_to_80' ? 50000 : 25000);
        suggestions.push({
            section: '80D',
            title: 'Get Health Insurance',
            benefit: `Claim up to ₹${maxDeduction.toLocaleString()} for self (more if parents included)`,
            maxDeduction,
            applicable: true,
            priority: 'high'
        });
    }

    // NPS - 80CCD(1B)
    if (!deductions.hasNPS) {
        suggestions.push({
            section: '80CCD(1B)',
            title: 'Consider NPS Investment',
            benefit: 'Additional ₹50,000 deduction beyond 80C limit',
            maxDeduction: 50000,
            applicable: true,
            priority: 'medium'
        });
    }

    // Home Loan - Section 24 (only if user already has one, NEVER suggest taking loan)
    if (deductions.hasHomeLoan) {
        suggestions.push({
            section: 'Section 24',
            title: 'Claim Home Loan Interest',
            benefit: 'Deduction up to ₹2 Lakhs on home loan interest (self-occupied)',
            maxDeduction: 200000,
            applicable: true,
            priority: 'high'
        });
    }

    // Education Loan - 80E (only if user already has one)
    if (deductions.hasEducationLoan) {
        suggestions.push({
            section: '80E',
            title: 'Claim Education Loan Interest',
            benefit: 'No upper limit on interest deduction for higher education loan',
            maxDeduction: 0, // No limit
            applicable: true,
            priority: 'medium'
        });
    }

    // =========================================================================
    // D) DISCLAIMERS
    // =========================================================================
    const disclaimers = [
        'This is guidance only, not official tax filing advice.',
        'Actual tax liability depends on complete and accurate disclosures.',
        'Estimates are based on general rules and may vary for your specific case.',
        'Please consult a tax professional or verify on Income Tax e-Filing portal before filing.',
        'Tax laws are subject to change. This is based on FY 2025-26 rules.'
    ];

    return {
        itrForm,
        regimeComparison: {
            oldRegimeBenefits,
            newRegimeBenefits,
            recommendation: regimeRecommendation,
            estimatedDifference: estimatedDifference || undefined,
            isEstimate: true
        },
        suggestions,
        disclaimers
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const taxService = {
    addIncome,
    updateDeductions,
    getEstimate,
    getRegime,
    getDeductions,
    getITRRecommendation,
    getTaxGuidance,
    getOrCreateProfile,
};

export default taxService;
