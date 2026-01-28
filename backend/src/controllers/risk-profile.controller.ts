/**
 * @file risk-profile.controller.ts
 * @description Controller for Risk Profile Classification endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { getUserRiskProfile } from '../services/risk-profile.service';
import { HTTP_STATUS } from '../config/constants';

/**
 * @function getFullRiskProfile
 * @description Get complete risk profile with all signals and recommendations.
 * 
 * @route GET /risk-profile
 */
export async function getFullRiskProfile(
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

        const profile = await getUserRiskProfile(userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * @function getRiskProfileSummary
 * @description Get lightweight risk profile summary (for UI tags).
 * 
 * @route GET /risk-profile/summary
 */
export async function getRiskProfileSummary(
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

        const profile = await getUserRiskProfile(userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                profile: profile.profile,
                confidence: profile.confidence,
                topReason: profile.reasoning[0] || 'Classification based on financial behavior.',
            },
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * @function getRiskProfileSignals
 * @description Get just the signal breakdown (for detailed analysis).
 * 
 * @route GET /risk-profile/signals
 */
export async function getRiskProfileSignals(
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

        const profile = await getUserRiskProfile(userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                profile: profile.profile,
                signals: profile.signals,
                dataQuality: profile.dataQuality,
            },
        });
    } catch (error) {
        return next(error);
    }
}

export const riskProfileController = {
    getFullRiskProfile,
    getRiskProfileSummary,
    getRiskProfileSignals,
};

export default riskProfileController;
