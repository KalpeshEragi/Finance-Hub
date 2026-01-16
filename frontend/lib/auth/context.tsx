"use client";

/**
 * @file context.tsx
 * @description AuthContext provider for managing authentication state
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthState, LoginCredentials, RegisterCredentials } from './types';
import { loginApi, registerApi, getMeApi, logoutApi } from './api';

// Cookie utilities
function setCookie(name: string, value: string, days: number = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue ? decodeURIComponent(cookieValue) : null;
    }
    return null;
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Auth context type
interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from cookie
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = getCookie('auth_token');
            if (storedToken) {
                try {
                    const response = await getMeApi(storedToken);
                    setUser(response.data);
                    setToken(storedToken);
                } catch {
                    // Token is invalid, clear it
                    deleteCookie('auth_token');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        const response = await loginApi(credentials);
        if (response.success && response.data) {
            setUser(response.data.user);
            setToken(response.data.token);
            setCookie('auth_token', response.data.token);
        }
    }, []);

    const register = useCallback(async (credentials: RegisterCredentials) => {
        const response = await registerApi(credentials);
        if (response.success && response.data) {
            setUser(response.data.user);
            setToken(response.data.token);
            setCookie('auth_token', response.data.token);
        }
    }, []);

    const logout = useCallback(async () => {
        if (token) {
            await logoutApi(token);
        }
        setUser(null);
        setToken(null);
        deleteCookie('auth_token');
    }, [token]);

    const refreshUser = useCallback(async () => {
        if (token) {
            try {
                const response = await getMeApi(token);
                setUser(response.data);
            } catch {
                // Token expired, logout
                await logout();
            }
        }
    }, [token, logout]);

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper hook to get current user info (for server components replacement)
export function useUser() {
    const { user, isLoading, isAuthenticated } = useAuth();
    return { user, isLoading, isAuthenticated };
}
