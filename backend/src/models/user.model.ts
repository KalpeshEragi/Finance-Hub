/**
 * @file user.model.ts
 * @description Mongoose model for User documents.
 * 
 * Users are the core entity - all other data (transactions, budgets, etc.)
 * is associated with a user via userId foreign key.
 * 
 * @architecture
 * The User model includes:
 * - Email-based authentication (unique, lowercase normalized)
 * - Password hashing via pre-save hook
 * - Timestamps for audit trail
 * - Instance methods for password comparison
 * 
 * @security
 * - Passwords are hashed before storage (never stored in plaintext)
 * - Password field is excluded from default queries
 * - Email is normalized to lowercase for case-insensitive matching
 */

import mongoose, { Schema, Model } from 'mongoose';
import { hashPassword, comparePassword } from '../utils/password';
import type { IUser } from '../types/auth.types';

// =============================================================================
// INTERFACE EXTENSIONS
// =============================================================================

/**
 * @interface IUserMethods
 * @description Instance methods available on User documents.
 */
interface IUserMethods {
    /**
     * Compares a plaintext password against the stored hash.
     * @param candidatePassword - Password to verify
     * @returns True if password matches
     */
    comparePassword(candidatePassword: string): Promise<boolean>;

    /**
     * Returns public-safe user data (excludes password).
     * @returns User object without sensitive fields
     */
    toPublicJSON(): {
        id: string;
        email: string;
        name: string;
        createdAt: Date;
    };
}

/**
 * @type UserModel
 * @description Combined type for the Mongoose model with methods.
 */
type UserModel = Model<IUser, object, IUserMethods>;

// =============================================================================
// SCHEMA DEFINITION
// =============================================================================

/**
 * @constant userSchema
 * @description Mongoose schema for User documents.
 */
const userSchema = new Schema<IUser, UserModel, IUserMethods>(
    {
        /**
         * User's email address.
         * - Required for authentication
         * - Unique constraint prevents duplicate accounts
         * - Normalized to lowercase for case-insensitive matching
         */
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please provide a valid email address',
            ],
        },

        /**
         * User's display name.
         */
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [1, 'Name cannot be empty'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },

        /**
         * Hashed password.
         * - Hashing is handled by pre-save hook
         * - select: false prevents it from being returned in queries
         */
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Do not return password by default
        },
    },
    {
        /**
         * Schema options
         */
        timestamps: true, // Adds createdAt and updatedAt
        collection: 'users',

        // Transform output when converting to JSON
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                delete ret.password;
                return ret;
            },
        },
    }
);

// =============================================================================
// INDEXES
// =============================================================================

/**
 * @description Email index for fast lookups during authentication.
 * Unique constraint is already set on the field, this ensures optimal query performance.
 */
userSchema.index({ email: 1 });

// =============================================================================
// MIDDLEWARE (HOOKS)
// =============================================================================

/**
 * @middleware pre-save
 * @description Hashes password before saving to database.
 * 
 * Only runs if password field has been modified (not on every save).
 * This prevents re-hashing an already-hashed password.
 */
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Hash the password
        this.password = await hashPassword(this.password);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * @method comparePassword
 * @description Compares a candidate password with the stored hash.
 * 
 * @param candidatePassword - Plaintext password to verify
 * @returns Promise<boolean> - True if password matches
 */
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    // Need to explicitly select password since it's excluded by default
    return comparePassword(candidatePassword, this.password);
};

/**
 * @method toPublicJSON
 * @description Returns a public-safe representation of the user.
 * Excludes password and internal MongoDB fields.
 * 
 * @returns Public user object
 */
userSchema.methods.toPublicJSON = function () {
    return {
        id: this._id.toString(),
        email: this.email,
        name: this.name,
        createdAt: this.createdAt,
    };
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

/**
 * @constant User
 * @description Mongoose model for User documents.
 * 
 * @example
 * // Create a new user
 * const user = await User.create({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   password: 'securePassword123',
 * });
 * 
 * // Find user by email (for login)
 * const user = await User.findOne({ email }).select('+password');
 * const isMatch = await user.comparePassword(candidatePassword);
 */
const User = mongoose.model<IUser, UserModel>('User', userSchema);

export default User;
export { User, userSchema };
