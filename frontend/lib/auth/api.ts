/**
 * @file api.ts
 * @description API helper functions for authentication endpoints
 */

import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Login user with email and password
 */
export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Login failed');
    }

    return data;
}

/**
 * Register a new user
 */
export async function registerApi(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
    }

    return data;
}

/**
 * Get current user profile
 */
export async function getMeApi(token: string): Promise<{ success: boolean; data: User }> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to get user');
    }

    return data;
}

/**
 * Logout user (client-side token handling)
 */
export async function logoutApi(token: string): Promise<void> {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
    } catch {
        // Logout is handled client-side, ignore errors
    }
}
