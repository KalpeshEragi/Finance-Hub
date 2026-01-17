/**
 * @file tax.routes.ts
 * @description Tax estimation routes.
 * 
 * Routes:
 * - POST /tax/income - Add/update income
 * - GET /tax/estimate - Get tax estimates for both regimes
 * - GET /tax/regime - Get current regime with comparison
 * - GET /tax/deductions - Get deductions with limits
 */

import { Router } from 'express';
import { taxController } from '../controllers/tax.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All tax routes require authentication
router.use(authenticate);

/**
 * @route POST /tax/income
 * @description Add or update income
 * @access Private
 */
router.post('/income', taxController.addIncome);

/**
 * @route PATCH /tax/profile
 * @description Update tax profile (deductions)
 * @access Private
 */
router.patch('/profile', taxController.updateProfile);

/**
 * @route GET /tax/estimate
 * @description Get tax estimates for both regimes
 * @access Private
 */
router.get('/estimate', taxController.getEstimate);

/**
 * @route GET /tax/regime
 * @description Get current regime with comparison
 * @access Private
 */
router.get('/regime', taxController.getRegime);

/**
 * @route GET /tax/deductions
 * @description Get deductions with limits and suggestions
 * @access Private
 */
router.get('/deductions', taxController.getDeductions);

/**
 * @route GET /tax/recommendation
 * @description Get ITR form recommendation
 * @access Private
 */
router.get('/recommendation', taxController.getRecommendation);

/**
 * @route POST /tax/guidance
 * @description Get rule-based tax guidance
 * @access Private
 */
router.post('/guidance', taxController.getGuidance);

export default router;
