import { Response } from 'express';
import AnalysisJob from '@/models/AnalysisJob';
import Project from '@/models/Project';
import DataFile from '@/models/DataFile';
import { AuthenticatedRequest, PaginationQuery } from '@/types';
import { logger } from '@/config/logger';

export const createAnalysisJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    const {
      projectId,
      name,
      type,
      priority = 'normal',
      parameters,
      inputFiles,
      resources
    } = req.body;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
        timestamp: new Date()
      });
      return;
    }

    if (!project.isMember(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this project',
        timestamp: new Date()
      });
      return;
    }

    // Validate input files exist
    const fileCount = await DataFile.countDocuments({
      projectId,
      filename: { $in: inputFiles }
    });

    if (fileCount !== inputFiles.length) {
      res.status(400).json({
        success: false,
        message: 'One or more input files not found in the project',
        timestamp: new Date()
      });
      return;
    }

    // Create analysis job
    const job = new AnalysisJob({
      projectId,
      userId: req.user._id,
      name,
      type,
      priority,
      parameters: parameters || {},
      inputFiles,
      resources: {
        cpu: resources.cpu,
        memory: resources.memory,
        storage: resources.storage
      }
    });

    await job.save();

    // Populate references
    await job.populate('projectId', 'name type');
    await job.populate('userId', 'firstName lastName email');

    logger.info(`Analysis job created: ${job.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Analysis job created successfully',
      data: { job },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Create analysis job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create analysis job',
      timestamp: new Date()
    });
  }
};

export const getAnalysisJobs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      projectId,
      status,
      type
    } = req.query as PaginationQuery & {
      projectId?: string;
      status?: string;
      type?: string;
    };

    // Build query - get jobs from projects user has access to
    const userProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);

    const query: any = {
      projectId: { $in: projectIds }
    };

    // Add filters
    if (projectId) {
      query.projectId = projectId;
    }
    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const [jobs, total] = await Promise.all([
      AnalysisJob.find(query)
        .populate('projectId', 'name type')
        .populate('userId', 'firstName lastName email')
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(limit),
      AnalysisJob.countDocuments(query)
    ]);

    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: 'Analysis jobs retrieved successfully',
      data: { jobs },
      pagination: {
        page,
        limit,
        total,
        pages
      },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get analysis jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis jobs',
      timestamp: new Date()
    });
  }
};

export const getAnalysisJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    const { id } = req.params;

    const job = await AnalysisJob.findById(id)
      .populate('projectId', 'name type')
      .populate('userId', 'firstName lastName email');

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Analysis job not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has access to the project
    const project = await Project.findById(job.projectId);
    if (!project || !project.isMember(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date()
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Analysis job retrieved successfully',
      data: { job },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get analysis job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis job',
      timestamp: new Date()
    });
  }
};

export const updateAnalysisJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    const job = await AnalysisJob.findById(id);

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Analysis job not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has access to the project
    const project = await Project.findById(job.projectId);
    if (!project || !project.isMember(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date()
      });
      return;
    }

    // Only allow certain fields to be updated
    const allowedUpdates = ['name', 'priority', 'parameters'];
    const filteredUpdates: any = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const updatedJob = await AnalysisJob.findByIdAndUpdate(
      id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    )
      .populate('projectId', 'name type')
      .populate('userId', 'firstName lastName email');

    logger.info(`Analysis job updated: ${updatedJob?.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Analysis job updated successfully',
      data: { job: updatedJob },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Update analysis job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update analysis job',
      timestamp: new Date()
    });
  }
};

export const cancelAnalysisJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    const { id } = req.params;

    const job = await AnalysisJob.findById(id);

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Analysis job not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has access to the project
    const project = await Project.findById(job.projectId);
    if (!project || !project.isMember(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date()
      });
      return;
    }

    // Check if job can be cancelled
    if (!['pending', 'running'].includes(job.status)) {
      res.status(400).json({
        success: false,
        message: 'Job cannot be cancelled in its current status',
        timestamp: new Date()
      });
      return;
    }

    // Cancel the job
    job.status = 'cancelled';
    job.completedAt = new Date();
    await job.save();

    logger.info(`Analysis job cancelled: ${job.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Analysis job cancelled successfully',
      data: { job },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Cancel analysis job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel analysis job',
      timestamp: new Date()
    });
  }
};

export const deleteAnalysisJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    const { id } = req.params;

    const job = await AnalysisJob.findById(id);

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Analysis job not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has access to the project
    const project = await Project.findById(job.projectId);
    if (!project || !project.isMember(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date()
      });
      return;
    }

    // Check if job can be deleted
    if (job.status === 'running') {
      res.status(400).json({
        success: false,
        message: 'Cannot delete running job. Cancel it first.',
        timestamp: new Date()
      });
      return;
    }

    await AnalysisJob.findByIdAndDelete(id);

    logger.info(`Analysis job deleted: ${job.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Analysis job deleted successfully',
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Delete analysis job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete analysis job',
      timestamp: new Date()
    });
  }
};

export const getJobLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    const { id } = req.params;

    const job = await AnalysisJob.findById(id).select('logs projectId');

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Analysis job not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has access to the project
    const project = await Project.findById(job.projectId);
    if (!project || !project.isMember(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date()
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Job logs retrieved successfully',
      data: { logs: job.logs },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get job logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job logs',
      timestamp: new Date()
    });
  }
};

export const getJobStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    // Get projects user has access to
    const userProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);

    // Get job statistics
    const [statusStats, typeStats, totalJobs] = await Promise.all([
      AnalysisJob.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      AnalysisJob.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      AnalysisJob.countDocuments({ projectId: { $in: projectIds } })
    ]);

    res.status(200).json({
      success: true,
      message: 'Job statistics retrieved successfully',
      data: {
        totalJobs,
        statusBreakdown: statusStats,
        typeBreakdown: typeStats
      },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get job statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job statistics',
      timestamp: new Date()
    });
  }
};