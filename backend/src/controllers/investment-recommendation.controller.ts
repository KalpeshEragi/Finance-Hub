/**
 * @file investment-recommendation.controller.ts
 * @description Controller for Investment Recommendation Engine endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { generateRecommendations } from '../services/recommendation-engine.service';
import { HTTP_STATUS } from '../config/constants';

/**
 * @function getInvestmentRecommendations
 * @description Get personalized investment recommendations.
 * 
 * @route GET /investment-recommendations
 */
export async function getInvestmentRecommendations(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const result = await generateRecommendations(userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error('[InvestmentRecommendations] Error:', error.message || error);
        console.error('[InvestmentRecommendations] Stack:', error.stack);
        return next(error);
    }
}

/**
 * @function getInvestmentRecommendationsSummary
 * @description Get lightweight summary for UI display.
 * 
 * @route GET /investment-recommendations/summary
 */
export async function getInvestmentRecommendationsSummary(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const result = await generateRecommendations(userId);

        // Return lightweight summary
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                recommendations: result.recommendations.map(r => ({
                    name: r.name,
                    allocation: r.allocation,
                    monthlyAmount: r.monthlyAmount,
                    priority: r.priority,
                })),
                summary: result.summary,
                riskProfile: result.riskProfile,
                readinessStatus: result.readinessStatus,
            },
        });
    } catch (error) {
        return next(error);
    }
}

export const investmentRecommendationController = {
    getInvestmentRecommendations,
    getInvestmentRecommendationsSummary,
};

export default investmentRecommendationController;
