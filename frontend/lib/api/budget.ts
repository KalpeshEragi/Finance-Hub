/**
 * @file budget.ts
 * @description API functions for budget management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface BudgetWithSpending {
    id: string;
    category: string;
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'under' | 'warning' | 'exceeded';
    month: number;
    year: number;
}

export interface BudgetSummary {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    overallPercentage: number;
    budgets: BudgetWithSpending[];
    alerts: Array<{ category: string; message: string; type: string }>;
}

export interface SetBudgetInput {
    category: string;
    limit: number;
    month: number;
    year: number;
}

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

/**
 * Fetch budget summary for a specific month/year
 */
export async function getBudgetSummary(month?: number, year?: number): Promise<{ success: boolean; data: BudgetSummary }> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    const response = await fetch(`${API_BASE_URL}/budget/summary?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch budget summary');
    return data;
}

/**
 * Fetch individual budgets for a specific month/year
 */
export async function getBudgets(month?: number, year?: number): Promise<{ success: boolean; data: BudgetWithSpending[] }> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    const response = await fetch(`${API_BASE_URL}/budget?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch budgets');
    return data;
}

/**
 * Create or update a budget
 */
export async function setBudget(budget: SetBudgetInput): Promise<{ success: boolean; data: BudgetWithSpending }> {
    const response = await fetch(`${API_BASE_URL}/budget`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(budget),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to set budget');
    return data;
}

/**
 * Trigger budget alert check (backend already does this on some triggers, but can be manual)
 */
export async function checkBudgetAlerts(): Promise<{ success: boolean; data: { alertsCreated: number } }> {
    const response = await fetch(`${API_BASE_URL}/budget/check-alerts`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to check budget alerts');
    return data;
}

export interface BudgetRecommendation {
    category: string;
    current_spending: number;
    recommended_limit: number;
    potential_savings: number;
    reason: string;
    action_item: string;
    priority: number;
}

export interface BudgetAdviceResponse {
    total_spending: number;
    needs_spending: number;
    wants_spending: number;
    savings_spending: number;
    recommendations: BudgetRecommendation[];
    estimated_monthly_savings: number;
    message?: string;
}

/**
 * @function getBudgetAdvice
 * @description Fetches personalized budget advice and savings recommendations from the AI agent.
 * 
 * CRITICAL: This function MUST receive month/year to ensure temporal correctness.
 * Without these params, the backend would use the current system month, causing
 * data from the wrong month to be displayed.
 * 
 * @param month - The month to analyze (1-12). Required for correct temporal scoping.
 * @param year - The year to analyze (e.g., 2025). Required for correct temporal scoping.
 * @returns Promise containing budget analysis with recommendations for the specified month/year.
 * @throws Error if the API request fails.
 * 
 * @example
 * // Fetch advice for February 2025
 * const advice = await getBudgetAdvice(2, 2025);
 */
export async function getBudgetAdvice(month?: number, year?: number): Promise<{ success: boolean; data: BudgetAdviceResponse }> {
    // Build query params - these are CRITICAL for temporal correctness
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    const response = await fetch(`${API_BASE_URL}/budget/advice?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch budget advice');
    return data;
}