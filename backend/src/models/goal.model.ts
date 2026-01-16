/**
 * @file goal.model.ts
 * @description Mongoose model for financial Goal documents.
 * 
 * Goals represent financial targets users want to achieve:
 * - Saving for a vacation
 * - Emergency fund
 * - Buying a car
 * - Retirement savings
 * 
 * @architecture
 * Goals track:
 * - Target amount and current progress
 * - Deadline for achievement
 * - Status (active, completed, cancelled)
 * - Optional notes and priority
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { GOAL_STATUS } from '../config/constants';

// =============================================================================
// INTERFACE DEFINITIONS
// =============================================================================

/**
 * @type GoalStatus
 * @description Possible goal statuses.
 */
export type GoalStatus = 'active' | 'completed' | 'cancelled';

/**
 * @interface IGoalBase
 * @description Base goal properties.
 */
export interface IGoalBase {
    /** Reference to the user */
    userId: Types.ObjectId;

    /** Goal title (e.g., "Emergency Fund") */
    title: string;

    /** Target amount to save */
    targetAmount: number;

    /** Current amount saved towards this goal */
    currentAmount: number;

    /** Target completion date */
    deadline: Date;

    /** Current status */
    status: GoalStatus;

    /** Optional description or notes */
    description?: string;

    /** Priority level (1 = highest) */
    priority?: number;

    /** Associated category (optional) */
    category?: string;
}

/**
 * @interface IGoal
 * @description Full goal document type.
 */
export interface IGoal extends Document, IGoalBase {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// SCHEMA DEFINITION
// =============================================================================

/**
 * @constant goalSchema
 * @description Mongoose schema for Goal documents.
 */
const goalSchema = new Schema<IGoal>(
    {
        /**
         * Reference to the goal owner.
         */
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },

        /**
         * Goal title - short descriptive name.
         */
        title: {
            type: String,
            required: [true, 'Goal title is required'],
            trim: true,
            minlength: [1, 'Title cannot be empty'],
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },

        /**
         * Target amount to achieve.
         */
        targetAmount: {
            type: Number,
            required: [true, 'Target amount is required'],
            min: [1, 'Target amount must be at least 1'],
            set: (val: number) => Math.round(val * 100) / 100,
        },

        /**
         * Current progress towards the goal.
         * Defaults to 0 when goal is created.
         */
        currentAmount: {
            type: Number,
            default: 0,
            min: [0, 'Current amount cannot be negative'],
            set: (val: number) => Math.round(val * 100) / 100,
        },

        /**
         * Target deadline for completing the goal.
         */
        deadline: {
            type: Date,
            required: [true, 'Deadline is required'],
            validate: {
                validator: function (value: Date): boolean {
                    // Deadline should be in the future (for new goals)
                    // Existing goals can have past deadlines
                    return true; // Allow any date for flexibility
                },
                message: 'Deadline must be a valid date',
            },
        },

        /**
         * Current status of the goal.
         */
        status: {
            type: String,
            enum: {
                values: [GOAL_STATUS.ACTIVE, GOAL_STATUS.COMPLETED, GOAL_STATUS.CANCELLED],
                message: 'Status must be active, completed, or cancelled',
            },
            default: GOAL_STATUS.ACTIVE,
            index: true,
        },

        /**
         * Optional description or notes about the goal.
         */
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },

        /**
         * Priority level (1 = highest priority).
         * Used for sorting and display.
         */
        priority: {
            type: Number,
            min: [1, 'Priority must be at least 1'],
            max: [10, 'Priority cannot exceed 10'],
            default: 5,
        },

        /**
         * Optional category tag.
         */
        category: {
            type: String,
            trim: true,
            maxlength: [50, 'Category cannot exceed 50 characters'],
        },
    },
    {
        timestamps: true,
        collection: 'goals',

        toJSON: {
            virtuals: true,
            transform: (_doc, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// =============================================================================
// INDEXES
// =============================================================================

/**
 * @description Index for fetching active goals for a user.
 */
goalSchema.index({ userId: 1, status: 1 });

/**
 * @description Index for ordering by deadline.
 */
goalSchema.index({ userId: 1, deadline: 1 });

// =============================================================================
// VIRTUAL FIELDS
// =============================================================================

/**
 * @virtual progressPercentage
 * @description Calculates completion percentage.
 */
goalSchema.virtual('progressPercentage').get(function () {
    if (this.targetAmount === 0) return 0;
    return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100));
});

/**
 * @virtual remainingAmount
 * @description Calculates amount still needed.
 */
goalSchema.virtual('remainingAmount').get(function () {
    return Math.max(0, this.targetAmount - this.currentAmount);
});

/**
 * @virtual isOverdue
 * @description Checks if the goal is past its deadline.
 */
goalSchema.virtual('isOverdue').get(function () {
    return this.status === 'active' && new Date() > this.deadline;
});

/**
 * @virtual daysRemaining
 * @description Calculates days until deadline.
 */
goalSchema.virtual('daysRemaining').get(function () {
    const now = new Date();
    const deadline = new Date(this.deadline);
    const diffMs = deadline.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * @method addProgress
 * @description Adds amount to current progress.
 * Automatically completes goal if target is reached.
 * 
 * @param amount - Amount to add
 * @returns Updated goal
 */
goalSchema.methods.addProgress = async function (amount: number): Promise<IGoal> {
    this.currentAmount += amount;

    // Auto-complete if target reached
    if (this.currentAmount >= this.targetAmount) {
        this.status = GOAL_STATUS.COMPLETED;
    }

    return this.save();
};

/**
 * @method toPublicJSON
 * @description Returns public-safe representation.
 */
goalSchema.methods.toPublicJSON = function () {
    return {
        id: this._id.toString(),
        title: this.title,
        targetAmount: this.targetAmount,
        currentAmount: this.currentAmount,
        deadline: this.deadline,
        status: this.status,
        description: this.description,
        priority: this.priority,
        category: this.category,
        progressPercentage: this.progressPercentage,
        remainingAmount: this.remainingAmount,
        daysRemaining: this.daysRemaining,
        isOverdue: this.isOverdue,
        createdAt: this.createdAt,
    };
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

/**
 * @constant Goal
 * @description Mongoose model for Goal documents.
 * 
 * @example
 * // Create a savings goal
 * const goal = await Goal.create({
 *   userId: user._id,
 *   title: 'Emergency Fund',
 *   targetAmount: 100000,
 *   deadline: new Date('2024-12-31'),
 *   priority: 1,
 * });
 * 
 * // Update progress
 * await goal.addProgress(5000);
 */
const Goal = mongoose.model<IGoal>('Goal', goalSchema);

export default Goal;
export { Goal, goalSchema, IGoal, IGoalBase, GoalStatus };
