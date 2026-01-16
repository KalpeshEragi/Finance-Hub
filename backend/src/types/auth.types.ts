/**
 * @file auth.types.ts
 * @description TypeScript type definitions for authentication-related data.
 * 
 * This module defines the contracts for:
 * - User data structures
 * - JWT payload format
 * - Request/response DTOs for auth endpoints
 * - Extended Express Request type with authenticated user
 * 
 * @architecture
 * Types are organized into sections:
 * - User: Core user data model
 * - JWT: Token payload structure
 * - DTOs: Data Transfer Objects for API requests/responses
 * - Express Extensions: Extended types for middleware
 */

import { Request } from 'express';
import { Document, Types } from 'mongoose';

// =============================================================================
// USER TYPES
// =============================================================================

/**
 * @interface IUserBase
 * @description Base user properties without Mongoose-specific fields.
 * Used for creating new users and as a foundation for IUser.
 */
export interface IUserBase {
    /** User's email address (unique identifier) */
    email: string;

    /** User's display name */
    name: string;

    /** Hashed password (never expose in API responses) */
    password: string;
}

/**
 * @interface IUser
 * @description Full user document type including Mongoose Document properties.
 * This represents a user document as returned from MongoDB.
 * 
 * @extends Document - Mongoose document methods and properties
 * @extends IUserBase - Core user properties
 */
export interface IUser extends Document, IUserBase {
    /** MongoDB ObjectId */
    _id: Types.ObjectId;

    /** Account creation timestamp */
    createdAt: Date;

    /** Last update timestamp */
    updatedAt: Date;
}

/**
 * @interface IUserPublic
 * @description Public user data (safe to send in API responses).
 * Excludes password and sensitive fields.
 */
export interface IUserPublic {
    /** User ID as string */
    id: string;

    /** User's email address */
    email: string;

    /** User's display name */
    name: string;

    /** Account creation timestamp */
    createdAt: Date;
}

// =============================================================================
// JWT TYPES
// =============================================================================

/**
 * @interface JwtPayload
 * @description Data encoded in the JWT token.
 * Keep this minimal - JWTs should be small.
 */
export interface JwtPayload {
    /** User ID from MongoDB */
    userId: string;

    /** User's email for quick access */
    email: string;

    /** Token issued at timestamp (set by jsonwebtoken) */
    iat?: number;

    /** Token expiration timestamp (set by jsonwebtoken) */
    exp?: number;
}

// =============================================================================
// REQUEST DTOs (Data Transfer Objects)
// =============================================================================

/**
 * @interface RegisterInput
 * @description Input data for user registration.
 * All fields are required for creating a new account.
 */
export interface RegisterInput {
    /** Valid email address */
    email: string;

    /** Password (min 6 characters) */
    password: string;

    /** User's display name */
    name: string;
}

/**
 * @interface LoginInput
 * @description Input data for user login.
 */
export interface LoginInput {
    /** Registered email address */
    email: string;

    /** User's password */
    password: string;
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================

/**
 * @interface AuthResponse
 * @description Response data for successful authentication.
 * Returned by both register and login endpoints.
 */
export interface AuthResponse {
    /** Success indicator */
    success: true;

    /** Response message */
    message: string;

    /** Response data */
    data: {
        /** JWT access token */
        token: string;

        /** Public user data */
        user: IUserPublic;
    };
}

/**
 * @interface UserResponse
 * @description Response data for /auth/me endpoint.
 */
export interface UserResponse {
    /** Success indicator */
    success: true;

    /** Public user data */
    data: IUserPublic;
}

/**
 * @interface LogoutResponse
 * @description Response data for logout endpoint.
 */
export interface LogoutResponse {
    /** Success indicator */
    success: true;

    /** Logout message */
    message: string;
}

// =============================================================================
// EXPRESS REQUEST EXTENSIONS
// =============================================================================

/**
 * @interface AuthenticatedRequest
 * @description Extended Express Request with authenticated user attached.
 * Used by protected routes after auth middleware processes the JWT.
 * 
 * @extends Request - Express Request object
 */
export interface AuthenticatedRequest extends Request {
    /** Authenticated user data (attached by auth middleware) */
    user: {
        /** User ID from JWT */
        userId: string;

        /** User email from JWT */
        email: string;
    };
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * @interface AuthError
 * @description Error response for authentication failures.
 */
export interface AuthError {
    /** Error indicator */
    success: false;

    /** Error message */
    message: string;

    /** Error code for frontend handling */
    code?: 'INVALID_CREDENTIALS' | 'USER_EXISTS' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED';
}
