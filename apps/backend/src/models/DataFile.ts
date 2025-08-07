import mongoose, { Schema } from 'mongoose';
import { IDataFile } from '@/types';

const DataFileSchema = new Schema<IDataFile>(
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
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true
    },
    mimetype: {
      type: String,
      required: [true, 'MIME type is required']
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative']
    },
    path: {
      type: String,
      required: [true, 'File path is required']
    },
    checksum: {
      type: String,
      required: [true, 'File checksum is required']
    },
    type: {
      type: String,
      enum: ['fastq', 'fasta', 'bam', 'sam', 'vcf', 'gff', 'csv', 'tsv', 'other'],
      required: [true, 'File type is required']
    },
    metadata: {
      sampleId: {
        type: String,
        trim: true
      },
      readType: {
        type: String,
        enum: ['single', 'paired']
      },
      qualityScore: {
        type: String,
        trim: true
      },
      sequencingPlatform: {
        type: String,
        trim: true
      }
    },
    isProcessed: {
      type: Boolean,
      default: false
    },
    processingJobs: [{
      type: Schema.Types.ObjectId,
      ref: 'AnalysisJob'
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
DataFileSchema.index({ projectId: 1 });
DataFileSchema.index({ userId: 1 });
DataFileSchema.index({ type: 1 });
DataFileSchema.index({ filename: 1 });
DataFileSchema.index({ checksum: 1 });
DataFileSchema.index({ createdAt: -1 });

// Virtual for file size in human readable format
DataFileSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for file extension
DataFileSchema.virtual('extension').get(function() {
  return this.filename.split('.').pop()?.toLowerCase() || '';
});

// Method to mark as processed
DataFileSchema.methods.markAsProcessed = function(jobId?: string) {
  this.isProcessed = true;
  if (jobId) {
    this.processingJobs.push(jobId);
  }
  return this.save();
};

// Static method to find files by project
DataFileSchema.statics.findByProject = function(projectId: string) {
  return this.find({ projectId }).sort({ createdAt: -1 });
};

// Static method to calculate total size for project
DataFileSchema.statics.calculateProjectSize = async function(projectId: string) {
  const result = await this.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    { $group: { _id: null, totalSize: { $sum: '$size' } } }
  ]);
  return result[0]?.totalSize || 0;
};

export default mongoose.model<IDataFile>('DataFile', DataFileSchema);