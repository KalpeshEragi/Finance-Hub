/**
 * @file taxProfile.model.ts
 * @description Mongoose model for user Tax Profile documents.
 * 
 * Tax profiles store user's income and deduction data for tax estimation:
 * - Multiple income sources (salary, rental, business, etc.)
 * - Claimed deductions under various sections
 * - Preferred tax regime (old vs new)
 * 
 * @architecture
 * One profile per user per financial year.
 * The profile aggregates all tax-relevant data for estimation.
 * 
 * @note Based on Indian Income Tax Act (simplified for hackathon)
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { TAX_REGIMES } from '../config/constants';
import type { TaxRegime, IncomeDetails, DeductionDetails } from '../types/tax.types';

// =============================================================================
// INTERFACE DEFINITIONS
// =============================================================================

/**
 * @interface ITaxProfileBase
 * @description Base tax profile properties.
 */
export interface ITaxProfileBase {
    /** Reference to the user */
    userId: Types.ObjectId;

    /** Financial year (e.g., '2024-25') */
    financialYear: string;

    /** User's preferred tax regime */
    preferredRegime: TaxRegime;

    /** Income breakdown by source */
    income: IncomeDetails;

    /** Claimed deductions by section */
    deductions: DeductionDetails;
}

/**
 * @interface ITaxProfile
 * @description Full tax profile document type.
 */
export interface ITaxProfile extends Document, ITaxProfileBase {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// SUB-SCHEMAS
// =============================================================================

/**
 * @constant capitalGainsSchema
 * @description Sub-schema for capital gains breakdown.
 */
const capitalGainsSchema = new Schema({
    shortTerm: { type: Number, default: 0, min: 0 },
    longTerm: { type: Number, default: 0, min: 0 },
}, { _id: false });

/**
 * @constant incomeSchema
 * @description Sub-schema for income details.
 */
const incomeSchema = new Schema({
    salary: { type: Number, default: 0, min: 0 },
    rental: { type: Number, default: 0, min: 0 },
    otherSources: { type: Number, default: 0, min: 0 },
    business: { type: Number, default: 0, min: 0 },
    capitalGains: { type: capitalGainsSchema, default: () => ({}) },
}, { _id: false });

/**
 * @constant deductionsSchema
 * @description Sub-schema for deduction details.
 */
const deductionsSchema = new Schema({
    section80C: { type: Number, default: 0, min: 0, max: 150000 },
    section80D: { type: Number, default: 0, min: 0, max: 100000 },
    section80G: { type: Number, default: 0, min: 0 },
    homeLoanInterest: { type: Number, default: 0, min: 0, max: 200000 },
    hra: { type: Number, default: 0, min: 0 },
    lta: { type: Number, default: 0, min: 0 },
    standardDeduction: { type: Number, default: 50000, min: 0, max: 50000 },
    professionalTax: { type: Number, default: 0, min: 0, max: 5000 },
    nps: { type: Number, default: 0, min: 0, max: 50000 },
}, { _id: false });

// =============================================================================
// MAIN SCHEMA
// =============================================================================

/**
 * @constant taxProfileSchema
 * @description Mongoose schema for Tax Profile documents.
 */
const taxProfileSchema = new Schema<ITaxProfile>(
    {
        /**
         * Reference to the profile owner.
         */
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },

        /**
         * Financial year this profile is for.
         * Format: 'YYYY-YY' (e.g., '2024-25')
         */
        financialYear: {
            type: String,
            required: [true, 'Financial year is required'],
            match: [/^\d{4}-\d{2}$/, 'Financial year must be in format YYYY-YY'],
            index: true,
        },

        /**
         * User's preferred tax regime.
         */
        preferredRegime: {
            type: String,
            enum: {
                values: [TAX_REGIMES.OLD, TAX_REGIMES.NEW],
                message: 'Regime must be old or new',
            },
            default: TAX_REGIMES.NEW,
        },

        /**
         * Income breakdown by source.
         */
        income: {
            type: incomeSchema,
            default: () => ({}),
        },

        /**
         * Claimed deductions.
         */
        deductions: {
            type: deductionsSchema,
            default: () => ({}),
        },
    },
    {
        timestamps: true,
        collection: 'taxProfiles',

        toJSON: {
            virtuals: true,
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
 * @description Unique constraint: one profile per user per FY.
 */
taxProfileSchema.index(
    { userId: 1, financialYear: 1 },
    { unique: true }
);

// =============================================================================
// VIRTUAL FIELDS
// =============================================================================

/**
 * @virtual grossTotalIncome
 * @description Calculates total income from all sources.
 */
taxProfileSchema.virtual('grossTotalIncome').get(function () {
    const income = this.income;
    return (
        income.salary +
        income.rental +
        income.otherSources +
        income.business +
        income.capitalGains.shortTerm +
        income.capitalGains.longTerm
    );
});

/**
 * @virtual totalDeductions
 * @description Calculates total claimed deductions.
 */
taxProfileSchema.virtual('totalDeductions').get(function () {
    const d = this.deductions;
    return (
        d.section80C +
        d.section80D +
        d.section80G +
        d.homeLoanInterest +
        d.hra +
        d.lta +
        d.standardDeduction +
        d.professionalTax +
        d.nps
    );
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * @method updateIncome
 * @description Updates a specific income source.
 * 
 * @param source - Income source key
 * @param amount - New amount
 */
taxProfileSchema.methods.updateIncome = async function (
    source: keyof IncomeDetails,
    amount: number
): Promise<ITaxProfile> {
    if (source === 'capitalGains') {
        throw new Error('Use updateCapitalGains for capital gains');
    }
    (this.income as Record<string, number>)[source] = amount;
    return this.save();
};

/**
 * @method updateDeduction
 * @description Updates a specific deduction.
 * 
 * @param section - Deduction section key
 * @param amount - New amount
 */
taxProfileSchema.methods.updateDeduction = async function (
    section: keyof DeductionDetails,
    amount: number
): Promise<ITaxProfile> {
    (this.deductions as Record<string, number>)[section] = amount;
    return this.save();
};

/**
 * @method toPublicJSON
 * @description Returns public-safe representation.
 */
taxProfileSchema.methods.toPublicJSON = function () {
    return {
        id: this._id.toString(),
        financialYear: this.financialYear,
        preferredRegime: this.preferredRegime,
        income: this.income,
        deductions: this.deductions,
        grossTotalIncome: this.grossTotalIncome,
        totalDeductions: this.totalDeductions,
        updatedAt: this.updatedAt,
    };
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

/**
 * @constant TaxProfile
 * @description Mongoose model for Tax Profile documents.
 * 
 * @example
 * // Get or create profile for current FY
 * let profile = await TaxProfile.findOne({ userId, financialYear: '2024-25' });
 * if (!profile) {
 *   profile = await TaxProfile.create({
 *     userId,
 *     financialYear: '2024-25',
 *   });
 * }
 * 
 * // Update salary
 * profile.income.salary = 1200000;
 * await profile.save();
 */
const TaxProfile = mongoose.model<ITaxProfile>('TaxProfile', taxProfileSchema);

export default TaxProfile;
export { TaxProfile, taxProfileSchema };

