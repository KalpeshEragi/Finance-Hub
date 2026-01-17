import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInvestmentHolding extends Document {
    userId: Types.ObjectId;
    name: string;
    symbol: string;
    type: 'stock' | 'mutual_fund' | 'crypto' | 'gold' | 'fd' | 'other';
    quantity: number;
    averagePrice: number;
    currentPrice: number;
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
            enum: ['stock', 'mutual_fund', 'crypto', 'gold', 'fd', 'other'],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
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
