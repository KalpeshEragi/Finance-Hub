import { Request, Response, NextFunction } from 'express';
import RecurringSubscription from '../models/recurring.model';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants';
import { AppError } from '../middleware/error.middleware';

/**
 * Get all recurring subscriptions for the current user
 */
export async function getRecurrings(req: Request, res: Response, next: NextFunction) {
    try {
        const recurrings = await RecurringSubscription.find({ userId: req.user?.userId });
        res.status(HTTP_STATUS.OK).json({ success: true, data: recurrings });
    } catch (error) {
        next(error);
    }
}

/**
 * Create a new recurring subscription
 */
export async function createRecurring(req: Request, res: Response, next: NextFunction) {
    try {
        const recurring = await RecurringSubscription.create({
            ...req.body,
            userId: req.user?.userId,
        });
        res.status(HTTP_STATUS.CREATED).json({ success: true, data: recurring });
    } catch (error) {
        next(error);
    }
}

/**
 * Update a recurring subscription
 */
export async function updateRecurring(req: Request, res: Response, next: NextFunction) {
    try {
        const recurring = await RecurringSubscription.findOneAndUpdate(
            { _id: req.params['id'], userId: req.user?.userId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!recurring) throw new AppError('Subscription not found', HTTP_STATUS.NOT_FOUND);
        res.status(HTTP_STATUS.OK).json({ success: true, data: recurring });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a recurring subscription
 */
export async function deleteRecurring(req: Request, res: Response, next: NextFunction) {
    try {
        const recurring = await RecurringSubscription.findOneAndDelete({
            _id: req.params['id'],
            userId: req.user?.userId,
        });
        if (!recurring) throw new AppError('Subscription not found', HTTP_STATUS.NOT_FOUND);
        res.status(HTTP_STATUS.OK).json({ success: true, message: SUCCESS_MESSAGES.DELETED });
    } catch (error) {
        next(error);
    }
}
