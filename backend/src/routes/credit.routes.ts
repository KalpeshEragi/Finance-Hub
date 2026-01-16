/**
 * @file credit.routes.ts
 * @description Credit health score routes.
 * 
 * Routes:
 * - GET /credit/score - Get simulated credit health score
 * - GET /credit/factors - Get score factors
 * - GET /credit/recommendations - Get improvement recommendations
 */

import { Router } from 'express';
import { creditController } from '../controllers/credit.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All credit routes require authentication
router.use(authenticate);

/**
 * @route GET /credit/score
 * @description Get simulated credit health score
 * @access Private
 */
router.get('/score', creditController.getScore);

/**
 * @route GET /credit/factors
 * @description Get factors affecting credit health
 * @access Private
 */
router.get('/factors', creditController.getFactors);

/**
 * @route GET /credit/recommendations
 * @description Get recommendations for improvement
 * @access Private
 */
router.get('/recommendations', creditController.getRecommendations);

export default router;
