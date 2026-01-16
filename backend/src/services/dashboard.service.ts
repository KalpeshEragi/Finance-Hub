/**
 * @file dashboard.service.ts
 * @description Dashboard analytics and aggregation service.
 * 
 * Provides aggregated financial insights:
 * - Summary: Total income, expenses, savings
 * - Trends: Monthly comparisons
 * - Category breakdowns
 */

import mongoose from 'mongoose';
import Transaction from '../models/transaction.model';
import Budget from '../models/budget.model';
import Goal from '../models/goal.model';
import { getMonthRange, getLastNMonthsRange, MONTHS_SHORT } from '../utils/date';
import { DEFAULTS } from '../config/constants';

// =============================================================================
// TYPES
// =============================================================================

interface DashboardSummary {
    period: string;
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
    transactionCount: number;
    topCategory: string | null;
    budgetStatus: {
        total: number;
        onTrack: number;
        exceeded: number;
    };
    goalProgress: {
        active: number;
        completed: number;
    };
}

interface TrendData {
    month: string;
    income: number;
    expenses: number;
    savings: number;
}

interface CategoryBreakdown {
    category: string;
    amount: number;
    percentage: number;
    transactionCount: number;
}

// =============================================================================
// SUMMARY
// =============================================================================

/**
 * @function getSummary
 * @description Gets dashboard summary for current month.
 * 
 * @param userId - User ID
 * @returns Dashboard summary data
 */
export async function getSummary(userId: string): Promise<DashboardSummary> {
    const now = new Date();
    const { start, end } = getMonthRange(now.getFullYear(), now.getMonth() + 1);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Aggregate transactions
    const transactionAgg = await Transaction.aggregate([
        {
            $match: {
                userId: userObjectId,
                date: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
    ]);

    const income = transactionAgg.find(t => t._id === 'income')?.total || 0;
    const expenses = transactionAgg.find(t => t._id === 'expense')?.total || 0;
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const transactionCount = transactionAgg.reduce((sum, t) => sum + t.count, 0);

    // Get top expense category
    const topCategoryAgg = await Transaction.aggregate([
        {
            $match: {
                userId: userObjectId,
                type: 'expense',
                date: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: '$category',
                total: { $sum: '$amount' },
            },
        },
        { $sort: { total: -1 } },
        { $limit: 1 },
    ]);

    const topCategory = topCategoryAgg[0]?._id || null;

    // Budget status
    const budgets = await Budget.find({
        userId: userObjectId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
    });

    let onTrack = 0;
    let exceeded = 0;

    for (const budget of budgets) {
        const spent = await Transaction.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    type: 'expense',
                    category: budget.category,
                    date: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                },
            },
        ]);

        const spentAmount = spent[0]?.total || 0;
        if (spentAmount > budget.limit) {
            exceeded++;
        } else {
            onTrack++;
        }
    }

    // Goal progress
    const activeGoals = await Goal.countDocuments({
        userId: userObjectId,
        status: 'active',
    });

    const completedGoals = await Goal.countDocuments({
        userId: userObjectId,
        status: 'completed',
    });

    return {
        period: `${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`,
        income,
        expenses,
        savings,
        savingsRate: Math.round(savingsRate * 10) / 10,
        transactionCount,
        topCategory,
        budgetStatus: {
            total: budgets.length,
            onTrack,
            exceeded,
        },
        goalProgress: {
            active: activeGoals,
            completed: completedGoals,
        },
    };
}

// =============================================================================
// TRENDS
// =============================================================================

/**
 * @function getTrends
 * @description Gets monthly trends for the last N months.
 * 
 * @param userId - User ID
 * @param months - Number of months (default: 6)
 * @returns Array of monthly trend data
 */
export async function getTrends(
    userId: string,
    months: number = DEFAULTS.TREND_MONTHS
): Promise<TrendData[]> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const trends: TrendData[] = [];

    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const { start, end } = getMonthRange(
            targetDate.getFullYear(),
            targetDate.getMonth() + 1
        );

        const agg = await Transaction.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    date: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                },
            },
        ]);

        const income = agg.find(t => t._id === 'income')?.total || 0;
        const expenses = agg.find(t => t._id === 'expense')?.total || 0;

        trends.push({
            month: `${MONTHS_SHORT[targetDate.getMonth()]} ${targetDate.getFullYear()}`,
            income,
            expenses,
            savings: income - expenses,
        });
    }

    return trends;
}

// =============================================================================
// CATEGORIES
// =============================================================================

/**
 * @function getCategoryBreakdown
 * @description Gets expense breakdown by category.
 * 
 * @param userId - User ID
 * @param type - Transaction type (default: expense)
 * @returns Array of category breakdowns
 */
export async function getCategoryBreakdown(
    userId: string,
    type: 'income' | 'expense' = 'expense'
): Promise<CategoryBreakdown[]> {
    const now = new Date();
    const { start, end } = getMonthRange(now.getFullYear(), now.getMonth() + 1);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const agg = await Transaction.aggregate([
        {
            $match: {
                userId: userObjectId,
                type,
                date: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: '$category',
                amount: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
        { $sort: { amount: -1 } },
    ]);

    const total = agg.reduce((sum, cat) => sum + cat.amount, 0);

    return agg.map(cat => ({
        category: cat._id,
        amount: cat.amount,
        percentage: total > 0 ? Math.round((cat.amount / total) * 100) : 0,
        transactionCount: cat.count,
    }));
}

// =============================================================================
// EXPORTS
// =============================================================================

export const dashboardService = {
    getSummary,
    getTrends,
    getCategoryBreakdown,
};

export default dashboardService;
