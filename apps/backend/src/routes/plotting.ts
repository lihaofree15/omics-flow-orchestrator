import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { 
  generatePlotPreview,
  generatePlot,
  getPlotConfigurations,
  validatePlotParameters,
  downloadPlot,
  batchGeneratePlots,
  getPlotTemplates,
  savePlotTemplate,
  deletePlotTemplate
} from '@/controllers/plottingController';
import { validateRequest } from '@/middleware/validation';
import { plotParametersSchema, plotTemplateSchema, batchPlotSchema } from '@/validation/plotting';

const router = Router();

// Apply authentication to all plotting routes
router.use(authenticateToken);

/**
 * @route GET /api/v1/plotting/configurations
 * @description Get available plot configurations and parameter definitions
 * @access Private
 */
router.get('/configurations', getPlotConfigurations);

/**
 * @route GET /api/v1/plotting/configurations/:plotType
 * @description Get configuration for a specific plot type
 * @access Private
 */
router.get('/configurations/:plotType', getPlotConfigurations);

/**
 * @route POST /api/v1/plotting/validate
 * @description Validate plot parameters
 * @access Private
 */
router.post('/validate', validateRequest(plotParametersSchema), validatePlotParameters);

/**
 * @route POST /api/v1/plotting/preview
 * @description Generate a lightweight preview of the plot
 * @access Private
 */
router.post('/preview', validateRequest(plotParametersSchema), generatePlotPreview);

/**
 * @route POST /api/v1/plotting/generate
 * @description Generate a high-quality plot with the given parameters
 * @access Private
 */
router.post('/generate', validateRequest(plotParametersSchema), generatePlot);

/**
 * @route POST /api/v1/plotting/batch
 * @description Generate multiple plots with parameter variations
 * @access Private
 */
router.post('/batch', validateRequest(batchPlotSchema), batchGeneratePlots);

/**
 * @route GET /api/v1/plotting/download/:taskId/:format
 * @description Download a generated plot in the specified format
 * @access Private
 */
router.get('/download/:taskId/:format', downloadPlot);

/**
 * @route GET /api/v1/plotting/templates
 * @description Get user's plot parameter templates
 * @access Private
 */
router.get('/templates', getPlotTemplates);

/**
 * @route POST /api/v1/plotting/templates
 * @description Save a new plot parameter template
 * @access Private
 */
router.post('/templates', validateRequest(plotTemplateSchema), savePlotTemplate);

/**
 * @route PUT /api/v1/plotting/templates/:templateId
 * @description Update an existing plot parameter template
 * @access Private
 */
router.put('/templates/:templateId', validateRequest(plotTemplateSchema), savePlotTemplate);

/**
 * @route DELETE /api/v1/plotting/templates/:templateId
 * @description Delete a plot parameter template
 * @access Private
 */
router.delete('/templates/:templateId', deletePlotTemplate);

/**
 * @route GET /api/v1/plotting/tasks/:taskId
 * @description Get plotting task status and results
 * @access Private
 */
router.get('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await getPlottingTaskStatus(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Plotting task not found'
      });
    }

    res.json({
      success: true,
      data: task,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route DELETE /api/v1/plotting/tasks/:taskId
 * @description Cancel or delete a plotting task
 * @access Private
 */
router.delete('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const success = await cancelPlottingTask(taskId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Plotting task not found or cannot be cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Plotting task cancelled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions (these would be implemented in the controller)
async function getPlottingTaskStatus(taskId: string) {
  // Implementation would fetch task from database
  return null;
}

async function cancelPlottingTask(taskId: string) {
  // Implementation would cancel task and cleanup resources
  return false;
}

export default router;