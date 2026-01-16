/**
 * @file validate.middleware.ts
 * @description Request body validation middleware factory.
 * 
 * This module provides a flexible validation system that:
 * - Validates request body against defined rules
 * - Returns detailed error messages for invalid fields
 * - Supports custom validation functions
 * - Is type-safe with TypeScript
 * 
 * @architecture
 * Uses a schema-based approach (similar to Joi/Yup but simpler).
 * Each field can have multiple validation rules.
 * Validation happens before the request reaches the controller.
 */

import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';
import mongoose from 'mongoose';

// =============================================================================
// VALIDATION RULE TYPES
// =============================================================================

/**
 * @interface ValidationRule
 * @description A single validation rule for a field.
 */
interface ValidationRule {
    /** Rule type identifier */
    type: 'required' | 'email' | 'minLength' | 'maxLength' | 'min' | 'max' | 'enum' | 'pattern' | 'custom' | 'objectId';

    /** Rule parameter (e.g., minLength value) */
    value?: unknown;

    /** Custom error message */
    message?: string;

    /** Custom validation function */
    validator?: (value: unknown) => boolean;
}

/**
 * @interface FieldSchema
 * @description Validation schema for a single field.
 */
interface FieldSchema {
    /** Array of validation rules */
    rules: ValidationRule[];

    /** Whether to trim string values */
    trim?: boolean;

    /** Whether to convert to lowercase */
    lowercase?: boolean;
}

/**
 * @interface ValidationSchema
 * @description Complete validation schema for request body.
 */
export interface ValidationSchema {
    [field: string]: FieldSchema;
}

/**
 * @interface ValidationError
 * @description Validation error for a single field.
 */
interface ValidationError {
    field: string;
    message: string;
}

// =============================================================================
// VALIDATION MIDDLEWARE FACTORY
// =============================================================================

/**
 * @function validate
 * @description Creates a validation middleware for the given schema.
 * 
 * @param schema - Validation schema object
 * @returns Express middleware function
 * 
 * @example
 * const registerSchema: ValidationSchema = {
 *   email: {
 *     rules: [
 *       { type: 'required' },
 *       { type: 'email' },
 *     ],
 *     trim: true,
 *     lowercase: true,
 *   },
 *   password: {
 *     rules: [
 *       { type: 'required' },
 *       { type: 'minLength', value: 6 },
 *     ],
 *   },
 *   name: {
 *     rules: [
 *       { type: 'required' },
 *       { type: 'maxLength', value: 100 },
 *     ],
 *     trim: true,
 *   },
 * };
 * 
 * router.post('/register', validate(registerSchema), authController.register);
 */
export function validate(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors: ValidationError[] = [];
        const body = req.body as Record<string, unknown>;

        // Process each field in schema
        for (const [field, fieldSchema] of Object.entries(schema)) {
            let value = body[field];

            // Apply transformations
            if (typeof value === 'string') {
                if (fieldSchema.trim) {
                    value = value.trim();
                    body[field] = value;
                }
                if (fieldSchema.lowercase) {
                    value = value.toLowerCase();
                    body[field] = value;
                }
            }

            // Apply validation rules
            for (const rule of fieldSchema.rules) {
                const error = validateRule(field, value, rule);
                if (error) {
                    errors.push(error);
                    break; // Stop at first error for this field
                }
            }
        }

        // Update request body with transformed values
        req.body = body;

        // Check for errors
        if (errors.length > 0) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: ERROR_MESSAGES.VALIDATION_ERROR,
                errors: errors.reduce<Record<string, string>>((acc, err) => {
                    acc[err.field] = err.message;
                    return acc;
                }, {}),
            });
            return;
        }

        next();
    };
}

// =============================================================================
// VALIDATION RULE PROCESSOR
// =============================================================================

/**
 * @function validateRule
 * @description Validates a value against a single rule.
 * 
 * @param field - Field name
 * @param value - Value to validate
 * @param rule - Validation rule
 * @returns ValidationError if invalid, null if valid
 */
function validateRule(
    field: string,
    value: unknown,
    rule: ValidationRule
): ValidationError | null {
    switch (rule.type) {
        case 'required':
            if (value === undefined || value === null || value === '') {
                return {
                    field,
                    message: rule.message || `${field} is required`,
                };
            }
            break;

        case 'email':
            if (typeof value === 'string' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return {
                        field,
                        message: rule.message || 'Please provide a valid email address',
                    };
                }
            }
            break;

        case 'minLength':
            if (typeof value === 'string' && typeof rule.value === 'number') {
                if (value.length < rule.value) {
                    return {
                        field,
                        message: rule.message || `${field} must be at least ${rule.value} characters`,
                    };
                }
            }
            break;

        case 'maxLength':
            if (typeof value === 'string' && typeof rule.value === 'number') {
                if (value.length > rule.value) {
                    return {
                        field,
                        message: rule.message || `${field} must be at most ${rule.value} characters`,
                    };
                }
            }
            break;

        case 'min':
            if (typeof value === 'number' && typeof rule.value === 'number') {
                if (value < rule.value) {
                    return {
                        field,
                        message: rule.message || `${field} must be at least ${rule.value}`,
                    };
                }
            }
            break;

        case 'max':
            if (typeof value === 'number' && typeof rule.value === 'number') {
                if (value > rule.value) {
                    return {
                        field,
                        message: rule.message || `${field} must be at most ${rule.value}`,
                    };
                }
            }
            break;

        case 'enum':
            if (Array.isArray(rule.value) && !rule.value.includes(value)) {
                return {
                    field,
                    message: rule.message || `${field} must be one of: ${rule.value.join(', ')}`,
                };
            }
            break;

        case 'pattern':
            if (typeof value === 'string' && rule.value instanceof RegExp) {
                if (!rule.value.test(value)) {
                    return {
                        field,
                        message: rule.message || `${field} format is invalid`,
                    };
                }
            }
            break;

        case 'objectId':
            if (typeof value === 'string') {
                if (!mongoose.Types.ObjectId.isValid(value)) {
                    return {
                        field,
                        message: rule.message || `${field} must be a valid ID`,
                    };
                }
            }
            break;

        case 'custom':
            if (rule.validator && !rule.validator(value)) {
                return {
                    field,
                    message: rule.message || `${field} is invalid`,
                };
            }
            break;
    }

    return null;
}

// =============================================================================
// COMMON VALIDATION SCHEMAS
// =============================================================================

/**
 * @constant authSchemas
 * @description Pre-built validation schemas for auth endpoints.
 */
export const authSchemas = {
    register: {
        email: {
            rules: [
                { type: 'required' as const },
                { type: 'email' as const },
            ],
            trim: true,
            lowercase: true,
        },
        password: {
            rules: [
                { type: 'required' as const },
                { type: 'minLength' as const, value: 6, message: 'Password must be at least 6 characters' },
            ],
        },
        name: {
            rules: [
                { type: 'required' as const },
                { type: 'maxLength' as const, value: 100 },
            ],
            trim: true,
        },
    } satisfies ValidationSchema,

    login: {
        email: {
            rules: [
                { type: 'required' as const },
                { type: 'email' as const },
            ],
            trim: true,
            lowercase: true,
        },
        password: {
            rules: [
                { type: 'required' as const },
            ],
        },
    } satisfies ValidationSchema,
};

/**
 * @constant transactionSchemas
 * @description Pre-built validation schemas for transaction endpoints.
 */
export const transactionSchemas = {
    create: {
        amount: {
            rules: [
                { type: 'required' as const },
                { type: 'min' as const, value: 0.01, message: 'Amount must be greater than 0' },
            ],
        },
        type: {
            rules: [
                { type: 'required' as const },
                { type: 'enum' as const, value: ['income', 'expense'] },
            ],
        },
        category: {
            rules: [
                { type: 'required' as const },
                { type: 'maxLength' as const, value: 50 },
            ],
            trim: true,
        },
    } satisfies ValidationSchema,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default validate;
