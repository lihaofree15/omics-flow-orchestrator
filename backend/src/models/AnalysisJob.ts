import mongoose, { Schema } from 'mongoose';
import { IAnalysisJob } from '@/types';

const AnalysisJobSchema = new Schema<IAnalysisJob>(
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
      required: [true, 'Job name is required'],
      trim: true,
      maxlength: [200, 'Job name cannot exceed 200 characters']
    },
    type: {
      type: String,
      enum: [
        'quality-control',
        'alignment',
        'quantification',
        'differential-expression',
        'pathway-analysis',
        'single-cell-clustering'
      ],
      required: [true, 'Job type is required']
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    parameters: {
      type: Schema.Types.Mixed,
      default: {}
    },
    inputFiles: [{
      type: String,
      required: true
    }],
    outputFiles: [{
      type: String
    }],
    logs: [{
      type: String
    }],
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100%']
    },
    estimatedDuration: {
      type: Number,
      min: [0, 'Estimated duration cannot be negative']
    },
    actualDuration: {
      type: Number,
      min: [0, 'Actual duration cannot be negative']
    },
    resources: {
      cpu: {
        type: Number,
        required: [true, 'CPU allocation is required'],
        min: [1, 'CPU allocation must be at least 1']
      },
      memory: {
        type: Number,
        required: [true, 'Memory allocation is required'],
        min: [512, 'Memory allocation must be at least 512MB']
      },
      storage: {
        type: Number,
        required: [true, 'Storage allocation is required'],
        min: [100, 'Storage allocation must be at least 100MB']
      }
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
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
AnalysisJobSchema.index({ projectId: 1 });
AnalysisJobSchema.index({ userId: 1 });
AnalysisJobSchema.index({ status: 1 });
AnalysisJobSchema.index({ type: 1 });
AnalysisJobSchema.index({ priority: 1 });
AnalysisJobSchema.index({ createdAt: -1 });

// Virtual for execution time
AnalysisJobSchema.virtual('executionTime').get(function() {
  if (this.startedAt && this.completedAt) {
    return this.completedAt.getTime() - this.startedAt.getTime();
  }
  return null;
});

// Virtual for status display
AnalysisJobSchema.virtual('statusDisplay').get(function() {
  const statusMap: Record<string, string> = {
    'pending': '等待中',
    'running': '运行中',
    'completed': '已完成',
    'failed': '失败',
    'cancelled': '已取消'
  };
  return statusMap[this.status] || this.status;
});

// Method to update progress
AnalysisJobSchema.methods.updateProgress = function(progress: number, logs?: string[]) {
  this.progress = Math.max(0, Math.min(100, progress));
  if (logs && logs.length > 0) {
    this.logs.push(...logs);
  }
  return this.save();
};

// Method to start job
AnalysisJobSchema.methods.start = function() {
  this.status = 'running';
  this.startedAt = new Date();
  this.progress = 0;
  return this.save();
};

// Method to complete job
AnalysisJobSchema.methods.complete = function(outputFiles?: string[]) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.progress = 100;
  if (outputFiles) {
    this.outputFiles = outputFiles;
  }
  return this.save();
};

// Method to fail job
AnalysisJobSchema.methods.fail = function(errorMessage?: string) {
  this.status = 'failed';
  this.completedAt = new Date();
  if (errorMessage) {
    this.logs.push(`ERROR: ${errorMessage}`);
  }
  return this.save();
};

export default mongoose.model<IAnalysisJob>('AnalysisJob', AnalysisJobSchema);