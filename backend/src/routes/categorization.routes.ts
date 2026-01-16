/**
 * @file categorization.routes.ts
 * @description AI-powered categorization routes.
 * 
 * Routes:
 * - POST /categorization/run - Run AI categorization
 * - GET /categorization/rules - Get categorization info
 */

import { Router } from 'express';
import { categorizationController } from '../controllers/categorization.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All categorization routes require authentication
router.use(authenticate);

/**
 * @route POST /categorization/run
 * @description Run AI categorization on transactions
 * @access Private
 */
router.post('/run', categorizationController.runCategorization);

/**
 * @route GET /categorization/rules
 * @description Get available categories and rules
 * @access Private
 */
router.get('/rules', categorizationController.getRules);

export default router;
