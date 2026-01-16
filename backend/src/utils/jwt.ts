/**
 * @file jwt.ts
 * @description JWT (JSON Web Token) utility functions for authentication.
 * 
 * This module provides a wrapper around the jsonwebtoken library with:
 * - Type-safe token signing and verification
 * - Consistent error handling
 * - Environment-based configuration
 * 
 * @architecture
 * JWTs are used for stateless authentication:
 * - Sign: Create token during login/register
 * - Verify: Validate token on protected routes
 * - Payload contains userId and email (minimal data)
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../types/auth.types';

// =============================================================================
// TOKEN SIGNING
// =============================================================================

/**
 * @function signToken
 * @description Creates a signed JWT token with the given payload.
 * 
 * The token is signed using the HS256 algorithm with the secret from
 * environment variables. Token expiration is also configured via env.
 * 
 * @param payload - Data to encode in the token (userId, email)
 * @returns Signed JWT token string
 * 
 * @example
 * const token = signToken({ userId: user._id.toString(), email: user.email });
 * // Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(
        payload,
        env.JWT_SECRET,
        {
            expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
            algorithm: 'HS256',
        }
    );
}

// =============================================================================
// TOKEN VERIFICATION
// =============================================================================

/**
 * @interface VerifyTokenResult
 * @description Result of token verification attempt.
 */
interface VerifyTokenResult {
    /** Whether verification was successful */
    valid: boolean;

    /** Decoded payload if valid */
    payload?: JwtPayload;

    /** Error message if invalid */
    error?: string;

    /** Whether token is expired specifically */
    expired?: boolean;
}

/**
 * @function verifyToken
 * @description Verifies a JWT token and returns the decoded payload.
 * 
 * This function handles all common JWT errors gracefully:
 * - Expired tokens
 * - Invalid signatures
 * - Malformed tokens
 * 
 * @param token - JWT token string to verify
 * @returns Result object with validity status and payload/error
 * 
 * @example
 * const result = verifyToken(token);
 * if (result.valid) {
 *   console.log('User ID:', result.payload.userId);
 * } else {
 *   console.log('Error:', result.error);
 * }
 */
export function verifyToken(token: string): VerifyTokenResult {
    try {
        // Remove 'Bearer ' prefix if present
        const cleanToken = token.startsWith('Bearer ')
            ? token.slice(7)
            : token;

        const decoded = jwt.verify(cleanToken, env.JWT_SECRET) as JwtPayload;

        return {
            valid: true,
            payload: decoded,
        };
    } catch (error) {
        // Handle specific JWT errors
        if (error instanceof jwt.TokenExpiredError) {
            return {
                valid: false,
                error: 'Token has expired',
                expired: true,
            };
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return {
                valid: false,
                error: 'Invalid token',
                expired: false,
            };
        }

        if (error instanceof jwt.NotBeforeError) {
            return {
                valid: false,
                error: 'Token not yet valid',
                expired: false,
            };
        }

        // Unknown error
        return {
            valid: false,
            error: 'Token verification failed',
            expired: false,
        };
    }
}

// =============================================================================
// TOKEN DECODING (WITHOUT VERIFICATION)
// =============================================================================

/**
 * @function decodeToken
 * @description Decodes a JWT token WITHOUT verifying its signature.
 * 
 * ⚠️ WARNING: Only use this for non-security-critical operations like
 * checking token expiration before making a refresh request.
 * 
 * @param token - JWT token string to decode
 * @returns Decoded payload or null if malformed
 */
export function decodeToken(token: string): JwtPayload | null {
    try {
        const cleanToken = token.startsWith('Bearer ')
            ? token.slice(7)
            : token;

        const decoded = jwt.decode(cleanToken) as JwtPayload | null;
        return decoded;
    } catch {
        return null;
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * @function extractTokenFromHeader
 * @description Extracts JWT token from Authorization header.
 * 
 * @param authHeader - The Authorization header value
 * @returns Token string or null if not found/invalid format
 * 
 * @example
 * const token = extractTokenFromHeader('Bearer eyJhbGciOiJIUzI1NiIs...');
 * // Returns: "eyJhbGciOiJIUzI1NiIs..."
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
        return null;
    }

    // Check for Bearer scheme
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    return null;
}

/**
 * @function isTokenExpiringSoon
 * @description Checks if a token will expire within a given window.
 * Useful for implementing token refresh logic.
 * 
 * @param token - JWT token to check
 * @param windowSeconds - Time window in seconds (default: 5 minutes)
 * @returns True if token expires within the window
 */
export function isTokenExpiringSoon(
    token: string,
    windowSeconds: number = 300
): boolean {
    const decoded = decodeToken(token);

    if (!decoded || !decoded.exp) {
        return true; // Treat invalid tokens as expiring
    }

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    return expirationTime - now <= windowMs;
}

export default {
    signToken,
    verifyToken,
    decodeToken,
    extractTokenFromHeader,
    isTokenExpiringSoon,
};
