/**
 * @file goals.ts
 * @description API functions for financial goals management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type GoalStatus = 'active' | 'completed' | 'cancelled';

export interface Goal {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    status: GoalStatus;
    description?: string;
    priority: number;
    category?: string;
    progressPercentage: number;
    remainingAmount: number;
    daysRemaining: number;
    isOverdue: boolean;
    createdAt: string;
}

export interface CreateGoalInput {
    title: string;
    targetAmount: number;
    deadline: string;
    description?: string;
    priority?: number;
    category?: string;
    currentAmount?: number;
}

export interface UpdateGoalInput {
    title?: string;
    targetAmount?: number;
    currentAmount?: number;
    deadline?: string;
    description?: string;
    priority?: number;
    category?: string;
    status?: GoalStatus;
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
 * Fetch all goals for the current user
 */
export async function getGoals(status?: GoalStatus): Promise<{ success: boolean; data: Goal[] }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE_URL}/goals?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch goals');
    return data;
}

/**
 * Create a new goal
 */
export async function createGoal(goal: CreateGoalInput): Promise<{ success: boolean; data: Goal }> {
    const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(goal),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create goal');
    return data;
}

/**
 * Update an existing goal
 */
export async function updateGoal(id: string, updates: UpdateGoalInput): Promise<{ success: boolean; data: Goal }> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update goal');
    return data;
}

/**
 * Delete a goal
 */
export async function deleteGoal(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete goal');
    return data;
}

/**
 * Add savings progress to a goal
 */
export async function addGoalProgress(id: string, amount: number): Promise<{ success: boolean; data: Goal }> {
    // Fetch current goal to get currentAmount
    const { data: goal } = await getGoalById(id);

    return updateGoal(id, {
        currentAmount: goal.currentAmount + amount
    });
}

/**
 * Get goal by ID
 */
export async function getGoalById(id: string): Promise<{ success: boolean; data: Goal }> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch goal');
    return data;
}