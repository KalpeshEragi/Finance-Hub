/**
 * @file mongo.ts
 * @description MongoDB connection manager using Mongoose.
 * 
 * This module handles the database connection lifecycle including:
 * - Initial connection to MongoDB
 * - Connection event handling (connected, disconnected, error)
 * - Graceful shutdown on process termination
 * 
 * @architecture
 * - Uses Mongoose as the ODM (Object Document Mapper)
 * - Implements connection pooling via Mongoose defaults
 * - Handles reconnection automatically through Mongoose
 * - Logs connection status for monitoring
 */

import mongoose from 'mongoose';
import { env } from '../config/env';

// =============================================================================
// CONNECTION OPTIONS
// =============================================================================

/**
 * @constant connectionOptions
 * @description Mongoose connection options for optimal performance and reliability.
 */
const connectionOptions: mongoose.ConnectOptions = {
    // Connection pool settings
    maxPoolSize: 10,      // Maximum number of connections in the pool
    minPoolSize: 2,       // Minimum number of connections to maintain

    // Timeout settings
    serverSelectionTimeoutMS: 5000,  // Timeout for server selection
    socketTimeoutMS: 45000,          // Socket timeout

    // Keep alive settings for long-running connections
    // Note: heartbeatFrequencyMS is handled by the driver automatically
};

// =============================================================================
// CONNECTION FUNCTION
// =============================================================================

/**
 * @function connectToDatabase
 * @description Establishes connection to MongoDB using Mongoose.
 * 
 * This function should be called once during application startup.
 * Mongoose handles connection pooling and reconnection internally.
 * 
 * @returns Promise that resolves when connected successfully
 * @throws Error if connection fails after retries
 * 
 * @example
 * await connectToDatabase();
 * console.log('Database connected!');
 */
export async function connectToDatabase(): Promise<void> {
    try {
        console.log('🔄 Connecting to MongoDB...');

        await mongoose.connect(env.MONGODB_URI, connectionOptions);

        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);

        // In production, you might want to exit or retry
        // For hackathon, we'll throw and let the caller handle it
        throw error;
    }
}

// =============================================================================
// CONNECTION EVENT HANDLERS
// =============================================================================

/**
 * @description Event handler for successful connection.
 * Logs connection details for monitoring.
 */
mongoose.connection.on('connected', () => {
    console.log('📊 Mongoose connected to MongoDB');
});

/**
 * @description Event handler for connection errors.
 * Logs error details but doesn't crash - Mongoose will attempt to reconnect.
 */
mongoose.connection.on('error', (err: Error) => {
    console.error('❌ Mongoose connection error:', err.message);
});

/**
 * @description Event handler for disconnection.
 * This can happen due to network issues - Mongoose handles reconnection.
 */
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  Mongoose disconnected from MongoDB');
});

/**
 * @description Event handler for reconnection.
 * Logs when connection is re-established after disconnection.
 */
mongoose.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconnected to MongoDB');
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

/**
 * @function gracefulShutdown
 * @description Closes MongoDB connection gracefully.
 * Called when the application is shutting down.
 * 
 * @param signal - The signal that triggered shutdown (e.g., 'SIGINT', 'SIGTERM')
 */
async function gracefulShutdown(signal: string): Promise<void> {
    console.log(`\n${signal} received. Closing MongoDB connection...`);

    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed gracefully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during MongoDB shutdown:', error);
        process.exit(1);
    }
}

// Handle process termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Kill command

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * @description Export the Mongoose connection for direct access if needed.
 * Prefer using models instead of direct connection access.
 */
export const connection = mongoose.connection;

export default connectToDatabase;
