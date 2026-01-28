/**
 * @file investment-agent.service.ts
 * @description Investment Agent service with rule-based investment readiness logic.
 * 
 * TEMPORARY: Local rule-based logic in backend (no AI Engine call).
 * Mirrors the patterns from budget.service.ts and loan-advisor.service.ts.
 * 
 * This service handles:
 * - Investment readiness evaluation (8 rules)
 * - Personalized investment recommendations
 * - Risk assessment based on financial snapshot
 * - Beginner-friendly investment suggestions
 * 
 * @architecture
 * Uses the Ledger Snapshot from ledger.service.ts as input.
 * Returns actionable investment guidance for young professionals.
 */

import mongoose from 'mongoose';
import { getLedgerSnapshot, LedgerSnapshot, RiskIndicators } from './ledger.service';
import Loan from '../models/loan.model';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type ReadinessStatus = 'READY' | 'NOT_READY' | 'CAUTION';
export type BlockerSeverity = 'high' | 'medium' | 'low';
export type InvestmentRiskLevel = 'conservative' | 'moderate' | 'aggressive';

export interface ReadinessBlocker {
    rule: string;
    description: string;
    current: number;
    threshold: number;
    severity: BlockerSeverity;
    message: string;
}

export interface InvestmentReadinessResult {
    status: ReadinessStatus;
    score: number; // 0-100
    reasons: string[];
    blockers: ReadinessBlocker[];
    recommendations: string[];
}

export interface InvestmentSuggestion {
    id: string;
    name: string;
    type: 'equity' | 'debt' | 'hybrid' | 'tax_saving';
    riskLevel: InvestmentRiskLevel;
    expectedReturns: string; // e.g., "10-12% p.a."
    minAmount: number;
    lockInPeriod: string | null;
    taxBenefit: boolean;
    suitableFor: string[];
    whyRecommended: string;
    actionItem: string;
}

export interface PersonalizedInvestmentAdvice {
    readinessBlock: {
        headline: string;
        status: ReadinessStatus;
        score: number;
        summary: string;
        topBlockers: ReadinessBlocker[];
    };
    recommendationsBlock: {
        headline: string;
        suggestions: InvestmentSuggestion[];
        monthlyInvestmentCapacity: number;
        sipRecommendation: string | null;
    };
    nextStepsBlock: {
        headline: string;
        steps: { stepNumber: number; action: string; reason: string }[];
        encouragement: string;
    };
    coachNote: string;
}

export interface InvestmentAgentResponse {
    readiness: InvestmentReadinessResult;
    suggestions: InvestmentSuggestion[];
    personalizedAdvice: PersonalizedInvestmentAdvice;
    financialSnapshot: {
        monthlyIncome: number;
        monthlyExpense: number;
        monthlySurplus: number;
        savingsRate: number;
        emergencyFundMonths: number;
        totalDebt: number;
        emiToIncomeRatio: number;
    };
}

// =============================================================================
// THRESHOLDS (Configurable for target audience: 18-25, ₹20K-₹50K income)
// =============================================================================

const THRESHOLDS = {
    // R1: Emergency Fund Coverage (months)
    EMERGENCY_FUND_MIN: 3,
    EMERGENCY_FUND_CAUTION: 2,

    // R2: EMI-to-Income Ratio (percentage)
    EMI_TO_INCOME_MAX: 40,
    EMI_TO_INCOME_CAUTION: 30,

    // R3: High-Interest Debt (APR percentage)
    HIGH_INTEREST_THRESHOLD: 15,

    // R4: Savings Rate (percentage)
    SAVINGS_RATE_MIN: 10,
    SAVINGS_RATE_TARGET: 20,

    // R5: Budget Adherence (percentage)
    BUDGET_ADHERENCE_MIN: 50,
    BUDGET_ADHERENCE_TARGET: 70,

    // R8: Goal Progress (percentage)
    GOAL_PROGRESS_MIN: 10,

    // Scoring thresholds
    SCORE_READY: 70,
    SCORE_CAUTION: 40,
};

const PENALTIES = {
    NO_EMERGENCY_FUND: 30,
    LOW_EMERGENCY_FUND: 15,
    HIGH_EMI_RATIO: 25,
    MODERATE_EMI_RATIO: 10,
    HIGH_INTEREST_DEBT: 20,
    POOR_SAVINGS_RATE: 10,
    LOW_SAVINGS_RATE: 5,
    POOR_BUDGET_ADHERENCE: 10,
    LOW_BUDGET_ADHERENCE: 5,
    NEGATIVE_BALANCE: 30,
    NO_INCOME: 50,
    STALLED_GOALS: 5,
};

// =============================================================================
// RULE EVALUATION FUNCTIONS
// =============================================================================

function evaluateEmergencyFund(coverage: number): {
    penalty: number;
    blocker: ReadinessBlocker | null;
    recommendation: string | null;
} {
    if (coverage < THRESHOLDS.EMERGENCY_FUND_CAUTION) {
        return {
            penalty: PENALTIES.NO_EMERGENCY_FUND,
            blocker: {
                rule: 'R1',
                description: 'Emergency Fund Coverage',
                current: Math.round(coverage * 10) / 10,
                threshold: THRESHOLDS.EMERGENCY_FUND_MIN,
                severity: 'high',
                message: `Only ${coverage.toFixed(1)} months of expenses saved. Build to 3+ months first.`,
            },
            recommendation: 'Build emergency fund to cover 3 months of expenses before investing.',
        };
    } else if (coverage < THRESHOLDS.EMERGENCY_FUND_MIN) {
        return {
            penalty: PENALTIES.LOW_EMERGENCY_FUND,
            blocker: {
                rule: 'R1',
                description: 'Emergency Fund Coverage',
                current: Math.round(coverage * 10) / 10,
                threshold: THRESHOLDS.EMERGENCY_FUND_MIN,
                severity: 'medium',
                message: `Emergency fund covers ${coverage.toFixed(1)} months (target: 3 months).`,
            },
            recommendation: 'Continue building emergency fund while starting small investments.',
        };
    }
    return { penalty: 0, blocker: null, recommendation: null };
}

function evaluateEmiToIncome(ratio: number): {
    penalty: number;
    blocker: ReadinessBlocker | null;
    recommendation: string | null;
} {
    if (ratio > THRESHOLDS.EMI_TO_INCOME_MAX) {
        return {
            penalty: PENALTIES.HIGH_EMI_RATIO,
            blocker: {
                rule: 'R2',
                description: 'EMI-to-Income Ratio',
                current: Math.round(ratio),
                threshold: THRESHOLDS.EMI_TO_INCOME_MAX,
                severity: 'high',
                message: `EMI burden at ${ratio.toFixed(1)}% of income (max: 40%). Reduce debt first.`,
            },
            recommendation: 'Focus on reducing EMI burden before investing. Consider debt consolidation.',
        };
    } else if (ratio > THRESHOLDS.EMI_TO_INCOME_CAUTION) {
        return {
            penalty: PENALTIES.MODERATE_EMI_RATIO,
            blocker: {
                rule: 'R2',
                description: 'EMI-to-Income Ratio',
                current: Math.round(ratio),
                threshold: THRESHOLDS.EMI_TO_INCOME_MAX,
                severity: 'medium',
                message: `EMI at ${ratio.toFixed(1)}% - approaching limit. Be cautious with new debt.`,
            },
            recommendation: 'Avoid taking new loans. Prioritize paying off existing EMIs.',
        };
    }
    return { penalty: 0, blocker: null, recommendation: null };
}

async function evaluateHighInterestDebt(userId: mongoose.Types.ObjectId): Promise<{
    penalty: number;
    blocker: ReadinessBlocker | null;
    recommendation: string | null;
}> {
    const highInterestLoans = await Loan.find({
        userId,
        status: 'active',
        interestRate: { $gt: THRESHOLDS.HIGH_INTEREST_THRESHOLD },
    });

    if (highInterestLoans.length > 0) {
        const totalHighInterest = highInterestLoans.reduce((sum, l) => sum + l.outstandingAmount, 0);
        const highestRate = Math.max(...highInterestLoans.map(l => l.interestRate));

        return {
            penalty: PENALTIES.HIGH_INTEREST_DEBT,
            blocker: {
                rule: 'R3',
                description: 'High-Interest Debt',
                current: highestRate,
                threshold: THRESHOLDS.HIGH_INTEREST_THRESHOLD,
                severity: 'high',
                message: `₹${totalHighInterest.toLocaleString('en-IN')} in high-interest debt (${highestRate}% APR). Pay this first!`,
            },
            recommendation: `Clear high-interest debt (₹${totalHighInterest.toLocaleString('en-IN')}) before investing. No investment beats paying off 15%+ APR debt.`,
        };
    }
    return { penalty: 0, blocker: null, recommendation: null };
}

function evaluateSavingsRate(rate: number): {
    penalty: number;
    blocker: ReadinessBlocker | null;
    recommendation: string | null;
} {
    if (rate < THRESHOLDS.SAVINGS_RATE_MIN) {
        return {
            penalty: PENALTIES.POOR_SAVINGS_RATE,
            blocker: {
                rule: 'R4',
                description: 'Savings Rate',
                current: Math.round(rate),
                threshold: THRESHOLDS.SAVINGS_RATE_MIN,
                severity: 'medium',
                message: `Savings rate at ${rate.toFixed(1)}% (target: 20%). Low investable surplus.`,
            },
            recommendation: 'Increase savings rate by reducing discretionary spending.',
        };
    } else if (rate < THRESHOLDS.SAVINGS_RATE_TARGET) {
        return {
            penalty: PENALTIES.LOW_SAVINGS_RATE,
            blocker: {
                rule: 'R4',
                description: 'Savings Rate',
                current: Math.round(rate),
                threshold: THRESHOLDS.SAVINGS_RATE_TARGET,
                severity: 'low',
                message: `Savings rate at ${rate.toFixed(1)}% - good but aim for 20%.`,
            },
            recommendation: 'You can invest, but try to increase savings rate to 20% over time.',
        };
    }
    return { penalty: 0, blocker: null, recommendation: null };
}

function evaluateBudgetAdherence(adherence: number): {
    penalty: number;
    blocker: ReadinessBlocker | null;
    recommendation: string | null;
} {
    if (adherence < THRESHOLDS.BUDGET_ADHERENCE_MIN) {
        return {
            penalty: PENALTIES.POOR_BUDGET_ADHERENCE,
            blocker: {
                rule: 'R5',
                description: 'Budget Adherence',
                current: Math.round(adherence),
                threshold: THRESHOLDS.BUDGET_ADHERENCE_MIN,
                severity: 'medium',
                message: `Only ${adherence.toFixed(0)}% of budgets met. Spending discipline needed.`,
            },
            recommendation: 'Work on staying within budgets before investing.',
        };
    } else if (adherence < THRESHOLDS.BUDGET_ADHERENCE_TARGET) {
        return {
            penalty: PENALTIES.LOW_BUDGET_ADHERENCE,
            blocker: {
                rule: 'R5',
                description: 'Budget Adherence',
                current: Math.round(adherence),
                threshold: THRESHOLDS.BUDGET_ADHERENCE_TARGET,
                severity: 'low',
                message: `Budget adherence at ${adherence.toFixed(0)}% - room for improvement.`,
            },
            recommendation: null,
        };
    }
    return { penalty: 0, blocker: null, recommendation: null };
}

function evaluateNetBalance(balance: number): {
    penalty: number;
    blocker: ReadinessBlocker | null;
    recommendation: string | null;
} {
    if (balance < 0) {
        return {
            penalty: PENALTIES.NEGATIVE_BALANCE,
            blocker: {
                rule: 'R6',
                description: 'Negative Net Balance',
                current: balance,
                threshold: 0,
                severity: 'high',
                message: `Spending exceeds income by ₹${Math.abs(balance).toLocaleString('en-IN')}. Cannot invest with deficit.`,
            },
            recommendation: "You're spending more than you earn. Cut expenses immediately.",
        };
    }
    return { penalty: 0, blocker: null, recommendation: null };
}

function evaluateIncomeData(income: number): {
    penalty: number;
    blocker: ReadinessBlocker | null;
    recommendation: string | null;
} {
    if (income === 0) {
        return {
            penalty: PENALTIES.NO_INCOME,
            blocker: {
                rule: 'R7',
                description: 'No Income Data',
                current: 0,
                threshold: 1,
                severity: 'high',
                message: 'No income recorded. Add income transactions for accurate assessment.',
            },
            recommendation: 'Add your income transactions to get personalized investment guidance.',
        };
    }
    return { penalty: 0, blocker: null, recommendation: null };
}

function evaluateGoalProgress(progress: number, activeGoals: number): {
    penalty: number;
    blocker: ReadinessBlocker | null;
    recommendation: string | null;
} {
    if (activeGoals > 0 && progress < THRESHOLDS.GOAL_PROGRESS_MIN) {
        return {
            penalty: PENALTIES.STALLED_GOALS,
            blocker: {
                rule: 'R8',
                description: 'Stalled Goal Progress',
                current: Math.round(progress),
                threshold: THRESHOLDS.GOAL_PROGRESS_MIN,
                severity: 'low',
                message: `Goal progress at ${progress.toFixed(0)}%. Consider prioritizing existing goals.`,
            },
            recommendation: 'Balance investments with contributions to your existing goals.',
        };
    }
    return { penalty: 0, blocker: null, recommendation: null };
}

// =============================================================================
// MAIN EVALUATION FUNCTION
// =============================================================================

async function evaluateInvestmentReadiness(
    userId: mongoose.Types.ObjectId,
    snapshot: LedgerSnapshot
): Promise<InvestmentReadinessResult> {
    const { dashboard, goals, riskIndicators } = snapshot;

    let totalPenalty = 0;
    const blockers: ReadinessBlocker[] = [];
    const recommendations: string[] = [];

    // R1: Emergency Fund
    const r1 = evaluateEmergencyFund(riskIndicators.emergencyFundCoverage);
    totalPenalty += r1.penalty;
    if (r1.blocker) blockers.push(r1.blocker);
    if (r1.recommendation) recommendations.push(r1.recommendation);

    // R2: EMI-to-Income Ratio
    const r2 = evaluateEmiToIncome(riskIndicators.debtToIncomeRatio);
    totalPenalty += r2.penalty;
    if (r2.blocker) blockers.push(r2.blocker);
    if (r2.recommendation) recommendations.push(r2.recommendation);

    // R3: High-Interest Debt
    const r3 = await evaluateHighInterestDebt(userId);
    totalPenalty += r3.penalty;
    if (r3.blocker) blockers.push(r3.blocker);
    if (r3.recommendation) recommendations.push(r3.recommendation);

    // R4: Savings Rate
    const r4 = evaluateSavingsRate(riskIndicators.savingsRate);
    totalPenalty += r4.penalty;
    if (r4.blocker) blockers.push(r4.blocker);
    if (r4.recommendation) recommendations.push(r4.recommendation);

    // R5: Budget Adherence
    const r5 = evaluateBudgetAdherence(riskIndicators.budgetAdherence);
    totalPenalty += r5.penalty;
    if (r5.blocker) blockers.push(r5.blocker);
    if (r5.recommendation) recommendations.push(r5.recommendation);

    // R6: Negative Balance
    const r6 = evaluateNetBalance(dashboard.netBalance);
    totalPenalty += r6.penalty;
    if (r6.blocker) blockers.push(r6.blocker);
    if (r6.recommendation) recommendations.push(r6.recommendation);

    // R7: Income Data
    const r7 = evaluateIncomeData(dashboard.totalIncome);
    totalPenalty += r7.penalty;
    if (r7.blocker) blockers.push(r7.blocker);
    if (r7.recommendation) recommendations.push(r7.recommendation);

    // R8: Goal Progress
    const r8 = evaluateGoalProgress(goals.overallProgress, goals.activeGoals);
    totalPenalty += r8.penalty;
    if (r8.blocker) blockers.push(r8.blocker);
    if (r8.recommendation) recommendations.push(r8.recommendation);

    // Calculate final score
    const score = Math.max(0, 100 - totalPenalty);

    // Determine status
    const highSeverityBlockers = blockers.filter(b => b.severity === 'high');
    let status: ReadinessStatus;

    if (highSeverityBlockers.length > 0 || score < THRESHOLDS.SCORE_CAUTION) {
        status = 'NOT_READY';
    } else if (score < THRESHOLDS.SCORE_READY) {
        status = 'CAUTION';
    } else {
        status = 'READY';
    }

    // Build reasons
    const reasons = blockers
        .filter(b => b.severity === 'high' || b.severity === 'medium')
        .map(b => b.message);

    if (status === 'READY') {
        reasons.push("Your finances are in good shape - you're ready to invest!");
        recommendations.push('Consider starting with low-risk options like PPF, index funds, or SIPs.');
    }

    return {
        status,
        score,
        reasons,
        blockers,
        recommendations: [...new Set(recommendations)], // Deduplicate
    };
}

// =============================================================================
// INVESTMENT SUGGESTIONS (Beginner-friendly for India)
// =============================================================================

function getInvestmentSuggestions(
    status: ReadinessStatus,
    monthlySurplus: number,
    riskLevel: RiskIndicators['riskLevel']
): InvestmentSuggestion[] {
    const suggestions: InvestmentSuggestion[] = [];

    if (status === 'NOT_READY') {
        // Only suggest safe/liquid options
        suggestions.push({
            id: 'liquid-fund',
            name: 'Liquid Mutual Fund',
            type: 'debt',
            riskLevel: 'conservative',
            expectedReturns: '5-6% p.a.',
            minAmount: 500,
            lockInPeriod: null,
            taxBenefit: false,
            suitableFor: ['Emergency fund building', 'Short-term parking'],
            whyRecommended: 'Safe place to park money while you fix financial fundamentals.',
            actionItem: 'Open account with any AMC (Groww, Zerodha Coin, Paytm Money).',
        });
        return suggestions;
    }

    // CAUTION or READY - progressive suggestions

    // 1. PPF (Tax-saving, guaranteed returns)
    if (monthlySurplus >= 500) {
        suggestions.push({
            id: 'ppf',
            name: 'Public Provident Fund (PPF)',
            type: 'debt',
            riskLevel: 'conservative',
            expectedReturns: '7.1% p.a. (tax-free)',
            minAmount: 500,
            lockInPeriod: '15 years',
            taxBenefit: true,
            suitableFor: ['Long-term wealth', 'Tax saving (80C)', 'Retirement'],
            whyRecommended: 'Government-backed, tax-free returns. Best for long-term compounding.',
            actionItem: 'Open PPF account at any bank or post office.',
        });
    }

    // 2. ELSS (Tax-saving + equity exposure)
    if (monthlySurplus >= 1000 && riskLevel !== 'low') {
        suggestions.push({
            id: 'elss',
            name: 'ELSS Mutual Fund (Tax Saver)',
            type: 'equity',
            riskLevel: 'moderate',
            expectedReturns: '10-12% p.a. (historical)',
            minAmount: 500,
            lockInPeriod: '3 years',
            taxBenefit: true,
            suitableFor: ['Tax saving', 'Wealth building', 'First equity investment'],
            whyRecommended: 'Shortest lock-in among 80C options with equity growth potential.',
            actionItem: 'Start SIP of ₹500-1000 in Mirae Asset Tax Saver or similar.',
        });
    }

    // 3. Index Fund SIP
    if (monthlySurplus >= 1000) {
        suggestions.push({
            id: 'index-sip',
            name: 'Nifty 50 Index Fund SIP',
            type: 'equity',
            riskLevel: 'moderate',
            expectedReturns: '10-12% p.a. (historical)',
            minAmount: 500,
            lockInPeriod: null,
            taxBenefit: false,
            suitableFor: ['Beginners', 'Long-term wealth', 'Low-cost investing'],
            whyRecommended: 'Simple, low-cost way to invest in top 50 Indian companies.',
            actionItem: 'Start monthly SIP of ₹1000 in UTI Nifty 50 Index Fund.',
        });
    }

    // 4. NPS (For retirement-focused)
    if (monthlySurplus >= 2000) {
        suggestions.push({
            id: 'nps',
            name: 'National Pension System (NPS)',
            type: 'hybrid',
            riskLevel: 'moderate',
            expectedReturns: '9-11% p.a.',
            minAmount: 1000,
            lockInPeriod: 'Until 60',
            taxBenefit: true,
            suitableFor: ['Retirement planning', 'Extra tax saving (80CCD)'],
            whyRecommended: 'Additional ₹50K tax deduction under 80CCD(1B) beyond 80C.',
            actionItem: 'Open NPS account online via NSDL or eNPS portal.',
        });
    }

    // 5. High-surplus aggressive option
    if (monthlySurplus >= 5000 && status === 'READY' && riskLevel !== 'low') {
        suggestions.push({
            id: 'flexi-cap',
            name: 'Flexi Cap Mutual Fund',
            type: 'equity',
            riskLevel: 'aggressive',
            expectedReturns: '12-15% p.a. (historical)',
            minAmount: 1000,
            lockInPeriod: null,
            taxBenefit: false,
            suitableFor: ['Wealth creation', '5+ year horizon'],
            whyRecommended: 'Higher return potential for those with stable finances.',
            actionItem: 'Start SIP in Parag Parikh Flexi Cap or similar diversified fund.',
        });
    }

    return suggestions;
}

// =============================================================================
// PERSONALIZED ADVICE GENERATOR
// =============================================================================

function generatePersonalizedAdvice(
    readiness: InvestmentReadinessResult,
    suggestions: InvestmentSuggestion[],
    monthlySurplus: number
): PersonalizedInvestmentAdvice {
    const { status, score, blockers } = readiness;

    // Readiness Block
    let summary = '';
    if (status === 'READY') {
        summary = "Great news! Your financial foundation is solid. You're ready to start building wealth through investments.";
    } else if (status === 'CAUTION') {
        summary = "You can start investing with caution, but there are a few areas to improve first.";
    } else {
        summary = "Before investing, focus on fixing your financial fundamentals. Don't worry - we'll guide you step by step.";
    }

    const readinessBlock = {
        headline: status === 'READY' ? "You're Ready to Invest! 🎉" : status === 'CAUTION' ? "Almost Ready - Minor Fixes Needed" : "Foundation First 🏗️",
        status,
        score,
        summary,
        topBlockers: blockers.filter(b => b.severity === 'high' || b.severity === 'medium').slice(0, 3),
    };

    // Recommendations Block
    const sipAmount = Math.max(500, Math.round((monthlySurplus * 0.3) / 500) * 500); // 30% of surplus, rounded to ₹500
    const sipRecommendation = monthlySurplus >= 1000
        ? `Start with a monthly SIP of ₹${sipAmount.toLocaleString('en-IN')} - that's about 30% of your surplus.`
        : monthlySurplus > 0
            ? `Start with ₹500/month SIP - small but consistent steps build wealth.`
            : null;

    const recommendationsBlock = {
        headline: suggestions.length > 0 ? "Investment Options For You" : "Focus on These First",
        suggestions: suggestions.slice(0, 3), // Top 3 suggestions
        monthlyInvestmentCapacity: Math.max(0, Math.round(monthlySurplus * 0.3)),
        sipRecommendation,
    };

    // Next Steps Block
    const steps: { stepNumber: number; action: string; reason: string }[] = [];
    let stepNum = 1;

    if (status === 'NOT_READY') {
        // Focus on fundamentals
        const highBlockers = blockers.filter(b => b.severity === 'high');
        for (const blocker of highBlockers.slice(0, 3)) {
            steps.push({
                stepNumber: stepNum++,
                action: blocker.description,
                reason: blocker.message,
            });
        }
    } else {
        // Ready or Caution - investment steps
        steps.push({
            stepNumber: stepNum++,
            action: 'Open a Demat & Mutual Fund account',
            reason: 'Use Zerodha, Groww, or Paytm Money - takes 10 minutes.',
        });

        if (suggestions.length > 0) {
            steps.push({
                stepNumber: stepNum++,
                action: `Start SIP in ${suggestions[0]!.name}`,
                reason: suggestions[0]!.whyRecommended,
            });
        }

        steps.push({
            stepNumber: stepNum++,
            action: 'Set up auto-debit for SIPs',
            reason: 'Automation ensures you never miss an investment.',
        });
    }

    let encouragement = '';
    if (status === 'READY') {
        encouragement = "You're already ahead of 80% of young Indians. Start today and let compounding do its magic!";
    } else if (status === 'CAUTION') {
        encouragement = "You're on the right track. Fix the small issues and you'll be investment-ready soon!";
    } else {
        encouragement = "Every expert was once a beginner. Focus on these fundamentals first - investing can wait a few months.";
    }

    const nextStepsBlock = {
        headline: 'Your Next Steps',
        steps,
        encouragement,
    };

    // Coach Note
    let coachNote = '';
    if (status === 'READY' && monthlySurplus >= 5000) {
        coachNote = "You're in an excellent position! Consider diversifying across PPF, ELSS, and index funds for a balanced portfolio.";
    } else if (status === 'READY') {
        coachNote = "Start small but start now. Even ₹500/month invested consistently can grow to lakhs over time.";
    } else if (status === 'CAUTION') {
        coachNote = "You can dip your toes in with small SIPs, but prioritize fixing your blockers for stress-free investing.";
    } else {
        coachNote = "Investing with weak financials is like building on sand. Take 2-3 months to strengthen your foundation.";
    }

    return {
        readinessBlock,
        recommendationsBlock,
        nextStepsBlock,
        coachNote,
    };
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

export async function getInvestmentAdvice(userId: string): Promise<InvestmentAgentResponse> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Get complete ledger snapshot
    const snapshot = await getLedgerSnapshot(userId);

    // 2. Evaluate investment readiness (8 rules)
    const readiness = await evaluateInvestmentReadiness(userObjectId, snapshot);

    // 3. Calculate financial snapshot for response
    const { dashboard, riskIndicators, loans } = snapshot;
    const monthlySurplus = dashboard.netBalance;
    const totalDebt = loans.totalOutstanding;

    // 4. Get investment suggestions based on readiness
    const suggestions = getInvestmentSuggestions(
        readiness.status,
        monthlySurplus,
        riskIndicators.riskLevel
    );

    // 5. Generate personalized advice
    const personalizedAdvice = generatePersonalizedAdvice(readiness, suggestions, monthlySurplus);

    return {
        readiness,
        suggestions,
        personalizedAdvice,
        financialSnapshot: {
            monthlyIncome: dashboard.totalIncome,
            monthlyExpense: dashboard.totalExpense,
            monthlySurplus,
            savingsRate: riskIndicators.savingsRate,
            emergencyFundMonths: riskIndicators.emergencyFundCoverage,
            totalDebt,
            emiToIncomeRatio: riskIndicators.debtToIncomeRatio,
        },
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

// Named export for use by other services
export { evaluateInvestmentReadiness };

export const investmentAgentService = {
    getInvestmentAdvice,
    evaluateInvestmentReadiness,
    getInvestmentSuggestions,
};

export default investmentAgentService;
