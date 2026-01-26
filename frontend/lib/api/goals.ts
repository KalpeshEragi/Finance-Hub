/**
 * @file lib/api/goals.ts
 * @brief Goals API client for managing financial goals.
 * 
 * @description
 * Provides functions to:
 * - Create, update, delete financial goals
 * - Track progress towards goals
 * - Update goal contributions
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// =============================================================================
// TYPES
// =============================================================================

/**
 * @interface Goal
 * @brief Financial goal with progress tracking.
 */
export interface Goal {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    category: string;
    priority: number;
    monthlyContribution: number;
    progress: number;
    status: 'on_track' | 'behind' | 'achieved';
    createdAt: string;
}

/**
 * @interface CreateGoalInput
 * @brief Input for creating a new goal.
 */
export interface CreateGoalInput {
    title: string;
    targetAmount: number;
    currentAmount?: number;
    deadline: string;
    category?: string;
    priority?: number;
    monthlyContribution?: number;
}

/**
 * @interface UpdateGoalInput
 * @brief Input for updating an existing goal.
 */
export interface UpdateGoalInput {
    title?: string;
    targetAmount?: number;
    currentAmount?: number;
    deadline?: string;
    category?: string;
    priority?: number;
    monthlyContribution?: number;
}

// =============================================================================
// HELPERS
// =============================================================================

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const rawValue = parts.pop()?.split(';').shift();
        return rawValue ? decodeURIComponent(rawValue) : null;
    }
    return null;
}

function getAuthHeaders(): HeadersInit {
    const token = getCookie('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * @brief Get all goals for the current user.
 * @returns List of goals
 */
export async function getGoals(): Promise<{ success: boolean; data: Goal[] }> {
    const response = await fetch(`${API_BASE_URL}/goals`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch goals');
    }

    return response.json();
}

/**
 * @brief Create a new goal.
 * @param input - Goal data
 * @returns Created goal
 */
export async function createGoal(
    input: CreateGoalInput
): Promise<{ success: boolean; data: Goal }> {
    const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create goal');
    }

    return response.json();
}

/**
 * @brief Update an existing goal.
 * @param id - Goal ID
 * @param input - Fields to update
 * @returns Updated goal
 */
export async function updateGoal(
    id: string,
    input: UpdateGoalInput
): Promise<{ success: boolean; data: Goal }> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update goal');
    }

    return response.json();
}

/**
 * @brief Delete a goal.
 * @param id - Goal ID
 */
export async function deleteGoal(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete goal');
    }

    return response.json();
}

/**
 * @brief Add contribution to a goal.
 * @param id - Goal ID
 * @param amount - Amount to add
 */
export async function addContribution(
    id: string,
    amount: number
): Promise<{ success: boolean; data: Goal }> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}/contribute`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add contribution');
    }

    return response.json();
}