/**
 * @file transactions.service.ts
 * @description Transaction management service for CRUD operations.
 * 
 * This service handles:
 * - Creating individual transactions
 * - Bulk transaction import
 * - Querying with filters and pagination
 * - Updating and deleting transactions
 * - AI-powered categorization via AI Engine
 * 
 * @architecture
 * All database operations are isolated in this service.
 * Controllers only handle HTTP concerns, not business logic.
 */

import mongoose from 'mongoose';
import Transaction from '../models/transaction.model';
import { aiClient } from '../integrations/ai-engine/ai.client';
import { AppError } from '../middleware/error.middleware';
import { HTTP_STATUS, ERROR_MESSAGES, DEFAULTS } from '../config/constants';
import type {
    ITransaction,
    CreateTransactionInput,
    UpdateTransactionInput,
    TransactionFilters,
    PaginationOptions,
    PaginatedResult,
    ITransactionPublic,
} from '../types/transaction.types';

// =============================================================================
// CREATE OPERATIONS
// =============================================================================

/**
 * @function createTransaction
 * @description Creates a single transaction for a user.
 * 
 * @param userId - User ID
 * @param input - Transaction data
 * @returns Created transaction
 */
export async function createTransaction(
    userId: string,
    input: CreateTransactionInput
): Promise<ITransactionPublic> {
    const transaction = await Transaction.create({
        userId: new mongoose.Types.ObjectId(userId),
        amount: input.amount,
        type: input.type,
        category: input.category || 'Uncategorized',
        description: input.description || '',
        date: input.date ? new Date(input.date) : new Date(),
        merchant: input.merchant || '',
        isAutoCategorized: false,
    });

    return formatTransactionForResponse(transaction);
}

/**
 * @function createBulkTransactions
 * @description Creates multiple transactions from bulk import.
 * 
 * @param userId - User ID
 * @param transactions - Array of transaction data
 * @returns Summary of created/failed transactions
 */
export async function createBulkTransactions(
    userId: string,
    transactions: CreateTransactionInput[]
): Promise<{
    created: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
}> {
    const results = {
        created: 0,
        failed: 0,
        errors: [] as Array<{ row: number; error: string }>,
    };

    // Process each transaction
    for (let i = 0; i < transactions.length; i++) {
        const input = transactions[i];

        try {
            if (!input) {
                throw new Error('Empty transaction data');
            }

            await Transaction.create({
                userId: new mongoose.Types.ObjectId(userId),
                amount: input.amount,
                type: input.type,
                category: input.category || 'Uncategorized',
                description: input.description || '',
                date: input.date ? new Date(input.date) : new Date(),
                merchant: input.merchant || '',
            });

            results.created++;
        } catch (error) {
            results.failed++;
            results.errors.push({
                row: i + 1,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    return results;
}

// =============================================================================
// READ OPERATIONS
// =============================================================================

/**
 * @function getTransactions
 * @description Fetches transactions with optional filters and pagination.
 * 
 * @param userId - User ID
 * @param filters - Optional filters
 * @param pagination - Pagination options
 * @returns Paginated transaction list
 */
export async function getTransactions(
    userId: string,
    filters: TransactionFilters = {},
    pagination: PaginationOptions = {}
): Promise<PaginatedResult<ITransactionPublic>> {
    const {
        page = DEFAULTS.PAGE,
        limit = DEFAULTS.LIMIT,
        sortBy = 'date',
        sortOrder = 'desc',
    } = pagination;

    // Build query
    const query: Record<string, unknown> = { userId };

    // Apply filters
    if (filters.type) {
        query.type = filters.type;
    }

    if (filters.category) {
        query.category = filters.category;
    }

    if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) {
            (query.date as Record<string, Date>).$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            (query.date as Record<string, Date>).$lte = new Date(filters.endDate);
        }
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        query.amount = {};
        if (filters.minAmount !== undefined) {
            (query.amount as Record<string, number>).$gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
            (query.amount as Record<string, number>).$lte = filters.maxAmount;
        }
    }

    if (filters.search) {
        query.$or = [
            { description: { $regex: filters.search, $options: 'i' } },
            { merchant: { $regex: filters.search, $options: 'i' } },
        ];
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute queries
    const [transactions, total] = await Promise.all([
        Transaction.find(query)
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(limit),
        Transaction.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data: transactions.map(formatTransactionForResponse),
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
        },
    };
}

/**
 * @function getTransactionById
 * @description Fetches a single transaction by ID.
 * 
 * @param userId - User ID (for authorization)
 * @param transactionId - Transaction ID
 * @returns Transaction data
 * @throws AppError if not found or not authorized
 */
export async function getTransactionById(
    userId: string,
    transactionId: string
): Promise<ITransactionPublic> {
    const transaction = await Transaction.findOne({
        _id: transactionId,
        userId,
    });

    if (!transaction) {
        throw new AppError(
            ERROR_MESSAGES.TRANSACTION_NOT_FOUND,
            HTTP_STATUS.NOT_FOUND
        );
    }

    return formatTransactionForResponse(transaction);
}

// =============================================================================
// UPDATE OPERATIONS
// =============================================================================

/**
 * @function updateTransaction
 * @description Updates an existing transaction.
 * 
 * @param userId - User ID (for authorization)
 * @param transactionId - Transaction ID
 * @param input - Fields to update
 * @returns Updated transaction
 */
export async function updateTransaction(
    userId: string,
    transactionId: string,
    input: UpdateTransactionInput
): Promise<ITransactionPublic> {
    const updateData: Record<string, unknown> = {};

    // Only include provided fields
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.date !== undefined) updateData.date = new Date(input.date);
    if (input.merchant !== undefined) updateData.merchant = input.merchant;

    const transaction = await Transaction.findOneAndUpdate(
        { _id: transactionId, userId },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!transaction) {
        throw new AppError(
            ERROR_MESSAGES.TRANSACTION_NOT_FOUND,
            HTTP_STATUS.NOT_FOUND
        );
    }

    return formatTransactionForResponse(transaction);
}

// =============================================================================
// DELETE OPERATIONS
// =============================================================================

/**
 * @function deleteTransaction
 * @description Deletes a transaction.
 * 
 * @param userId - User ID (for authorization)
 * @param transactionId - Transaction ID
 */
export async function deleteTransaction(
    userId: string,
    transactionId: string
): Promise<void> {
    const result = await Transaction.deleteOne({
        _id: transactionId,
        userId,
    });

    if (result.deletedCount === 0) {
        throw new AppError(
            ERROR_MESSAGES.TRANSACTION_NOT_FOUND,
            HTTP_STATUS.NOT_FOUND
        );
    }
}

// =============================================================================
// CATEGORIZATION
// =============================================================================

/**
 * @function categorizeTransactions
 * @description Uses AI to categorize uncategorized transactions.
 * 
 * @param userId - User ID
 * @param transactionIds - Optional specific transaction IDs
 * @returns Categorization results
 */
export async function categorizeTransactions(
    userId: string,
    transactionIds?: string[]
): Promise<{ updated: number }> {
    // Build query
    const query: Record<string, unknown> = { userId };

    if (transactionIds && transactionIds.length > 0) {
        query._id = { $in: transactionIds };
    } else {
        query.category = 'Uncategorized';
    }

    // Fetch transactions to categorize
    const transactions = await Transaction.find(query).limit(100);

    if (transactions.length === 0) {
        return { updated: 0 };
    }

    // Prepare for AI categorization
    const inputs = transactions.map(t => ({
        id: t._id.toString(),
        description: t.description || '',
        merchant: t.merchant || '',
        amount: t.amount,
        type: t.type as 'income' | 'expense',
    }));

    // Call AI Engine
    const result = await aiClient.categorize(inputs);

    // Update transactions with categories
    let updated = 0;

    for (const categoryResult of result.results) {
        await Transaction.updateOne(
            { _id: categoryResult.transactionId },
            {
                $set: {
                    category: categoryResult.category,
                    isAutoCategorized: true,
                },
            }
        );
        updated++;
    }

    return { updated };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * @function formatTransactionForResponse
 * @description Transforms transaction document to API response format.
 */
function formatTransactionForResponse(
    transaction: ITransaction
): ITransactionPublic {
    return {
        id: transaction._id.toString(),
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        merchant: transaction.merchant,
        isAutoCategorized: transaction.isAutoCategorized,
        createdAt: transaction.createdAt,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const transactionsService = {
    createTransaction,
    createBulkTransactions,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    categorizeTransactions,
};

export default transactionsService;
