/**
 * @file emergency-shield.service.ts
 * @description Central Emergency Fund Safety System
 * 
 * This service acts as the GLOBAL SAFETY CONTROLLER for the entire app.
 * It determines what financial actions users can take based on their
 * emergency fund status.
 * 
 * Core principle: "I am protected before I take risks."
 */

import mongoose from 'mongoose';
import Transaction from '../models/transaction.model';
import Goal, { IGoal } from '../models/goal.model';
import Loan from '../models/loan.model';
import balanceService from './balance.service';

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

export interface EmergencyShieldStatus {
    // Computed from transactions
    monthlyEssentialExpenses: number;
    emergencyTarget: number;              // monthlyEssentialExpenses × 3 (minimum)
    emergencyOptimal: number;             // monthlyEssentialExpenses × 6 (optimal)

    // Financial position (from balance service)
    monthlyIncome: number;
    currentMonthExpenses: number;
    netBalance: number;                   // Total ledger balance
    allocatedBalance: number;             // Total allocated to all goals
    freeBalance: number;                  // Net - Allocated (spendable)
    availableBalance: number;             // Alias for freeBalance (backward compat)
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
    targetType?: 'goal' | 'loan';           // Explicit target entity type
}

// =============================================================================
// ESSENTIAL EXPENSE CATEGORIES
// =============================================================================

// Categories that are considered ESSENTIAL for survival
const ESSENTIAL_CATEGORIES = [
    'Rent',
    'Housing',
    'Utilities',
    'Electricity',
    'Water',
    'Gas',
    'Internet',
    'Food & Groceries',
    'Groceries',
    'Healthcare',
    'Medical',
    'Health & Fitness',
    'Insurance',
    'EMI',
    'Loan Payment',
    'Transport',
    'Fuel',
    'Education',
    'Childcare',
];

// Emergency fund type detection patterns
const EMERGENCY_FUND_PATTERNS = [
    { pattern: /medical|health|hospital/i, type: 'medical' },
    { pattern: /job|unemployment|income/i, type: 'job_loss' },
    { pattern: /home|house|repair|maintenance/i, type: 'home' },
    { pattern: /vehicle|car|bike|auto/i, type: 'vehicle' },
    { pattern: /emergency|safety|contingency|rainy/i, type: 'general' },
];

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Calculate monthly essential expenses from transaction history
 * Uses last 3 months average
 */
async function calculateEssentialExpenses(userId: mongoose.Types.ObjectId): Promise<number> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await Transaction.find({
        userId,
        type: 'expense',
        date: { $gte: threeMonthsAgo },
    });

    // Filter to essential categories
    const essentialTransactions = transactions.filter(txn =>
        ESSENTIAL_CATEGORIES.some(cat =>
            txn.category.toLowerCase().includes(cat.toLowerCase())
        )
    );

    const totalEssential = essentialTransactions.reduce((sum, txn) => sum + txn.amount, 0);

    // Average over 3 months
    return Math.round(totalEssential / 3);
}


/**
 * Get all emergency-type goals for a user
 */
async function getEmergencyFunds(userId: mongoose.Types.ObjectId): Promise<EmergencyFund[]> {
    const goals = await Goal.find({
        userId,
        status: 'active',
    });

    // Filter to emergency-type goals
    const emergencyGoals = goals.filter(goal =>
        EMERGENCY_FUND_PATTERNS.some(p => p.pattern.test(goal.title))
    );

    return emergencyGoals.map(goal => {
        // Detect the type based on title
        const matchedPattern = EMERGENCY_FUND_PATTERNS.find(p => p.pattern.test(goal.title));
        const type = (matchedPattern?.type || 'general') as EmergencyFund['type'];

        const progress = goal.targetAmount > 0
            ? (goal.currentAmount / goal.targetAmount) * 100
            : 0;

        return {
            id: (goal._id as mongoose.Types.ObjectId).toString(),
            name: goal.title,
            type,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            isProtected: true, // All emergency funds are protected
            progressPercentage: Math.round(progress * 10) / 10,
            monthlyContribution: 0, // Will be calculated from transactions if needed
            lastContribution: null,
        };
    });
}

/**
 * Get the complete Emergency Shield status for a user
 * This is the MAIN function that determines all financial permissions
 * 
 * NOW WITH TWO-TIER SYSTEM:
 * - Core Emergency: 3-6 months (locked, determines shield status)
 * - Surplus Emergency: >6 months (flexible, can be reallocated)
 */
export async function getEmergencyShieldStatus(
    userId: mongoose.Types.ObjectId
): Promise<EmergencyShieldStatus> {
    // Calculate essential expenses (3-month average)
    const monthlyEssentialExpenses = await calculateEssentialExpenses(userId);

    // Emergency targets
    const emergencyTarget = monthlyEssentialExpenses * 3;  // Minimum (safe)
    const emergencyOptimal = monthlyEssentialExpenses * 6; // Optimal (fully protected)

    // Get balance breakdown from balance service (ledger-correct)
    const balance = await balanceService.getUserBalance(userId, monthlyEssentialExpenses);

    // Get all emergency funds
    const emergencyFunds = await getEmergencyFunds(userId);

    // Total shield = sum of all emergency fund allocations
    const totalEmergencyShield = emergencyFunds.reduce(
        (sum, fund) => sum + fund.currentAmount,
        0
    );

    // TWO-TIER BREAKDOWN
    // Core: Locked, determines shield status (up to 6 months)
    // Surplus: Flexible, can be reallocated (above 6 months)
    const coreEmergency = Math.min(totalEmergencyShield, emergencyOptimal);
    const surplusEmergency = Math.max(0, totalEmergencyShield - emergencyOptimal);

    // Calculate progress based on CORE only
    const progressPercentage = emergencyTarget > 0
        ? Math.round((coreEmergency / emergencyTarget) * 100)
        : 0;

    const coreProgressPercentage = emergencyOptimal > 0
        ? Math.round((coreEmergency / emergencyOptimal) * 100)
        : 0;

    // Determine status based on CORE emergency (not total)
    let status: ShieldStatus;
    let statusLabel: string;
    let statusMessage: string;

    if (coreProgressPercentage >= 100) {
        // 6+ months core
        status = 'safe';
        statusLabel = 'Fully Protected';
        statusMessage = "You're fully protected! You have 6+ months of emergency savings.";
    } else if (progressPercentage >= 100) {
        // 3-6 months core
        status = 'safe';
        statusLabel = 'Protected';
        statusMessage = "You're protected! Keep building to reach 6 months for optimal safety.";
    } else if (progressPercentage >= 50) {
        // 1.5-3 months core
        status = 'partial';
        statusLabel = 'Building';
        statusMessage = "You're making progress! Keep building your safety shield to 3 months.";
    } else {
        // < 1.5 months core
        status = 'at_risk';
        statusLabel = 'At Risk';
        statusMessage = "Your financial safety shield needs attention. Build it first before taking risks.";
    }

    // Calculate shortfalls
    const shortfall = Math.max(0, emergencyTarget - coreEmergency);
    const shortfallToOptimal = Math.max(0, emergencyOptimal - coreEmergency);

    // Determine feature access based on CORE emergency percentage
    const featureAccess: FeatureAccess = {
        // Basic investments unlocked at 3+ months (100%)
        canInvest: progressPercentage >= 100,

        // Loan prepayments and aggressive investments at 6 months (200%)
        canPrepayLoans: coreProgressPercentage >= 100,

        // Non-emergency goals allowed at 50% (1.5 months)
        canAllocateToNonEmergencyGoals: progressPercentage >= 50,

        reason: progressPercentage < 100
            ? `Build your core safety shield first. You need ₹${shortfall.toLocaleString('en-IN')} more to reach 3 months protection.`
            : coreProgressPercentage < 100
                ? `You have 3 months protection. Build to 6 months for optimal safety and unlock all features.`
                : undefined,
    };

    // Calculate recommended monthly contribution (to reach optimal in 6 months)
    const monthsToTarget = 6;
    const recommendedMonthly = shortfallToOptimal > 0
        ? Math.ceil(shortfallToOptimal / monthsToTarget)
        : 0;

    const monthsToSafe = recommendedMonthly > 0
        ? Math.ceil(shortfallToOptimal / recommendedMonthly)
        : 0;

    const recommended = {
        monthlyContribution: recommendedMonthly,
        monthsToSafe,
        priorityMessage: coreProgressPercentage >= 100
            ? "You're fully protected — you can now use surplus efficiently or maintain your shield."
            : progressPercentage >= 100
                ? "You're protected. Build to 6 months for optimal safety and surplus flexibility."
                : "Build your core safety shield first, then take financial risks.",
        actionText: coreProgressPercentage >= 100
            ? "Maintain your shield or use surplus"
            : recommendedMonthly > 0
                ? `Add ₹${recommendedMonthly.toLocaleString('en-IN')}/month to reach optimal in ${monthsToSafe} months`
                : "Maintain your shield",
    };

    // Max contribution is the lesser of: free balance OR shortfall remaining
    const maxContribution = Math.min(balance.freeBalance, shortfallToOptimal);

    // Check if surplus exists for recommendations
    const hasSurplus = surplusEmergency > 0 && coreProgressPercentage >= 100;

    return {
        monthlyEssentialExpenses,
        emergencyTarget,
        emergencyOptimal,
        monthlyIncome: balance.monthlyIncome,
        currentMonthExpenses: balance.currentMonthExpenses,
        netBalance: balance.netBalance,
        allocatedBalance: balance.allocatedBalance,
        freeBalance: balance.freeBalance,
        availableBalance: balance.freeBalance, // Backward compat
        maxContribution,
        totalEmergencyShield,
        coreEmergency,
        surplusEmergency,
        status,
        statusLabel,
        statusMessage,
        progressPercentage,
        coreProgressPercentage,
        shortfall,
        shortfallToOptimal,
        featureAccess,
        emergencyFunds,
        recommended,
        hasSurplus,
        // Surplus recommendations will be added by getSurplusRecommendations if hasSurplus
    };
}

/**
 * Check if a specific feature is accessible based on shield status
 */
export async function checkFeatureAccess(
    userId: mongoose.Types.ObjectId,
    feature: 'invest' | 'prepay_loans' | 'non_emergency_goals'
): Promise<{ allowed: boolean; reason?: string }> {
    const shieldStatus = await getEmergencyShieldStatus(userId);

    let allowed = false;
    switch (feature) {
        case 'invest':
            allowed = shieldStatus.featureAccess.canInvest;
            break;
        case 'prepay_loans':
            allowed = shieldStatus.featureAccess.canPrepayLoans;
            break;
        case 'non_emergency_goals':
            allowed = shieldStatus.featureAccess.canAllocateToNonEmergencyGoals;
            break;
    }

    return {
        allowed,
        reason: allowed ? undefined : shieldStatus.featureAccess.reason,
    };
}

/**
 * Check if an emergency fund can be deleted
 * Returns false if it would drop the shield below the target
 */
export async function canDeleteEmergencyFund(
    userId: mongoose.Types.ObjectId,
    fundId: string
): Promise<{ allowed: boolean; reason?: string }> {
    const shieldStatus = await getEmergencyShieldStatus(userId);

    // Find the fund being deleted
    const fund = shieldStatus.emergencyFunds.find(f => f.id === fundId);
    if (!fund) {
        return { allowed: true }; // Fund doesn't exist
    }

    // Calculate what shield would be after deletion
    const shieldAfterDeletion = shieldStatus.totalEmergencyShield - fund.currentAmount;

    // If deleting would drop below target, block it
    if (shieldAfterDeletion < shieldStatus.emergencyTarget) {
        return {
            allowed: false,
            reason: "This is your safety net. You cannot delete it while your shield is below the required target.",
        };
    }

    return { allowed: true };
}

/**
 * Create a new emergency fund (creates a Goal with emergency pattern in title)
 */
export async function createEmergencyFund(
    userId: mongoose.Types.ObjectId,
    data: {
        name: string;
        type: 'medical' | 'job_loss' | 'home' | 'vehicle' | 'general';
        targetAmount: number;
        initialAmount?: number;
    }
): Promise<EmergencyFund> {
    // Ensure the name contains "Emergency" for pattern matching
    let title = data.name;
    if (!EMERGENCY_FUND_PATTERNS.some(p => p.pattern.test(title))) {
        // Prepend type-specific prefix
        const prefixes: Record<string, string> = {
            medical: 'Medical Emergency',
            job_loss: 'Job Loss Emergency',
            home: 'Home Emergency',
            vehicle: 'Vehicle Emergency',
            general: 'Emergency Fund',
        };
        title = `${prefixes[data.type]} - ${data.name}`;
    }

    const deadline = new Date();
    deadline.setFullYear(deadline.getFullYear() + 1);

    const goal = await Goal.create({
        userId,
        title,
        targetAmount: data.targetAmount,
        currentAmount: data.initialAmount || 0,
        deadline,
        status: 'active',
        priority: 1, // Emergency funds are always high priority
    });

    return {
        id: (goal._id as mongoose.Types.ObjectId).toString(),
        name: goal.title,
        type: data.type,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        isProtected: true,
        progressPercentage: goal.targetAmount > 0
            ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
            : 0,
        monthlyContribution: 0,
        lastContribution: null,
    };
}

/**
 * Add a contribution to an emergency fund
 * Validates that user has sufficient free balance (ledger-correct)
 * Creates a 'Savings' transaction to record the allocation
 */
export async function contributeToEmergencyFund(
    userId: mongoose.Types.ObjectId,
    fundId: string,
    amount: number
): Promise<{ fund: EmergencyFund | null; error?: string }> {
    // Validate amount
    if (amount <= 0) {
        return { fund: null, error: 'Contribution amount must be positive' };
    }

    // Validate user has enough FREE balance (not allocated to other goals)
    const validation = await balanceService.validateAllocation(userId, amount);

    if (!validation.canAllocate) {
        return {
            fund: null,
            error: validation.message || `Insufficient free balance. You have ₹${validation.freeBalance.toLocaleString('en-IN')} available.`,
        };
    }

    // Find the goal
    const goal = await Goal.findOne({
        _id: fundId,
        userId,
    });

    if (!goal) {
        return { fund: null, error: 'Emergency fund not found' };
    }

    // Update the goal allocation (this is an envelope, not independent money)
    goal.currentAmount += amount;
    await goal.save();

    // Create a transaction to record this allocation as a Savings expense
    // This reduces Net Balance, and the goal.currentAmount represents the allocation
    await Transaction.create({
        userId,
        amount,
        type: 'expense',
        category: 'Savings',
        description: `Contribution to ${goal.title}`,
        merchant: 'Emergency Fund',
        date: new Date(),
    });

    // Detect type
    const matchedPattern = EMERGENCY_FUND_PATTERNS.find(p => p.pattern.test(goal.title));
    const type = (matchedPattern?.type || 'general') as EmergencyFund['type'];

    return {
        fund: {
            id: (goal._id as mongoose.Types.ObjectId).toString(),
            name: goal.title,
            type,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            isProtected: true,
            progressPercentage: goal.targetAmount > 0
                ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                : 0,
            monthlyContribution: 0,
            lastContribution: new Date(),
        },
    };
}

/**
 * Check if a goal is an emergency fund
 */
export function isEmergencyFund(goalTitle: string): boolean {
    return EMERGENCY_FUND_PATTERNS.some(p => p.pattern.test(goalTitle));
}

/**
 * Get smart surplus recommendations
 * Triggered when emergency fund exceeds 6 months
 */
export async function getSurplusRecommendations(
    userId: mongoose.Types.ObjectId
): Promise<SurplusRecommendation[]> {
    const shieldStatus = await getEmergencyShieldStatus(userId);

    // Only recommend if surplus exists and core is fully protected
    if (!shieldStatus.hasSurplus || shieldStatus.surplusEmergency <= 0) {
        return [];
    }

    const recommendations: SurplusRecommendation[] = [];

    // -------------------------------------------------------------------------
    // 1) High-priority: Loan prepayment using surplus (real loan entities)
    // -------------------------------------------------------------------------
    const activeLoans = await Loan.find({ userId, status: 'active' });

    if (activeLoans.length > 0) {
        // Rank by monthly interest burn = outstanding × (rate / 12)
        const sortedLoans = [...activeLoans].sort((a, b) => {
            const burnA = a.outstandingAmount * (a.interestRate / 12 / 100);
            const burnB = b.outstandingAmount * (b.interestRate / 12 / 100);
            return burnB - burnA;
        });

        const topLoan = sortedLoans[0]!;
        const monthlyBurn = Math.round(
            topLoan.outstandingAmount * (topLoan.interestRate / 12 / 100)
        );

        const suggestedAmount = Math.min(
            shieldStatus.surplusEmergency,
            Math.max(25000, Math.round(topLoan.emiAmount * 3)) // heuristic: ~3 EMIs or available surplus
        );

        recommendations.push({
            id: `loan-prepay-${(topLoan._id as mongoose.Types.ObjectId).toString()}`,
            category: 'loan_prepayment',
            title: `Use surplus to prepay ${topLoan.name}`,
            description: `Your surplus emergency fund can safely reduce high-cost debt without touching your core 6-month safety buffer.`,
            suggestedAmount,
            priority: 1,
            impact: {
                financialBenefit: `This loan is costing ~₹${monthlyBurn.toLocaleString(
                    'en-IN'
                )}/month in interest. A prepayment directly cuts this burn.`,
                timelineBenefit: 'Prepayment reduces tenure and total interest outgo.',
            },
            safety: {
                coreAfterReallocation: shieldStatus.coreEmergency,
                surplusAfterReallocation: Math.max(
                    0,
                    shieldStatus.surplusEmergency - suggestedAmount
                ),
                statusAfter: shieldStatus.status,
            },
            targetId: (topLoan._id as mongoose.Types.ObjectId).toString(),
            targetType: 'loan',
        });
    }

    // -------------------------------------------------------------------------
    // 2) Non-emergency goals (existing goals from DB, not hard-coded)
    // -------------------------------------------------------------------------
    const allGoals = await Goal.find({ userId, status: 'active' });
    const nonEmergencyGoals = allGoals.filter(
        (g) => !EMERGENCY_FUND_PATTERNS.some((p) => p.pattern.test(g.title))
    );

    if (nonEmergencyGoals.length > 0 && shieldStatus.featureAccess.canInvest) {
        // Promote the highest-priority non-emergency goal
        const sortedGoals = [...nonEmergencyGoals].sort((a, b) => {
            const prioA = typeof a.priority === 'number' ? a.priority : 5;
            const prioB = typeof b.priority === 'number' ? b.priority : 5;
            return prioA - prioB; // lower = higher priority
        });

        const topGoal = sortedGoals[0]!;
        const remaining = Math.max(0, topGoal.targetAmount - topGoal.currentAmount);
        const suggestedAmount = Math.min(
            shieldStatus.surplusEmergency,
            remaining || shieldStatus.surplusEmergency
        );

        if (suggestedAmount > 0) {
            recommendations.push({
                id: `goal-invest-${(topGoal._id as mongoose.Types.ObjectId).toString()}`,
                category: 'low_risk_investment',
                title: `Redirect surplus to "${topGoal.title}"`,
                description:
                    'You are fully protected. It is now safe to let a portion of your surplus work towards specific goals.',
                suggestedAmount,
                priority: recommendations.length + 1,
                impact: {
                    financialBenefit: `Moves ₹${suggestedAmount.toLocaleString(
                        'en-IN'
                    )} from idle surplus towards a real goal without breaking your shield.`,
                },
                safety: {
                    coreAfterReallocation: shieldStatus.coreEmergency,
                    surplusAfterReallocation: Math.max(
                        0,
                        shieldStatus.surplusEmergency - suggestedAmount
                    ),
                    statusAfter: shieldStatus.status,
                },
                targetId: (topGoal._id as mongoose.Types.ObjectId).toString(),
                targetType: 'goal',
            });
        }
    }

    // -------------------------------------------------------------------------
    // 3) Fallback: generic guidance (still DB-driven amounts)
    // -------------------------------------------------------------------------
    if (recommendations.length === 0) {
        recommendations.push({
            id: 'surplus-generic',
            category: 'low_risk_investment',
            title: 'Smart Use of Surplus',
            description: `You have ₹${shieldStatus.surplusEmergency.toLocaleString(
                'en-IN'
            )} in surplus emergency funds beyond your 6-month safety target.`,
            suggestedAmount: shieldStatus.surplusEmergency,
            priority: 3,
            impact: {
                financialBenefit:
                    'Keep surplus for additional safety or consider reallocating a portion to low-risk goals or loans.',
            },
            safety: {
                coreAfterReallocation: shieldStatus.coreEmergency,
                surplusAfterReallocation: shieldStatus.surplusEmergency,
                statusAfter: shieldStatus.status,
            },
        });
    }

    return recommendations;
}

/**
 * Reallocate surplus emergency fund to another goal
 * SAFETY: Only allows reallocation from surplus, never touches core
 */
export async function reallocateSurplus(
    userId: mongoose.Types.ObjectId,
    fromEmergencyId: string,
    toGoalId: string,
    amount: number,
    targetType: 'goal' | 'loan' = 'goal'
): Promise<{ success: boolean; error?: string }> {
    if (amount <= 0) {
        return { success: false, error: 'Reallocation amount must be positive' };
    }

    // Get current shield status
    const shieldStatus = await getEmergencyShieldStatus(userId);

    // Validate surplus exists
    if (amount > shieldStatus.surplusEmergency) {
        return {
            success: false,
            error: `Cannot reallocate from core emergency. You only have ₹${shieldStatus.surplusEmergency.toLocaleString('en-IN')} in surplus.`,
        };
    }

    // Find source emergency goal
    const fromGoal = await Goal.findOne({ _id: fromEmergencyId, userId });

    if (!fromGoal) {
        return { success: false, error: 'Source emergency fund not found' };
    }

    // Verify fromGoal is actually an emergency fund
    if (!isEmergencyFund(fromGoal.title)) {
        return { success: false, error: 'Source goal is not an emergency fund' };
    }

    if (amount > fromGoal.currentAmount) {
        return {
            success: false,
            error: `Insufficient surplus in selected emergency fund. Available: ₹${fromGoal.currentAmount.toLocaleString(
                'en-IN'
            )}.`,
        };
    }

    if (targetType === 'goal') {
        // ---------------------------------------------------------------------
        // Internal envelope reallocation: Emergency → Non-emergency goal
        // Ledger: Net balance does NOT change.
        // ---------------------------------------------------------------------
        const toGoal = await Goal.findOne({ _id: toGoalId, userId });

        if (!toGoal) {
            return { success: false, error: 'Destination goal not found' };
        }

        // Prevent sending back into another emergency fund – surplus is for non-emergency
        if (isEmergencyFund(toGoal.title)) {
            return {
                success: false,
                error: 'Surplus can only be reallocated to non-emergency goals or loans.',
            };
        }

        fromGoal.currentAmount -= amount;
        toGoal.currentAmount += amount;

        await fromGoal.save();
        await toGoal.save();

        // Pure envelope move – Net Balance remains unchanged.
        return { success: true };
    }

    // -------------------------------------------------------------------------
    // targetType === 'loan'
    // Reallocate surplus to an actual loan entity (prepayment).
    // Ledger:
    //   -X from Emergency allocation (envelope shrinks)
    //   + Loan EMI expense transaction (net balance decreases)
    //   - Loan.outstandingAmount reduced by X
    // -------------------------------------------------------------------------
    const loan = await Loan.findOne({ _id: toGoalId, userId, status: 'active' });

    if (!loan) {
        return { success: false, error: 'Loan not found or not active' };
    }

    // Shrink emergency envelope first (use surplus portion; we already validated at shield level)
    fromGoal.currentAmount -= amount;
    await fromGoal.save();

    // Create a loan payment transaction – this is where money leaves the system
    await Transaction.create({
        userId,
        amount,
        type: 'expense',
        category: 'Loan EMI',
        description: `Prepayment using surplus emergency funds for ${loan.name}`,
        merchant: loan.lender || 'Loan Prepayment',
        date: new Date(),
    });

    // Reduce outstanding and close loan if fully repaid
    loan.outstandingAmount = Math.max(0, loan.outstandingAmount - amount);
    if (loan.outstandingAmount <= 0) {
        loan.status = 'closed';
    }
    await loan.save();

    return { success: true };
}

/**
 * Reallocate money BETWEEN emergency funds only.
 * Pure envelope move inside the total emergency pool:
 * - X from one emergency fund
 * + X to another emergency fund
 * Net Balance and total emergency shield remain unchanged.
 */
export async function reallocateWithinEmergency(
    userId: mongoose.Types.ObjectId,
    fromFundId: string,
    toFundId: string,
    amount: number
): Promise<{ success: boolean; error?: string }> {
    if (amount <= 0) {
        return { success: false, error: 'Reallocation amount must be positive' };
    }

    if (fromFundId === toFundId) {
        return { success: false, error: 'Source and destination funds must be different' };
    }

    const fromGoal = await Goal.findOne({ _id: fromFundId, userId });
    const toGoal = await Goal.findOne({ _id: toFundId, userId });

    if (!fromGoal || !toGoal) {
        return { success: false, error: 'Emergency fund not found' };
    }

    if (!isEmergencyFund(fromGoal.title) || !isEmergencyFund(toGoal.title)) {
        return {
            success: false,
            error: 'Both source and destination must be emergency funds',
        };
    }

    if (amount > fromGoal.currentAmount) {
        return {
            success: false,
            error: `Cannot move more than available in source fund. Available: ₹${fromGoal.currentAmount.toLocaleString(
                'en-IN'
            )}.`,
        };
    }

    fromGoal.currentAmount -= amount;
    toGoal.currentAmount += amount;

    await fromGoal.save();
    await toGoal.save();

    // No transaction: this is a pure redistribution inside the emergency pool.
    return { success: true };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const emergencyShieldService = {
    getEmergencyShieldStatus,
    checkFeatureAccess,
    canDeleteEmergencyFund,
    createEmergencyFund,
    contributeToEmergencyFund,
    getEmergencyFunds,
    calculateEssentialExpenses,
    isEmergencyFund,
    getSurplusRecommendations,
    reallocateSurplus,
    reallocateWithinEmergency,
};

export default emergencyShieldService;
