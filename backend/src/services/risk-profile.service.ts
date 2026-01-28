/**
 * @file risk-profile.service.ts
 * @description Risk Profile Classification Layer.
 * 
 * Classifies users into behavioral risk profiles based purely on their
 * financial patterns — NOT preferences.
 * 
 * Answers: "How much financial risk can this user safely handle right now?"
 * 
 * Classification Tiers:
 * - Stability-Focused: Conservative, needs financial buffer
 * - Growth-Ready: Can handle moderate risk
 * - Growth-Optimized: Strong foundation, can be aggressive
 * 
 * @architecture
 * Uses signals from LedgerSnapshot (not new calculations).
 * All rules are deterministic — no ML, no guesses.
 */

import { Types } from 'mongoose';
import InvestmentHolding from '../models/investment.model';
import { getLedgerSnapshot, LedgerSnapshot, MonthlyTrend } from './ledger.service';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type RiskProfileTier = 'Stability-Focused' | 'Growth-Ready' | 'Growth-Optimized';
export type SignalLevel = 'high' | 'moderate' | 'low';
export type StabilityLevel = 'stable' | 'moderate' | 'volatile';
export type ConsistencyLevel = 'consistent' | 'moderate' | 'sporadic';
export type VolatilityLevel = 'controlled' | 'moderate' | 'volatile';

export interface SignalScore {
    value: number;      // Raw computed value (e.g., CV percentage, ratio)
    level: string;      // Categorical level
    description: string; // Human-readable explanation
}

export interface RiskProfileSignals {
    incomeStability: SignalScore & { level: StabilityLevel };
    investmentConsistency: SignalScore & { level: ConsistencyLevel };
    spendingVolatility: SignalScore & { level: VolatilityLevel };
    savingsRate: SignalScore & { level: SignalLevel };
    // Additional signals for comprehensive coverage
    debtBurden: SignalScore & { level: SignalLevel };
    emergencyFundCoverage: SignalScore & { level: SignalLevel };
    budgetAdherence: SignalScore & { level: SignalLevel };
    goalDiscipline: SignalScore & { level: SignalLevel };
}

export interface RiskProfileResult {
    profile: RiskProfileTier;
    confidence: number; // 0-100 based on data completeness
    signals: RiskProfileSignals;
    reasoning: string[];
    recommendations: string[];
    dataQuality: {
        monthsOfData: number;
        hasInvestments: boolean;
        hasLoans: boolean;
        hasGoals: boolean;
        hasBudgets: boolean;
    };
}

// =============================================================================
// THRESHOLDS (Configurable for target audience)
// =============================================================================

const THRESHOLDS = {
    // Income Stability (Coefficient of Variation thresholds)
    INCOME_CV_STABLE: 15,        // < 15% = stable
    INCOME_CV_MODERATE: 30,      // 15-30% = moderate, > 30% = volatile

    // Spending Volatility (CV thresholds)
    SPENDING_CV_CONTROLLED: 20,  // < 20% = controlled
    SPENDING_CV_MODERATE: 35,    // 20-35% = moderate, > 35% = volatile

    // Investment Consistency (SIP ratio thresholds)
    INVESTMENT_SIP_CONSISTENT: 60,  // > 60% SIP = consistent
    INVESTMENT_SIP_MODERATE: 30,    // 30-60% = moderate, < 30% = sporadic

    // Savings Rate thresholds
    SAVINGS_RATE_HIGH: 25,       // > 25% = high
    SAVINGS_RATE_MODERATE: 10,   // 10-25% = moderate, < 10% = low

    // Debt-to-Income thresholds
    DEBT_RATIO_LOW: 20,          // < 20% = low (good)
    DEBT_RATIO_MODERATE: 40,     // 20-40% = moderate, > 40% = high (risky)

    // Emergency Fund (months of expenses)
    EMERGENCY_FUND_HIGH: 6,      // > 6 months = high
    EMERGENCY_FUND_MODERATE: 3,  // 3-6 months = moderate, < 3 = low

    // Budget Adherence
    BUDGET_ADHERENCE_HIGH: 80,   // > 80% = high
    BUDGET_ADHERENCE_MODERATE: 50, // 50-80% = moderate, < 50% = low

    // Goal Progress
    GOAL_PROGRESS_HIGH: 50,      // > 50% on track = high discipline
    GOAL_PROGRESS_MODERATE: 20,  // 20-50% = moderate, < 20% = low

    // Minimum data for confidence
    MIN_MONTHS_FOR_CONFIDENCE: 3,
    FULL_CONFIDENCE_MONTHS: 6,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate Coefficient of Variation (CV) - measures relative variability
 * CV = (Standard Deviation / Mean) * 100
 */
function calculateCV(values: number[]): number {
    if (values.length === 0) return 0;

    const nonZeroValues = values.filter(v => v > 0);
    if (nonZeroValues.length < 2) return 0; // Need at least 2 data points

    const mean = nonZeroValues.reduce((sum, v) => sum + v, 0) / nonZeroValues.length;
    if (mean === 0) return 0;

    const variance = nonZeroValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / nonZeroValues.length;
    const stdDev = Math.sqrt(variance);

    return (stdDev / mean) * 100;
}

/**
 * Calculate trend direction (increasing, stable, decreasing)
 */
function calculateTrend(values: number[]): 'increasing' | 'stable' | 'decreasing' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
}

/**
 * Count months with actual data (non-zero values)
 */
function countActiveMonths(trends: MonthlyTrend[]): number {
    return trends.filter(t => t.income > 0 || t.expense > 0).length;
}

// =============================================================================
// SIGNAL CALCULATION FUNCTIONS
// =============================================================================

/**
 * Signal 1: Income Stability
 * Calculates how stable/predictable the user's income is
 */
function calculateIncomeStability(monthlyTrends: MonthlyTrend[]): SignalScore & { level: StabilityLevel } {
    const incomes = monthlyTrends.map(t => t.income);
    const cv = calculateCV(incomes);
    const trend = calculateTrend(incomes);

    let level: StabilityLevel;
    let description: string;

    if (cv < THRESHOLDS.INCOME_CV_STABLE) {
        level = 'stable';
        description = `Income varies by only ${cv.toFixed(1)}% — very predictable.`;
    } else if (cv < THRESHOLDS.INCOME_CV_MODERATE) {
        level = 'moderate';
        description = `Income varies by ${cv.toFixed(1)}% — some fluctuation but manageable.`;
    } else {
        level = 'volatile';
        description = `Income varies by ${cv.toFixed(1)}% — significant month-to-month changes.`;
    }

    // Adjust description for trend
    if (trend === 'increasing') {
        description += ' Income is trending upward.';
    } else if (trend === 'decreasing') {
        description += ' Income is trending downward — be cautious.';
        // Downgrade level if decreasing
        if (level === 'stable') level = 'moderate';
        else if (level === 'moderate') level = 'volatile';
    }

    return { value: Math.round(cv * 10) / 10, level, description };
}

/**
 * Signal 2: Investment Consistency
 * Measures how regularly the user invests (SIP vs lumpsum ratio)
 */
async function calculateInvestmentConsistency(
    userId: Types.ObjectId
): Promise<SignalScore & { level: ConsistencyLevel }> {
    const investments = await InvestmentHolding.find({ userId }).lean();

    if (investments.length === 0) {
        return {
            value: 0,
            level: 'sporadic',
            description: 'No investment history found. Start small to build consistency.',
        };
    }

    const sipCount = investments.filter(inv => inv.investmentMode === 'sip').length;
    const sipRatio = (sipCount / investments.length) * 100;

    // Also check for regular investment frequency
    const dates = investments.map(inv => new Date(inv.investmentDate).getTime()).sort();
    let regularityScore = 0;

    if (dates.length >= 2) {
        const gaps = [];
        for (let i = 1; i < dates.length; i++) {
            gaps.push((dates[i]! - dates[i - 1]!) / (1000 * 60 * 60 * 24)); // Days
        }
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const gapCV = calculateCV(gaps);

        // Lower CV in gaps = more regular investing
        if (gapCV < 30 && avgGap < 45) {
            regularityScore = 20; // Bonus for regularity
        }
    }

    const effectiveScore = Math.min(100, sipRatio + regularityScore);

    let level: ConsistencyLevel;
    let description: string;

    if (effectiveScore >= THRESHOLDS.INVESTMENT_SIP_CONSISTENT) {
        level = 'consistent';
        description = `${sipRatio.toFixed(0)}% of investments are SIPs — excellent discipline.`;
    } else if (effectiveScore >= THRESHOLDS.INVESTMENT_SIP_MODERATE) {
        level = 'moderate';
        description = `${sipRatio.toFixed(0)}% SIP ratio — consider automating more investments.`;
    } else {
        level = 'sporadic';
        description = `Only ${sipRatio.toFixed(0)}% SIPs — investing is irregular.`;
    }

    return { value: Math.round(effectiveScore * 10) / 10, level, description };
}

/**
 * Signal 3: Spending Volatility
 * Measures how predictable the user's expenses are
 */
function calculateSpendingVolatility(monthlyTrends: MonthlyTrend[]): SignalScore & { level: VolatilityLevel } {
    const expenses = monthlyTrends.map(t => t.expense);
    const cv = calculateCV(expenses);
    const trend = calculateTrend(expenses);

    let level: VolatilityLevel;
    let description: string;

    if (cv < THRESHOLDS.SPENDING_CV_CONTROLLED) {
        level = 'controlled';
        description = `Spending varies by only ${cv.toFixed(1)}% — very disciplined.`;
    } else if (cv < THRESHOLDS.SPENDING_CV_MODERATE) {
        level = 'moderate';
        description = `Spending varies by ${cv.toFixed(1)}% — some fluctuation.`;
    } else {
        level = 'volatile';
        description = `Spending varies by ${cv.toFixed(1)}% — unpredictable expenses.`;
    }

    if (trend === 'increasing' && level !== 'volatile') {
        description += ' Expenses are trending up — watch for lifestyle creep.';
    }

    return { value: Math.round(cv * 10) / 10, level, description };
}

/**
 * Signal 4: Savings Rate
 * Uses pre-computed value from riskIndicators
 */
function calculateSavingsRateSignal(savingsRate: number): SignalScore & { level: SignalLevel } {
    let level: SignalLevel;
    let description: string;

    if (savingsRate >= THRESHOLDS.SAVINGS_RATE_HIGH) {
        level = 'high';
        description = `Saving ${savingsRate.toFixed(1)}% of income — strong buffer.`;
    } else if (savingsRate >= THRESHOLDS.SAVINGS_RATE_MODERATE) {
        level = 'moderate';
        description = `Saving ${savingsRate.toFixed(1)}% — decent but aim higher.`;
    } else {
        level = 'low';
        description = `Only saving ${savingsRate.toFixed(1)}% — limited shock absorption.`;
    }

    return { value: Math.round(savingsRate * 10) / 10, level, description };
}

/**
 * Signal 5: Debt Burden
 * Higher debt = lower risk tolerance
 */
function calculateDebtBurden(debtToIncomeRatio: number): SignalScore & { level: SignalLevel } {
    let level: SignalLevel;
    let description: string;

    if (debtToIncomeRatio <= THRESHOLDS.DEBT_RATIO_LOW) {
        level = 'low';
        description = debtToIncomeRatio === 0
            ? 'No debt obligations — full flexibility.'
            : `EMI at ${debtToIncomeRatio.toFixed(1)}% of income — well managed.`;
    } else if (debtToIncomeRatio <= THRESHOLDS.DEBT_RATIO_MODERATE) {
        level = 'moderate';
        description = `EMI at ${debtToIncomeRatio.toFixed(1)}% — manageable but limits flexibility.`;
    } else {
        level = 'high';
        description = `EMI at ${debtToIncomeRatio.toFixed(1)}% — heavy debt reduces risk capacity.`;
    }

    return { value: Math.round(debtToIncomeRatio * 10) / 10, level, description };
}

/**
 * Signal 6: Emergency Fund Coverage
 */
function calculateEmergencyFundSignal(months: number): SignalScore & { level: SignalLevel } {
    let level: SignalLevel;
    let description: string;

    if (months >= THRESHOLDS.EMERGENCY_FUND_HIGH) {
        level = 'high';
        description = `${months.toFixed(1)} months of expenses covered — excellent safety net.`;
    } else if (months >= THRESHOLDS.EMERGENCY_FUND_MODERATE) {
        level = 'moderate';
        description = `${months.toFixed(1)} months covered — adequate but build more.`;
    } else {
        level = 'low';
        description = `Only ${months.toFixed(1)} months covered — priority: build emergency fund.`;
    }

    return { value: Math.round(months * 10) / 10, level, description };
}

/**
 * Signal 7: Budget Adherence
 */
function calculateBudgetSignal(adherence: number): SignalScore & { level: SignalLevel } {
    let level: SignalLevel;
    let description: string;

    if (adherence >= THRESHOLDS.BUDGET_ADHERENCE_HIGH) {
        level = 'high';
        description = `${adherence.toFixed(0)}% budget adherence — excellent discipline.`;
    } else if (adherence >= THRESHOLDS.BUDGET_ADHERENCE_MODERATE) {
        level = 'moderate';
        description = `${adherence.toFixed(0)}% adherence — room for improvement.`;
    } else {
        level = 'low';
        description = `Only ${adherence.toFixed(0)}% budget adherence — spending often exceeds plans.`;
    }

    return { value: Math.round(adherence * 10) / 10, level, description };
}

/**
 * Signal 8: Goal Discipline
 */
function calculateGoalSignal(progress: number, activeGoals: number): SignalScore & { level: SignalLevel } {
    if (activeGoals === 0) {
        return {
            value: 0,
            level: 'low',
            description: 'No financial goals set — consider setting targets.',
        };
    }

    let level: SignalLevel;
    let description: string;

    if (progress >= THRESHOLDS.GOAL_PROGRESS_HIGH) {
        level = 'high';
        description = `${progress.toFixed(0)}% progress on ${activeGoals} goals — disciplined saver.`;
    } else if (progress >= THRESHOLDS.GOAL_PROGRESS_MODERATE) {
        level = 'moderate';
        description = `${progress.toFixed(0)}% progress — steady but could accelerate.`;
    } else {
        level = 'low';
        description = `Only ${progress.toFixed(0)}% goal progress — goals may be too ambitious.`;
    }

    return { value: Math.round(progress * 10) / 10, level, description };
}

// =============================================================================
// CLASSIFICATION LOGIC (DETERMINISTIC)
// =============================================================================

/**
 * Core classification function
 * Returns the risk profile tier based on all signals
 */
function classifyProfile(signals: RiskProfileSignals): {
    profile: RiskProfileTier;
    reasoning: string[];
    recommendations: string[];
} {
    const reasoning: string[] = [];
    const recommendations: string[] = [];

    // Count negative factors (push toward Stability-Focused)
    let stabilityFactors = 0;
    // Count positive factors (push toward Growth-Optimized)
    let growthFactors = 0;

    // === CRITICAL BLOCKERS (any one = Stability-Focused) ===

    // Volatile income
    if (signals.incomeStability.level === 'volatile') {
        stabilityFactors += 3;
        reasoning.push('Volatile income requires conservative approach.');
        recommendations.push('Build 6+ months emergency fund before taking investment risks.');
    }

    // High debt burden
    if (signals.debtBurden.level === 'high') {
        stabilityFactors += 3;
        reasoning.push('High EMI burden limits risk-taking capacity.');
        recommendations.push('Focus on debt reduction before aggressive investing.');
    }

    // Low savings rate
    if (signals.savingsRate.level === 'low') {
        stabilityFactors += 2;
        reasoning.push('Low savings rate leaves little buffer for market volatility.');
        recommendations.push('Increase savings rate to at least 15% before taking risks.');
    }

    // Volatile spending
    if (signals.spendingVolatility.level === 'volatile') {
        stabilityFactors += 2;
        reasoning.push('Unpredictable expenses make planning difficult.');
        recommendations.push('Track and stabilize spending before committing to investments.');
    }

    // Low emergency fund
    if (signals.emergencyFundCoverage.level === 'low') {
        stabilityFactors += 2;
        reasoning.push('Insufficient emergency fund — market dips could force selling.');
        recommendations.push('Build emergency fund to 3+ months before equity exposure.');
    }

    // === POSITIVE FACTORS (push toward Growth-Optimized) ===

    // Stable income
    if (signals.incomeStability.level === 'stable') {
        growthFactors += 2;
        reasoning.push('Stable income provides reliable investment capacity.');
    }

    // High savings rate
    if (signals.savingsRate.level === 'high') {
        growthFactors += 2;
        reasoning.push('High savings rate means strong buffer exists.');
    }

    // Consistent investing
    if (signals.investmentConsistency.level === 'consistent') {
        growthFactors += 2;
        reasoning.push('Regular SIP habit shows investment discipline.');
    }

    // Controlled spending
    if (signals.spendingVolatility.level === 'controlled') {
        growthFactors += 1;
        reasoning.push('Disciplined spending behavior noted.');
    }

    // Good emergency fund
    if (signals.emergencyFundCoverage.level === 'high') {
        growthFactors += 1;
        reasoning.push('Strong emergency fund provides safety net.');
    }

    // Good budget adherence
    if (signals.budgetAdherence.level === 'high') {
        growthFactors += 1;
        reasoning.push('Excellent budget adherence shows financial discipline.');
    }

    // Low debt
    if (signals.debtBurden.level === 'low') {
        growthFactors += 1;
    }

    // === CLASSIFICATION DECISION ===

    let profile: RiskProfileTier;

    // Any critical blocker with stabilityFactors >= 3 → Stability-Focused
    if (stabilityFactors >= 3) {
        profile = 'Stability-Focused';
        recommendations.push('Suitable investments: PPF, FD, Liquid Funds, Debt Funds.');
    }
    // Strong positive signals → Growth-Optimized
    else if (growthFactors >= 5 && stabilityFactors < 2) {
        profile = 'Growth-Optimized';
        reasoning.push('Strong financial foundation enables aggressive growth strategy.');
        recommendations.push('Suitable investments: Flexi-Cap Funds, Mid-Cap Funds, Direct Equity.');
    }
    // Default → Growth-Ready
    else {
        profile = 'Growth-Ready';
        if (stabilityFactors > 0) {
            recommendations.push('Address minor concerns while investing moderately.');
        }
        recommendations.push('Suitable investments: Index Funds, ELSS, Large-Cap Funds, NPS.');
    }

    return { profile, reasoning, recommendations };
}

// =============================================================================
// DATA QUALITY ASSESSMENT
// =============================================================================

function assessDataQuality(snapshot: LedgerSnapshot): {
    confidence: number;
    dataQuality: RiskProfileResult['dataQuality'];
} {
    const monthsOfData = countActiveMonths(snapshot.dashboard.monthlyTrends);
    const hasInvestments = monthsOfData > 0; // Will be updated in main function
    const hasLoans = snapshot.loans.totalLoans > 0;
    const hasGoals = snapshot.goals.totalGoals > 0;
    const hasBudgets = snapshot.budget.budgets.length > 0;

    // Calculate confidence based on data completeness
    let confidence = 0;

    // Months of data (max 40 points)
    if (monthsOfData >= THRESHOLDS.FULL_CONFIDENCE_MONTHS) {
        confidence += 40;
    } else if (monthsOfData >= THRESHOLDS.MIN_MONTHS_FOR_CONFIDENCE) {
        confidence += (monthsOfData / THRESHOLDS.FULL_CONFIDENCE_MONTHS) * 40;
    } else {
        confidence += monthsOfData * 10;
    }

    // Data diversity (60 points total)
    if (snapshot.dashboard.totalIncome > 0) confidence += 15;
    if (snapshot.dashboard.totalExpense > 0) confidence += 15;
    if (hasBudgets) confidence += 10;
    if (hasGoals) confidence += 10;
    if (hasLoans || snapshot.riskIndicators.debtToIncomeRatio === 0) confidence += 10;

    return {
        confidence: Math.min(100, Math.round(confidence)),
        dataQuality: {
            monthsOfData,
            hasInvestments: false, // Updated later
            hasLoans,
            hasGoals,
            hasBudgets,
        },
    };
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Get the user's risk profile classification
 */
export async function getUserRiskProfile(userId: string): Promise<RiskProfileResult> {
    const userObjectId = new Types.ObjectId(userId);

    // 1. Get ledger snapshot
    const snapshot = await getLedgerSnapshot(userId);

    // 2. Calculate all signals
    const incomeStability = calculateIncomeStability(snapshot.dashboard.monthlyTrends);
    const investmentConsistency = await calculateInvestmentConsistency(userObjectId);
    const spendingVolatility = calculateSpendingVolatility(snapshot.dashboard.monthlyTrends);
    const savingsRate = calculateSavingsRateSignal(snapshot.riskIndicators.savingsRate);
    const debtBurden = calculateDebtBurden(snapshot.riskIndicators.debtToIncomeRatio);
    const emergencyFundCoverage = calculateEmergencyFundSignal(snapshot.riskIndicators.emergencyFundCoverage);
    const budgetAdherence = calculateBudgetSignal(snapshot.riskIndicators.budgetAdherence);
    const goalDiscipline = calculateGoalSignal(
        snapshot.goals.overallProgress,
        snapshot.goals.activeGoals
    );

    const signals: RiskProfileSignals = {
        incomeStability,
        investmentConsistency,
        spendingVolatility,
        savingsRate,
        debtBurden,
        emergencyFundCoverage,
        budgetAdherence,
        goalDiscipline,
    };

    // 3. Classify profile
    const { profile, reasoning, recommendations } = classifyProfile(signals);

    // 4. Assess data quality
    const { confidence, dataQuality } = assessDataQuality(snapshot);
    dataQuality.hasInvestments = investmentConsistency.value > 0;

    // 5. Add data quality warning if low confidence
    if (confidence < 50) {
        reasoning.unshift(`⚠️ Limited data (${dataQuality.monthsOfData} months) — classification may change with more history.`);
    }

    return {
        profile,
        confidence,
        signals,
        reasoning,
        recommendations,
        dataQuality,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const riskProfileService = {
    getUserRiskProfile,
    calculateIncomeStability,
    calculateSpendingVolatility,
    calculateCV,
};

export default riskProfileService;
