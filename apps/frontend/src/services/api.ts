import { Project, DataFile, AnalysisJob, APIResponse, ProjectStats } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authentication token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, defaultOptions);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Project APIs
  async getProjects(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
  }): Promise<APIResponse<{ projects: Project[] }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ projects: Project[] }>(endpoint);
  }

  async getProject(projectId: string): Promise<APIResponse<{ project: Project }>> {
    return this.request<{ project: Project }>(`/projects/${projectId}`);
  }

  async createProject(project: Partial<Project>): Promise<APIResponse<{ project: Project }>> {
    return this.request<{ project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<APIResponse<{ project: Project }>> {
    return this.request<{ project: Project }>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(projectId: string): Promise<APIResponse<{}>> {
    return this.request<{}>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async getProjectStats(projectId: string): Promise<APIResponse<ProjectStats>> {
    return this.request<ProjectStats>(`/projects/${projectId}/stats`);
  }

  // File APIs
  async getFiles(params?: {
    projectId?: string;
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
  }): Promise<APIResponse<{ files: DataFile[] }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/files${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ files: DataFile[] }>(endpoint);
  }

  async getProjectFiles(projectId: string): Promise<APIResponse<{ files: DataFile[] }>> {
    return this.request<{ files: DataFile[] }>(`/projects/${projectId}/files`);
  }

  async uploadFiles(projectId: string, files: FileList, metadata?: any): Promise<APIResponse<{ files: DataFile[] }>> {
    const formData = new FormData();
    formData.append('projectId', projectId);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    // Remove Content-Type header to let browser set it with boundary for FormData
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'File upload failed');
    }
    
    return data;
  }

  async deleteFile(fileId: string): Promise<APIResponse<{}>> {
    return this.request<{}>(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/files/${fileId}/download`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('File download failed');
    }

    return response.blob();
  }

  // Analysis APIs
  async getAnalysisJobs(params?: {
    projectId?: string;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<APIResponse<{ jobs: AnalysisJob[] }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/analysis${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ jobs: AnalysisJob[] }>(endpoint);
  }

  async getProjectJobs(projectId: string): Promise<APIResponse<{ jobs: AnalysisJob[] }>> {
    return this.request<{ jobs: AnalysisJob[] }>(`/projects/${projectId}/jobs`);
  }

  async createAnalysisJob(job: Partial<AnalysisJob>): Promise<APIResponse<{ job: AnalysisJob }>> {
    return this.request<{ job: AnalysisJob }>('/analysis', {
      method: 'POST',
      body: JSON.stringify(job),
    });
  }

  async getAnalysisJob(jobId: string): Promise<APIResponse<{ job: AnalysisJob }>> {
    return this.request<{ job: AnalysisJob }>(`/analysis/${jobId}`);
  }

  async cancelAnalysisJob(jobId: string): Promise<APIResponse<{ job: AnalysisJob }>> {
    return this.request<{ job: AnalysisJob }>(`/analysis/${jobId}/cancel`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();