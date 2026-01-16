/**
 * @file goals.controller.ts
 * @description Financial goals management controller.
 */

import { Request, Response } from 'express';
import { goalsService } from '../services/goals.service';
import { asyncHandler } from '../middleware/error.middleware';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants';

/**
 * @controller create
 * @route POST /goals
 * @description Creates a new financial goal.
 * @auth Required
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const goal = await goalsService.createGoal(userId, req.body);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.CREATED,
        data: goal,
    });
});

/**
 * @controller getAll
 * @route GET /goals
 * @description Gets all goals for user.
 * @auth Required
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const status = req.query.status as 'active' | 'completed' | 'cancelled' | undefined;

    const goals = await goalsService.getGoals(userId, { status });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: goals,
    });
});

/**
 * @controller getById
 * @route GET /goals/:id
 * @description Gets a single goal.
 * @auth Required
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const goal = await goalsService.getGoalById(userId, id as string);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: goal,
    });
});

/**
 * @controller update
 * @route PUT /goals/:id
 * @description Updates a goal.
 * @auth Required
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const goal = await goalsService.updateGoal(userId, id as string, req.body);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.UPDATED,
        data: goal,
    });
});

/**
 * @controller remove
 * @route DELETE /goals/:id
 * @description Deletes a goal.
 * @auth Required
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await goalsService.deleteGoal(userId, id as string);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DELETED,
    });
});

export const goalsController = {
    create,
    getAll,
    getById,
    update,
    remove,
};

export default goalsController;
