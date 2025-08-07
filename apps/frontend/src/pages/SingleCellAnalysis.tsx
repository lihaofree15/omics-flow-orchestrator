import { useState } from "react";
import { 
  Microscope, 
  Play, 
  Settings, 
  Database, 
  Cpu, 
  BarChart3,
  Filter,
  Save,
  Download,
  Eye,
  Layers,
  Target,
  Sparkles,
  GitBranch,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

// 单细胞分析工作流步骤
const scWorkflowSteps = [
  { id: 'data', name: '数据导入', icon: Database, status: 'completed' },
  { id: 'filter', name: '质量过滤', icon: Filter, status: 'completed' },
  { id: 'normalize', name: '标准化', icon: Layers, status: 'running' },
  { id: 'reduction', name: '降维分析', icon: Target, status: 'queued' },
  { id: 'cluster', name: '细胞聚类', icon: GitBranch, status: 'queued' },
  { id: 'annotation', name: '细胞注释', icon: Sparkles, status: 'queued' }
];

// 模拟单细胞数据统计
const cellStats = {
  totalCells: 8432,
  filteredCells: 7291,
  genes: 18456,
  clusters: 12,
  markers: 856
};

// 过滤参数
const filterParams = {
  minGenes: 200,
  maxGenes: 5000,
  mitPercent: 20,
  minCells: 3
};

export default function SingleCellAnalysis() {
  const [currentStep, setCurrentStep] = useState('normalize');
  const [workflowProgress, setWorkflowProgress] = useState(45);
  const [selectedClusters, setSelectedClusters] = useState<number[]>([]);
  const [clusterResolution, setClusterResolution] = useState([0.5]);

  const getStepStatus = (stepId: string) => {
    const step = scWorkflowSteps.find(s => s.id === stepId);
    return step?.status || 'queued';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'running':
        return <div className="status-indicator running"></div>;
      case 'queued':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <div className="status-indicator failed"></div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">单细胞转录组分析</h1>
          <p className="text-muted-foreground">10x Genomics 和 Smart-seq2 数据分析流程</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Save className="w-4 h-4 mr-2" />
            保存模板
          </Button>
          <Button className="btn-success">
            <Play className="w-4 h-4 mr-2" />
            启动分析
          </Button>
        </div>
      </div>

      {/* 数据概览 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="resource-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{cellStats.totalCells.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">总细胞数</div>
          </CardContent>
        </Card>
        <Card className="resource-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{cellStats.filteredCells.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">过滤后细胞</div>
          </CardContent>
        </Card>
        <Card className="resource-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{cellStats.genes.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">检测基因数</div>
          </CardContent>
        </Card>
        <Card className="resource-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{cellStats.clusters}</div>
            <div className="text-sm text-muted-foreground">细胞簇数</div>
          </CardContent>
        </Card>
        <Card className="resource-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-info">{cellStats.markers}</div>
            <div className="text-sm text-muted-foreground">标记基因数</div>
          </CardContent>
        </Card>
      </div>

      {/* 工作流进度 */}
      <Card className="resource-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Microscope className="w-5 h-5 text-primary" />
            单细胞分析流程
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 流程图 */}
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {scWorkflowSteps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className={`workflow-node ${getStepStatus(step.id)} ${currentStep === step.id ? 'active' : ''} min-w-max`}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(step.status)}
                      <step.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{step.name}</span>
                    </div>
                  </div>
                  {index < scWorkflowSteps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />
                  )}
                </div>
              ))}
            </div>

            {/* 整体进度 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">分析进度</span>
                <span className="font-medium">{workflowProgress}%</span>
              </div>
              <Progress value={workflowProgress} className="h-2" />
            </div>

            {/* 当前运行信息 */}
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="status-indicator running"></div>
                  <span className="text-sm font-medium">当前步骤: 数据标准化</span>
                </div>
                <span className="text-sm text-muted-foreground">运行于计算节点-2</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                正在进行 SCTransform 标准化 | 预计剩余: 8分钟 | 内存使用: 45GB
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要配置区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 - 分析配置 */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="preprocess" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="preprocess">数据预处理</TabsTrigger>
              <TabsTrigger value="reduction">降维聚类</TabsTrigger>
              <TabsTrigger value="annotation">细胞注释</TabsTrigger>
              <TabsTrigger value="analysis">高级分析</TabsTrigger>
            </TabsList>

            <TabsContent value="preprocess" className="space-y-4">
              <Card className="resource-card">
                <CardHeader>
                  <CardTitle>数据预处理参数</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">数据格式</label>
                    <Select defaultValue="10x">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10x">10x Genomics (CellRanger)</SelectItem>
                        <SelectItem value="smart-seq2">Smart-seq2</SelectItem>
                        <SelectItem value="drop-seq">Drop-seq</SelectItem>
                        <SelectItem value="plate-based">Plate-based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">最小基因数/细胞</label>
                      <Input 
                        type="number" 
                        defaultValue={filterParams.minGenes}
                        placeholder="200" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">最大基因数/细胞</label>
                      <Input 
                        type="number" 
                        defaultValue={filterParams.maxGenes}
                        placeholder="5000" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">线粒体基因比例上限(%)</label>
                      <Input 
                        type="number" 
                        defaultValue={filterParams.mitPercent}
                        placeholder="20" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">最少表达细胞数</label>
                      <Input 
                        type="number" 
                        defaultValue={filterParams.minCells}
                        placeholder="3" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">标准化方法</label>
                    <Select defaultValue="sctransform">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sctransform">SCTransform (推荐)</SelectItem>
                        <SelectItem value="lognormalize">LogNormalize</SelectItem>
                        <SelectItem value="clr">CLR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reduction" className="space-y-4">
              <Card className="resource-card">
                <CardHeader>
                  <CardTitle>降维与聚类参数</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">降维方法</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="text-xs">PCA</Button>
                      <Button variant="outline" size="sm" className="text-xs">t-SNE</Button>
                      <Button variant="outline" size="sm" className="text-xs bg-primary/10 border-primary">UMAP</Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">主成分数量</label>
                    <Input type="number" defaultValue="50" placeholder="50" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">聚类分辨率: {clusterResolution[0]}</label>
                    <Slider
                      value={clusterResolution}
                      onValueChange={setClusterResolution}
                      max={2.0}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0.1 (粗粒度)</span>
                      <span>2.0 (细粒度)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">聚类算法</label>
                    <Select defaultValue="leiden">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leiden">Leiden算法</SelectItem>
                        <SelectItem value="louvain">Louvain算法</SelectItem>
                        <SelectItem value="kmeans">K-means</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="annotation" className="space-y-4">
              <Card className="resource-card">
                <CardHeader>
                  <CardTitle>细胞类型注释</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">参考数据库</label>
                    <Select defaultValue="cellmarker">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cellmarker">CellMarker</SelectItem>
                        <SelectItem value="celltypist">CellTypist</SelectItem>
                        <SelectItem value="sctype">scType</SelectItem>
                        <SelectItem value="manual">手动注释</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">物种</label>
                    <Select defaultValue="human">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="human">Human (人类)</SelectItem>
                        <SelectItem value="mouse">Mouse (小鼠)</SelectItem>
                        <SelectItem value="rat">Rat (大鼠)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">组织类型</label>
                    <Select defaultValue="pbmc">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pbmc">PBMC (外周血)</SelectItem>
                        <SelectItem value="brain">Brain (脑组织)</SelectItem>
                        <SelectItem value="liver">Liver (肝脏)</SelectItem>
                        <SelectItem value="lung">Lung (肺脏)</SelectItem>
                        <SelectItem value="kidney">Kidney (肾脏)</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">置信度阈值</label>
                    <Input type="number" defaultValue="0.7" placeholder="0.7" step="0.1" min="0" max="1" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card className="resource-card">
                <CardHeader>
                  <CardTitle>高级分析选项</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">差异基因分析</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">寻找所有簇的标记基因</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">组间差异分析</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">轨迹分析</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Monocle3 轨迹推断</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">RNA velocity 分析</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">功能富集分析</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">GO 富集分析</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">KEGG 通路分析</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* 右侧 - 结果预览和资源监控 */}
        <div className="space-y-6">
          {/* 实时预览 */}
          <Card className="resource-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                实时预览
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Microscope className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">UMAP 图表</p>
                  <p className="text-xs">分析完成后显示</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">当前细胞簇</span>
                  <span className="font-medium">12个</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">标记基因</span>
                  <span className="font-medium">正在计算...</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 计算资源 */}
          <Card className="resource-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                计算资源
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">24核</div>
                <div className="text-sm text-muted-foreground">CPU分配</div>
              </div>

              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-success">96GB</div>
                <div className="text-sm text-muted-foreground">内存分配</div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-2">预计总时间</div>
                <div className="font-medium text-warning">45-60分钟</div>
              </div>
            </CardContent>
          </Card>

          {/* 导出选项 */}
          <Card className="resource-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                结果导出
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Seurat 对象 (.rds)
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                表达矩阵 (.csv)
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                可视化图表 (.pdf)
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                分析报告 (.html)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}