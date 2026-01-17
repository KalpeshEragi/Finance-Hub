/**
 * @file recommendation.controller.ts
 * @description Controller to handle payment recommendation requests.
 */

import { Request, Response, NextFunction } from 'express';
import { RecommendationService } from '../services/recommendation.service';
import { AppError } from '../middleware/error.middleware';

export class RecommendationController {
    /**
     * @route POST /api/transactions/recommend
     * @description Get payment source recommendations based on transaction details
     */
    static async recommend(req: Request, res: Response, next: NextFunction) {
        try {
            const { amount, merchant, category } = req.body;

            if (!amount || !merchant) {
                throw new AppError('Amount and Merchant are required', 400);
            }

            // Default category if not provided
            const safeCategory = category || 'General';

            const recommendations = RecommendationService.recommend(Number(amount), merchant, safeCategory);

            res.json({
                success: true,
                data: recommendations
            });

        } catch (error) {
            next(error);
        }
    }
}
