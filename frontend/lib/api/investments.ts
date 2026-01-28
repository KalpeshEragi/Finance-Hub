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

// =============================================================================
// INVESTMENT AGENT TYPES & API
// =============================================================================

export type ReadinessStatus = 'READY' | 'NOT_READY' | 'CAUTION';
export type BlockerSeverity = 'high' | 'medium' | 'low';
export type InvestmentRiskLevel = 'conservative' | 'moderate' | 'aggressive';

export interface ReadinessBlocker {
    rule: string;
    description: string;
    current: number;
    threshold: number;
    severity: BlockerSeverity;
    message: string;
}

export interface InvestmentReadinessResult {
    status: ReadinessStatus;
    score: number;
    reasons: string[];
    blockers: ReadinessBlocker[];
    recommendations: string[];
}

export interface InvestmentSuggestion {
    id: string;
    name: string;
    type: 'equity' | 'debt' | 'hybrid' | 'tax_saving';
    riskLevel: InvestmentRiskLevel;
    expectedReturns: string;
    minAmount: number;
    lockInPeriod: string | null;
    taxBenefit: boolean;
    suitableFor: string[];
    whyRecommended: string;
    actionItem: string;
}

export interface PersonalizedInvestmentAdvice {
    readinessBlock: {
        headline: string;
        status: ReadinessStatus;
        score: number;
        summary: string;
        topBlockers: ReadinessBlocker[];
    };
    recommendationsBlock: {
        headline: string;
        suggestions: InvestmentSuggestion[];
        monthlyInvestmentCapacity: number;
        sipRecommendation: string | null;
    };
    nextStepsBlock: {
        headline: string;
        steps: { stepNumber: number; action: string; reason: string }[];
        encouragement: string;
    };
    coachNote: string;
}

export interface InvestmentAgentResponse {
    readiness: InvestmentReadinessResult;
    suggestions: InvestmentSuggestion[];
    personalizedAdvice: PersonalizedInvestmentAdvice;
    financialSnapshot: {
        monthlyIncome: number;
        monthlyExpense: number;
        monthlySurplus: number;
        savingsRate: number;
        emergencyFundMonths: number;
        totalDebt: number;
        emiToIncomeRatio: number;
    };
}

/**
 * @brief Get investment readiness assessment and personalized advice.
 * @returns Investment agent response with readiness, suggestions, and advice.
 */
export async function getInvestmentAdvice(): Promise<{ success: boolean; data: InvestmentAgentResponse }> {
    const response = await fetch(`${API_BASE_URL}/investment-agent/advice`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch investment advice');
    return data;
}