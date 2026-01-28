/**
 * @file balance.routes.ts
 * @description API routes for balance and allocation tracking
 * 
 * Routes:
 * - GET /balance/summary - Get complete balance breakdown (net, allocated, free)
 * - GET /balance/available - Get free balance available for allocations
 */

import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware';
import balanceService from '../services/balance.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =============================================================================
// GET BALANCE SUMMARY
// =============================================================================

/**
 * @route GET /balance/summary
 * @description Get complete balance breakdown
 * @access Private
 */
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?.userId);
        const balance = await balanceService.getUserBalance(userId);

        res.json({
            success: true,
            data: balance,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /balance/available
 * @description Get free balance available for allocations
 * @access Private
 */
router.get('/available', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?.userId);
        const balance = await balanceService.getUserBalance(userId);

        res.json({
            success: true,
            data: {
                freeBalance: balance.freeBalance,
                netBalance: balance.netBalance,
                allocatedBalance: balance.allocatedBalance,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
