/**
 * @file recommendation.service.ts
 * @description Engine to recommend the best payment source based on offers and credit utilization.
 */

import offersData from '../config/offers.json';

interface PaymentSource {
    id: string;
    name: string;
    type: string;
    currentBalance?: number;
    creditLimit?: number;
    usedCredit?: number;
}

interface OfferRule {
    category?: string;
    merchant_keywords?: string[];
    exclude_keywords?: string[];
    reward_type: string;
    multiplier?: number;
    percentage?: number;
    min_amount?: number;
    description: string;
}

interface OfferDefinition {
    id: string;
    name: string;
    type: string;
    rules: OfferRule[];
    base_reward: {
        rate: number;
        description: string;
    };
}

interface RecommendationResult {
    sourceId: string;
    sourceName: string;
    score: number;
    matchReason: string;
    estimatedSavings: number;
    safetyWarning?: string;
    isRecommended: boolean;
}

const SAMPLE_USER_WALLET: PaymentSource[] = [
    { id: 'hdfc_regalia_gold', name: 'HDFC Regalia Gold', type: 'credit_card', creditLimit: 500000, usedCredit: 420000 },
    { id: 'amazon_pay_icici', name: 'Amazon Pay ICICI', type: 'credit_card', creditLimit: 200000, usedCredit: 15000 },
    { id: 'axis_ace', name: 'Axis Ace', type: 'credit_card', creditLimit: 100000, usedCredit: 30000 },
    { id: 'sbi_cashback', name: 'SBI Cashback', type: 'credit_card', creditLimit: 150000, usedCredit: 10000 },
    { id: 'upi_gpay', name: 'Google Pay (UPI)', type: 'upi' },
];

export class RecommendationService {

    static recommend(amount: number, merchant: string, category: string): RecommendationResult[] {
        const normalizedMerchant = merchant.toLowerCase();

        // Cast offersData to typed array
        const allOffers = offersData.offers as OfferDefinition[];

        const results = SAMPLE_USER_WALLET.map(source => {
            let savings = 0;
            let reasoning = "Standard base reward.";
            let score = 0;

            const offerDef = allOffers.find(o => o.id === source.id);

            if (offerDef) {
                let matchedRule: OfferRule | undefined;

                // Priority 1: Merchant Match
                matchedRule = offerDef.rules.find(r =>
                    r.merchant_keywords?.some((k) => normalizedMerchant.includes(k)) &&
                    // Use a safe access or default 0 for min_amount check
                    (!r.min_amount || amount >= r.min_amount)
                );

                // Priority 2: Category Match
                if (!matchedRule) {
                    matchedRule = offerDef.rules.find(r =>
                        r.category === category &&
                        (!r.min_amount || amount >= r.min_amount) &&
                        (!r.exclude_keywords || !r.exclude_keywords.some(k => normalizedMerchant.includes(k)))
                    );
                }

                if (matchedRule) {
                    if (matchedRule.reward_type === 'cashback') {
                        savings = (amount * (matchedRule.percentage || 0)) / 100;
                    } else if (matchedRule.reward_type === 'points') {
                        savings = (amount * 0.04);
                    }
                    reasoning = `🔥 ${matchedRule.description}`;
                    score += 5;
                } else {
                    savings = amount * (offerDef.base_reward.rate || 0);
                    reasoning = offerDef.base_reward.description;
                    score += 2;
                }
            }

            let warning = undefined;
            if (source.type === 'credit_card' && source.creditLimit && source.usedCredit) {
                const util = (source.usedCredit + amount) / source.creditLimit;
                if (util > 0.8) {
                    score -= 4;
                    warning = `High Utilization (${(util * 100).toFixed(0)}%)! Avoid usage.`;
                    reasoning = "⚠️ High Credit Utilization";
                } else if (util < 0.3) {
                    score += 3;
                }
            }

            score += Math.min((savings / 20), 5);

            return {
                sourceId: source.id,
                sourceName: source.name,
                score: Math.round(score * 10) / 10,
                matchReason: reasoning,
                estimatedSavings: Math.round(savings),
                safetyWarning: warning,
                isRecommended: false
            };
        });

        results.sort((a, b) => b.score - a.score);

        const bestRecommendation = results[0];
        if (bestRecommendation) {
            bestRecommendation.isRecommended = true;
        }

        return results;
    }
}
