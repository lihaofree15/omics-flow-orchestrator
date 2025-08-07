import { Response } from 'express';
import Project from '@/models/Project';
import DataFile from '@/models/DataFile';
import AnalysisJob from '@/models/AnalysisJob';
import { AuthenticatedRequest, PaginationQuery } from '@/types';
import { logger } from '@/config/logger';

export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    const { name, description, type, collaborators, settings, metadata } = req.body;

    const project = new Project({
      name,
      description,
      type,
      owner: req.user._id,
      collaborators: collaborators || [],
      settings: {
        isPublic: settings?.isPublic || false,
        allowCollaboration: settings?.allowCollaboration !== false,
        dataRetentionDays: settings?.dataRetentionDays || 365
      },
      metadata: metadata || {}
    });

    await project.save();

    // Populate owner and collaborators for response
    await project.populate('owner', 'firstName lastName email');
    await project.populate('collaborators', 'firstName lastName email');

    logger.info(`Project created: ${project.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      timestamp: new Date()
    });
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      search,
      type,
      status
    } = req.query as PaginationQuery & {
      type?: string;
      status?: string;
    };

    // Build query - user can see projects they own or are collaborators on
    const query: any = {
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    };

    // Add filters
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'firstName lastName email')
        .populate('collaborators', 'firstName lastName email')
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(query)
    ]);

    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: { projects },
      pagination: {
        page,
        limit,
        total,
        pages
      },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects',
      timestamp: new Date()
    });
  }
};

export const getProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const project = await Project.findById(id)
      .populate('owner', 'firstName lastName email')
      .populate('collaborators', 'firstName lastName email');

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has access to this project
    if (!project.isMember(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date()
      });
      return;
    }

    // Get project statistics
    const [fileCount, totalSize, jobCount] = await Promise.all([
      DataFile.countDocuments({ projectId: id }),
      DataFile.calculateProjectSize(id),
      AnalysisJob.countDocuments({ projectId: id })
    ]);

    res.status(200).json({
      success: true,
      message: 'Project retrieved successfully',
      data: {
        project,
        statistics: {
          fileCount,
          totalSize,
          jobCount
        }
      },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve project',
      timestamp: new Date()
    });
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const project = await Project.findById(id);

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user is owner (only owner can update)
    if (!project.isOwner(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Only project owner can update the project',
        timestamp: new Date()
      });
      return;
    }

    // Update project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('owner', 'firstName lastName email')
      .populate('collaborators', 'firstName lastName email');

    logger.info(`Project updated: ${updatedProject?.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      timestamp: new Date()
    });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const project = await Project.findById(id);

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user is owner (only owner can delete)
    if (!project.isOwner(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Only project owner can delete the project',
        timestamp: new Date()
      });
      return;
    }

    // Check if project has active analysis jobs
    const activeJobs = await AnalysisJob.countDocuments({
      projectId: id,
      status: { $in: ['pending', 'running'] }
    });

    if (activeJobs > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete project with active analysis jobs',
        timestamp: new Date()
      });
      return;
    }

    // Delete project and related data
    await Promise.all([
      Project.findByIdAndDelete(id),
      DataFile.deleteMany({ projectId: id }),
      AnalysisJob.deleteMany({ projectId: id })
    ]);

    logger.info(`Project deleted: ${project.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      timestamp: new Date()
    });
  }
};

export const addCollaborator = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    const { userId } = req.body;

    const project = await Project.findById(id);

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user is owner
    if (!project.isOwner(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Only project owner can add collaborators',
        timestamp: new Date()
      });
      return;
    }

    // Check if collaboration is allowed
    if (!project.settings.allowCollaboration) {
      res.status(400).json({
        success: false,
        message: 'Collaboration is not allowed for this project',
        timestamp: new Date()
      });
      return;
    }

    // Check if user is already a collaborator
    if (project.collaborators.includes(userId)) {
      res.status(400).json({
        success: false,
        message: 'User is already a collaborator',
        timestamp: new Date()
      });
      return;
    }

    // Add collaborator
    project.collaborators.push(userId);
    await project.save();

    await project.populate('collaborators', 'firstName lastName email');

    logger.info(`Collaborator added to project ${project.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Collaborator added successfully',
      data: { project },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Add collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add collaborator',
      timestamp: new Date()
    });
  }
};

export const removeCollaborator = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    const { id, userId } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user is owner
    if (!project.isOwner(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Only project owner can remove collaborators',
        timestamp: new Date()
      });
      return;
    }

    // Remove collaborator
    project.collaborators = project.collaborators.filter(
      collaborator => collaborator.toString() !== userId
    );
    await project.save();

    await project.populate('collaborators', 'firstName lastName email');

    logger.info(`Collaborator removed from project ${project.name} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Collaborator removed successfully',
      data: { project },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Remove collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove collaborator',
      timestamp: new Date()
    });
  }
};