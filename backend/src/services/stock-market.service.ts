/**
 * @file stock-market.service.ts
 * @description Service for fetching live stock market data from Alpha Vantage API.
 * 
 * Alpha Vantage Free Tier Limits:
 * - 25 API calls per day
 * - 5 API calls per minute
 * 
 * To handle this, we implement:
 * - In-memory caching (5-minute TTL)
 * - Batch requests where possible
 */

import axios from 'axios';

// =============================================================================
// CONFIGURATION
// =============================================================================

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Cache TTL: 5 minutes (to respect rate limits)
const CACHE_TTL_MS = 5 * 60 * 1000;

// =============================================================================
// TYPES
// =============================================================================

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

export interface StockTimeSeries {
    symbol: string;
    data: { time: string; value: number }[];
}

export interface LiveStockData {
    symbol: string;
    name: string;
    price: number;
    change: number; // Percentage change
    data: { value: number }[]; // For chart
}

// =============================================================================
// IN-MEMORY CACHE
// =============================================================================

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

const cache: Map<string, CacheEntry<any>> = new Map();

function getFromCache<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        cache.delete(key);
        return null;
    }
    return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number = CACHE_TTL_MS): void {
    cache.set(key, {
        data,
        expiry: Date.now() + ttlMs,
    });
}

// =============================================================================
// STOCK NAME MAPPING (NSE symbols)
// =============================================================================

const STOCK_NAMES: Record<string, string> = {
    'RELIANCE.BSE': 'Reliance Industries',
    'TCS.BSE': 'Tata Consultancy Services',
    'INFY.BSE': 'Infosys',
    'HDFCBANK.BSE': 'HDFC Bank',
    'ICICIBANK.BSE': 'ICICI Bank',
    'TATAMOTORS.BSE': 'Tata Motors',
    'WIPRO.BSE': 'Wipro',
    'SBIN.BSE': 'State Bank of India',
    'BHARTIARTL.BSE': 'Bharti Airtel',
    'ITC.BSE': 'ITC Limited',
    // Add more as needed
};

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetches current quote for a single stock.
 * Uses GLOBAL_QUOTE endpoint.
 */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
    const cacheKey = `quote:${symbol}`;
    const cached = getFromCache<StockQuote>(cacheKey);
    if (cached) {
        console.log(`[StockMarket] Cache hit for ${symbol}`);
        return cached;
    }

    try {
        // Alpha Vantage uses .BSE suffix for Indian stocks
        const avSymbol = symbol.includes('.') ? symbol : `${symbol}.BSE`;

        const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: avSymbol,
                apikey: ALPHA_VANTAGE_API_KEY,
            },
            timeout: 10000,
        });

        const quote = response.data['Global Quote'];

        if (!quote || Object.keys(quote).length === 0) {
            console.warn(`[StockMarket] No data for ${symbol}`);
            return null;
        }

        const result: StockQuote = {
            symbol: symbol.replace('.BSE', ''),
            name: STOCK_NAMES[avSymbol] || symbol,
            price: parseFloat(quote['05. price']) || 0,
            change: parseFloat(quote['09. change']) || 0,
            changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
            high: parseFloat(quote['03. high']) || 0,
            low: parseFloat(quote['04. low']) || 0,
            volume: parseInt(quote['06. volume']) || 0,
            timestamp: quote['07. latest trading day'] || new Date().toISOString(),
        };

        setCache(cacheKey, result);
        console.log(`[StockMarket] Fetched live data for ${symbol}: ₹${result.price}`);
        return result;
    } catch (error: any) {
        console.error(`[StockMarket] Error fetching ${symbol}:`, error.message);
        return null;
    }
}

/**
 * Fetches intraday time series for chart data.
 * Uses TIME_SERIES_INTRADAY endpoint.
 */
export async function getStockTimeSeries(
    symbol: string,
    interval: '1min' | '5min' | '15min' | '30min' | '60min' = '15min'
): Promise<StockTimeSeries | null> {
    const cacheKey = `timeseries:${symbol}:${interval}`;
    const cached = getFromCache<StockTimeSeries>(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const avSymbol = symbol.includes('.') ? symbol : `${symbol}.BSE`;

        const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
            params: {
                function: 'TIME_SERIES_INTRADAY',
                symbol: avSymbol,
                interval,
                apikey: ALPHA_VANTAGE_API_KEY,
                outputsize: 'compact', // Last 100 data points
            },
            timeout: 15000,
        });

        const timeSeriesKey = `Time Series (${interval})`;
        const timeSeries = response.data[timeSeriesKey];

        if (!timeSeries) {
            console.warn(`[StockMarket] No time series data for ${symbol}`);
            return null;
        }

        // Convert to array format for charts
        const data = Object.entries(timeSeries)
            .slice(0, 12) // Get last 12 data points for chart
            .reverse()
            .map(([time, values]: [string, any]) => ({
                time,
                value: parseFloat(values['4. close']),
            }));

        const result: StockTimeSeries = {
            symbol: symbol.replace('.BSE', ''),
            data,
        };

        setCache(cacheKey, result);
        return result;
    } catch (error: any) {
        console.error(`[StockMarket] Error fetching time series for ${symbol}:`, error.message);
        return null;
    }
}

/**
 * Fetches live data for multiple stocks (for the Live Performance card).
 * Combines quote and time series data.
 */
export async function getLiveStockData(symbols: string[]): Promise<LiveStockData[]> {
    const results: LiveStockData[] = [];

    for (const symbol of symbols) {
        // Check cache first
        const cacheKey = `livedata:${symbol}`;
        const cached = getFromCache<LiveStockData>(cacheKey);
        if (cached) {
            results.push(cached);
            continue;
        }

        // Fetch quote
        const quote = await getStockQuote(symbol);
        if (!quote) continue;

        // Fetch time series for chart
        const timeSeries = await getStockTimeSeries(symbol);

        const liveData: LiveStockData = {
            symbol: quote.symbol,
            name: quote.name,
            price: quote.price,
            change: quote.changePercent,
            data: timeSeries?.data.map(d => ({ value: d.value })) ||
                generateFallbackChartData(quote.price, quote.changePercent),
        };

        setCache(cacheKey, liveData);
        results.push(liveData);

        // Rate limit: Wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
}

/**
 * Generates fallback chart data if time series is unavailable.
 * Creates a simple trend line based on current price and change.
 */
function generateFallbackChartData(price: number, changePercent: number): { value: number }[] {
    const data: { value: number }[] = [];
    const isPositive = changePercent >= 0;
    const startPrice = price / (1 + changePercent / 100);

    for (let i = 0; i < 12; i++) {
        const progress = i / 11;
        const noise = (Math.random() - 0.5) * price * 0.02; // 2% noise
        const value = startPrice + (price - startPrice) * progress + noise;
        data.push({ value: Math.round(value * 100) / 100 });
    }

    // Ensure last point is actual price
    data[11] = { value: price };

    return data;
}

/**
 * Default trending stocks list (NSE/BSE)
 */
export const DEFAULT_TRENDING_SYMBOLS = [
    'RELIANCE',
    'TCS',
    'INFY',
    'HDFCBANK',
    'ICICIBANK',
    'TATAMOTORS',
    'WIPRO',
    'SBIN',
];

// =============================================================================
// EXPORTS
// =============================================================================

export const stockMarketService = {
    getStockQuote,
    getStockTimeSeries,
    getLiveStockData,
    DEFAULT_TRENDING_SYMBOLS,
};

export default stockMarketService;
