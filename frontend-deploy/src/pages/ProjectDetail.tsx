import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Settings,
  Users,
  Database,
  BarChart3,
  Calendar,
  HardDrive,
  Activity,
  FileText,
  Play,
  Pause,
  Trash2,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useProject } from '@/hooks/useProjects';
import { useProjectFiles, useDeleteFile, useDownloadFile } from '@/hooks/useFiles';
import { useProjectJobs, useCancelAnalysisJob } from '@/hooks/useAnalysis';
import FileUpload from '@/components/FileUpload';
import { DataFile, AnalysisJob } from '@/types';

const projectTypeLabels = {
  transcriptome: '转录组',
  'single-cell': '单细胞',
  genomics: '基因组',
  'multi-omics': '多组学',
};

const projectStatusColors = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  paused: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-gray-100 text-gray-800',
};

const fileTypeColors = {
  fastq: 'bg-blue-100 text-blue-800',
  fasta: 'bg-green-100 text-green-800',
  bam: 'bg-purple-100 text-purple-800',
  sam: 'bg-purple-100 text-purple-800',
  vcf: 'bg-orange-100 text-orange-800',
  gff: 'bg-yellow-100 text-yellow-800',
  csv: 'bg-gray-100 text-gray-800',
  tsv: 'bg-gray-100 text-gray-800',
  other: 'bg-gray-100 text-gray-800',
};

const jobStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { data: projectFiles = [], refetch: refetchFiles } = useProjectFiles(projectId!);
  const { data: projectJobs = [], refetch: refetchJobs } = useProjectJobs(projectId!);

  // Mutations
  const deleteFileMutation = useDeleteFile();
  const downloadFileMutation = useDownloadFile();
  const cancelJobMutation = useCancelAnalysisJob();

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">项目未找到</h3>
        <p className="mt-1 text-sm text-gray-500">请检查项目ID是否正确</p>
        <Button onClick={() => navigate('/projects')} className="mt-4">
          返回项目列表
        </Button>
      </div>
    );
  }

  const handleDeleteFile = async (file: DataFile) => {
    if (confirm(`确定要删除文件 "${file.originalName}" 吗？`)) {
      await deleteFileMutation.mutateAsync(file._id);
      refetchFiles();
    }
  };

  const handleDownloadFile = async (file: DataFile) => {
    await downloadFileMutation.mutateAsync({
      fileId: file._id,
      filename: file.originalName,
    });
  };

  const handleCancelJob = async (job: AnalysisJob) => {
    if (confirm(`确定要取消分析任务 "${job.name}" 吗？`)) {
      await cancelJobMutation.mutateAsync(job._id);
      refetchJobs();
    }
  };

  const handleUploadComplete = () => {
    refetchFiles();
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const runningJobs = projectJobs.filter(job => job.status === 'running' || job.status === 'pending');
  const completedJobs = projectJobs.filter(job => job.status === 'completed');
  const failedJobs = projectJobs.filter(job => job.status === 'failed');

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回项目列表
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <Badge className={projectStatusColors[project.status]}>
                {project.status === 'active' ? '进行中' : 
                 project.status === 'completed' ? '已完成' : 
                 project.status === 'paused' ? '暂停' : '已归档'}
              </Badge>
              <Badge variant="outline">
                {projectTypeLabels[project.type]}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FileUpload onUploadComplete={handleUploadComplete} />
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            编辑项目
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
        </div>
      </div>

      {/* 项目概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">数据文件</p>
                <p className="text-2xl font-bold text-gray-900">{projectFiles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">分析任务</p>
                <p className="text-2xl font-bold text-gray-900">{projectJobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <HardDrive className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">存储使用</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(project.storageUsed / (1024**3)).toFixed(1)}GB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">运行中任务</p>
                <p className="text-2xl font-bold text-gray-900">{runningJobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="files">数据文件</TabsTrigger>
          <TabsTrigger value="analysis">分析任务</TabsTrigger>
          <TabsTrigger value="team">团队成员</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 存储使用情况 */}
          <Card>
            <CardHeader>
              <CardTitle>存储使用情况</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>已使用: {(project.storageUsed / (1024**3)).toFixed(2)} GB</span>
                  <span>总容量: {(project.storageLimit / (1024**3)).toFixed(0)} GB</span>
                </div>
                <Progress value={project.storageUsagePercent} className="h-3" />
                <p className="text-sm text-gray-500">
                  剩余空间: {((project.storageLimit - project.storageUsed) / (1024**3)).toFixed(2)} GB
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 最近活动 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>最近上传的文件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectFiles.slice(0, 5).map((file) => (
                    <div key={file._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{file.originalName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(file.createdAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={fileTypeColors[file.type]}>
                        {file.type.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                  {projectFiles.length === 0 && (
                    <p className="text-sm text-gray-500">暂无上传的文件</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>分析任务状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">已完成</span>
                    <span className="text-sm font-medium">{completedJobs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">运行中</span>
                    <span className="text-sm font-medium">{runningJobs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">失败</span>
                    <span className="text-sm font-medium">{failedJobs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">总计</span>
                    <span className="text-sm font-medium">{projectJobs.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>数据文件 ({projectFiles.length})</span>
                <Badge variant="secondary">
                  总大小: {(projectFiles.reduce((total, file) => total + file.size, 0) / (1024**3)).toFixed(2)} GB
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">暂无文件</h3>
                  <p className="mt-1 text-sm text-gray-500">点击上传按钮添加数据文件</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projectFiles.map((file) => (
                    <div key={file._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4 flex-1">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.originalName}
                            </p>
                            <Badge variant="secondary" className={fileTypeColors[file.type]}>
                              {file.type.toUpperCase()}
                            </Badge>
                            {file.isProcessed && (
                              <Badge variant="outline" className="text-green-600">
                                已处理
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-gray-500">{file.sizeFormatted}</p>
                            {file.metadata.sampleId && (
                              <p className="text-sm text-gray-500">样本: {file.metadata.sampleId}</p>
                            )}
                            <p className="text-sm text-gray-500">
                              {new Date(file.createdAt).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadFile(file)}>
                            <Download className="mr-2 h-4 w-4" />
                            下载
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteFile(file)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>分析任务 ({projectJobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {projectJobs.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">暂无分析任务</h3>
                  <p className="mt-1 text-sm text-gray-500">创建新的分析任务来处理数据</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projectJobs.map((job) => (
                    <div key={job._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getJobStatusIcon(job.status)}
                          <div>
                            <h3 className="font-medium">{job.name}</h3>
                            <p className="text-sm text-gray-500">{job.type} 分析</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={jobStatusColors[job.status]}>
                            {job.status === 'pending' ? '等待中' :
                             job.status === 'running' ? '运行中' :
                             job.status === 'completed' ? '已完成' :
                             job.status === 'failed' ? '失败' : '已取消'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                查看详情
                              </DropdownMenuItem>
                              {(job.status === 'running' || job.status === 'pending') && (
                                <DropdownMenuItem 
                                  onClick={() => handleCancelJob(job)}
                                  className="text-red-600"
                                >
                                  <Pause className="mr-2 h-4 w-4" />
                                  取消任务
                                </DropdownMenuItem>
                              )}
                              {job.status === 'completed' && (
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  下载结果
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {job.status === 'running' && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>进度</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>输入文件: {job.inputFiles.length} 个</span>
                        <span>创建时间: {new Date(job.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>团队成员</span>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  邀请成员
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 项目所有者 */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {project.owner.firstName.charAt(0)}{project.owner.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{project.owner.firstName} {project.owner.lastName}</p>
                      <p className="text-sm text-gray-500">{project.owner.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">所有者</Badge>
                </div>

                {/* 协作者 */}
                {project.collaborators.map((collaborator) => (
                  <div key={collaborator._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {collaborator.firstName.charAt(0)}{collaborator.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{collaborator.firstName} {collaborator.lastName}</p>
                        <p className="text-sm text-gray-500">{collaborator.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">协作者</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}