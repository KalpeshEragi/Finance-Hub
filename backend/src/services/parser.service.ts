/**
 * @file parser.service.ts
 * @description Service to parse unstructured text (SMS/Email) into structured transaction data.
 */

import { CreateTransactionInput } from '../types/transaction.types';

// Simplified category mapping based on ai-engine rules
const CATEGORY_RULES: Record<string, string[]> = {
    'Food & Dining': ['swiggy', 'zomato', 'dominos', 'mcdonalds', 'kfc', 'starbucks', 'cafe', 'restaurant', 'burger', 'pizza', 'briyani', 'tea', 'coffee', 'bakery'],
    'Groceries': ['bigbasket', 'blinkit', 'zepto', 'dmart', 'reliance', 'grofers', 'instamart', 'lulu', 'supermarket', 'mart', 'stores', 'vegetable', 'fruit'],
    'Transportation': ['uber', 'ola', 'rapido', 'petrol', 'fuel', 'shell', 'hpcl', 'bpcl', 'metro', 'toll', 'rail', 'irctc', 'bus', 'auto'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'zara', 'h&m', 'uniqlo', 'tanishq', 'cloth', 'apparel', 'fashion'],
    'Entertainment': ['netflix', 'bookmyshow', 'pvr', 'inox', 'spotify', 'hotstar', 'youtube', 'steam', 'playstation', 'game', 'movie'],
    'Healthcare': ['apollo', 'pharmacy', 'medplus', '1mg', 'practo', 'dr', 'hospital', 'clinic', 'medical', 'lab'],
    'Utilities': ['bescom', 'bescom', 'airtel', 'jio', 'vi', 'vodafone', 'bsnl', 'electricity', 'water', 'gas', 'bill', 'recharge'],
    'Travel': ['makemytrip', 'goibibo', 'indigo', 'air india', 'hotel', 'airbnb', 'booking', 'flight'],
    'Investments': ['zerodha', 'groww', 'upstox', 'sip', 'mutual fund', 'ppf', 'nps', 'stock'],
};

interface ParsedResult {
    amount: number;
    merchant: string;
    date: Date;
    type: 'debit' | 'credit';
    description: string;
}

export class ParserService {

    /**
     * Main entry point to parse text
     */
    static parse(text: string): Partial<CreateTransactionInput> | null {
        try {
            // Normalize text: remove excessive whitespace, keep mostly raw
            const cleanText = text.replace(/\n/g, ' ').trim();
            const normalizedText = cleanText.toLowerCase();

            // Try different regex strategies in order of specificity
            const result =
                this.parseSpecificBankFormats(cleanText, normalizedText) ||
                this.parseUPI(cleanText, normalizedText) ||
                this.parseNaturalLanguage(cleanText, normalizedText);

            if (!result) return null;

            // Auto-categorize
            const category = this.categorizeMerchant(result.merchant);

            return {
                amount: result.amount,
                type: result.type === 'debit' ? 'expense' : 'income',
                category: category,
                merchant: result.merchant,
                date: result.date.toISOString().split('T')[0], // YYYY-MM-DD
                description: result.description || `Transaction at ${result.merchant}`,
            };
        } catch (e) {
            console.error("Parser Error:", e);
            return null;
        }
    }

    /**
     * Strategy 1: Specific Bank SMS Formats (High Confidence)
     */
    private static parseSpecificBankFormats(original: string, text: string): ParsedResult | null {
        // HDFC/Axis/SBI/ICICI Generic "Debited" Pattern
        // "Rs 1234 debited from a/c ... to MERCHANT on DD-MM-YY..."
        const debitRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)\s*(?:is|has been)?\s*debited\s*(?:from)?.*?\s*(?:to|at)\s+(.*?)\s+(?:on|via|ref)/i;

        // "Credited" Pattern
        const creditRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)\s*(?:is|has been)?\s*credited\s*(?:to)?.*?\s*(?:from|by)\s+(.*?)\s+(?:on|via|ref)/i; // Fixed: Credited is usually FROM someone or BY a transfer

        let match = text.match(debitRegex);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: this.extractDate(original) || new Date(),
                type: 'debit',
                description: 'Bank Deduction'
            };
        }

        match = text.match(creditRegex);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: this.extractDate(original) || new Date(),
                type: 'credit',
                description: 'Bank Credit'
            };
        }

        // SBI "Spent" Pattern
        // "Rs 529.00 spent on card ... at AMAZON ..."
        const spentRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)\s*spent\s*(?:on card)?.*?\s*at\s+(.*?)\s+(?:on)/i;
        match = text.match(spentRegex);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: this.extractDate(original) || new Date(),
                type: 'debit',
                description: 'Card Spend'
            };
        }

        return null;
    }

    /**
     * Strategy 2: UPI Patterns (Medium Confidence)
     */
    private static parseUPI(original: string, text: string): ParsedResult | null {
        // "Paid Rs 150 to Swiggy"
        const sentRegex = /(?:paid|sent)\s+(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{2})?)\s+(?:to|for)\s+(.*?)(?:\s+on|\s+via|\.|$)/i;
        // "Received Rs 500 from Rahul"
        const receivedRegex = /(?:received)\s+(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{2})?)\s+(?:from)\s+(.*?)(?:\s+on|\s+via|\.|$)/i;

        let match = text.match(sentRegex);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: this.extractDate(original) || new Date(),
                type: 'debit',
                description: 'UPI/Payment'
            };
        }

        match = text.match(receivedRegex);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: this.extractDate(original) || new Date(),
                type: 'credit',
                description: 'Payment Received'
            };
        }

        return null;
    }

    /**
     * Strategy 3: Natural Language / Loose Fallback (Low Confidence but inclusive)
     */
    private static parseNaturalLanguage(original: string, text: string): ParsedResult | null {
        // Look for "Amount at Merchant" or "Merchant Amount"
        // Regex: (Currency Amount) ... (at/to/for) ... (Merchant)
        // e.g. "Rs 500 at Starbucks", "500 for Uber"

        // 1. "Currency Amount words Merchant"
        const regex1 = /(?:rs\.?|inr|₹)\s*([\d,]+)\s+(?:at|to|for)\s+(.*)/i;
        let match = text.match(regex1);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: new Date(),
                type: 'debit',
                description: 'Expense'
            };
        }

        // 2. "Merchant words Currency Amount"
        // e.g. "Swiggy order 250", "Uber ride rs 300"
        // This is risky, so we look for specific keywords or currency markers
        const regex2 = /(.*?)\s+(?:order|bill|payment|ride|txn)?\s*(?:rs\.?|inr|₹)\s*([\d,]+)/i;
        match = text.match(regex2);
        if (match && match[1] && match[2]) {
            // Avoid parsing "Balance is Rs 500" as merchant="Balance is"
            const merchantCandidates = match[1].trim();
            if (merchantCandidates.length < 30 && !merchantCandidates.includes('balance')) {
                return {
                    amount: this.parseAmount(match[2]),
                    merchant: this.cleanMerchantName(merchantCandidates),
                    date: new Date(),
                    type: 'debit',
                    description: 'Expense'
                };
            }
        }

        return null;
    }

    // --- Helpers ---

    private static parseAmount(amountStr: string): number {
        return parseFloat(amountStr.replace(/,/g, ''));
    }

    private static cleanMerchantName(raw: string): string {
        let name = raw
            .replace(/(?:via|on|ref|txn|upi|transfer|imps|neft).*/i, '') // Cut off technical details
            .replace(/[\*#]/g, '')
            .replace(/[0-9]{4,}/g, '') // Remove long numbers (account/ref ids)
            .trim();

        // Improve capitalization (Capitalize First Letter of each word)
        return name.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
    }

    private static categorizeMerchant(merchant: string): string {
        const lower = merchant.toLowerCase();
        for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
            if (keywords.some(k => lower.includes(k))) {
                return category;
            }
        }
        return 'General';
    }

    private static extractDate(text: string): Date | null {
        // DD-MM-YY or DD/MM/YY
        const dateRegex = /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/;
        const match = text.match(dateRegex);
        if (match && match[1] && match[2] && match[3]) {
            const d = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            let y = parseInt(match[3], 10);
            if (y < 100) y += 2000;
            return new Date(y, m - 1, d);
        }
        // DD Month YYYY (01 Jan 2025)
        const dateTextRegex = /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})?/i;
        const textMatch = text.match(dateTextRegex);
        if (textMatch) {
            if (!textMatch[1] || !textMatch[2]) return null;
            const d = parseInt(textMatch[1], 10);
            const mStr = textMatch[2].substring(0, 3).toLowerCase();
            const months: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
            let y = textMatch[3] ? parseInt(textMatch[3]) : new Date().getFullYear();
            if (y < 100) y += 2000;

            const monthIndex = months[mStr];
            if (monthIndex === undefined) return null;

            return new Date(y, monthIndex, d);
        }
        return null;
    }
}
