/**
 * @file error.middleware.ts
 * @description Global error handling middleware for Express.
 * 
 * This module provides:
 * - Centralized error handling for all routes
 * - Consistent error response format
 * - Development vs production error details
 * - 404 Not Found handler
 * 
 * @architecture
 * Error handling strategy:
 * 1. Route handlers throw errors or pass them to next()
 * 2. notFoundHandler catches undefined routes
 * 3. errorHandler catches all errors and formats responses
 * 
 * Must be registered LAST in middleware chain.
 */

import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';
import mongoose from 'mongoose';

// =============================================================================
// CUSTOM ERROR CLASS
// =============================================================================

/**
 * @class AppError
 * @description Custom error class with HTTP status code.
 * 
 * Use this to throw errors with specific status codes from
 * controllers and services.
 * 
 * @example
 * throw new AppError('User not found', 404);
 * throw new AppError('Email already registered', 409);
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code?: string;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code?: string
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true; // Distinguishes from programming errors

        // Capture stack trace, excluding constructor call
        Error.captureStackTrace(this, this.constructor);
    }
}

// =============================================================================
// NOT FOUND HANDLER
// =============================================================================

/**
 * @function notFoundHandler
 * @description Middleware that handles requests to undefined routes.
 * 
 * Must be registered after all valid routes.
 * Creates a 404 error and passes it to the error handler.
 * 
 * @param req - Express request object
 * @param _res - Express response object (unused)
 * @param next - Express next function
 */
export function notFoundHandler(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const error = new AppError(
        `Route not found: ${req.method} ${req.originalUrl}`,
        HTTP_STATUS.NOT_FOUND,
        'ROUTE_NOT_FOUND'
    );
    next(error);
}

// =============================================================================
// GLOBAL ERROR HANDLER
// =============================================================================

/**
 * @function errorHandler
 * @description Global error handling middleware.
 * 
 * Catches all errors thrown in the application and returns
 * a consistent JSON error response.
 * 
 * Error handling by type:
 * - AppError: Uses provided statusCode and message
 * - Mongoose ValidationError: 400 Bad Request with field errors
 * - Mongoose CastError: 400 Bad Request (invalid ObjectId)
 * - Mongoose DuplicateKey (11000): 409 Conflict
 * - JWT Errors: 401 Unauthorized
 * - Other: 500 Internal Server Error
 * 
 * @param err - Error object
 * @param _req - Express request object
 * @param res - Express response object
 * @param _next - Express next function
 */
export function errorHandler(
    err: Error | AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Log error for debugging
    console.error('❌ Error:', err);

    // Default error response
    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let message = ERROR_MESSAGES.INTERNAL_ERROR;
    let code: string | undefined;
    let details: unknown = undefined;

    // ===========================================================================
    // Handle known error types
    // ===========================================================================

    if (err instanceof AppError) {
        // Custom application error
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;
    } else if (err.name === 'ValidationError' && err instanceof mongoose.Error.ValidationError) {
        // Mongoose validation error
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = ERROR_MESSAGES.VALIDATION_ERROR;
        code = 'VALIDATION_ERROR';

        // Extract field-level errors
        details = Object.keys(err.errors).reduce<Record<string, string>>((acc, key) => {
            const error = err.errors[key];
            if (error) {
                acc[key] = error.message;
            }
            return acc;
        }, {});
    } else if (err.name === 'CastError') {
        // Invalid MongoDB ObjectId
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = ERROR_MESSAGES.INVALID_OBJECT_ID;
        code = 'INVALID_ID';
    } else if ((err as { code?: number }).code === 11000) {
        // MongoDB duplicate key error
        statusCode = HTTP_STATUS.CONFLICT;
        message = 'Duplicate entry - this resource already exists';
        code = 'DUPLICATE_KEY';
    } else if (err.name === 'JsonWebTokenError') {
        // JWT error
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        message = ERROR_MESSAGES.TOKEN_INVALID;
        code = 'INVALID_TOKEN';
    } else if (err.name === 'TokenExpiredError') {
        // JWT expired
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        message = ERROR_MESSAGES.TOKEN_EXPIRED;
        code = 'TOKEN_EXPIRED';
    }

    // ===========================================================================
    // Build error response
    // ===========================================================================

    interface ErrorResponse {
        success: false;
        message: string;
        code?: string;
        details?: unknown;
        stack?: string;
    }

    const errorResponse: ErrorResponse = {
        success: false,
        message,
    };

    if (code) {
        errorResponse.code = code;
    }

    if (details) {
        errorResponse.details = details;
    }

    // Include stack trace in development
    if (process.env['NODE_ENV'] !== 'production' && err.stack) {
        errorResponse.stack = err.stack;
    }

    // Send response
    res.status(statusCode).json(errorResponse);
}

// =============================================================================
// ASYNC HANDLER WRAPPER
// =============================================================================

/**
 * @function asyncHandler
 * @description Wraps async route handlers to catch promise rejections.
 * 
 * Express doesn't automatically catch errors from async functions,
 * so this wrapper ensures they're passed to the error handler.
 * 
 * @param fn - Async route handler function
 * @returns Wrapped function that catches errors
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default { errorHandler, notFoundHandler, asyncHandler, AppError };
