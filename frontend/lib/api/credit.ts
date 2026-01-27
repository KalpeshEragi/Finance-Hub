/**
 * @file credit.ts
 * @description Frontend API for credit score endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
// TYPES
// =============================================================================

export interface CreditScoreResult {
    label: string;
    score: number;
    rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    change?: {
        value: number;
        direction: 'up' | 'down' | 'unchanged';
        period: string;
    };
    lastUpdated: string;
}

export interface CreditFactor {
    name: string;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    impact: 'high' | 'medium' | 'low';
    description: string;
}

export interface CreditFactorsResult {
    factors: CreditFactor[];
    summary: string;
}

export interface CreditRecommendation {
    id: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: string;
    actionable: boolean;
}

export interface CreditRecommendationsResult {
    recommendations: CreditRecommendation[];
    totalPotentialImprovement: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get credit score
 */
export async function getCreditScore(): Promise<{ success: boolean; data: CreditScoreResult }> {
    const response = await fetch(`${API_BASE_URL}/credit/score`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get credit score');
    return data;
}

/**
 * Get credit factors
 */
export async function getCreditFactors(): Promise<{ success: boolean; data: CreditFactorsResult }> {
    const response = await fetch(`${API_BASE_URL}/credit/factors`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get credit factors');
    return data;
}

/**
 * Get credit recommendations
 */
export async function getCreditRecommendations(): Promise<{ success: boolean; data: CreditRecommendationsResult }> {
    const response = await fetch(`${API_BASE_URL}/credit/recommendations`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get credit recommendations');
    return data;
}
