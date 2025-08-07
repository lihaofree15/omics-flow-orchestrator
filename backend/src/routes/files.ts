import { Router } from 'express';
import * as fileController from '@/controllers/fileController';
import { authenticate } from '@/middleware/auth';
import { validateFileUpload, validatePagination, validateObjectId } from '@/middleware/validation';
import { uploadLimiter } from '@/middleware/security';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// File management routes
router.get('/', validatePagination, fileController.getFiles);
router.post('/upload', 
  uploadLimiter, 
  fileController.upload.array('files', 10), 
  validateFileUpload, 
  fileController.uploadFiles
);
router.get('/:id', validateObjectId(), fileController.getFile);
router.get('/:id/download', validateObjectId(), fileController.downloadFile);
router.delete('/:id', validateObjectId(), fileController.deleteFile);

export default router;