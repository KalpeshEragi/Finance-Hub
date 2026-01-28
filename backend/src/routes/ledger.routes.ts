/**
 * @file ledger.routes.ts
 * @description Routes for Ledger Aggregation API.
 * 
 * All routes require authentication.
 */

import { Router } from 'express';
import {
    getSnapshot,
    getRiskIndicators,
    getSummary,
} from '../controllers/ledger.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /ledger/snapshot
 * @description Complete ledger snapshot for Investment Agent
 */
router.get('/snapshot', getSnapshot);

/**
 * @route GET /ledger/risk-indicators
 * @description Risk indicators only (lightweight)
 */
router.get('/risk-indicators', getRiskIndicators);

/**
 * @route GET /ledger/summary
 * @description Quick summary metrics
 */
router.get('/summary', getSummary);

export default router;
