import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { DataFile } from '@/types';
import { toast } from 'sonner';

export const useFiles = (params?: {
  projectId?: string;
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}) => {
  return useQuery({
    queryKey: ['files', params],
    queryFn: () => apiService.getFiles(params),
    select: (data) => ({
      files: data.data?.files || [],
      pagination: data.pagination,
    }),
  });
};

export const useProjectFiles = (projectId: string) => {
  return useQuery({
    queryKey: ['project-files', projectId],
    queryFn: () => apiService.getProjectFiles(projectId),
    select: (data) => data.data?.files || [],
    enabled: !!projectId,
  });
};

export const useUploadFiles = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, files, metadata }: { 
      projectId: string; 
      files: FileList; 
      metadata?: any 
    }) => apiService.uploadFiles(projectId, files, metadata),
    onSuccess: (data, variables) => {
      toast.success(`成功上传 ${data.data?.files?.length || 0} 个文件`);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['project-files', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', variables.projectId] });
    },
    onError: (error: Error) => {
      toast.error(`文件上传失败: ${error.message}`);
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (fileId: string) => apiService.deleteFile(fileId),
    onSuccess: () => {
      toast.success('文件删除成功');
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['project-files'] });
    },
    onError: (error: Error) => {
      toast.error(`文件删除失败: ${error.message}`);
    },
  });
};

export const useDownloadFile = () => {
  return useMutation({
    mutationFn: async ({ fileId, filename }: { fileId: string; filename: string }) => {
      const blob = await apiService.downloadFile(fileId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return blob;
    },
    onSuccess: () => {
      toast.success('文件下载开始');
    },
    onError: (error: Error) => {
      toast.error(`文件下载失败: ${error.message}`);
    },
  });
};