import mongoose, { Schema } from 'mongoose';
import { IWorkflowConfig } from '@/types';

const WorkflowConfigSchema = new Schema<IWorkflowConfig>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
      maxlength: [200, 'Workflow name cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true
    },
    workflowType: {
      type: String,
      enum: ['rna-seq', 'genome-seq', 'single-cell-rna-seq'],
      required: [true, 'Workflow type is required']
    },
    version: {
      type: String,
      default: '1.0.0',
      trim: true
    },
    nextflowScript: {
      type: String,
      required: [true, 'Nextflow script is required']
    },
    configFile: {
      type: String
    },
    parameters: {
      // Common parameters
      genome: {
        reference: {
          type: String,
          trim: true
        },
        annotation: {
          type: String,
          trim: true
        },
        species: {
          type: String,
          trim: true
        }
      },
      
      // Quality control parameters
      qc: {
        minLength: {
          type: Number,
          default: 20
        },
        qualityThreshold: {
          type: Number,
          default: 20
        },
        trimAdapters: {
          type: Boolean,
          default: true
        }
      },
      
      // RNA-seq specific parameters
      rnaSeq: {
        starIndex: {
          type: String,
          trim: true
        },
        gtfFile: {
          type: String,
          trim: true
        },
        strandedness: {
          type: String,
          enum: ['unstranded', 'forward', 'reverse'],
          default: 'unstranded'
        },
        featureType: {
          type: String,
          default: 'exon'
        },
        attributeType: {
          type: String,
          default: 'gene_id'
        },
        deseq2: {
          designFormula: {
            type: String,
            trim: true
          },
          contrastGroup: {
            type: String,
            trim: true
          },
          pValueCutoff: {
            type: Number,
            default: 0.05
          },
          logFCCutoff: {
            type: Number,
            default: 1.0
          }
        }
      },
      
      // Genome sequencing parameters
      genomeSeq: {
        bwaIndex: {
          type: String,
          trim: true
        },
        gatkBundle: {
          type: String,
          trim: true
        },
        knownSites: [{
          type: String,
          trim: true
        }],
        ploidy: {
          type: Number,
          default: 2
        },
        filterExpression: {
          type: String,
          trim: true
        }
      },
      
      // Single-cell RNA-seq parameters
      scRnaSeq: {
        cellRangerRef: {
          type: String,
          trim: true
        },
        expectedCells: {
          type: Number,
          default: 3000
        },
        chemistry: {
          type: String,
          enum: ['auto', 'threeprime', 'fiveprime', 'SC3Pv1', 'SC3Pv2', 'SC3Pv3', 'SC5P-PE', 'SC5P-R2'],
          default: 'auto'
        },
        seurat: {
          minCells: {
            type: Number,
            default: 3
          },
          minFeatures: {
            type: Number,
            default: 200
          },
          maxFeatures: {
            type: Number,
            default: 2500
          },
          mtPercentCutoff: {
            type: Number,
            default: 20
          },
          resolution: {
            type: Number,
            default: 0.5
          },
          dims: {
            type: Number,
            default: 10
          }
        },
        singleR: {
          referenceDataset: {
            type: String,
            enum: ['HumanPrimaryCellAtlasData', 'BlueprintEncodeData', 'MouseRNAseqData', 'ImmGenData'],
            default: 'HumanPrimaryCellAtlasData'
          },
          labelColumn: {
            type: String,
            default: 'label.main'
          }
        }
      }
    },
    
    resources: {
      cpu: {
        type: Number,
        default: 4,
        min: [1, 'CPU allocation must be at least 1']
      },
      memory: {
        type: String,
        default: '8.GB'
      },
      time: {
        type: String,
        default: '24.h'
      },
      queue: {
        type: String,
        default: 'normal'
      }
    },
    
    containers: {
      fastqc: {
        type: String,
        default: 'biocontainers/fastqc:v0.11.9_cv8'
      },
      star: {
        type: String,
        default: 'nfcore/star:2.7.10a'
      },
      featurecounts: {
        type: String,
        default: 'nfcore/subread:2.0.1'
      },
      deseq2: {
        type: String,
        default: 'bioconductor/bioconductor_docker:RELEASE_3_14'
      },
      bwa: {
        type: String,
        default: 'biocontainers/bwa:v0.7.17_cv1'
      },
      gatk: {
        type: String,
        default: 'broadinstitute/gatk:4.2.6.1'
      },
      cellranger: {
        type: String,
        default: 'nfcore/cellranger:7.0.0'
      },
      seurat: {
        type: String,
        default: 'satijalab/seurat:4.3.0'
      },
      singler: {
        type: String,
        default: 'bioconductor/bioconductor_docker:RELEASE_3_14'
      }
    },
    
    isTemplate: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    
    executionHistory: [{
      jobId: {
        type: Schema.Types.ObjectId,
        ref: 'AnalysisJob'
      },
      executedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['success', 'failed', 'cancelled']
      },
      duration: {
        type: Number
      }
    }]
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for performance
WorkflowConfigSchema.index({ projectId: 1 });
WorkflowConfigSchema.index({ userId: 1 });
WorkflowConfigSchema.index({ workflowType: 1 });
WorkflowConfigSchema.index({ isTemplate: 1 });
WorkflowConfigSchema.index({ isActive: 1 });
WorkflowConfigSchema.index({ createdAt: -1 });

// Compound indexes
WorkflowConfigSchema.index({ projectId: 1, workflowType: 1 });
WorkflowConfigSchema.index({ userId: 1, workflowType: 1 });

// Virtual for workflow identifier
WorkflowConfigSchema.virtual('identifier').get(function() {
  return `${this.workflowType}_${this.version}_${this.name}`;
});

// Method to create execution record
WorkflowConfigSchema.methods.addExecutionRecord = function(jobId: string, status: string, duration?: number) {
  this.executionHistory.push({
    jobId,
    status,
    duration,
    executedAt: new Date()
  });
  return this.save();
};

// Method to clone workflow config
WorkflowConfigSchema.methods.clone = function(newName: string, userId: string) {
  const cloned = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    name: newName,
    userId,
    isTemplate: false,
    executionHistory: [],
    createdAt: undefined,
    updatedAt: undefined
  });
  return cloned;
};

// Static method to find templates
WorkflowConfigSchema.statics.findTemplates = function(workflowType?: string) {
  const query: any = { isTemplate: true, isActive: true };
  if (workflowType) {
    query.workflowType = workflowType;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find by workflow type
WorkflowConfigSchema.statics.findByType = function(workflowType: string, projectId?: string) {
  const query: any = { workflowType, isActive: true };
  if (projectId) {
    query.projectId = projectId;
  }
  return this.find(query).sort({ createdAt: -1 });
};

export default mongoose.model<IWorkflowConfig>('WorkflowConfig', WorkflowConfigSchema);