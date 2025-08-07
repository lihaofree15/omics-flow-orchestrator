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

// Sample interfaces
export interface ISample extends Document {
  _id: string;
  projectId: string;
  userId: string;
  sampleId: string;
  sampleName: string;
  description?: string;
  organism: string;
  tissue?: string;
  cellType?: string;
  condition?: string;
  treatment?: string;
  timePoint?: string;
  replicate?: string;
  sequencingInfo: {
    platform: 'Illumina' | 'PacBio' | 'Oxford Nanopore' | 'BGI' | 'Other';
    instrument?: string;
    readLength?: number;
    readType: 'single' | 'paired';
    libraryStrategy: 'RNA-Seq' | 'DNA-Seq' | 'ChIP-Seq' | 'ATAC-Seq' | 'scRNA-Seq' | 'Whole Genome' | 'Exome' | 'Amplicon' | 'Other';
    librarySelection?: string;
    libraryLayout: 'SINGLE' | 'PAIRED';
  };
  qualityMetrics?: {
    totalReads?: number;
    qualityScore?: number;
    gcContent?: number;
    duplicationRate?: number;
  };
  clinicalData?: {
    age?: number;
    gender?: 'Male' | 'Female' | 'Unknown';
    diseaseStatus?: string;
    stage?: string;
    grade?: string;
  };
  dataFiles: string[];
  analysisJobs: string[];
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  addDataFile(fileId: string): Promise<ISample>;
  addAnalysisJob(jobId: string): Promise<ISample>;
}

// Workflow Config interfaces
export interface IWorkflowConfig extends Document {
  _id: string;
  projectId: string;
  userId: string;
  name: string;
  description?: string;
  workflowType: 'rna-seq' | 'genome-seq' | 'single-cell-rna-seq';
  version: string;
  nextflowScript: string;
  configFile?: string;
  parameters: {
    genome?: {
      reference?: string;
      annotation?: string;
      species?: string;
    };
    qc?: {
      minLength?: number;
      qualityThreshold?: number;
      trimAdapters?: boolean;
    };
    rnaSeq?: {
      starIndex?: string;
      gtfFile?: string;
      strandedness?: 'unstranded' | 'forward' | 'reverse';
      featureType?: string;
      attributeType?: string;
      deseq2?: {
        designFormula?: string;
        contrastGroup?: string;
        pValueCutoff?: number;
        logFCCutoff?: number;
      };
    };
    genomeSeq?: {
      bwaIndex?: string;
      gatkBundle?: string;
      knownSites?: string[];
      ploidy?: number;
      filterExpression?: string;
    };
    scRnaSeq?: {
      cellRangerRef?: string;
      expectedCells?: number;
      chemistry?: 'auto' | 'threeprime' | 'fiveprime' | 'SC3Pv1' | 'SC3Pv2' | 'SC3Pv3' | 'SC5P-PE' | 'SC5P-R2';
      seurat?: {
        minCells?: number;
        minFeatures?: number;
        maxFeatures?: number;
        mtPercentCutoff?: number;
        resolution?: number;
        dims?: number;
      };
      singleR?: {
        referenceDataset?: 'HumanPrimaryCellAtlasData' | 'BlueprintEncodeData' | 'MouseRNAseqData' | 'ImmGenData';
        labelColumn?: string;
      };
    };
  };
  resources: {
    cpu: number;
    memory: string;
    time: string;
    queue: string;
  };
  containers: {
    fastqc?: string;
    star?: string;
    featurecounts?: string;
    deseq2?: string;
    bwa?: string;
    gatk?: string;
    cellranger?: string;
    seurat?: string;
    singler?: string;
  };
  isTemplate: boolean;
  isActive: boolean;
  executionHistory: Array<{
    jobId: string;
    executedAt: Date;
    status: 'success' | 'failed' | 'cancelled';
    duration?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  addExecutionRecord(jobId: string, status: string, duration?: number): Promise<IWorkflowConfig>;
  clone(newName: string, userId: string): IWorkflowConfig;
}

// Nextflow execution interfaces
export interface NextflowParams {
  workDir: string;
  inputFiles: string[];
  outputDir: string;
  configFile?: string;
  profile?: string;
  resume?: boolean;
  parameters: Record<string, any>;
}

export interface NextflowResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  workDir: string;
  outputFiles: string[];
  duration: number;
  trace?: any;
}