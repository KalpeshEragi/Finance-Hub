/**
 * @file investments.ts
 * @description API functions for investment holdings
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface InvestmentHolding {
    id: string;
    name: string;
    symbol: string;
    type: 'stock' | 'mutual_fund' | 'ppf' | 'other';
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    // New Investment Agent fields
    amount?: number;
    investmentDate?: string;
    investmentMode?: 'sip' | 'lumpsum' | 'stp';
    sipFrequency?: 'weekly' | 'monthly' | 'yearly';
    schemeType?: 'PPF' | 'NPS' | 'EPF' | 'ELSS';
    lastUpdated: string;
}

export interface InvestmentSummary {
    totalInvested: number;
    currentValue: number;
    totalReturns: number;
    returnsPercentage: number;
}

export interface InvestmentResponse {
    success: boolean;
    data: {
        holdings: InvestmentHolding[];
        summary: InvestmentSummary;
    };
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

export async function getInvestments(): Promise<InvestmentResponse> {
    const response = await fetch(`${API_BASE_URL}/investments`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch investments');
    return data;
}

export async function createInvestment(investment: Record<string, any>): Promise<{ success: boolean; data: InvestmentHolding }> {
    const response = await fetch(`${API_BASE_URL}/investments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(investment),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create investment');
    return data;
}

export async function updateInvestment(id: string, investment: Partial<InvestmentHolding>): Promise<{ success: boolean; data: InvestmentHolding }> {
    const response = await fetch(`${API_BASE_URL}/investments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(investment),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update investment');
    return data;
}

export async function deleteInvestment(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/investments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete investment');
    return data;
}