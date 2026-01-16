/**
 * @file csv.ts
 * @description CSV parsing utilities for bulk transaction import.
 * 
 * This module provides a lightweight CSV parser that:
 * - Handles common CSV formats
 * - Supports quoted fields and escaped characters
 * - Maps CSV columns to transaction fields
 * - Reports parsing errors without failing the entire import
 * 
 * @architecture
 * The parser is designed for transaction import specifically:
 * - Expected columns: date, amount, type, category, description, merchant
 * - Flexible column mapping (handles various header names)
 * - Returns structured data ready for database insertion
 */

import type { BulkTransactionRow } from '../types/transaction.types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * @interface CSVParseOptions
 * @description Options for CSV parsing.
 */
export interface CSVParseOptions {
    /** Column delimiter (default: ',') */
    delimiter?: string;

    /** Whether the first row is headers (default: true) */
    hasHeaders?: boolean;

    /** Custom column mappings */
    columnMappings?: Record<string, string>;

    /** Skip empty rows (default: true) */
    skipEmptyRows?: boolean;
}

/**
 * @interface CSVParseResult
 * @description Result of CSV parsing operation.
 */
export interface CSVParseResult {
    /** Successfully parsed rows */
    data: BulkTransactionRow[];

    /** Parsing errors with row numbers */
    errors: Array<{
        row: number;
        message: string;
    }>;

    /** Total rows processed */
    totalRows: number;

    /** Headers found in the CSV */
    headers: string[];
}

// =============================================================================
// COLUMN MAPPINGS
// =============================================================================

/**
 * @constant DEFAULT_COLUMN_MAPPINGS
 * @description Maps common CSV header names to our expected field names.
 * Handles variations in how different banks/apps export data.
 */
const DEFAULT_COLUMN_MAPPINGS: Record<string, string[]> = {
    date: ['date', 'transaction date', 'txn date', 'posting date', 'value date'],
    amount: ['amount', 'value', 'sum', 'total', 'debit', 'credit', 'transaction amount'],
    type: ['type', 'transaction type', 'txn type', 'dr/cr', 'debit/credit'],
    category: ['category', 'subcategory', 'transaction category'],
    description: ['description', 'desc', 'narration', 'particulars', 'details', 'memo', 'remarks'],
    merchant: ['merchant', 'payee', 'vendor', 'beneficiary', 'recipient'],
};

// =============================================================================
// PARSING FUNCTIONS
// =============================================================================

/**
 * @function parseCSV
 * @description Parses CSV content into structured transaction data.
 * 
 * This is the main entry point for CSV parsing. It handles:
 * - Splitting content into lines
 * - Parsing headers (if present)
 * - Parsing each data row
 * - Collecting errors without failing
 * 
 * @param content - Raw CSV string content
 * @param options - Optional parsing configuration
 * @returns Parsed data with errors collected
 * 
 * @example
 * const content = `date,amount,type,description
 * 2024-01-15,100.00,expense,Grocery shopping
 * 2024-01-16,5000.00,income,Salary`;
 * 
 * const result = parseCSV(content);
 * console.log(result.data); // Array of BulkTransactionRow
 * console.log(result.errors); // Any parsing errors
 */
export function parseCSV(
    content: string,
    options: CSVParseOptions = {}
): CSVParseResult {
    const {
        delimiter = ',',
        hasHeaders = true,
        skipEmptyRows = true,
    } = options;

    const result: CSVParseResult = {
        data: [],
        errors: [],
        totalRows: 0,
        headers: [],
    };

    // Split into lines, handling both Windows and Unix line endings
    const lines = content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n');

    if (lines.length === 0) {
        return result;
    }

    // Parse headers
    let dataStartIndex = 0;
    let headerMap: Map<number, string> = new Map();

    if (hasHeaders && lines[0]) {
        const headerRow = parseCSVLine(lines[0], delimiter);
        result.headers = headerRow;
        headerMap = mapHeaders(headerRow);
        dataStartIndex = 1;
    }

    // Parse data rows
    for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i];

        // Skip empty rows
        if (!line || (skipEmptyRows && line.trim() === '')) {
            continue;
        }

        result.totalRows++;

        try {
            const values = parseCSVLine(line, delimiter);
            const row = mapRowToTransaction(values, headerMap);
            result.data.push(row);
        } catch (error) {
            result.errors.push({
                row: i + 1, // 1-indexed for user display
                message: error instanceof Error ? error.message : 'Unknown parsing error',
            });
        }
    }

    return result;
}

/**
 * @function parseCSVLine
 * @description Parses a single CSV line into an array of values.
 * 
 * Handles:
 * - Quoted fields (e.g., "value with, comma")
 * - Escaped quotes (e.g., "value with ""quotes""")
 * - Empty fields
 * 
 * @param line - Single line of CSV
 * @param delimiter - Field delimiter
 * @returns Array of field values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                } else {
                    // End of quoted field
                    inQuotes = false;
                    i++;
                }
            } else {
                current += char;
                i++;
            }
        } else {
            if (char === '"') {
                // Start of quoted field
                inQuotes = true;
                i++;
            } else if (char === delimiter) {
                // End of field
                values.push(current.trim());
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
    }

    // Push last field
    values.push(current.trim());

    return values;
}

/**
 * @function mapHeaders
 * @description Maps CSV headers to our expected field names.
 * 
 * @param headers - Array of header names from CSV
 * @returns Map of column index to field name
 */
function mapHeaders(headers: string[]): Map<number, string> {
    const headerMap = new Map<number, string>();

    headers.forEach((header, index) => {
        const normalizedHeader = header.toLowerCase().trim();

        // Find matching field name
        for (const [fieldName, variations] of Object.entries(DEFAULT_COLUMN_MAPPINGS)) {
            if (variations.includes(normalizedHeader)) {
                headerMap.set(index, fieldName);
                break;
            }
        }
    });

    return headerMap;
}

/**
 * @function mapRowToTransaction
 * @description Converts a row of CSV values to a BulkTransactionRow.
 * 
 * @param values - Array of field values
 * @param headerMap - Mapping of column index to field name
 * @returns Structured transaction row
 */
function mapRowToTransaction(
    values: string[],
    headerMap: Map<number, string>
): BulkTransactionRow {
    const row: BulkTransactionRow = {
        amount: '',
    };

    headerMap.forEach((fieldName, index) => {
        const value = values[index];
        if (value !== undefined) {
            switch (fieldName) {
                case 'amount':
                    row.amount = value;
                    break;
                case 'date':
                    row.date = value;
                    break;
                case 'type':
                    row.type = value;
                    break;
                case 'category':
                    row.category = value;
                    break;
                case 'description':
                    row.description = value;
                    break;
                case 'merchant':
                    row.merchant = value;
                    break;
            }
        }
    });

    return row;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * @function validateTransactionRow
 * @description Validates a parsed transaction row.
 * 
 * @param row - Transaction row to validate
 * @returns Object with validity status and errors
 */
export function validateTransactionRow(row: BulkTransactionRow): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Amount is required
    const amount = typeof row.amount === 'string'
        ? parseFloat(row.amount.replace(/[^0-9.-]/g, ''))
        : row.amount;

    if (isNaN(amount) || amount <= 0) {
        errors.push('Invalid or missing amount');
    }

    // Validate date if provided
    if (row.date) {
        const parsed = new Date(row.date);
        if (isNaN(parsed.getTime())) {
            errors.push('Invalid date format');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
    parseCSV,
    validateTransactionRow,
};
