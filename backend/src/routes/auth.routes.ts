/**
 * @file auth.routes.ts
 * @description Authentication routes.
 * 
 * Routes:
 * - POST /auth/register - Create new account
 * - POST /auth/login - Login and get token
 * - GET /auth/me - Get current user (protected)
 * - POST /auth/logout - Logout (protected)
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, authSchemas } from '../middleware/validate.middleware';

const router = Router();

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * @route POST /auth/register
 * @description Register a new user
 * @access Public
 */
router.post('/register', validate(authSchemas.register), authController.register);

/**
 * @route POST /auth/login
 * @description Login with email and password
 * @access Public
 */
router.post('/login', validate(authSchemas.login), authController.login);

// =============================================================================
// PROTECTED ROUTES
// =============================================================================

/**
 * @route GET /auth/me
 * @description Get current authenticated user
 * @access Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route POST /auth/logout
 * @description Logout current user
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

export default router;
