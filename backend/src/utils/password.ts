/**
 * @file password.ts
 * @description Password hashing and verification utilities using bcrypt.
 * 
 * This module provides secure password handling:
 * - One-way hashing for storage
 * - Comparison for authentication
 * - Configurable salt rounds
 * 
 * @security
 * - Uses bcrypt for industry-standard password hashing
 * - Salt is automatically generated and stored with hash
 * - Comparison is timing-safe to prevent timing attacks
 */

import bcrypt from 'bcrypt';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * @constant SALT_ROUNDS
 * @description Number of salt rounds for bcrypt hashing.
 * 
 * Higher values = more secure but slower.
 * - 10: ~100ms per hash (good for most cases)
 * - 12: ~300ms per hash (more secure)
 * - 14+: Consider for high-security applications
 * 
 * Note: This affects both registration and login performance.
 */
const SALT_ROUNDS = 10;

// =============================================================================
// HASHING
// =============================================================================

/**
 * @function hashPassword
 * @description Creates a secure hash of a plaintext password.
 * 
 * Uses bcrypt which automatically:
 * - Generates a cryptographically random salt
 * - Incorporates the salt into the hash
 * - Produces a 60-character output string
 * 
 * @param password - Plaintext password to hash
 * @returns Promise resolving to hashed password string
 * 
 * @example
 * const hash = await hashPassword('mySecurePassword123');
 * // Returns: "$2b$10$N9qo8uLOickgx2ZMRZoMy..."
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

// =============================================================================
// VERIFICATION
// =============================================================================

/**
 * @function comparePassword
 * @description Compares a plaintext password against a stored hash.
 * 
 * This function is timing-safe, meaning it takes the same amount of
 * time regardless of whether the password is correct or not. This
 * prevents timing attacks that could reveal password information.
 * 
 * @param password - Plaintext password to verify
 * @param hash - Stored bcrypt hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 * 
 * @example
 * const isValid = await comparePassword('myPassword', storedHash);
 * if (isValid) {
 *   console.log('Login successful');
 * }
 */
export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * @function validatePasswordStrength
 * @description Validates password meets minimum security requirements.
 * 
 * Current requirements (hackathon MVP):
 * - Minimum 6 characters
 * 
 * For production, consider adding:
 * - Uppercase letter requirement
 * - Lowercase letter requirement
 * - Number requirement
 * - Special character requirement
 * - Common password check
 * 
 * @param password - Password to validate
 * @returns Object with validity and any error messages
 * 
 * @example
 * const result = validatePasswordStrength('abc');
 * // Returns: { valid: false, errors: ['Password must be at least 6 characters'] }
 */
export function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Minimum length check
    if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    // Maximum length check (bcrypt has a 72-byte limit)
    if (password.length > 72) {
        errors.push('Password must be less than 72 characters');
    }

    // Optional: Additional strength checks (commented for MVP)
    /*
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
  
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
  
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    */

    return {
        valid: errors.length === 0,
        errors,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
    hashPassword,
    comparePassword,
    validatePasswordStrength,
};
