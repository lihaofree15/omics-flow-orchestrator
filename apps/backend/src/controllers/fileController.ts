import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import DataFile from '@/models/DataFile';
import Project from '@/models/Project';
import { AuthenticatedRequest, PaginationQuery } from '@/types';
import { logger } from '@/config/logger';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const { projectId } = req.body;
    
    if (!projectId) {
      return cb(new Error('Project ID is required'), '');
    }
    
    const projectDir = path.join(uploadDir, projectId);
    
    try {
      await fs.mkdir(projectDir, { recursive: true });
      cb(null, projectDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    const uniqueFilename = `${basename}_${timestamp}_${randomString}${extension}`;
    cb(null, uniqueFilename);
  }
});

// File filter to validate file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'text/plain',
    'application/gzip',
    'application/x-gzip',
    'application/octet-stream',
    'text/csv',
    'application/json',
    'text/tab-separated-values'
  ];
  
  const allowedExtensions = [
    '.fastq', '.fq', '.fastq.gz', '.fq.gz',
    '.fasta', '.fa', '.fasta.gz', '.fa.gz',
    '.bam', '.sam',
    '.vcf', '.vcf.gz',
    '.gff', '.gff3', '.gtf',
    '.csv', '.tsv', '.txt',
    '.json', '.bed'
  ];
  
  const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
  const hasValidExtension = allowedExtensions.some(ext => 
    file.originalname.toLowerCase().endsWith(ext)
  );
  
  if (hasValidMimeType || hasValidExtension) {
    cb(null, true);
  } else {
    cb(new Error(`File type not supported: ${file.originalname}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10737418240'), // 10GB default
    files: 10 // Maximum 10 files per upload
  }
});

// Calculate file checksum
const calculateChecksum = async (filePath: string): Promise<string> => {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

// Determine file type based on extension
const determineFileType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  const baseExt = filename.toLowerCase();
  
  if (baseExt.includes('.fastq') || baseExt.includes('.fq')) return 'fastq';
  if (baseExt.includes('.fasta') || baseExt.includes('.fa')) return 'fasta';
  if (ext === '.bam') return 'bam';
  if (ext === '.sam') return 'sam';
  if (baseExt.includes('.vcf')) return 'vcf';
  if (ext === '.gff' || ext === '.gff3' || ext === '.gtf') return 'gff';
  if (ext === '.csv') return 'csv';
  if (ext === '.tsv') return 'tsv';
  
  return 'other';
};

export const uploadFiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date()
      });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const { projectId, metadata = {} } = req.body;

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files uploaded',
        timestamp: new Date()
      });
      return;
    }

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

    // Process each uploaded file
    const uploadedFiles = [];
    
    for (const file of files) {
      try {
        // Calculate checksum
        const checksum = await calculateChecksum(file.path);
        
        // Check for duplicate files
        const existingFile = await DataFile.findOne({ projectId, checksum });
        if (existingFile) {
          // Remove duplicate file
          await fs.unlink(file.path);
          continue; // Skip this file
        }
        
        // Determine file type
        const fileType = determineFileType(file.originalname);
        
        // Create file record
        const dataFile = new DataFile({
          projectId,
          userId: req.user._id,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          checksum,
          type: fileType,
          metadata: {
            sampleId: metadata.sampleId,
            readType: metadata.readType,
            qualityScore: metadata.qualityScore,
            sequencingPlatform: metadata.sequencingPlatform
          }
        });
        
        await dataFile.save();
        
        // Update project storage usage
        project.storageUsed += file.size;
        await project.save();
        
        uploadedFiles.push(dataFile);
        
      } catch (fileError) {
        logger.error(`Error processing file ${file.originalname}:`, fileError);
        // Remove file if processing failed
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          logger.error(`Error removing failed file ${file.path}:`, unlinkError);
        }
      }
    }

    if (uploadedFiles.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files were successfully uploaded',
        timestamp: new Date()
      });
      return;
    }

    logger.info(`${uploadedFiles.length} files uploaded to project ${project.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      data: { files: uploadedFiles },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      timestamp: new Date()
    });
  }
};

export const getFiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      type,
      search
    } = req.query as PaginationQuery & {
      projectId?: string;
      type?: string;
      search?: string;
    };

    // Build query - get files from projects user has access to
    let query: any = {};

    if (projectId) {
      // Check if user has access to specific project
      const project = await Project.findById(projectId);
      if (!project || !project.isMember(req.user._id)) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this project',
          timestamp: new Date()
        });
        return;
      }
      query.projectId = projectId;
    } else {
      // Get files from all accessible projects
      const userProjects = await Project.find({
        $or: [
          { owner: req.user._id },
          { collaborators: req.user._id }
        ]
      }).select('_id');
      
      const projectIds = userProjects.map(p => p._id);
      query.projectId = { $in: projectIds };
    }

    // Add filters
    if (type) {
      query.type = type;
    }
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { 'metadata.sampleId': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const [files, total] = await Promise.all([
      DataFile.find(query)
        .populate('projectId', 'name type')
        .populate('userId', 'firstName lastName email')
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(limit),
      DataFile.countDocuments(query)
    ]);

    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: 'Files retrieved successfully',
      data: { files },
      pagination: {
        page,
        limit,
        total,
        pages
      },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve files',
      timestamp: new Date()
    });
  }
};

export const getFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const file = await DataFile.findById(id)
      .populate('projectId', 'name type')
      .populate('userId', 'firstName lastName email')
      .populate('processingJobs', 'name status type');

    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has access to the project
    const project = await Project.findById(file.projectId);
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
      message: 'File retrieved successfully',
      data: { file },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve file',
      timestamp: new Date()
    });
  }
};

export const downloadFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const file = await DataFile.findById(id);

    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has access to the project
    const project = await Project.findById(file.projectId);
    if (!project || !project.isMember(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date()
      });
      return;
    }

    // Check if file exists on disk
    try {
      await fs.access(file.path);
    } catch {
      res.status(404).json({
        success: false,
        message: 'File not found on disk',
        timestamp: new Date()
      });
      return;
    }

    // Set download headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Length', file.size.toString());

    // Stream file to response
    const fileStream = require('fs').createReadStream(file.path);
    fileStream.pipe(res);

    logger.info(`File downloaded: ${file.originalName} by ${req.user.email}`);

  } catch (error) {
    logger.error('File download error:', error);
    res.status(500).json({
      success: false,
      message: 'File download failed',
      timestamp: new Date()
    });
  }
};

export const deleteFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const file = await DataFile.findById(id);

    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found',
        timestamp: new Date()
      });
      return;
    }

    // Check if user has access to the project
    const project = await Project.findById(file.projectId);
    if (!project || !project.isMember(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date()
      });
      return;
    }

    // Check if file is being used in active jobs
    if (file.processingJobs.length > 0) {
      const AnalysisJob = require('@/models/AnalysisJob').default;
      const activeJobs = await AnalysisJob.countDocuments({
        _id: { $in: file.processingJobs },
        status: { $in: ['pending', 'running'] }
      });

      if (activeJobs > 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete file that is being used in active jobs',
          timestamp: new Date()
        });
        return;
      }
    }

    // Delete file from disk
    try {
      await fs.unlink(file.path);
    } catch (error) {
      logger.warn(`Could not delete file from disk: ${file.path}`, error);
    }

    // Update project storage usage
    project.storageUsed = Math.max(0, project.storageUsed - file.size);
    await project.save();

    // Delete file record
    await DataFile.findByIdAndDelete(id);

    logger.info(`File deleted: ${file.originalName} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      timestamp: new Date()
    });
  }
};