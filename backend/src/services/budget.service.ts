/**
 * @file budget.service.ts
 * @description Budget management service for tracking spending limits.
 * 
 * This service handles:
 * - Creating and updating budgets
 * - Fetching budgets for a period
 * - Calculating spending against budgets
 * - Generating budget alerts
 * 
 * @architecture
 * Budgets are per-category, per-month limits.
 * Service calculates actual spending from transactions.
 */

import mongoose from 'mongoose';
import Budget, { IBudget } from '../models/budget.model';
import Transaction from '../models/transaction.model';
import Alert from '../models/alert.model';
import { AppError } from '../middleware/error.middleware';
import { HTTP_STATUS, ERROR_MESSAGES, ALERT_TYPES, DEFAULTS } from '../config/constants';
import { getMonthRange, getCurrentMonthRange } from '../utils/date';
import { aiClient } from '../integrations/ai-engine/ai.client';
import { CategoryTransactionInput } from '../integrations/ai-engine/ai.types';

// =============================================================================
// TYPES
// =============================================================================

interface BudgetWithSpending {
    id: string;
    category: string;
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'under' | 'warning' | 'exceeded';
    month: number;
    year: number;
}

interface BudgetSummary {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    overallPercentage: number;
    budgets: BudgetWithSpending[];
    alerts: Array<{ category: string; message: string; type: string }>;
}

// =============================================================================
// CREATE/UPDATE OPERATIONS
// =============================================================================

/**
 * @function createOrUpdateBudget
 * @description Creates a new budget or updates existing one.
 * 
 * Uses upsert to handle both create and update in one operation.
 * 
 * @param userId - User ID
 * @param data - Budget data
 * @returns Created/updated budget with spending info
 */
export async function createOrUpdateBudget(
    userId: string,
    data: {
        category: string;
        limit: number;
        month: number;
        year: number;
    }
): Promise<BudgetWithSpending> {
    const budget = await Budget.findOneAndUpdate(
        {
            userId: new mongoose.Types.ObjectId(userId),
            category: data.category,
            month: data.month,
            year: data.year,
        },
        {
            $set: { limit: data.limit },
            $setOnInsert: {
                userId: new mongoose.Types.ObjectId(userId),
                category: data.category,
                month: data.month,
                year: data.year,
            },
        },
        { new: true, upsert: true }
    );

    // Calculate spending for this budget
    return calculateBudgetSpending(userId, budget);
}

// =============================================================================
// READ OPERATIONS
// =============================================================================

/**
 * @function getBudgets
 * @description Fetches all budgets for a user in a specific period.
 * 
 * @param userId - User ID
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Array of budgets with spending info
 */
export async function getBudgets(
    userId: string,
    month: number = new Date().getMonth() + 1,
    year: number = new Date().getFullYear()
): Promise<BudgetWithSpending[]> {
    const budgets = await Budget.find({
        userId,
        month,
        year,
    });

    // Calculate spending for each budget
    const budgetsWithSpending = await Promise.all(
        budgets.map(budget => calculateBudgetSpending(userId, budget))
    );

    return budgetsWithSpending;
}

/**
 * @function getBudgetSummary
 * @description Gets aggregated budget summary with alerts.
 * 
 * @param userId - User ID
 * @param month - Optional month
 * @param year - Optional year
 * @returns Complete budget summary
 */
export async function getBudgetSummary(
    userId: string,
    month?: number,
    year?: number
): Promise<BudgetSummary> {
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    // Get all budgets with spending
    const budgets = await getBudgets(userId, targetMonth, targetYear);

    // Calculate totals
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    const overallPercentage = totalBudget > 0
        ? Math.round((totalSpent / totalBudget) * 100)
        : 0;

    // Generate alerts for budgets near or over limit
    const alerts = budgets
        .filter(b => b.status === 'warning' || b.status === 'exceeded')
        .map(b => ({
            category: b.category,
            message: b.status === 'exceeded'
                ? `Budget exceeded for ${b.category} (${b.percentage}% used)`
                : `Approaching limit for ${b.category} (${b.percentage}% used)`,
            type: b.status === 'exceeded' ? ALERT_TYPES.BUDGET_EXCEEDED : ALERT_TYPES.BUDGET_WARNING,
        }));

    return {
        totalBudget,
        totalSpent,
        totalRemaining,
        overallPercentage,
        budgets,
        alerts,
    };
}

/**
 * @function checkBudgetAlerts
 * @description Checks budgets and creates alert notifications.
 * 
 * @param userId - User ID
 * @returns Number of alerts created
 */
export async function checkBudgetAlerts(userId: string): Promise<{ alertsCreated: number }> {
    const summary = await getBudgetSummary(userId);
    let alertsCreated = 0;

    for (const alert of summary.alerts) {
        // Check if similar alert already exists (to avoid duplicates)
        const existingAlert = await Alert.findOne({
            userId,
            type: alert.type,
            'metadata.category': alert.category,
            'metadata.month': new Date().getMonth() + 1,
            'metadata.year': new Date().getFullYear(),
        });

        if (!existingAlert) {
            await Alert.create({
                userId,
                type: alert.type,
                title: `Budget Alert: ${alert.category}`,
                message: alert.message,
                metadata: {
                    category: alert.category,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                },
            });
            alertsCreated++;
        }
    }

    return { alertsCreated };
}

/**
 * @function getBudgetAdvice
 * @description Gets personalized budget advice and savings recommendations.
 * 
 * TEMPORARY: Uses local rule-based logic instead of AI Engine.
 * TODO: Reconnect to AI Engine after hackathon deadline.
 * 
 * @param userId - User ID
 * @returns Budget analysis with recommendations
 */
export async function getBudgetAdvice(userId: string) {
    const { start, end } = getCurrentMonthRange();

    // 1. Fetch recent transactions (current month)
    const transactions = await Transaction.find({
        userId,
        date: { $gte: start, $lte: end },
        type: 'expense'
    });

    if (transactions.length === 0) {
        return {
            total_spending: 0,
            needs_spending: 0,
            wants_spending: 0,
            savings_spending: 0,
            recommendations: [],
            estimated_monthly_savings: 0,
            message: "No transactions found for analysis this month."
        };
    }

    // 2. Local Rule-Based Analysis (Temporary - bypassing AI Engine)
    // Categorize spending into buckets
    const NEEDS_CATEGORIES = ['Groceries', 'Bills & Utilities', 'Rent', 'EMI', 'Insurance', 'Healthcare', 'Education'];
    const WANTS_CATEGORIES = ['Food & Dining', 'Shopping', 'Entertainment', 'Travel', 'Other'];
    const SAVINGS_CATEGORIES = ['Savings', 'Investment'];

    let needsSpending = 0;
    let wantsSpending = 0;
    let savingsSpending = 0;
    const categoryTotals: Record<string, number> = {};

    for (const t of transactions) {
        const category = t.category || 'Other';
        const amount = t.amount;

        // Aggregate by category
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;

        // Bucket assignment
        if (NEEDS_CATEGORIES.includes(category)) {
            needsSpending += amount;
        } else if (SAVINGS_CATEGORIES.includes(category)) {
            savingsSpending += amount;
        } else {
            wantsSpending += amount;
        }
    }

    const totalSpending = needsSpending + wantsSpending + savingsSpending;

    // 3. Generate Recommendations (Rule-Based)
    const recommendations: Array<{
        category: string;
        current_spending: number;
        recommended_limit: number;
        potential_savings: number;
        reason: string;
        action_item: string;
        priority: number;
    }> = [];

    const REDUCTION_PERCENT = 0.15; // 15% reduction target
    const MIN_THRESHOLD = 500; // Only recommend for categories > ₹500

    // Sort "Wants" categories by spending (highest first)
    const wantsCategorySpending = Object.entries(categoryTotals)
        .filter(([cat]) => WANTS_CATEGORIES.includes(cat) || !NEEDS_CATEGORIES.includes(cat))
        .filter(([, amount]) => amount >= MIN_THRESHOLD)
        .sort(([, a], [, b]) => b - a);

    // Generate top 3 recommendations
    let priority = 1;
    for (const [category, amount] of wantsCategorySpending.slice(0, 3)) {
        const potentialSavings = Math.round(amount * REDUCTION_PERCENT);
        const recommendedLimit = Math.round(amount * (1 - REDUCTION_PERCENT));

        recommendations.push({
            category,
            current_spending: amount,
            recommended_limit: recommendedLimit,
            potential_savings: potentialSavings,
            reason: `You spent ₹${amount.toLocaleString()} on ${category} this month. This is a discretionary expense that can be optimized.`,
            action_item: `Try to limit ${category} spending to ₹${recommendedLimit.toLocaleString()} next month.`,
            priority: priority++,
        });
    }

    const estimatedMonthlySavings = recommendations.reduce((sum, r) => sum + r.potential_savings, 0);

    return {
        total_spending: totalSpending,
        needs_spending: needsSpending,
        wants_spending: wantsSpending,
        savings_spending: savingsSpending,
        recommendations,
        estimated_monthly_savings: estimatedMonthlySavings,
    };

    // =========================================================================
    // FUTURE: Uncomment below to use AI Engine instead of local logic
    // =========================================================================
    // const aiTransactions: CategoryTransactionInput[] = transactions.map(t => ({
    //     id: t._id.toString(),
    //     description: t.description,
    //     merchant: t.merchantName,
    //     amount: t.amount,
    //     type: 'expense'
    // }));
    // return await aiClient.analyzeBudget(aiTransactions, userId);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * @function calculateBudgetSpending
 * @description Calculates actual spending for a budget.
 */
async function calculateBudgetSpending(
    userId: string,
    budget: IBudget
): Promise<BudgetWithSpending> {
    const { start, end } = getMonthRange(budget.year, budget.month);

    // Get total spending for this category in this month
    const result = await Transaction.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
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

    const spent = result[0]?.total || 0;
    const remaining = Math.max(0, budget.limit - spent);
    const percentage = budget.limit > 0
        ? Math.round((spent / budget.limit) * 100)
        : 0;

    // Determine status
    let status: 'under' | 'warning' | 'exceeded' = 'under';
    if (percentage >= 100) {
        status = 'exceeded';
    } else if (percentage >= DEFAULTS.BUDGET_ALERT_THRESHOLD) {
        status = 'warning';
    }

    return {
        id: budget._id.toString(),
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining,
        percentage,
        status,
        month: budget.month,
        year: budget.year,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const budgetService = {
    createOrUpdateBudget,
    getBudgets,
    getBudgetSummary,
    checkBudgetAlerts,
    getBudgetAdvice,
};

export default budgetService;
