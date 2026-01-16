/**
 * @file auth.controller.ts
 * @description Authentication controller for handling auth-related HTTP requests.
 * 
 * Controllers are responsible for:
 * - Extracting data from requests
 * - Calling appropriate service methods
 * - Sending HTTP responses
 * 
 * All business logic is in services, not controllers.
 */

import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../middleware/error.middleware';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants';

// =============================================================================
// REGISTER
// =============================================================================

/**
 * @controller register
 * @route POST /auth/register
 * @description Creates a new user account.
 * 
 * @body { email: string, password: string, name: string }
 * @returns { success: true, message: string, data: { token, user } }
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    const result = await authService.register({ email, password, name });

    res.status(HTTP_STATUS.CREATED).json(result);
});

// =============================================================================
// LOGIN
// =============================================================================

/**
 * @controller login
 * @route POST /auth/login
 * @description Authenticates user and returns JWT token.
 * 
 * @body { email: string, password: string }
 * @returns { success: true, message: string, data: { token, user } }
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.status(HTTP_STATUS.OK).json(result);
});

// =============================================================================
// GET ME
// =============================================================================

/**
 * @controller getMe
 * @route GET /auth/me
 * @description Returns current authenticated user's profile.
 * @auth Required
 * 
 * @returns { success: true, data: user }
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await authService.getMe(userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: user,
    });
});

// =============================================================================
// LOGOUT
// =============================================================================

/**
 * @controller logout
 * @route POST /auth/logout
 * @description Logs out user (client-side token invalidation).
 * @auth Required
 * 
 * @note JWT tokens are stateless, so logout is handled client-side
 * by removing the token. This endpoint exists for API completeness.
 * 
 * @returns { success: true, message: string }
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
    // JWT is stateless - client should discard token
    // In production, you might maintain a token blacklist

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    });
});

// =============================================================================
// EXPORTS
// =============================================================================

export const authController = {
    register,
    login,
    getMe,
    logout,
};

export default authController;
