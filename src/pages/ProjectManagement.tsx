import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  FolderOpen, 
  Users, 
  Calendar, 
  BarChart3,
  Settings,
  Archive,
  Trash2,
  Eye,
  Edit,
  Play,
  Pause,
  Download,
  Upload
} from "lucide-react";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  description: string;
  type: 'transcriptome' | 'single-cell' | 'genomics' | 'multi-omics';
  status: 'active' | 'completed' | 'paused' | 'archived';
  owner: string;
  collaborators: string[];
  createdAt: Date;
  updatedAt: Date;
  storageUsed: number;
  storageLimit: number;
  analysisJobs: number;
  dataFiles: number;
}

export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'proj_001',
      name: '肿瘤转录组分析',
      description: '乳腺癌患者转录组数据差异表达分析',
      type: 'transcriptome',
      status: 'active',
      owner: '张研究员',
      collaborators: ['李博士', '王助理'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      storageUsed: 156,
      storageLimit: 500,
      analysisJobs: 5,
      dataFiles: 24
    },
    {
      id: 'proj_002',
      name: '单细胞免疫分析',
      description: 'COVID-19患者单细胞转录组免疫细胞分析',
      type: 'single-cell',
      status: 'completed',
      owner: '李博士',
      collaborators: ['张研究员'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
      storageUsed: 340,
      storageLimit: 500,
      analysisJobs: 8,
      dataFiles: 45
    },
    {
      id: 'proj_003',
      name: '基因组变异检测',
      description: '家系全基因组测序变异检测与致病性预测',
      type: 'genomics',
      status: 'active',
      owner: '王助理',
      collaborators: ['张研究员', '李博士', '陈技师'],
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-19'),
      storageUsed: 890,
      storageLimit: 1000,
      analysisJobs: 3,
      dataFiles: 18
    },
    {
      id: 'proj_004',
      name: '多组学整合分析',
      description: '糖尿病队列转录组+代谢组+蛋白组整合分析',
      type: 'multi-omics',
      status: 'paused',
      owner: '陈技师',
      collaborators: ['张研究员'],
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-16'),
      storageUsed: 245,
      storageLimit: 1000,
      analysisJobs: 12,
      dataFiles: 67
    }
  ]);

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    type: 'transcriptome' as Project['type'],
    storageLimit: 500
  });

  const getTypeLabel = (type: Project['type']) => {
    const types = {
      'transcriptome': '转录组',
      'single-cell': '单细胞',
      'genomics': '基因组',
      'multi-omics': '多组学'
    };
    return types[type];
  };

  const getStatusColor = (status: Project['status']) => {
    const colors = {
      'active': 'bg-success text-success-foreground',
      'completed': 'bg-primary text-primary-foreground',
      'paused': 'bg-warning text-warning-foreground',
      'archived': 'bg-muted text-muted-foreground'
    };
    return colors[status];
  };

  const getStatusLabel = (status: Project['status']) => {
    const labels = {
      'active': '进行中',
      'completed': '已完成',
      'paused': '已暂停',
      'archived': '已归档'
    };
    return labels[status];
  };

  const handleCreateProject = () => {
    const project: Project = {
      id: `proj_${Date.now().toString().slice(-3)}`,
      ...newProject,
      owner: '当前用户',
      collaborators: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      storageUsed: 0,
      analysisJobs: 0,
      dataFiles: 0,
      status: 'active'
    };
    
    setProjects(prev => [project, ...prev]);
    setIsCreateDialogOpen(false);
    setNewProject({
      name: '',
      description: '',
      type: 'transcriptome',
      storageLimit: 500
    });
  };

  const handleProjectAction = (projectId: string, action: string) => {
    console.log(`执行操作: ${action} on project ${projectId}`);
    // Handle other project actions here
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">项目管理</h1>
          <p className="text-muted-foreground mt-2">管理和监控所有多组学分析项目</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新建项目
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>创建新项目</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">项目名称</Label>
                  <Input
                    id="projectName"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="输入项目名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectType">项目类型</Label>
                  <Select value={newProject.type} onValueChange={(value) => setNewProject(prev => ({ ...prev, type: value as Project['type'] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transcriptome">转录组分析</SelectItem>
                      <SelectItem value="single-cell">单细胞分析</SelectItem>
                      <SelectItem value="genomics">基因组分析</SelectItem>
                      <SelectItem value="multi-omics">多组学整合</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectDesc">项目描述</Label>
                <Textarea
                  id="projectDesc"
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="详细描述项目目标和内容"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="storageLimit">存储限额 (GB)</Label>
                <Input
                  id="storageLimit"
                  type="number"
                  value={newProject.storageLimit}
                  onChange={(e) => setNewProject(prev => ({ ...prev, storageLimit: parseInt(e.target.value) }))}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateProject}>
                  创建项目
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">项目概览</TabsTrigger>
          <TabsTrigger value="table">详细列表</TabsTrigger>
          <TabsTrigger value="stats">统计分析</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getTypeLabel(project.type)}</Badge>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>存储使用率</span>
                      <span>{project.storageUsed}GB / {project.storageLimit}GB</span>
                    </div>
                    <Progress value={(project.storageUsed / project.storageLimit) * 100} />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <FolderOpen className="w-3 h-3" />
                        {project.dataFiles}个文件
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {project.analysisJobs}个任务
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">{project.owner[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{project.owner}</span>
                    {project.collaborators.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.collaborators.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleProjectAction(project.id, 'view')}>
                      <Eye className="w-3 h-3 mr-1" />
                      查看
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleProjectAction(project.id, 'edit')}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    {project.status === 'active' && (
                      <Button variant="outline" size="sm" onClick={() => handleProjectAction(project.id, 'pause')}>
                        <Pause className="w-3 h-3" />
                      </Button>
                    )}
                    {project.status === 'paused' && (
                      <Button variant="outline" size="sm" onClick={() => handleProjectAction(project.id, 'resume')}>
                        <Play className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>项目详细信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">项目名称</th>
                      <th className="text-left p-2">类型</th>
                      <th className="text-left p-2">状态</th>
                      <th className="text-left p-2">负责人</th>
                      <th className="text-left p-2">存储使用</th>
                      <th className="text-left p-2">更新时间</th>
                      <th className="text-left p-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-muted-foreground">{project.id}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{getTypeLabel(project.type)}</Badge>
                        </td>
                        <td className="p-2">
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusLabel(project.status)}
                          </Badge>
                        </td>
                        <td className="p-2">{project.owner}</td>
                        <td className="p-2">
                          <div className="w-20">
                            <Progress value={(project.storageUsed / project.storageLimit) * 100} />
                            <div className="text-xs text-muted-foreground mt-1">
                              {project.storageUsed}GB / {project.storageLimit}GB
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-sm">
                          {project.updatedAt.toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleProjectAction(project.id, 'edit')}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleProjectAction(project.id, 'archive')}>
                              <Archive className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{projects.length}</div>
                <div className="text-sm text-muted-foreground">总项目数</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">进行中项目</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {projects.reduce((sum, p) => sum + p.storageUsed, 0)}GB
                </div>
                <div className="text-sm text-muted-foreground">总存储使用</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {projects.reduce((sum, p) => sum + p.analysisJobs, 0)}
                </div>
                <div className="text-sm text-muted-foreground">总分析任务</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}