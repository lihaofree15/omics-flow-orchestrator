import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

import connectDB from '@/config/database';
import { logger } from '@/config/logger';
import routes from '@/routes';
import { 
  generalLimiter, 
  corsOptions, 
  helmetConfig, 
  requestLogger, 
  errorHandler, 
  notFound,
  securityHeaders 
} from '@/middleware/security';
import { startMetricsCollection, cleanupOldMetrics } from '@/controllers/systemController';

// Create Express application
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(securityHeaders);

// Rate limiting
app.use(generalLimiter);

// Request logging
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression middleware
app.use(compression());

// API version
const apiVersion = process.env.API_VERSION || 'v1';

// Static files for uploads (serve with authentication in production)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint (before authentication)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use(`/api/${apiVersion}`, routes);
app.use('/api', routes); // Fallback for backward compatibility

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/${apiVersion}`);
      logger.info(`💾 Database: Connected to MongoDB`);
      logger.info(`📁 Uploads: ${process.env.UPLOAD_DIR || './uploads'}`);
      logger.info(`🔒 CORS Origins: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    });

    // Start system monitoring
    if (NODE_ENV === 'production' || process.env.ENABLE_MONITORING === 'true') {
      startMetricsCollection();
      
      // Schedule cleanup of old metrics (run daily)
      setInterval(cleanupOldMetrics, 24 * 60 * 60 * 1000);
      
      logger.info('📊 System monitoring enabled');
    }

    // Graceful shutdown
    const shutdown = () => {
      logger.info('🛑 Shutting down server...');
      server.close((err) => {
        if (err) {
          logger.error('Error during server shutdown:', err);
          process.exit(1);
        }
        logger.info('✅ Server shut down successfully');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

export default app;