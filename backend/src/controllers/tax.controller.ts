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
 * @controller updateProfile
 * @route PATCH /tax/profile
 * @description Updates tax profile (deductions).
 * @auth Required
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { deductions } = req.body;

    const result = await taxService.updateDeductions(userId, deductions);

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

export const getRecommendation = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await taxService.getITRRecommendation(userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
    });
});

/**
 * @controller getGuidance
 * @route POST /tax/guidance
 * @description Get rule-based tax guidance.
 * @auth Required
 */
export const getGuidance = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body;

    // Validate required fields
    if (!input.individualType || !input.incomeRange || !input.ageGroup || !input.regimePreference) {
        res.status(400).json({
            success: false,
            message: 'Missing required fields: individualType, incomeRange, ageGroup, regimePreference'
        });
        return;
    }

    const result = taxService.getTaxGuidance(input);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
    });
});

export const taxController = {
    addIncome,
    updateProfile,
    getEstimate,
    getRegime,
    getDeductions,
    getRecommendation,
    getGuidance,
};

export default taxController;
