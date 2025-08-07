import mongoose, { Schema } from 'mongoose';
import { ISystemMetrics } from '@/types';

const SystemMetricsSchema = new Schema<ISystemMetrics>(
  {
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    cpu: {
      usage: {
        type: Number,
        required: true,
        min: [0, 'CPU usage cannot be negative'],
        max: [100, 'CPU usage cannot exceed 100%']
      },
      cores: {
        type: Number,
        required: true,
        min: [1, 'CPU cores must be at least 1']
      },
      loadAverage: [{
        type: Number,
        required: true
      }]
    },
    memory: {
      total: {
        type: Number,
        required: true,
        min: [0, 'Total memory cannot be negative']
      },
      used: {
        type: Number,
        required: true,
        min: [0, 'Used memory cannot be negative']
      },
      free: {
        type: Number,
        required: true,
        min: [0, 'Free memory cannot be negative']
      },
      usage: {
        type: Number,
        required: true,
        min: [0, 'Memory usage cannot be negative'],
        max: [100, 'Memory usage cannot exceed 100%']
      }
    },
    storage: {
      total: {
        type: Number,
        required: true,
        min: [0, 'Total storage cannot be negative']
      },
      used: {
        type: Number,
        required: true,
        min: [0, 'Used storage cannot be negative']
      },
      free: {
        type: Number,
        required: true,
        min: [0, 'Free storage cannot be negative']
      },
      usage: {
        type: Number,
        required: true,
        min: [0, 'Storage usage cannot be negative'],
        max: [100, 'Storage usage cannot exceed 100%']
      }
    },
    network: {
      bytesIn: {
        type: Number,
        required: true,
        min: [0, 'Network bytes in cannot be negative']
      },
      bytesOut: {
        type: Number,
        required: true,
        min: [0, 'Network bytes out cannot be negative']
      }
    },
    activeJobs: {
      type: Number,
      required: true,
      min: [0, 'Active jobs cannot be negative']
    },
    queuedJobs: {
      type: Number,
      required: true,
      min: [0, 'Queued jobs cannot be negative']
    }
  },
  {
    timestamps: false, // We have our own timestamp field
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for performance
SystemMetricsSchema.index({ timestamp: -1 });
SystemMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL

// Static method to get latest metrics
SystemMetricsSchema.statics.getLatest = function() {
  return this.findOne().sort({ timestamp: -1 });
};

// Static method to get metrics for time range
SystemMetricsSchema.statics.getForTimeRange = function(startTime: Date, endTime: Date) {
  return this.find({
    timestamp: {
      $gte: startTime,
      $lte: endTime
    }
  }).sort({ timestamp: 1 });
};

// Static method to get average metrics for time range
SystemMetricsSchema.statics.getAverageForTimeRange = async function(startTime: Date, endTime: Date) {
  const result = await this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startTime,
          $lte: endTime
        }
      }
    },
    {
      $group: {
        _id: null,
        avgCpuUsage: { $avg: '$cpu.usage' },
        avgMemoryUsage: { $avg: '$memory.usage' },
        avgStorageUsage: { $avg: '$storage.usage' },
        avgActiveJobs: { $avg: '$activeJobs' },
        avgQueuedJobs: { $avg: '$queuedJobs' },
        maxCpuUsage: { $max: '$cpu.usage' },
        maxMemoryUsage: { $max: '$memory.usage' },
        maxStorageUsage: { $max: '$storage.usage' }
      }
    }
  ]);
  
  return result[0] || null;
};

// Static method to cleanup old metrics
SystemMetricsSchema.statics.cleanup = function(daysToKeep: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
};

export default mongoose.model<ISystemMetrics>('SystemMetrics', SystemMetricsSchema);