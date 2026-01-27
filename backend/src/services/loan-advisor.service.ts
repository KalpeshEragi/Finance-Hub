/**
 * @file loan-advisor.service.ts
 * @description Smart loan and debt advisory service with repayment planning.
 * 
 * Analyzes user's REAL financial history and provides:
 * - Detection of idle/unused savings from transaction history
 * - Prioritized loan repayment plan (highest interest first)
 * - Month-by-month savings analysis
 * - Debt avalanche strategy with specific amounts
 */

import Transaction from '../models/transaction.model';
import Loan, { ILoan } from '../models/loan.model';
import Goal from '../models/goal.model';
import InvestmentHolding from '../models/investment.model';
import mongoose from 'mongoose';
import type { ITransaction } from '../types/transaction.types';

// =============================================================================
// TYPES
// =============================================================================

export interface MonthlySavingsData {
    month: string; // e.g., "Jan 2026"
    income: number;
    expenses: number;
    surplus: number;
    savingsTransferred: number;
    idleSavings: number; // surplus - savingsTransferred (money not used)
}

export interface LoanDetail {
    id: string;
    name: string;
    loanType: string;
    outstandingAmount: number;
    interestRate: number;
    emiAmount: number;
    monthlyInterestBurn: number; // Outstanding × (Rate/12) - actual money lost per month
    priority: number; // 1 = highest priority (pay first)
    monthsRemaining: number;
    totalInterestIfContinued: number;
    recommendedAction: string;
}

export interface RepaymentPlan {
    step: number;
    loanId: string;
    loanName: string;
    interestRate: number;
    currentOutstanding: number;
    suggestedPayment: number;
    interestSaved: number;
    newOutstanding: number;
    explanation: string;
}

export interface LoanRecommendation {
    id: string;
    type: 'loan_payoff' | 'investment' | 'savings' | 'budget' | 'emergency_fund';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    potentialSavings?: number;
    actionItems: string[];
    impact: string;
}

export interface FinancialSnapshot {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySurplus: number;
    totalDebt: number;
    monthlyEMI: number;
    totalInvestments: number;
    emergencyFundStatus: 'none' | 'partial' | 'adequate';
    emergencyFundAmount: number;
    averageSavingsRate: number;
    idleCash: number;
    consistentSavingsMonths: number; // How many months user has been saving consistently
}

// =============================================================================
// PERSONALIZED ADVICE UI BLOCKS (Human-friendly output)
// =============================================================================

export interface DebtStrategyBlock {
    headline: string;
    subheadline: string;
    steps: {
        stepNumber: number;
        loanName: string;
        interestRate: number;
        action: string;
        reason: string;
        amount?: number;
    }[];
    encouragement: string;
}

export interface ComparisonBlock {
    headline: string;
    doNothing: {
        title: string;
        totalInterestPaid: number;
        monthsToDebtFree: number;
        emotionalNote: string;
    };
    followPlan: {
        title: string;
        totalInterestPaid: number;
        monthsToDebtFree: number;
        interestSaved: number;
        monthsSaved: number;
        emotionalNote: string;
    };
    verdict: string;
}

export interface SafeMoneyBlock {
    headline: string;
    totalIdleCash: number;
    emergencyFundRequired: number;
    emergencyFundStatus: string;
    safeToUse: number;
    recommendation: string;
    warningNote?: string;
    actionButton: {
        text: string;
        amount: number;
        targetLoan?: string;
    } | null;
}

export interface PersonalizedAdvice {
    debtStrategy: DebtStrategyBlock;
    comparison: ComparisonBlock;
    safeMoney: SafeMoneyBlock;
    coachNote: string; // A warm, personal closing message
}

export interface SmartLoanAdviceResponse {
    snapshot: FinancialSnapshot;
    monthlySavingsHistory: MonthlySavingsData[];
    loans: LoanDetail[];
    repaymentPlan: RepaymentPlan[];
    recommendations: LoanRecommendation[];
    personalizedAdvice: PersonalizedAdvice; // NEW: Human-friendly UI blocks
    summary: {
        totalIdleSavings: number;
        totalPotentialInterestSaved: number;
        recommendedFirstPayoff: string | null;
        debtFreeMonthsReduction: number;
    };
}

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

async function getMonthlySavingsHistory(
    userId: mongoose.Types.ObjectId,
    months: number = 3
): Promise<MonthlySavingsData[]> {
    const now = new Date();
    const history: MonthlySavingsData[] = [];

    for (let i = 0; i < months; i++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        const transactions = await Transaction.find({
            userId,
            date: { $gte: monthStart, $lte: monthEnd },
        }) as ITransaction[];

        const income = transactions
            .filter((t: ITransaction) => t.type === 'income')
            .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

        const expenses = transactions
            .filter((t: ITransaction) => t.type === 'expense')
            .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

        // Find savings transfers (money moved to savings/investments)
        const savingsTransferred = transactions
            .filter((t: ITransaction) =>
                t.type === 'expense' &&
                (t.category.toLowerCase().includes('saving') ||
                    t.category.toLowerCase().includes('investment') ||
                    t.category.toLowerCase().includes('mutual fund') ||
                    t.category.toLowerCase().includes('fd') ||
                    t.category.toLowerCase().includes('sip'))
            )
            .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);

        const surplus = income - expenses;
        const idleSavings = Math.max(0, surplus); // Positive surplus = potential idle money

        history.push({
            month: monthStart.toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
            income,
            expenses,
            surplus,
            savingsTransferred,
            idleSavings,
        });
    }

    return history.reverse(); // Oldest first
}

async function getFinancialSnapshot(
    userId: mongoose.Types.ObjectId,
    savingsHistory: MonthlySavingsData[]
): Promise<FinancialSnapshot> {
    // Calculate averages from history
    const totalIncome = savingsHistory.reduce((sum, m) => sum + m.income, 0);
    const totalExpenses = savingsHistory.reduce((sum, m) => sum + m.expenses, 0);
    const months = savingsHistory.length || 1;

    const monthlyIncome = Math.round(totalIncome / months);
    const monthlyExpenses = Math.round(totalExpenses / months);
    const monthlySurplus = monthlyIncome - monthlyExpenses;

    // Count consistent savings months (surplus > 5000)
    const consistentSavingsMonths = savingsHistory.filter(m => m.surplus >= 5000).length;

    // Total idle cash from history
    const idleCash = savingsHistory.reduce((sum, m) => sum + m.idleSavings, 0);

    // Get active loans
    const loans = await Loan.find({ userId, status: 'active' });
    const totalDebt = loans.reduce((sum, l) => sum + l.outstandingAmount, 0);
    const monthlyEMI = loans.reduce((sum, l) => sum + l.emiAmount, 0);

    // Get investments
    const investments = await InvestmentHolding.find({ userId });
    const totalInvestments = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);

    // Check emergency fund goals
    const emergencyGoals = await Goal.find({
        userId,
        title: { $regex: /emergency/i },
        status: 'active',
    });

    let emergencyFundAmount = 0;
    let emergencyFundStatus: 'none' | 'partial' | 'adequate' = 'none';

    if (emergencyGoals.length > 0) {
        emergencyFundAmount = emergencyGoals.reduce((sum, g) => sum + g.currentAmount, 0);
        const targetEmergencyFund = monthlyExpenses * 6;

        if (emergencyFundAmount >= targetEmergencyFund) {
            emergencyFundStatus = 'adequate';
        } else if (emergencyFundAmount > 0) {
            emergencyFundStatus = 'partial';
        }
    }

    // Calculate savings rate
    const totalSavingsTransferred = savingsHistory.reduce((sum, m) => sum + m.savingsTransferred, 0);
    const averageSavingsRate = totalIncome > 0 ? (totalSavingsTransferred / totalIncome) : 0;

    return {
        monthlyIncome,
        monthlyExpenses,
        monthlySurplus,
        totalDebt,
        monthlyEMI,
        totalInvestments,
        emergencyFundStatus,
        emergencyFundAmount,
        averageSavingsRate,
        idleCash,
        consistentSavingsMonths,
    };
}

function analyzeLoansPriority(loans: ILoan[]): LoanDetail[] {
    // ==========================================================================
    // Interest-Cost Weighted Debt Avalanche
    // ==========================================================================
    // Sort by Monthly Interest Burn (highest first) - not just interest rate!
    // Monthly Interest Burn = Outstanding Amount × (Interest Rate / 12 / 100)
    // This ensures we attack the loan costing the MOST MONEY each month,
    // not just the one with highest percentage.
    // ==========================================================================
    const sorted = [...loans].sort((a, b) => {
        const burnA = a.outstandingAmount * (a.interestRate / 12 / 100);
        const burnB = b.outstandingAmount * (b.interestRate / 12 / 100);
        return burnB - burnA; // Highest burn first
    });

    return sorted.map((loan, index) => {
        const monthsRemaining = Math.ceil(loan.outstandingAmount / loan.emiAmount);
        const monthlyRate = loan.interestRate / 12 / 100;

        // Monthly Interest Burn - the actual money lost to interest each month
        const monthlyInterestBurn = Math.round(loan.outstandingAmount * monthlyRate);

        // Calculate total interest if continued normally
        let totalInterest = 0;
        let balance = loan.outstandingAmount;

        for (let m = 0; m < monthsRemaining && balance > 0; m++) {
            const interestThisMonth = balance * monthlyRate;
            totalInterest += interestThisMonth;
            balance = balance - (loan.emiAmount - interestThisMonth);
        }

        let recommendedAction = '';
        if (index === 0) {
            recommendedAction = `🔴 PRIORITY 1: This loan is costing you ₹${monthlyInterestBurn.toLocaleString('en-IN')}/month in interest`;
        } else if (index === 1) {
            recommendedAction = '🟡 PRIORITY 2: Pay after first loan is cleared';
        } else {
            recommendedAction = '🟢 Continue minimum EMI payments';
        }

        return {
            id: (loan._id as mongoose.Types.ObjectId).toString(),
            name: loan.name,
            loanType: loan.loanType,
            outstandingAmount: loan.outstandingAmount,
            interestRate: loan.interestRate,
            emiAmount: loan.emiAmount,
            monthlyInterestBurn,
            priority: index + 1,
            monthsRemaining,
            totalInterestIfContinued: Math.round(totalInterest),
            recommendedAction,
        };
    });
}

function generateRepaymentPlan(
    loans: LoanDetail[],
    availableFunds: number,
    monthlyExpenses: number
): RepaymentPlan[] {
    const plan: RepaymentPlan[] = [];

    // Keep 3 months expenses as emergency buffer
    const emergencyBuffer = monthlyExpenses * 3;
    let fundsToUse = Math.max(0, availableFunds - emergencyBuffer);

    if (fundsToUse <= 0) {
        return plan;
    }

    let step = 1;
    for (const loan of loans) {
        if (fundsToUse <= 0) break;

        const suggestedPayment = Math.min(fundsToUse, loan.outstandingAmount);

        // Calculate interest saved
        const monthlyRate = loan.interestRate / 12 / 100;
        const monthsSaved = Math.floor(suggestedPayment / loan.emiAmount);
        const interestSaved = Math.round(suggestedPayment * monthlyRate * monthsSaved * 0.5);

        const newOutstanding = loan.outstandingAmount - suggestedPayment;

        plan.push({
            step,
            loanId: loan.id,
            loanName: loan.name,
            interestRate: loan.interestRate,
            currentOutstanding: loan.outstandingAmount,
            suggestedPayment,
            interestSaved,
            newOutstanding: Math.max(0, newOutstanding),
            explanation: newOutstanding <= 0
                ? `✅ Fully pay off ${loan.name} and save ₹${interestSaved.toLocaleString('en-IN')} in interest!`
                : `💰 Pay ₹${suggestedPayment.toLocaleString('en-IN')} to reduce outstanding and save ₹${interestSaved.toLocaleString('en-IN')} in interest`,
        });

        fundsToUse -= suggestedPayment;
        step++;
    }

    return plan;
}

function generateRecommendations(
    snapshot: FinancialSnapshot,
    loans: LoanDetail[],
    savingsHistory: MonthlySavingsData[],
    repaymentPlan: RepaymentPlan[]
): LoanRecommendation[] {
    const recommendations: LoanRecommendation[] = [];

    // Check if user has consistent savings pattern
    if (snapshot.consistentSavingsMonths >= 2 && snapshot.idleCash >= 10000 && loans.length > 0) {
        const highestLoan = loans[0]!;
        const monthsWithSavings = savingsHistory.filter(m => m.idleSavings > 5000);

        recommendations.push({
            id: 'idle-savings-detected',
            type: 'loan_payoff',
            priority: 'high',
            title: '💡 You Have Unused Savings! Use Them to Clear Debt',
            description: `Over the past ${savingsHistory.length} months, you've consistently saved ₹${Math.round(snapshot.idleCash / savingsHistory.length).toLocaleString('en-IN')}/month but haven't invested this money. Total idle cash: ₹${snapshot.idleCash.toLocaleString('en-IN')}. Use this to pay off your ${highestLoan.name} (${highestLoan.interestRate}% interest) first!`,
            potentialSavings: repaymentPlan.reduce((sum, p) => sum + p.interestSaved, 0),
            actionItems: [
                `You saved consistently in ${monthsWithSavings.length} of the last ${savingsHistory.length} months`,
                `Clear ${highestLoan.name} first (highest interest at ${highestLoan.interestRate}%)`,
                ...repaymentPlan.slice(0, 2).map(p => p.explanation),
            ],
            impact: `Save ₹${repaymentPlan.reduce((sum, p) => sum + p.interestSaved, 0).toLocaleString('en-IN')} in interest and become debt-free faster!`,
        });
    }

    // Debt avalanche strategy for multiple loans
    if (loans.length > 1) {
        const sortedByRate = [...loans].sort((a, b) => b.interestRate - a.interestRate);

        recommendations.push({
            id: 'debt-avalanche',
            type: 'loan_payoff',
            priority: 'medium',
            title: '📊 Debt Avalanche Strategy - Prioritized Repayment Order',
            description: `You have ${loans.length} active loans. Here's the optimal order to pay them off:`,
            actionItems: sortedByRate.map((loan, idx) =>
                `${idx + 1}. ${loan.name} @ ${loan.interestRate}% - Outstanding: ₹${loan.outstandingAmount.toLocaleString('en-IN')}`
            ),
            impact: 'Pay highest interest loans first to minimize total interest paid',
        });
    }

    // Monthly surplus recommendation
    if (snapshot.monthlySurplus >= 5000 && loans.length > 0) {
        const extraPayment = Math.round(snapshot.monthlySurplus * 0.5);
        const topLoan = loans[0]!;

        recommendations.push({
            id: 'extra-emi',
            type: 'loan_payoff',
            priority: 'medium',
            title: `💪 Add ₹${extraPayment.toLocaleString('en-IN')}/month Extra to EMI`,
            description: `Your monthly surplus is ₹${snapshot.monthlySurplus.toLocaleString('en-IN')}. Add 50% of this as extra payment to ${topLoan.name}.`,
            actionItems: [
                `Current EMI: ₹${topLoan.emiAmount.toLocaleString('en-IN')}`,
                `New Payment: ₹${(topLoan.emiAmount + extraPayment).toLocaleString('en-IN')}`,
                `This reduces your loan tenure significantly`,
            ],
            impact: `Become debt-free faster by paying extra each month`,
        });
    }

    // Emergency fund warning
    if (snapshot.emergencyFundStatus === 'none' && snapshot.monthlySurplus > 0) {
        const targetEmergency = snapshot.monthlyExpenses * 3;
        recommendations.push({
            id: 'emergency-fund',
            type: 'emergency_fund',
            priority: 'high',
            title: '🛡️ Build Emergency Fund Before Aggressive Debt Payoff',
            description: `Keep ₹${targetEmergency.toLocaleString('en-IN')} (3 months expenses) as safety net before using all savings for loan repayment.`,
            actionItems: [
                'This prevents taking new debt in emergencies',
                'Keep in liquid fund or savings account',
            ],
            impact: 'Financial safety while paying off debt',
        });
    }

    return recommendations;
}

// =============================================================================
// PERSONALIZED ADVICE GENERATOR (Human-friendly, emotionally compelling)
// =============================================================================

function generatePersonalizedAdvice(
    snapshot: FinancialSnapshot,
    loans: LoanDetail[],
    repaymentPlan: RepaymentPlan[]
): PersonalizedAdvice {
    const emergencyFundRequired = snapshot.monthlyExpenses * 3;
    const safeToUse = Math.max(0, snapshot.idleCash - emergencyFundRequired);

    // Calculate totals for comparison
    const totalInterestIfContinue = loans.reduce((sum, l) => sum + l.totalInterestIfContinued, 0);
    const totalInterestSaved = repaymentPlan.reduce((sum, p) => sum + p.interestSaved, 0);
    const totalMonthsIfContinue = loans.length > 0
        ? Math.max(...loans.map(l => l.monthsRemaining))
        : 0;
    const monthsSaved = repaymentPlan.reduce((sum, p) =>
        sum + Math.floor(p.suggestedPayment / (loans.find(l => l.id === p.loanId)?.emiAmount || 1)), 0
    );

    // ==========================================================================
    // SECTION A: Your Personalized Debt Strategy
    // ==========================================================================
    const debtStrategy: DebtStrategyBlock = {
        headline: loans.length > 0
            ? "Your Personalized Debt Strategy"
            : "You're Debt Free! 🎉",
        subheadline: loans.length > 0
            ? `Here's a simple plan to help you save money and become debt-free faster. We've ranked your ${loans.length} loan${loans.length > 1 ? 's' : ''} by how much money they're costing you each month — attacking the biggest money drain first saves you the most.`
            : "Great news — you don't have any active loans. Keep building your savings!",
        steps: loans.slice(0, 3).map((loan, idx) => {
            let action = '';
            let reason = '';

            if (idx === 0) {
                action = safeToUse > 0
                    ? `Consider paying ₹${Math.min(safeToUse, loan.outstandingAmount).toLocaleString('en-IN')} extra`
                    : 'Focus your extra payments here first';
                reason = `This loan is costing you ₹${loan.monthlyInterestBurn.toLocaleString('en-IN')} every month in interest alone. That's the most among all your loans. Every rupee you pay early here saves you the most money.`;
            } else if (idx === 1) {
                action = 'Queue this for extra payments after the first loan';
                reason = `This loan costs you ₹${loan.monthlyInterestBurn.toLocaleString('en-IN')}/month in interest. Once you clear the first loan, redirect those savings here.`;
            } else {
                action = 'Continue with regular EMIs for now';
                reason = `At ₹${loan.monthlyInterestBurn.toLocaleString('en-IN')}/month in interest, this loan is less urgent. Stick to regular payments while focusing on the bigger drains.`;
            }

            return {
                stepNumber: idx + 1,
                loanName: loan.name,
                interestRate: loan.interestRate,
                action,
                reason,
                amount: idx === 0 && safeToUse > 0 ? Math.min(safeToUse, loan.outstandingAmount) : undefined
            };
        }),
        encouragement: loans.length > 0
            ? safeToUse > 0
                ? "You're already ahead of most people — you have savings that can work harder for you. Small consistent actions lead to big wins!"
                : "Even without extra funds right now, knowing your priority order puts you in control. Keep going!"
            : "Stay consistent with your savings habits — you're doing great!"
    };

    // ==========================================================================
    // SECTION B: What Happens If You Do Nothing vs Follow This Plan
    // ==========================================================================
    const comparison: ComparisonBlock = {
        headline: "What Happens Next?",
        doNothing: {
            title: "If You Continue As Usual",
            totalInterestPaid: totalInterestIfContinue,
            monthsToDebtFree: totalMonthsIfContinue,
            emotionalNote: totalInterestIfContinue > 10000
                ? `You'll pay ₹${totalInterestIfContinue.toLocaleString('en-IN')} in interest — that's money going to the bank instead of your goals.`
                : `You'll pay ₹${totalInterestIfContinue.toLocaleString('en-IN')} in interest over time.`
        },
        followPlan: {
            title: "If You Follow This Plan",
            totalInterestPaid: totalInterestIfContinue - totalInterestSaved,
            monthsToDebtFree: Math.max(0, totalMonthsIfContinue - monthsSaved),
            interestSaved: totalInterestSaved,
            monthsSaved: monthsSaved,
            emotionalNote: totalInterestSaved > 0
                ? `You keep ₹${totalInterestSaved.toLocaleString('en-IN')} in your pocket and become debt-free ${monthsSaved} month${monthsSaved !== 1 ? 's' : ''} sooner!`
                : "Even small extra payments add up over time."
        },
        verdict: totalInterestSaved > 5000
            ? `By using your idle savings smartly, you could save ₹${totalInterestSaved.toLocaleString('en-IN')} — that's real money you can use for things that matter to you.`
            : loans.length > 0
                ? "Every extra rupee towards your highest-interest loan brings you closer to financial freedom."
                : "Keep building your savings for future goals!"
    };

    // ==========================================================================
    // SECTION C: Safe-to-Use Money Right Now
    // ==========================================================================
    let emergencyStatusText = '';
    let warningNote: string | undefined;

    if (snapshot.emergencyFundStatus === 'adequate') {
        emergencyStatusText = "Your emergency fund is healthy! 💪";
    } else if (snapshot.emergencyFundStatus === 'partial') {
        emergencyStatusText = "You have some emergency savings, but we recommend building it to 3 months of expenses.";
        warningNote = "We've already protected your emergency buffer — we'll never recommend using that money.";
    } else {
        emergencyStatusText = "You should build an emergency fund first.";
        warningNote = "We recommend keeping at least 3 months of expenses as a safety net before aggressive debt payoff.";
    }

    let recommendationText = '';
    if (safeToUse <= 0) {
        recommendationText = "Right now, we recommend focusing on building your emergency fund before making extra loan payments. Even ₹500/month towards an emergency fund helps!";
    } else if (safeToUse < 10000) {
        recommendationText = `You have ₹${safeToUse.toLocaleString('en-IN')} that's safe to use. Consider putting ${loans.length > 0 ? 'half towards your highest-interest loan and half towards growing your emergency fund' : 'this towards your savings goals'}.`;
    } else {
        const suggestedPercent = Math.min(60, Math.max(30, Math.round((safeToUse / snapshot.idleCash) * 50)));
        const suggestedAmount = Math.round(safeToUse * suggestedPercent / 100);
        recommendationText = loans.length > 0
            ? `You have ₹${safeToUse.toLocaleString('en-IN')} available beyond your emergency buffer. We suggest using about ${suggestedPercent}% (₹${suggestedAmount.toLocaleString('en-IN')}) for loan prepayment — keeping some flexibility for unexpected needs.`
            : `You have ₹${safeToUse.toLocaleString('en-IN')} available to invest or save towards your goals!`;
    }

    const safeMoney: SafeMoneyBlock = {
        headline: "Safe-to-Use Money Right Now",
        totalIdleCash: snapshot.idleCash,
        emergencyFundRequired: emergencyFundRequired,
        emergencyFundStatus: emergencyStatusText,
        safeToUse: safeToUse,
        recommendation: recommendationText,
        warningNote,
        actionButton: safeToUse > 0 && loans.length > 0 ? {
            text: `Pay ₹${Math.min(safeToUse, loans[0]!.outstandingAmount).toLocaleString('en-IN')} towards ${loans[0]!.name}`,
            amount: Math.min(safeToUse, loans[0]!.outstandingAmount),
            targetLoan: loans[0]!.name
        } : null
    };

    // ==========================================================================
    // Personal Coach Note
    // ==========================================================================
    let coachNote = '';
    if (loans.length === 0) {
        coachNote = "You're in a great position with no debt! Consider investing your surplus towards long-term goals.";
    } else if (snapshot.monthlySurplus > 5000 && safeToUse > 10000) {
        coachNote = "You're doing really well! Your consistent savings habit gives you options. Using even a portion of your idle cash for debt can accelerate your journey to financial freedom.";
    } else if (snapshot.monthlySurplus > 0) {
        coachNote = "You're saving each month — that's a great habit! Even small extra payments on your loans can save you thousands in the long run.";
    } else {
        coachNote = "Managing money can feel tough sometimes. Focus on building small habits first — the goal is progress, not perfection.";
    }

    return {
        debtStrategy,
        comparison,
        safeMoney,
        coachNote
    };
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

export async function getSmartLoanAdvice(userId: mongoose.Types.ObjectId): Promise<SmartLoanAdviceResponse> {
    // Get 3 months of savings history
    const monthlySavingsHistory = await getMonthlySavingsHistory(userId, 3);

    // Get financial snapshot based on real data
    const snapshot = await getFinancialSnapshot(userId, monthlySavingsHistory);

    // Get and analyze loans
    const userLoans = await Loan.find({ userId, status: 'active' });
    const loans = analyzeLoansPriority(userLoans);

    // Generate repayment plan based on idle savings
    const repaymentPlan = generateRepaymentPlan(loans, snapshot.idleCash, snapshot.monthlyExpenses);

    // Generate recommendations
    const recommendations = generateRecommendations(snapshot, loans, monthlySavingsHistory, repaymentPlan);

    // Calculate summary
    const totalPotentialInterestSaved = repaymentPlan.reduce((sum, p) => sum + p.interestSaved, 0);
    const debtFreeMonthsReduction = repaymentPlan.reduce((sum, p) =>
        sum + Math.floor(p.suggestedPayment / (loans.find(l => l.id === p.loanId)?.emiAmount || 1)), 0
    );

    // Generate personalized advice (human-friendly UI blocks)
    const personalizedAdvice = generatePersonalizedAdvice(snapshot, loans, repaymentPlan);

    return {
        snapshot,
        monthlySavingsHistory,
        loans,
        repaymentPlan,
        recommendations,
        personalizedAdvice,
        summary: {
            totalIdleSavings: snapshot.idleCash,
            totalPotentialInterestSaved,
            recommendedFirstPayoff: loans.length > 0 ? loans[0]!.name : null,
            debtFreeMonthsReduction,
        },
    };
}
