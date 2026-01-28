/**
 * @file investment-agent.routes.ts
 * @description Routes for Investment Agent.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    getInvestmentReadinessAndAdvice,
    getReadinessOnly,
    getSuggestionsOnly,
} from '../controllers/investment-agent.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/investment/advice
 * @desc    Get complete investment advice (readiness + suggestions + personalized advice)
 * @access  Private
 */
router.get('/advice', getInvestmentReadinessAndAdvice);

/**
 * @route   GET /api/investment/readiness
 * @desc    Get investment readiness assessment only
 * @access  Private
 */
router.get('/readiness', getReadinessOnly);

/**
 * @route   GET /api/investment/suggestions
 * @desc    Get investment suggestions only
 * @access  Private
 */
router.get('/suggestions', getSuggestionsOnly);

export default router;
