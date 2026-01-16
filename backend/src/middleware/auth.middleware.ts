/**
 * @file auth.middleware.ts
 * @description JWT authentication middleware for protected routes.
 * 
 * This middleware:
 * - Extracts JWT from Authorization header
 * - Verifies token validity and expiration
 * - Attaches user data to request object
 * - Rejects unauthorized requests
 * 
 * @architecture
 * Used as route-level middleware on protected endpoints.
 * After successful authentication, req.user contains { userId, email }.
 * 
 * @usage
 * import { authenticate } from './middleware/auth.middleware';
 * router.get('/protected', authenticate, controller.protectedAction);
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';
import type { AuthenticatedRequest, JwtPayload } from '../types/auth.types';

// =============================================================================
// TYPE EXTENSIONS
// =============================================================================

/**
 * Extend Express Request to include user property.
 * This allows TypeScript to recognize req.user after authentication.
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
            };
        }
    }
}

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

/**
 * @function authenticate
 * @description Middleware that verifies JWT and attaches user to request.
 * 
 * Expected header format: `Authorization: Bearer <token>`
 * 
 * On success: Attaches `req.user` with { userId, email } and calls next()
 * On failure: Returns 401 Unauthorized with error message
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * 
 * @example
 * // In route definition:
 * router.get('/me', authenticate, (req, res) => {
 *   res.json({ userId: req.user.userId });
 * });
 */
export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
                code: 'NO_TOKEN',
            });
            return;
        }

        // Verify token
        const result = verifyToken(token);

        if (!result.valid || !result.payload) {
            // Handle expired tokens specifically
            if (result.expired) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: ERROR_MESSAGES.TOKEN_EXPIRED,
                    code: 'TOKEN_EXPIRED',
                });
                return;
            }

            // Handle other token errors
            res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.TOKEN_INVALID,
                code: 'INVALID_TOKEN',
            });
            return;
        }

        // Attach user data to request
        req.user = {
            userId: result.payload.userId,
            email: result.payload.email,
        };

        // Continue to next middleware/handler
        next();
    } catch (error) {
        // Unexpected errors during authentication
        console.error('Authentication middleware error:', error);

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.INTERNAL_ERROR,
        });
    }
}

// =============================================================================
// OPTIONAL AUTHENTICATION MIDDLEWARE
// =============================================================================

/**
 * @function optionalAuth
 * @description Middleware that attempts to authenticate but doesn't require it.
 * 
 * Useful for routes that behave differently for authenticated users
 * but still work for anonymous users.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function optionalAuth(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (token) {
            const result = verifyToken(token);

            if (result.valid && result.payload) {
                req.user = {
                    userId: result.payload.userId,
                    email: result.payload.email,
                };
            }
        }

        // Always continue, even without valid token
        next();
    } catch {
        // Ignore errors and continue without auth
        next();
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * @function requireUser
 * @description Type guard that asserts request has authenticated user.
 * Use this in handlers after authenticate middleware to get proper typing.
 * 
 * @param req - Express request object
 * @returns True if user is authenticated
 * @throws Error if called without authentication
 * 
 * @example
 * router.get('/profile', authenticate, (req, res) => {
 *   if (requireUser(req)) {
 *     // req.user is now properly typed as AuthenticatedRequest
 *     const userId = req.user.userId;
 *   }
 * });
 */
export function requireUser(req: Request): req is AuthenticatedRequest {
    if (!req.user || !req.user.userId) {
        throw new Error('User not authenticated - this should not happen after authenticate middleware');
    }
    return true;
}

/**
 * @function getUserId
 * @description Safely extracts userId from authenticated request.
 * 
 * @param req - Express request object
 * @returns User ID string
 * @throws Error if not authenticated
 */
export function getUserId(req: Request): string {
    if (!req.user?.userId) {
        throw new Error('User not authenticated');
    }
    return req.user.userId;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default authenticate;
