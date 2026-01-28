/**
 * @file emergency-shield.ts
 * @description API client for Emergency Shield (central financial safety controller)
 * 
 * The Emergency Shield determines what financial actions users can take based on 
 * their emergency fund status. This is the frontend interface for the shield system.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// =============================================================================
// TYPES
// =============================================================================

export type ShieldStatus = 'at_risk' | 'partial' | 'safe';

export interface EmergencyFund {
    id: string;
    name: string;
    type: 'medical' | 'job_loss' | 'home' | 'vehicle' | 'general';
    targetAmount: number;
    currentAmount: number;
    isProtected: boolean;
    progressPercentage: number;
    monthlyContribution: number;
    lastContribution: Date | null;
}

export interface FeatureAccess {
    canInvest: boolean;
    canPrepayLoans: boolean;
    canAllocateToNonEmergencyGoals: boolean;
    reason?: string;
}

export interface SurplusRecommendation {
    id: string;
    category: 'loan_prepayment' | 'low_risk_investment' | 'market_investment';
    title: string;
    description: string;
    suggestedAmount: number;
    priority: number;
    impact: {
        financialBenefit: string;           // e.g., "Save ₹12,000/year in interest"
        timelineBenefit?: string;           // e.g., "Pay off 8 months earlier"
    };
    safety: {
        coreAfterReallocation: number;
        surplusAfterReallocation: number;
        statusAfter: ShieldStatus;
    };
    targetId?: string;                      // Goal or loan ID to reallocate to
    targetType?: 'goal' | 'loan';           // Explicit target type
}

export interface EmergencyShieldStatus {
    // Computed from transactions
    monthlyEssentialExpenses: number;
    emergencyTarget: number;              // 3 months (minimum)
    emergencyOptimal: number;             // 6 months (optimal)

    // Financial position (from balance service)
    monthlyIncome: number;
    currentMonthExpenses: number;
    netBalance: number;                   // Total ledger balance
    allocatedBalance: number;             // Total allocated to all goals
    freeBalance: number;                  // Net - Allocated (spendable)
    availableBalance: number;             // Alias for freeBalance
    maxContribution: number;              // Max amount allowed for contribution

    // Two-tier emergency breakdown
    totalEmergencyShield: number;         // Total emergency allocation
    coreEmergency: number;                // Min(total, 6 months) - LOCKED
    surplusEmergency: number;             // Max(0, total - 6 months) - FLEXIBLE

    // Status determination (based on CORE only)
    status: ShieldStatus;
    statusLabel: string;
    statusMessage: string;
    progressPercentage: number;           // Core / Target (3 months)
    coreProgressPercentage: number;       // Core / Optimal (6 months)
    shortfall: number;                    // To reach 3 months
    shortfallToOptimal: number;           // To reach 6 months

    // Feature access flags
    featureAccess: FeatureAccess;

    // Individual emergency funds
    emergencyFunds: EmergencyFund[];

    // Recommended actions
    recommended: {
        monthlyContribution: number;
        monthsToSafe: number;
        priorityMessage: string;
        actionText: string;
    };

    // Surplus recommendations (when surplus > 0)
    hasSurplus: boolean;
    surplusRecommendations?: SurplusRecommendation[];
}

export interface FeatureAccessCheck {
    allowed: boolean;
    reason?: string;
}

export interface CreateEmergencyFundInput {
    name: string;
    type: 'medical' | 'job_loss' | 'home' | 'vehicle' | 'general';
    targetAmount: number;
    initialAmount?: number;
}

// =============================================================================
// AUTH HELPERS
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
 * Get the user's complete emergency shield status
 * This is the main function that determines all financial permissions
 */
export async function getEmergencyShieldStatus(): Promise<EmergencyShieldStatus> {
    const response = await fetch(`${API_BASE_URL}/emergency-shield/status`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to get emergency shield status');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Check if a specific feature is accessible based on shield status
 */
export async function checkFeatureAccess(
    feature: 'invest' | 'prepay_loans' | 'non_emergency_goals'
): Promise<FeatureAccessCheck> {
    const response = await fetch(`${API_BASE_URL}/emergency-shield/feature-access/${feature}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to check feature access');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Create a new emergency fund
 */
export async function createEmergencyFund(
    input: CreateEmergencyFundInput
): Promise<EmergencyFund> {
    const response = await fetch(`${API_BASE_URL}/emergency-shield/funds`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create emergency fund');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Add a contribution to an emergency fund
 */
export async function contributeToFund(
    fundId: string,
    amount: number
): Promise<{ fund: EmergencyFund; shieldStatus: EmergencyShieldStatus }> {
    const response = await fetch(`${API_BASE_URL}/emergency-shield/funds/${fundId}/contribute`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add contribution');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Check if an emergency fund can be deleted
 */
export async function canDeleteFund(fundId: string): Promise<{ allowed: boolean; reason?: string }> {
    const response = await fetch(`${API_BASE_URL}/emergency-shield/funds/${fundId}/can-delete`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to check delete permission');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Get surplus recommendations (for 6+ month surplus)
 */
export async function getSurplusRecommendations(): Promise<SurplusRecommendation[]> {
    const response = await fetch(`${API_BASE_URL}/emergency-shield/surplus/recommendations`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to get surplus recommendations');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Reallocate surplus emergency fund to another goal
 */
export async function reallocateSurplus(
    fromEmergencyId: string,
    toGoalId: string,
    amount: number,
    targetType: 'goal' | 'loan' = 'goal'
): Promise<{ shieldStatus: EmergencyShieldStatus }> {
    const response = await fetch(`${API_BASE_URL}/emergency-shield/surplus/reallocate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fromEmergencyId, toGoalId, amount, targetType }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reallocate surplus');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Reallocate money between emergency funds (internal redistribution).
 */
export async function reallocateWithinEmergency(
    fromFundId: string,
    toFundId: string,
    amount: number
): Promise<{ shieldStatus: EmergencyShieldStatus }> {
    const response = await fetch(`${API_BASE_URL}/emergency-shield/funds/reallocate-internal`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fromFundId, toFundId, amount }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to redistribute emergency allocations');
    }

    const data = await response.json();
    return data.data;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the color class for a shield status
 */
export function getShieldStatusColor(status: ShieldStatus): {
    bg: string;
    text: string;
    border: string;
    gradient: string;
} {
    switch (status) {
        case 'safe':
            return {
                bg: 'bg-emerald-500/20',
                text: 'text-emerald-400',
                border: 'border-emerald-500/30',
                gradient: 'from-emerald-500/10 to-emerald-600/5',
            };
        case 'partial':
            return {
                bg: 'bg-amber-500/20',
                text: 'text-amber-400',
                border: 'border-amber-500/30',
                gradient: 'from-amber-500/10 to-amber-600/5',
            };
        case 'at_risk':
        default:
            return {
                bg: 'bg-rose-500/20',
                text: 'text-rose-400',
                border: 'border-rose-500/30',
                gradient: 'from-rose-500/10 to-rose-600/5',
            };
    }
}

/**
 * Get the icon name for an emergency fund type
 */
export function getFundTypeIcon(type: EmergencyFund['type']): string {
    switch (type) {
        case 'medical':
            return 'Heart';
        case 'job_loss':
            return 'Briefcase';
        case 'home':
            return 'Home';
        case 'vehicle':
            return 'Car';
        case 'general':
        default:
            return 'Shield';
    }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}

// =============================================================================
// EXPORT
// =============================================================================

export const emergencyShieldApi = {
    getEmergencyShieldStatus,
    checkFeatureAccess,
    createEmergencyFund,
    contributeToFund,
    canDeleteFund,
    getSurplusRecommendations,
    reallocateSurplus,
    reallocateWithinEmergency,
};

export default emergencyShieldApi;
