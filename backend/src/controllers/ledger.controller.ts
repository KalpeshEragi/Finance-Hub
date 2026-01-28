/**
 * @file ledger.controller.ts
 * @description Controller for Ledger Aggregation API.
 * 
 * Provides endpoints for the Investment Agent to access
 * aggregated financial data from all sources.
 */

import { Request, Response, NextFunction } from 'express';
import { getLedgerSnapshot } from '../services/ledger.service';
import { HTTP_STATUS } from '../config/constants';

/**
 * @route GET /ledger/snapshot
 * @description Get complete ledger snapshot for Investment Agent.
 * Returns aggregated data from:
 * - Dashboard (income, expense, savings, trends)
 * - Budget (limits, spent, adherence)
 * - Loans (outstanding, EMI, debt ratio)
 * - Goals (targets, progress)
 * - Risk indicators (investment readiness)
 */
export async function getSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const snapshot = await getLedgerSnapshot(userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: snapshot,
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * @route GET /ledger/risk-indicators
 * @description Get only risk indicators (lightweight endpoint).
 */
export async function getRiskIndicators(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const snapshot = await getLedgerSnapshot(userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                riskIndicators: snapshot.riskIndicators,
                timestamp: snapshot.timestamp,
            },
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * @route GET /ledger/summary
 * @description Get summary metrics (quick overview).
 */
export async function getSummary(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const snapshot = await getLedgerSnapshot(userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                totalIncome: snapshot.dashboard.totalIncome,
                totalExpense: snapshot.dashboard.totalExpense,
                netBalance: snapshot.dashboard.netBalance,
                savingsRate: snapshot.dashboard.savingsRate,
                totalBudget: snapshot.budget.totalBudget,
                budgetRemaining: snapshot.budget.remaining,
                totalOutstandingDebt: snapshot.loans.totalOutstanding,
                monthlyEMI: snapshot.loans.totalMonthlyEMI,
                activeGoals: snapshot.goals.activeGoals,
                goalProgress: snapshot.goals.overallProgress,
                investmentReady: snapshot.riskIndicators.investmentReadiness,
                riskLevel: snapshot.riskIndicators.riskLevel,
                timestamp: snapshot.timestamp,
            },
        });
    } catch (error) {
        return next(error);
    }
}
