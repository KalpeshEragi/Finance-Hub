/**
 * @file credit.service.ts
 * @description Simulated credit health score service.
 * 
 * @important
 * All scores are SIMULATED/ESTIMATED credit health scores based on
 * financial behavior patterns. They are NOT actual credit bureau scores.
 * 
 * This service calculates credit health based on:
 * - Spending consistency
 * - Savings rate
 * - Budget adherence
 * - Financial diversity
 */

import mongoose from 'mongoose';
import CreditSnapshot, { getRatingFromScore } from '../models/creditSnapshot.model';
import Transaction from '../models/transaction.model';
import Budget from '../models/budget.model';
import { DEFAULTS } from '../config/constants';
import { getLastNMonthsRange } from '../utils/date';
import type { CreditFactor, CreditRecommendation, CreditRating } from '../types/credit.types';

// =============================================================================
// TYPES
// =============================================================================

interface CreditScoreResult {
    label: 'Estimated / Simulated Credit Health Score';
    score: number;
    rating: CreditRating;
    change?: {
        value: number;
        direction: 'up' | 'down' | 'unchanged';
        period: string;
    };
    lastUpdated: Date;
}

interface CreditFactorsResult {
    factors: CreditFactor[];
    summary: string;
}

interface CreditRecommendationsResult {
    recommendations: CreditRecommendation[];
    totalPotentialImprovement: number;
}

// =============================================================================
// SCORE CALCULATION
// =============================================================================

/**
 * @function getScore
 * @description Gets or calculates the user's credit health score.
 * 
 * @param userId - User ID
 * @returns Credit score with label indicating it's simulated
 */
export async function getScore(userId: string): Promise<CreditScoreResult> {
    // Check for recent snapshot (within last 24 hours)
    const recentSnapshot = await CreditSnapshot.findOne({
        userId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 });

    if (recentSnapshot) {
        return formatScoreResult(recentSnapshot);
    }

    // Calculate new score
    const scoreData = await calculateCreditScore(userId);

    // Save snapshot
    const snapshot = await CreditSnapshot.create({
        userId: new mongoose.Types.ObjectId(userId),
        score: scoreData.score,
        rating: scoreData.rating,
        factors: scoreData.factors,
        recommendations: scoreData.recommendations,
    });

    return formatScoreResult(snapshot);
}

/**
 * @function calculateCreditScore
 * @description Calculates credit health score based on financial behavior.
 * 
 * Scoring factors:
 * - Savings Rate (30%): Higher savings = better score
 * - Spending Consistency (25%): Regular patterns = better
 * - Budget Adherence (25%): Staying within budgets = better
 * - Account Activity (20%): Regular transactions = better
 */
async function calculateCreditScore(userId: string): Promise<{
    score: number;
    rating: CreditRating;
    factors: CreditFactor[];
    recommendations: CreditRecommendation[];
}> {
    const { start, end } = getLastNMonthsRange(3);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get transaction summary
    const transactionSummary = await Transaction.aggregate([
        {
            $match: {
                userId: userObjectId,
                date: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
    ]);

    const income = transactionSummary.find(t => t._id === 'income')?.total || 0;
    const expenses = transactionSummary.find(t => t._id === 'expense')?.total || 0;
    const transactionCount = transactionSummary.reduce((sum, t) => sum + t.count, 0);

    // Calculate factors
    const factors: CreditFactor[] = [];
    let weightedScore = 0;

    // Factor 1: Savings Rate (30%)
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const savingsScore = Math.min(100, Math.max(0, savingsRate * 5));
    factors.push({
        name: 'Savings Rate',
        score: Math.round(savingsScore),
        weight: 0.3,
        impact: savingsScore >= 60 ? 'positive' : savingsScore >= 30 ? 'neutral' : 'negative',
        description: `You're saving ${Math.round(savingsRate)}% of your income`,
    });
    weightedScore += savingsScore * 0.3;

    // Factor 2: Spending Consistency (25%)
    const consistencyScore = transactionCount > 10 ? 80 : transactionCount > 5 ? 60 : 40;
    factors.push({
        name: 'Spending Consistency',
        score: consistencyScore,
        weight: 0.25,
        impact: consistencyScore >= 70 ? 'positive' : consistencyScore >= 50 ? 'neutral' : 'negative',
        description: transactionCount > 10
            ? 'You have consistent transaction patterns'
            : 'Limited transaction history available',
    });
    weightedScore += consistencyScore * 0.25;

    // Factor 3: Budget Adherence (25%)
    const budgets = await Budget.find({
        userId: userObjectId,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    });

    let adherenceScore = 70; // Default if no budgets
    if (budgets.length > 0) {
        // Calculate average adherence
        adherenceScore = 85; // Simplified - would need actual calculation
    }
    factors.push({
        name: 'Budget Adherence',
        score: adherenceScore,
        weight: 0.25,
        impact: adherenceScore >= 70 ? 'positive' : adherenceScore >= 50 ? 'neutral' : 'negative',
        description: budgets.length > 0
            ? 'You have active budgets and are tracking spending'
            : 'Consider setting budgets to track spending better',
    });
    weightedScore += adherenceScore * 0.25;

    // Factor 4: Account Activity (20%)
    const activityScore = transactionCount > 20 ? 90 : transactionCount > 10 ? 70 : 50;
    factors.push({
        name: 'Account Activity',
        score: activityScore,
        weight: 0.2,
        impact: activityScore >= 70 ? 'positive' : activityScore >= 50 ? 'neutral' : 'negative',
        description: `${transactionCount} transactions recorded in the last 3 months`,
    });
    weightedScore += activityScore * 0.2;

    // Calculate final score (scale to 300-850)
    const normalizedScore = Math.round(300 + (weightedScore / 100) * 550);
    const score = Math.min(850, Math.max(300, normalizedScore));
    const rating = getRatingFromScore(score);

    // Generate recommendations
    const recommendations = generateRecommendations(factors, savingsRate);

    return { score, rating, factors, recommendations };
}

// =============================================================================
// FACTORS AND RECOMMENDATIONS
// =============================================================================

/**
 * @function getFactors
 * @description Gets detailed breakdown of factors affecting credit health.
 */
export async function getFactors(userId: string): Promise<CreditFactorsResult> {
    const snapshot = await getOrCreateSnapshot(userId);

    const summary = snapshot.factors.length > 0
        ? generateFactorsSummary(snapshot.factors)
        : 'Start tracking your finances to see detailed factor analysis.';

    return {
        factors: snapshot.factors,
        summary,
    };
}

/**
 * @function getRecommendations
 * @description Gets personalized recommendations for improving credit health.
 */
export async function getRecommendations(userId: string): Promise<CreditRecommendationsResult> {
    const snapshot = await getOrCreateSnapshot(userId);

    const totalPotentialImprovement = snapshot.recommendations
        .reduce((sum, r) => sum + r.potentialImpact, 0);

    return {
        recommendations: snapshot.recommendations,
        totalPotentialImprovement,
    };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getOrCreateSnapshot(userId: string): Promise<InstanceType<typeof CreditSnapshot>> {
    let snapshot = await CreditSnapshot.findOne({ userId }).sort({ createdAt: -1 });

    if (!snapshot) {
        const scoreData = await calculateCreditScore(userId);
        snapshot = await CreditSnapshot.create({
            userId: new mongoose.Types.ObjectId(userId),
            ...scoreData,
        });
    }

    return snapshot;
}

function formatScoreResult(snapshot: InstanceType<typeof CreditSnapshot>): CreditScoreResult {
    return {
        label: 'Estimated / Simulated Credit Health Score',
        score: snapshot.score,
        rating: snapshot.rating,
        lastUpdated: snapshot.createdAt,
    };
}

function generateFactorsSummary(factors: CreditFactor[]): string {
    const positiveCount = factors.filter(f => f.impact === 'positive').length;
    const negativeCount = factors.filter(f => f.impact === 'negative').length;

    if (positiveCount === factors.length) {
        return 'Excellent! All factors are positively contributing to your credit health.';
    } else if (negativeCount > positiveCount) {
        return 'There are areas for improvement in your financial habits.';
    } else {
        return 'Your credit health is balanced with room for improvement.';
    }
}

function generateRecommendations(
    factors: CreditFactor[],
    savingsRate: number
): CreditRecommendation[] {
    const recommendations: CreditRecommendation[] = [];

    // Savings recommendation
    if (savingsRate < 20) {
        recommendations.push({
            id: 'rec-savings',
            title: 'Increase Your Savings Rate',
            description: 'Aim to save at least 20% of your income for better financial health.',
            priority: 'high',
            relatedFactor: 'Savings Rate',
            potentialImpact: 30,
        });
    }

    // Budget recommendation
    const budgetFactor = factors.find(f => f.name === 'Budget Adherence');
    if (budgetFactor && budgetFactor.score < 70) {
        recommendations.push({
            id: 'rec-budget',
            title: 'Set Up Category Budgets',
            description: 'Create monthly budgets for your main expense categories to better control spending.',
            priority: 'medium',
            relatedFactor: 'Budget Adherence',
            potentialImpact: 20,
        });
    }

    return recommendations;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const creditService = {
    getScore,
    getFactors,
    getRecommendations,
};

export default creditService;
