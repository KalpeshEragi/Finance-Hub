/**
 * @file env.ts
 * @description Environment configuration loader and validator.
 * 
 * This module is responsible for loading environment variables from .env file
 * and providing type-safe access to configuration values throughout the application.
 * 
 * @architecture
 * - Uses dotenv to load .env file at application startup
 * - Validates required environment variables
 * - Exports a frozen configuration object to prevent runtime modifications
 * - Should be imported before any other module that needs configuration
 */

import dotenv from 'dotenv';

// =============================================================================
// LOAD ENVIRONMENT VARIABLES
// =============================================================================
// Load .env file into process.env
// This must happen before accessing any environment variables
dotenv.config();

// =============================================================================
// CONFIGURATION INTERFACE
// =============================================================================

/**
 * @interface EnvConfig
 * @description Type definition for all environment configuration values.
 * Ensures type safety when accessing configuration throughout the application.
 */
interface EnvConfig {
    /** Server port number */
    PORT: number;

    /** Current environment: 'development', 'production', or 'test' */
    NODE_ENV: string;

    /** MongoDB connection string */
    MONGODB_URI: string;

    /** Secret key for JWT token signing */
    JWT_SECRET: string;

    /** JWT token expiration time (e.g., '7d', '24h') */
    JWT_EXPIRES_IN: string;

    /** Base URL for the AI Engine service */
    AI_ENGINE_URL: string;
}

// =============================================================================
// ENVIRONMENT VARIABLE EXTRACTION
// =============================================================================

/**
 * @function getEnvVar
 * @description Safely retrieves an environment variable with optional default value.
 * Throws an error if a required variable is missing.
 * 
 * @param key - The environment variable name
 * @param defaultValue - Optional default value if not set
 * @returns The environment variable value
 * @throws Error if variable is not set and no default provided
 */
function getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key];

    if (value === undefined || value === '') {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
}

/**
 * @function getEnvVarAsNumber
 * @description Retrieves an environment variable and parses it as a number.
 * 
 * @param key - The environment variable name
 * @param defaultValue - Optional default numeric value
 * @returns The parsed numeric value
 * @throws Error if the value cannot be parsed as a number
 */
function getEnvVarAsNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];

    if (value === undefined || value === '') {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Missing required environment variable: ${key}`);
    }

    const parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${key} must be a valid number, got: ${value}`);
    }

    return parsed;
}

// =============================================================================
// CONFIGURATION OBJECT
// =============================================================================

/**
 * @constant env
 * @description Frozen configuration object containing all environment settings.
 * 
 * This object is frozen to prevent accidental modifications at runtime.
 * All modules should import this object to access configuration values.
 * 
 * @example
 * import { env } from './config/env';
 * console.log(`Server running on port ${env.PORT}`);
 */
export const env: Readonly<EnvConfig> = Object.freeze({
    PORT: getEnvVarAsNumber('PORT', 3000),
    NODE_ENV: getEnvVar('NODE_ENV', 'development'),
    MONGODB_URI: getEnvVar('MONGODB_URI', 'mongodb://localhost:27017/hackvengers'),
    JWT_SECRET: getEnvVar('JWT_SECRET'),
    JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '7d'),
    AI_ENGINE_URL: getEnvVar('AI_ENGINE_URL', 'http://localhost:5000'),
});

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

/**
 * @function validateEnv
 * @description Validates that all required environment variables are properly set.
 * Logs warnings for potentially insecure configurations in production.
 * 
 * @throws Error if critical environment variables are missing or invalid
 */
export function validateEnv(): void {
    // Validate JWT_SECRET strength in production
    if (env.NODE_ENV === 'production') {
        if (env.JWT_SECRET.length < 32) {
            console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters in production');
        }

        if (env.JWT_SECRET.includes('dev') || env.JWT_SECRET.includes('secret')) {
            console.warn('⚠️  WARNING: JWT_SECRET appears to be a development key');
        }
    }

    // Log configuration status (not sensitive values)
    console.log('✅ Environment configuration loaded successfully');
    console.log(`   - Environment: ${env.NODE_ENV}`);
    console.log(`   - Port: ${env.PORT}`);
    console.log(`   - MongoDB: ${env.MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
}

export default env;
