/**
 * @file transaction.types.ts
 * @description TypeScript type definitions for transaction-related data.
 * 
 * This module defines types for:
 * - Transaction data structures
 * - CRUD operation inputs/outputs
 * - Filtering and pagination
 * - Bulk import operations
 * 
 * @architecture
 * Transactions are the core data entity tracking user income and expenses.
 * Types are designed to:
 * - Support flexible filtering and querying
 * - Enable bulk operations for CSV import
 * - Maintain strict type safety for amounts and categories
 */

import { Document, Types } from 'mongoose';

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

/**
 * @type TransactionType
 * @description Valid transaction types - income or expense.
 */
export type TransactionType = 'income' | 'expense';

/**
 * @interface ITransactionBase
 * @description Base transaction properties without Mongoose fields.
 * Used for creating new transactions.
 */
export interface ITransactionBase {
    /** Reference to the user who owns this transaction */
    userId: Types.ObjectId;

    /** Transaction amount (positive number) */
    amount: number;

    /** Type: 'income' or 'expense' */
    type: TransactionType;

    /** Category for classification (e.g., 'Food & Dining', 'Salary') */
    category: string;

    /** Optional description or note */
    description?: string;

    /** Transaction date */
    date: Date;

    /** Original merchant/source name (for AI categorization) */
    merchant?: string;

    /** Whether this was auto-categorized by AI */
    isAutoCategorized?: boolean;
}

/**
 * @interface ITransaction
 * @description Full transaction document including Mongoose properties.
 * 
 * @extends Document
 * @extends ITransactionBase
 */
export interface ITransaction extends Document, ITransactionBase {
    /** MongoDB ObjectId */
    _id: Types.ObjectId;

    /** Creation timestamp */
    createdAt: Date;

    /** Last update timestamp */
    updatedAt: Date;
}

/**
 * @interface ITransactionPublic
 * @description Transaction data safe for API responses.
 * Converts ObjectId to string for JSON serialization.
 */
export interface ITransactionPublic {
    /** Transaction ID as string */
    id: string;

    /** Transaction amount */
    amount: number;

    /** Transaction type */
    type: TransactionType;

    /** Category name */
    category: string;

    /** Optional description */
    description?: string;

    /** Transaction date */
    date: Date;

    /** Merchant name */
    merchant?: string;

    /** Auto-categorization flag */
    isAutoCategorized?: boolean;

    /** Creation timestamp */
    createdAt: Date;
}

// =============================================================================
// REQUEST DTOs
// =============================================================================

/**
 * @interface CreateTransactionInput
 * @description Input for creating a single transaction.
 */
export interface CreateTransactionInput {
    /** Transaction amount (must be positive) */
    amount: number;

    /** Transaction type */
    type: TransactionType;

    /** Category (optional - can be auto-assigned by AI) */
    category?: string;

    /** Description or note */
    description?: string;

    /** Transaction date (defaults to now) */
    date?: Date | string;

    /** Merchant/source name */
    merchant?: string;
}

/**
 * @interface UpdateTransactionInput
 * @description Input for updating an existing transaction.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateTransactionInput {
    amount?: number;
    type?: TransactionType;
    category?: string;
    description?: string;
    date?: Date | string;
    merchant?: string;
}

/**
 * @interface BulkTransactionInput
 * @description Input for bulk transaction import.
 */
export interface BulkTransactionInput {
    /** Array of transactions to create */
    transactions: CreateTransactionInput[];
}

/**
 * @interface BulkTransactionRow
 * @description Single row from CSV import.
 * Flexible to handle various CSV formats.
 */
export interface BulkTransactionRow {
    /** Amount (can be string from CSV) */
    amount: string | number;

    /** Type: income/expense or credit/debit */
    type?: string;

    /** Category name */
    category?: string;

    /** Description */
    description?: string;

    /** Date (various formats) */
    date?: string;

    /** Merchant name */
    merchant?: string;
}

// =============================================================================
// FILTER AND PAGINATION TYPES
// =============================================================================

/**
 * @interface TransactionFilters
 * @description Filters for querying transactions.
 * All filters are optional and combinable.
 */
export interface TransactionFilters {
    /** Filter by transaction type */
    type?: TransactionType;

    /** Filter by category */
    category?: string;

    /** Start date for date range filter */
    startDate?: Date | string;

    /** End date for date range filter */
    endDate?: Date | string;

    /** Minimum amount */
    minAmount?: number;

    /** Maximum amount */
    maxAmount?: number;

    /** Search in description or merchant */
    search?: string;
}

/**
 * @interface PaginationOptions
 * @description Pagination parameters for list queries.
 */
export interface PaginationOptions {
    /** Page number (1-indexed) */
    page?: number;

    /** Items per page */
    limit?: number;

    /** Sort field */
    sortBy?: 'date' | 'amount' | 'createdAt';

    /** Sort order */
    sortOrder?: 'asc' | 'desc';
}

/**
 * @interface PaginatedResult
 * @description Generic paginated result wrapper.
 */
export interface PaginatedResult<T> {
    /** Array of items for current page */
    data: T[];

    /** Pagination metadata */
    pagination: {
        /** Current page number */
        page: number;

        /** Items per page */
        limit: number;

        /** Total number of items */
        total: number;

        /** Total number of pages */
        totalPages: number;

        /** Whether there's a next page */
        hasMore: boolean;
    };
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * @interface TransactionResponse
 * @description Single transaction response.
 */
export interface TransactionResponse {
    success: true;
    data: ITransactionPublic;
}

/**
 * @interface TransactionsListResponse
 * @description Paginated list of transactions.
 */
export interface TransactionsListResponse {
    success: true;
    data: ITransactionPublic[];
    pagination: PaginatedResult<ITransactionPublic>['pagination'];
}

/**
 * @interface BulkImportResponse
 * @description Response for bulk import operation.
 */
export interface BulkImportResponse {
    success: true;
    message: string;
    data: {
        /** Number of transactions created */
        created: number;

        /** Number of failed imports */
        failed: number;

        /** Error details for failed imports */
        errors?: Array<{
            row: number;
            error: string;
        }>;
    };
}

// =============================================================================
// CATEGORIZATION TYPES
// =============================================================================

/**
 * @interface CategorizationRequest
 * @description Request to categorize transactions using AI.
 */
export interface CategorizationRequest {
    /** Transaction IDs to categorize */
    transactionIds?: string[];

    /** Or categorize all uncategorized transactions */
    categorizeAll?: boolean;
}

/**
 * @interface CategorizationResult
 * @description Result of AI categorization.
 */
export interface CategorizationResult {
    /** Transaction ID */
    transactionId: string;

    /** Assigned category */
    category: string;

    /** AI confidence score (0-1) */
    confidence: number;
}

/**
 * @interface CategorizationRule
 * @description Custom categorization rule defined by user.
 */
export interface CategorizationRule {
    /** Rule ID */
    id: string;

    /** Pattern to match (merchant name, description) */
    pattern: string;

    /** Category to assign when matched */
    category: string;

    /** Whether pattern is case-sensitive */
    caseSensitive?: boolean;
}
