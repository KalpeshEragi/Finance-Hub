/**
 * @file emergency-shield.routes.ts
 * @description Emergency Safety Shield API routes.
 * 
 * The Emergency Shield is the central financial safety controller.
 * It determines what features are available based on the user's
 * emergency fund status.
 * 
 * Routes:
 * - GET /emergency-shield/status - Get complete shield status
 * - GET /emergency-shield/feature-access/:feature - Check if feature is unlocked
 * - POST /emergency-shield/funds - Create new emergency fund
 * - POST /emergency-shield/funds/:id/contribute - Add contribution
 * - GET /emergency-shield/funds/:id/can-delete - Check if fund can be deleted
 */

import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware';
import emergencyShieldService from '../services/emergency-shield.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =============================================================================
// GET SHIELD STATUS
// =============================================================================

/**
 * @route GET /emergency-shield/status
 * @description Get complete emergency shield status
 * @access Private
 */
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?.userId);
        const status = await emergencyShieldService.getEmergencyShieldStatus(userId);

        res.json({
            success: true,
            data: status,
        });
    } catch (error) {
        next(error);
    }
});

// =============================================================================
// FEATURE ACCESS CHECK
// =============================================================================

/**
 * @route GET /emergency-shield/feature-access/:feature
 * @description Check if a specific feature is unlocked
 * @param feature - 'invest' | 'prepay_loans' | 'non_emergency_goals'
 * @access Private
 */
router.get('/feature-access/:feature', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?.userId);
        const feature = req.params['feature'] as 'invest' | 'prepay_loans' | 'non_emergency_goals';

        if (!['invest', 'prepay_loans', 'non_emergency_goals'].includes(feature)) {
            res.status(400).json({
                success: false,
                error: 'Invalid feature. Must be: invest, prepay_loans, or non_emergency_goals',
            });
            return;
        }

        const access = await emergencyShieldService.checkFeatureAccess(userId, feature);

        res.json({
            success: true,
            data: access,
        });
    } catch (error) {
        next(error);
    }
});

// =============================================================================
// EMERGENCY FUNDS MANAGEMENT
// =============================================================================

/**
 * @route POST /emergency-shield/funds
 * @description Create a new emergency fund
 * @access Private
 */
router.post('/funds', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?.userId);
        const { name, type, targetAmount, initialAmount } = req.body;

        if (!name || !type || !targetAmount) {
            res.status(400).json({
                success: false,
                error: 'Name, type, and targetAmount are required',
            });
            return;
        }

        const validTypes = ['medical', 'job_loss', 'home', 'vehicle', 'general'];
        if (!validTypes.includes(type)) {
            res.status(400).json({
                success: false,
                error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
            });
            return;
        }

        const fund = await emergencyShieldService.createEmergencyFund(userId, {
            name,
            type,
            targetAmount: Number(targetAmount),
            initialAmount: initialAmount ? Number(initialAmount) : 0,
        });

        res.status(201).json({
            success: true,
            data: fund,
            message: 'Emergency fund created successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /emergency-shield/funds/:id/contribute
 * @description Add a contribution to an emergency fund
 * @access Private
 */
router.post('/funds/:id/contribute', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?.userId);
        const fundId = req.params['id'];
        const { amount } = req.body;

        if (!fundId) {
            res.status(400).json({
                success: false,
                error: 'Fund ID is required',
            });
            return;
        }

        if (!amount || Number(amount) <= 0) {
            res.status(400).json({
                success: false,
                error: 'Amount must be a positive number',
            });
            return;
        }

        const result = await emergencyShieldService.contributeToEmergencyFund(
            userId,
            String(fundId),
            Number(amount)
        );

        // Check if there was an error (insufficient funds, not found, etc)
        if (result.error || !result.fund) {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to add contribution',
            });
            return;
        }

        // Get updated shield status
        const shieldStatus = await emergencyShieldService.getEmergencyShieldStatus(userId);

        res.json({
            success: true,
            data: {
                fund: result.fund,
                shieldStatus,
            },
            message: `₹${Number(amount).toLocaleString('en-IN')} added to ${result.fund.name}`,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /emergency-shield/funds/:id/can-delete
 * @description Check if an emergency fund can be deleted
 * @access Private
 */
router.get('/funds/:id/can-delete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?.userId);
        const fundId = req.params['id'];

        if (!fundId) {
            res.status(400).json({
                success: false,
                error: 'Fund ID is required',
            });
            return;
        }

        const result = await emergencyShieldService.canDeleteEmergencyFund(userId, String(fundId));

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

// =============================================================================
// SURPLUS MANAGEMENT (TWO-TIER SYSTEM)
// =============================================================================

/**
 * @route GET /emergency-shield/surplus/recommendations
 * @description Get smart recommendations for surplus emergency funds (>6 months)
 * @access Private
 */
router.get('/surplus/recommendations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?.userId);
        const recommendations = await emergencyShieldService.getSurplusRecommendations(userId);

        res.json({
            success: true,
            data: recommendations,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /emergency-shield/surplus/reallocate
 * @description Reallocate surplus emergency funds to another goal or loan
 * @body { fromEmergencyId, toGoalId, amount, targetType }
 * @access Private
 */
router.post('/surplus/reallocate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?.userId);
        const { fromEmergencyId, toGoalId, amount, targetType } = req.body;

        if (!fromEmergencyId || !toGoalId || !amount) {
            res.status(400).json({
                success: false,
                error: 'fromEmergencyId, toGoalId, and amount are required',
            });
            return;
        }

        const result = await emergencyShieldService.reallocateSurplus(
            userId,
            fromEmergencyId,
            toGoalId,
            Number(amount),
            targetType === 'loan' ? 'loan' : 'goal'
        );

        if (!result.success) {
            res.status(400).json({
                success: false,
                error: result.error,
            });
            return;
        }

        // Get updated shield status after reallocation
        const shieldStatus = await emergencyShieldService.getEmergencyShieldStatus(userId);

        res.json({
            success: true,
            data: {
                shieldStatus,
            },
            message: 'Surplus reallocated successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /emergency-shield/funds/reallocate-internal
 * @description Reallocate money between emergency funds (internal redistribution)
 * @body { fromFundId, toFundId, amount }
 * @access Private
 */
router.post('/funds/reallocate-internal', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?.userId);
        const { fromFundId, toFundId, amount } = req.body;

        if (!fromFundId || !toFundId || !amount) {
            res.status(400).json({
                success: false,
                error: 'fromFundId, toFundId, and amount are required',
            });
            return;
        }

        const result = await emergencyShieldService.reallocateWithinEmergency(
            userId,
            String(fromFundId),
            String(toFundId),
            Number(amount)
        );

        if (!result.success) {
            res.status(400).json({
                success: false,
                error: result.error,
            });
            return;
        }

        const shieldStatus = await emergencyShieldService.getEmergencyShieldStatus(userId);

        res.json({
            success: true,
            data: {
                shieldStatus,
            },
            message: 'Emergency allocations updated successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
