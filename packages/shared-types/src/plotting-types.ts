// 绘图系统相关类型定义
// Types for flexible plotting parameter system

/**
 * 绘图类型枚举
 * Supported plot types for omics analysis
 */
export type PlotType = 
  | 'volcano_plot'        // 火山图
  | 'scatter_plot'        // 散点图
  | 'umap_plot'          // UMAP降维图
  | 'tsne_plot'          // t-SNE降维图
  | 'heatmap'            // 热图
  | 'box_plot'           // 箱线图
  | 'violin_plot'        // 小提琴图
  | 'bar_plot'           // 柱状图
  | 'line_plot'          // 折线图
  | 'pca_plot'           // PCA主成分分析图
  | 'pathway_plot'       // 通路富集图
  | 'gene_expression_plot'; // 基因表达图

/**
 * 参数层级类型
 * Parameter hierarchy for different user levels
 */
export type ParameterLevel = 'basic' | 'advanced' | 'expert';

/**
 * 参数数据类型
 * Parameter value types
 */
export type ParameterValueType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'color' 
  | 'range' 
  | 'select'
  | 'multiselect'
  | 'file';

/**
 * 参数定义接口
 * Parameter definition interface
 */
export interface ParameterDefinition {
  id: string;
  name: string;
  description: string;
  type: ParameterValueType;
  level: ParameterLevel;
  defaultValue: any;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    options?: Array<{ value: any; label: string }>;
  };
  dependencies?: {
    parameter: string;
    condition: any;
  }[];
  group?: string;
  order?: number;
}

/**
 * 参数值接口
 * Parameter value interface
 */
export interface ParameterValue {
  parameterId: string;
  value: any;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * 绘图参数集合接口
 * Plot parameters collection interface
 */
export interface PlotParameters {
  plotType: PlotType;
  taskId?: string;
  parameters: ParameterValue[];
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
}

/**
 * 基础绘图参数
 * Basic plotting parameters for all plot types
 */
export interface BaseplotParameters {
  // 标题和标签
  title: string;
  subtitle?: string;
  xLabel: string;
  yLabel: string;
  
  // 图像尺寸
  width: number;
  height: number;
  dpi: number;
  
  // 主题和样式
  theme: 'default' | 'minimal' | 'classic' | 'dark' | 'publication';
  backgroundColor: string;
  
  // 字体设置
  fontFamily: string;
  fontSize: number;
  titleFontSize: number;
  labelFontSize: number;
  
  // 图例
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right' | 'none';
  
  // 网格
  showGrid: boolean;
  gridColor: string;
  gridAlpha: number;
}

/**
 * 火山图特定参数
 * Volcano plot specific parameters
 */
export interface VolcanoPlotParameters extends BaseplotParameters {
  // 阈值设置
  log2FCThreshold: number;
  pValueThreshold: number;
  adjustedPValue: boolean;
  
  // 点的样式
  pointSize: number;
  pointAlpha: number;
  
  // 颜色设置
  upregulatedColor: string;
  downregulatedColor: string;
  nonsignificantColor: string;
  
  // 基因标签
  showGeneLabels: boolean;
  maxLabels: number;
  labelFontSize: number;
  labelCriteria: 'top_significant' | 'custom_genes' | 'all_significant';
  customGenes?: string[];
  
  // 阈值线
  showThresholdLines: boolean;
  thresholdLineColor: string;
  thresholdLineStyle: 'solid' | 'dashed' | 'dotted';
}

/**
 * UMAP图特定参数
 * UMAP plot specific parameters
 */
export interface UMAPPlotParameters extends BaseplotParameters {
  // 点的样式
  pointSize: number;
  pointAlpha: number;
  
  // 颜色映射
  colorBy: 'cluster' | 'gene_expression' | 'metadata' | 'custom';
  colorColumn?: string;
  colorPalette: string;
  
  // 聚类显示
  showClusters: boolean;
  clusterLabels: boolean;
  clusterLabelSize: number;
  
  // 密度等高线
  showDensity: boolean;
  densityAlpha: number;
  
  // 坐标轴
  showAxes: boolean;
  axisLabels: boolean;
}

/**
 * 热图特定参数
 * Heatmap specific parameters
 */
export interface HeatmapParameters extends BaseplotParameters {
  // 聚类设置
  clusterRows: boolean;
  clusterColumns: boolean;
  clusterMethod: 'ward' | 'complete' | 'average' | 'single';
  distanceMetric: 'euclidean' | 'correlation' | 'manhattan' | 'cosine';
  
  // 颜色映射
  colormap: string;
  centerColormap: boolean;
  vmin?: number;
  vmax?: number;
  
  // 注释
  showRowNames: boolean;
  showColumnNames: boolean;
  rowNamesFontSize: number;
  columnNamesFontSize: number;
  
  // 树状图
  showDendrogram: boolean;
  dendrogramRatio: number;
  
  // 色条
  showColorbar: boolean;
  colorbarLabel: string;
}

/**
 * 参数模板接口
 * Parameter template interface
 */
export interface ParameterTemplate {
  id: string;
  name: string;
  description: string;
  plotType: PlotType;
  parameters: PlotParameters;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  usageCount: number;
}

/**
 * 绘图任务接口
 * Plotting task interface
 */
export interface PlottingTask {
  id: string;
  plotType: PlotType;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  parameters: PlotParameters;
  inputData: {
    taskId?: string;
    dataPath?: string;
    columns?: string[];
  };
  outputFiles: {
    preview?: string;
    highRes?: string;
    svg?: string;
    pdf?: string;
    dataTable?: string;
  };
  previewData?: any; // 用于前端实时预览的轻量数据
  error?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  duration?: number;
}

/**
 * 批量绘图任务接口
 * Batch plotting task interface
 */
export interface BatchPlottingTask {
  id: string;
  name: string;
  plotType: PlotType;
  baseParameters: PlotParameters;
  variations: Array<{
    id: string;
    name: string;
    parameterOverrides: ParameterValue[];
    inputData: any;
  }>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  results: PlottingTask[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 实时预览配置
 * Real-time preview configuration
 */
export interface PreviewConfig {
  enabled: boolean;
  debounceMs: number;
  maxDataPoints: number;
  useWebGL: boolean;
  updateTriggers: string[]; // 哪些参数变化时触发预览更新
}

/**
 * 代码生成配置
 * Code generation configuration
 */
export interface CodeGenerationConfig {
  language: 'python' | 'r';
  framework: 'matplotlib' | 'seaborn' | 'plotly' | 'ggplot2';
  includeComments: boolean;
  includeDataLoading: boolean;
  template?: string;
}

/**
 * 高级代码模式接口
 * Advanced code mode interface
 */
export interface AdvancedCodeMode {
  enabled: boolean;
  language: 'python' | 'r';
  code: string;
  parameters: Record<string, any>;
  lastSyncedAt?: string;
  isModified: boolean;
}

/**
 * 绘图配置管理接口
 * Plot configuration management interface
 */
export interface PlotConfiguration {
  id: string;
  plotType: PlotType;
  parameterDefinitions: ParameterDefinition[];
  defaultParameters: PlotParameters;
  previewConfig: PreviewConfig;
  codeGenerationConfig: CodeGenerationConfig;
  validation: {
    rules: Array<{
      parameters: string[];
      rule: string; // JavaScript expression
      message: string;
    }>;
  };
  metadata: {
    version: string;
    lastUpdated: string;
    supportedBackends: string[];
  };
}

/**
 * API响应类型
 * API response types for plotting system
 */
export interface PlottingAPIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PlotPreviewResponse extends PlottingAPIResponse {
  data: {
    plotData: any; // Plotly.js compatible data
    layout: any;   // Plotly.js layout
    config: any;   // Plotly.js config
  };
}

export interface PlotGenerationResponse extends PlottingAPIResponse {
  data: {
    taskId: string;
    files: {
      preview: string;
      highRes?: string;
      svg?: string;
      pdf?: string;
    };
    parameters: PlotParameters;
    metadata: {
      duration: number;
      backend: string;
      version: string;
    };
  };
}