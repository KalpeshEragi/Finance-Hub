/**
 * @file goals.service.ts
 * @description Financial goals management service.
 * 
 * This service handles:
 * - Creating and tracking financial goals
 * - Progress updates
 * - Goal completion detection
 */

import mongoose from 'mongoose';
import Goal, { IGoal, GoalStatus } from '../models/goal.model';
import Alert from '../models/alert.model';
import { AppError } from '../middleware/error.middleware';
import { HTTP_STATUS, ERROR_MESSAGES, ALERT_TYPES, GOAL_STATUS } from '../config/constants';

// =============================================================================
// TYPES
// =============================================================================

interface GoalInput {
    title: string;
    targetAmount: number;
    deadline: Date | string;
    description?: string;
    priority?: number;
    category?: string;
    currentAmount?: number;
}

interface GoalUpdate {
    title?: string;
    targetAmount?: number;
    currentAmount?: number;
    deadline?: Date | string;
    description?: string;
    priority?: number;
    category?: string;
    status?: GoalStatus;
}

interface GoalPublic {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
    status: GoalStatus;
    description?: string;
    priority: number;
    progressPercentage: number;
    remainingAmount: number;
    daysRemaining: number;
    isOverdue: boolean;
    createdAt: Date;
}

// =============================================================================
// CREATE OPERATIONS
// =============================================================================

/**
 * @function createGoal
 * @description Creates a new financial goal.
 * 
 * @param userId - User ID
 * @param input - Goal data
 * @returns Created goal
 */
export async function createGoal(userId: string, input: GoalInput): Promise<GoalPublic> {
    const goal = await Goal.create({
        userId: new mongoose.Types.ObjectId(userId),
        title: input.title,
        targetAmount: input.targetAmount,
        currentAmount: input.currentAmount || 0,
        deadline: new Date(input.deadline),
        description: input.description,
        priority: input.priority || 5,
        category: input.category,
        status: GOAL_STATUS.ACTIVE,
    });

    return formatGoalForResponse(goal);
}

// =============================================================================
// READ OPERATIONS
// =============================================================================

/**
 * @function getGoals
 * @description Fetches all goals for a user.
 * 
 * @param userId - User ID
 * @param filter - Optional status filter
 * @returns Array of goals
 */
export async function getGoals(
    userId: string,
    filter?: { status?: GoalStatus }
): Promise<GoalPublic[]> {
    const query: Record<string, unknown> = { userId };

    if (filter?.status) {
        query.status = filter.status;
    }

    const goals = await Goal.find(query)
        .sort({ priority: 1, deadline: 1 });

    return goals.map(formatGoalForResponse);
}

/**
 * @function getGoalById
 * @description Fetches a single goal by ID.
 * 
 * @param userId - User ID (for authorization)
 * @param goalId - Goal ID
 * @returns Goal data
 */
export async function getGoalById(userId: string, goalId: string): Promise<GoalPublic> {
    const goal = await Goal.findOne({
        _id: goalId,
        userId,
    });

    if (!goal) {
        throw new AppError(ERROR_MESSAGES.GOAL_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return formatGoalForResponse(goal);
}

// =============================================================================
// UPDATE OPERATIONS
// =============================================================================

/**
 * @function updateGoal
 * @description Updates an existing goal.
 * 
 * UNIFIED ARCHITECTURE: When currentAmount increases, we create a Transaction
 * record linked to this goal. This ensures all financial movements are tracked
 * in the single source of truth (Transaction ledger).
 * 
 * @param userId - User ID
 * @param goalId - Goal ID
 * @param input - Fields to update
 * @returns Updated goal
 */
export async function updateGoal(
    userId: string,
    goalId: string,
    input: GoalUpdate
): Promise<GoalPublic> {
    const goal = await Goal.findOne({ _id: goalId, userId });

    if (!goal) {
        throw new AppError(ERROR_MESSAGES.GOAL_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Update fields
    if (input.title !== undefined) goal.title = input.title;
    if (input.targetAmount !== undefined) goal.targetAmount = input.targetAmount;
    if (input.deadline !== undefined) goal.deadline = new Date(input.deadline);
    if (input.description !== undefined) goal.description = input.description;
    if (input.priority !== undefined) goal.priority = input.priority;
    if (input.category !== undefined) goal.category = input.category;
    if (input.status !== undefined) goal.status = input.status;

    // Handle currentAmount update with completion check
    if (input.currentAmount !== undefined) {
        const previousAmount = goal.currentAmount;
        const contributionAmount = input.currentAmount - previousAmount;
        goal.currentAmount = input.currentAmount;

        // =================================================================
        // UNIFIED ARCHITECTURE: Create Transaction for Goal Contribution
        // =================================================================
        if (contributionAmount > 0) {
            // Import Transaction model dynamically to avoid circular dependency
            const Transaction = (await import('../models/transaction.model')).default;

            await Transaction.create({
                userId: new mongoose.Types.ObjectId(userId),
                amount: contributionAmount,
                type: 'expense', // Money leaving the user's available balance
                category: 'Savings',
                description: `Contribution to goal: ${goal.title}`,
                merchant: 'Goal Savings',
                date: new Date(),
                goalId: goal._id, // Link to the goal
                isAutoCategorized: true,
            });
        }

        // Check if goal is now completed
        if (goal.currentAmount >= goal.targetAmount && goal.status === GOAL_STATUS.ACTIVE) {
            goal.status = GOAL_STATUS.COMPLETED;

            // Create completion alert
            await Alert.create({
                userId,
                type: ALERT_TYPES.GOAL_ACHIEVED,
                title: `🎉 Goal Achieved: ${goal.title}`,
                message: `Congratulations! You've reached your goal of ₹${goal.targetAmount.toLocaleString()}`,
                relatedEntityId: goal._id,
                relatedEntityType: 'goal',
            });
        }

        // Check for progress milestones (50%, 75%)
        const previousPercentage = (previousAmount / goal.targetAmount) * 100;
        const currentPercentage = (goal.currentAmount / goal.targetAmount) * 100;

        if (previousPercentage < 50 && currentPercentage >= 50) {
            await Alert.create({
                userId,
                type: ALERT_TYPES.GOAL_PROGRESS,
                title: `Goal Progress: ${goal.title}`,
                message: `You're halfway to your goal! Keep going!`,
                relatedEntityId: goal._id,
                relatedEntityType: 'goal',
            });
        }

        if (previousPercentage < 75 && currentPercentage >= 75) {
            await Alert.create({
                userId,
                type: ALERT_TYPES.GOAL_PROGRESS,
                title: `Goal Progress: ${goal.title}`,
                message: `You're 75% of the way there! Almost done!`,
                relatedEntityId: goal._id,
                relatedEntityType: 'goal',
            });
        }
    }

    await goal.save();

    return formatGoalForResponse(goal);
}

// =============================================================================
// DELETE OPERATIONS
// =============================================================================

/**
 * @function deleteGoal
 * @description Deletes a goal.
 * 
 * @param userId - User ID
 * @param goalId - Goal ID
 */
export async function deleteGoal(userId: string, goalId: string): Promise<void> {
    const result = await Goal.deleteOne({ _id: goalId, userId });

    if (result.deletedCount === 0) {
        throw new AppError(ERROR_MESSAGES.GOAL_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatGoalForResponse(goal: IGoal): GoalPublic {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
        id: goal._id.toString(),
        title: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
        status: goal.status,
        description: goal.description,
        priority: goal.priority || 5,
        progressPercentage: Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)),
        remainingAmount: Math.max(0, goal.targetAmount - goal.currentAmount),
        daysRemaining,
        isOverdue: goal.status === 'active' && daysRemaining < 0,
        createdAt: goal.createdAt,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const goalsService = {
    createGoal,
    getGoals,
    getGoalById,
    updateGoal,
    deleteGoal,
};

export default goalsService;
