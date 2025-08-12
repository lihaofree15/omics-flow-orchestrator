import { useState } from "react";
import { 
  BarChart3, 
  Download, 
  Eye, 
  Filter,
  Search,
  Share,
  FileText,
  Image,
  TrendingUp,
  Microscope,
  Dna,
  GitBranch,
  Target,
  Layers,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 模拟分析结果数据
const analysisResults = {
  transcriptome: {
    totalGenes: 18456,
    diffGenes: 2134,
    upregulated: 1156,
    downregulated: 978,
    pathways: 89,
    samples: 24
  },
  singleCell: {
    cells: 7291,
    clusters: 12,
    markers: 856,
    trajectories: 3,
    cellTypes: 8
  },
  genomics: {
    variants: 4567892,
    pathogenic: 89,
    novel: 123567,
    cnvs: 46202,
    samples: 16
  }
};

// 可视化图表类型
const chartTypes = {
  transcriptome: [
    { name: '火山图', type: 'volcano', description: '差异基因可视化' },
    { name: '热图', type: 'heatmap', description: '基因表达聚类' },
    { name: 'MA图', type: 'ma', description: '表达差异分布' },
    { name: 'GO富集', type: 'go', description: '功能富集分析' },
    { name: 'KEGG通路', type: 'kegg', description: '信号通路分析' }
  ],
  singleCell: [
    { name: 'UMAP图', type: 'umap', description: '细胞聚类可视化' },
    { name: 't-SNE图', type: 'tsne', description: '降维可视化' },
    { name: '小提琴图', type: 'violin', description: '基因表达分布' },
    { name: '特征图', type: 'feature', description: '特定基因表达' },
    { name: '轨迹图', type: 'trajectory', description: '细胞发育轨迹' }
  ],
  genomics: [
    { name: 'Circos图', type: 'circos', description: '染色体变异分布' },
    { name: '曼哈顿图', type: 'manhattan', description: 'GWAS关联分析' },
    { name: 'CNV图', type: 'cnv', description: '拷贝数变异' },
    { name: '变异频谱', type: 'spectrum', description: '变异类型统计' }
  ]
};

export default function ResultsVisualization() {
  const [selectedAnalysis, setSelectedAnalysis] = useState('transcriptome');
  const [selectedChart, setSelectedChart] = useState('volcano');

  const getCurrentResults = () => {
    switch (selectedAnalysis) {
      case 'transcriptome':
        return analysisResults.transcriptome;
      case 'singleCell':
        return analysisResults.singleCell;
      case 'genomics':
        return analysisResults.genomics;
      default:
        return analysisResults.transcriptome;
    }
  };

  const getCurrentCharts = () => {
    return chartTypes[selectedAnalysis as keyof typeof chartTypes] || chartTypes.transcriptome;
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'transcriptome':
        return Dna;
      case 'singleCell':
        return Microscope;
      case 'genomics':
        return GitBranch;
      default:
        return BarChart3;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">结果展示</h1>
          <p className="text-muted-foreground">多组学分析结果可视化与数据导出</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Share className="w-4 h-4 mr-2" />
            分享结果
          </Button>
          <Button className="btn-primary">
            <Download className="w-4 h-4 mr-2" />
            导出报告
          </Button>
        </div>
      </div>

      {/* 分析类型选择 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['transcriptome', 'singleCell', 'genomics'] as const).map((type) => {
          const Icon = getAnalysisIcon(type);
          const results = analysisResults[type];
          const isSelected = selectedAnalysis === type;
          
          return (
            <Card 
              key={type}
              className={`resource-card cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedAnalysis(type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <h3 className="font-semibold">
                    {type === 'transcriptome' ? '转录组分析' : 
                     type === 'singleCell' ? '单细胞分析' : '基因组分析'}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {type === 'transcriptome' && (
                    <>
                      <div>
                        <div className="text-lg font-bold text-primary">{analysisResults.transcriptome.diffGenes}</div>
                        <div className="text-xs text-muted-foreground">差异基因</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-success">{analysisResults.transcriptome.pathways}</div>
                        <div className="text-xs text-muted-foreground">富集通路</div>
                      </div>
                    </>
                  )}
                  
                  {type === 'singleCell' && (
                    <>
                      <div>
                        <div className="text-lg font-bold text-primary">{analysisResults.singleCell.clusters}</div>
                        <div className="text-xs text-muted-foreground">细胞簇</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-success">{analysisResults.singleCell.cellTypes}</div>
                        <div className="text-xs text-muted-foreground">细胞类型</div>
                      </div>
                    </>
                  )}
                  
                  {type === 'genomics' && (
                    <>
                      <div>
                        <div className="text-lg font-bold text-error">{analysisResults.genomics.pathogenic}</div>
                        <div className="text-xs text-muted-foreground">致病变异</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-warning">{analysisResults.genomics.cnvs}</div>
                        <div className="text-xs text-muted-foreground">CNVs</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧 - 图表选择和配置 */}
        <Card className="resource-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              可视化选项
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 搜索栏 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="搜索图表类型..." className="pl-10" />
            </div>

            {/* 图表类型列表 */}
            <div className="space-y-2">
              {getCurrentCharts().map((chart) => (
                <div
                  key={chart.type}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedChart === chart.type 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedChart(chart.type)}
                >
                  <div className="font-medium text-sm">{chart.name}</div>
                  <div className="text-xs text-muted-foreground">{chart.description}</div>
                </div>
              ))}
            </div>

            {/* 图表配置 */}
            <div className="pt-4 border-t border-border space-y-3">
              <h4 className="font-medium text-sm">图表设置</h4>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">颜色主题</label>
                <Select defaultValue="default">
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">默认</SelectItem>
                    <SelectItem value="viridis">Viridis</SelectItem>
                    <SelectItem value="plasma">Plasma</SelectItem>
                    <SelectItem value="cool">Cool</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">图表尺寸</label>
                <Select defaultValue="medium">
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">小 (800x600)</SelectItem>
                    <SelectItem value="medium">中 (1200x900)</SelectItem>
                    <SelectItem value="large">大 (1600x1200)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">导出格式</label>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="text-xs">PNG</Button>
                  <Button variant="outline" size="sm" className="text-xs">PDF</Button>
                  <Button variant="outline" size="sm" className="text-xs">SVG</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 右侧 - 主要可视化区域 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 图表展示区 */}
          <Card className="resource-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  {getCurrentCharts().find(c => c.type === selectedChart)?.name || '图表预览'}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Image className="w-4 h-4 mr-1" />
                    导出
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    全屏
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    {getCurrentCharts().find(c => c.type === selectedChart)?.name}
                  </h3>
                  <p className="text-sm">
                    {getCurrentCharts().find(c => c.type === selectedChart)?.description}
                  </p>
                  <p className="text-xs mt-2 opacity-70">
                    基于 {selectedAnalysis === 'transcriptome' ? '转录组' : 
                          selectedAnalysis === 'singleCell' ? '单细胞' : '基因组'} 分析数据生成
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 数据表格和统计 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 关键指标 */}
            <Card className="resource-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  关键指标
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAnalysis === 'transcriptome' && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">总基因数</span>
                      <span className="font-medium">{analysisResults.transcriptome.totalGenes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">差异基因数</span>
                      <span className="font-medium text-primary">{analysisResults.transcriptome.diffGenes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">上调基因</span>
                      <span className="font-medium text-success">{analysisResults.transcriptome.upregulated.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">下调基因</span>
                      <span className="font-medium text-accent">{analysisResults.transcriptome.downregulated.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">富集通路</span>
                      <span className="font-medium text-warning">{analysisResults.transcriptome.pathways}</span>
                    </div>
                  </div>
                )}

                {selectedAnalysis === 'singleCell' && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">细胞总数</span>
                      <span className="font-medium">{analysisResults.singleCell.cells.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">细胞簇数</span>
                      <span className="font-medium text-primary">{analysisResults.singleCell.clusters}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">标记基因</span>
                      <span className="font-medium text-success">{analysisResults.singleCell.markers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">细胞类型</span>
                      <span className="font-medium text-accent">{analysisResults.singleCell.cellTypes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">发育轨迹</span>
                      <span className="font-medium text-warning">{analysisResults.singleCell.trajectories}</span>
                    </div>
                  </div>
                )}

                {selectedAnalysis === 'genomics' && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">总变异数</span>
                      <span className="font-medium">{analysisResults.genomics.variants.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">致病变异</span>
                      <span className="font-medium text-error">{analysisResults.genomics.pathogenic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">新发变异</span>
                      <span className="font-medium text-primary">{analysisResults.genomics.novel.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">CNV数量</span>
                      <span className="font-medium text-warning">{analysisResults.genomics.cnvs.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">样本数量</span>
                      <span className="font-medium text-success">{analysisResults.genomics.samples}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 数据下载 */}
            <Card className="resource-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  数据下载
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  分析报告 (PDF)
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  结果数据 (CSV)
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Image className="w-4 h-4 mr-2" />
                  图表合集 (ZIP)
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Layers className="w-4 h-4 mr-2" />
                  原始数据 (HDF5)
                </Button>
                
                <div className="pt-3 border-t border-border">
                  <Button className="w-full btn-primary">
                    <Download className="w-4 h-4 mr-2" />
                    下载完整结果包
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}