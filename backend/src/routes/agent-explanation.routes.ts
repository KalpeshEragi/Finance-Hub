/**
 * @file agent-explanation.routes.ts
 * @description Routes for Agent Explanation Layer.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    getExplanation,
    getExplanationFallback,
} from '../controllers/agent-explanation.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /agent/explanation
 * @desc    Get full agent explanation with LLM enhancement
 * @access  Private
 */
router.get('/explanation', getExplanation);

/**
 * @route   GET /agent/explanation/template
 * @desc    Get template-based explanation (no LLM)
 * @access  Private
 */
router.get('/explanation/template', getExplanationFallback);

export default router;
