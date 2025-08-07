import { Router } from 'express';
import * as workflowController from '@/controllers/workflowController';
import { authenticate } from '@/middleware/auth';
import { validateCreateWorkflow, validateUpdateWorkflow, validatePagination, validateObjectId } from '@/middleware/validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Workflow configuration routes
router.get('/', validatePagination, workflowController.getWorkflowConfigs);
router.post('/', validateCreateWorkflow, workflowController.createWorkflowConfig);
router.get('/templates', workflowController.getWorkflowTemplates);
router.get('/statistics', workflowController.getWorkflowStatistics);
router.get('/:id', validateObjectId(), workflowController.getWorkflowConfig);
router.put('/:id', validateObjectId(), validateUpdateWorkflow, workflowController.updateWorkflowConfig);
router.delete('/:id', validateObjectId(), workflowController.deleteWorkflowConfig);
router.post('/:id/clone', validateObjectId(), workflowController.cloneWorkflowConfig);
router.post('/:id/execute', validateObjectId(), workflowController.executeWorkflow);

export default router;