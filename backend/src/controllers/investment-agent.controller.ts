/**
 * @file investment-agent.controller.ts
 * @description Controller for Investment Agent endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { getInvestmentAdvice } from '../services/investment-agent.service';
import { HTTP_STATUS } from '../config/constants';

/**
 * @function getInvestmentReadinessAndAdvice
 * @description Get investment readiness assessment and personalized advice.
 * 
 * @route GET /api/investment/advice
 */
export async function getInvestmentReadinessAndAdvice(
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

        const advice = await getInvestmentAdvice(userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: advice,
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * @function getReadinessOnly
 * @description Get just the investment readiness assessment (lightweight).
 * 
 * @route GET /api/investment/readiness
 */
export async function getReadinessOnly(
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

        const advice = await getInvestmentAdvice(userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                status: advice.readiness.status,
                score: advice.readiness.score,
                reasons: advice.readiness.reasons,
                blockers: advice.readiness.blockers,
            },
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * @function getSuggestionsOnly
 * @description Get just the investment suggestions.
 * 
 * @route GET /api/investment/suggestions
 */
export async function getSuggestionsOnly(
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

        const advice = await getInvestmentAdvice(userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                readinessStatus: advice.readiness.status,
                suggestions: advice.suggestions,
                sipRecommendation: advice.personalizedAdvice.recommendationsBlock.sipRecommendation,
                monthlyCapacity: advice.personalizedAdvice.recommendationsBlock.monthlyInvestmentCapacity,
            },
        });
    } catch (error) {
        return next(error);
    }
}

export const investmentAgentController = {
    getInvestmentReadinessAndAdvice,
    getReadinessOnly,
    getSuggestionsOnly,
};

export default investmentAgentController;
