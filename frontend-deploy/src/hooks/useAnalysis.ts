import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { AnalysisJob } from '@/types';
import { toast } from 'sonner';

export const useAnalysisJobs = (params?: {
  projectId?: string;
  page?: number;
  limit?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['analysis-jobs', params],
    queryFn: () => apiService.getAnalysisJobs(params),
    select: (data) => ({
      jobs: data.data?.jobs || [],
      pagination: data.pagination,
    }),
  });
};

export const useProjectJobs = (projectId: string) => {
  return useQuery({
    queryKey: ['project-jobs', projectId],
    queryFn: () => apiService.getProjectJobs(projectId),
    select: (data) => data.data?.jobs || [],
    enabled: !!projectId,
  });
};

export const useAnalysisJob = (jobId: string) => {
  return useQuery({
    queryKey: ['analysis-job', jobId],
    queryFn: () => apiService.getAnalysisJob(jobId),
    select: (data) => data.data?.job,
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Auto-refresh if job is running
      const job = data?.data?.job;
      return job?.status === 'running' || job?.status === 'pending' ? 5000 : false;
    },
  });
};

export const useCreateAnalysisJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (job: Partial<AnalysisJob>) => apiService.createAnalysisJob(job),
    onSuccess: (data, variables) => {
      toast.success('分析任务创建成功');
      queryClient.invalidateQueries({ queryKey: ['analysis-jobs'] });
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-jobs', variables.projectId] });
      }
    },
    onError: (error: Error) => {
      toast.error(`分析任务创建失败: ${error.message}`);
    },
  });
};

export const useCancelAnalysisJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => apiService.cancelAnalysisJob(jobId),
    onSuccess: (data, variables) => {
      toast.success('分析任务已取消');
      queryClient.invalidateQueries({ queryKey: ['analysis-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['analysis-job', variables] });
      queryClient.invalidateQueries({ queryKey: ['project-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`取消分析任务失败: ${error.message}`);
    },
  });
};