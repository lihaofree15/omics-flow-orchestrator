# Nextflow Genomics Analysis Workflows

This document describes the comprehensive Nextflow-based genomics analysis workflows implemented in the bioinformatics platform.

## Overview

The platform now supports three major types of genomics analysis workflows:

1. **RNA-seq Analysis** - Transcriptome sequencing data processing
2. **Genome Sequencing** - Whole genome sequencing variant calling
3. **Single-cell RNA-seq** - Single-cell transcriptome analysis

## Features Implemented

### 1. Sample Information Management

#### Backend Components
- **Sample Model** (`backend/src/models/Sample.ts`)
  - Comprehensive sample metadata storage
  - Support for sequencing information, quality metrics, and clinical data
  - Relationships with data files and analysis jobs

- **Sample Controller** (`backend/src/controllers/sampleController.ts`)
  - CRUD operations for sample management
  - Bulk import functionality for CSV uploads
  - Statistical aggregation and reporting

- **Sample Routes** (`backend/src/routes/samples.ts`)
  - RESTful API endpoints for sample operations
  - Authentication and validation middleware

#### Frontend Components
- **SampleUpload Component** (`src/components/SampleUpload.tsx`)
  - Interactive form for single sample upload
  - CSV bulk upload with preview functionality
  - Comprehensive validation using Zod schemas

### 2. Workflow Configuration System

#### Backend Components
- **WorkflowConfig Model** (`backend/src/models/WorkflowConfig.ts`)
  - Template-based workflow definitions
  - Parameterizable configurations for different workflow types
  - Execution history tracking
  - Docker container specifications

- **Workflow Controller** (`backend/src/controllers/workflowController.ts`)
  - Workflow template management
  - Configuration CRUD operations
  - Workflow execution orchestration

- **Nextflow Service** (`backend/src/services/nextflowService.ts`)
  - Dynamic Nextflow script generation
  - Workflow execution management
  - Real-time job monitoring and progress tracking

#### Frontend Components
- **WorkflowManager Component** (`src/components/WorkflowManager.tsx`)
  - Template browsing and selection
  - Workflow execution interface
  - Real-time job monitoring with progress bars
  - Log viewing capabilities

### 3. Nextflow Workflow Implementations

#### RNA-seq Analysis Pipeline
**Steps:**
1. **Quality Control** (FastQC)
   - Raw sequencing data quality assessment
   - Generate quality reports and statistics

2. **Genome Indexing** (STAR)
   - Build genome indices for alignment
   - Support for custom reference genomes

3. **Sequence Alignment** (STAR)
   - Map reads to reference genome
   - Handle both single-end and paired-end data
   - Strand-specific alignment options

4. **Gene Expression Quantification** (featureCounts)
   - Count reads mapping to genomic features
   - Support for different feature types and attributes

5. **Differential Expression Analysis** (DESeq2)
   - Statistical analysis of gene expression differences
   - Generate MA plots and count plots
   - Export results in CSV format

**Container Images:**
- `biocontainers/fastqc:v0.11.9_cv8`
- `nfcore/star:2.7.10a`
- `nfcore/subread:2.0.1`
- `bioconductor/bioconductor_docker:RELEASE_3_14`

#### Genome Sequencing Pipeline
**Steps:**
1. **Quality Control** (FastQC)
   - Assess raw sequencing data quality

2. **Genome Alignment** (BWA-MEM)
   - Map reads to reference genome
   - Sort and index BAM files

3. **Duplicate Marking** (GATK MarkDuplicates)
   - Identify and mark PCR duplicates
   - Generate duplicate metrics

4. **Base Quality Score Recalibration** (GATK BQSR)
   - Recalibrate base quality scores
   - Use known variant sites for recalibration

5. **Variant Calling** (GATK HaplotypeCaller)
   - Call SNPs and indels
   - Support for different ploidy levels

6. **Variant Filtering** (GATK VariantFiltration)
   - Apply quality filters to variants
   - Customizable filtering expressions

**Container Images:**
- `biocontainers/fastqc:v0.11.9_cv8`
- `biocontainers/bwa:v0.7.17_cv1`
- `broadinstitute/gatk:4.2.6.1`

#### Single-cell RNA-seq Pipeline
**Steps:**
1. **Quality Control** (FastQC)
   - Assess raw sequencing data quality

2. **Cell Ranger Processing** (Cell Ranger)
   - Demultiplex and map reads
   - Generate gene-cell expression matrices
   - Cell barcode identification

3. **Seurat Analysis**
   - Data filtering and quality control
   - Normalization and scaling
   - Principal component analysis (PCA)
   - Cell clustering and UMAP visualization
   - Marker gene identification

4. **Cell Type Annotation** (SingleR)
   - Automatic cell type annotation
   - Reference dataset comparison
   - Generate annotation plots

**Container Images:**
- `biocontainers/fastqc:v0.11.9_cv8`
- `nfcore/cellranger:7.0.0`
- `satijalab/seurat:4.3.0`
- `bioconductor/bioconductor_docker:RELEASE_3_14`

## API Endpoints

### Sample Management
```
GET    /api/samples                    # List samples with filtering
POST   /api/samples                    # Create new sample
GET    /api/samples/statistics         # Get sample statistics
POST   /api/samples/bulk-import        # Bulk import samples from CSV
GET    /api/samples/:id                # Get specific sample
PUT    /api/samples/:id                # Update sample
DELETE /api/samples/:id                # Delete sample (soft delete)
```

### Workflow Management
```
GET    /api/workflows                  # List workflow configurations
POST   /api/workflows                  # Create workflow configuration
GET    /api/workflows/templates        # Get workflow templates
GET    /api/workflows/statistics       # Get workflow statistics
GET    /api/workflows/:id              # Get specific workflow
PUT    /api/workflows/:id              # Update workflow
DELETE /api/workflows/:id              # Delete workflow
POST   /api/workflows/:id/clone        # Clone workflow configuration
POST   /api/workflows/:id/execute      # Execute workflow
```

## Database Schema

### Sample Collection
```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  userId: ObjectId,
  sampleId: String (unique),
  sampleName: String,
  description: String,
  organism: String,
  tissue: String,
  cellType: String,
  condition: String,
  treatment: String,
  timePoint: String,
  replicate: String,
  sequencingInfo: {
    platform: String,
    instrument: String,
    readLength: Number,
    readType: String,
    libraryStrategy: String,
    librarySelection: String,
    libraryLayout: String
  },
  qualityMetrics: {
    totalReads: Number,
    qualityScore: Number,
    gcContent: Number,
    duplicationRate: Number
  },
  clinicalData: {
    age: Number,
    gender: String,
    diseaseStatus: String,
    stage: String,
    grade: String
  },
  dataFiles: [ObjectId],
  analysisJobs: [ObjectId],
  metadata: Object,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### WorkflowConfig Collection
```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  userId: ObjectId,
  name: String,
  description: String,
  workflowType: String,
  version: String,
  nextflowScript: String,
  configFile: String,
  parameters: {
    genome: Object,
    qc: Object,
    rnaSeq: Object,
    genomeSeq: Object,
    scRnaSeq: Object
  },
  resources: {
    cpu: Number,
    memory: String,
    time: String,
    queue: String
  },
  containers: Object,
  isTemplate: Boolean,
  isActive: Boolean,
  executionHistory: Array,
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Examples

### 1. Creating a Sample
```javascript
const sampleData = {
  sampleId: "SAMPLE_001",
  sampleName: "Control Sample 1",
  organism: "Homo sapiens",
  tissue: "Brain",
  condition: "Control",
  sequencingInfo: {
    platform: "Illumina",
    readType: "paired",
    libraryStrategy: "RNA-Seq",
    libraryLayout: "PAIRED"
  }
};

const response = await fetch('/api/samples', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(sampleData)
});
```

### 2. Executing a Workflow
```javascript
const executionData = {
  workflowId: "workflow_template_id",
  inputFiles: ["file1_id", "file2_id"],
  sampleIds: ["sample1_id", "sample2_id"],
  priority: "normal",
  outputDir: "/path/to/output"
};

const response = await fetch(`/api/workflows/${workflowId}/execute`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(executionData)
});
```

### 3. Bulk Sample Import (CSV)
CSV format example:
```csv
sampleId,sampleName,organism,tissue,sequencing.platform,sequencing.readType,sequencing.libraryStrategy
SAMPLE_001,Control 1,Homo sapiens,Brain,Illumina,paired,RNA-Seq
SAMPLE_002,Treatment 1,Homo sapiens,Brain,Illumina,paired,RNA-Seq
```

## Setup and Installation

### Prerequisites
- Node.js >= 16
- MongoDB >= 4.4
- Docker (for workflow execution)
- Nextflow >= 21.04

### Installation Steps

1. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Backend .env
   MONGODB_URI=mongodb://localhost:27017/bioinformatics
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

3. **Initialize Workflow Templates**
   ```bash
   cd backend
   npx ts-node src/scripts/createWorkflowTemplates.ts
   ```

4. **Start Services**
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend
   cd ../
   npm run dev
   ```

## Docker Requirements

The workflows require the following Docker images to be available:

```bash
# Pull required images
docker pull biocontainers/fastqc:v0.11.9_cv8
docker pull nfcore/star:2.7.10a
docker pull nfcore/subread:2.0.1
docker pull bioconductor/bioconductor_docker:RELEASE_3_14
docker pull biocontainers/bwa:v0.7.17_cv1
docker pull broadinstitute/gatk:4.2.6.1
docker pull nfcore/cellranger:7.0.0
docker pull satijalab/seurat:4.3.0
```

## Reference Data Requirements

### RNA-seq
- STAR genome index
- GTF annotation file

### Genome Sequencing
- BWA genome index
- GATK resource bundle
- Known variant sites (dbSNP, 1000G, etc.)

### Single-cell RNA-seq
- Cell Ranger reference transcriptome
- SingleR reference datasets

## Monitoring and Logging

- Real-time job progress tracking
- Comprehensive logging system
- Nextflow execution reports and timelines
- Resource usage monitoring

## Troubleshooting

### Common Issues

1. **Docker Permission Errors**
   - Ensure Docker daemon is running
   - Check user permissions for Docker

2. **Memory Issues**
   - Adjust workflow resource allocations
   - Monitor system memory usage

3. **File Path Issues**
   - Ensure input files are accessible
   - Check output directory permissions

### Support

For issues and support, check:
- Nextflow documentation: https://nextflow.io/docs/
- Container logs for specific tool errors
- System resource monitoring

## Contributing

When adding new workflows:

1. Create workflow script generator in `NextflowService`
2. Add workflow type to database schema
3. Create corresponding template in `createWorkflowTemplates.ts`
4. Update frontend workflow type definitions
5. Add appropriate container specifications

## License

This implementation is part of the bioinformatics platform and follows the same licensing terms.