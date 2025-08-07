import { Request } from 'express';
import { Document } from 'mongoose';

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// User interfaces
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'researcher' | 'analyst' | 'viewer';
  institution?: string;
  department?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Project interfaces
export interface IProject extends Document {
  _id: string;
  name: string;
  description: string;
  type: 'transcriptome' | 'single-cell' | 'genomics' | 'multi-omics';
  status: 'active' | 'completed' | 'paused' | 'archived';
  owner: string;
  collaborators: string[];
  settings: {
    isPublic: boolean;
    allowCollaboration: boolean;
    dataRetentionDays: number;
  };
  metadata: {
    organism?: string;
    tissueType?: string;
    experimentType?: string;
    platform?: string;
  };
  storageUsed: number;
  storageLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

// Analysis Job interfaces
export interface IAnalysisJob extends Document {
  _id: string;
  projectId: string;
  userId: string;
  name: string;
  type: 'quality-control' | 'alignment' | 'quantification' | 'differential-expression' | 'pathway-analysis' | 'single-cell-clustering';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  parameters: Record<string, any>;
  inputFiles: string[];
  outputFiles: string[];
  logs: string[];
  progress: number;
  estimatedDuration?: number;
  actualDuration?: number;
  resources: {
    cpu: number;
    memory: number;
    storage: number;
  };
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// File interfaces
export interface IDataFile extends Document {
  _id: string;
  projectId: string;
  userId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  checksum: string;
  type: 'fastq' | 'fasta' | 'bam' | 'sam' | 'vcf' | 'gff' | 'csv' | 'tsv' | 'other';
  metadata: {
    sampleId?: string;
    readType?: 'single' | 'paired';
    qualityScore?: string;
    sequencingPlatform?: string;
  };
  isProcessed: boolean;
  processingJobs: string[];
  createdAt: Date;
  updatedAt: Date;
}

// System Monitor interfaces
export interface ISystemMetrics extends Document {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  storage: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  activeJobs: number;
  queuedJobs: number;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: Date;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

// Job Queue interfaces
export interface JobData {
  jobId: string;
  projectId: string;
  userId: string;
  type: string;
  parameters: Record<string, any>;
  inputFiles: string[];
  priority: number;
}

export interface JobProgress {
  jobId: string;
  progress: number;
  status: string;
  message?: string;
  logs?: string[];
}