/**
 * @file investment-recommendation.routes.ts
 * @description Routes for Investment Recommendation Engine.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    getInvestmentRecommendations,
    getInvestmentRecommendationsSummary,
} from '../controllers/investment-recommendation.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /investment-recommendations
 * @desc    Get full investment recommendations with reasoning
 * @access  Private
 */
router.get('/', getInvestmentRecommendations);

/**
 * @route   GET /investment-recommendations/summary
 * @desc    Get lightweight summary for UI display
 * @access  Private
 */
router.get('/summary', getInvestmentRecommendationsSummary);

export default router;
