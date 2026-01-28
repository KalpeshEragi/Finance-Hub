/**
 * @file balance.service.ts
 * @description Central Balance Service - Single Source of Truth for Money
 * 
 * This service implements proper ledger accounting to ensure money conservation:
 * - Net Balance = Sum of all transactions (single source of truth)
 * - Goals are allocations (envelopes), not independent balances
 * - Free Balance = Net Balance - Allocated Balance
 * 
 * Core principle: Money cannot exist in two places at once.
 */

import mongoose from 'mongoose';
import Transaction from '../models/transaction.model';
import Goal from '../models/goal.model';
import { isEmergencyFund } from './emergency-shield.service';

// =============================================================================
// TYPES
// =============================================================================

export interface UserBalance {
    // Ledger balance (from transactions)
    netBalance: number;                 // Sum of all income - expenses
    monthlyIncome: number;              // Current month income
    currentMonthExpenses: number;       // Current month expenses

    // Allocations (from goals)
    allocatedBalance: number;           // Sum of all goal allocations
    emergencyAllocated: number;         // Sum of emergency goals only
    nonEmergencyAllocated: number;      // Sum of non-emergency goals

    // Free balance (spendable)
    freeBalance: number;                // Net - Allocated

    // Emergency breakdown
    coreEmergency: number;              // Min(emergency, 6 months essentials)
    surplusEmergency: number;           // Max(0, emergency - 6 months)
}

export interface AllocationValidation {
    canAllocate: boolean;
    freeBalance: number;
    requested: number;
    shortfall?: number;
    message?: string;
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Calculate Net Balance from transaction ledger
 * This is the SINGLE SOURCE OF TRUTH for how much money the user actually has
 */
export async function calculateNetBalance(
    userId: mongoose.Types.ObjectId
): Promise<{
    netBalance: number;
    monthlyIncome: number;
    currentMonthExpenses: number;
}> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get all transactions for net balance calculation
    const allTransactions = await Transaction.find({ userId });

    // Calculate lifetime net balance
    const income = allTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = allTransactions
        .filter(t => t.type === 'expense' && t.category.toLowerCase() !== 'savings')
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = income - expenses;

    // Get current month transactions for monthly stats
    const monthTransactions = await Transaction.find({
        userId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const monthlyIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpenses = monthTransactions
        .filter(t => t.type === 'expense' && t.category.toLowerCase() !== 'savings')
        .reduce((sum, t) => sum + t.amount, 0);

    return {
        netBalance: Math.round(netBalance),
        monthlyIncome: Math.round(monthlyIncome),
        currentMonthExpenses: Math.round(currentMonthExpenses),
    };
}

/**
 * Calculate total allocated balance across all goals
 * Goals are envelopes - they represent allocations of Net Balance
 */
export async function calculateAllocatedBalance(
    userId: mongoose.Types.ObjectId
): Promise<{
    allocatedBalance: number;
    emergencyAllocated: number;
    nonEmergencyAllocated: number;
}> {
    const goals = await Goal.find({
        userId,
        status: 'active',
    });

    let emergencyAllocated = 0;
    let nonEmergencyAllocated = 0;

    for (const goal of goals) {
        if (isEmergencyFund(goal.title)) {
            emergencyAllocated += goal.currentAmount;
        } else {
            nonEmergencyAllocated += goal.currentAmount;
        }
    }

    const allocatedBalance = emergencyAllocated + nonEmergencyAllocated;

    return {
        allocatedBalance: Math.round(allocatedBalance),
        emergencyAllocated: Math.round(emergencyAllocated),
        nonEmergencyAllocated: Math.round(nonEmergencyAllocated),
    };
}

/**
 * Get complete balance breakdown for a user
 * This is the main function that shows where all the money is
 */
export async function getUserBalance(
    userId: mongoose.Types.ObjectId,
    monthlyEssentials?: number
): Promise<UserBalance> {
    // Get net balance from ledger
    const { netBalance, monthlyIncome, currentMonthExpenses } =
        await calculateNetBalance(userId);

    // Get allocated balance from goals
    const { allocatedBalance, emergencyAllocated, nonEmergencyAllocated } =
        await calculateAllocatedBalance(userId);

    // Calculate free balance (spendable money)
    const freeBalance = Math.max(0, netBalance - allocatedBalance);

    // Calculate emergency breakdown (Core vs Surplus)
    let coreEmergency = emergencyAllocated;
    let surplusEmergency = 0;

    if (monthlyEssentials && monthlyEssentials > 0) {
        const coreOptimal = monthlyEssentials * 6; // 6 months
        coreEmergency = Math.min(emergencyAllocated, coreOptimal);
        surplusEmergency = Math.max(0, emergencyAllocated - coreOptimal);
    }

    return {
        netBalance,
        monthlyIncome,
        currentMonthExpenses,
        allocatedBalance,
        emergencyAllocated,
        nonEmergencyAllocated,
        freeBalance,
        coreEmergency: Math.round(coreEmergency),
        surplusEmergency: Math.round(surplusEmergency),
    };
}

/**
 * Validate if user can allocate a specific amount to a goal
 * Prevents allocating money that doesn't exist
 */
export async function validateAllocation(
    userId: mongoose.Types.ObjectId,
    amount: number
): Promise<AllocationValidation> {
    if (amount <= 0) {
        return {
            canAllocate: false,
            freeBalance: 0,
            requested: amount,
            message: 'Allocation amount must be positive',
        };
    }

    const balance = await getUserBalance(userId);

    if (amount > balance.freeBalance) {
        return {
            canAllocate: false,
            freeBalance: balance.freeBalance,
            requested: amount,
            shortfall: amount - balance.freeBalance,
            message: `Insufficient free balance. You have ₹${balance.freeBalance.toLocaleString('en-IN')} available, but trying to allocate ₹${amount.toLocaleString('en-IN')}.`,
        };
    }

    return {
        canAllocate: true,
        freeBalance: balance.freeBalance,
        requested: amount,
        message: 'Allocation valid',
    };
}

/**
 * Get available balance for contributions
 * This is backward compatible with the old emergency-shield service
 */
export async function getAvailableBalance(
    userId: mongoose.Types.ObjectId
): Promise<{
    monthlyIncome: number;
    currentMonthExpenses: number;
    availableBalance: number;
}> {
    const balance = await getUserBalance(userId);

    return {
        monthlyIncome: balance.monthlyIncome,
        currentMonthExpenses: balance.currentMonthExpenses,
        availableBalance: balance.freeBalance,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const balanceService = {
    calculateNetBalance,
    calculateAllocatedBalance,
    getUserBalance,
    validateAllocation,
    getAvailableBalance,
};

export default balanceService;
