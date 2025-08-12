import { 
  PlotType,
  ParameterDefinition,
  PlotConfiguration,
  PlotParameters,
  ParameterLevel
} from '@bioinformatics-platform/shared-types';

/**
 * 绘图配置管理服务
 * Plot configuration management service
 */
export class PlotConfigService {
  private static instance: PlotConfigService;
  private configurations: Map<PlotType, PlotConfiguration> = new Map();

  private constructor() {
    this.initializeConfigurations();
  }

  public static getInstance(): PlotConfigService {
    if (!PlotConfigService.instance) {
      PlotConfigService.instance = new PlotConfigService();
    }
    return PlotConfigService.instance;
  }

  /**
   * 获取指定图表类型的配置
   * Get configuration for specific plot type
   */
  public getConfiguration(plotType: PlotType): PlotConfiguration | undefined {
    return this.configurations.get(plotType);
  }

  /**
   * 获取参数定义
   * Get parameter definitions
   */
  public getParameterDefinitions(plotType: PlotType): ParameterDefinition[] {
    const config = this.configurations.get(plotType);
    return config?.parameterDefinitions || [];
  }

  /**
   * 获取默认参数
   * Get default parameters
   */
  public getDefaultParameters(plotType: PlotType): PlotParameters {
    const config = this.configurations.get(plotType);
    return config?.defaultParameters || {
      plotType,
      parameters: []
    };
  }

  /**
   * 验证参数
   * Validate parameters
   */
  public validateParameters(plotType: PlotType, parameters: PlotParameters): { isValid: boolean; errors: Record<string, string> } {
    const config = this.configurations.get(plotType);
    if (!config) {
      return { isValid: false, errors: { general: 'Unknown plot type' } };
    }

    const errors: Record<string, string> = {};
    const paramMap = parameters.parameters.reduce((acc, param) => {
      acc[param.parameterId] = param.value;
      return acc;
    }, {} as Record<string, any>);

    // 验证必需参数
    config.parameterDefinitions.forEach(def => {
      if (def.validation?.required && !paramMap[def.id]) {
        errors[def.id] = `${def.name} is required`;
      }

      const value = paramMap[def.id];
      if (value !== undefined && value !== null) {
        // 验证数值范围
        if (def.type === 'number' && def.validation) {
          if (def.validation.min !== undefined && value < def.validation.min) {
            errors[def.id] = `${def.name} must be at least ${def.validation.min}`;
          }
          if (def.validation.max !== undefined && value > def.validation.max) {
            errors[def.id] = `${def.name} must not exceed ${def.validation.max}`;
          }
        }

        // 验证字符串模式
        if (def.type === 'string' && def.validation?.pattern) {
          const regex = new RegExp(def.validation.pattern);
          if (!regex.test(value)) {
            errors[def.id] = `${def.name} format is invalid`;
          }
        }

        // 验证选择项
        if (def.type === 'select' && def.validation?.options) {
          const validValues = def.validation.options.map(opt => opt.value);
          if (!validValues.includes(value)) {
            errors[def.id] = `${def.name} must be one of: ${validValues.join(', ')}`;
          }
        }
      }
    });

    // 验证自定义规则
    config.validation.rules.forEach(rule => {
      const ruleParams = rule.parameters.map(p => paramMap[p]);
      try {
        // 简单的规则评估 - 在实际应用中可能需要更安全的评估方式
        const result = eval(rule.rule.replace(/\$(\w+)/g, (match, paramName) => {
          const index = rule.parameters.indexOf(paramName);
          return index >= 0 ? JSON.stringify(ruleParams[index]) : 'null';
        }));
        
        if (!result) {
          errors[rule.parameters[0]] = rule.message;
        }
      } catch (e) {
        console.warn('Rule evaluation failed:', rule.rule, e);
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * 初始化所有图表类型的配置
   * Initialize configurations for all plot types
   */
  private initializeConfigurations(): void {
    this.configurations.set('volcano_plot', this.createVolcanoPlotConfig());
    this.configurations.set('scatter_plot', this.createScatterPlotConfig());
    this.configurations.set('umap_plot', this.createUMAPPlotConfig());
    this.configurations.set('heatmap', this.createHeatmapConfig());
    this.configurations.set('box_plot', this.createBoxPlotConfig());
    this.configurations.set('bar_plot', this.createBarPlotConfig());
    // 添加更多图表类型配置...
  }

  /**
   * 创建火山图配置
   * Create volcano plot configuration
   */
  private createVolcanoPlotConfig(): PlotConfiguration {
    const parameterDefinitions: ParameterDefinition[] = [
      // 基础参数
      {
        id: 'title',
        name: 'Title',
        description: 'Plot title',
        type: 'string',
        level: 'basic',
        defaultValue: 'Volcano Plot',
        group: 'General',
        order: 1,
        validation: { required: true }
      },
      {
        id: 'xLabel',
        name: 'X-axis Label',
        description: 'Label for X-axis',
        type: 'string',
        level: 'basic',
        defaultValue: 'Log2 Fold Change',
        group: 'General',
        order: 2
      },
      {
        id: 'yLabel',
        name: 'Y-axis Label',
        description: 'Label for Y-axis',
        type: 'string',
        level: 'basic',
        defaultValue: '-Log10 P-value',
        group: 'General',
        order: 3
      },
      {
        id: 'width',
        name: 'Width',
        description: 'Plot width in pixels',
        type: 'number',
        level: 'basic',
        defaultValue: 800,
        group: 'Dimensions',
        order: 1,
        validation: { min: 400, max: 2000 }
      },
      {
        id: 'height',
        name: 'Height',
        description: 'Plot height in pixels',
        type: 'number',
        level: 'basic',
        defaultValue: 600,
        group: 'Dimensions',
        order: 2,
        validation: { min: 300, max: 1500 }
      },

      // 阈值设置
      {
        id: 'log2FCThreshold',
        name: 'Log2FC Threshold',
        description: 'Fold change threshold for significance',
        type: 'number',
        level: 'basic',
        defaultValue: 1,
        group: 'Thresholds',
        order: 1,
        validation: { min: 0, max: 10, step: 0.1 }
      },
      {
        id: 'pValueThreshold',
        name: 'P-value Threshold',
        description: 'P-value threshold for significance',
        type: 'number',
        level: 'basic',
        defaultValue: 0.05,
        group: 'Thresholds',
        order: 2,
        validation: { min: 0.001, max: 1, step: 0.001 }
      },
      {
        id: 'adjustedPValue',
        name: 'Use Adjusted P-value',
        description: 'Whether to use adjusted p-value (FDR)',
        type: 'boolean',
        level: 'advanced',
        defaultValue: false,
        group: 'Thresholds',
        order: 3
      },

      // 点样式
      {
        id: 'pointSize',
        name: 'Point Size',
        description: 'Size of the points',
        type: 'number',
        level: 'basic',
        defaultValue: 6,
        group: 'Appearance',
        order: 1,
        validation: { min: 1, max: 20 }
      },
      {
        id: 'pointAlpha',
        name: 'Point Transparency',
        description: 'Transparency of the points (0-1)',
        type: 'number',
        level: 'advanced',
        defaultValue: 0.7,
        group: 'Appearance',
        order: 2,
        validation: { min: 0, max: 1, step: 0.1 }
      },

      // 颜色设置
      {
        id: 'upregulatedColor',
        name: 'Upregulated Color',
        description: 'Color for upregulated genes',
        type: 'color',
        level: 'basic',
        defaultValue: '#ff6b6b',
        group: 'Colors',
        order: 1
      },
      {
        id: 'downregulatedColor',
        name: 'Downregulated Color',
        description: 'Color for downregulated genes',
        type: 'color',
        level: 'basic',
        defaultValue: '#4ecdc4',
        group: 'Colors',
        order: 2
      },
      {
        id: 'nonsignificantColor',
        name: 'Non-significant Color',
        description: 'Color for non-significant genes',
        type: 'color',
        level: 'basic',
        defaultValue: '#95a5a6',
        group: 'Colors',
        order: 3
      },

      // 基因标签
      {
        id: 'showGeneLabels',
        name: 'Show Gene Labels',
        description: 'Whether to show gene labels on the plot',
        type: 'boolean',
        level: 'advanced',
        defaultValue: false,
        group: 'Labels',
        order: 1
      },
      {
        id: 'maxLabels',
        name: 'Max Labels',
        description: 'Maximum number of gene labels to show',
        type: 'number',
        level: 'advanced',
        defaultValue: 20,
        group: 'Labels',
        order: 2,
        validation: { min: 1, max: 100 },
        dependencies: [{ parameter: 'showGeneLabels', condition: true }]
      },
      {
        id: 'labelCriteria',
        name: 'Label Criteria',
        description: 'Criteria for selecting genes to label',
        type: 'select',
        level: 'advanced',
        defaultValue: 'top_significant',
        group: 'Labels',
        order: 3,
        validation: {
          options: [
            { value: 'top_significant', label: 'Top Significant' },
            { value: 'custom_genes', label: 'Custom Gene List' },
            { value: 'all_significant', label: 'All Significant' }
          ]
        },
        dependencies: [{ parameter: 'showGeneLabels', condition: true }]
      },

      // 主题和样式
      {
        id: 'theme',
        name: 'Theme',
        description: 'Plot theme',
        type: 'select',
        level: 'advanced',
        defaultValue: 'default',
        group: 'Theme',
        order: 1,
        validation: {
          options: [
            { value: 'default', label: 'Default' },
            { value: 'minimal', label: 'Minimal' },
            { value: 'classic', label: 'Classic' },
            { value: 'dark', label: 'Dark' },
            { value: 'publication', label: 'Publication' }
          ]
        }
      },
      {
        id: 'showGrid',
        name: 'Show Grid',
        description: 'Whether to show grid lines',
        type: 'boolean',
        level: 'advanced',
        defaultValue: true,
        group: 'Theme',
        order: 2
      },
      {
        id: 'showLegend',
        name: 'Show Legend',
        description: 'Whether to show the legend',
        type: 'boolean',
        level: 'basic',
        defaultValue: true,
        group: 'Theme',
        order: 3
      },

      // 专家级参数
      {
        id: 'dpi',
        name: 'DPI',
        description: 'Resolution in dots per inch',
        type: 'number',
        level: 'expert',
        defaultValue: 300,
        group: 'Advanced',
        order: 1,
        validation: { min: 72, max: 600 }
      },
      {
        id: 'fontFamily',
        name: 'Font Family',
        description: 'Font family for text',
        type: 'string',
        level: 'expert',
        defaultValue: 'Arial',
        group: 'Advanced',
        order: 2
      }
    ];

    const defaultParameters: PlotParameters = {
      plotType: 'volcano_plot',
      parameters: parameterDefinitions.map(def => ({
        parameterId: def.id,
        value: def.defaultValue,
        isValid: true
      }))
    };

    return {
      id: 'volcano_plot',
      plotType: 'volcano_plot',
      parameterDefinitions,
      defaultParameters,
      previewConfig: {
        enabled: true,
        debounceMs: 500,
        maxDataPoints: 1000,
        useWebGL: true,
        updateTriggers: ['log2FCThreshold', 'pValueThreshold', 'pointSize', 'upregulatedColor', 'downregulatedColor']
      },
      codeGenerationConfig: {
        language: 'python',
        framework: 'matplotlib',
        includeComments: true,
        includeDataLoading: true
      },
      validation: {
        rules: [
          {
            parameters: ['log2FCThreshold'],
            rule: '$log2FCThreshold > 0',
            message: 'Log2FC threshold must be positive'
          },
          {
            parameters: ['pValueThreshold'],
            rule: '$pValueThreshold > 0 && $pValueThreshold <= 1',
            message: 'P-value threshold must be between 0 and 1'
          }
        ]
      },
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        supportedBackends: ['python', 'r']
      }
    };
  }

  /**
   * 创建散点图配置
   * Create scatter plot configuration
   */
  private createScatterPlotConfig(): PlotConfiguration {
    const parameterDefinitions: ParameterDefinition[] = [
      {
        id: 'title',
        name: 'Title',
        description: 'Plot title',
        type: 'string',
        level: 'basic',
        defaultValue: 'Scatter Plot',
        group: 'General',
        order: 1
      },
      {
        id: 'xLabel',
        name: 'X-axis Label',
        description: 'Label for X-axis',
        type: 'string',
        level: 'basic',
        defaultValue: 'X Values',
        group: 'General',
        order: 2
      },
      {
        id: 'yLabel',
        name: 'Y-axis Label',
        description: 'Label for Y-axis',
        type: 'string',
        level: 'basic',
        defaultValue: 'Y Values',
        group: 'General',
        order: 3
      },
      {
        id: 'pointSize',
        name: 'Point Size',
        description: 'Size of the points',
        type: 'number',
        level: 'basic',
        defaultValue: 8,
        group: 'Appearance',
        order: 1,
        validation: { min: 1, max: 20 }
      },
      {
        id: 'pointColor',
        name: 'Point Color',
        description: 'Color of the points',
        type: 'color',
        level: 'basic',
        defaultValue: '#1f77b4',
        group: 'Appearance',
        order: 2
      }
    ];

    return {
      id: 'scatter_plot',
      plotType: 'scatter_plot',
      parameterDefinitions,
      defaultParameters: {
        plotType: 'scatter_plot',
        parameters: parameterDefinitions.map(def => ({
          parameterId: def.id,
          value: def.defaultValue,
          isValid: true
        }))
      },
      previewConfig: {
        enabled: true,
        debounceMs: 300,
        maxDataPoints: 5000,
        useWebGL: true,
        updateTriggers: ['pointSize', 'pointColor']
      },
      codeGenerationConfig: {
        language: 'python',
        framework: 'matplotlib',
        includeComments: true,
        includeDataLoading: true
      },
      validation: { rules: [] },
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        supportedBackends: ['python', 'r']
      }
    };
  }

  /**
   * 创建UMAP图配置
   * Create UMAP plot configuration
   */
  private createUMAPPlotConfig(): PlotConfiguration {
    const parameterDefinitions: ParameterDefinition[] = [
      {
        id: 'title',
        name: 'Title',
        description: 'Plot title',
        type: 'string',
        level: 'basic',
        defaultValue: 'UMAP Plot',
        group: 'General',
        order: 1
      },
      {
        id: 'pointSize',
        name: 'Point Size',
        description: 'Size of the points',
        type: 'number',
        level: 'basic',
        defaultValue: 6,
        group: 'Appearance',
        order: 1,
        validation: { min: 1, max: 15 }
      },
      {
        id: 'colorBy',
        name: 'Color By',
        description: 'What to color points by',
        type: 'select',
        level: 'basic',
        defaultValue: 'cluster',
        group: 'Colors',
        order: 1,
        validation: {
          options: [
            { value: 'cluster', label: 'Cluster' },
            { value: 'gene_expression', label: 'Gene Expression' },
            { value: 'metadata', label: 'Metadata' },
            { value: 'custom', label: 'Custom' }
          ]
        }
      },
      {
        id: 'colorPalette',
        name: 'Color Palette',
        description: 'Color palette for the plot',
        type: 'select',
        level: 'advanced',
        defaultValue: 'Viridis',
        group: 'Colors',
        order: 2,
        validation: {
          options: [
            { value: 'Viridis', label: 'Viridis' },
            { value: 'Plasma', label: 'Plasma' },
            { value: 'Inferno', label: 'Inferno' },
            { value: 'Magma', label: 'Magma' },
            { value: 'Cividis', label: 'Cividis' }
          ]
        }
      }
    ];

    return {
      id: 'umap_plot',
      plotType: 'umap_plot',
      parameterDefinitions,
      defaultParameters: {
        plotType: 'umap_plot',
        parameters: parameterDefinitions.map(def => ({
          parameterId: def.id,
          value: def.defaultValue,
          isValid: true
        }))
      },
      previewConfig: {
        enabled: true,
        debounceMs: 400,
        maxDataPoints: 10000,
        useWebGL: true,
        updateTriggers: ['pointSize', 'colorBy', 'colorPalette']
      },
      codeGenerationConfig: {
        language: 'python',
        framework: 'matplotlib',
        includeComments: true,
        includeDataLoading: true
      },
      validation: { rules: [] },
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        supportedBackends: ['python', 'r']
      }
    };
  }

  // 添加其他图表类型的配置方法...
  private createHeatmapConfig(): PlotConfiguration {
    // 热图配置实现
    return {} as PlotConfiguration;
  }

  private createBoxPlotConfig(): PlotConfiguration {
    // 箱线图配置实现
    return {} as PlotConfiguration;
  }

  private createBarPlotConfig(): PlotConfiguration {
    // 柱状图配置实现
    return {} as PlotConfiguration;
  }
}

// 导出单例实例
export const plotConfigService = PlotConfigService.getInstance();