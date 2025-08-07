import { useState } from "react";
import { 
  FolderTree, 
  Upload, 
  Download, 
  Search, 
  Filter,
  FileText,
  Folder,
  Database,
  HardDrive,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  FolderOpen,
  RefreshCw,
  Trash2,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import FileUpload from "@/components/FileUpload";
import ProjectSelector from "@/components/ProjectSelector";
import { useProjects } from "@/hooks/useProjects";
import { useProjectFiles, useDeleteFile, useDownloadFile } from "@/hooks/useFiles";
import { Project, DataFile } from "@/types";

const projectTypeLabels = {
  transcriptome: '转录组',
  'single-cell': '单细胞',
  genomics: '基因组',
  'multi-omics': '多组学',
};

const projectStatusLabels = {
  active: '进行中',
  completed: '已完成',
  paused: '暂停',
  archived: '已归档',
};

const projectStatusColors = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  paused: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-gray-100 text-gray-800',
};

const fileTypeLabels = {
  fastq: 'FASTQ',
  fasta: 'FASTA',
  bam: 'BAM',
  sam: 'SAM',
  vcf: 'VCF',
  gff: 'GFF',
  csv: 'CSV',
  tsv: 'TSV',
  other: '其他',
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

export default function DataManagement() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'projects' | 'all'>('projects');

  // Fetch projects and files
  const { data: projectsData } = useProjects({ status: 'active' });
  const projects = projectsData?.projects || [];

  const { data: projectFiles = [], refetch: refetchProjectFiles } = useProjectFiles(selectedProjectId);
  
  const deleteFileMutation = useDeleteFile();
  const downloadFileMutation = useDownloadFile();

  // Filter files based on search and type
  const filteredFiles = projectFiles.filter((file: DataFile) => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.metadata.sampleId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = fileTypeFilter === 'all' || file.type === fileTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleDeleteFile = async (file: DataFile) => {
    if (confirm(`确定要删除文件 "${file.originalName}" 吗？`)) {
      await deleteFileMutation.mutateAsync(file._id);
      refetchProjectFiles();
    }
  };

  const handleDownloadFile = async (file: DataFile) => {
    await downloadFileMutation.mutateAsync({
      fileId: file._id,
      filename: file.originalName,
    });
  };

  const handleUploadComplete = () => {
    refetchProjectFiles();
  };

  const selectedProject = projects.find(p => p._id === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">数据管理</h1>
          <p className="text-muted-foreground">按项目管理和组织数据文件</p>
        </div>
        <div className="flex items-center gap-3">
          <FileUpload onUploadComplete={handleUploadComplete} />
          <Button variant="outline" disabled={!selectedProjectId}>
            <Download className="w-4 h-4 mr-2" />
            批量下载
          </Button>
          <Button 
            variant="outline" 
            onClick={() => refetchProjectFiles()}
            disabled={!selectedProjectId}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 项目选择和过滤 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            项目和过滤
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 项目选择器 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">选择项目</label>
              <ProjectSelector
                selectedProjectId={selectedProjectId}
                onSelectProject={(projectId) => setSelectedProjectId(projectId)}
                placeholder="选择要查看的项目..."
                className="w-full"
              />
            </div>
            
            {/* 搜索 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">搜索文件</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="文件名或样本ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            {/* 文件类型过滤 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">文件类型</label>
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择文件类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有类型</SelectItem>
                  {Object.entries(fileTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 视图模式 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">视图模式</label>
              <Select value={viewMode} onValueChange={(value: 'projects' | 'all') => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="projects">按项目查看</SelectItem>
                  <SelectItem value="all">查看所有文件</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 项目信息 */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                {selectedProject.name}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={projectStatusColors[selectedProject.status]}>
                  {projectStatusLabels[selectedProject.status]}
                </Badge>
                <Badge variant="outline">
                  {projectTypeLabels[selectedProject.type]}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">项目描述</p>
                <p className="text-sm">{selectedProject.description}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">存储使用</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{(selectedProject.storageUsed / (1024**3)).toFixed(2)} GB</span>
                    <span>{(selectedProject.storageLimit / (1024**3)).toFixed(0)} GB</span>
                  </div>
                  <Progress value={selectedProject.storageUsagePercent} className="h-2" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">文件统计</p>
                <div className="flex justify-between text-sm">
                  <span>总文件数: {projectFiles.length}</span>
                  <span>已处理: {projectFiles.filter((f: DataFile) => f.isProcessed).length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 文件列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              数据文件 {selectedProject && `(${filteredFiles.length})`}
            </div>
            {filteredFiles.length > 0 && (
              <Badge variant="secondary">
                {filteredFiles.reduce((total: number, file: DataFile) => total + file.size, 0) > 0 
                  ? `总大小: ${(filteredFiles.reduce((total: number, file: DataFile) => total + file.size, 0) / (1024**3)).toFixed(2)} GB`
                  : '计算中...'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedProject ? (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">请选择项目</h3>
              <p className="mt-1 text-sm text-gray-500">选择一个项目来查看其数据文件</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无文件</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || fileTypeFilter !== 'all' 
                  ? '没有符合筛选条件的文件' 
                  : '该项目还没有上传任何文件'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file: DataFile) => (
                <div key={file._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4 flex-1">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.originalName}
                        </p>
                        <Badge 
                          variant="secondary"
                          className={fileTypeColors[file.type]}
                        >
                          {fileTypeLabels[file.type]}
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
                        {file.metadata.sequencingPlatform && (
                          <p className="text-sm text-gray-500">平台: {file.metadata.sequencingPlatform}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {new Date(file.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 项目概览（当没有选择项目时显示） */}
      {!selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" />
              项目概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div 
                  key={project._id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedProjectId(project._id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium truncate">{project.name}</h3>
                    <Badge className={projectStatusColors[project.status]}>
                      {projectStatusLabels[project.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>存储使用</span>
                      <span>{project.storageUsagePercent.toFixed(1)}%</span>
                    </div>
                    <Progress value={project.storageUsagePercent} className="h-1" />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <Badge variant="outline">
                      {projectTypeLabels[project.type]}
                    </Badge>
                    <span>{new Date(project.updatedAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}