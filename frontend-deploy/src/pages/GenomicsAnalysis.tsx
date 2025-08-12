import { useState } from "react";
import { 
  GitBranch, 
  Play, 
  Settings, 
  Database, 
  Cpu, 
  Filter,
  Search,
  Save,
  Download,
  Eye,
  Zap,
  Target,
  BarChart3,
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// 基因组分析工作流步骤
const genomicsWorkflowSteps = [
  { id: 'data', name: '数据预处理', icon: Database, status: 'completed' },
  { id: 'alignment', name: '序列比对', icon: Target, status: 'completed' },
  { id: 'preprocessing', name: '比对后处理', icon: Settings, status: 'running' },
  { id: 'variant', name: '变异检测', icon: Search, status: 'queued' },
  { id: 'annotation', name: '变异注释', icon: FileText, status: 'queued' },
  { id: 'filter', name: '变异过滤', icon: Filter, status: 'queued' }
];

// 模拟变异统计数据
const variantStats = {
  totalVariants: 4567892,
  snps: 4123456,
  indels: 398234,
  cnvs: 46202,
  novelVariants: 123567,
  pathogenicVariants: 89
};

// 变异检测工具选项
const variantTools = {
  snp: ['GATK HaplotypeCaller', 'FreeBayes', 'VarScan2', 'Strelka2'],
  cnv: ['CNVnator', 'LUMPY', 'Delly', 'Manta'],
  sv: ['Manta', 'LUMPY', 'BreakDancer', 'GRIDSS']
};

export default function GenomicsAnalysis() {
  const [currentStep, setCurrentStep] = useState('preprocessing');
  const [workflowProgress, setWorkflowProgress] = useState(55);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);

  const getStepStatus = (stepId: string) => {
    const step = genomicsWorkflowSteps.find(s => s.id === stepId);
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
          <h1 className="text-3xl font-bold text-foreground">基因组变异检测</h1>
          <p className="text-muted-foreground">全基因组和外显子组变异分析流程</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Save className="w-4 h-4 mr-2" />
            保存流程
          </Button>
          <Button className="btn-success">
            <Play className="w-4 h-4 mr-2" />
            启动分析
          </Button>
        </div>
      </div>

      {/* 变异统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="resource-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{variantStats.totalVariants.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">总变异数</div>
          </CardContent>
        </Card>
        <Card className="resource-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{variantStats.snps.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">SNPs</div>
          </CardContent>
        </Card>
        <Card className="resource-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{variantStats.indels.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Indels</div>
          </CardContent>
        </Card>
        <Card className="resource-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{variantStats.cnvs.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">CNVs</div>
          </CardContent>
        </Card>
        <Card className="resource-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-info">{variantStats.novelVariants.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">新发变异</div>
          </CardContent>
        </Card>
        <Card className="resource-card border-error/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-error">{variantStats.pathogenicVariants}</div>
            <div className="text-sm text-muted-foreground">致病变异</div>
          </CardContent>
        </Card>
      </div>

      {/* 工作流进度 */}
      <Card className="resource-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            变异检测流程
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 流程图 */}
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {genomicsWorkflowSteps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className={`workflow-node ${getStepStatus(step.id)} ${currentStep === step.id ? 'active' : ''} min-w-max`}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(step.status)}
                      <step.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{step.name}</span>
                    </div>
                  </div>
                  {index < genomicsWorkflowSteps.length - 1 && (
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
                  <span className="text-sm font-medium">当前步骤: GATK 比对后处理</span>
                </div>
                <span className="text-sm text-muted-foreground">运行于计算节点-1</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                正在进行 Base Quality Score Recalibration | 预计剩余: 25分钟 | 内存使用: 64GB
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要配置区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 - 分析配置 */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="data">数据配置</TabsTrigger>
              <TabsTrigger value="variant">变异检测</TabsTrigger>
              <TabsTrigger value="annotation">注释过滤</TabsTrigger>
              <TabsTrigger value="analysis">高级分析</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-4">
              <Card className="resource-card">
                <CardHeader>
                  <CardTitle>数据输入配置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">分析类型</label>
                    <Select defaultValue="wgs">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wgs">全基因组测序 (WGS)</SelectItem>
                        <SelectItem value="wes">外显子组测序 (WES)</SelectItem>
                        <SelectItem value="targeted">靶向测序</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">参考基因组</label>
                    <Select defaultValue="hg38">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hg38">GRCh38/hg38</SelectItem>
                        <SelectItem value="hg19">GRCh37/hg19</SelectItem>
                        <SelectItem value="t2t">T2T-CHM13</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">输入文件类型</label>
                    <Select defaultValue="bam">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bam">BAM 文件 (已比对)</SelectItem>
                        <SelectItem value="fastq">FASTQ 文件 (原始数据)</SelectItem>
                        <SelectItem value="cram">CRAM 文件</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">样本信息文件</label>
                    <Input placeholder="/data/genomics/sample_manifest.csv" />
                    <p className="text-xs text-muted-foreground mt-1">包含样本ID、文件路径和分组信息的CSV文件</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="variant" className="space-y-4">
              <Card className="resource-card">
                <CardHeader>
                  <CardTitle>变异检测参数</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">SNP/Indel 检测工具</label>
                    <Select defaultValue="gatk">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {variantTools.snp.map(tool => (
                          <SelectItem key={tool} value={tool.toLowerCase().replace(/\s/g, '')}>{tool}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">结构变异检测工具</label>
                    <Select defaultValue="manta">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {variantTools.sv.map(tool => (
                          <SelectItem key={tool} value={tool.toLowerCase()}>{tool}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">CNV 检测工具</label>
                    <Select defaultValue="cnvnator">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {variantTools.cnv.map(tool => (
                          <SelectItem key={tool} value={tool.toLowerCase()}>{tool}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">最小质量分数</label>
                      <Input type="number" defaultValue="30" placeholder="QUAL >= 30" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">最小覆盖深度</label>
                      <Input type="number" defaultValue="10" placeholder="DP >= 10" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">变异检测模式</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">SNPs (单核苷酸多态性)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Indels (插入缺失)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">CNVs (拷贝数变异)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">结构变异</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="annotation" className="space-y-4">
              <Card className="resource-card">
                <CardHeader>
                  <CardTitle>变异注释与过滤</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">注释工具</label>
                    <Select defaultValue="vep">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vep">Ensembl VEP</SelectItem>
                        <SelectItem value="annovar">ANNOVAR</SelectItem>
                        <SelectItem value="snpeff">SnpEff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">注释数据库</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">ClinVar (临床意义)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">dbSNP (已知变异)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">gnomAD (人群频率)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">COSMIC (癌症变异)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">OMIM (遗传疾病)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">功能预测工具</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">SIFT (有害性预测)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">PolyPhen-2</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">CADD (病原性评分)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">最大人群频率</label>
                      <Input type="number" defaultValue="0.01" step="0.01" placeholder="< 1%" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">最小CADD分数</label>
                      <Input type="number" defaultValue="15" placeholder=">= 15" />
                    </div>
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
                    <label className="text-sm font-medium mb-2 block">比较分析</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">病例对照关联分析</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">家系分析 (Trio)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">体细胞变异检测</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">报告生成</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">变异统计报告</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">质量控制报告</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">临床解读报告</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">输出格式</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">VCF (标准格式)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">TSV (表格格式)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">MAF (变异注释格式)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* 右侧 - IGV浏览器和资源监控 */}
        <div className="space-y-6">
          {/* IGV 基因组浏览器 */}
          <Card className="resource-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                基因组浏览器
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">IGV 浏览器</p>
                  <p className="text-xs">变异检测完成后可查看</p>
                </div>
              </div>

              <div className="space-y-2">
                <Input placeholder="搜索基因或位点 (如: BRCA1, chr17:43044295)" className="text-sm" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs">chr1</Button>
                  <Button variant="outline" size="sm" className="text-xs">chr2</Button>
                  <Button variant="outline" size="sm" className="text-xs">chrX</Button>
                  <Button variant="outline" size="sm" className="text-xs">chrY</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 计算资源 */}
          <Card className="resource-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                计算资源配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">32核</div>
                <div className="text-sm text-muted-foreground">CPU分配</div>
              </div>

              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-success">128GB</div>
                <div className="text-sm text-muted-foreground">内存分配</div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">预计运行时间</span>
                  <span className="font-medium">4-6小时</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">存储需求</span>
                  <span className="font-medium">~500GB</span>
                </div>
              </div>

              <div className="bg-warning/10 rounded-lg p-3 border border-warning/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium">资源密集型任务</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  建议在低峰期运行以获得最佳性能
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 变异优先级 */}
          <Card className="resource-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                变异优先级
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-error/10 rounded border border-error/20">
                <span className="text-sm font-medium">致病性变异</span>
                <span className="text-xs bg-error text-white px-2 py-1 rounded">高</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-warning/10 rounded border border-warning/20">
                <span className="text-sm font-medium">可能致病</span>
                <span className="text-xs bg-warning text-white px-2 py-1 rounded">中</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-success/10 rounded border border-success/20">
                <span className="text-sm font-medium">良性变异</span>
                <span className="text-xs bg-success text-white px-2 py-1 rounded">低</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}