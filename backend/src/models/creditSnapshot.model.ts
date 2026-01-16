/**
 * @file creditSnapshot.model.ts
 * @description Mongoose model for Credit Score Snapshot documents.
 * 
 * @important
 * All credit scores in this application are SIMULATED/ESTIMATED credit health
 * scores based on transaction patterns and financial behavior. They are NOT
 * actual credit bureau scores (like CIBIL, FICO, etc.).
 * 
 * Snapshots store historical credit score data:
 * - Score at a point in time
 * - Contributing factors
 * - Recommendations for improvement
 * 
 * @architecture
 * New snapshots are created periodically (e.g., weekly/monthly) to track
 * credit health trends over time.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import type {
    CreditFactor,
    CreditRecommendation,
    CreditRating
} from '../types/credit.types';

// =============================================================================
// INTERFACE DEFINITIONS
// =============================================================================

/**
 * @interface ICreditSnapshotBase
 * @description Base credit snapshot properties.
 */
export interface ICreditSnapshotBase {
    /** Reference to the user */
    userId: Types.ObjectId;

    /** 
     * Simulated credit health score (300-850)
     * @important NOT an actual credit bureau score
     */
    score: number;

    /** Rating category derived from score */
    rating: CreditRating;

    /** Factors that contributed to this score */
    factors: CreditFactor[];

    /** Personalized improvement recommendations */
    recommendations: CreditRecommendation[];
}

/**
 * @interface ICreditSnapshot
 * @description Full credit snapshot document type.
 */
export interface ICreditSnapshot extends Document, ICreditSnapshotBase {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// SUB-SCHEMAS
// =============================================================================

/**
 * @constant creditFactorSchema
 * @description Sub-schema for credit factors.
 */
const creditFactorSchema = new Schema({
    name: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    weight: { type: Number, required: true, min: 0, max: 1 },
    impact: {
        type: String,
        required: true,
        enum: ['positive', 'neutral', 'negative']
    },
    description: { type: String, required: true },
}, { _id: false });

/**
 * @constant recommendationSchema
 * @description Sub-schema for recommendations.
 */
const recommendationSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
        type: String,
        required: true,
        enum: ['high', 'medium', 'low']
    },
    relatedFactor: { type: String, required: true },
    potentialImpact: { type: Number, required: true },
}, { _id: false });

// =============================================================================
// MAIN SCHEMA
// =============================================================================

/**
 * @constant creditSnapshotSchema
 * @description Mongoose schema for Credit Snapshot documents.
 */
const creditSnapshotSchema = new Schema<ICreditSnapshot>(
    {
        /**
         * Reference to the user.
         */
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },

        /**
         * Simulated credit health score.
         * Range: 300 (lowest) to 850 (highest)
         */
        score: {
            type: Number,
            required: [true, 'Score is required'],
            min: [300, 'Score cannot be less than 300'],
            max: [850, 'Score cannot exceed 850'],
        },

        /**
         * Rating category based on score.
         */
        rating: {
            type: String,
            required: [true, 'Rating is required'],
            enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'],
        },

        /**
         * Contributing factors.
         */
        factors: {
            type: [creditFactorSchema],
            default: [],
        },

        /**
         * Improvement recommendations.
         */
        recommendations: {
            type: [recommendationSchema],
            default: [],
        },
    },
    {
        timestamps: true,
        collection: 'creditSnapshots',

        toJSON: {
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
 * @description Index for fetching user's score history.
 */
creditSnapshotSchema.index({ userId: 1, createdAt: -1 });

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * @static getLatestForUser
 * @description Gets the most recent snapshot for a user.
 */
creditSnapshotSchema.statics.getLatestForUser = async function (
    userId: string
): Promise<ICreditSnapshot | null> {
    return this.findOne({ userId })
        .sort({ createdAt: -1 })
        .exec();
};

/**
 * @static getScoreHistory
 * @description Gets score history for trend analysis.
 */
creditSnapshotSchema.statics.getScoreHistory = async function (
    userId: string,
    limit: number = 12
): Promise<Array<{ score: number; rating: string; createdAt: Date }>> {
    return this.find({ userId })
        .select('score rating createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * @method getScoreChange
 * @description Calculates score change from previous snapshot.
 */
creditSnapshotSchema.methods.getScoreChange = async function (): Promise<{
    value: number;
    direction: 'up' | 'down' | 'unchanged';
} | null> {
    const previous = await mongoose.model<ICreditSnapshot>('CreditSnapshot')
        .findOne({
            userId: this.userId,
            createdAt: { $lt: this.createdAt },
        })
        .sort({ createdAt: -1 });

    if (!previous) {
        return null;
    }

    const change = this.score - previous.score;
    return {
        value: Math.abs(change),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged',
    };
};

/**
 * @method toPublicJSON
 * @description Returns public-safe representation with disclaimer.
 */
creditSnapshotSchema.methods.toPublicJSON = function () {
    return {
        id: this._id.toString(),
        label: 'Estimated / Simulated Credit Health Score',
        score: this.score,
        rating: this.rating,
        factors: this.factors,
        recommendations: this.recommendations,
        disclaimer: 'This is a simulated credit health score based on your financial behavior. It is not an actual credit bureau score.',
        createdAt: this.createdAt,
    };
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * @function getRatingFromScore
 * @description Determines credit rating category from score.
 * 
 * @param score - Credit score (300-850)
 * @returns Rating category
 */
export function getRatingFromScore(score: number): CreditRating {
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    if (score >= 550) return 'Poor';
    return 'Very Poor';
}

// =============================================================================
// MODEL EXPORT
// =============================================================================

/**
 * @constant CreditSnapshot
 * @description Mongoose model for Credit Snapshot documents.
 * 
 * @example
 * // Create a new snapshot
 * const snapshot = await CreditSnapshot.create({
 *   userId: user._id,
 *   score: 720,
 *   rating: getRatingFromScore(720),
 *   factors: [
 *     {
 *       name: 'Payment Consistency',
 *       score: 85,
 *       weight: 0.3,
 *       impact: 'positive',
 *       description: 'You have consistent bill payment patterns',
 *     },
 *   ],
 *   recommendations: [
 *     {
 *       id: 'rec-1',
 *       title: 'Increase savings rate',
 *       description: 'Aim to save 20% of your income',
 *       priority: 'high',
 *       relatedFactor: 'Savings Rate',
 *       potentialImpact: 15,
 *     },
 *   ],
 * });
 */
const CreditSnapshot = mongoose.model<ICreditSnapshot>('CreditSnapshot', creditSnapshotSchema);

export default CreditSnapshot;
export { CreditSnapshot, creditSnapshotSchema, ICreditSnapshot, ICreditSnapshotBase };
