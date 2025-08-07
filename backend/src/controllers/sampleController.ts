import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginationQuery } from '@/types';
import Sample from '@/models/Sample';
import { getValidationErrors } from '@/utils/validation';

// Get samples with pagination and filtering
export const getSamples = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search, organism, libraryStrategy, projectId } = req.query as PaginationQuery & {
      organism?: string;
      libraryStrategy?: string;
      projectId?: string;
    };

    const query: any = { isActive: true };
    
    // Filter by project if provided
    if (projectId) {
      query.projectId = projectId;
    }

    // Filter by organism if provided
    if (organism) {
      query.organism = { $regex: organism, $options: 'i' };
    }

    // Filter by library strategy if provided
    if (libraryStrategy) {
      query['sequencingInfo.libraryStrategy'] = libraryStrategy;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { sampleId: { $regex: search, $options: 'i' } },
        { sampleName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { organism: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Sample.countDocuments(query);
    const samples = await Sample.find(query)
      .populate('dataFiles', 'filename size type')
      .populate('analysisJobs', 'name status type')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const response: ApiResponse = {
      success: true,
      message: 'Samples retrieved successfully',
      data: samples,
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
    console.error('Error getting samples:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Get single sample by ID
export const getSample = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const sample = await Sample.findById(id)
      .populate('dataFiles')
      .populate('analysisJobs')
      .populate('projectId', 'name description')
      .populate('userId', 'firstName lastName email');

    if (!sample) {
      return res.status(404).json({
        success: false,
        message: 'Sample not found',
        timestamp: new Date()
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Sample retrieved successfully',
      data: sample,
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting sample:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Create new sample
export const createSample = async (req: AuthenticatedRequest, res: Response) => {
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

    const sampleData = {
      ...req.body,
      userId: req.user!._id
    };

    const sample = new Sample(sampleData);
    await sample.save();

    const response: ApiResponse = {
      success: true,
      message: 'Sample created successfully',
      data: sample,
      timestamp: new Date()
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error creating sample:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Sample ID already exists',
        timestamp: new Date()
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Update sample
export const updateSample = async (req: AuthenticatedRequest, res: Response) => {
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

    const sample = await Sample.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!sample) {
      return res.status(404).json({
        success: false,
        message: 'Sample not found',
        timestamp: new Date()
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Sample updated successfully',
      data: sample,
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating sample:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Delete sample (soft delete)
export const deleteSample = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const sample = await Sample.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!sample) {
      return res.status(404).json({
        success: false,
        message: 'Sample not found',
        timestamp: new Date()
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Sample deleted successfully',
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting sample:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Bulk import samples
export const bulkImportSamples = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { samples } = req.body;
    
    if (!Array.isArray(samples) || samples.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Samples array is required',
        timestamp: new Date()
      });
    }

    const samplesWithUser = samples.map(sample => ({
      ...sample,
      userId: req.user!._id
    }));

    const results = await Sample.insertMany(samplesWithUser, { ordered: false });

    const response: ApiResponse = {
      success: true,
      message: `Successfully imported ${results.length} samples`,
      data: { imported: results.length, total: samples.length },
      timestamp: new Date()
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error bulk importing samples:', error);
    
    // Handle partial success in bulk insert
    if (error.writeErrors) {
      const successCount = error.result.insertedCount || 0;
      const errorCount = error.writeErrors.length;
      
      return res.status(207).json({
        success: true,
        message: `Partial import completed: ${successCount} successful, ${errorCount} failed`,
        data: { 
          imported: successCount, 
          failed: errorCount,
          errors: error.writeErrors.map((err: any) => ({
            index: err.index,
            message: err.errmsg
          }))
        },
        timestamp: new Date()
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};

// Get sample statistics
export const getSampleStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.query;
    const matchQuery: any = { isActive: true };
    
    if (projectId) {
      matchQuery.projectId = projectId;
    }

    const stats = await Sample.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          organisms: { $addToSet: '$organism' },
          libraryStrategies: { $addToSet: '$sequencingInfo.libraryStrategy' },
          platforms: { $addToSet: '$sequencingInfo.platform' },
          avgReadLength: { $avg: '$sequencingInfo.readLength' },
          totalReads: { $sum: '$qualityMetrics.totalReads' }
        }
      }
    ]);

    const organismCounts = await Sample.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$organism', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const libraryStrategyCounts = await Sample.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$sequencingInfo.libraryStrategy', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Sample statistics retrieved successfully',
      data: {
        summary: stats[0] || {
          total: 0,
          organisms: [],
          libraryStrategies: [],
          platforms: [],
          avgReadLength: 0,
          totalReads: 0
        },
        organismCounts,
        libraryStrategyCounts
      },
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting sample statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
};