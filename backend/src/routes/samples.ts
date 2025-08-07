import { Router } from 'express';
import * as sampleController from '@/controllers/sampleController';
import { authenticate } from '@/middleware/auth';
import { validateCreateSample, validateUpdateSample, validatePagination, validateObjectId } from '@/middleware/validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Sample management routes
router.get('/', validatePagination, sampleController.getSamples);
router.post('/', validateCreateSample, sampleController.createSample);
router.post('/bulk-import', sampleController.bulkImportSamples);
router.get('/statistics', sampleController.getSampleStatistics);
router.get('/:id', validateObjectId(), sampleController.getSample);
router.put('/:id', validateObjectId(), validateUpdateSample, sampleController.updateSample);
router.delete('/:id', validateObjectId(), sampleController.deleteSample);

export default router;