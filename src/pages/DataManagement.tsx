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
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// 模拟文件系统数据
const fileSystemData = {
  directories: [
    {
      id: '1',
      name: '转录组数据',
      type: 'transcriptome',
      children: [
        { id: '1-1', name: 'RNA-seq-2024-01', type: 'project' },
        { id: '1-2', name: 'RNA-seq-2024-02', type: 'project' },
      ]
    },
    {
      id: '2',
      name: '单细胞数据',
      type: 'single-cell',
      children: [
        { id: '2-1', name: '10x-PBMC-v3', type: 'project' },
        { id: '2-2', name: 'Smart-seq2-batch1', type: 'project' },
      ]
    },
    {
      id: '3',
      name: '基因组数据',
      type: 'genomics',
      children: [
        { id: '3-1', name: 'WGS-cohort-A', type: 'project' },
        { id: '3-2', name: 'WES-tumor-samples', type: 'project' },
      ]
    }
  ]
};

const sampleFiles = [
  {
    id: 'f1',
    name: 'sample01_R1.fastq.gz',
    size: '2.1 GB',
    uploadTime: '2024-01-15 14:30',
    storageNode: 'Node-1',
    status: 'available',
    type: 'fastq'
  },
  {
    id: 'f2',
    name: 'sample01_R2.fastq.gz',
    size: '2.1 GB',
    uploadTime: '2024-01-15 14:30',
    storageNode: 'Node-1',
    status: 'available',
    type: 'fastq'
  },
  {
    id: 'f3',
    name: 'counts_matrix.csv',
    size: '156 MB',
    uploadTime: '2024-01-15 16:45',
    storageNode: 'Node-2',
    status: 'cached',
    type: 'result'
  },
  {
    id: 'f4',
    name: 'quality_report.html',
    size: '12 MB',
    uploadTime: '2024-01-15 17:20',
    storageNode: 'Node-3',
    status: 'available',
    type: 'report'
  },
  {
    id: 'f5',
    name: 'large_dataset.bam',
    size: '45.2 GB',
    uploadTime: '正在上传...',
    storageNode: 'Node-2',
    status: 'uploading',
    type: 'alignment'
  }
];

const storageNodes = [
  { id: 1, name: 'Node-1', used: 6144, total: 10240, load: 'low' },
  { id: 2, name: 'Node-2', used: 7680, total: 10240, load: 'medium' },
  { id: 3, name: 'Node-3', used: 5120, total: 10240, load: 'low' }
];

export default function DataManagement() {
  const [selectedDirectory, setSelectedDirectory] = useState('1-1');
  const [uploadProgress, setUploadProgress] = useState(72);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'fastq':
      case 'alignment':
        return Database;
      case 'result':
        return FileText;
      case 'report':
        return FileText;
      default:
        return FileText;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'cached':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'uploading':
        return <div className="status-indicator running"></div>;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getLoadColor = (load: string) => {
    switch (load) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">数据管理</h1>
          <p className="text-muted-foreground">分布式存储系统文件管理</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="btn-primary">
            <Upload className="w-4 h-4 mr-2" />
            上传数据
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            批量下载
          </Button>
        </div>
      </div>

      {/* 存储节点状态 */}
      <Card className="resource-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            分布式存储节点状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {storageNodes.map((node) => (
              <div key={node.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{node.name}</span>
                  <div className={`status-indicator ${node.load === 'low' ? 'completed' : node.load === 'medium' ? 'warning' : 'failed'}`}></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {(node.used / 1024).toFixed(1)}TB / {(node.total / 1024).toFixed(1)}TB
                    </span>
                    <span className={`text-${getLoadColor(node.load)}`}>
                      {((node.used / node.total) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={(node.used / node.total) * 100} className="h-2" />
                </div>
                <div className="text-xs text-muted-foreground">
                  负载: {node.load === 'low' ? '空闲' : node.load === 'medium' ? '中等' : '繁忙'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧目录树 */}
        <Card className="resource-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" />
              目录结构
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {fileSystemData.directories.map((dir) => (
                <div key={dir.id} className="space-y-1">
                  <div className="flex items-center gap-2 px-4 py-2 hover:bg-muted/50 cursor-pointer">
                    <Folder className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{dir.name}</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {dir.children.map((child) => (
                      <div
                        key={child.id}
                        className={`flex items-center gap-2 px-4 py-1.5 text-sm cursor-pointer rounded-md mx-2 ${
                          selectedDirectory === child.id ? 'bg-primary/20 text-primary' : 'hover:bg-muted/50 text-muted-foreground'
                        }`}
                        onClick={() => setSelectedDirectory(child.id)}
                      >
                        <Folder className="w-3 h-3" />
                        {child.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 右侧文件列表 */}
        <div className="lg:col-span-3 space-y-4">
          {/* 搜索和筛选栏 */}
          <Card className="resource-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索文件名或类型..."
                    className="pl-10 bg-background"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  筛选
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 上传进度 */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Card className="resource-card border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">正在上传: large_dataset.bam</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>目标节点: Node-2</span>
                  <span>预计剩余: 8分钟</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 文件列表 */}
          <Card className="resource-card">
            <CardHeader>
              <CardTitle>文件列表</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>文件名</th>
                      <th>大小</th>
                      <th>上传时间</th>
                      <th>存储节点</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleFiles.map((file) => {
                      const FileIcon = getFileIcon(file.type);
                      return (
                        <tr key={file.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <FileIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{file.name}</span>
                            </div>
                          </td>
                          <td>{file.size}</td>
                          <td className="text-muted-foreground">{file.uploadTime}</td>
                          <td>
                            <span className={`text-xs px-2 py-1 rounded-full bg-${getLoadColor('low')}/10 text-${getLoadColor('low')}`}>
                              {file.storageNode}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(file.status)}
                              <span className="text-sm capitalize">{file.status}</span>
                            </div>
                          </td>
                          <td>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}