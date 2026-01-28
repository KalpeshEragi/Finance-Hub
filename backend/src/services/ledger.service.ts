/**
 * @file ledger.service.ts
 * @description Ledger Aggregation Layer for Investment Agent.
 * 
 * This service aggregates financial data from all sources:
 * - Dashboard metrics (income, expense, savings)
 * - Transaction ledger
 * - Budget data
 * - Loans data
 * - Goals data
 * 
 * The aggregated snapshot is used by the Investment Agent for:
 * - Risk assessment
 * - Investment readiness scoring
 * - Personalized recommendations
 */

import { Types } from 'mongoose';
import Transaction from '../models/transaction.model';
import Budget from '../models/budget.model';
import Goal from '../models/goal.model';
import Loan from '../models/loan.model';

// =============================================================================
// INTERFACE DEFINITIONS
// =============================================================================

export interface CategoryBreakdown {
    category: string;
    amount: number;
    percentage: number;
}

export interface MonthlyTrend {
    month: string;
    year: number;
    income: number;
    expense: number;
    netSavings: number;
}

export interface BudgetMetrics {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    adherenceRate: number; // % of budgets not exceeded
    budgets: {
        category: string;
        limit: number;
        spent: number;
        percentage: number;
        status: 'ok' | 'warning' | 'exceeded';
    }[];
}

export interface LoanMetrics {
    totalLoans: number;
    activeLoans: number;
    totalOutstanding: number;
    totalMonthlyEMI: number;
    totalPrincipal: number;
    averageInterestRate: number;
    loans: {
        name: string;
        loanType: string;
        outstanding: number;
        emi: number;
        interestRate: number;
        status: string;
    }[];
}

export interface GoalMetrics {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalSavedAmount: number;
    overallProgress: number; // percentage
    goals: {
        name: string;
        category: string;
        targetAmount: number;
        savedAmount: number;
        progress: number;
        deadline: Date;
        status: string;
    }[];
}

export interface RiskIndicators {
    savingsRate: number;              // Net savings / income %
    debtToIncomeRatio: number;        // Monthly EMI / monthly income %
    budgetAdherence: number;          // % of budgets not exceeded
    goalProgress: number;             // Overall goal completion %
    emergencyFundCoverage: number;    // Months of expenses covered (placeholder)
    investmentReadiness: boolean;     // Composite assessment
    riskLevel: 'low' | 'moderate' | 'high';
}

export interface LedgerSnapshot {
    userId: string;
    timestamp: Date;

    // Core metrics
    dashboard: {
        totalIncome: number;
        totalExpense: number;
        netBalance: number;
        savingsRate: number;
        transactionCount: number;
        categoryBreakdown: CategoryBreakdown[];
        monthlyTrends: MonthlyTrend[];
    };

    // Budget metrics
    budget: BudgetMetrics;

    // Loan metrics
    loans: LoanMetrics;

    // Goals metrics
    goals: GoalMetrics;

    // Risk assessment
    riskIndicators: RiskIndicators;
}

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

/**
 * Get dashboard metrics from transaction ledger
 */
async function getDashboardMetrics(userId: Types.ObjectId): Promise<LedgerSnapshot['dashboard']> {
    // Get all transactions for user
    const transactions = await Transaction.find({ userId }).lean();

    // Calculate totals
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

    // Category breakdown (expenses)
    const categoryMap = new Map<string, number>();
    expenseTransactions.forEach(t => {
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
    });

    const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({
            category,
            amount,
            percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

    // Monthly trends (last 6 months)
    const now = new Date();
    const monthlyTrends: MonthlyTrend[] = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const month = date.getMonth();

        const monthIncome = transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'income' && tDate.getMonth() === month && tDate.getFullYear() === year;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const monthExpense = transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && tDate.getMonth() === month && tDate.getFullYear() === year;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        monthlyTrends.push({
            month: monthName,
            year,
            income: monthIncome,
            expense: monthExpense,
            netSavings: monthIncome - monthExpense,
        });
    }

    return {
        totalIncome,
        totalExpense,
        netBalance,
        savingsRate: Math.round(savingsRate * 100) / 100,
        transactionCount: transactions.length,
        categoryBreakdown,
        monthlyTrends,
    };
}

/**
 * Get budget metrics for current month
 */
async function getBudgetMetrics(userId: Types.ObjectId): Promise<BudgetMetrics> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get budgets for current month
    const budgets = await Budget.find({
        userId,
        month: currentMonth,
        year: currentYear,
    }).lean();

    // Get spending per category from transactions
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const transactions = await Transaction.find({
        userId,
        type: 'expense',
        date: { $gte: startOfMonth, $lte: endOfMonth },
    }).lean();

    // Aggregate spending by category
    const spendingMap = new Map<string, number>();
    transactions.forEach(t => {
        spendingMap.set(t.category, (spendingMap.get(t.category) || 0) + t.amount);
    });

    // Build budget metrics
    let totalBudget = 0;
    let totalSpent = 0;
    let exceededCount = 0;

    const budgetDetails = budgets.map(b => {
        const spent = spendingMap.get(b.category) || 0;
        const percentage = b.limit > 0 ? (spent / b.limit) * 100 : 0;
        const status = percentage > 100 ? 'exceeded' : percentage > 80 ? 'warning' : 'ok';

        totalBudget += b.limit;
        totalSpent += spent;
        if (status === 'exceeded') exceededCount++;

        return {
            category: b.category,
            limit: b.limit,
            spent,
            percentage: Math.round(percentage * 100) / 100,
            status: status as 'ok' | 'warning' | 'exceeded',
        };
    });

    const adherenceRate = budgets.length > 0
        ? ((budgets.length - exceededCount) / budgets.length) * 100
        : 100;

    return {
        totalBudget,
        totalSpent,
        remaining: Math.max(0, totalBudget - totalSpent),
        adherenceRate: Math.round(adherenceRate * 100) / 100,
        budgets: budgetDetails,
    };
}

/**
 * Get loan metrics
 */
async function getLoanMetrics(userId: Types.ObjectId): Promise<LoanMetrics> {
    const loans = await Loan.find({ userId }).lean();

    const activeLoans = loans.filter(l => l.status === 'active');

    const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstandingAmount, 0);
    const totalMonthlyEMI = activeLoans.reduce((sum, l) => sum + l.emiAmount, 0);
    const totalPrincipal = loans.reduce((sum, l) => sum + l.principalAmount, 0);

    const averageInterestRate = activeLoans.length > 0
        ? activeLoans.reduce((sum, l) => sum + l.interestRate, 0) / activeLoans.length
        : 0;

    return {
        totalLoans: loans.length,
        activeLoans: activeLoans.length,
        totalOutstanding,
        totalMonthlyEMI,
        totalPrincipal,
        averageInterestRate: Math.round(averageInterestRate * 100) / 100,
        loans: loans.map(l => ({
            name: l.name,
            loanType: l.loanType,
            outstanding: l.outstandingAmount,
            emi: l.emiAmount,
            interestRate: l.interestRate,
            status: l.status,
        })),
    };
}

/**
 * Get goals metrics (connected to DB)
 */
async function getGoalMetrics(userId: Types.ObjectId): Promise<GoalMetrics> {
    const goals = await Goal.find({ userId }).lean();

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSavedAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);

    const overallProgress = totalTargetAmount > 0
        ? (totalSavedAmount / totalTargetAmount) * 100
        : 0;

    return {
        totalGoals: goals.length,
        activeGoals: activeGoals.length,
        completedGoals: completedGoals.length,
        totalTargetAmount,
        totalSavedAmount,
        overallProgress: Math.round(overallProgress * 100) / 100,
        goals: goals.map(g => ({
            name: g.title,
            category: g.category || 'General',
            targetAmount: g.targetAmount,
            savedAmount: g.currentAmount,
            progress: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
            deadline: g.deadline,
            status: g.status,
        })),
    };
}

/**
 * Calculate risk indicators based on all metrics
 */
function calculateRiskIndicators(
    dashboard: LedgerSnapshot['dashboard'],
    budget: BudgetMetrics,
    loans: LoanMetrics,
    goals: GoalMetrics
): RiskIndicators {
    // Savings rate (already calculated)
    const savingsRate = dashboard.savingsRate;

    // Debt to income ratio (monthly EMI / average monthly income)
    const avgMonthlyIncome = dashboard.monthlyTrends.length > 0
        ? dashboard.monthlyTrends.reduce((sum, m) => sum + m.income, 0) / dashboard.monthlyTrends.length
        : dashboard.totalIncome / 6;

    const debtToIncomeRatio = avgMonthlyIncome > 0
        ? (loans.totalMonthlyEMI / avgMonthlyIncome) * 100
        : 0;

    // Budget adherence
    const budgetAdherence = budget.adherenceRate;

    // Goal progress
    const goalProgress = goals.overallProgress;

    // Emergency fund coverage (placeholder - will be from Emergency Funds when connected)
    // For now, estimate based on savings
    const avgMonthlyExpense = dashboard.monthlyTrends.length > 0
        ? dashboard.monthlyTrends.reduce((sum, m) => sum + m.expense, 0) / dashboard.monthlyTrends.length
        : dashboard.totalExpense / 6;

    const emergencyFundCoverage = avgMonthlyExpense > 0
        ? dashboard.netBalance / avgMonthlyExpense
        : 0;

    // Investment readiness criteria:
    // - Savings rate > 20%
    // - Debt-to-income < 40%
    // - Budget adherence > 70%
    // - At least 3 months emergency fund coverage
    const investmentReadiness =
        savingsRate >= 20 &&
        debtToIncomeRatio <= 40 &&
        budgetAdherence >= 70 &&
        emergencyFundCoverage >= 3;

    // Risk level calculation
    let riskScore = 0;
    if (savingsRate < 10) riskScore += 2;
    else if (savingsRate < 20) riskScore += 1;

    if (debtToIncomeRatio > 50) riskScore += 2;
    else if (debtToIncomeRatio > 30) riskScore += 1;

    if (budgetAdherence < 50) riskScore += 2;
    else if (budgetAdherence < 70) riskScore += 1;

    if (emergencyFundCoverage < 1) riskScore += 2;
    else if (emergencyFundCoverage < 3) riskScore += 1;

    const riskLevel: 'low' | 'moderate' | 'high' =
        riskScore >= 5 ? 'high' : riskScore >= 3 ? 'moderate' : 'low';

    return {
        savingsRate: Math.round(savingsRate * 100) / 100,
        debtToIncomeRatio: Math.round(debtToIncomeRatio * 100) / 100,
        budgetAdherence: Math.round(budgetAdherence * 100) / 100,
        goalProgress: Math.round(goalProgress * 100) / 100,
        emergencyFundCoverage: Math.round(emergencyFundCoverage * 100) / 100,
        investmentReadiness,
        riskLevel,
    };
}

/**
 * Get complete ledger snapshot for Investment Agent
 */
export async function getLedgerSnapshot(userId: string): Promise<LedgerSnapshot> {
    const userObjectId = new Types.ObjectId(userId);

    // Fetch all metrics in parallel
    const [dashboard, budget, loans, goals] = await Promise.all([
        getDashboardMetrics(userObjectId),
        getBudgetMetrics(userObjectId),
        getLoanMetrics(userObjectId),
        getGoalMetrics(userObjectId),
    ]);

    // Calculate risk indicators
    const riskIndicators = calculateRiskIndicators(dashboard, budget, loans, goals);

    return {
        userId,
        timestamp: new Date(),
        dashboard,
        budget,
        loans,
        goals,
        riskIndicators,
    };
}

// Export all functions
export default {
    getLedgerSnapshot,
    getDashboardMetrics,
    getBudgetMetrics,
    getLoanMetrics,
    getGoalMetrics,
};
