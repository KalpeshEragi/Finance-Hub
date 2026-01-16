/**
 * @file transactions.controller.ts
 * @description Transaction management controller.
 * 
 * Handles CRUD operations for transactions and bulk import.
 */

import { Request, Response } from 'express';
import { transactionsService } from '../services/transactions.service';
import { asyncHandler } from '../middleware/error.middleware';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants';
import { parseCSV } from '../utils/csv';

// =============================================================================
// CREATE
// =============================================================================

/**
 * @controller create
 * @route POST /transactions
 * @description Creates a new transaction.
 * @auth Required
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const transaction = await transactionsService.createTransaction(userId, req.body);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.CREATED,
        data: transaction,
    });
});

/**
 * @controller createBulk
 * @route POST /transactions/bulk
 * @description Imports multiple transactions.
 * @auth Required
 */
export const createBulk = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { transactions, csv } = req.body;

    let transactionsToCreate = transactions;

    // If CSV content provided, parse it
    if (csv && typeof csv === 'string') {
        const parseResult = parseCSV(csv);
        transactionsToCreate = parseResult.data.map(row => ({
            amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
            type: row.type?.toLowerCase() === 'income' ? 'income' : 'expense',
            category: row.category || 'Uncategorized',
            description: row.description || '',
            date: row.date,
            merchant: row.merchant || '',
        }));
    }

    const result = await transactionsService.createBulkTransactions(userId, transactionsToCreate);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: `Created ${result.created} transactions`,
        data: result,
    });
});

// =============================================================================
// READ
// =============================================================================

/**
 * @controller getAll
 * @route GET /transactions
 * @description Gets transactions with optional filters and pagination.
 * @auth Required
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Extract filters and pagination from query
    const filters = {
        type: req.query.type as 'income' | 'expense' | undefined,
        category: req.query.category as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        search: req.query.search as string | undefined,
    };

    const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as 'date' | 'amount' | 'createdAt' | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await transactionsService.getTransactions(userId, filters, pagination);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
    });
});

/**
 * @controller getById
 * @route GET /transactions/:id
 * @description Gets a single transaction by ID.
 * @auth Required
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const transaction = await transactionsService.getTransactionById(userId, id as string);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: transaction,
    });
});

// =============================================================================
// UPDATE
// =============================================================================

/**
 * @controller update
 * @route PUT /transactions/:id
 * @description Updates an existing transaction.
 * @auth Required
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const transaction = await transactionsService.updateTransaction(userId, id as string, req.body);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.UPDATED,
        data: transaction,
    });
});

// =============================================================================
// DELETE
// =============================================================================

/**
 * @controller remove
 * @route DELETE /transactions/:id
 * @description Deletes a transaction.
 * @auth Required
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await transactionsService.deleteTransaction(userId, id as string);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DELETED,
    });
});

// =============================================================================
// EXPORTS
// =============================================================================

export const transactionsController = {
    create,
    createBulk,
    getAll,
    getById,
    update,
    remove,
};

export default transactionsController;
