import { Router } from 'express';
import * as projectController from '@/controllers/projectController';
import { authenticate } from '@/middleware/auth';
import { 
  validateCreateProject, 
  validateUpdateProject, 
  validatePagination,
  validateObjectId 
} from '@/middleware/validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Project CRUD routes
router.get('/', validatePagination, projectController.getProjects);
router.post('/', validateCreateProject, projectController.createProject);
router.get('/:id', validateObjectId(), projectController.getProject);
router.put('/:id', validateUpdateProject, projectController.updateProject);
router.delete('/:id', validateObjectId(), projectController.deleteProject);

// Collaboration routes
router.post('/:id/collaborators', validateObjectId(), projectController.addCollaborator);
router.delete('/:id/collaborators/:userId', validateObjectId(), projectController.removeCollaborator);

export default router;