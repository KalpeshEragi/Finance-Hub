/**
 * @file constants.ts
 * @description Application-wide constants and configuration values.
 * 
 * This module centralizes all magic numbers, strings, and configuration
 * values that are used throughout the application. Keeping them here
 * makes it easy to modify behavior without hunting through code.
 * 
 * @architecture
 * - HTTP_STATUS: Standard HTTP status codes for consistent API responses
 * - ERROR_MESSAGES: User-facing error messages
 * - VALIDATION: Input validation rules
 * - DEFAULTS: Default values for optional parameters
 * - CATEGORIES: Predefined transaction categories
 */

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

/**
 * @constant HTTP_STATUS
 * @description Standard HTTP status codes used in API responses.
 * Using constants prevents typos and provides better IDE autocomplete.
 */
export const HTTP_STATUS = {
    // 2xx Success
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,

    // 4xx Client Errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,

    // 5xx Server Errors
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
} as const;

// =============================================================================
// ERROR MESSAGES
// =============================================================================

/**
 * @constant ERROR_MESSAGES
 * @description Standardized error messages for consistent API responses.
 * These are user-facing messages, so they should be clear and helpful.
 */
export const ERROR_MESSAGES = {
    // Authentication Errors
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'You must be logged in to access this resource',
    TOKEN_EXPIRED: 'Your session has expired. Please log in again',
    TOKEN_INVALID: 'Invalid authentication token',

    // User Errors
    USER_NOT_FOUND: 'User not found',
    USER_EXISTS: 'A user with this email already exists',

    // Resource Errors
    RESOURCE_NOT_FOUND: 'The requested resource was not found',
    TRANSACTION_NOT_FOUND: 'Transaction not found',
    BUDGET_NOT_FOUND: 'Budget not found',
    GOAL_NOT_FOUND: 'Goal not found',

    // Validation Errors
    VALIDATION_ERROR: 'Validation failed. Please check your input',
    INVALID_OBJECT_ID: 'Invalid ID format',
    MISSING_REQUIRED_FIELDS: 'Missing required fields',

    // Server Errors
    INTERNAL_ERROR: 'An unexpected error occurred. Please try again later',
    DATABASE_ERROR: 'Database operation failed',
    AI_SERVICE_ERROR: 'AI service is temporarily unavailable',
} as const;

// =============================================================================
// SUCCESS MESSAGES
// =============================================================================

/**
 * @constant SUCCESS_MESSAGES
 * @description Standardized success messages for API responses.
 */
export const SUCCESS_MESSAGES = {
    // Auth
    LOGOUT_SUCCESS: 'Successfully logged out',
    REGISTER_SUCCESS: 'Account created successfully',

    // CRUD Operations
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',

    // Alerts
    ALERTS_MARKED_READ: 'Alerts marked as read',
} as const;

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

/**
 * @constant VALIDATION
 * @description Validation rules for input data.
 * Used by validation middleware and schemas.
 */
export const VALIDATION = {
    // Password requirements
    PASSWORD_MIN_LENGTH: 6,
    PASSWORD_MAX_LENGTH: 128,

    // Name requirements
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 100,

    // Transaction limits
    AMOUNT_MIN: 0.01,
    AMOUNT_MAX: 999999999.99,

    // Description limits
    DESCRIPTION_MAX_LENGTH: 500,
    TITLE_MAX_LENGTH: 200,

    // Pagination
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * @constant DEFAULTS
 * @description Default values for optional parameters and configurations.
 */
export const DEFAULTS = {
    // Pagination
    PAGE: 1,
    LIMIT: 20,

    // Date ranges
    TREND_MONTHS: 6,

    // Budget
    BUDGET_ALERT_THRESHOLD: 80, // Alert when 80% of budget used

    // Credit Score (Simulated)
    CREDIT_SCORE_MIN: 300,
    CREDIT_SCORE_MAX: 850,
    CREDIT_SCORE_DEFAULT: 650,
} as const;

// =============================================================================
// TRANSACTION CATEGORIES
// =============================================================================

/**
 * @constant TRANSACTION_CATEGORIES
 * @description Predefined categories for transaction classification.
 * Used for both expense and income categorization.
 */
export const TRANSACTION_CATEGORIES = {
    EXPENSE: [
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills & Utilities',
        'Healthcare',
        'Education',
        'Personal Care',
        'Travel',
        'Groceries',
        'Rent & Housing',
        'Insurance',
        'Subscriptions',
        'Other Expense',
    ],
    INCOME: [
        'Salary',
        'Freelance',
        'Business',
        'Investment',
        'Rental Income',
        'Refund',
        'Gift',
        'Other Income',
    ],
} as const;

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

/**
 * @constant TRANSACTION_TYPES
 * @description Valid transaction types.
 */
export const TRANSACTION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense',
} as const;

// =============================================================================
// TAX CONSTANTS (INDIA-SPECIFIC)
// =============================================================================

/**
 * @constant TAX_REGIMES
 * @description Indian tax regime options.
 */
export const TAX_REGIMES = {
    OLD: 'old',
    NEW: 'new',
} as const;

/**
 * @constant TAX_SLABS
 * @description Tax slabs for both old and new regimes (FY 2024-25).
 * @note These are simplified slabs for hackathon purposes.
 */
export const TAX_SLABS = {
    OLD: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250001, max: 500000, rate: 5 },
        { min: 500001, max: 1000000, rate: 20 },
        { min: 1000001, max: Infinity, rate: 30 },
    ],
    NEW: [
        { min: 0, max: 300000, rate: 0 },
        { min: 300001, max: 600000, rate: 5 },
        { min: 600001, max: 900000, rate: 10 },
        { min: 900001, max: 1200000, rate: 15 },
        { min: 1200001, max: 1500000, rate: 20 },
        { min: 1500001, max: Infinity, rate: 30 },
    ],
} as const;

// =============================================================================
// DEDUCTION LIMITS (INDIA-SPECIFIC)
// =============================================================================

/**
 * @constant DEDUCTION_LIMITS
 * @description Maximum deduction limits under various sections of Indian Income Tax Act.
 */
export const DEDUCTION_LIMITS: Partial<Record<string, number>> = {
    section80C: 150000,
    section80D: 25000, // 50000 for senior citizens
    section80G: 0, // No fixed limit (varies by donation type)
    homeLoanInterest: 200000,
    hra: 0, // Calculated based on formula
    lta: 0, // Actual expenses or exemption, whichever is lower
    standardDeduction: 50000,
    professionalTax: 5000,
    nps: 50000, // Under 80CCD(1B)
};

// =============================================================================
// CREDIT SCORE FACTORS
// =============================================================================

/**
 * @constant CREDIT_FACTORS
 * @description Factors that influence the simulated credit health score.
 */
export const CREDIT_FACTORS = {
    PAYMENT_HISTORY: 'Payment History',
    CREDIT_UTILIZATION: 'Credit Utilization',
    ACCOUNT_AGE: 'Account Age',
    SPENDING_PATTERNS: 'Spending Patterns',
    SAVINGS_RATE: 'Savings Rate',
} as const;

// =============================================================================
// ALERT TYPES
// =============================================================================

/**
 * @constant ALERT_TYPES
 * @description Types of alerts that can be generated.
 */
export const ALERT_TYPES = {
    BUDGET_WARNING: 'budget_warning',
    BUDGET_EXCEEDED: 'budget_exceeded',
    GOAL_PROGRESS: 'goal_progress',
    GOAL_ACHIEVED: 'goal_achieved',
    UNUSUAL_SPENDING: 'unusual_spending',
    TAX_REMINDER: 'tax_reminder',
    GENERAL: 'general',
} as const;

// =============================================================================
// GOAL STATUS
// =============================================================================

/**
 * @constant GOAL_STATUS
 * @description Possible statuses for financial goals.
 */
export const GOAL_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
} as const;
