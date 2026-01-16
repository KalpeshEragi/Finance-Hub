/**
 * @file auth.service.ts
 * @description Authentication service for user registration and login.
 * 
 * This service handles:
 * - User registration with duplicate email check
 * - User login with password verification
 * - Fetching authenticated user data
 * - JWT token generation
 * 
 * @architecture
 * Service layer pattern:
 * - Controllers call services for business logic
 * - Services interact with models (database)
 * - Services are reusable and testable
 */

import User from '../models/user.model';
import { signToken } from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';
import type {
    RegisterInput,
    LoginInput,
    AuthResponse,
    IUserPublic
} from '../types/auth.types';

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * @function register
 * @description Registers a new user account.
 * 
 * Process:
 * 1. Check if email already exists
 * 2. Create new user (password hashed by model hook)
 * 3. Generate JWT token
 * 4. Return token and public user data
 * 
 * @param input - Registration data (email, password, name)
 * @returns Auth response with token and user data
 * @throws AppError if email is already registered
 * 
 * @example
 * const result = await authService.register({
 *   email: 'user@example.com',
 *   password: 'securePass123',
 *   name: 'John Doe',
 * });
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, name } = input;

    // Check for existing user with same email
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
        throw new AppError(
            ERROR_MESSAGES.USER_EXISTS,
            HTTP_STATUS.CONFLICT,
            'USER_EXISTS'
        );
    }

    // Create new user
    const user = await User.create({
        email: email.toLowerCase(),
        password,
        name,
    });

    // Generate JWT token
    const token = signToken({
        userId: user._id.toString(),
        email: user.email,
    });

    // Return response
    return {
        success: true,
        message: 'Account created successfully',
        data: {
            token,
            user: formatUserForResponse(user),
        },
    };
}

// =============================================================================
// LOGIN
// =============================================================================

/**
 * @function login
 * @description Authenticates a user with email and password.
 * 
 * Process:
 * 1. Find user by email
 * 2. Verify password against stored hash
 * 3. Generate JWT token
 * 4. Return token and public user data
 * 
 * @param input - Login credentials (email, password)
 * @returns Auth response with token and user data
 * @throws AppError if credentials are invalid
 * 
 * @example
 * const result = await authService.login({
 *   email: 'user@example.com',
 *   password: 'securePass123',
 * });
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user by email (include password field for comparison)
    const user = await User.findOne({
        email: email.toLowerCase()
    }).select('+password');

    if (!user) {
        throw new AppError(
            ERROR_MESSAGES.INVALID_CREDENTIALS,
            HTTP_STATUS.UNAUTHORIZED,
            'INVALID_CREDENTIALS'
        );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError(
            ERROR_MESSAGES.INVALID_CREDENTIALS,
            HTTP_STATUS.UNAUTHORIZED,
            'INVALID_CREDENTIALS'
        );
    }

    // Generate JWT token
    const token = signToken({
        userId: user._id.toString(),
        email: user.email,
    });

    // Return response
    return {
        success: true,
        message: 'Login successful',
        data: {
            token,
            user: formatUserForResponse(user),
        },
    };
}

// =============================================================================
// GET CURRENT USER
// =============================================================================

/**
 * @function getMe
 * @description Fetches the authenticated user's profile.
 * 
 * @param userId - User ID from JWT token
 * @returns Public user data
 * @throws AppError if user not found
 */
export async function getMe(userId: string): Promise<IUserPublic> {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(
            ERROR_MESSAGES.USER_NOT_FOUND,
            HTTP_STATUS.NOT_FOUND,
            'USER_NOT_FOUND'
        );
    }

    return formatUserForResponse(user);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * @function formatUserForResponse
 * @description Transforms user document to public-safe format.
 * Excludes password and internal fields.
 * 
 * @param user - User document from database
 * @returns Public user object
 */
function formatUserForResponse(user: InstanceType<typeof User>): IUserPublic {
    return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const authService = {
    register,
    login,
    getMe,
};

export default authService;
