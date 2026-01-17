/**
 * @file paymentMethod.model.ts
 * @description Mongoose model for Payment Method documents.
 * 
 * Stores user's connected payment methods including:
 * - Bank accounts (connected via Account Aggregator)
 * - Credit cards (card number masked, CVV, credit limit, expiry)
 * - UPI IDs
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// =============================================================================
// INTERFACES
// =============================================================================

export interface IPaymentMethod extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'bank_account' | 'credit_card' | 'upi';

    // Bank account fields
    bankName?: string;
    accountNumber?: string; // Masked - only last 4 digits stored
    ifscCode?: string;
    accountType?: string;
    accountHolderName?: string;
    isPrimary?: boolean;

    // Credit card fields
    cardNumberMasked?: string; // Stored as ****-****-****-1234 (only last 4 visible)
    cardLast4Digits?: string;
    cvv?: string; // Stored encrypted or hashed in production
    creditLimit?: number;
    expiryMonth?: number;
    expiryYear?: number;
    cardType?: 'visa' | 'mastercard' | 'amex' | 'rupay' | 'discover' | 'other';
    cardNickname?: string;

    // UPI fields
    upiId?: string;

    // Common fields
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// SCHEMA DEFINITION
// =============================================================================

const paymentMethodSchema = new Schema<IPaymentMethod>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },

        type: {
            type: String,
            enum: ['bank_account', 'credit_card', 'upi'],
            required: [true, 'Payment method type is required'],
        },

        // Bank account fields
        bankName: {
            type: String,
            trim: true,
        },
        accountNumber: {
            type: String,
            trim: true,
        },
        ifscCode: {
            type: String,
            trim: true,
            uppercase: true,
        },
        accountType: {
            type: String,
            enum: {
                values: ['savings', 'current', 'salary', 'nre', 'nro'],
                message: 'Invalid account type',
            },
        },
        accountHolderName: {
            type: String,
            trim: true,
        },
        isPrimary: {
            type: Boolean,
            default: false,
        },

        // Credit card fields
        cardNumberMasked: {
            type: String,
            trim: true,
        },
        cardLast4Digits: {
            type: String,
            minlength: 4,
            maxlength: 4,
            match: [/^\d{4}$/, 'Card last 4 digits must be exactly 4 numbers'],
        },
        cvv: {
            type: String,
            minlength: 3,
            maxlength: 4,
            match: [/^\d{3,4}$/, 'CVV must be 3 or 4 digits'],
        },
        creditLimit: {
            type: Number,
            min: [1000, 'Credit limit must be at least ₹1,000'],
            max: [10000000, 'Credit limit cannot exceed ₹1,00,00,000'],
        },
        expiryMonth: {
            type: Number,
            min: [1, 'Expiry month must be between 1 and 12'],
            max: [12, 'Expiry month must be between 1 and 12'],
        },
        expiryYear: {
            type: Number,
            min: [2024, 'Card appears to be expired'],
            max: [2050, 'Invalid expiry year'],
        },
        cardType: {
            type: String,
            enum: {
                values: ['visa', 'mastercard', 'rupay', 'amex', 'diners', 'discover'],
                message: 'Invalid card type',
            },
        },
        cardNickname: {
            type: String,
            trim: true,
            maxlength: [50, 'Nickname cannot exceed 50 characters'],
        },

        // UPI fields
        upiId: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: [50, 'UPI ID cannot exceed 50 characters'],
        },

        // Common fields
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: 'payment_methods',

        toJSON: {
            transform: (_doc: unknown, ret: Record<string, unknown>) => {
                ret['id'] = ret['_id'];
                delete ret['_id'];
                delete ret['__v'];
                // Never expose CVV in responses
                delete ret['cvv'];
                return ret;
            },
        },
    }
);

// =============================================================================
// INDEXES
// =============================================================================

paymentMethodSchema.index({ userId: 1, type: 1 });
paymentMethodSchema.index({ userId: 1, isActive: 1 });

// =============================================================================
// MODEL EXPORT
// =============================================================================

const PaymentMethod = mongoose.model<IPaymentMethod>('PaymentMethod', paymentMethodSchema);

export default PaymentMethod;
export { PaymentMethod, paymentMethodSchema };

