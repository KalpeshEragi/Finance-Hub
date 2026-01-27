/**
 * @file budget.routes.ts
 * @description Budget management routes.
 * 
 * Routes:
 * - POST /budget - Create or update budget
 * - GET /budget - Get all budgets
 * - GET /budget/summary - Get budget summary with spending
 * - GET /budget/alerts - Check and get budget alerts
 */

import { Router } from 'express';
import { budgetController } from '../controllers/budget.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All budget routes require authentication
router.use(authenticate);

/**
 * @route POST /budget
 * @description Create or update a budget
 * @access Private
 */
router.post('/', budgetController.create);

/**
 * @route GET /budget
 * @description Get all budgets for current period
 * @access Private
 */
router.get('/', budgetController.getAll);

/**
 * @route GET /budget/summary
 * @description Get budget summary with spending info
 * @access Private
 */
router.get('/summary', budgetController.getSummary);

/**
 * @route GET /budget/alerts
 * @description Check budgets and generate alerts
 * @access Private
 */
router.get('/alerts', budgetController.getAlerts);

/**
 * @route GET /budget/advice
 * @description Get AI-powered budget advice
 * @access Private
 */
router.get('/advice', budgetController.getAdvice);

export default router;
