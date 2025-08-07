import { Router } from 'express';
import * as systemController from '@/controllers/systemController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// Public health check (no authentication required)
router.get('/health', systemController.getHealthCheck);

// Protected routes
router.use(authenticate);

// System monitoring routes (require admin or analyst role)
router.get('/metrics/current', authorize('admin', 'analyst'), systemController.getCurrentMetrics);
router.get('/metrics/history', authorize('admin', 'analyst'), systemController.getMetricsHistory);
router.get('/metrics/summary', authorize('admin', 'analyst'), systemController.getMetricsSummary);

// System information (admin only)
router.get('/info', authorize('admin'), systemController.getSystemInfo);

export default router;