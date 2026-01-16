/**
 * @file transaction.model.ts
 * @description Mongoose model for Transaction documents.
 * 
 * Transactions are the primary data entity tracking all financial movements:
 * - Income (salary, freelance, investments, etc.)
 * - Expenses (food, transport, bills, etc.)
 * 
 * @architecture
 * Each transaction belongs to a user (via userId) and contains:
 * - Amount and type (income/expense)
 * - Category for classification
 * - Date of transaction
 * - Optional description and merchant info
 * - Auto-categorization flag for AI-categorized entries
 */

import mongoose, { Schema, Model } from 'mongoose';
import { TRANSACTION_CATEGORIES, TRANSACTION_TYPES } from '../config/constants';
import type { ITransaction, TransactionType } from '../types/transaction.types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * @type TransactionModel
 * @description Model type with static methods (if needed in future).
 */
type TransactionModel = Model<ITransaction>;

// =============================================================================
// SCHEMA DEFINITION
// =============================================================================

/**
 * @constant transactionSchema
 * @description Mongoose schema for Transaction documents.
 */
const transactionSchema = new Schema<ITransaction, TransactionModel>(
    {
        /**
         * Reference to the user who owns this transaction.
         * Required for data isolation between users.
         */
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true, // Index for fast user-based queries
        },

        /**
         * Transaction amount (positive number).
         * Whether it's income or expense is determined by the type field.
         */
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0.01, 'Amount must be greater than 0'],
            // Round to 2 decimal places
            set: (val: number) => Math.round(val * 100) / 100,
        },

        /**
         * Transaction type: 'income' or 'expense'.
         */
        type: {
            type: String,
            required: [true, 'Transaction type is required'],
            enum: {
                values: [TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE],
                message: 'Type must be either income or expense',
            },
        },

        /**
         * Category for classification.
         * Can be user-assigned or AI-assigned.
         */
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
            maxlength: [50, 'Category cannot exceed 50 characters'],
        },

        /**
         * Optional description or note about the transaction.
         */
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: '',
        },

        /**
         * Date when the transaction occurred.
         * Defaults to current date if not provided.
         */
        date: {
            type: Date,
            required: [true, 'Transaction date is required'],
            default: Date.now,
            index: true, // Index for date-range queries
        },

        /**
         * Merchant or source name (e.g., "Amazon", "Employer Inc").
         * Used for AI categorization and display.
         */
        merchant: {
            type: String,
            trim: true,
            maxlength: [200, 'Merchant name cannot exceed 200 characters'],
            default: '',
        },

        /**
         * Flag indicating if this transaction was auto-categorized by AI.
         * Useful for tracking categorization accuracy.
         */
        isAutoCategorized: {
            type: Boolean,
            default: false,
        },
    },
    {
        /**
         * Schema options
         */
        timestamps: true,
        collection: 'transactions',

        toJSON: {
            transform: (_doc: unknown, ret: Record<string, unknown>) => {
                ret['id'] = ret['_id'];
                delete ret['_id'];
                delete ret['__v'];
                return ret;
            },
        },
    }
);

// =============================================================================
// COMPOUND INDEXES
// =============================================================================

/**
 * @description Compound index for common query patterns.
 * User + Date for fetching user's transactions in a date range.
 */
transactionSchema.index({ userId: 1, date: -1 });

/**
 * @description Index for category-based analytics.
 * User + Category for spending by category queries.
 */
transactionSchema.index({ userId: 1, category: 1 });

/**
 * @description Index for type-based filtering.
 * User + Type for income vs expense queries.
 */
transactionSchema.index({ userId: 1, type: 1, date: -1 });

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * @static findByUser
 * @description Finds all transactions for a specific user.
 */
transactionSchema.statics.findByUser = function (
    userId: string,
    options: { limit?: number; skip?: number; sort?: Record<string, 1 | -1> } = {}
) {
    const { limit = 100, skip = 0, sort = { date: -1 } } = options;

    return this.find({ userId })
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * @method toPublicJSON
 * @description Returns a public-safe representation.
 */
transactionSchema.methods.toPublicJSON = function () {
    return {
        id: this._id.toString(),
        amount: this.amount,
        type: this.type,
        category: this.category,
        description: this.description,
        date: this.date,
        merchant: this.merchant,
        isAutoCategorized: this.isAutoCategorized,
        createdAt: this.createdAt,
    };
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

/**
 * @constant Transaction
 * @description Mongoose model for Transaction documents.
 * 
 * @example
 * // Create a new expense
 * const transaction = await Transaction.create({
 *   userId: user._id,
 *   amount: 45.99,
 *   type: 'expense',
 *   category: 'Food & Dining',
 *   description: 'Dinner at restaurant',
 *   merchant: 'Pizza Place',
 * });
 * 
 * // Get expenses for a month
 * const expenses = await Transaction.find({
 *   userId,
 *   type: 'expense',
 *   date: { $gte: startOfMonth, $lte: endOfMonth },
 * });
 */
const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);

export default Transaction;
export { Transaction, transactionSchema };
