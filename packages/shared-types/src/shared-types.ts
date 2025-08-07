// Shared types used across frontend and backend

// Base user interface (without MongoDB Document extensions)
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'researcher' | 'analyst' | 'viewer';
  institution?: string;
  department?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Base project interface
export interface Project {
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
  createdAt: string;
  updatedAt: string;
}

// Data file interface
export interface DataFile {
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
    libraryPrep?: string;
    adapter?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Sample interface
export interface Sample {
  _id: string;
  projectId: string;
  sampleId: string;
  name: string;
  group: string;
  condition: string;
  metadata: Record<string, any>;
  files: string[];
  createdAt: string;
  updatedAt: string;
}

// Analysis workflow interfaces
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'quality_control' | 'alignment' | 'quantification' | 'differential_expression' | 'variant_calling';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  parameters: Record<string, any>;
  inputFiles: string[];
  outputFiles: string[];
  duration?: number;
  error?: string;
  startTime?: string;
  endTime?: string;
}

export interface WorkflowRun {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  steps: WorkflowStep[];
  parameters: Record<string, any>;
  inputFiles: string[];
  outputFiles: string[];
  startTime?: string;
  endTime?: string;
  duration?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// System monitoring interfaces
export interface SystemResource {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  timestamp: string;
}

// API response interfaces
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Bioinformatics specific types
export type SequenceType = 'DNA' | 'RNA' | 'protein';
export type FileFormat = 'fastq' | 'fasta' | 'bam' | 'sam' | 'vcf' | 'gff' | 'gtf' | 'bed';
export type AnalysisType = 'rna-seq' | 'dna-seq' | 'chip-seq' | 'variant-calling' | 'single-cell';
export type QualityEncoding = 'phred33' | 'phred64' | 'solexa';

// Workflow parameter types
export interface QualityControlParams {
  trimmomatic: {
    adapter: string;
    seedMismatches: number;
    palindromeClipThreshold: number;
    simpleClipThreshold: number;
    minAdapterLength: number;
    keepBothReads: boolean;
    slidingWindow: {
      size: number;
      quality: number;
    };
    leading: number;
    trailing: number;
    minLength: number;
  };
  fastqc: {
    threads: number;
    memory: string;
  };
}

export interface AlignmentParams {
  aligner: 'star' | 'bwa' | 'hisat2' | 'bowtie2';
  referenceGenome: string;
  threads: number;
  memory: string;
  parameters: Record<string, any>;
}

export interface QuantificationParams {
  method: 'featureCounts' | 'salmon' | 'htseq' | 'rsem';
  annotation: string;
  strandedness: 'unstranded' | 'stranded' | 'reverse-stranded';
  parameters: Record<string, any>;
}