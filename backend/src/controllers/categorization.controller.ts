/**
 * @file categorization.controller.ts
 * @description AI-powered transaction categorization controller.
 */

import { Request, Response } from 'express';
import { transactionsService } from '../services/transactions.service';
import { aiClient } from '../integrations/ai-engine/ai.client';
import { asyncHandler } from '../middleware/error.middleware';
import { HTTP_STATUS } from '../config/constants';
import { TRANSACTION_CATEGORIES } from '../config/constants';

/**
 * @controller runCategorization
 * @route POST /categorization/run
 * @description Runs AI categorization on transactions.
 * @auth Required
 */
export const runCategorization = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { transactionIds, categorizeAll } = req.body;

    const result = await transactionsService.categorizeTransactions(
        userId,
        categorizeAll ? undefined : transactionIds
    );

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Categorized ${result.updated} transactions`,
        data: result,
    });
});

/**
 * @controller getRules
 * @route GET /categorization/rules
 * @description Gets available categories and categorization info.
 * @auth Required
 */
export const getRules = asyncHandler(async (req: Request, res: Response) => {
    // Return available categories
    const rules = {
        expenseCategories: TRANSACTION_CATEGORIES.EXPENSE,
        incomeCategories: TRANSACTION_CATEGORIES.INCOME,
        aiEnabled: await aiClient.checkHealth(),
        description: 'Categories are assigned automatically using AI when merchant or description is provided.',
    };

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: rules,
    });
});

export const categorizationController = {
    runCategorization,
    getRules,
};

export default categorizationController;
