/**
 * @file stock-market.routes.ts
 * @description API routes for live stock market data.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    getLiveStockData,
    getStockQuote,
    DEFAULT_TRENDING_SYMBOLS,
} from '../services/stock-market.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =============================================================================
// ROUTES
// =============================================================================

/**
 * @route GET /stocks/live
 * @description Get live data for trending stocks (for Live Performance card)
 * @query symbols - Optional comma-separated list of symbols (defaults to trending)
 */
router.get('/live', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const symbolsParam = req.query.symbols as string | undefined;
        const symbols = symbolsParam
            ? symbolsParam.split(',').map(s => s.trim().toUpperCase())
            : DEFAULT_TRENDING_SYMBOLS;

        const data = await getLiveStockData(symbols);

        res.json({
            success: true,
            data: {
                stocks: data,
                lastUpdated: new Date().toISOString(),
                source: 'Alpha Vantage',
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /stocks/quote/:symbol
 * @description Get current quote for a specific stock
 */
router.get('/quote/:symbol', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { symbol } = req.params;

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: 'Symbol is required',
            });
        }

        const quote = await getStockQuote(symbol.toUpperCase());

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: `No data found for symbol: ${symbol}`,
            });
        }

        res.json({
            success: true,
            data: quote,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /stocks/trending
 * @description Get list of default trending symbols
 */
router.get('/trending', (_req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            symbols: DEFAULT_TRENDING_SYMBOLS,
        },
    });
});

export default router;
