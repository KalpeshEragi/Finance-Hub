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
export async function importTransactions(transactions: TransactionInput[]): Promise<{ success: boolean; data: { created: number } }> {
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
 * Parsed transaction from bank statement
 */
export interface ParsedTransaction {
    date: string | null;
    description: string | null;
    amount: number | null;
    type: 'income' | 'expense' | null;
    reference?: string | null;
    balance?: number | null;
}

/**
 * Parse a bank statement file (CSV or PDF)
 */
export async function parseStatement(file: File): Promise<{
    success: boolean;
    transactions: ParsedTransaction[];
    total_parsed: number;
}> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getCookie('auth_token');
    const response = await fetch(`${API_BASE_URL}/transactions/parse-statement`, {
        method: 'POST',
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to parse statement');
    return data;
}

/**
 * Import parsed statement transactions with AI categorization
 */
export async function importStatementTransactions(transactions: {
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    reference?: string;
    balance?: number;
}[]): Promise<{ success: boolean; data: { created: number; categorized: number } }> {
    const response = await fetch(`${API_BASE_URL}/transactions/import-statement`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ transactions }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to import statement transactions');
    return data;
}

/**
 * Parse transaction from SMS/email text using AI
 */
export async function parseTransaction(text: string): Promise<{
    success: boolean;
    message?: string;
    data?: {
        amount: number;
        type: 'income' | 'expense';
        category: string;
        merchant: string;
        date: string;
        paymentApp?: string;
        bank?: string;
        cardType?: string;
    };
}> {
    const response = await fetch(`${API_BASE_URL}/transactions/parse`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text }),
    });

    const data = await response.json();
    return data;
}