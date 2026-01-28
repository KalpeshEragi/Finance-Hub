/**
 * @file recommendations.ts
 * @description API functions for investment recommendations and agent explanations.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// =============================================================================
// TYPES
// =============================================================================

export interface Recommendation {
    id: string;
    type: 'emergency_fund' | 'ppf' | 'index_sip' | 'elss' | 'stocks' | 'liquid_fund';
    name: string;
    allocation: string;
    allocationRange: [number, number];
    monthlyAmount: number;
    reason: string;
    actionItem: string;
    priority: 1 | 2;
    riskLevel: 'low' | 'medium' | 'high';
    taxBenefit: boolean;
}

export interface RecommendationContext {
    monthlyIncome: number;
    monthlySurplus: number;
    savingsRate: number;
    emergencyFundMonths: number;
    debtToIncomeRatio: number;
}

export interface RecommendationsResponse {
    success: boolean;
    data: {
        recommendations: Recommendation[];
        summary: string;
        totalAllocation: string;
        totalMonthlyAmount: number;
        readinessStatus: 'READY' | 'CAUTION' | 'NOT_READY';
        riskProfile: 'Stability-Focused' | 'Growth-Ready' | 'Growth-Optimized';
        confidence: number;
        context: RecommendationContext;
    };
}

export interface KeyInsight {
    type: 'strength' | 'caution' | 'blocker';
    message: string;
    priority: number;
}

export interface AgentExplanation {
    headline: string;
    summary: string[];
    keyInsights: KeyInsight[];
    actionPlan: string[];
    personalNote: string;
    metadata: {
        generationMode: string;
        readinessStatus: string;
        riskProfile: string;
    };
}

export interface AgentExplanationResponse {
    success: boolean;
    data: {
        explanation: AgentExplanation;
        readiness: {
            status: string;
            score: number;
        };
        riskProfile: {
            profile: string;
            confidence: number;
        };
        recommendations: {
            name: string;
            allocation: string;
            monthlyAmount: number;
        }[];
    };
}

// =============================================================================
// HELPERS
// =============================================================================

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
// API FUNCTIONS
// =============================================================================

/**
 * Get investment recommendations from the backend.
 */
export async function getInvestmentRecommendations(): Promise<RecommendationsResponse> {
    const response = await fetch(`${API_BASE_URL}/investment-recommendations`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch recommendations');
    return data;
}

/**
 * Get agent explanation with action plan.
 */
export async function getAgentExplanation(): Promise<AgentExplanationResponse> {
    const response = await fetch(`${API_BASE_URL}/agent/explanation`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch agent explanation');
    return data;
}

/**
 * Get template-based explanation (faster, no LLM).
 */
export async function getAgentExplanationTemplate(): Promise<AgentExplanationResponse> {
    const response = await fetch(`${API_BASE_URL}/agent/explanation/template`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch explanation');
    return data;
}

// =============================================================================
// RISK PROFILE API
// =============================================================================

export interface RiskProfileResponse {
    success: boolean;
    data: {
        profile: 'Stability-Focused' | 'Growth-Ready' | 'Growth-Optimized';
        confidence: number;
        signals: Record<string, any>;
        reasoning: string[];
        recommendations: string[];
    };
}

/**
 * Get user's risk profile from the backend.
 */
export async function getRiskProfile(): Promise<RiskProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/risk-profile`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch risk profile');
    return data;
}
