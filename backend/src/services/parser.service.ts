/**
 * @file parser.service.ts
 * @description Service to parse unstructured text (SMS/Email) into structured transaction data.
 * Enhanced with payment app detection and comprehensive category mapping.
 */

import { CreateTransactionInput } from '../types/transaction.types';

// =============================================================================
// PAYMENT APP DETECTION
// =============================================================================

/**
 * Payment app/bank patterns to detect the source of transaction
 */
const PAYMENT_APPS: Record<string, string[]> = {
    'PhonePe': ['phonepe', 'phone pe'],
    'Google Pay': ['googlepay', 'google pay', 'gpay', 'tez'],
    'Paytm': ['paytm'],
    'Amazon Pay': ['amazonpay', 'amazon pay'],
    'BHIM': ['bhim upi', 'bhim'],
    'WhatsApp Pay': ['whatsapp pay', 'wa pay'],
    'CRED': ['cred'],
    'Freecharge': ['freecharge'],
    'Mobikwik': ['mobikwik'],
};

const BANKS: Record<string, string[]> = {
    'HDFC Bank': ['hdfc', 'hdfcbank'],
    'ICICI Bank': ['icici', 'icicibank'],
    'SBI': ['sbi', 'state bank'],
    'Axis Bank': ['axis', 'axisbank'],
    'Kotak': ['kotak'],
    'Yes Bank': ['yesbank', 'yes bank'],
    'IndusInd': ['indusind'],
    'PNB': ['pnb', 'punjab national'],
    'Bank of Baroda': ['bankofbaroda', 'bob'],
    'Canara Bank': ['canara'],
    'IDFC First': ['idfc'],
    'Federal Bank': ['federal bank'],
    'RBL Bank': ['rbl'],
};

const CARD_TYPES: Record<string, string[]> = {
    'Credit Card': ['credit card', 'cc', 'creditcard'],
    'Debit Card': ['debit card', 'dc', 'debitcard', 'atm card'],
    'Rupay': ['rupay'],
    'Visa': ['visa'],
    'Mastercard': ['mastercard', 'master card'],
};

// =============================================================================
// CATEGORY RULES (Expanded with Indian merchants and services)
// =============================================================================

const CATEGORY_RULES: Record<string, string[]> = {
    'Food & Dining': [
        'swiggy', 'zomato', 'dominos', 'mcdonalds', 'kfc', 'starbucks', 'cafe', 'restaurant',
        'burger', 'pizza', 'biryani', 'tea', 'coffee', 'bakery', 'ccd', 'subway', 'taco bell',
        'burger king', 'wendy', 'dunkin', 'haldiram', 'barbeque nation', 'chaayos', 'faasos',
        'behrouz', 'freshly', 'box8', 'licious', 'eat', 'food', 'kitchen', 'dhaba', 'canteen',
        'mess', 'thali', 'dosa', 'idli', 'paratha', 'curry', 'noodle', 'chinese', 'continental'
    ],
    'Groceries': [
        'bigbasket', 'blinkit', 'zepto', 'dmart', 'reliance', 'grofers', 'instamart', 'lulu',
        'supermarket', 'mart', 'stores', 'vegetable', 'fruit', 'jiomart', 'more megastore',
        'spencer', 'nature basket', 'fresho', 'amazon fresh', 'kirana', 'ratnadeep', 'star bazaar'
    ],
    'Transportation': [
        'uber', 'ola', 'rapido', 'petrol', 'fuel', 'shell', 'hpcl', 'bpcl', 'iocl', 'metro',
        'toll', 'rail', 'irctc', 'bus', 'auto', 'rickshaw', 'cab', 'taxi', 'bike taxi',
        'namma yatri', 'meru', 'fastag', 'parking'
    ],
    'Shopping': [
        'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'zara', 'h&m', 'uniqlo', 'tanishq',
        'cloth', 'apparel', 'fashion', 'meesho', 'snapdeal', 'tatacliq', 'shoppers stop',
        'lifestyle', 'pantaloons', 'westside', 'max fashion', 'trends', 'central', 'fbb',
        'reliance digital', 'croma', 'vijay sales', 'lenskart', 'pepperfry', 'urban ladder',
        'ikea', 'decathlon', 'sports', 'shoe', 'footwear', 'bata', 'nike', 'adidas', 'puma'
    ],
    'Entertainment': [
        'netflix', 'bookmyshow', 'pvr', 'inox', 'spotify', 'hotstar', 'youtube', 'steam',
        'playstation', 'game', 'movie', 'disney', 'prime video', 'zee5', 'sonyliv', 'voot',
        'aha', 'mubi', 'jio cinema', 'gaana', 'wynk', 'apple music', 'gaming', 'xbox',
        'paytm insider', 'event', 'concert', 'theatre', 'cinema', 'multiplex'
    ],
    'Health & Medicine': [
        'apollo', 'pharmacy', 'medplus', '1mg', 'practo', 'dr', 'hospital', 'clinic', 'medical',
        'lab', 'netmeds', 'pharmeasy', 'tata 1mg', 'thyrocare', 'diagnostic', 'health', 'fitness',
        'gym', 'cult', 'cure.fit', 'healthkart', 'doctor', 'dentist', 'eye', 'optical', 'lens',
        'medicine', 'tablet', 'capsule', 'injection', 'vaccine', 'test', 'scan', 'xray', 'mri'
    ],
    'Bills & Utilities': [
        'bescom', 'electricity', 'water', 'gas', 'bill', 'recharge', 'airtel', 'jio', 'vi',
        'vodafone', 'bsnl', 'tata play', 'dth', 'broadband', 'wifi', 'internet', 'postpaid',
        'prepaid', 'mobile', 'landline', 'piped gas', 'lpg', 'cylinder', 'mahanagar gas',
        'adani gas', 'torrent power', 'tata power'
    ],
    'Travel': [
        'makemytrip', 'goibibo', 'indigo', 'air india', 'hotel', 'airbnb', 'booking', 'flight',
        'vistara', 'spicejet', 'akasa', 'oyo', 'trivago', 'cleartrip', 'yatra', 'ixigo',
        'easemytrip', 'redbus', 'abhibus', 'train', 'railway', 'luggage', 'airport', 'cab'
    ],
    'Investments': [
        'zerodha', 'groww', 'upstox', 'sip', 'mutual fund', 'ppf', 'nps', 'stock', 'angel one',
        'kotak securities', 'hdfc securities', 'icici direct', 'paytm money', 'et money',
        'kuvera', 'coin', 'smallcase', 'fd', 'rd', 'bond', 'demat'
    ],
    'Education': [
        'udemy', 'coursera', 'unacademy', 'byju', 'vedantu', 'upgrad', 'simplilearn', 'school',
        'college', 'tuition', 'coaching', 'book', 'stationery', 'exam', 'fee', 'library'
    ],
    'Insurance': [
        'insurance', 'lic', 'icici lombard', 'hdfc ergo', 'bajaj allianz', 'policybazaar',
        'acko', 'digit', 'tata aia', 'max life', 'policy', 'premium', 'claim'
    ],
    'Personal Care': [
        'salon', 'spa', 'haircut', 'parlour', 'beauty', 'grooming', 'urban company',
        'housejoy', 'looks', 'lakme', 'naturals', 'jawed habib', 'bodycraft'
    ],
    'Rent & Housing': [
        'rent', 'housing', 'maintenance', 'society', 'apartment', 'flat', 'landlord',
        'pgyno', 'nestaway', 'nobroker'
    ],
    'Subscriptions': [
        'subscription', 'membership', 'annual', 'monthly', 'premium', 'pro', 'plus'
    ],
    'Transfer': [
        'transfer', 'imps', 'neft', 'rtgs', 'sent to', 'paid to', 'received from'
    ]
};

// =============================================================================
// INTERFACES
// =============================================================================

interface ParsedResult {
    amount: number;
    merchant: string;
    date: Date;
    type: 'debit' | 'credit';
    description: string;
    paymentApp?: string;
    bank?: string;
    cardType?: string;
}

// =============================================================================
// PARSER SERVICE
// =============================================================================

export class ParserService {

    /**
     * Main entry point to parse text
     */
    static parse(text: string): Partial<CreateTransactionInput> & { paymentApp?: string; bank?: string; cardType?: string } | null {
        try {
            // Normalize text: remove excessive whitespace, keep mostly raw
            const cleanText = text.replace(/\n/g, ' ').trim();
            const normalizedText = cleanText.toLowerCase();

            // Detect payment source first
            const paymentApp = this.detectPaymentApp(normalizedText);
            const bank = this.detectBank(normalizedText);
            const cardType = this.detectCardType(normalizedText);

            // Try different regex strategies in order of specificity
            const result =
                this.parseSpecificBankFormats(cleanText, normalizedText) ||
                this.parseUPI(cleanText, normalizedText) ||
                this.parseNaturalLanguage(cleanText, normalizedText);

            if (!result) return null;

            // Auto-categorize based on merchant
            const category = this.categorizeMerchant(result.merchant);

            // Build description with payment source
            let description = result.description;
            if (paymentApp) description = `${paymentApp}: ${description}`;
            else if (bank && cardType) description = `${bank} ${cardType}: ${description}`;
            else if (bank) description = `${bank}: ${description}`;

            return {
                amount: result.amount,
                type: result.type === 'debit' ? 'expense' : 'income',
                category: category,
                merchant: result.merchant,
                date: result.date.toISOString().split('T')[0], // YYYY-MM-DD
                description: description || `Transaction at ${result.merchant}`,
                paymentApp,
                bank,
                cardType,
            };
        } catch (e) {
            console.error("Parser Error:", e);
            return null;
        }
    }

    // =========================================================================
    // DETECTION METHODS
    // =========================================================================

    private static detectPaymentApp(text: string): string | undefined {
        for (const [app, keywords] of Object.entries(PAYMENT_APPS)) {
            if (keywords.some(k => text.includes(k))) {
                return app;
            }
        }
        return undefined;
    }

    private static detectBank(text: string): string | undefined {
        for (const [bank, keywords] of Object.entries(BANKS)) {
            if (keywords.some(k => text.includes(k))) {
                return bank;
            }
        }
        return undefined;
    }

    private static detectCardType(text: string): string | undefined {
        for (const [card, keywords] of Object.entries(CARD_TYPES)) {
            if (keywords.some(k => text.includes(k))) {
                return card;
            }
        }
        return undefined;
    }

    // =========================================================================
    // PARSING STRATEGIES
    // =========================================================================

    /**
     * Strategy 1: Specific Bank SMS Formats (High Confidence)
     */
    private static parseSpecificBankFormats(original: string, text: string): ParsedResult | null {
        let match: RegExpMatchArray | null;

        // Pattern 1: "Rs.450 paid to Swiggy using PhonePe" (Currency FIRST)
        const currencyFirstPaidRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)\s*(?:paid|sent|debited)\s*(?:to|for)\s+(.*?)(?:\s+using|\s+via|\s+on|\.|\s*$)/i;
        match = text.match(currencyFirstPaidRegex);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: this.extractDate(original) || new Date(),
                type: 'debit',
                description: 'Payment'
            };
        }

        // Pattern 2: "Paid Rs 899 to Amazon" (Verb FIRST)
        const verbFirstPaidRegex = /(?:paid|sent)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{2})?)\s*(?:to|for)\s+(.*?)(?:\s+using|\s+via|\s+on|\.|\s*$)/i;
        match = text.match(verbFirstPaidRegex);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: this.extractDate(original) || new Date(),
                type: 'debit',
                description: 'Payment'
            };
        }

        // Pattern 3: Bank Debit - "Rs 2,500.00 debited from HDFC Bank ... to FLIPKART on ..."
        const bankDebitRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)\s*(?:is|has been)?\s*debited\s*(?:from)?.*?\s*(?:to|at|for)\s+(.*?)\s+(?:on|via|ref)/i;
        match = text.match(bankDebitRegex);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: this.extractDate(original) || new Date(),
                type: 'debit',
                description: 'Bank Deduction'
            };
        }

        // Pattern 4: Bank Credit - "Rs X credited to account from Y"
        const bankCreditRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)\s*(?:is|has been)?\s*credited\s*(?:to)?.*?\s*(?:from|by)\s+(.*?)\s+(?:on|via|ref)/i;
        match = text.match(bankCreditRegex);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: this.extractDate(original) || new Date(),
                type: 'credit',
                description: 'Bank Credit'
            };
        }

        // Pattern 5: Card Spend - "Rs 1,299.00 spent ... at MYNTRA"
        const spentRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)\s*spent\s*.*?\s*at\s+(.*?)(?:\s+on|\s+ref|\.|$)/i;
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

        // Pattern 6: Received Money - "Received Rs 5,000 from RAHUL"
        const receivedRegex = /received\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{2})?)\s*from\s+(.*?)(?:\s+via|\s+on|\.|$)/i;
        match = text.match(receivedRegex);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: this.extractDate(original) || new Date(),
                type: 'credit',
                description: 'Money Received'
            };
        }

        // Pattern 7: Bank account format - "Rs X debited from a/c for Y on date"
        const simpleBankRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)\s*debited\s*(?:from)?.*?(?:for|to|at)\s+(.*?)(?:\s+on|\s+ref|\.|\s*$)/i;
        match = text.match(simpleBankRegex);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: this.extractDate(original) || new Date(),
                type: 'debit',
                description: 'Bank Debit'
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
                description: 'UPI Payment'
            };
        }

        match = text.match(receivedRegex);
        if (match && match[1] && match[2]) {
            return {
                amount: this.parseAmount(match[1]),
                merchant: this.cleanMerchantName(match[2]),
                date: this.extractDate(original) || new Date(),
                type: 'credit',
                description: 'UPI Received'
            };
        }

        return null;
    }

    /**
     * Strategy 3: Natural Language / Loose Fallback (Low Confidence but inclusive)
     */
    private static parseNaturalLanguage(original: string, text: string): ParsedResult | null {
        // Look for "Amount at Merchant" or "Merchant Amount"
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
        const regex2 = /(.*?)\s+(?:order|bill|payment|ride|txn)?\s*(?:rs\.?|inr|₹)\s*([\d,]+)/i;
        match = text.match(regex2);
        if (match && match[1] && match[2]) {
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

    // =========================================================================
    // HELPERS
    // =========================================================================

    private static parseAmount(amountStr: string): number {
        return parseFloat(amountStr.replace(/,/g, ''));
    }

    private static cleanMerchantName(raw: string): string {
        let name = raw
            .replace(/(?:via|on|ref|txn|upi|transfer|imps|neft|using|through).*/i, '') // Cut off technical details
            .replace(/[\*#@]/g, '')
            .replace(/[0-9]{4,}/g, '') // Remove long numbers (account/ref ids)
            .replace(/upi/gi, '')
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
