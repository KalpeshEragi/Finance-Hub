/**
 * @file credit.controller.ts
 * @description Credit health score controller.
 * 
 * @important All responses must include the label
 * "Estimated / Simulated Credit Health Score"
 */

import { Request, Response } from 'express';
import { creditService } from '../services/credit.service';
import { asyncHandler } from '../middleware/error.middleware';
import { HTTP_STATUS } from '../config/constants';

/**
 * @controller getScore
 * @route GET /credit/score
 * @description Gets user's simulated credit health score.
 * @auth Required
 */
export const getScore = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await creditService.getScore(userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
    });
});

/**
 * @controller getFactors
 * @route GET /credit/factors
 * @description Gets factors affecting credit health.
 * @auth Required
 */
export const getFactors = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await creditService.getFactors(userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
    });
});

/**
 * @controller getRecommendations
 * @route GET /credit/recommendations
 * @description Gets recommendations for improving credit health.
 * @auth Required
 */
export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await creditService.getRecommendations(userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
    });
});

export const creditController = {
    getScore,
    getFactors,
    getRecommendations,
};

export default creditController;
