/**
 * @file recurrings.ts
 * @description API functions for recurring subscriptions
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface RecurringSubscription {
    id: string;
    name: string;
    amount: number;
    category: string;
    frequency: 'weekly' | 'monthly' | 'yearly';
    startDate: string;
    nextBillingDate: string;
    status: 'active' | 'cancelled' | 'paused';
    merchant?: string;
    description?: string;
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

export async function getRecurrings(): Promise<{ success: boolean; data: RecurringSubscription[] }> {
    const response = await fetch(`${API_BASE_URL}/recurrings`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch recurrings');
    return data;
}

export async function createRecurring(recurring: Omit<RecurringSubscription, 'id'>): Promise<{ success: boolean; data: RecurringSubscription }> {
    const response = await fetch(`${API_BASE_URL}/recurrings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(recurring),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create recurring');
    return data;
}

export async function updateRecurring(id: string, recurring: Partial<RecurringSubscription>): Promise<{ success: boolean; data: RecurringSubscription }> {
    const response = await fetch(`${API_BASE_URL}/recurrings/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(recurring),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update recurring');
    return data;
}

export async function deleteRecurring(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/recurrings/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete recurring');
    return data;
}