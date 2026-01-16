/**
 * @file alerts.controller.ts
 * @description User alerts/notifications controller.
 */

import { Request, Response } from 'express';
import { alertsService } from '../services/alerts.service';
import { asyncHandler } from '../middleware/error.middleware';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants';

/**
 * @controller getAll
 * @route GET /alerts
 * @description Gets user alerts.
 * @auth Required
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const unreadOnly = req.query.unread === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const result = await alertsService.getAlerts(userId, { unreadOnly, limit });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.alerts,
        unreadCount: result.unreadCount,
    });
});

/**
 * @controller markAsRead
 * @route POST /alerts/read
 * @description Marks alerts as read.
 * @auth Required
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { alertIds } = req.body;

    const result = await alertsService.markAsRead(userId, alertIds);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.ALERTS_MARKED_READ,
        data: result,
    });
});

export const alertsController = {
    getAll,
    markAsRead,
};

export default alertsController;
