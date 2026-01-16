/**
 * @file alert.model.ts
 * @description Mongoose model for user Alert/Notification documents.
 * 
 * Alerts notify users about important financial events:
 * - Budget warnings (approaching/exceeding limits)
 * - Goal progress milestones
 * - Unusual spending patterns
 * - Tax reminders
 * 
 * @architecture
 * Alerts are user-specific notifications with:
 * - Type classification for filtering/display
 * - Read/unread status tracking
 * - Automatic cleanup of old read alerts (optional)
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { ALERT_TYPES } from '../config/constants';

// =============================================================================
// INTERFACE DEFINITIONS
// =============================================================================

/**
 * @type AlertType
 * @description Types of alerts that can be generated.
 */
export type AlertType =
    | 'budget_warning'
    | 'budget_exceeded'
    | 'goal_progress'
    | 'goal_achieved'
    | 'unusual_spending'
    | 'tax_reminder'
    | 'general';

/**
 * @interface IAlertBase
 * @description Base alert properties.
 */
export interface IAlertBase {
    /** Reference to the user */
    userId: Types.ObjectId;

    /** Alert type for categorization */
    type: AlertType;

    /** Alert title (short summary) */
    title: string;

    /** Detailed alert message */
    message: string;

    /** Whether the user has read this alert */
    isRead: boolean;

    /** Optional reference to related entity (budget ID, goal ID, etc.) */
    relatedEntityId?: Types.ObjectId;

    /** Type of related entity */
    relatedEntityType?: 'budget' | 'goal' | 'transaction';

    /** Additional metadata */
    metadata?: Record<string, unknown>;
}

/**
 * @interface IAlert
 * @description Full alert document type.
 */
export interface IAlert extends Document, IAlertBase {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// SCHEMA DEFINITION
// =============================================================================

/**
 * @constant alertSchema
 * @description Mongoose schema for Alert documents.
 */
const alertSchema = new Schema<IAlert>(
    {
        /**
         * Reference to the alert recipient.
         */
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },

        /**
         * Alert type for categorization and display.
         */
        type: {
            type: String,
            required: [true, 'Alert type is required'],
            enum: {
                values: Object.values(ALERT_TYPES),
                message: 'Invalid alert type',
            },
            index: true,
        },

        /**
         * Short title for the alert.
         */
        title: {
            type: String,
            required: [true, 'Alert title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },

        /**
         * Detailed message content.
         */
        message: {
            type: String,
            required: [true, 'Alert message is required'],
            trim: true,
            maxlength: [500, 'Message cannot exceed 500 characters'],
        },

        /**
         * Read status - defaults to unread.
         */
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        /**
         * Optional reference to related entity.
         */
        relatedEntityId: {
            type: Schema.Types.ObjectId,
            required: false,
        },

        /**
         * Type of the related entity.
         */
        relatedEntityType: {
            type: String,
            enum: ['budget', 'goal', 'transaction'],
            required: false,
        },

        /**
         * Flexible metadata field for additional context.
         */
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
        collection: 'alerts',

        toJSON: {
            transform: (_doc: unknown, ret: Record<string, unknown>) => {
                ret['id'] = ret['_id'];
                delete ret['_id'];
                delete ret['__v'];
                return ret;
            },
        },
    }
);

// =============================================================================
// INDEXES
// =============================================================================

/**
 * @description Compound index for fetching unread alerts efficiently.
 */
alertSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

/**
 * @description Index for cleanup of old alerts (TTL could be added).
 */
alertSchema.index({ createdAt: -1 });

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * @static getUnreadCount
 * @description Gets the count of unread alerts for a user.
 */
alertSchema.statics.getUnreadCount = async function (userId: string): Promise<number> {
    return this.countDocuments({ userId, isRead: false });
};

/**
 * @static markAllAsRead
 * @description Marks all alerts for a user as read.
 */
alertSchema.statics.markAllAsRead = async function (userId: string): Promise<void> {
    await this.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true } }
    );
};

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * @method markAsRead
 * @description Marks this alert as read.
 */
alertSchema.methods.markAsRead = async function (): Promise<IAlert> {
    this.isRead = true;
    return this.save();
};

/**
 * @method toPublicJSON
 * @description Returns public-safe representation.
 */
alertSchema.methods.toPublicJSON = function () {
    return {
        id: this._id.toString(),
        type: this.type,
        title: this.title,
        message: this.message,
        isRead: this.isRead,
        relatedEntityId: this.relatedEntityId?.toString(),
        relatedEntityType: this.relatedEntityType,
        createdAt: this.createdAt,
    };
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

/**
 * @constant Alert
 * @description Mongoose model for Alert documents.
 * 
 * @example
 * // Create a budget warning alert
 * const alert = await Alert.create({
 *   userId: user._id,
 *   type: 'budget_warning',
 *   title: 'Budget Alert: Food & Dining',
 *   message: 'You have used 85% of your Food & Dining budget this month.',
 *   relatedEntityId: budgetId,
 *   relatedEntityType: 'budget',
 * });
 * 
 * // Get unread alerts
 * const unread = await Alert.find({ userId, isRead: false })
 *   .sort({ createdAt: -1 })
 *   .limit(20);
 */
const Alert = mongoose.model<IAlert>('Alert', alertSchema);

export default Alert;
export { Alert, alertSchema };

