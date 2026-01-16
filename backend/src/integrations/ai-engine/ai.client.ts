/**
 * @file ai.client.ts
 * @description Axios client for communicating with the AI Engine service.
 * 
 * This module provides a configured HTTP client for:
 * - Transaction categorization
 * - Tax optimization suggestions
 * - Spending pattern analysis
 * 
 * @architecture
 * The client handles:
 * - Base URL configuration from environment
 * - Request/response interceptors for logging
 * - Timeout handling
 * - Error transformation
 * - Fallback responses when AI service is unavailable
 * 
 * @usage
 * import { aiClient } from './integrations/ai-engine/ai.client';
 * const result = await aiClient.categorize(transactions);
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '../../config/env';
import { TRANSACTION_CATEGORIES } from '../../config/constants';
import type {
    CategoryRequest,
    CategoryResponse,
    CategoryTransactionInput,
    CategoryResult,
    TaxSuggestionRequest,
    TaxSuggestionResponse,
    SpendingAnalysisRequest,
    SpendingAnalysisResponse,
    AIEngineError,
} from './ai.types';

// =============================================================================
// CLIENT CONFIGURATION
// =============================================================================

/**
 * @constant AI_ENGINE_TIMEOUT
 * @description Request timeout in milliseconds.
 * AI services can be slow - allow reasonable time for processing.
 */
const AI_ENGINE_TIMEOUT = 30000; // 30 seconds

/**
 * @function createAIClient
 * @description Creates and configures the Axios instance for AI Engine.
 * 
 * @returns Configured Axios instance
 */
function createAIClient(): AxiosInstance {
    const client = axios.create({
        baseURL: env.AI_ENGINE_URL,
        timeout: AI_ENGINE_TIMEOUT,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });

    // ===========================================================================
    // REQUEST INTERCEPTOR
    // ===========================================================================

    client.interceptors.request.use(
        (config) => {
            // Log outgoing requests in development
            if (env.NODE_ENV !== 'production') {
                console.log(`🤖 AI Engine Request: ${config.method?.toUpperCase()} ${config.url}`);
            }
            return config;
        },
        (error) => {
            console.error('AI Engine request error:', error);
            return Promise.reject(error);
        }
    );

    // ===========================================================================
    // RESPONSE INTERCEPTOR
    // ===========================================================================

    client.interceptors.response.use(
        (response) => {
            // Log responses in development
            if (env.NODE_ENV !== 'production') {
                console.log(`✅ AI Engine Response: ${response.status}`);
            }
            return response;
        },
        (error: AxiosError) => {
            // Transform error for consistent handling
            console.error('AI Engine response error:', error.message);
            return Promise.reject(error);
        }
    );

    return client;
}

// Create the client instance
const client = createAIClient();

// =============================================================================
// CATEGORIZATION FUNCTIONS
// =============================================================================

/**
 * @function categorize
 * @description Sends transactions to AI Engine for categorization.
 * 
 * Falls back to rule-based categorization if AI service is unavailable.
 * 
 * @param transactions - Array of transactions to categorize
 * @returns Categorization results
 * 
 * @example
 * const results = await aiClient.categorize([
 *   { id: '123', description: 'Amazon.com', amount: 99.99, type: 'expense' },
 * ]);
 * console.log(results.results[0].category); // "Shopping"
 */
async function categorize(
    transactions: CategoryTransactionInput[]
): Promise<CategoryResponse> {
    try {
        const request: CategoryRequest = { transactions };

        const response = await client.post<CategoryResponse>('/categorize', request);

        return response.data;
    } catch (error) {
        console.warn('AI Engine unavailable, using fallback categorization');

        // Fallback to simple rule-based categorization
        return {
            success: true,
            results: transactions.map(t => fallbackCategorize(t)),
            metadata: {
                totalProcessed: transactions.length,
                processingTimeMs: 0,
            },
        };
    }
}

/**
 * @function fallbackCategorize
 * @description Simple rule-based categorization when AI is unavailable.
 * 
 * Uses keyword matching on description and merchant name.
 * 
 * @param transaction - Transaction to categorize
 * @returns CategoryResult with fallback category
 */
function fallbackCategorize(transaction: CategoryTransactionInput): CategoryResult {
    const text = `${transaction.description} ${transaction.merchant || ''}`.toLowerCase();

    // Simple keyword-based rules
    const rules: Array<{ keywords: string[]; category: string }> = [
        { keywords: ['amazon', 'flipkart', 'shopping', 'mall'], category: 'Shopping' },
        { keywords: ['uber', 'ola', 'petrol', 'fuel', 'parking'], category: 'Transportation' },
        { keywords: ['swiggy', 'zomato', 'restaurant', 'food', 'cafe', 'pizza'], category: 'Food & Dining' },
        { keywords: ['netflix', 'spotify', 'movie', 'entertainment'], category: 'Entertainment' },
        { keywords: ['electricity', 'water', 'gas', 'internet', 'phone', 'mobile'], category: 'Bills & Utilities' },
        { keywords: ['hospital', 'doctor', 'pharmacy', 'medical', 'health'], category: 'Healthcare' },
        { keywords: ['grocery', 'supermarket', 'vegetables', 'fruits'], category: 'Groceries' },
        { keywords: ['rent', 'housing', 'maintenance'], category: 'Rent & Housing' },
        { keywords: ['insurance'], category: 'Insurance' },
        { keywords: ['salary', 'payroll'], category: 'Salary' },
        { keywords: ['interest', 'dividend', 'investment'], category: 'Investment' },
    ];

    for (const rule of rules) {
        if (rule.keywords.some(keyword => text.includes(keyword))) {
            return {
                transactionId: transaction.id,
                category: rule.category,
                confidence: 0.7, // Lower confidence for fallback
            };
        }
    }

    // Default based on type
    const defaultCategory = transaction.type === 'income'
        ? 'Other Income'
        : 'Other Expense';

    return {
        transactionId: transaction.id,
        category: defaultCategory,
        confidence: 0.3,
    };
}

// =============================================================================
// TAX SUGGESTION FUNCTIONS
// =============================================================================

/**
 * @function getTaxSuggestions
 * @description Requests tax optimization suggestions from AI Engine.
 * 
 * @param request - Tax profile data
 * @returns Tax optimization suggestions
 */
async function getTaxSuggestions(
    request: TaxSuggestionRequest
): Promise<TaxSuggestionResponse> {
    try {
        const response = await client.post<TaxSuggestionResponse>('/tax', request);
        return response.data;
    } catch (error) {
        console.warn('AI Engine unavailable, using fallback tax suggestions');

        // Fallback suggestions
        return fallbackTaxSuggestions(request);
    }
}

/**
 * @function fallbackTaxSuggestions
 * @description Generates basic tax suggestions when AI is unavailable.
 * 
 * @param request - Tax profile data
 * @returns Basic tax optimization suggestions
 */
function fallbackTaxSuggestions(request: TaxSuggestionRequest): TaxSuggestionResponse {
    const suggestions = [];

    // Check 80C utilization
    const used80C = request.currentDeductions.section80C || 0;
    if (used80C < 150000) {
        suggestions.push({
            id: 'sug-80c',
            section: '80C',
            title: 'Maximize 80C Deductions',
            description: `You can invest ₹${(150000 - used80C).toLocaleString()} more in 80C eligible instruments like PPF, ELSS, or life insurance.`,
            potentialSavings: Math.round((150000 - used80C) * 0.3),
            remainingLimit: 150000 - used80C,
            priority: 'high' as const,
        });
    }

    // Check 80D utilization
    const used80D = request.currentDeductions.section80D || 0;
    if (used80D < 25000) {
        suggestions.push({
            id: 'sug-80d',
            section: '80D',
            title: 'Health Insurance Deduction',
            description: 'Consider health insurance premiums for additional tax benefits under Section 80D.',
            potentialSavings: Math.round((25000 - used80D) * 0.3),
            remainingLimit: 25000 - used80D,
            priority: 'medium' as const,
        });
    }

    // Check NPS utilization
    const usedNPS = request.currentDeductions.nps || 0;
    if (usedNPS < 50000) {
        suggestions.push({
            id: 'sug-nps',
            section: '80CCD(1B)',
            title: 'NPS Additional Deduction',
            description: 'Invest in NPS for additional ₹50,000 deduction under Section 80CCD(1B).',
            potentialSavings: Math.round((50000 - usedNPS) * 0.3),
            remainingLimit: 50000 - usedNPS,
            priority: 'medium' as const,
        });
    }

    // Calculate potential savings
    const totalPotential = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);

    return {
        success: true,
        suggestions,
        recommendedRegime: request.grossIncome > 750000 ? 'new' : 'old',
        potentialSavings: {
            total: totalPotential,
            byRegimeSwitch: 0,
            byDeductions: totalPotential,
        },
    };
}

// =============================================================================
// SPENDING ANALYSIS FUNCTIONS
// =============================================================================

/**
 * @function analyzeSpending
 * @description Requests spending pattern analysis from AI Engine.
 * 
 * @param request - Spending data
 * @returns Spending analysis with patterns and anomalies
 */
async function analyzeSpending(
    request: SpendingAnalysisRequest
): Promise<SpendingAnalysisResponse> {
    try {
        const response = await client.post<SpendingAnalysisResponse>('/analyze-spending', request);
        return response.data;
    } catch (error) {
        console.warn('AI Engine unavailable for spending analysis');

        // Return empty analysis
        return {
            success: true,
            patterns: [],
            anomalies: [],
            insights: ['Detailed spending analysis is temporarily unavailable.'],
        };
    }
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * @function checkHealth
 * @description Checks if AI Engine service is available.
 * 
 * @returns True if service is healthy
 */
async function checkHealth(): Promise<boolean> {
    try {
        const response = await client.get('/health', { timeout: 5000 });
        return response.status === 200;
    } catch {
        return false;
    }
}

// =============================================================================
// CLIENT EXPORT
// =============================================================================

/**
 * @constant aiClient
 * @description AI Engine client with all available methods.
 * 
 * @example
 * import { aiClient } from './integrations/ai-engine/ai.client';
 * 
 * // Categorize transactions
 * const results = await aiClient.categorize(transactions);
 * 
 * // Get tax suggestions
 * const suggestions = await aiClient.getTaxSuggestions(taxProfile);
 * 
 * // Check service health
 * const isHealthy = await aiClient.checkHealth();
 */
export const aiClient = {
    categorize,
    getTaxSuggestions,
    analyzeSpending,
    checkHealth,
};

export default aiClient;
