/**
 * @file dashboard.controller.ts
 * @description Dashboard analytics controller.
 */

import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { asyncHandler } from '../middleware/error.middleware';
import { HTTP_STATUS } from '../config/constants';

/**
 * @controller getSummary
 * @route GET /dashboard/summary
 * @description Gets dashboard summary for current month.
 * @auth Required
 */
export const getSummary = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const summary = await dashboardService.getSummary(userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: summary,
    });
});

/**
 * @controller getTrends
 * @route GET /dashboard/trends
 * @description Gets monthly trends for last N months.
 * @auth Required
 */
export const getTrends = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const months = req.query.months ? parseInt(req.query.months as string) : 6;

    const trends = await dashboardService.getTrends(userId, months);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: trends,
    });
});

/**
 * @controller getCategories
 * @route GET /dashboard/categories
 * @description Gets category breakdown for current month.
 * @auth Required
 */
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const type = (req.query.type as 'income' | 'expense') || 'expense';

    const categories = await dashboardService.getCategoryBreakdown(userId, type);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: categories,
    });
});

export const dashboardController = {
    getSummary,
    getTrends,
    getCategories,
};

export default dashboardController;
