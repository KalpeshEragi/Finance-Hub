import { Request, Response, NextFunction } from 'express';
import InvestmentHolding from '../models/investment.model';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants';
import { AppError } from '../middleware/error.middleware';

/**
 * Get all investment holdings for the current user
 */
export async function getInvestments(req: Request, res: Response, next: NextFunction) {
    try {
        const investments = await InvestmentHolding.find({ userId: req.user?.userId });

        // Calculate totals for summary
        const totalInvested = investments.reduce((sum, i) => sum + (i.averagePrice * i.quantity), 0);
        const currentValue = investments.reduce((sum, i) => sum + (i.currentPrice * i.quantity), 0);
        const totalReturns = currentValue - totalInvested;
        const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                holdings: investments,
                summary: {
                    totalInvested,
                    currentValue,
                    totalReturns,
                    returnsPercentage
                }
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Create a new investment holding
 */
export async function createInvestment(req: Request, res: Response, next: NextFunction) {
    try {
        const investment = await InvestmentHolding.create({
            ...req.body,
            userId: req.user?.userId,
        });
        res.status(HTTP_STATUS.CREATED).json({ success: true, data: investment });
    } catch (error) {
        next(error);
    }
}

/**
 * Update an investment holding
 */
export async function updateInvestment(req: Request, res: Response, next: NextFunction) {
    try {
        const investment = await InvestmentHolding.findOneAndUpdate(
            { _id: req.params['id'], userId: req.user?.userId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!investment) throw new AppError('Investment holding not found', HTTP_STATUS.NOT_FOUND);
        res.status(HTTP_STATUS.OK).json({ success: true, data: investment });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete an investment holding
 */
export async function deleteInvestment(req: Request, res: Response, next: NextFunction) {
    try {
        const investment = await InvestmentHolding.findOneAndDelete({
            _id: req.params['id'],
            userId: req.user?.userId,
        });
        if (!investment) throw new AppError('Investment holding not found', HTTP_STATUS.NOT_FOUND);
        res.status(HTTP_STATUS.OK).json({ success: true, message: SUCCESS_MESSAGES.DELETED });
    } catch (error) {
        next(error);
    }
}
