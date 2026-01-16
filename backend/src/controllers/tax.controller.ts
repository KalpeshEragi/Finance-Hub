/**
 * @file tax.controller.ts
 * @description Tax estimation and management controller.
 */

import { Request, Response } from 'express';
import { taxService } from '../services/tax.service';
import { asyncHandler } from '../middleware/error.middleware';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants';

/**
 * @controller addIncome
 * @route POST /tax/income
 * @description Adds or updates income in tax profile.
 * @auth Required
 */
export const addIncome = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { type, amount, description, period } = req.body;

    const result = await taxService.addIncome(userId, {
        type,
        amount,
        description,
        period,
    });

    res.status(HTTP_STATUS.OK).json(result);
});

/**
 * @controller getEstimate
 * @route GET /tax/estimate
 * @description Gets tax estimates for both regimes.
 * @auth Required
 */
export const getEstimate = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await taxService.getEstimate(userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
    });
});

/**
 * @controller getRegime
 * @route GET /tax/regime
 * @description Gets current regime with comparison.
 * @auth Required
 */
export const getRegime = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await taxService.getRegime(userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
    });
});

/**
 * @controller getDeductions
 * @route GET /tax/deductions
 * @description Gets deductions with limits and suggestions.
 * @auth Required
 */
export const getDeductions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await taxService.getDeductions(userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
    });
});

export const taxController = {
    addIncome,
    getEstimate,
    getRegime,
    getDeductions,
};

export default taxController;
