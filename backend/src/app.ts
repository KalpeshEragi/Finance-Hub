/**
 * @file app.ts
 * @description Express application configuration and middleware setup.
 * 
 * This is the main application factory that creates and configures the
 * Express application. It sets up:
 * - Core middleware (CORS, JSON parsing, URL encoding)
 * - API routes organized by feature
 * - Global error handling
 * 
 * @architecture
 * This file follows the factory pattern - it creates and exports a configured
 * Express application that can be used by main.ts to start the server.
 * 
 * Route Organization:
 * - /auth         - Authentication (register, login, logout, me)
 * - /transactions - Transaction CRUD + bulk import
 * - /budget       - Budget management
 * - /credit       - Credit score (simulated)
 * - /tax          - Tax estimation and deductions
 * - /goals        - Financial goals
 * - /dashboard    - Aggregated insights
 * - /alerts       - User notifications
 * - /categorization - AI-powered categorization
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Import route modules
import authRoutes from './routes/auth.routes';
import transactionsRoutes from './routes/transactions.routes';
import budgetRoutes from './routes/budget.routes';
import creditRoutes from './routes/credit.routes';
import taxRoutes from './routes/tax.routes';
import goalsRoutes from './routes/goals.routes';
import dashboardRoutes from './routes/dashboard.routes';
import alertsRoutes from './routes/alerts.routes';
import categorizationRoutes from './routes/categorization.routes';
import { getRegisteredRoutes } from './utils/routeRegistry'

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// =============================================================================
// EXPRESS APPLICATION FACTORY
// =============================================================================

/**
 * @function createApp
 * @description Creates and configures the Express application.
 * 
 * This factory function allows for easy testing by creating isolated
 * app instances. Configuration is applied in a specific order:
 * 1. Core middleware (runs on every request)
 * 2. API routes (feature-specific handlers)
 * 3. Error handlers (catches all errors)
 * 
 * @returns Configured Express application instance
 */
function createApp(): Express {
    const app = express();

    // ===========================================================================
    // CORE MIDDLEWARE
    // ===========================================================================

    /**
     * @middleware CORS
     * @description Enable Cross-Origin Resource Sharing.
     * In production, you should restrict this to specific origins.
     */
    app.use(cors({
        origin: process.env['NODE_ENV'] === 'production'
            ? process.env['FRONTEND_URL']
            : '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    /**
     * @middleware JSON Parser
     * @description Parse incoming JSON request bodies.
     * Limit set to 10mb to handle bulk transaction imports.
     */
    app.use(express.json({ limit: '10mb' }));

    /**
     * @middleware URL Encoded Parser
     * @description Parse URL-encoded request bodies (form data).
     */
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    /**
     * @middleware Request Logger
     * @description Log incoming requests for debugging.
     * In production, consider using a proper logging library like Winston.
     */
    app.use((req: Request, _res: Response, next: NextFunction) => {
        if (process.env['NODE_ENV'] !== 'production') {
            console.log(`📨 ${req.method} ${req.path}`);
        }
        next();
    });

    // ===========================================================================
    // HEALTH CHECK ENDPOINT
    // ===========================================================================

    /**
     * @route GET /health
     * @description Health check endpoint for load balancers and monitoring.
     * Returns 200 OK if the server is running.
     */
    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });

    /**
     * @route GET /
     * @description Root endpoint - API information.
     */
    app.get('/', (_req: Request, res: Response) => {
        res.status(200).json({
            name: 'HackVengers Finance API',
            version: '1.0.0',
            description: 'Personal finance management backend',
            endpoints: {
                health: '/health',
                auth: '/auth',
                transactions: '/transactions',
                budget: '/budget',
                credit: '/credit',
                tax: '/tax',
                goals: '/goals',
                dashboard: '/dashboard',
                alerts: '/alerts',
                categorization: '/categorization',
            },
        });
    });

    // ===========================================================================
    // API ROUTES
    // ===========================================================================

    /**
     * @description Register all feature routes under their respective prefixes.
     * Each route module handles its own sub-routes and middleware.
     */

    // Authentication routes (public + protected)
    app.use('/auth', authRoutes);

    // Transaction management (protected)
    app.use('/transactions', transactionsRoutes);

    // Budget management (protected)
    app.use('/budget', budgetRoutes);

    // Credit score - simulated (protected)
    app.use('/credit', creditRoutes);

    // Tax estimation (protected)
    app.use('/tax', taxRoutes);

    // Financial goals (protected)
    app.use('/goals', goalsRoutes);

    // Dashboard insights (protected)
    app.use('/dashboard', dashboardRoutes);

    // User alerts (protected)
    app.use('/alerts', alertsRoutes);

    // AI categorization (protected)
    app.use('/categorization', categorizationRoutes);

    // ===========================================================================
    // DEVELOPMENT UTILITIES
    // ===========================================================================

    /**
     * @route GET /__routes
     * @description Development-only endpoint to list all registered routes.
     * Useful for generating Postman / Thunder Client collections.
     */
    if (process.env.NODE_ENV === 'development') {
        app.get('/__routes', (_req, res) => {
            const routes = getRegisteredRoutes()
            res.json({
            count: routes.length,
            routes,
            })
        })
    }

    // ===========================================================================
    // ERROR HANDLING
    // ===========================================================================

    /**
     * @middleware 404 Handler
     * @description Catches requests to undefined routes.
     * Must be registered AFTER all valid routes.
     */
    app.use(notFoundHandler);

    /**
     * @middleware Global Error Handler
     * @description Catches all errors thrown in route handlers.
     * Must be registered LAST in the middleware chain.
     */
    app.use(errorHandler);

    return app;
}

// =============================================================================
// EXPORT
// =============================================================================

/**
 * @description Export the configured Express application.
 * This is the default export used by main.ts to start the server.
 */
const app = createApp();

export default app;
export { createApp };
