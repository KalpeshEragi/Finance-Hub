/**
 * @file dashboard.routes.ts
 * @description Dashboard analytics routes.
 * 
 * Routes:
 * - GET /dashboard/summary - Get financial summary
 * - GET /dashboard/trends - Get monthly trends
 * - GET /dashboard/categories - Get category breakdown
 */

import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @route GET /dashboard/summary
 * @description Get dashboard summary for current month
 * @access Private
 */
router.get('/summary', dashboardController.getSummary);

/**
 * @route GET /dashboard/trends
 * @description Get monthly trends
 * @access Private
 */
router.get('/trends', dashboardController.getTrends);

/**
 * @route GET /dashboard/categories
 * @description Get category breakdown
 * @access Private
 */
router.get('/categories', dashboardController.getCategories);

export default router;
