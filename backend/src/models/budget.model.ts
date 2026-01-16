/**
 * @file budget.model.ts
 * @description Mongoose model for Budget documents.
 * 
 * Budgets allow users to set spending limits for categories.
 * The system tracks spending against these limits and generates alerts.
 * 
 * @architecture
 * Each budget entry represents a spending limit for:
 * - A specific category (e.g., "Food & Dining")
 * - A specific month/year period
 * - A specific user
 * 
 * The combination of userId + category + month + year must be unique.
 */

import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import { TRANSACTION_CATEGORIES } from '../config/constants';

// =============================================================================
// INTERFACE DEFINITIONS
// =============================================================================

/**
 * @interface IBudgetBase
 * @description Base budget properties.
 */
export interface IBudgetBase {
    /** Reference to the user */
    userId: Types.ObjectId;

    /** Category this budget applies to */
    category: string;

    /** Spending limit amount */
    limit: number;

    /** Month (1-12) */
    month: number;

    /** Year (e.g., 2024) */
    year: number;

    /** Current amount spent (calculated field, not stored) */
    spent?: number;
}

/**
 * @interface IBudget
 * @description Full budget document type.
 */
export interface IBudget extends Document, IBudgetBase {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// SCHEMA DEFINITION
// =============================================================================

/**
 * @constant budgetSchema
 * @description Mongoose schema for Budget documents.
 */
const budgetSchema = new Schema<IBudget>(
    {
        /**
         * Reference to the user who created this budget.
         */
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },

        /**
         * Category this budget applies to.
         * Should match one of the predefined expense categories.
         */
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
            validate: {
                validator: function (value: string): boolean {
                    // Allow predefined categories or custom ones
                    return value.length > 0 && value.length <= 50;
                },
                message: 'Invalid category',
            },
        },

        /**
         * Spending limit for this category in this period.
         * Cannot be negative.
         */
        limit: {
            type: Number,
            required: [true, 'Budget limit is required'],
            min: [0, 'Budget limit cannot be negative'],
            set: (val: number) => Math.round(val * 100) / 100,
        },

        /**
         * Month (1-12) this budget applies to.
         */
        month: {
            type: Number,
            required: [true, 'Month is required'],
            min: [1, 'Month must be between 1 and 12'],
            max: [12, 'Month must be between 1 and 12'],
        },

        /**
         * Year this budget applies to.
         */
        year: {
            type: Number,
            required: [true, 'Year is required'],
            min: [2020, 'Year must be 2020 or later'],
            max: [2100, 'Year must be before 2100'],
        },
    },
    {
        timestamps: true,
        collection: 'budgets',

        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// =============================================================================
// INDEXES
// =============================================================================

/**
 * @description Compound unique index to prevent duplicate budgets.
 * Each user can only have one budget per category per month/year.
 */
budgetSchema.index(
    { userId: 1, category: 1, month: 1, year: 1 },
    { unique: true }
);

/**
 * @description Index for fetching all budgets for a user in a period.
 */
budgetSchema.index({ userId: 1, year: 1, month: 1 });

// =============================================================================
// VIRTUAL FIELDS
// =============================================================================

/**
 * @virtual period
 * @description Returns the budget period as a formatted string.
 */
budgetSchema.virtual('period').get(function () {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${monthNames[this.month - 1]} ${this.year}`;
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * @method calculateUsagePercentage
 * @description Calculates what percentage of the budget has been used.
 * 
 * @param spent - Amount spent in this category
 * @returns Percentage used (can exceed 100%)
 */
budgetSchema.methods.calculateUsagePercentage = function (spent: number): number {
    if (this.limit === 0) return 0;
    return Math.round((spent / this.limit) * 100);
};

/**
 * @method isExceeded
 * @description Checks if spending has exceeded the budget.
 * 
 * @param spent - Amount spent in this category
 * @returns True if over budget
 */
budgetSchema.methods.isExceeded = function (spent: number): boolean {
    return spent > this.limit;
};

/**
 * @method isNearLimit
 * @description Checks if spending is approaching the limit (>80%).
 * 
 * @param spent - Amount spent in this category
 * @returns True if at or above 80% of limit
 */
budgetSchema.methods.isNearLimit = function (spent: number): boolean {
    return spent >= this.limit * 0.8;
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

/**
 * @constant Budget
 * @description Mongoose model for Budget documents.
 * 
 * @example
 * // Create a budget
 * const budget = await Budget.create({
 *   userId: user._id,
 *   category: 'Food & Dining',
 *   limit: 15000,
 *   month: 1,
 *   year: 2024,
 * });
 * 
 * // Get all budgets for current month
 * const budgets = await Budget.find({
 *   userId,
 *   month: currentMonth,
 *   year: currentYear,
 * });
 */
const Budget = mongoose.model<IBudget>('Budget', budgetSchema);

export default Budget;
export { Budget, budgetSchema, IBudget, IBudgetBase };
