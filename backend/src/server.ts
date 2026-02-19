// IMPORTANT: Import env first to validate environment variables before anything else
import { env } from './config/env';

import app from './app';
import { testConnection } from './config/database';
import { syncDatabase } from './models';
import alertScheduler from './jobs/alertScheduler';

const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await testConnection();

    // Sync database ONLY if explicitly requested with DB_SYNC=true
    // Use: DB_SYNC=true npm run dev (first time or after model changes)
    if (env.DB_SYNC) {
      console.log('🔄 DB_SYNC=true: Synchronizing database tables...');
      await syncDatabase(false);
    }

    // Start server
    app.listen(env.PORT, () => {
      console.log(`
+============================================================+
|                                                            |
|   MOVICAR SYSTEM API                                       |
|                                                            |
|   Server running on port ${String(env.PORT).padEnd(30)}|
|   Environment: ${env.NODE_ENV.padEnd(40)}|
|                                                            |
|   Endpoints:                                               |
|   - API:    http://localhost:${env.PORT}/api/v1              |
|   - Health: http://localhost:${env.PORT}/api/v1/health       |
|                                                            |
+============================================================+
      `);

      // Start alert scheduler for automatic alert generation
      try {
        alertScheduler.start();
        console.log('Alert scheduler started successfully');
      } catch (error) {
        console.error('Failed to start alert scheduler:', error);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  alertScheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  alertScheduler.stop();
  process.exit(0);
});

startServer();
