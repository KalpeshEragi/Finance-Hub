/**
 * @file balance.ts
 * @description API client for Balance Service
 * 
 * Provides access to the ledger-correct balance calculations:
 * - Net Balance (from transactions)
 * - Allocated Balance (from goals)
 * - Free Balance (available for spending/allocating)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// =============================================================================
// TYPES
// =============================================================================

export interface UserBalance {
    // Ledger balance (from transactions)
    netBalance: number;                 // Sum of all income - expenses
    monthlyIncome: number;              // Current month income
    currentMonthExpenses: number;       // Current month expenses

    // Allocations (from goals)
    allocatedBalance: number;           // Sum of all goal allocations
    emergencyAllocated: number;         // Sum of emergency goals only
    nonEmergencyAllocated: number;      // Sum of non-emergency goals

    // Free balance (spendable)
    freeBalance: number;                // Net - Allocated

    // Emergency breakdown
    coreEmergency: number;              // Min(emergency, 6 months essentials)
    surplusEmergency: number;           // Max(0, emergency - 6 months)
}

export interface AvailableBalance {
    freeBalance: number;
    netBalance: number;
    allocatedBalance: number;
}

// =============================================================================
// AUTH HELPERS
// =============================================================================

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue ? decodeURIComponent(cookieValue) : null;
    }
    return null;
}

function getAuthHeaders(): HeadersInit {
    const token = getCookie('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get the complete user balance breakdown
 */
export async function getUserBalance(): Promise<UserBalance> {
    const response = await fetch(`${API_BASE_URL}/balance/summary`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to get balance summary');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Get available free balance for allocations
 */
export async function getAvailableBalance(): Promise<AvailableBalance> {
    const response = await fetch(`${API_BASE_URL}/balance/available`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to get available balance');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}

export const balanceApi = {
    getUserBalance,
    getAvailableBalance,
    formatCurrency,
};

export default balanceApi;
