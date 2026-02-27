// IMPORTANT: Import env first to validate environment variables before anything else
import { env } from './config/env';

import { createServer } from 'node:http';
import app from './app';
import { testConnection } from './config/database';
import { syncDatabase } from './models';
import alertScheduler from './jobs/alertScheduler';
import { WebSocketService } from './services/websocketService';
import logger from './config/logger';

const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await testConnection();

    // Sync database ONLY if explicitly requested with DB_SYNC=true
    // Use: DB_SYNC=true npm run dev (first time or after model changes)
    if (env.DB_SYNC) {
      logger.info('DB_SYNC=true: Synchronizing database tables...');
      await syncDatabase(false);
    }

    // Create HTTP server and initialize WebSocket
    const httpServer = createServer(app);
    WebSocketService.initialize(httpServer);

    // Start server
    httpServer.listen(env.PORT, () => {
      logger.info(`MOVICAR API running on port ${env.PORT} [${env.NODE_ENV}] — WebSocket enabled`);

      // Start alert scheduler for automatic alert generation
      try {
        alertScheduler.start();
        logger.info('Alert scheduler started successfully');
      } catch (error) {
        logger.error('Failed to start alert scheduler:', error);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  alertScheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  alertScheduler.stop();
  process.exit(0);
});

startServer();
