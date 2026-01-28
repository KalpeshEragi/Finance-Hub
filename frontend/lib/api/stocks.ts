/**
 * @file stocks.ts
 * @description Frontend API client for live stock market data.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// =============================================================================
// TYPES
// =============================================================================

export interface LiveStockData {
    symbol: string;
    name: string;
    price: number;
    change: number; // Percentage change
    data: { value: number }[]; // For chart
}

export interface LiveStocksResponse {
    success: boolean;
    data: {
        stocks: LiveStockData[];
        lastUpdated: string;
        source: string;
    };
}

export interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
    timestamp: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Gets auth headers from cookie
 */
function getAuthHeaders(): HeadersInit {
    // Robust cookie parsing for 'auth_token'
    const token = typeof document !== 'undefined'
        ? (document.cookie.match(/(?:^|; )auth_token=([^;]*)/) || [])[1]
        : '';

    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
}

/**
 * Fetches live stock data for the Live Performance card.
 * @param symbols Optional array of stock symbols. Defaults to trending stocks.
 */
export async function getLiveStockData(symbols?: string[]): Promise<LiveStocksResponse> {
    const queryParams = symbols?.length
        ? `?symbols=${symbols.join(',')}`
        : '';

    const response = await fetch(`${API_BASE_URL}/stocks/live${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch live stock data');
    }

    return data;
}

/**
 * Fetches quote for a specific stock symbol.
 */
export async function getStockQuote(symbol: string): Promise<StockQuote> {
    const response = await fetch(`${API_BASE_URL}/stocks/quote/${symbol}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `Failed to fetch quote for ${symbol}`);
    }

    return data.data;
}

/**
 * Fetches list of trending stock symbols.
 */
export async function getTrendingSymbols(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/stocks/trending`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch trending symbols');
    }

    return data.data.symbols;
}
