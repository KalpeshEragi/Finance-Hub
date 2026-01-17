/**
 * @file transactions.routes.ts
 * @description Transaction management routes.
 * 
 * Routes:
 * - POST /transactions - Create single transaction
 * - POST /transactions/bulk - Bulk import transactions
 * - POST /transactions/import - Import from AI Engine statement parser
 * - GET /transactions - List with filters and pagination
 * - GET /transactions/:id - Get single transaction
 * - PUT /transactions/:id - Update transaction
 * - DELETE /transactions/:id - Delete transaction
 */

import { Router } from 'express';
import { transactionsController } from '../controllers/transactions.controller';
import { ParserController } from '../controllers/parser.controller';
import { RecommendationController } from '../controllers/recommendation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// =============================================================================
// PUBLIC ROUTES (Demo/AI)
// =============================================================================

/**
 * @route POST /transactions/parse
 * @description Parse unstructured transaction text
 * @access Public
 */
router.post('/parse', ParserController.parseText);

/**
 * @route POST /transactions/recommend
 * @description Get best payment source recommendation
 * @access Public
 */
router.post('/recommend', RecommendationController.recommend);

// =============================================================================
// PROTECTED ROUTES
// =============================================================================

// All transaction routes require authentication
router.use(authenticate);

/**
 * @route POST /transactions
 * @description Create a new transaction
 * @access Private
 */
router.post('/', transactionsController.create);

/**
 * @route POST /transactions/bulk
 * @description Bulk import transactions (JSON array or CSV)
 * @access Private
 */
router.post('/bulk', transactionsController.createBulk);


/**
 * @route POST /transactions/import
 * @description Import parsed transactions from AI Engine statement parser
 * @access Private
 * @body { source: 'bank_statement', transactions: [...] }
 */
router.post('/import', transactionsController.importStatement);

/**
 * @route GET /transactions
 * @description Get all transactions with optional filters
 * @access Private
 */
router.get('/', transactionsController.getAll);

// =============================================================================
// ITEM ROUTES
// =============================================================================

/**
 * @route GET /transactions/:id
 * @description Get a single transaction
 * @access Private
 */
router.get('/:id', transactionsController.getById);

/**
 * @route PUT /transactions/:id
 * @description Update a transaction
 * @access Private
 */
router.put('/:id', transactionsController.update);

/**
 * @route DELETE /transactions/:id
 * @description Delete a transaction
 * @access Private
 */
router.delete('/:id', transactionsController.remove);

export default router;
