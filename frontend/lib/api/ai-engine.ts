/**
 * @file lib/api/ai-engine.ts
 * @brief Centralized client for AI Engine API endpoints via backend proxy.
 * 
 * @description
 * This module provides type-safe access to AI Engine endpoints:
 * - Digital Twin: Financial future simulation
 * - Behavior: 50-30-20 spending analysis
 * - Alerts: Tax deadlines and compliance checks
 * - Credit: Loan and EMI analysis
 * 
 * @note All requests go through the backend (not directly to AI Engine).
 * Browser → Backend /twin/* → AI Engine localhost:8000
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * @brief Get auth token from cookie.
 * @note Cookie values are URL-encoded when set, so we must decode them.
 */
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length >= 2) {
        const rawValue = parts.pop()?.split(';').shift();
        // Decode the URL-encoded cookie value
        return rawValue ? decodeURIComponent(rawValue) : null;
    }
    return null;
}

/**
 * @brief Make a request to the backend twin proxy.
 */
async function twinRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getCookie('auth_token');

    if (!token) {
        throw new Error("Authentication token missing. Please log in.");
    }

    const url = `${API_URL}/twin${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.detail ||
            data?.message ||
            `Error: ${response.status}`
        );
    }

    return data;
}


// =============================================================================
// DIGITAL TWIN TYPES
// =============================================================================

/**
 * @interface MonthlyExpenses
 * @brief Breakdown of monthly expenses by category.
 */
export interface MonthlyExpenses {
    needs: number;
    wants: number;
    emis: number;
    savings: number;
}


/**
 * @interface CurrentState
 * @brief Current financial state for simulation.
 */
export interface CurrentState {
    savings: number;
    debt: number;
    assets: number;
    monthly_income: number;
    monthly_expenses: MonthlyExpenses;
}

/**
 * @interface EMI
 * @brief EMI/Loan details for simulation.
 */
export interface EMI {
    name: string;
    monthly_amount: number;
    remaining_months: number;
    interest_rate: number;
    principal_remaining?: number;
}

/**
 * @interface Goal
 * @brief Financial goal for simulation tracking.
 */
export interface SimulationGoal {
    name: string;
    target: number;
    current: number;
    deadline: string;
    priority: number;
}

/**
 * @type ScenarioType
 * @brief Available simulation scenarios.
 */
export type ScenarioType =
    | 'baseline'
    | 'increased_savings'
    | 'aggressive_savings'
    | 'job_loss'
    | 'emi_prepayment';

/**
 * @interface TwinSimulateRequest
 * @brief Request payload for digital twin simulation.
 */
export interface TwinSimulateRequest {
    current_state: CurrentState;
    emis?: EMI[];
    goals?: SimulationGoal[];
    projection_months?: number;
    scenario?: ScenarioType;
}

/**
 * @interface MonthlySnapshot
 * @brief Single month's snapshot data from simulation.
 */
export interface MonthlySnapshot {
    month: number;
    date: string;
    income: number;
    expenses: {
        needs: number;
        wants: number;
        emis: number;
        total: number;
    };
    savings_flow: number;
    cumulative_savings: number;
    debt_remaining: number;
    networth: number;
    goal_progress: Array<{
        name: string;
        target: number;
        current: number;
        progress_percent: number;
        remaining: number;
        achieved: boolean;
        on_track: boolean;
    }>;
}

/**
 * @interface SimulationSummary
 * @brief Summary of simulation results.
 */
export interface SimulationSummary {
    initial_networth: number;
    final_networth: number;
    networth_change: number;
    total_savings_added: number;
    total_debt_reduced: number;
    final_savings: number;
    final_debt: number;
    goals_achieved: string[];
    goals_at_risk: Array<{ name: string; target: number; projected: number; shortfall: number; deadline: string }>;
}

/**
 * @interface TwinSimulateResponse
 * @brief Response from digital twin simulation.
 */
export interface TwinSimulateResponse {
    scenario: ScenarioType;
    projection_months: number;
    monthly_snapshots: MonthlySnapshot[];
    summary: SimulationSummary;
    recommendations: Array<{
        type: string;
        priority: string;
        title: string;
        message: string;
        action: string;
    }>;
}

/**
 * @interface ScenarioComparison
 * @brief Comparison of multiple scenarios.
 */
export interface ScenarioComparison {
    scenarios: Record<string, SimulationSummary>;
    best_scenario: string;
    recommendation: string;
}

/**
 * @interface ScenarioDescription
 * @brief Description of a simulation scenario.
 */
export interface ScenarioDescription {
    name: string;
    description: string;
}

// =============================================================================
// DIGITAL TWIN API
// =============================================================================

// MOCK IMPLEMENTATION IMPORT
import { simulateDigitalTwin, compareScenarios as mockCompare, getMockScenarios } from "@/lib/mock/digital-twin-simulator";

/**
 * @brief Helper to simulate network latency
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @brief Get available simulation scenarios.
 * @returns List of scenario names and descriptions
 */
export async function getScenarios(): Promise<{
    scenarios: Record<string, string>;
    default: string;
}> {
    // return twinRequest('/scenarios');
    await delay(500); // Simulate latency
    return getMockScenarios();
}

/**
 * @brief Run a financial simulation.
 * @param request Simulation parameters
 * @returns Simulation results with projections
 */
export async function runSimulation(request: TwinSimulateRequest): Promise<TwinSimulateResponse> {
    // return twinRequest('/simulate', {
    //     method: 'POST',
    //     body: JSON.stringify(request),
    // });
    await delay(1200); // Simulate processing time
    return simulateDigitalTwin(request);
}

/**
 * @brief Compare multiple scenarios side-by-side.
 * @param request Base simulation parameters (scenario field ignored)
 * @returns Comparison of baseline, increased_savings, aggressive_savings
 */
export async function compareScenarios(request: TwinSimulateRequest): Promise<ScenarioComparison> {
    // return twinRequest('/compare', {
    //     method: 'POST',
    //     body: JSON.stringify(request),
    // });
    await delay(2000); // Simulate heavier processing
    return mockCompare(request);
}

// =============================================================================
// BEHAVIOR ANALYSIS TYPES
// =============================================================================

/**
 * @interface TransactionForAnalysis
 * @brief Transaction data for behavior analysis.
 */
export interface TransactionForAnalysis {
    id: string;
    description: string;
    amount: number;
    category?: string;
    merchant?: string;
}

/**
 * @interface BudgetBreakdown
 * @brief 50-30-20 budget breakdown.
 */
export interface BudgetBreakdown {
    needs: { target: number; actual: number; percentage: number };
    wants: { target: number; actual: number; percentage: number };
    savings: { target: number; actual: number; percentage: number };
}

/**
 * @interface BehaviorAnalyzeResponse
 * @brief Response from behavior analysis.
 */
export interface BehaviorAnalyzeResponse {
    health_score: number;
    budget_breakdown: BudgetBreakdown;
    violations: string[];
    recommendations: string[];
    category_breakdown: Record<string, number>;
}

// =============================================================================
// ALERTS TYPES
// =============================================================================

/**
 * @interface Alert
 * @brief Financial alert or reminder.
 */
export interface Alert {
    type: string;
    severity: 'high' | 'medium' | 'low' | 'info';
    title: string;
    message: string;
    due_date?: string;
    action?: string;
}

/**
 * @interface AlertCheckResponse
 * @brief Response from alert check.
 */
export interface AlertCheckResponse {
    alerts: Alert[];
    total_alerts: number;
    high_priority_count: number;
}

/**
 * @interface TaxCalendarEvent
 * @brief Tax calendar event.
 */
export interface TaxCalendarEvent {
    date: string;
    event: string;
    description: string;
    category: string;
}

// =============================================================================
// CREDIT ANALYSIS TYPES
// =============================================================================

/**
 * @interface CreditAnalyzeRequest
 * @brief Request for credit/loan analysis.
 */
export interface CreditAnalyzeRequest {
    monthly_income: number;
    existing_emis: EMI[];
    proposed_loan?: {
        amount: number;
        tenure_months: number;
        interest_rate: number;
    };
}

/**
 * @interface CreditAnalyzeResponse
 * @brief Response from credit analysis.
 */
export interface CreditAnalyzeResponse {
    dti_ratio: number;
    dti_status: 'healthy' | 'warning' | 'critical';
    total_emi_burden: number;
    prepayment_analysis?: {
        savings_if_prepay: number;
        recommended_prepayment: number;
    };
    recommendations: string[];
}

// =============================================================================
// OTHER AI ENDPOINTS (via /ai proxy)
// =============================================================================

async function aiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getCookie('auth_token');
    const url = `${API_URL}/ai${endpoint}`;

    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || result.detail || `Error: ${response.status}`);
    }

    return result.data;
}

/**
 * @brief Analyze spending behavior against 50-30-20 rule.
 */
export async function analyzeBehavior(
    income: number,
    transactions: TransactionForAnalysis[]
): Promise<BehaviorAnalyzeResponse> {
    return aiRequest('/behavior/analyze', {
        method: 'POST',
        body: JSON.stringify({ income, transactions }),
    });
}

/**
 * @brief Check for financial alerts and compliance items.
 */
export async function checkAlerts(
    currentDate: string,
    financialState: {
        filing_status?: { itr_filed_current_fy: boolean; last_itr_date?: string };
        advance_tax?: { paid_q1: number; estimated_liability: number };
        insurance?: Array<{ type: string; expiry: string; premium: number }>;
        budgets?: Array<{ category: string; limit: number; spent: number }>;
    }
): Promise<AlertCheckResponse> {
    return aiRequest('/alerts/check', {
        method: 'POST',
        body: JSON.stringify({
            current_date: currentDate,
            financial_state: financialState,
        }),
    });
}

/**
 * @brief Get tax calendar for a financial year.
 */
export async function getTaxCalendar(fy?: string): Promise<{
    financial_year: string;
    calendar: TaxCalendarEvent[];
}> {
    const url = fy ? `/alerts/calendar?fy=${fy}` : '/alerts/calendar';
    return aiRequest(url);
}

/**
 * @brief Analyze credit health and loan affordability.
 */
export async function analyzeCredit(request: CreditAnalyzeRequest): Promise<CreditAnalyzeResponse> {
    return aiRequest('/credit/analyze', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

// =============================================================================
// EXPORTS
// =============================================================================

export const aiEngine = {
    // Digital Twin (via /twin)
    getScenarios,
    runSimulation,
    compareScenarios,
    // Behavior (via /ai)
    analyzeBehavior,
    // Alerts (via /ai)
    checkAlerts,
    getTaxCalendar,
    // Credit (via /ai)
    analyzeCredit,
};

export default aiEngine;