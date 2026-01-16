/**
 * @file main.ts
 * @description Application entry point - starts the server.
 * 
 * This is the main entry point for the backend application. It:
 * 1. Validates environment configuration
 * 2. Connects to MongoDB
 * 3. Starts the Express HTTP server
 * 
 * @architecture
 * The startup sequence is intentionally ordered:
 * - Environment validation first (fail fast if misconfigured)
 * - Database connection second (required for all operations)
 * - HTTP server last (only after dependencies are ready)
 */

import { env, validateEnv } from './config/env';
import connectToDatabase from './database/mongo';
import app from './app';

// =============================================================================
// SERVER STARTUP
// =============================================================================

/**
 * @function startServer
 * @description Initializes and starts the backend server.
 * 
 * This function orchestrates the startup sequence:
 * 1. Validate environment variables
 * 2. Connect to MongoDB
 * 3. Start the Express server
 * 
 * Any errors during startup will cause the process to exit with code 1.
 * 
 * @async
 * @returns Promise that resolves when server is running
 */
async function startServer(): Promise<void> {
  try {
    console.log('🚀 Starting HackVengers Backend...\n');

    // =========================================================================
    // STEP 1: Validate Environment
    // =========================================================================
    console.log('📋 Step 1/3: Validating environment configuration...');
    validateEnv();
    console.log('');

    // =========================================================================
    // STEP 2: Connect to Database
    // =========================================================================
    console.log('📋 Step 2/3: Connecting to MongoDB...');
    await connectToDatabase();
    console.log('');

    // =========================================================================
    // STEP 3: Start HTTP Server
    // =========================================================================
    console.log('📋 Step 3/3: Starting HTTP server...');

    app.listen(env.PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('  🎉 HackVengers Backend is running!');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`  🌐 URL:         http://localhost:${env.PORT}`);
      console.log(`  📊 Environment: ${env.NODE_ENV}`);
      console.log(`  🏥 Health:      http://localhost:${env.PORT}/health`);
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
    });

  } catch (error) {
    // =========================================================================
    // STARTUP ERROR HANDLING
    // =========================================================================
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('  ❌ FATAL: Failed to start server');
    console.error('═══════════════════════════════════════════════════════════════');

    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
      if (error.stack) {
        console.error('  Stack trace:', error.stack);
      }
    } else {
      console.error('  Unknown error:', error);
    }

    console.error('═══════════════════════════════════════════════════════════════');
    console.error('');

    // Exit with failure code
    process.exit(1);
  }
}

// =============================================================================
// RUN THE SERVER
// =============================================================================

// Call the startup function
startServer();
