/**
 * @file loans.ts
 * @description API functions for loans and debt management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Loan {
    id: string;
    name: string;
    loanType: 'home' | 'car' | 'personal' | 'education' | 'credit_card' | 'other';
    principalAmount: number;
    outstandingAmount: number;
    interestRate: number;
    tenureMonths: number;
    emiAmount: number;
    startDate: string;
    nextPaymentDate: string;
    status: 'active' | 'closed' | 'defaulted';
    lender?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LoanSummary {
    totalLoans: number;
    activeLoans: number;
    totalOutstanding: number;
    totalMonthlyEMI: number;
}

export interface LoansResponse {
    success: boolean;
    data: {
        loans: Loan[];
        summary: LoanSummary;
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

export async function getLoans(): Promise<LoansResponse> {
    const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch loans');
    return data;
}

export interface CreateLoanPayload {
    name: string;
    loanType: Loan['loanType'];
    principalAmount: number;
    interestRate: number;
    tenureMonths: number;
    startDate?: string;
    lender?: string;
    description?: string;
    emiAmount?: number; // Optional, will be auto-calculated
}

export async function createLoan(loan: CreateLoanPayload): Promise<{ success: boolean; data: Loan }> {
    const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(loan),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create loan');
    return data;
}

export async function updateLoan(id: string, loan: Partial<Loan>): Promise<{ success: boolean; data: Loan }> {
    const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(loan),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update loan');
    return data;
}

export async function deleteLoan(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete loan');
    return data;
}

export async function recordLoanPayment(id: string, amount?: number): Promise<{ success: boolean; data: Loan; message: string }> {
    const response = await fetch(`${API_BASE_URL}/loans/${id}/payment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to record payment');
    return data;
}

/**
 * Calculate EMI locally for preview (client-side)
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    if (annualRate === 0) {
        return principal / tenureMonths;
    }
    const monthlyRate = annualRate / 12 / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi * 100) / 100;
}

// =============================================================================
// SMART RECOMMENDATIONS TYPES
// =============================================================================

export interface MonthlySavingsData {
    month: string;
    income: number;
    expenses: number;
    surplus: number;
    savingsTransferred: number;
    idleSavings: number;
}

export interface LoanDetail {
    id: string;
    name: string;
    loanType: string;
    outstandingAmount: number;
    interestRate: number;
    emiAmount: number;
    priority: number;
    monthsRemaining: number;
    totalInterestIfContinued: number;
    recommendedAction: string;
}

export interface RepaymentPlan {
    step: number;
    loanId: string;
    loanName: string;
    interestRate: number;
    currentOutstanding: number;
    suggestedPayment: number;
    interestSaved: number;
    newOutstanding: number;
    explanation: string;
}

export interface LoanRecommendation {
    id: string;
    type: 'loan_payoff' | 'investment' | 'savings' | 'budget' | 'emergency_fund';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    potentialSavings?: number;
    actionItems: string[];
    impact: string;
}

export interface FinancialSnapshot {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySurplus: number;
    totalDebt: number;
    monthlyEMI: number;
    totalInvestments: number;
    emergencyFundStatus: 'none' | 'partial' | 'adequate';
    emergencyFundAmount: number;
    averageSavingsRate: number;
    idleCash: number;
    consistentSavingsMonths: number;
}

export interface SmartLoanAdviceResponse {
    success: boolean;
    data: {
        snapshot: FinancialSnapshot;
        monthlySavingsHistory: MonthlySavingsData[];
        loans: LoanDetail[];
        repaymentPlan: RepaymentPlan[];
        recommendations: LoanRecommendation[];
        summary: {
            totalIdleSavings: number;
            totalPotentialInterestSaved: number;
            recommendedFirstPayoff: string | null;
            debtFreeMonthsReduction: number;
        };
    };
}

/**
 * Get smart loan recommendations based on user's actual financial history
 */
export async function getLoanRecommendations(): Promise<SmartLoanAdviceResponse> {
    const response = await fetch(`${API_BASE_URL}/loans/recommendations`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch recommendations');
    return data;
}

