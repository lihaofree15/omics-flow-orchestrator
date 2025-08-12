import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Project } from '@/types';
import { toast } from 'sonner';

export const useProjects = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => apiService.getProjects(params),
    select: (data) => ({
      projects: data.data?.projects || [],
      pagination: data.pagination,
    }),
  });
};

export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiService.getProject(projectId),
    select: (data) => data.data?.project,
    enabled: !!projectId,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (project: Partial<Project>) => apiService.createProject(project),
    onSuccess: (data) => {
      toast.success('项目创建成功');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      toast.error(`项目创建失败: ${error.message}`);
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, updates }: { projectId: string; updates: Partial<Project> }) =>
      apiService.updateProject(projectId, updates),
    onSuccess: (data, variables) => {
      toast.success('项目更新成功');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
    onError: (error: Error) => {
      toast.error(`项目更新失败: ${error.message}`);
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (projectId: string) => apiService.deleteProject(projectId),
    onSuccess: () => {
      toast.success('项目删除成功');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      toast.error(`项目删除失败: ${error.message}`);
    },
  });
};

export const useProjectStats = (projectId: string) => {
  return useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => apiService.getProjectStats(projectId),
    select: (data) => data.data,
    enabled: !!projectId,
  });
};