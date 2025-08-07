import { Response } from 'express';
import os from 'os';
import fs from 'fs/promises';
import { execSync } from 'child_process';
import SystemMetrics from '@/models/SystemMetrics';
import AnalysisJob from '@/models/AnalysisJob';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/config/logger';

// Get system metrics
const getSystemMetrics = async () => {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const loadAverage = os.loadavg();

  // Get storage info
  let storageInfo = {
    total: 0,
    used: 0,
    free: 0,
    usage: 0
  };

  try {
    // Try to get disk usage (Linux/Mac)
    const diskUsage = execSync('df -h / | tail -1', { encoding: 'utf8' });
    const diskParts = diskUsage.trim().split(/\s+/);
    if (diskParts.length >= 4) {
      const total = parseFloat(diskParts[1].replace(/[A-Za-z]/g, '')) * 
                   (diskParts[1].includes('G') ? 1024*1024*1024 : 
                    diskParts[1].includes('M') ? 1024*1024 : 1024);
      const used = parseFloat(diskParts[2].replace(/[A-Za-z]/g, '')) * 
                  (diskParts[2].includes('G') ? 1024*1024*1024 : 
                   diskParts[2].includes('M') ? 1024*1024 : 1024);
      const usage = parseFloat(diskParts[4].replace('%', ''));
      
      storageInfo = {
        total,
        used,
        free: total - used,
        usage
      };
    }
  } catch (error) {
    // Fallback for Windows or if df command fails
    logger.warn('Could not get disk usage info:', error);
  }

  // Get CPU usage (simplified calculation)
  const cpuUsage = loadAverage[0] / cpus.length * 100;

  // Get job counts
  const [activeJobs, queuedJobs] = await Promise.all([
    AnalysisJob.countDocuments({ status: 'running' }),
    AnalysisJob.countDocuments({ status: 'pending' })
  ]);

  return {
    timestamp: new Date(),
    cpu: {
      usage: Math.min(100, Math.max(0, cpuUsage)),
      cores: cpus.length,
      loadAverage
    },
    memory: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usage: (usedMemory / totalMemory) * 100
    },
    storage: storageInfo,
    network: {
      bytesIn: 0, // Would need network monitoring library for real data
      bytesOut: 0
    },
    activeJobs,
    queuedJobs
  };
};

export const getCurrentMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has admin or analyst role
    if (!['admin', 'analyst'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        timestamp: new Date()
      });
      return;
    }

    const metrics = await getSystemMetrics();

    res.status(200).json({
      success: true,
      message: 'Current system metrics retrieved successfully',
      data: { metrics },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get current metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve current metrics',
      timestamp: new Date()
    });
  }
};

export const getMetricsHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has admin or analyst role
    if (!['admin', 'analyst'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        timestamp: new Date()
      });
      return;
    }

    const { 
      period = '1h',
      limit = 100 
    } = req.query as {
      period?: string;
      limit?: number;
    };

    // Calculate time range based on period
    const now = new Date();
    let startTime = new Date();
    
    switch (period) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '6h':
        startTime.setHours(now.getHours() - 6);
        break;
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setHours(now.getHours() - 1);
    }

    const metrics = await SystemMetrics.getForTimeRange(startTime, now);
    
    // Limit results if needed
    const limitedMetrics = metrics.slice(-limit);

    res.status(200).json({
      success: true,
      message: 'Metrics history retrieved successfully',
      data: { 
        metrics: limitedMetrics,
        period,
        startTime,
        endTime: now
      },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get metrics history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics history',
      timestamp: new Date()
    });
  }
};

export const getMetricsSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has admin or analyst role
    if (!['admin', 'analyst'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        timestamp: new Date()
      });
      return;
    }

    const { period = '24h' } = req.query as { period?: string };

    // Calculate time range
    const now = new Date();
    let startTime = new Date();
    
    switch (period) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '6h':
        startTime.setHours(now.getHours() - 6);
        break;
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setDate(now.getDate() - 1);
    }

    const summary = await SystemMetrics.getAverageForTimeRange(startTime, now);
    const currentMetrics = await getSystemMetrics();

    res.status(200).json({
      success: true,
      message: 'Metrics summary retrieved successfully',
      data: { 
        summary,
        current: currentMetrics,
        period,
        startTime,
        endTime: now
      },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get metrics summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics summary',
      timestamp: new Date()
    });
  }
};

export const getSystemInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
        timestamp: new Date()
      });
      return;
    }

    const systemInfo = {
      os: {
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime()
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      cpu: {
        model: os.cpus()[0]?.model || 'Unknown',
        cores: os.cpus().length,
        speed: os.cpus()[0]?.speed || 0
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      }
    };

    res.status(200).json({
      success: true,
      message: 'System information retrieved successfully',
      data: { systemInfo },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get system info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system information',
      timestamp: new Date()
    });
  }
};

export const getHealthCheck = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      load: os.loadavg(),
      version: process.version
    };

    // Check database connection
    try {
      await SystemMetrics.findOne().limit(1);
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'unhealthy';
    }

    // Check file system
    try {
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      await fs.access(uploadDir);
      health.filesystem = 'accessible';
    } catch (error) {
      health.filesystem = 'inaccessible';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      message: `System is ${health.status}`,
      data: { health },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      data: { 
        health: {
          status: 'unhealthy',
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      timestamp: new Date()
    });
  }
};

// Background service to collect metrics
export const startMetricsCollection = () => {
  const interval = parseInt(process.env.MONITORING_INTERVAL || '30000'); // 30 seconds default
  
  setInterval(async () => {
    try {
      const metrics = await getSystemMetrics();
      
      const systemMetrics = new SystemMetrics(metrics);
      await systemMetrics.save();
      
      logger.debug('System metrics collected and saved');
    } catch (error) {
      logger.error('Error collecting system metrics:', error);
    }
  }, interval);

  logger.info(`Started system metrics collection (interval: ${interval}ms)`);
};

// Cleanup old metrics
export const cleanupOldMetrics = async () => {
  try {
    const result = await SystemMetrics.cleanup(30); // Keep 30 days
    logger.info(`Cleaned up ${result.deletedCount} old metric records`);
  } catch (error) {
    logger.error('Error cleaning up old metrics:', error);
  }
};