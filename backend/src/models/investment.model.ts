import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInvestmentHolding extends Document {
    userId: Types.ObjectId;
    name: string;
    symbol: string;
    type: 'stock' | 'mutual_fund' | 'ppf' | 'other';
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    // New fields for Investment Agent
    amount: number;
    investmentDate: Date;
    investmentMode: 'sip' | 'lumpsum' | 'stp';
    sipFrequency?: 'weekly' | 'monthly' | 'yearly';
    schemeType?: 'PPF' | 'NPS' | 'EPF' | 'ELSS';
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}

const investmentSchema = new Schema<IInvestmentHolding>(
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
        symbol: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        type: {
            type: String,
            enum: ['stock', 'mutual_fund', 'ppf', 'other'],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 1,
        },
        averagePrice: {
            type: Number,
            required: true,
            min: 0,
        },
        currentPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        // New Investment Agent fields
        amount: {
            type: Number,
            min: 0,
            default: 0,
        },
        investmentDate: {
            type: Date,
            default: Date.now,
        },
        investmentMode: {
            type: String,
            enum: ['sip', 'lumpsum', 'stp'],
            default: 'lumpsum',
        },
        sipFrequency: {
            type: String,
            enum: ['weekly', 'monthly', 'yearly'],
        },
        schemeType: {
            type: String,
            enum: ['PPF', 'NPS', 'EPF', 'ELSS'],
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_doc: any, ret: any) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

export default mongoose.model<IInvestmentHolding>('InvestmentHolding', investmentSchema);

