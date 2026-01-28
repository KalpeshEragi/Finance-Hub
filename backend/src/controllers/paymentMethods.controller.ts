/**
 * @file paymentMethods.controller.ts
 * @description Controller for payment methods CRUD operations
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import PaymentMethod from '../models/paymentMethod.model';

// =============================================================================
// GET ALL PAYMENT METHODS
// =============================================================================

export const getPaymentMethods = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;

        const methods = await PaymentMethod.find({
            userId,
            isActive: true
        }).sort({ createdAt: -1 });

        // Group by type
        const bankAccounts = methods.filter(m => m.type === 'bank_account');
        const creditCards = methods.filter(m => m.type === 'credit_card');
        const upiAccounts = methods.filter(m => m.type === 'upi');

        res.status(200).json({
            success: true,
            data: {
                bankAccounts,
                creditCards,
                upiAccounts,
                counts: {
                    bankAccounts: bankAccounts.length,
                    creditCards: creditCards.length,
                    upiAccounts: upiAccounts.length,
                    total: methods.length,
                },
            },
        });
    } catch (error) {
        return next(error);
    }
};

// =============================================================================
// ADD BANK ACCOUNT
// =============================================================================

export const addBankAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        const {
            bankName,
            accountNumber,
            ifscCode,
            accountType,
            accountHolderName,
            isPrimary
        } = req.body;

        // Mask account number - only store last 4 digits
        const maskedAccountNumber = accountNumber ?
            '••••' + accountNumber.slice(-4) : undefined;

        // If this is set as primary, unset any existing primary
        if (isPrimary) {
            await PaymentMethod.updateMany(
                { userId, type: 'bank_account', isPrimary: true },
                { isPrimary: false }
            );
        }

        const method = await PaymentMethod.create({
            userId,
            type: 'bank_account',
            bankName,
            accountNumber: maskedAccountNumber,
            ifscCode,
            accountType,
            accountHolderName,
            isPrimary: isPrimary || false,
        });

        res.status(201).json({
            success: true,
            data: method,
            message: 'Bank account added successfully',
        });
    } catch (error) {
        return next(error);
    }
};

// =============================================================================
// ADD CREDIT CARD
// =============================================================================

export const addCreditCard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        const { cardNumber, cvv, creditLimit, expiryMonth, expiryYear, cardType, cardNickname } = req.body;

        const errors: string[] = [];

        // Validate card number (13-19 digits)
        if (!cardNumber || !/^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''))) {
            errors.push('Card number must be 13-19 digits');
        }

        // Validate CVV (3-4 digits)
        if (!cvv || !/^\d{3,4}$/.test(cvv)) {
            errors.push('CVV must be 3 or 4 digits');
        }

        // Validate credit limit
        const limitNum = Number(creditLimit);
        if (!creditLimit || isNaN(limitNum) || limitNum < 1000 || limitNum > 10000000) {
            errors.push('Credit limit must be between ₹1,000 and ₹1,00,00,000');
        }

        // Validate expiry month
        const monthNum = Number(expiryMonth);
        if (!expiryMonth || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            errors.push('Expiry month must be between 1 and 12');
        }

        // Validate expiry year
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const yearNum = Number(expiryYear);
        if (!expiryYear || isNaN(yearNum) || yearNum < currentYear || yearNum > 2050) {
            errors.push('Invalid expiry year');
        }

        // Check if card is expired
        if (yearNum === currentYear && monthNum < currentMonth) {
            errors.push('Card appears to be expired');
        }

        // Validate card type
        const validCardTypes = ['visa', 'mastercard', 'rupay', 'amex', 'diners', 'discover'];
        if (!cardType || !validCardTypes.includes(cardType)) {
            errors.push('Please select a valid card type');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors.join('. '),
                errors,
            });
        }

        // Mask card number - only store last 4 digits visible
        const cleanCardNumber = cardNumber.replace(/\s/g, '');
        const last4 = cleanCardNumber.slice(-4);
        const maskedNumber = '****-****-****-' + last4;

        const method = await PaymentMethod.create({
            userId,
            type: 'credit_card',
            cardNumberMasked: maskedNumber,
            cardLast4Digits: last4,
            cvv, // In production, this should be encrypted
            creditLimit: limitNum,
            expiryMonth: monthNum,
            expiryYear: yearNum,
            cardType,
            cardNickname: cardNickname || undefined,
        });

        return res.status(201).json({
            success: true,
            data: method,
            message: 'Credit card added successfully',
        });
    } catch (error) {
        return next(error);
    }
};


// =============================================================================
// ADD UPI
// =============================================================================

export const addUpi = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        const { upiId } = req.body;

        // Validate UPI ID format
        if (!upiId || !/^[\w.-]+@[\w]+$/.test(upiId)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid UPI ID (e.g., username@upi)',
            });
        }

        // Check if UPI ID already exists for this user
        const existing = await PaymentMethod.findOne({
            userId,
            type: 'upi',
            upiId: upiId.toLowerCase(),
            isActive: true,
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'This UPI ID is already linked to your account',
            });
        }

        const method = await PaymentMethod.create({
            userId,
            type: 'upi',
            upiId: upiId.toLowerCase(),
        });

        return res.status(201).json({
            success: true,
            data: method,
            message: 'UPI ID added successfully',
        });
    } catch (error) {
        return next(error);
    }
};

// =============================================================================
// DELETE PAYMENT METHOD
// =============================================================================

export const deletePaymentMethod = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const method = await PaymentMethod.findOneAndUpdate(
            { _id: id, userId },
            { isActive: false },
            { new: true }
        );

        if (!method) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Payment method removed successfully',
        });
    } catch (error) {
        return next(error);
    }
};

// =============================================================================
// GET COUNTS ONLY
// =============================================================================

export const getPaymentMethodCounts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const counts = await PaymentMethod.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]);

        const result = {
            bankAccounts: 0,
            creditCards: 0,
            upiAccounts: 0,
        };

        counts.forEach(c => {
            if (c._id === 'bank_account') result.bankAccounts = c.count;
            if (c._id === 'credit_card') result.creditCards = c.count;
            if (c._id === 'upi') result.upiAccounts = c.count;
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return next(error);
    }
};

export const paymentMethodsController = {
    getPaymentMethods,
    addBankAccount,
    addCreditCard,
    addUpi,
    deletePaymentMethod,
    getPaymentMethodCounts,
};
