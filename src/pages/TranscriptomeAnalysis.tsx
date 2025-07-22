import { useState } from "react";
import { 
  Play, 
  Settings, 
  Database, 
  Cpu, 
  GitBranch,
  CheckCircle,
  Clock,
  AlertCircle,
  Save,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// 工作流步骤定义
const workflowSteps = [
  { id: 'data', name: '数据选择', icon: Database, status: 'completed' },
  { id: 'qc', name: '质量控制', icon: CheckCircle, status: 'running' },
  { id: 'align', name: '序列比对', icon: GitBranch, status: 'queued' },
  { id: 'count', name: '表达定量', icon: BarChart3, status: 'queued' },
  { id: 'diff', name: '差异分析', icon: BarChart3, status: 'queued' }
];

// 计算资源配置
const resourceConfig = {
  cpuCores: 16,
  memory: 64,
  estimatedTime: '2-3小时',
  computeNode: 'auto'
};

// 流行的工具选项
const analysisTools = {
  qc: ['FastQC', 'MultiQC', 'Trim_Galore'],
  alignment: ['STAR', 'HISAT2', 'TopHat2'],
  quantification: ['Salmon', 'StringTie', 'RSEM', 'featureCounts']
};

export default function TranscriptomeAnalysis() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState('qc');
  const [workflowProgress, setWorkflowProgress] = useState(25);

  const getStepStatus = (stepId: string) => {
    const step = workflowSteps.find(s => s.id === stepId);
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
        return <AlertCircle className="w-4 h-4 text-error" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">转录组分析</h1>
          <p className="text-muted-foreground">RNA-seq数据标准分析流程</p>
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

      {/* 工作流进度 */}
      <Card className="resource-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            分析流程
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 流程图 */}
            <div className="flex items-center justify-between">
              {workflowSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`workflow-node ${getStepStatus(step.id)} ${currentStep === step.id ? 'active' : ''}`}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(step.status)}
                      <step.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{step.name}</span>
                    </div>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />
                  )}
                </div>
              ))}
            </div>

            {/* 整体进度 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">整体进度</span>
                <span className="font-medium">{workflowProgress}%</span>
              </div>
              <Progress value={workflowProgress} className="h-2" />
            </div>

            {/* 当前运行信息 */}
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="status-indicator running"></div>
                  <span className="text-sm font-medium">当前步骤: 质量控制</span>
                </div>
                <span className="text-sm text-muted-foreground">运行于计算节点-1</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                预计剩余时间: 15分钟 | 使用资源: CPU 16核, 内存 32GB
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要配置区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 - 流程配置 */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="data">数据选择</TabsTrigger>
              <TabsTrigger value="qc">质量控制</TabsTrigger>
              <TabsTrigger value="alignment">序列比对</TabsTrigger>
              <TabsTrigger value="quantification">表达定量</TabsTrigger>
              <TabsTrigger value="analysis">差异分析</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-4">
              <Card className="resource-card">
                <CardHeader>
                  <CardTitle>数据选择</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">实验类型</label>
                    <Select defaultValue="paired">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paired">双端测序 (Paired-end)</SelectItem>
                        <SelectItem value="single">单端测序 (Single-end)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">原始数据路径</label>
                    <div className="space-y-2">
                      <Input placeholder="/data/transcriptome/sample01_R1.fastq.gz" />
                      <Input placeholder="/data/transcriptome/sample01_R2.fastq.gz" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">参考基因组</label>
                    <Select defaultValue="hg38">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hg38">Human (GRCh38/hg38)</SelectItem>
                        <SelectItem value="hg19">Human (GRCh37/hg19)</SelectItem>
                        <SelectItem value="mm10">Mouse (GRCm38/mm10)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qc" className="space-y-4">
              <Card className="resource-card">
                <CardHeader>
                  <CardTitle>质量控制参数</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">QC工具</label>
                    <Select defaultValue="fastqc">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {analysisTools.qc.map(tool => (
                          <SelectItem key={tool} value={tool.toLowerCase()}>{tool}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">质量阈值</label>
                    <Input defaultValue="20" placeholder="Phred质量分数阈值" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">最小读长</label>
                    <Input defaultValue="50" placeholder="过滤后最小读长" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alignment" className="space-y-4">
              <Card className="resource-card">
                <CardHeader>
                  <CardTitle>序列比对参数</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">比对工具</label>
                    <Select defaultValue="star">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {analysisTools.alignment.map(tool => (
                          <SelectItem key={tool} value={tool.toLowerCase()}>{tool}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">比对线程数</label>
                    <Select defaultValue="16">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8核</SelectItem>
                        <SelectItem value="16">16核</SelectItem>
                        <SelectItem value="32">32核 (最大)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">最大错配率</label>
                    <Input defaultValue="0.04" placeholder="允许的最大错配率" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quantification" className="space-y-4">
              <Card className="resource-card">
                <CardHeader>
                  <CardTitle>表达定量参数</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">定量工具</label>
                    <Select defaultValue="salmon">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {analysisTools.quantification.map(tool => (
                          <SelectItem key={tool} value={tool.toLowerCase()}>{tool}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">定量模式</label>
                    <Select defaultValue="transcript">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transcript">转录本水平</SelectItem>
                        <SelectItem value="gene">基因水平</SelectItem>
                        <SelectItem value="both">两者</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card className="resource-card">
                <CardHeader>
                  <CardTitle>差异分析参数</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">分析方法</label>
                    <Select defaultValue="deseq2">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deseq2">DESeq2</SelectItem>
                        <SelectItem value="edger">edgeR</SelectItem>
                        <SelectItem value="limma">limma-voom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">FDR阈值</label>
                      <Input defaultValue="0.05" placeholder="假发现率" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">FC阈值</label>
                      <Input defaultValue="2" placeholder="倍数变化" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* 右侧 - 资源监控 */}
        <div className="space-y-6">
          {/* 资源配置 */}
          <Card className="resource-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                资源配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">{resourceConfig.cpuCores}核</div>
                <div className="text-sm text-muted-foreground">CPU分配</div>
              </div>

              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-success">{resourceConfig.memory}GB</div>
                <div className="text-sm text-muted-foreground">内存分配</div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-2">计算节点</div>
                <Select defaultValue="auto">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动分配</SelectItem>
                    <SelectItem value="node1">计算节点-1</SelectItem>
                    <SelectItem value="node2">计算节点-2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <div className="text-sm text-muted-foreground mb-1">预计运行时间</div>
                <div className="font-medium text-warning">{resourceConfig.estimatedTime}</div>
              </div>
            </CardContent>
          </Card>

          {/* 任务队列 */}
          <Card className="resource-card">
            <CardHeader>
              <CardTitle>任务队列状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">当前队列位置</span>
                <span className="font-medium">第 3 位</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">前方等待任务</span>
                <span className="font-medium">2 个</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">预计开始时间</span>
                <span className="font-medium">30分钟后</span>
              </div>
            </CardContent>
          </Card>

          {/* 常用模板 */}
          <Card className="resource-card">
            <CardHeader>
              <CardTitle>常用工作流模板</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                标准RNA-seq流程
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                肿瘤转录组分析
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                时间序列分析
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                多因子设计分析
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}