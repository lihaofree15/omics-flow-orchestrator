import mongoose from 'mongoose';
import WorkflowConfig from '../models/WorkflowConfig';
import User from '../models/User';

const workflowTemplates = [
  {
    name: 'RNA-seq Standard Pipeline',
    description: 'Standard RNA-seq analysis pipeline including quality control, alignment, quantification, and differential expression analysis',
    workflowType: 'rna-seq',
    version: '1.0.0',
    isTemplate: true,
    nextflowScript: 'Generated automatically',
    parameters: {
      genome: {
        species: 'Homo sapiens'
      },
      qc: {
        minLength: 20,
        qualityThreshold: 20,
        trimAdapters: true
      },
      rnaSeq: {
        strandedness: 'unstranded',
        featureType: 'exon',
        attributeType: 'gene_id',
        deseq2: {
          pValueCutoff: 0.05,
          logFCCutoff: 1.0
        }
      }
    },
    resources: {
      cpu: 8,
      memory: '32.GB',
      time: '24.h',
      queue: 'normal'
    },
    containers: {
      fastqc: 'biocontainers/fastqc:v0.11.9_cv8',
      star: 'nfcore/star:2.7.10a',
      featurecounts: 'nfcore/subread:2.0.1',
      deseq2: 'bioconductor/bioconductor_docker:RELEASE_3_14'
    }
  },
  {
    name: 'Genome Sequencing Pipeline',
    description: 'Complete genome sequencing analysis pipeline with variant calling and filtering',
    workflowType: 'genome-seq',
    version: '1.0.0',
    isTemplate: true,
    nextflowScript: 'Generated automatically',
    parameters: {
      genome: {
        species: 'Homo sapiens'
      },
      qc: {
        minLength: 30,
        qualityThreshold: 20,
        trimAdapters: true
      },
      genomeSeq: {
        ploidy: 2,
        filterExpression: 'QD < 2.0 || FS > 60.0 || MQ < 40.0 || MQRankSum < -12.5 || ReadPosRankSum < -8.0'
      }
    },
    resources: {
      cpu: 16,
      memory: '64.GB',
      time: '48.h',
      queue: 'high'
    },
    containers: {
      fastqc: 'biocontainers/fastqc:v0.11.9_cv8',
      bwa: 'biocontainers/bwa:v0.7.17_cv1',
      gatk: 'broadinstitute/gatk:4.2.6.1'
    }
  },
  {
    name: 'Single-cell RNA-seq Pipeline',
    description: 'Comprehensive single-cell RNA-seq analysis including Cell Ranger, Seurat clustering, and cell type annotation',
    workflowType: 'single-cell-rna-seq',
    version: '1.0.0',
    isTemplate: true,
    nextflowScript: 'Generated automatically',
    parameters: {
      genome: {
        species: 'Homo sapiens'
      },
      qc: {
        minLength: 20,
        qualityThreshold: 20,
        trimAdapters: false
      },
      scRnaSeq: {
        expectedCells: 3000,
        chemistry: 'auto',
        seurat: {
          minCells: 3,
          minFeatures: 200,
          maxFeatures: 2500,
          mtPercentCutoff: 20,
          resolution: 0.5,
          dims: 10
        },
        singleR: {
          referenceDataset: 'HumanPrimaryCellAtlasData',
          labelColumn: 'label.main'
        }
      }
    },
    resources: {
      cpu: 16,
      memory: '128.GB',
      time: '72.h',
      queue: 'high'
    },
    containers: {
      fastqc: 'biocontainers/fastqc:v0.11.9_cv8',
      cellranger: 'nfcore/cellranger:7.0.0',
      seurat: 'satijalab/seurat:4.3.0',
      singler: 'bioconductor/bioconductor_docker:RELEASE_3_14'
    }
  }
];

async function createWorkflowTemplates() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bioinformatics');
    
    // Find an admin user to assign as template creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    // Clear existing templates
    await WorkflowConfig.deleteMany({ isTemplate: true });
    console.log('Cleared existing workflow templates');

    // Create new templates
    const templates = workflowTemplates.map(template => ({
      ...template,
      userId: adminUser._id,
      projectId: null // Templates are not project-specific
    }));

    const created = await WorkflowConfig.insertMany(templates);
    console.log(`Created ${created.length} workflow templates:`);
    
    created.forEach(template => {
      console.log(`  - ${template.name} (${template.workflowType})`);
    });

    console.log('Workflow templates created successfully!');
  } catch (error) {
    console.error('Error creating workflow templates:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createWorkflowTemplates();
}

export default createWorkflowTemplates;