import Bull from 'bull';
import { logger } from '@/config/logger';
import AnalysisJob from '@/models/AnalysisJob';
import { JobData, JobProgress } from '@/types';

// Redis configuration
const redisConfig = {
  redis: {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
    password: process.env.REDIS_PASSWORD || undefined,
  },
};

// Create job queues for different types of analysis
export const transcriptomeQueue = new Bull('transcriptome-analysis', redisConfig);
export const singleCellQueue = new Bull('single-cell-analysis', redisConfig);
export const genomicsQueue = new Bull('genomics-analysis', redisConfig);
export const generalQueue = new Bull('general-analysis', redisConfig);

// Queue mapping based on job type
const queueMap = {
  'quality-control': generalQueue,
  'alignment': transcriptomeQueue,
  'quantification': transcriptomeQueue,
  'differential-expression': transcriptomeQueue,
  'pathway-analysis': transcriptomeQueue,
  'single-cell-clustering': singleCellQueue,
};

// Add job to appropriate queue
export const addJobToQueue = async (jobData: JobData): Promise<Bull.Job> => {
  const queue = queueMap[jobData.type as keyof typeof queueMap] || generalQueue;
  
  const job = await queue.add(
    jobData.type,
    jobData,
    {
      priority: getPriorityValue(jobData.priority),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 50, // Keep last 50 completed jobs
      removeOnFail: 100,    // Keep last 100 failed jobs
    }
  );

  logger.info(`Job ${jobData.jobId} added to ${queue.name} queue`);
  return job;
};

// Convert priority string to number for Bull queue
const getPriorityValue = (priority: number): number => {
  switch (priority) {
    case 'urgent': return 1;
    case 'high': return 2;
    case 'normal': return 3;
    case 'low': return 4;
    default: return 3;
  }
};

// Job processor for transcriptome analysis
transcriptomeQueue.process('*', async (job) => {
  const { jobId, type, parameters, inputFiles } = job.data as JobData;
  
  try {
    // Update job status to running
    await updateJobStatus(jobId, 'running');
    
    // Simulate analysis process (replace with actual analysis logic)
    await simulateAnalysis(job, type, parameters, inputFiles);
    
    // Mark job as completed
    await updateJobStatus(jobId, 'completed');
    
    logger.info(`Transcriptome job ${jobId} completed successfully`);
    
  } catch (error) {
    logger.error(`Transcriptome job ${jobId} failed:`, error);
    await updateJobStatus(jobId, 'failed', error.message);
    throw error;
  }
});

// Job processor for single-cell analysis
singleCellQueue.process('*', async (job) => {
  const { jobId, type, parameters, inputFiles } = job.data as JobData;
  
  try {
    await updateJobStatus(jobId, 'running');
    await simulateAnalysis(job, type, parameters, inputFiles);
    await updateJobStatus(jobId, 'completed');
    
    logger.info(`Single-cell job ${jobId} completed successfully`);
    
  } catch (error) {
    logger.error(`Single-cell job ${jobId} failed:`, error);
    await updateJobStatus(jobId, 'failed', error.message);
    throw error;
  }
});

// Job processor for genomics analysis
genomicsQueue.process('*', async (job) => {
  const { jobId, type, parameters, inputFiles } = job.data as JobData;
  
  try {
    await updateJobStatus(jobId, 'running');
    await simulateAnalysis(job, type, parameters, inputFiles);
    await updateJobStatus(jobId, 'completed');
    
    logger.info(`Genomics job ${jobId} completed successfully`);
    
  } catch (error) {
    logger.error(`Genomics job ${jobId} failed:`, error);
    await updateJobStatus(jobId, 'failed', error.message);
    throw error;
  }
});

// Job processor for general analysis
generalQueue.process('*', async (job) => {
  const { jobId, type, parameters, inputFiles } = job.data as JobData;
  
  try {
    await updateJobStatus(jobId, 'running');
    await simulateAnalysis(job, type, parameters, inputFiles);
    await updateJobStatus(jobId, 'completed');
    
    logger.info(`General job ${jobId} completed successfully`);
    
  } catch (error) {
    logger.error(`General job ${jobId} failed:`, error);
    await updateJobStatus(jobId, 'failed', error.message);
    throw error;
  }
});

// Simulate analysis process (replace with actual bioinformatics tools)
const simulateAnalysis = async (
  job: Bull.Job,
  type: string,
  parameters: Record<string, any>,
  inputFiles: string[]
): Promise<void> => {
  const steps = getAnalysisSteps(type);
  const totalSteps = steps.length;
  
  for (let i = 0; i < totalSteps; i++) {
    const step = steps[i];
    const progress = Math.round(((i + 1) / totalSteps) * 100);
    
    // Update job progress
    await job.progress(progress);
    await updateJobProgress(job.data.jobId, progress, [`Starting ${step}...`]);
    
    // Simulate step processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 1000));
    
    await updateJobProgress(job.data.jobId, progress, [`Completed ${step}`]);
    
    logger.debug(`Job ${job.data.jobId}: ${step} completed (${progress}%)`);
  }
};

// Get analysis steps based on type
const getAnalysisSteps = (type: string): string[] => {
  const stepMap = {
    'quality-control': [
      'FastQC Quality Assessment',
      'Adapter Trimming',
      'Quality Filtering',
      'Final Quality Report'
    ],
    'alignment': [
      'Index Preparation',
      'Read Alignment',
      'BAM Processing',
      'Alignment Statistics'
    ],
    'quantification': [
      'Feature Counting',
      'Normalization',
      'Expression Matrix Generation',
      'Quality Metrics'
    ],
    'differential-expression': [
      'Data Preprocessing',
      'Statistical Analysis',
      'Multiple Testing Correction',
      'Results Annotation'
    ],
    'pathway-analysis': [
      'Gene Set Preparation',
      'Enrichment Analysis',
      'Pathway Mapping',
      'Visualization Generation'
    ],
    'single-cell-clustering': [
      'Cell Filtering',
      'Normalization',
      'Dimensionality Reduction',
      'Clustering Analysis',
      'Cell Type Annotation'
    ]
  };
  
  return stepMap[type as keyof typeof stepMap] || ['Processing Data', 'Generating Results'];
};

// Update job status in database
const updateJobStatus = async (
  jobId: string, 
  status: string, 
  errorMessage?: string
): Promise<void> => {
  try {
    const updateData: any = { status };
    
    if (status === 'running') {
      updateData.startedAt = new Date();
    } else if (['completed', 'failed', 'cancelled'].includes(status)) {
      updateData.completedAt = new Date();
      if (status === 'completed') {
        updateData.progress = 100;
      }
    }
    
    if (errorMessage) {
      updateData.$push = { logs: `ERROR: ${errorMessage}` };
    }
    
    await AnalysisJob.findByIdAndUpdate(jobId, updateData);
    
  } catch (error) {
    logger.error(`Error updating job ${jobId} status:`, error);
  }
};

// Update job progress
const updateJobProgress = async (
  jobId: string,
  progress: number,
  logs: string[]
): Promise<void> => {
  try {
    await AnalysisJob.findByIdAndUpdate(jobId, {
      progress,
      $push: { logs: { $each: logs } }
    });
  } catch (error) {
    logger.error(`Error updating job ${jobId} progress:`, error);
  }
};

// Queue event listeners
const setupQueueEvents = (queue: Bull.Queue, queueName: string) => {
  queue.on('completed', (job, result) => {
    logger.info(`Job ${job.id} in ${queueName} completed`);
  });

  queue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} in ${queueName} failed:`, err);
  });

  queue.on('stalled', (job) => {
    logger.warn(`Job ${job.id} in ${queueName} stalled`);
  });
};

// Setup event listeners for all queues
setupQueueEvents(transcriptomeQueue, 'transcriptome');
setupQueueEvents(singleCellQueue, 'single-cell');
setupQueueEvents(genomicsQueue, 'genomics');
setupQueueEvents(generalQueue, 'general');

// Get queue statistics
export const getQueueStats = async () => {
  const queues = [
    { name: 'transcriptome', queue: transcriptomeQueue },
    { name: 'single-cell', queue: singleCellQueue },
    { name: 'genomics', queue: genomicsQueue },
    { name: 'general', queue: generalQueue },
  ];

  const stats = {};
  
  for (const { name, queue } of queues) {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
    ]);

    stats[name] = {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  return stats;
};

// Cancel job
export const cancelJob = async (jobId: string): Promise<boolean> => {
  const queues = [transcriptomeQueue, singleCellQueue, genomicsQueue, generalQueue];
  
  for (const queue of queues) {
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info(`Job ${jobId} cancelled and removed from queue`);
      return true;
    }
  }
  
  return false;
};

logger.info('Job queue service initialized');

export default {
  addJobToQueue,
  getQueueStats,
  cancelJob,
  transcriptomeQueue,
  singleCellQueue,
  genomicsQueue,
  generalQueue,
};