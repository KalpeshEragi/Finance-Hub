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
    const newRegimeEstimate = calculateTaxForRegime('new', grossIncome, {
        ...profile.deductions,
        // New regime only has standard deduction, no other deductions
        section80C: 0,
        section80D: 0,
        section80G: 0,
        homeLoanInterest: 0,
        hra: 0,
        lta: 0,
        nps: 0,
    });

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

// =============================================================================
// EXPORTS
// =============================================================================

export const taxService = {
    addIncome,
    getEstimate,
    getRegime,
    getDeductions,
    getOrCreateProfile,
};

export default taxService;
