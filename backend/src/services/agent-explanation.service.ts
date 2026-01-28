/**
 * @file agent-explanation.service.ts
 * @description Backend service for Agent Explanation Layer.
 * 
 * Aggregates data from:
 * - investment-agent.service (readiness)
 * - risk-profile.service (profile)
 * - recommendation-engine.service (recommendations)
 * 
 * Sends to AI Engine for explanation generation.
 */

import axios from 'axios';
import { getLedgerSnapshot } from './ledger.service';
import { evaluateInvestmentReadiness } from './investment-agent.service';
import { getUserRiskProfile, RiskProfileResult } from './risk-profile.service';
import { generateRecommendations, RecommendationResult } from './recommendation-engine.service';
import mongoose from 'mongoose';

// =============================================================================
// CONFIGURATION
// =============================================================================

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

// =============================================================================
// TYPES
// =============================================================================

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
        confidence?: number;
    };
}

export interface AgentExplanationResult {
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
}

// =============================================================================
// AI ENGINE INTEGRATION
// =============================================================================

interface AIEngineExplanationInput {
    readiness: {
        status: string;
        score: number;
        blockers: {
            rule_id: string;
            severity: string;
            description: string;
            message: string;
            action_required: string;
        }[];
        reasons: string[];
    };
    risk_profile: {
        profile: string;
        confidence: number;
        reasoning: string[];
        signals: Record<string, unknown>;
    };
    recommendations: {
        id: string;
        type: string;
        name: string;
        allocation: string;
        monthly_amount: number;
        reason: string;
        action_item: string;
        priority: number;
        risk_level: string;
        tax_benefit: boolean;
    }[];
    financial_context: {
        monthly_income: number;
        monthly_surplus: number;
        savings_rate: number;
        emergency_fund_months: number;
        debt_to_income_ratio: number;
    };
}

async function callAIEngineExplanation(input: AIEngineExplanationInput): Promise<AgentExplanation> {
    try {
        const response = await axios.post(
            `${AI_ENGINE_URL}/agent/explanation`,
            input,
            { timeout: 10000 }
        );

        const data = response.data;

        return {
            headline: data.headline,
            summary: data.summary,
            keyInsights: data.key_insights?.map((i: { type: string; message: string; priority: number }) => ({
                type: i.type,
                message: i.message,
                priority: i.priority,
            })) || [],
            actionPlan: data.action_plan,
            personalNote: data.personal_note,
            metadata: {
                generationMode: data.metadata?.generation_mode || 'ai_engine',
                readinessStatus: data.metadata?.readiness_status,
                riskProfile: data.metadata?.risk_profile,
            },
        };
    } catch (error) {
        console.error('AI Engine explanation call failed:', error);
        throw error;
    }
}

// =============================================================================
// FALLBACK GENERATION (Template-based)
// =============================================================================

function generateFallbackExplanation(
    readinessStatus: string,
    riskProfile: string,
    recommendations: RecommendationResult,
    savingsRate: number
): AgentExplanation {
    // Headline based on readiness
    let headline = '';
    if (readinessStatus === 'READY') {
        headline = "You're Ready to Start Investing! 🎉";
    } else if (readinessStatus === 'CAUTION') {
        headline = 'Almost There — A Few Adjustments Needed';
    } else {
        headline = "Let's Build Your Foundation First 🏗️";
    }

    // Summary points
    const summary: string[] = [];
    summary.push(`Your ${riskProfile} profile guides your investment approach.`);

    if (recommendations.recommendations.length > 0) {
        const rec = recommendations.recommendations[0];
        summary.push(`Start with ${rec?.allocation} of income in ${rec?.name}.`);
    }

    if (savingsRate > 20) {
        summary.push(`Your ${savingsRate.toFixed(0)}% savings rate is excellent.`);
    } else if (savingsRate > 10) {
        summary.push('Consider increasing your savings rate to 20% for faster growth.');
    }

    // Action plan
    const actionPlan: string[] = [];

    if (readinessStatus === 'NOT_READY') {
        actionPlan.push('Build emergency fund to cover 3 months of expenses.');
    }

    recommendations.recommendations.slice(0, 2).forEach(rec => {
        if (rec.monthlyAmount > 0) {
            actionPlan.push(`Start ₹${rec.monthlyAmount.toLocaleString('en-IN')}/month in ${rec.name}.`);
        }
    });

    if (actionPlan.length < 3) {
        actionPlan.push('Set up auto-debit for consistent investing.');
    }

    // Personal note
    let personalNote = '';
    if (readinessStatus === 'READY') {
        personalNote = "You're ahead of most young Indians. Let compounding work for you!";
    } else if (readinessStatus === 'CAUTION') {
        personalNote = "You're on the right track! Address the gaps and you'll be fully ready soon.";
    } else {
        personalNote = 'Building your foundation first is the smartest investment you can make.';
    }

    return {
        headline,
        summary: summary.slice(0, 3),
        keyInsights: [],
        actionPlan: actionPlan.slice(0, 3),
        personalNote,
        metadata: {
            generationMode: 'fallback',
            readinessStatus,
            riskProfile,
        },
    };
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

export async function getAgentExplanation(
    userId: string,
    useAIEngine: boolean = true
): Promise<AgentExplanationResult> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Get all required data
    const snapshot = await getLedgerSnapshot(userId);
    const readiness = await evaluateInvestmentReadiness(userObjectId, snapshot);
    const riskProfile = await getUserRiskProfile(userId);
    const recommendations = await generateRecommendations(userId);

    const { dashboard, riskIndicators } = snapshot;
    const monthlyIncome = dashboard.totalIncome / 6;
    const monthlySurplus = dashboard.netBalance / 6;

    // 2. Prepare AI Engine input
    const aiInput: AIEngineExplanationInput = {
        readiness: {
            status: readiness.status,
            score: readiness.score,
            blockers: readiness.blockers.map(b => ({
                rule_id: b.rule,
                severity: b.severity,
                description: b.description,
                message: b.message,
                action_required: '',
            })),
            reasons: readiness.reasons,
        },
        risk_profile: {
            profile: riskProfile.profile,
            confidence: riskProfile.confidence,
            reasoning: riskProfile.reasoning,
            signals: riskProfile.signals as unknown as Record<string, unknown>,
        },
        recommendations: recommendations.recommendations.map(r => ({
            id: r.id,
            type: r.type,
            name: r.name,
            allocation: r.allocation,
            monthly_amount: r.monthlyAmount,
            reason: r.reason,
            action_item: r.actionItem,
            priority: r.priority,
            risk_level: r.riskLevel,
            tax_benefit: r.taxBenefit,
        })),
        financial_context: {
            monthly_income: Math.round(monthlyIncome),
            monthly_surplus: Math.round(monthlySurplus),
            savings_rate: riskIndicators.savingsRate,
            emergency_fund_months: riskIndicators.emergencyFundCoverage,
            debt_to_income_ratio: riskIndicators.debtToIncomeRatio,
        },
    };

    // 3. Generate explanation
    let explanation: AgentExplanation;

    if (useAIEngine) {
        try {
            explanation = await callAIEngineExplanation(aiInput);
        } catch {
            // Fallback to template
            explanation = generateFallbackExplanation(
                readiness.status,
                riskProfile.profile,
                recommendations,
                riskIndicators.savingsRate
            );
        }
    } else {
        explanation = generateFallbackExplanation(
            readiness.status,
            riskProfile.profile,
            recommendations,
            riskIndicators.savingsRate
        );
    }

    // 4. Return complete result
    return {
        explanation,
        readiness: {
            status: readiness.status,
            score: readiness.score,
        },
        riskProfile: {
            profile: riskProfile.profile,
            confidence: riskProfile.confidence,
        },
        recommendations: recommendations.recommendations.map(r => ({
            name: r.name,
            allocation: r.allocation,
            monthlyAmount: r.monthlyAmount,
        })),
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const agentExplanationService = {
    getAgentExplanation,
};

export default agentExplanationService;
