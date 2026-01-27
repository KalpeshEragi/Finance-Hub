import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILoan extends Document {
    userId: Types.ObjectId;
    name: string;
    loanType: 'home' | 'car' | 'personal' | 'education' | 'credit_card' | 'other';
    principalAmount: number;
    outstandingAmount: number;
    interestRate: number; // Annual percentage
    tenureMonths: number;
    emiAmount: number;
    startDate: Date;
    nextPaymentDate: Date;
    status: 'active' | 'closed' | 'defaulted';
    lender?: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Calculates EMI using the formula:
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 * where P = principal, r = monthly interest rate, n = tenure in months
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    if (annualRate === 0) {
        return principal / tenureMonths;
    }
    const monthlyRate = annualRate / 12 / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi * 100) / 100;
}

const loanSchema = new Schema<ILoan>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        loanType: {
            type: String,
            enum: ['home', 'car', 'personal', 'education', 'credit_card', 'other'],
            default: 'personal',
        },
        principalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        outstandingAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        interestRate: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        tenureMonths: {
            type: Number,
            required: true,
            min: 1,
        },
        emiAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        nextPaymentDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'closed', 'defaulted'],
            default: 'active',
        },
        lender: String,
        description: String,
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_doc: unknown, ret: Record<string, unknown>) => {
                ret['id'] = (ret['_id'] as Types.ObjectId).toString();
                delete ret['_id'];
                delete ret['__v'];
                return ret;
            },
        },
    }
);

// Compound index for user queries
loanSchema.index({ userId: 1, status: 1 });

export default mongoose.model<ILoan>('Loan', loanSchema);
