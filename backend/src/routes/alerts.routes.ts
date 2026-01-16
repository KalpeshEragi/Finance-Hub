/**
 * @file alerts.routes.ts
 * @description User alerts/notifications routes.
 * 
 * Routes:
 * - GET /alerts - Get user alerts
 * - POST /alerts/read - Mark alerts as read
 */

import { Router } from 'express';
import { alertsController } from '../controllers/alerts.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All alert routes require authentication
router.use(authenticate);

/**
 * @route GET /alerts
 * @description Get user alerts
 * @access Private
 */
router.get('/', alertsController.getAll);

/**
 * @route POST /alerts/read
 * @description Mark alerts as read
 * @access Private
 */
router.post('/read', alertsController.markAsRead);

export default router;
