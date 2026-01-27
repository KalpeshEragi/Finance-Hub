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

export interface SmartLoanAdviceResponse {
    snapshot: FinancialSnapshot;
    monthlySavingsHistory: MonthlySavingsData[];
    loans: LoanDetail[];
    repaymentPlan: RepaymentPlan[];
    recommendations: LoanRecommendation[];
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
    // Sort by interest rate (highest first) for debt avalanche
    const sorted = [...loans].sort((a, b) => b.interestRate - a.interestRate);

    return sorted.map((loan, index) => {
        const monthsRemaining = Math.ceil(loan.outstandingAmount / loan.emiAmount);

        // Calculate total interest if continued normally
        const monthlyRate = loan.interestRate / 12 / 100;
        let totalInterest = 0;
        let balance = loan.outstandingAmount;

        for (let m = 0; m < monthsRemaining && balance > 0; m++) {
            const interestThisMonth = balance * monthlyRate;
            totalInterest += interestThisMonth;
            balance = balance - (loan.emiAmount - interestThisMonth);
        }

        let recommendedAction = '';
        if (index === 0) {
            recommendedAction = '🔴 PRIORITY 1: Pay this loan first - highest interest rate';
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

    return {
        snapshot,
        monthlySavingsHistory,
        loans,
        repaymentPlan,
        recommendations,
        summary: {
            totalIdleSavings: snapshot.idleCash,
            totalPotentialInterestSaved,
            recommendedFirstPayoff: loans.length > 0 ? loans[0]!.name : null,
            debtFreeMonthsReduction,
        },
    };
}
