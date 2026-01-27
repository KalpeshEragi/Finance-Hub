/**
 * @file transactions.ts
 * @description API functions for transaction management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    description: string;
    date: string;
    merchant: string;
    isAutoCategorized: boolean;
    createdAt: string;
}

export interface TransactionInput {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    description?: string;
    date?: string;
    merchant?: string;
}

export interface ParsedTransaction {
    date: string | null;
    description: string;
    amount: number | null;
    type: 'income' | 'expense' | 'transfer' | null;
    merchant?: string;
    category?: string;
    reference?: string;
    balance?: number;
}

export interface TransactionFilters {
    type?: 'income' | 'expense';
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export interface TransactionListResponse {
    success: boolean;
    data: Transaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
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

/**
 * Get list of transactions with filters
 */
export async function getTransactions(filters: TransactionFilters = {}): Promise<TransactionListResponse> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${API_BASE_URL}/transactions?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch transactions');
    return data;
}

/**
 * Create a new transaction
 */
export async function createTransaction(transaction: TransactionInput): Promise<{ success: boolean; data: Transaction }> {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(transaction),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create transaction');
    return data;
}

/**
 * Update a transaction
 */
export async function updateTransaction(id: string, updates: Partial<TransactionInput>): Promise<{ success: boolean; data: Transaction }> {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update transaction');
    return data;
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete transaction');
    return data;
}

/**
 * Bulk import transactions
 */
export async function importTransactions(transactions: TransactionInput[]): Promise<{ success: boolean; data: { created: number; categorized: number } }> {
    const response = await fetch(`${API_BASE_URL}/transactions/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ transactions }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to import transactions');
    return data;
}

/**
 * Import transactions from CSV content
 */
export async function importTransactionsFromCSV(csvContent: string): Promise<{ success: boolean; data: { created: number } }> {
    const response = await fetch(`${API_BASE_URL}/transactions/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ csv: csvContent }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to import CSV');
    return data;
}

/**
 * Parse unstructured text string
 */
export async function parseTransaction(text: string): Promise<{ success: boolean; data: TransactionInput; message?: string }> {
    const response = await fetch(`${API_BASE_URL}/transactions/parse`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text }),
    });

    const data = await response.json();
    // Don't throw error here, let UI handle specific messages
    return data;
}

export interface RecommendationResult {
    sourceId: string;
    sourceName: string;
    score: number;
    matchReason: string;
    estimatedSavings: number;
    safetyWarning?: string;
    isRecommended: boolean;
}

/**
 * Get payment recommendations
 */
export async function getRecommendation(amount: number, merchant: string, category?: string): Promise<{ success: boolean; data: RecommendationResult[] }> {
    const response = await fetch(`${API_BASE_URL}/transactions/recommend`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, merchant, category }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get recommendations');
    return data;
}

/**
 * Client-side file parser for statements
 * Note: In a production app, this might rely on a backend endpoint for complex parsing.
 * Here we implement a basic CSV parser for immediate functionality.
 */
export async function parseStatement(file: File): Promise<{ success: boolean; transactions: ParsedTransaction[]; total_parsed: number }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) {
                    throw new Error("File is empty");
                }

                const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
                const transactions: ParsedTransaction[] = [];

                // Simple auto-detection: skip header if first line contains "date" or "amount"
                let startIndex = 0;
                if (lines.length > 0) {
                    const firstLineLower = lines[0].toLowerCase();
                    if (firstLineLower.includes('date') || firstLineLower.includes('amount')) {
                        startIndex = 1;
                    }
                }

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i];
                    // Basic CSV split, robust enough for demo
                    const parts = line.split(',').map(p => p.trim());

                    if (parts.length < 2) continue;

                    // Heuristic: Input CSV format expectation: Date, Description, Amount, Type
                    // Or default to: Date, Description, Amount
                    const date = parts[0] || null;
                    const description = parts[1] || "";
                    let amountstr = parts[2] || "0";
                    let typeRaw = parts[3] || "";

                    // Cleanup amount
                    amountstr = amountstr.replace(/[^0-9.-]/g, '');
                    let amount = parseFloat(amountstr);

                    let type: 'income' | 'expense' | null = 'expense';

                    // Infer type if not provided
                    if (typeRaw) {
                        const t = typeRaw.toLowerCase();
                        if (t.includes('cr') || t.includes('income') || t.includes('credit')) type = 'income';
                        else if (t.includes('dr') || t.includes('expense') || t.includes('debit')) type = 'expense';
                    } else {
                        // Negative amounts usually mean expense in some exports
                        if (amount < 0) {
                            type = 'expense';
                            amount = Math.abs(amount);
                        }
                    }

                    transactions.push({
                        date: date,
                        description: description.replace(/["']/g, ""),
                        amount: isNaN(amount) ? 0 : amount,
                        type: type,
                        merchant: description, // Auto-use description as merchant for now
                    });
                }

                resolve({
                    success: true,
                    transactions: transactions,
                    total_parsed: lines.length - startIndex
                });

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error("Failed to read file"));
        };

        reader.readAsText(file);
    });
}
