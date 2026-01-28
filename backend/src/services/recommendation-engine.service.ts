/**
 * @file recommendation-engine.service.ts
 * @description Investment Recommendation Engine.
 * 
 * Generates clear, explainable investment recommendations by combining:
 * - Investment Readiness (READY/NOT_READY/CAUTION)
 * - Risk Profile (Stability-Focused / Growth-Ready / Growth-Optimized)
 * - User's financial data from Ledger Snapshot
 * 
 * Core Rules:
 * - Max 2 recommendations (focused, actionable)
 * - Allocations as % of income (not absolute amounts)
 * - Instruments: Emergency Fund, PPF, Index Fund SIP, ELSS, Stocks
 * - No market predictions, no NAV, no returns forecasting
 * 
 * @architecture
 * Consumes data from investment-agent.service and risk-profile.service.
 * All rules are deterministic and based on user behavior.
 */

import { getLedgerSnapshot, LedgerSnapshot } from './ledger.service';
import {
    InvestmentReadinessResult,
    ReadinessStatus,
    evaluateInvestmentReadiness
} from './investment-agent.service';
import {
    getUserRiskProfile,
    RiskProfileTier,
    RiskProfileResult
} from './risk-profile.service';
import mongoose from 'mongoose';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type InstrumentType =
    | 'emergency_fund'
    | 'ppf'
    | 'index_sip'
    | 'elss'
    | 'stocks'
    | 'liquid_fund';

export interface Recommendation {
    id: string;
    type: InstrumentType;
    name: string;
    allocation: string;              // "10-15%" display format
    allocationRange: [number, number]; // [10, 15] for calculations
    monthlyAmount: number;           // Calculated from income
    reason: string;                  // Why this recommendation
    actionItem: string;              // What to do next
    priority: 1 | 2;                 // Order of importance
    riskLevel: 'low' | 'medium' | 'high';
    taxBenefit: boolean;
}

export interface RecommendationResult {
    recommendations: Recommendation[];
    summary: string;                 // 2-3 sentence explanation
    totalAllocation: string;         // "20-25% of income"
    totalMonthlyAmount: number;      // Sum of monthly amounts
    readinessStatus: ReadinessStatus;
    riskProfile: RiskProfileTier;
    confidence: number;              // How confident in recommendation
    context: {
        monthlyIncome: number;
        monthlySurplus: number;
        savingsRate: number;
        emergencyFundMonths: number;
        debtToIncomeRatio: number;
    };
}

// =============================================================================
// INSTRUMENT CATALOG
// =============================================================================

interface InstrumentInfo {
    id: string;
    type: InstrumentType;
    name: string;
    riskLevel: 'low' | 'medium' | 'high';
    taxBenefit: boolean;
    actionItem: string;
    minIncomePercent: number;  // Minimum % of income to recommend
    maxIncomePercent: number;  // Maximum % of income to recommend
    suitableFor: RiskProfileTier[];
    requiredReadiness: ReadinessStatus[];
}

const INSTRUMENTS: InstrumentInfo[] = [
    {
        id: 'emergency-fund',
        type: 'emergency_fund',
        name: 'Emergency Fund (Savings Account)',
        riskLevel: 'low',
        taxBenefit: false,
        actionItem: 'Set aside in high-interest savings account or liquid fund.',
        minIncomePercent: 5,
        maxIncomePercent: 20,
        suitableFor: ['Stability-Focused', 'Growth-Ready', 'Growth-Optimized'],
        requiredReadiness: ['NOT_READY', 'CAUTION'],
    },
    {
        id: 'liquid-fund',
        type: 'liquid_fund',
        name: 'Liquid Mutual Fund',
        riskLevel: 'low',
        taxBenefit: false,
        actionItem: 'Open account with any AMC (Groww, Zerodha Coin).',
        minIncomePercent: 5,
        maxIncomePercent: 15,
        suitableFor: ['Stability-Focused', 'Growth-Ready'],
        requiredReadiness: ['NOT_READY', 'CAUTION', 'READY'],
    },
    {
        id: 'ppf',
        type: 'ppf',
        name: 'Public Provident Fund (PPF)',
        riskLevel: 'low',
        taxBenefit: true,
        actionItem: 'Open PPF account at any bank or post office.',
        minIncomePercent: 5,
        maxIncomePercent: 15,
        suitableFor: ['Stability-Focused', 'Growth-Ready', 'Growth-Optimized'],
        requiredReadiness: ['CAUTION', 'READY'],
    },
    {
        id: 'index-sip',
        type: 'index_sip',
        name: 'Nifty 50 Index Fund SIP',
        riskLevel: 'medium',
        taxBenefit: false,
        actionItem: 'Start monthly SIP via Groww, Zerodha, or Paytm Money.',
        minIncomePercent: 5,
        maxIncomePercent: 20,
        suitableFor: ['Growth-Ready', 'Growth-Optimized'],
        requiredReadiness: ['CAUTION', 'READY'],
    },
    {
        id: 'elss',
        type: 'elss',
        name: 'ELSS Tax Saver Fund',
        riskLevel: 'medium',
        taxBenefit: true,
        actionItem: 'Start SIP in Mirae Asset Tax Saver or similar.',
        minIncomePercent: 5,
        maxIncomePercent: 15,
        suitableFor: ['Growth-Ready', 'Growth-Optimized'],
        requiredReadiness: ['READY'],
    },
    {
        id: 'stocks',
        type: 'stocks',
        name: 'Direct Equity (Stocks)',
        riskLevel: 'high',
        taxBenefit: false,
        actionItem: 'Open Demat account. Start with large-cap stocks or ETFs.',
        minIncomePercent: 5,
        maxIncomePercent: 15,
        suitableFor: ['Growth-Optimized'],
        requiredReadiness: ['READY'],
    },
];

// =============================================================================
// RECOMMENDATION LOGIC
// =============================================================================

/**
 * Get applicable instruments based on readiness and risk profile
 */
function getApplicableInstruments(
    readiness: ReadinessStatus,
    riskProfile: RiskProfileTier
): InstrumentInfo[] {
    return INSTRUMENTS.filter(inst =>
        inst.requiredReadiness.includes(readiness) &&
        inst.suitableFor.includes(riskProfile)
    );
}

/**
 * Prioritize instruments based on user's financial situation
 */
function prioritizeInstruments(
    instruments: InstrumentInfo[],
    readiness: ReadinessStatus,
    riskProfile: RiskProfileTier,
    emergencyFundMonths: number,
    savingsRate: number,
    debtToIncomeRatio: number
): InstrumentInfo[] {
    const scored = instruments.map(inst => {
        let score = 0;

        // Emergency fund priority if low coverage
        if (inst.type === 'emergency_fund' || inst.type === 'liquid_fund') {
            if (emergencyFundMonths < 3) score += 100;
            else if (emergencyFundMonths < 6) score += 50;
        }

        // PPF priority for tax benefit if high income
        if (inst.type === 'ppf' && inst.taxBenefit) {
            score += 30;
        }

        // Index funds for growth profiles
        if (inst.type === 'index_sip') {
            if (riskProfile === 'Growth-Optimized') score += 40;
            else if (riskProfile === 'Growth-Ready') score += 30;
        }

        // ELSS for tax + equity
        if (inst.type === 'elss') {
            if (riskProfile === 'Growth-Optimized') score += 35;
            else if (riskProfile === 'Growth-Ready') score += 25;
        }

        // Stocks only for Growth-Optimized with stable finances
        if (inst.type === 'stocks') {
            if (riskProfile === 'Growth-Optimized' &&
                readiness === 'READY' &&
                debtToIncomeRatio < 20 &&
                savingsRate > 25) {
                score += 45;
            } else {
                score -= 50; // De-prioritize if not strongly Growth-Optimized
            }
        }

        // Penalize high-risk instruments for NOT_READY or CAUTION
        if (readiness !== 'READY' && inst.riskLevel === 'high') {
            score -= 100;
        }

        return { instrument: inst, score };
    });

    return scored
        .sort((a, b) => b.score - a.score)
        .map(s => s.instrument);
}

/**
 * Calculate allocation based on financial situation
 */
function calculateAllocation(
    instrument: InstrumentInfo,
    readiness: ReadinessStatus,
    riskProfile: RiskProfileTier,
    savingsRate: number,
    emergencyFundMonths: number
): [number, number] {
    let minAlloc = instrument.minIncomePercent;
    let maxAlloc = instrument.maxIncomePercent;

    // Adjust based on readiness
    if (readiness === 'NOT_READY') {
        // Focus on safety - max out emergency fund
        if (instrument.type === 'emergency_fund') {
            return [15, 20];
        }
        return [minAlloc, Math.min(maxAlloc, 10)];
    }

    if (readiness === 'CAUTION') {
        // Conservative allocations
        maxAlloc = Math.min(maxAlloc, 10);
    }

    // Adjust based on risk profile
    if (riskProfile === 'Stability-Focused') {
        maxAlloc = Math.min(maxAlloc, 10);
    } else if (riskProfile === 'Growth-Optimized') {
        // Can allocate more to growth instruments
        if (instrument.riskLevel === 'medium' || instrument.riskLevel === 'high') {
            minAlloc = Math.max(minAlloc, 10);
        }
    }

    // Adjust based on savings rate - higher savings = can allocate more
    if (savingsRate > 30 && readiness === 'READY') {
        maxAlloc = Math.min(maxAlloc + 5, 25);
    } else if (savingsRate < 15) {
        maxAlloc = Math.min(maxAlloc, 10);
    }

    // If emergency fund is low, reduce other allocations
    if (emergencyFundMonths < 3 && instrument.type !== 'emergency_fund' && instrument.type !== 'liquid_fund') {
        maxAlloc = Math.min(maxAlloc, 5);
    }

    return [minAlloc, maxAlloc];
}

/**
 * Generate reason for recommendation
 */
function generateReason(
    instrument: InstrumentInfo,
    riskProfile: RiskProfileTier,
    readiness: ReadinessStatus,
    emergencyFundMonths: number,
    savingsRate: number
): string {
    const reasons: string[] = [];

    // Base reason by instrument
    switch (instrument.type) {
        case 'emergency_fund':
            if (emergencyFundMonths < 3) {
                reasons.push('Your emergency fund covers less than 3 months — priority #1.');
            } else {
                reasons.push('Building safety buffer before taking investment risks.');
            }
            break;

        case 'liquid_fund':
            reasons.push('Safe parking for surplus while maintaining liquidity.');
            break;

        case 'ppf':
            reasons.push('Government-backed, tax-free returns under Section 80C.');
            if (riskProfile === 'Stability-Focused') {
                reasons.push('Matches your conservative risk profile.');
            }
            break;

        case 'index_sip':
            reasons.push('Low-cost exposure to top 50 Indian companies.');
            if (riskProfile === 'Growth-Ready' || riskProfile === 'Growth-Optimized') {
                reasons.push(`Your ${riskProfile} profile supports equity exposure.`);
            }
            break;

        case 'elss':
            reasons.push('Tax saving under 80C with equity upside.');
            reasons.push('3-year lock-in builds investment discipline.');
            break;

        case 'stocks':
            reasons.push('Direct equity for wealth creation.');
            if (savingsRate > 25) {
                reasons.push(`Your ${savingsRate.toFixed(0)}% savings rate gives buffer for volatility.`);
            }
            break;
    }

    return reasons.join(' ');
}

/**
 * Generate summary explanation
 */
function generateSummary(
    recommendations: Recommendation[],
    readiness: ReadinessStatus,
    riskProfile: RiskProfileTier,
    emergencyFundMonths: number
): string {
    if (recommendations.length === 0) {
        return 'Unable to generate recommendations due to insufficient data.';
    }

    const parts: string[] = [];

    // Readiness context
    if (readiness === 'NOT_READY') {
        parts.push('Right now, focus on building your financial foundation.');
        parts.push(`With only ${emergencyFundMonths.toFixed(1)} months of emergency coverage, safety comes first.`);
    } else if (readiness === 'CAUTION') {
        parts.push('You can start investing, but keep it conservative.');
        parts.push('Address blockers while building wealth slowly.');
    } else {
        parts.push(`Your ${riskProfile} profile and stable finances enable smart investing.`);
    }

    // Recommendation context
    const types = recommendations.map(r => r.name).join(' and ');
    parts.push(`We recommend ${types} based on your behavior.`);

    return parts.join(' ');
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Generate investment recommendations
 */
export async function generateRecommendations(userId: string): Promise<RecommendationResult> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Get all required data
    const snapshot = await getLedgerSnapshot(userId);
    const readinessResult = await evaluateInvestmentReadiness(userObjectId, snapshot);
    const riskProfileResult = await getUserRiskProfile(userId);

    const { dashboard, riskIndicators } = snapshot;
    const readiness = readinessResult.status;
    const riskProfile = riskProfileResult.profile;

    const monthlyIncome = dashboard.totalIncome / 6; // Average monthly (6 months data)
    const monthlySurplus = dashboard.netBalance / 6;
    const savingsRate = riskIndicators.savingsRate;
    const emergencyFundMonths = riskIndicators.emergencyFundCoverage;
    const debtToIncomeRatio = riskIndicators.debtToIncomeRatio;

    // 2. Get applicable instruments
    let instruments = getApplicableInstruments(readiness, riskProfile);

    // 3. Prioritize based on user's situation
    instruments = prioritizeInstruments(
        instruments,
        readiness,
        riskProfile,
        emergencyFundMonths,
        savingsRate,
        debtToIncomeRatio
    );

    // 4. Pick top 2 instruments
    const topInstruments = instruments.slice(0, 2);

    // 5. Generate recommendations
    const recommendations: Recommendation[] = topInstruments.map((inst, idx) => {
        const [minAlloc, maxAlloc] = calculateAllocation(
            inst,
            readiness,
            riskProfile,
            savingsRate,
            emergencyFundMonths
        );

        const avgAlloc = (minAlloc + maxAlloc) / 2;
        const monthlyAmount = Math.round((monthlyIncome * avgAlloc) / 100 / 100) * 100; // Round to 100

        return {
            id: inst.id,
            type: inst.type,
            name: inst.name,
            allocation: `${minAlloc}-${maxAlloc}%`,
            allocationRange: [minAlloc, maxAlloc] as [number, number],
            monthlyAmount: Math.max(500, monthlyAmount), // Min ₹500
            reason: generateReason(inst, riskProfile, readiness, emergencyFundMonths, savingsRate),
            actionItem: inst.actionItem,
            priority: (idx + 1) as 1 | 2,
            riskLevel: inst.riskLevel,
            taxBenefit: inst.taxBenefit,
        };
    });

    // 6. Calculate totals
    const totalMinAlloc = recommendations.reduce((sum, r) => sum + r.allocationRange[0], 0);
    const totalMaxAlloc = recommendations.reduce((sum, r) => sum + r.allocationRange[1], 0);
    const totalMonthlyAmount = recommendations.reduce((sum, r) => sum + r.monthlyAmount, 0);

    // 7. Generate summary
    const summary = generateSummary(recommendations, readiness, riskProfile, emergencyFundMonths);

    // 8. Calculate confidence
    let confidence = riskProfileResult.confidence;
    if (recommendations.length < 2) confidence -= 10;
    if (monthlyIncome === 0) confidence -= 30;
    confidence = Math.max(0, Math.min(100, confidence));

    return {
        recommendations,
        summary,
        totalAllocation: `${totalMinAlloc}-${totalMaxAlloc}% of income`,
        totalMonthlyAmount,
        readinessStatus: readiness,
        riskProfile,
        confidence,
        context: {
            monthlyIncome: Math.round(monthlyIncome),
            monthlySurplus: Math.round(monthlySurplus),
            savingsRate: Math.round(savingsRate * 10) / 10,
            emergencyFundMonths: Math.round(emergencyFundMonths * 10) / 10,
            debtToIncomeRatio: Math.round(debtToIncomeRatio * 10) / 10,
        },
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const recommendationEngineService = {
    generateRecommendations,
    getApplicableInstruments,
    prioritizeInstruments,
};

export default recommendationEngineService;
