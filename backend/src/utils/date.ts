/**
 * @file date.ts
 * @description Date manipulation utilities for financial calculations.
 * 
 * This module provides date helpers for:
 * - Month/year range calculations
 * - Financial year determination (Indian FY: April-March)
 * - Date formatting for display
 * - Period comparisons
 * 
 * @architecture
 * Follows these conventions:
 * - All functions accept Date objects or ISO strings
 * - Returns Date objects for further manipulation
 * - Financial year follows Indian convention (April 1 - March 31)
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * @constant MONTHS
 * @description Month names for display.
 */
export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/**
 * @constant MONTHS_SHORT
 * @description Abbreviated month names.
 */
export const MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

// =============================================================================
// DATE PARSING
// =============================================================================

/**
 * @function parseDate
 * @description Safely parses a date input to a Date object.
 * 
 * @param input - Date, string, or timestamp
 * @returns Parsed Date object
 * @throws Error if date is invalid
 * 
 * @example
 * parseDate('2024-01-15'); // Date object
 * parseDate(new Date()); // Same Date object
 * parseDate(1705276800000); // Date from timestamp
 */
export function parseDate(input: Date | string | number): Date {
    if (input instanceof Date) {
        if (isNaN(input.getTime())) {
            throw new Error('Invalid Date object');
        }
        return input;
    }

    const parsed = new Date(input);

    if (isNaN(parsed.getTime())) {
        throw new Error(`Cannot parse date: ${input}`);
    }

    return parsed;
}

// =============================================================================
// MONTH RANGE FUNCTIONS
// =============================================================================

/**
 * @interface DateRange
 * @description A date range with start and end dates.
 */
export interface DateRange {
    start: Date;
    end: Date;
}

/**
 * @function getMonthRange
 * @description Gets the start and end dates for a specific month.
 * 
 * @param year - Year (e.g., 2024)
 * @param month - Month (1-12, NOT 0-indexed)
 * @returns Date range for the entire month
 * 
 * @example
 * const { start, end } = getMonthRange(2024, 1);
 * // start: 2024-01-01T00:00:00.000Z
 * // end: 2024-01-31T23:59:59.999Z
 */
export function getMonthRange(year: number, month: number): DateRange {
    // Validate month (1-12)
    if (month < 1 || month > 12) {
        throw new Error('Month must be between 1 and 12');
    }

    // Start of month (month is 0-indexed in Date constructor)
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);

    // End of month (go to next month's day 0 = last day of this month)
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    return { start, end };
}

/**
 * @function getCurrentMonthRange
 * @description Gets the date range for the current month.
 * 
 * @returns Date range for current month
 */
export function getCurrentMonthRange(): DateRange {
    const now = new Date();
    return getMonthRange(now.getFullYear(), now.getMonth() + 1);
}

/**
 * @function getLastNMonthsRange
 * @description Gets the date range covering the last N months.
 * 
 * @param n - Number of months to include
 * @returns Date range spanning N months up to today
 * 
 * @example
 * const range = getLastNMonthsRange(3);
 * // If today is Jan 15, 2024:
 * // start: Oct 1, 2023
 * // end: Jan 15, 2024 (today)
 */
export function getLastNMonthsRange(n: number): DateRange {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Go back N months
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - n + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    return { start: startDate, end };
}

// =============================================================================
// FINANCIAL YEAR FUNCTIONS (INDIA)
// =============================================================================

/**
 * @interface FinancialYear
 * @description Represents an Indian financial year.
 * Financial year runs April 1 to March 31.
 */
export interface FinancialYear {
    /** Display string (e.g., '2024-25') */
    label: string;

    /** Start year */
    startYear: number;

    /** End year */
    endYear: number;

    /** Start date */
    start: Date;

    /** End date */
    end: Date;
}

/**
 * @function getFinancialYear
 * @description Gets the financial year for a given date.
 * 
 * Indian financial year runs from April 1 to March 31.
 * For example, FY 2024-25 runs from April 1, 2024 to March 31, 2025.
 * 
 * @param date - Reference date (defaults to now)
 * @returns Financial year details
 * 
 * @example
 * getFinancialYear(new Date('2024-02-15'));
 * // Returns FY 2023-24 (Apr 2023 - Mar 2024)
 * 
 * getFinancialYear(new Date('2024-06-15'));
 * // Returns FY 2024-25 (Apr 2024 - Mar 2025)
 */
export function getFinancialYear(date: Date = new Date()): FinancialYear {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    // If month is January-March (0-2), FY started last year
    // If month is April-December (3-11), FY started this year
    const startYear = month < 3 ? year - 1 : year;
    const endYear = startYear + 1;

    return {
        label: `${startYear}-${String(endYear).slice(2)}`,
        startYear,
        endYear,
        start: new Date(startYear, 3, 1, 0, 0, 0, 0),      // April 1
        end: new Date(endYear, 2, 31, 23, 59, 59, 999),    // March 31
    };
}

/**
 * @function getFinancialYearByLabel
 * @description Gets financial year dates from a label.
 * 
 * @param label - Financial year label (e.g., '2024-25')
 * @returns Financial year object
 */
export function getFinancialYearByLabel(label: string): FinancialYear {
    const parts = label.split('-');
    if (parts.length !== 2) {
        throw new Error('Invalid financial year label. Expected format: YYYY-YY');
    }

    const startYear = parseInt(parts[0] ?? '', 10);
    if (isNaN(startYear)) {
        throw new Error('Invalid start year in financial year label');
    }

    const endYear = startYear + 1;

    return {
        label,
        startYear,
        endYear,
        start: new Date(startYear, 3, 1, 0, 0, 0, 0),
        end: new Date(endYear, 2, 31, 23, 59, 59, 999),
    };
}

// =============================================================================
// FORMATTING FUNCTIONS
// =============================================================================

/**
 * @function formatDate
 * @description Formats a date for display.
 * 
 * @param date - Date to format
 * @param format - Format style
 * @returns Formatted date string
 * 
 * @example
 * formatDate(new Date('2024-01-15'), 'short');  // "Jan 15, 2024"
 * formatDate(new Date('2024-01-15'), 'long');   // "January 15, 2024"
 * formatDate(new Date('2024-01-15'), 'iso');    // "2024-01-15"
 */
export function formatDate(
    date: Date | string,
    format: 'short' | 'long' | 'iso' = 'short'
): string {
    const d = parseDate(date);

    switch (format) {
        case 'iso':
            return d.toISOString().split('T')[0] ?? '';

        case 'long':
            return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

        case 'short':
        default:
            return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
}

/**
 * @function formatMonthYear
 * @description Formats a date as "Month Year".
 * 
 * @param date - Date to format
 * @param short - Use abbreviated month name
 * @returns Formatted string (e.g., "January 2024")
 */
export function formatMonthYear(date: Date | string, short: boolean = false): string {
    const d = parseDate(date);
    const monthList = short ? MONTHS_SHORT : MONTHS;
    return `${monthList[d.getMonth()]} ${d.getFullYear()}`;
}

// =============================================================================
// COMPARISON FUNCTIONS
// =============================================================================

/**
 * @function isSameMonth
 * @description Checks if two dates are in the same month and year.
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if same month and year
 */
export function isSameMonth(date1: Date | string, date2: Date | string): boolean {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);

    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

/**
 * @function isWithinRange
 * @description Checks if a date falls within a date range.
 * 
 * @param date - Date to check
 * @param range - Date range to check against
 * @returns True if date is within range (inclusive)
 */
export function isWithinRange(date: Date | string, range: DateRange): boolean {
    const d = parseDate(date);
    return d >= range.start && d <= range.end;
}

/**
 * @function daysBetween
 * @description Calculates the number of days between two dates.
 * 
 * @param date1 - Start date
 * @param date2 - End date
 * @returns Number of days (can be negative if date2 before date1)
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);

    const diffMs = d2.getTime() - d1.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
    parseDate,
    getMonthRange,
    getCurrentMonthRange,
    getLastNMonthsRange,
    getFinancialYear,
    getFinancialYearByLabel,
    formatDate,
    formatMonthYear,
    isSameMonth,
    isWithinRange,
    daysBetween,
    MONTHS,
    MONTHS_SHORT,
};
