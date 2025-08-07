# 交互式绘图系统 | Interactive Plotting System

## 📊 系统概述 | System Overview

本系统实现了「前端参数交互→后端计算绘图→结果实时反馈」的完整闭环，专为生物信息学组学分析场景设计，支持火山图、UMAP图、热图等多种可视化类型。

This system implements a complete "frontend parameter interaction → backend plot generation → real-time feedback" workflow, specifically designed for bioinformatics omics analysis scenarios, supporting various visualizations like volcano plots, UMAP plots, heatmaps, etc.

## 🏗️ 系统架构 | Architecture

### 核心组件 | Core Components

```
Frontend (React + TypeScript)
├── ParameterPanel          # 分层参数面板
├── PlotPreview            # 实时预览组件  
├── TemplateManager        # 参数模板管理
├── AdvancedCodeEditor     # 高级代码编辑器
└── BatchPlottingDialog    # 批量绘图对话框

Backend (Node.js + TypeScript)
├── PlottingController     # 绘图控制器
├── PlottingService       # 绘图服务
├── PlotConfigService     # 参数配置服务
└── Python/R Scripts      # 实际绘图脚本

Shared Types
└── plotting-types.ts     # 共享类型定义
```

### 技术栈 | Tech Stack

**前端 Frontend:**
- React 18 + TypeScript
- TanStack Query (数据获取)
- React Hook Form + Zod (表单验证)
- Plotly.js (实时预览)
- Tailwind CSS + shadcn/ui (UI组件)

**后端 Backend:**
- Node.js + Express + TypeScript
- MongoDB (数据存储)
- Python/R (绘图引擎)
- Matplotlib/Seaborn/ggplot2 (绘图库)

## ✨ 核心功能 | Key Features

### 1. 分层参数管理 | Layered Parameter Management

支持三个用户级别，参数按复杂度分层显示：

- **基础级 Basic**: 标题、颜色、阈值等核心参数
- **高级级 Advanced**: 透明度、字体、网格等进阶参数  
- **专家级 Expert**: DPI、自定义代码等专业参数

```typescript
// 参数定义示例
{
  id: 'log2FCThreshold',
  name: 'Log2FC Threshold', 
  type: 'number',
  level: 'basic',           // 参数级别
  defaultValue: 1,
  validation: { min: 0, max: 10 },
  group: 'Thresholds'       // 参数分组
}
```

### 2. 实时预览系统 | Real-time Preview

- **防抖更新**: 500ms防抖，避免频繁请求
- **轻量渲染**: 使用Plotly.js前端渲染，响应速度1-2秒
- **参数联动**: 参数变化时自动更新预览
- **错误提示**: 实时参数校验和错误反馈

```typescript
// 预览配置
const previewConfig = {
  enabled: true,
  debounceMs: 500,
  maxDataPoints: 1000,
  useWebGL: true,
  updateTriggers: ['log2FCThreshold', 'pValueThreshold', 'pointSize']
};
```

### 3. 参数校验与联动 | Parameter Validation & Dependencies

```typescript
// 参数依赖示例：只有启用基因标签时才显示标签相关参数
{
  id: 'maxLabels',
  name: 'Max Labels', 
  dependencies: [{ parameter: 'showGeneLabels', condition: true }]
}

// 验证规则示例
validation: {
  rules: [
    {
      parameters: ['log2FCThreshold'],
      rule: '$log2FCThreshold > 0',
      message: 'Log2FC threshold must be positive'
    }
  ]
}
```

### 4. 参数模板系统 | Parameter Template System

- **模板保存**: 将常用参数组合保存为模板
- **一键复用**: 快速应用保存的参数配置
- **模板分享**: 支持公开模板供其他用户使用
- **使用统计**: 跟踪模板使用频率

```typescript
// 模板接口
interface ParameterTemplate {
  id: string;
  name: string;
  description: string;
  plotType: PlotType;
  parameters: PlotParameters;
  isPublic: boolean;
  tags: string[];
  usageCount: number;
}
```

### 5. 批量绘图功能 | Batch Plotting

支持对多个数据集或参数变化进行批量绘图：

```typescript
// 批量任务示例
const batchTask = {
  plotType: 'volcano_plot',
  baseParameters: {...},      // 基础参数
  variations: [
    {
      id: 'sample1',
      name: 'Sample 1 vs Control',
      parameterOverrides: [     // 参数覆盖
        { parameterId: 'title', value: 'Sample 1 Analysis' }
      ],
      inputData: { dataPath: '/data/sample1.csv' }
    }
  ]
};
```

### 6. 高级代码模式 | Advanced Code Mode

为专业用户提供直接编辑Python/R代码的能力：

- **代码同步**: 参数控件与代码实时同步
- **语法高亮**: Monaco Editor提供专业代码编辑体验
- **代码模板**: 预置各种图表类型的代码模板
- **错误检查**: 代码语法和逻辑错误检查

## 🚀 快速开始 | Quick Start

### 1. 环境准备 | Environment Setup

```bash
# 1. 安装Node.js依赖
npm install

# 2. 安装Python绘图依赖
cd scripts/plotting
pip install -r requirements.txt

# 3. 配置环境变量
cp apps/backend/.env.example apps/backend/.env
# 编辑 .env 文件，配置数据库等

# 4. 启动开发服务器
npm run dev
```

### 2. 基础使用流程 | Basic Usage Flow

1. **选择图表类型**: 在图表类型面板选择要创建的可视化类型
2. **配置参数**: 在参数面板中调整各种绘图参数
3. **实时预览**: 查看右侧预览面板中的实时效果
4. **生成图表**: 点击"Generate Plot"按钮生成高质量图表
5. **下载结果**: 下载PNG、SVG、PDF等格式的图表文件

### 3. 高级功能使用 | Advanced Features

#### 创建参数模板

```typescript
// 1. 在参数面板配置好参数
// 2. 切换到Templates标签
// 3. 点击"Save Template"
const template = {
  name: "期刊投稿火山图模板",
  description: "适用于期刊投稿的火山图参数配置",
  plotType: "volcano_plot",
  parameters: currentParameters,
  tags: ["publication", "volcano", "journal"]
};
```

#### 批量绘图

```typescript
// 1. 配置基础参数
// 2. 定义参数变化
// 3. 提交批量任务
const variations = [
  { name: "Control vs Treatment 1", dataPath: "/data/group1.csv" },
  { name: "Control vs Treatment 2", dataPath: "/data/group2.csv" }
];
```

## 📋 API文档 | API Documentation

### 前端API | Frontend APIs

```typescript
// 获取绘图配置
plottingApi.getConfigurations(): Promise<PlotConfiguration[]>

// 生成预览
plottingApi.generatePreview(parameters: PlotParameters): Promise<PlotPreviewResponse>

// 生成图表
plottingApi.generatePlot(parameters: PlotParameters): Promise<PlotGenerationResponse>

// 模板管理
plottingApi.getTemplates(query?: TemplateQuery): Promise<ParameterTemplate[]>
plottingApi.saveTemplate(template: ParameterTemplate): Promise<ParameterTemplate>
```

### 后端API | Backend APIs

```http
# 获取绘图配置
GET /api/v1/plotting/configurations

# 参数验证
POST /api/v1/plotting/validate
Content-Type: application/json
{
  "plotType": "volcano_plot",
  "parameters": [...]
}

# 生成预览
POST /api/v1/plotting/preview

# 生成图表
POST /api/v1/plotting/generate

# 下载图表
GET /api/v1/plotting/download/{taskId}/{format}
```

## 🔧 配置说明 | Configuration

### 环境变量 | Environment Variables

```bash
# 后端配置
PORT=3001
MONGODB_URI=mongodb://localhost:27017/bioinformatics
PLOTS_OUTPUT_DIR=./data/plots
PYTHON_PATH=python3
R_PATH=Rscript

# Python/R脚本路径
PLOTTING_SCRIPTS_DIR=./scripts/plotting
```

### 绘图参数配置 | Plot Parameter Configuration

参数配置在`plotConfigService`中定义，支持动态添加新的图表类型：

```typescript
// 添加新图表类型
class PlotConfigService {
  private createNewPlotConfig(): PlotConfiguration {
    return {
      id: 'new_plot_type',
      plotType: 'new_plot_type',
      parameterDefinitions: [...],
      defaultParameters: {...},
      previewConfig: {...},
      validation: {...}
    };
  }
}
```

## 🎨 支持的图表类型 | Supported Plot Types

### 1. 火山图 Volcano Plot
- **用途**: 差异表达基因分析
- **特色参数**: log2FC阈值、p值阈值、基因标签
- **输出格式**: PNG、SVG、PDF

### 2. UMAP图 UMAP Plot  
- **用途**: 单细胞数据降维可视化
- **特色参数**: 聚类着色、密度等高线、点大小
- **支持数据**: 细胞聚类、基因表达

### 3. 热图 Heatmap
- **用途**: 基因表达矩阵可视化
- **特色参数**: 聚类方法、颜色映射、树状图
- **支持聚类**: 行聚类、列聚类、双向聚类

### 4. 散点图 Scatter Plot
- **用途**: 通用二维数据可视化
- **特色参数**: 点大小、颜色、趋势线
- **交互功能**: 缩放、选择、悬停

### 5. 箱线图 Box Plot
- **用途**: 分组数据分布比较
- **特色参数**: 异常值显示、置信区间
- **统计功能**: 自动计算统计量

## 🔌 扩展开发 | Extension Development

### 添加新图表类型 | Adding New Plot Types

1. **定义类型**:
```typescript
// 在shared-types中添加新类型
export type PlotType = 'volcano_plot' | 'new_plot_type';
```

2. **配置参数**:
```typescript
// 在plotConfigService中添加配置
private createNewPlotConfig(): PlotConfiguration {
  // 定义参数、验证规则等
}
```

3. **实现绘图脚本**:
```python
# 在Python脚本中添加绘图函数
def _generate_new_plot(self, data: pd.DataFrame):
    # 实现具体绘图逻辑
```

4. **添加预览组件**:
```typescript
// 在PlotPreview中添加预览逻辑
const generateNewPlotPreview = (data: any, params: Record<string, any>) => {
  // 生成Plotly.js预览数据
};
```

### 自定义参数控件 | Custom Parameter Controls

```typescript
// 扩展ParameterControl组件
case 'custom_type':
  return (
    <CustomParameterControl
      parameter={parameter}
      value={value}
      onChange={handleValueChange}
    />
  );
```

## 🐛 故障排除 | Troubleshooting

### 常见问题 | Common Issues

1. **Python依赖问题**:
```bash
# 确保Python环境正确
python3 --version
pip install -r scripts/plotting/requirements.txt
```

2. **内存不足**:
```bash
# 调整Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

3. **绘图脚本错误**:
```bash
# 检查脚本执行权限
chmod +x scripts/plotting/generate_plot.py

# 手动测试脚本
python3 scripts/plotting/generate_plot.py test_config.json
```

### 性能优化 | Performance Optimization

1. **预览优化**: 减少预览数据点数量，启用WebGL渲染
2. **批量处理**: 使用队列系统处理大量绘图任务  
3. **缓存策略**: 缓存常用的预览数据和参数配置
4. **资源清理**: 定期清理临时文件和过期任务

## 📈 性能指标 | Performance Metrics

- **预览响应时间**: < 2秒 (1000个数据点)
- **图表生成时间**: < 30秒 (大型热图)
- **内存使用**: < 500MB (单个绘图任务)
- **并发支持**: 10个同时绘图任务

## 🤝 贡献指南 | Contributing

1. Fork项目仓库
2. 创建功能分支: `git checkout -b feature/new-plot-type`
3. 提交更改: `git commit -am 'Add new plot type'`
4. 推送分支: `git push origin feature/new-plot-type`  
5. 创建Pull Request

## 📄 许可证 | License

MIT License - 详见 LICENSE 文件

---

**开发团队**: Bioinformatics Platform Team  
**更新时间**: 2024年12月
**版本**: v1.0.0