import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      timestamp: new Date()
    });
    return;
  }
  
  next();
};

// Auth validation rules
export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'researcher', 'analyst', 'viewer'])
    .withMessage('Invalid role'),
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Institution name must be less than 100 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name must be less than 100 characters'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Project validation rules
export const validateCreateProject = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name is required and must be less than 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description is required and must be less than 1000 characters'),
  body('type')
    .isIn(['transcriptome', 'single-cell', 'genomics', 'multi-omics'])
    .withMessage('Invalid project type'),
  body('collaborators')
    .optional()
    .isArray()
    .withMessage('Collaborators must be an array'),
  body('collaborators.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid collaborator ID'),
  body('settings.isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('settings.allowCollaboration')
    .optional()
    .isBoolean()
    .withMessage('allowCollaboration must be a boolean'),
  body('settings.dataRetentionDays')
    .optional()
    .isInt({ min: 30, max: 3650 })
    .withMessage('Data retention must be between 30 and 3650 days'),
  body('metadata.organism')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Organism name must be less than 100 characters'),
  handleValidationErrors
];

export const validateUpdateProject = [
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'paused', 'archived'])
    .withMessage('Invalid project status'),
  handleValidationErrors
];

// Analysis job validation rules
export const validateCreateAnalysisJob = [
  body('projectId')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Job name is required and must be less than 200 characters'),
  body('type')
    .isIn([
      'quality-control',
      'alignment',
      'quantification',
      'differential-expression',
      'pathway-analysis',
      'single-cell-clustering'
    ])
    .withMessage('Invalid job type'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('inputFiles')
    .isArray({ min: 1 })
    .withMessage('At least one input file is required'),
  body('inputFiles.*')
    .notEmpty()
    .withMessage('Input file cannot be empty'),
  body('resources.cpu')
    .isInt({ min: 1 })
    .withMessage('CPU allocation must be at least 1'),
  body('resources.memory')
    .isInt({ min: 512 })
    .withMessage('Memory allocation must be at least 512MB'),
  body('resources.storage')
    .isInt({ min: 100 })
    .withMessage('Storage allocation must be at least 100MB'),
  handleValidationErrors
];

// File upload validation
export const validateFileUpload = [
  body('projectId')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('type')
    .optional()
    .isIn(['fastq', 'fasta', 'bam', 'sam', 'vcf', 'gff', 'csv', 'tsv', 'other'])
    .withMessage('Invalid file type'),
  body('metadata.sampleId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Sample ID must be less than 100 characters'),
  body('metadata.readType')
    .optional()
    .isIn(['single', 'paired'])
    .withMessage('Invalid read type'),
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isString()
    .withMessage('Sort field must be a string'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  handleValidationErrors
];

// MongoDB ObjectId validation
export const validateObjectId = (field: string = 'id') => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field}`),
  handleValidationErrors
];