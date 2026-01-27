import { Request, Response, NextFunction } from 'express';
import Loan, { calculateEMI } from '../models/loan.model';
import Transaction from '../models/transaction.model';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants';
import { AppError } from '../middleware/error.middleware';
import { getSmartLoanAdvice } from '../services/loan-advisor.service';
import mongoose from 'mongoose';

/**
 * Get all loans for the current user
 */
export async function getLoans(req: Request, res: Response, next: NextFunction) {
    try {
        const loans = await Loan.find({ userId: req.user?.userId });

        // Calculate summary
        const activeLoans = loans.filter(l => l.status === 'active');
        const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstandingAmount, 0);
        const totalMonthlyEMI = activeLoans.reduce((sum, l) => sum + l.emiAmount, 0);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                loans,
                summary: {
                    totalLoans: loans.length,
                    activeLoans: activeLoans.length,
                    totalOutstanding,
                    totalMonthlyEMI,
                }
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get a single loan by ID
 */
export async function getLoanById(req: Request, res: Response, next: NextFunction) {
    try {
        const loan = await Loan.findOne({ _id: req.params['id'], userId: req.user?.userId });
        if (!loan) throw new AppError('Loan not found', HTTP_STATUS.NOT_FOUND);
        res.status(HTTP_STATUS.OK).json({ success: true, data: loan });
    } catch (error) {
        next(error);
    }
}

/**
 * Create a new loan
 */
export async function createLoan(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, loanType, principalAmount, interestRate, tenureMonths, startDate, lender, description } = req.body;

        // Calculate EMI if not provided
        const emiAmount = req.body.emiAmount || calculateEMI(principalAmount, interestRate, tenureMonths);

        // Calculate next payment date (1 month from start)
        const start = startDate ? new Date(startDate) : new Date();
        const nextPaymentDate = new Date(start);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

        const loan = await Loan.create({
            userId: req.user?.userId,
            name,
            loanType,
            principalAmount,
            outstandingAmount: principalAmount, // Initially same as principal
            interestRate,
            tenureMonths,
            emiAmount,
            startDate: start,
            nextPaymentDate,
            lender,
            description,
        });

        res.status(HTTP_STATUS.CREATED).json({ success: true, data: loan });
    } catch (error) {
        next(error);
    }
}

/**
 * Update a loan
 */
export async function updateLoan(req: Request, res: Response, next: NextFunction) {
    try {
        const loan = await Loan.findOneAndUpdate(
            { _id: req.params['id'], userId: req.user?.userId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!loan) throw new AppError('Loan not found', HTTP_STATUS.NOT_FOUND);
        res.status(HTTP_STATUS.OK).json({ success: true, data: loan });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a loan
 */
export async function deleteLoan(req: Request, res: Response, next: NextFunction) {
    try {
        const loan = await Loan.findOneAndDelete({
            _id: req.params['id'],
            userId: req.user?.userId,
        });
        if (!loan) throw new AppError('Loan not found', HTTP_STATUS.NOT_FOUND);
        res.status(HTTP_STATUS.OK).json({ success: true, message: SUCCESS_MESSAGES.DELETED });
    } catch (error) {
        next(error);
    }
}

/**
 * Record an EMI payment for a loan
 * This creates a transaction and updates the outstanding amount
 */
export async function recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
        const loan = await Loan.findOne({ _id: req.params['id'], userId: req.user?.userId });
        if (!loan) throw new AppError('Loan not found', HTTP_STATUS.NOT_FOUND);

        const paymentAmount = req.body.amount || loan.emiAmount;

        // Create expense transaction for this payment
        await Transaction.create({
            userId: req.user?.userId,
            amount: paymentAmount,
            type: 'expense',
            category: 'Loan EMI',
            description: `EMI payment for ${loan.name}`,
            merchant: loan.lender || 'Loan Payment',
            date: new Date(),
        });

        // Update outstanding amount
        loan.outstandingAmount = Math.max(0, loan.outstandingAmount - paymentAmount);

        // Update next payment date
        loan.nextPaymentDate = new Date(loan.nextPaymentDate);
        loan.nextPaymentDate.setMonth(loan.nextPaymentDate.getMonth() + 1);

        // Close loan if fully paid
        if (loan.outstandingAmount <= 0) {
            loan.status = 'closed';
        }

        await loan.save();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: loan,
            message: 'Payment recorded successfully'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get smart loan recommendations for the current user
 */
export async function getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?.userId);
        const result = await getSmartLoanAdvice(userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}
