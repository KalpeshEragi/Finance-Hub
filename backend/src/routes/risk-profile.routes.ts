/**
 * @file risk-profile.routes.ts
 * @description Routes for Risk Profile Classification.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    getFullRiskProfile,
    getRiskProfileSummary,
    getRiskProfileSignals,
} from '../controllers/risk-profile.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /risk-profile
 * @desc    Get complete risk profile with all signals and recommendations
 * @access  Private
 */
router.get('/', getFullRiskProfile);

/**
 * @route   GET /risk-profile/summary
 * @desc    Get lightweight summary for UI tags
 * @access  Private
 */
router.get('/summary', getRiskProfileSummary);

/**
 * @route   GET /risk-profile/signals
 * @desc    Get detailed signal breakdown
 * @access  Private
 */
router.get('/signals', getRiskProfileSignals);

export default router;
