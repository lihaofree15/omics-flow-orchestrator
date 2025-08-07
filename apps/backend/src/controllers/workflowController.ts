import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginationQuery } from '@/types';
import WorkflowConfig from '@/models/WorkflowConfig';
import AnalysisJob from '@/models/AnalysisJob';
import { getValidationErrors } from '@/utils/validation';
import { executeNextflowWorkflow } from '@/services/nextflowService';

// Get workflow configurations
export const getWorkflowConfigs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, workflowType, isTemplate, projectId } = req.query as PaginationQuery & {
      workflowType?: string;
      isTemplate?: string;
      projectId?: string;
    };

    const query: any = { isActive: true };
    
    if (projectId) {
      query.projectId = projectId;
    }

    if (workflowType) {
      query.workflowType = workflowType;
    }

    if (isTemplate !== undefined) {
      query.isTemplate = isTemplate === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { workflowType: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await WorkflowConfig.countDocuments(query);
    const workflows = await WorkflowConfig.find(query)
      .populate('projectId', 'name description')
      .populate('userId', 'firstName lastName email')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const response: ApiResponse = {
      success: true,
      message: 'Workflow configurations retrieved successfully',
      data: workflows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting workflow configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Get single workflow configuration
export const getWorkflowConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const workflow = await WorkflowConfig.findById(id)
      .populate('projectId', 'name description')
      .populate('userId', 'firstName lastName email')
      .populate('executionHistory.jobId', 'name status startedAt completedAt');

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow configuration not found',
        timestamp: new Date()
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Workflow configuration retrieved successfully',
      data: workflow,
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting workflow configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Create workflow configuration
export const createWorkflowConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validationErrors = getValidationErrors(req);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: { errors: validationErrors },
        timestamp: new Date()
      });
    }

    const workflowData = {
      ...req.body,
      userId: req.user!._id
    };

    const workflow = new WorkflowConfig(workflowData);
    await workflow.save();

    const response: ApiResponse = {
      success: true,
      message: 'Workflow configuration created successfully',
      data: workflow,
      timestamp: new Date()
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating workflow configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Update workflow configuration
export const updateWorkflowConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validationErrors = getValidationErrors(req);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: { errors: validationErrors },
        timestamp: new Date()
      });
    }

    const workflow = await WorkflowConfig.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow configuration not found',
        timestamp: new Date()
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Workflow configuration updated successfully',
      data: workflow,
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating workflow configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Delete workflow configuration
export const deleteWorkflowConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const workflow = await WorkflowConfig.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow configuration not found',
        timestamp: new Date()
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Workflow configuration deleted successfully',
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting workflow configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Clone workflow configuration
export const cloneWorkflowConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'New workflow name is required',
        timestamp: new Date()
      });
    }

    const originalWorkflow = await WorkflowConfig.findById(id);
    if (!originalWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Original workflow configuration not found',
        timestamp: new Date()
      });
    }

    const clonedWorkflow = originalWorkflow.clone(name, req.user!._id);
    await clonedWorkflow.save();

    const response: ApiResponse = {
      success: true,
      message: 'Workflow configuration cloned successfully',
      data: clonedWorkflow,
      timestamp: new Date()
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error cloning workflow configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Execute workflow
export const executeWorkflow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { inputFiles, sampleIds, outputDir, resume = false } = req.body;

    if (!inputFiles || !Array.isArray(inputFiles) || inputFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Input files are required',
        timestamp: new Date()
      });
    }

    const workflow = await WorkflowConfig.findById(id);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow configuration not found',
        timestamp: new Date()
      });
    }

    // Create analysis job
    const analysisJob = new AnalysisJob({
      projectId: workflow.projectId,
      userId: req.user!._id,
      name: `${workflow.name} - ${new Date().toISOString()}`,
      type: workflow.workflowType as any,
      status: 'pending',
      priority: req.body.priority || 'normal',
      parameters: {
        workflowId: id,
        sampleIds: sampleIds || [],
        outputDir: outputDir || `/tmp/nextflow-${Date.now()}`,
        resume,
        ...workflow.parameters
      },
      inputFiles,
      resources: {
        cpu: workflow.resources.cpu,
        memory: parseInt(workflow.resources.memory.replace(/[^\d]/g, '')),
        storage: 10000 // Default 10GB storage
      }
    });

    await analysisJob.save();

    // Start workflow execution in background
    executeNextflowWorkflow(workflow, analysisJob, {
      workDir: `/tmp/nextflow-work-${analysisJob._id}`,
      inputFiles,
      outputDir: outputDir || `/tmp/nextflow-output-${analysisJob._id}`,
      configFile: workflow.configFile,
      resume,
      parameters: analysisJob.parameters
    }).catch(error => {
      console.error('Workflow execution failed:', error);
      analysisJob.fail(error.message);
    });

    const response: ApiResponse = {
      success: true,
      message: 'Workflow execution started successfully',
      data: { jobId: analysisJob._id, status: 'pending' },
      timestamp: new Date()
    };

    res.status(202).json(response);
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Get workflow templates
export const getWorkflowTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowType } = req.query;

    const templates = await WorkflowConfig.findTemplates(workflowType as string);

    const response: ApiResponse = {
      success: true,
      message: 'Workflow templates retrieved successfully',
      data: templates,
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting workflow templates:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Get workflow statistics
export const getWorkflowStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.query;
    const matchQuery: any = { isActive: true };
    
    if (projectId) {
      matchQuery.projectId = projectId;
    }

    const stats = await WorkflowConfig.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          workflowTypes: { $addToSet: '$workflowType' },
          templates: { 
            $sum: { $cond: [{ $eq: ['$isTemplate', true] }, 1, 0] }
          },
          active: { 
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);

    const typeCounts = await WorkflowConfig.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$workflowType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const executionStats = await WorkflowConfig.aggregate([
      { $match: matchQuery },
      { $unwind: '$executionHistory' },
      {
        $group: {
          _id: '$executionHistory.status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$executionHistory.duration' }
        }
      }
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Workflow statistics retrieved successfully',
      data: {
        summary: stats[0] || {
          total: 0,
          workflowTypes: [],
          templates: 0,
          active: 0
        },
        typeCounts,
        executionStats
      },
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting workflow statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};