/**
 * @file goals.routes.ts
 * @description Financial goals routes.
 * 
 * Routes:
 * - POST /goals - Create a goal
 * - GET /goals - Get all goals
 * - GET /goals/:id - Get single goal
 * - PUT /goals/:id - Update goal
 * - DELETE /goals/:id - Delete goal
 */

import { Router } from 'express';
import { goalsController } from '../controllers/goals.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All goal routes require authentication
router.use(authenticate);

/**
 * @route POST /goals
 * @description Create a new goal
 * @access Private
 */
router.post('/', goalsController.create);

/**
 * @route GET /goals
 * @description Get all goals
 * @access Private
 */
router.get('/', goalsController.getAll);

/**
 * @route GET /goals/:id
 * @description Get a single goal
 * @access Private
 */
router.get('/:id', goalsController.getById);

/**
 * @route PUT /goals/:id
 * @route PATCH /goals/:id
 * @description Update a goal (supports both PUT and PATCH)
 * @access Private
 */
router.put('/:id', goalsController.update);
router.patch('/:id', goalsController.update);

/**
 * @route DELETE /goals/:id
 * @description Delete a goal
 * @access Private
 */
router.delete('/:id', goalsController.remove);

export default router;
