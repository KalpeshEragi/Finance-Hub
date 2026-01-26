/**
 * @file tax.ts
 * @description API functions for tax management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type TaxRegime = 'old' | 'new';

export interface IncomeDetails {
    salary: number;
    rental: number;
    otherSources: number;
    business: number;
    capitalGains: {
        shortTerm: number;
        longTerm: number;
    };
}

export interface DeductionDetails {
    section80C: number;
    section80D: number;
    section80G: number;
    homeLoanInterest: number;
    hra: number;
    lta: number;
    standardDeduction: number;
    professionalTax: number;
    nps: number;
}

export interface TaxEstimate {
    regime: TaxRegime;
    grossIncome: number;
    totalDeductions: number;
    taxableIncome: number;
    taxBeforeCess: number;
    cess: number;
    totalTax: number;
    effectiveTaxRate: number;
    slabBreakdown: Array<{
        slab: string;
        income: number;
        tax: number;
        rate: number;
    }>;
}

export interface TaxComparison {
    oldRegime: TaxEstimate;
    newRegime: TaxEstimate;
    recommended: TaxRegime;
    savings: number;
    explanation: string;
}

export interface TaxProfile {
    id: string;
    financialYear: string;
    preferredRegime: TaxRegime;
    income: IncomeDetails;
    deductions: DeductionDetails;
    grossTotalIncome: number;
    totalDeductions: number;
}

export interface IncomeInput {
    type: 'salary' | 'rental' | 'business' | 'other' | 'capital_gains_short' | 'capital_gains_long';
    amount: number;
    period: 'monthly' | 'annually';
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
 * Get tax estimate comparison
 */
export async function getTaxEstimate(): Promise<{ success: boolean; data: TaxComparison }> {
    const response = await fetch(`${API_BASE_URL}/tax/estimate`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch tax estimate');
    return data;
}

/**
 * Get tax deductions with limits and suggestions
 */
export async function getTaxDeductions(): Promise<{
    success: boolean;
    data: {
        claimed: DeductionDetails;
        limits: Partial<Record<keyof DeductionDetails, number>>;
        remaining: Partial<Record<keyof DeductionDetails, number>>;
        suggestions: Array<{ section: string; title: string; description: string; potentialSavings: number; priority: 'high' | 'medium' | 'low' }>;
    }
}> {
    const response = await fetch(`${API_BASE_URL}/tax/deductions`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch tax deductions');
    return data;
}

/**
 * Get current regime preference
 */
export async function getTaxRegime(): Promise<{ success: boolean; data: { currentRegime: TaxRegime; comparison: TaxComparison } }> {
    const response = await fetch(`${API_BASE_URL}/tax/regime`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch tax regime');
    return data;
}

/**
 * Add or update income source
 */
export async function updateTaxIncome(input: IncomeInput): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/tax/income`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update income');
    return data;
}

// ... (existing exports)

export interface ITRRecommendation {
    form: string;
    reason: string;
    description: string;
}

/**
 * Get ITR form recommendation
 */
export async function getITRRecommendation(): Promise<{ success: boolean; data: ITRRecommendation }> {
    const response = await fetch(`${API_BASE_URL}/tax/recommendation`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch ITR recommendation');
    return data;
}

/**
 * Update deductions
 */
export async function updateTaxDeductions(deductions: Partial<DeductionDetails>): Promise<{ success: boolean; data: TaxProfile }> {
    const response = await fetch(`${API_BASE_URL}/tax/profile`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ deductions }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update deductions');
    return data;
}

// =============================================================================
// TAX GUIDANCE (Rule-Based)
// =============================================================================

export interface TaxGuidanceInput {
    individualType: 'salaried' | 'self_employed' | 'business_owner';
    incomeRange: '0-5L' | '5-10L' | '10-15L' | '15-25L' | '25-50L' | '50L+';
    ageGroup: 'below_60' | '60_to_80' | 'above_80';
    regimePreference: 'not_decided' | 'old' | 'new';
    deductions?: {
        hasEPF?: boolean;
        hasPPF?: boolean;
        hasELSS?: boolean;
        hasNPS?: boolean;
        hasHomeLoan?: boolean;
        hasEducationLoan?: boolean;
        hasHealthInsurance?: boolean;
    };
}

export interface TaxSavingSuggestion {
    section: string;
    title: string;
    benefit: string;
    maxDeduction: number;
    applicable: boolean;
    priority: 'high' | 'medium' | 'low';
}

export interface TaxGuidanceOutput {
    itrForm: {
        suggested: string;
        reason: string;
    };
    regimeComparison: {
        oldRegimeBenefits: string[];
        newRegimeBenefits: string[];
        recommendation: string;
        estimatedDifference?: string;
        isEstimate: true;
    };
    suggestions: TaxSavingSuggestion[];
    disclaimers: string[];
}

/**
 * Get rule-based tax guidance
 */
export async function getTaxGuidance(input: TaxGuidanceInput): Promise<{ success: boolean; data: TaxGuidanceOutput }> {
    const response = await fetch(`${API_BASE_URL}/tax/guidance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get tax guidance');
    return data;
}