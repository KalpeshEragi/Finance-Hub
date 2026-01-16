/**
 * @file budget.controller.ts
 * @description Budget management controller.
 */

import { Request, Response } from 'express';
import { budgetService } from '../services/budget.service';
import { asyncHandler } from '../middleware/error.middleware';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants';

/**
 * @controller create
 * @route POST /budget
 * @description Creates or updates a budget.
 * @auth Required
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { category, limit, month, year } = req.body;

    const budget = await budgetService.createOrUpdateBudget(userId, {
        category,
        limit,
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear(),
    });

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.CREATED,
        data: budget,
    });
});

/**
 * @controller getAll
 * @route GET /budget
 * @description Gets all budgets for current/specified period.
 * @auth Required
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const budgets = await budgetService.getBudgets(userId, month, year);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: budgets,
    });
});

/**
 * @controller getSummary
 * @route GET /budget/summary
 * @description Gets budget summary with spending info.
 * @auth Required
 */
export const getSummary = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const summary = await budgetService.getBudgetSummary(userId, month, year);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: summary,
    });
});

/**
 * @controller getAlerts
 * @route GET /budget/alerts
 * @description Checks budgets and returns/creates alerts.
 * @auth Required
 */
export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await budgetService.checkBudgetAlerts(userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
    });
});

export const budgetController = {
    create,
    getAll,
    getSummary,
    getAlerts,
};

export default budgetController;
