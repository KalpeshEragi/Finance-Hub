import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRecurringSubscription extends Document {
    userId: Types.ObjectId;
    name: string;
    amount: number;
    category: string;
    frequency: 'monthly' | 'yearly' | 'weekly';
    startDate: Date;
    nextBillingDate: Date;
    status: 'active' | 'cancelled' | 'paused';
    merchant?: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const recurringSchema = new Schema<IRecurringSubscription>(
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
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        category: {
            type: String,
            required: true,
            default: 'Subscriptions',
        },
        frequency: {
            type: String,
            enum: ['monthly', 'yearly', 'weekly'],
            default: 'monthly',
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        nextBillingDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'paused'],
            default: 'active',
        },
        merchant: String,
        description: String,
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

export default mongoose.model<IRecurringSubscription>('RecurringSubscription', recurringSchema);
