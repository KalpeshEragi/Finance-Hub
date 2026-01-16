/**
 * @file types.ts
 * @description Type definitions for authentication
 */

export interface User {
    id: string;
    email: string;
    name: string;
    createdAt?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    name: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        token: string;
        user: User;
    };
}

export interface ApiError {
    success: false;
    message: string;
    code?: string;
}
