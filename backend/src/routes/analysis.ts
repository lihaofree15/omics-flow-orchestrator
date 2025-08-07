import { Router } from 'express';
import * as analysisController from '@/controllers/analysisController';
import { authenticate } from '@/middleware/auth';
import { 
  validateCreateAnalysisJob, 
  validatePagination,
  validateObjectId 
} from '@/middleware/validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Analysis job routes
router.get('/', validatePagination, analysisController.getAnalysisJobs);
router.post('/', validateCreateAnalysisJob, analysisController.createAnalysisJob);
router.get('/statistics', analysisController.getJobStatistics);
router.get('/:id', validateObjectId(), analysisController.getAnalysisJob);
router.put('/:id', validateObjectId(), analysisController.updateAnalysisJob);
router.delete('/:id', validateObjectId(), analysisController.deleteAnalysisJob);

// Job control routes
router.post('/:id/cancel', validateObjectId(), analysisController.cancelAnalysisJob);
router.get('/:id/logs', validateObjectId(), analysisController.getJobLogs);

export default router;