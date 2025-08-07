import mongoose, { Schema } from 'mongoose';
import { ISample } from '@/types';

const SampleSchema = new Schema<ISample>(
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
    sampleId: {
      type: String,
      required: [true, 'Sample ID is required'],
      trim: true,
      unique: true
    },
    sampleName: {
      type: String,
      required: [true, 'Sample name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    organism: {
      type: String,
      required: [true, 'Organism is required'],
      trim: true
    },
    tissue: {
      type: String,
      trim: true
    },
    cellType: {
      type: String,
      trim: true
    },
    condition: {
      type: String,
      trim: true
    },
    treatment: {
      type: String,
      trim: true
    },
    timePoint: {
      type: String,
      trim: true
    },
    replicate: {
      type: String,
      trim: true
    },
    sequencingInfo: {
      platform: {
        type: String,
        enum: ['Illumina', 'PacBio', 'Oxford Nanopore', 'BGI', 'Other'],
        required: true
      },
      instrument: {
        type: String,
        trim: true
      },
      readLength: {
        type: Number,
        min: [1, 'Read length must be positive']
      },
      readType: {
        type: String,
        enum: ['single', 'paired'],
        required: true
      },
      libraryStrategy: {
        type: String,
        enum: ['RNA-Seq', 'DNA-Seq', 'ChIP-Seq', 'ATAC-Seq', 'scRNA-Seq', 'Whole Genome', 'Exome', 'Amplicon', 'Other'],
        required: true
      },
      librarySelection: {
        type: String,
        trim: true
      },
      libraryLayout: {
        type: String,
        enum: ['SINGLE', 'PAIRED'],
        required: true
      }
    },
    qualityMetrics: {
      totalReads: {
        type: Number,
        min: [0, 'Total reads cannot be negative']
      },
      qualityScore: {
        type: Number,
        min: [0, 'Quality score cannot be negative'],
        max: [50, 'Quality score cannot exceed 50']
      },
      gcContent: {
        type: Number,
        min: [0, 'GC content cannot be negative'],
        max: [100, 'GC content cannot exceed 100%']
      },
      duplicationRate: {
        type: Number,
        min: [0, 'Duplication rate cannot be negative'],
        max: [100, 'Duplication rate cannot exceed 100%']
      }
    },
    clinicalData: {
      age: {
        type: Number,
        min: [0, 'Age cannot be negative']
      },
      gender: {
        type: String,
        enum: ['Male', 'Female', 'Unknown']
      },
      diseaseStatus: {
        type: String,
        trim: true
      },
      stage: {
        type: String,
        trim: true
      },
      grade: {
        type: String,
        trim: true
      }
    },
    dataFiles: [{
      type: Schema.Types.ObjectId,
      ref: 'DataFile'
    }],
    analysisJobs: [{
      type: Schema.Types.ObjectId,
      ref: 'AnalysisJob'
    }],
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true
    }
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
SampleSchema.index({ projectId: 1 });
SampleSchema.index({ userId: 1 });
SampleSchema.index({ sampleId: 1 }, { unique: true });
SampleSchema.index({ organism: 1 });
SampleSchema.index({ 'sequencingInfo.libraryStrategy': 1 });
SampleSchema.index({ createdAt: -1 });

// Compound indexes
SampleSchema.index({ projectId: 1, sampleId: 1 });
SampleSchema.index({ projectId: 1, organism: 1 });

// Virtual for full sample identifier
SampleSchema.virtual('fullIdentifier').get(function() {
  return `${this.sampleId}_${this.sampleName}`;
});

// Method to add data file
SampleSchema.methods.addDataFile = function(fileId: string) {
  if (!this.dataFiles.includes(fileId)) {
    this.dataFiles.push(fileId);
  }
  return this.save();
};

// Method to add analysis job
SampleSchema.methods.addAnalysisJob = function(jobId: string) {
  if (!this.analysisJobs.includes(jobId)) {
    this.analysisJobs.push(jobId);
  }
  return this.save();
};

// Static method to find samples by project
SampleSchema.statics.findByProject = function(projectId: string) {
  return this.find({ projectId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find samples by organism
SampleSchema.statics.findByOrganism = function(organism: string) {
  return this.find({ organism, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find samples by library strategy
SampleSchema.statics.findByLibraryStrategy = function(strategy: string) {
  return this.find({ 'sequencingInfo.libraryStrategy': strategy, isActive: true }).sort({ createdAt: -1 });
};

export default mongoose.model<ISample>('Sample', SampleSchema);