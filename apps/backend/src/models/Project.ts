import mongoose, { Schema } from 'mongoose';
import { IProject } from '@/types';

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    type: {
      type: String,
      enum: ['transcriptome', 'single-cell', 'genomics', 'multi-omics'],
      required: [true, 'Project type is required']
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'archived'],
      default: 'active'
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required']
    },
    collaborators: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    settings: {
      isPublic: {
        type: Boolean,
        default: false
      },
      allowCollaboration: {
        type: Boolean,
        default: true
      },
      dataRetentionDays: {
        type: Number,
        default: 365,
        min: [30, 'Data retention must be at least 30 days'],
        max: [3650, 'Data retention cannot exceed 10 years']
      }
    },
    metadata: {
      organism: {
        type: String,
        trim: true
      },
      tissueType: {
        type: String,
        trim: true
      },
      experimentType: {
        type: String,
        trim: true
      },
      platform: {
        type: String,
        trim: true
      }
    },
    storageUsed: {
      type: Number,
      default: 0,
      min: [0, 'Storage used cannot be negative']
    },
    storageLimit: {
      type: Number,
      default: 10737418240, // 10GB in bytes
      min: [1073741824, 'Storage limit must be at least 1GB']
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
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ collaborators: 1 });
ProjectSchema.index({ type: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ name: 'text', description: 'text' });

// Virtual for storage usage percentage
ProjectSchema.virtual('storageUsagePercent').get(function() {
  return (this.storageUsed / this.storageLimit) * 100;
});

// Virtual for project members (owner + collaborators)
ProjectSchema.virtual('members').get(function() {
  return [this.owner, ...this.collaborators];
});

// Method to check if user is member of project
ProjectSchema.methods.isMember = function(userId: string): boolean {
  return this.owner.toString() === userId || 
         this.collaborators.some((collaborator: any) => collaborator.toString() === userId);
};

// Method to check if user is owner
ProjectSchema.methods.isOwner = function(userId: string): boolean {
  return this.owner.toString() === userId;
};

export default mongoose.model<IProject>('Project', ProjectSchema);