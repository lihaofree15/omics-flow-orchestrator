export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  type: 'transcriptome' | 'single-cell' | 'genomics' | 'multi-omics';
  status: 'active' | 'completed' | 'paused' | 'archived';
  owner: User;
  collaborators: User[];
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
  storageUsagePercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface DataFile {
  _id: string;
  projectId: string;
  userId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  sizeFormatted: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisJob {
  _id: string;
  projectId: string;
  userId: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  inputFiles: string[];
  outputFiles: string[];
  parameters: Record<string, any>;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

export interface ProjectStats {
  totalFiles: number;
  totalStorage: number;
  activeJobs: number;
  completedJobs: number;
  recentActivity: {
    type: string;
    name: string;
    timestamp: string;
  }[];
}