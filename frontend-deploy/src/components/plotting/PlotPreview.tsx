import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import debounce from 'lodash.debounce';
import { 
  PlotParameters, 
  PlotType, 
  PlotPreviewResponse,
  PreviewConfig 
} from '@bioinformatics-platform/shared-types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@bioinformatics-platform/ui-components/ui/card';
import { Button } from '@bioinformatics-platform/ui-components/ui/button';
import { Badge } from '@bioinformatics-platform/ui-components/ui/badge';
import { Progress } from '@bioinformatics-platform/ui-components/ui/progress';
import { Alert, AlertDescription } from '@bioinformatics-platform/ui-components/ui/alert';
import { Skeleton } from '@bioinformatics-platform/ui-components/ui/skeleton';

import { 
  Eye, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  Zap,
  Maximize2,
  Settings
} from 'lucide-react';

interface PlotPreviewProps {
  parameters: PlotParameters;
  previewData?: any;
  previewConfig?: PreviewConfig;
  onGeneratePreview?: (parameters: PlotParameters) => Promise<PlotPreviewResponse>;
  onDownloadPlot?: (parameters: PlotParameters, format: string) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export const PlotPreview: React.FC<PlotPreviewProps> = ({
  parameters,
  previewData,
  previewConfig = {
    enabled: true,
    debounceMs: 500,
    maxDataPoints: 1000,
    useWebGL: true,
    updateTriggers: ['all']
  },
  onGeneratePreview,
  onDownloadPlot,
  loading = false,
  error,
  className
}) => {
  const [plotData, setPlotData] = useState<any>(null);
  const [plotLayout, setPlotLayout] = useState<any>(null);
  const [plotConfig, setPlotConfig] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // 防抖的预览生成函数
  const debouncedGeneratePreview = useMemo(
    () => debounce(async (params: PlotParameters) => {
      if (!onGeneratePreview || !previewConfig.enabled) return;

      setIsGenerating(true);
      setPreviewError(null);

      try {
        const response = await onGeneratePreview(params);
        if (response.success && response.data) {
          setPlotData(response.data.plotData);
          setPlotLayout(response.data.layout);
          setPlotConfig(response.data.config);
          setLastUpdateTime(new Date());
        } else {
          setPreviewError(response.error || 'Failed to generate preview');
        }
      } catch (err) {
        setPreviewError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsGenerating(false);
      }
    }, previewConfig.debounceMs),
    [onGeneratePreview, previewConfig]
  );

  // 监听参数变化自动更新预览
  useEffect(() => {
    if (previewConfig.enabled && parameters) {
      debouncedGeneratePreview(parameters);
    }
    
    return () => {
      debouncedGeneratePreview.cancel();
    };
  }, [parameters, debouncedGeneratePreview, previewConfig.enabled]);

  // 使用预览数据直接生成图表
  useEffect(() => {
    if (previewData) {
      generatePlotFromData();
    }
  }, [previewData, parameters]);

  const generatePlotFromData = () => {
    if (!previewData || !parameters) return;

    try {
      const { data, layout, config } = generatePlotlyComponents(
        parameters.plotType,
        previewData,
        parameters
      );
      
      setPlotData(data);
      setPlotLayout(layout);
      setPlotConfig(config);
      setLastUpdateTime(new Date());
      setPreviewError(null);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to generate plot');
    }
  };

  // 手动刷新预览
  const handleRefresh = () => {
    if (previewData) {
      generatePlotFromData();
    } else if (onGeneratePreview) {
      debouncedGeneratePreview.cancel();
      debouncedGeneratePreview(parameters);
    }
  };

  // 下载图表
  const handleDownload = (format: string) => {
    if (onDownloadPlot) {
      onDownloadPlot(parameters, format);
    }
  };

  // 获取图表尺寸
  const getPlotDimensions = () => {
    const width = parameters.parameters.find(p => p.parameterId === 'width')?.value || 800;
    const height = parameters.parameters.find(p => p.parameterId === 'height')?.value || 600;
    return { width, height };
  };

  const dimensions = getPlotDimensions();
  const hasData = plotData && plotLayout;
  const showError = error || previewError;
  const showLoading = loading || isGenerating;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <CardTitle>Plot Preview</CardTitle>
            <Badge variant="outline">
              {parameters.plotType.replace('_', ' ').toUpperCase()}
            </Badge>
            {previewConfig.enabled && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Live
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={showLoading}
            >
              <RefreshCw className={`h-4 w-4 ${showLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            {hasData && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload('png')}
                >
                  <Download className="h-4 w-4" />
                  PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload('svg')}
                >
                  <Download className="h-4 w-4" />
                  SVG
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <CardDescription>
            Interactive preview of your {parameters.plotType.replace('_', ' ')} plot
          </CardDescription>
          
          {lastUpdateTime && (
            <span className="text-xs text-muted-foreground">
              Updated: {lastUpdateTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {showError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{showError}</AlertDescription>
          </Alert>
        )}

        {showLoading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating preview...</span>
            </div>
            <Progress value={undefined} className="w-full" />
            <Skeleton className="w-full" style={{ height: dimensions.height }} />
          </div>
        )}

        {hasData && !showLoading && (
          <div className="w-full overflow-hidden rounded-lg border">
            <Plot
              data={plotData}
              layout={{
                ...plotLayout,
                width: Math.min(dimensions.width, 800),
                height: Math.min(dimensions.height, 600),
                margin: { l: 50, r: 50, t: 50, b: 50 },
                showlegend: true,
                responsive: true
              }}
              config={{
                ...plotConfig,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: [
                  'pan2d',
                  'lasso2d',
                  'select2d',
                  'autoScale2d',
                  'hoverClosestCartesian',
                  'hoverCompareCartesian'
                ],
                toImageButtonOptions: {
                  format: 'png',
                  filename: `${parameters.plotType}_preview`,
                  height: dimensions.height,
                  width: dimensions.width,
                  scale: 2
                }
              }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </div>
        )}

        {!hasData && !showLoading && !showError && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Preview Available</h3>
            <p className="text-muted-foreground mb-4">
              Configure your plot parameters to generate a preview
            </p>
            {onGeneratePreview && (
              <Button onClick={() => debouncedGeneratePreview(parameters)}>
                Generate Preview
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 生成Plotly组件的辅助函数
const generatePlotlyComponents = (
  plotType: PlotType,
  data: any,
  parameters: PlotParameters
) => {
  const paramMap = parameters.parameters.reduce((acc, param) => {
    acc[param.parameterId] = param.value;
    return acc;
  }, {} as Record<string, any>);

  switch (plotType) {
    case 'volcano_plot':
      return generateVolcanoPlot(data, paramMap);
    case 'scatter_plot':
      return generateScatterPlot(data, paramMap);
    case 'umap_plot':
      return generateUMAPPlot(data, paramMap);
    case 'heatmap':
      return generateHeatmap(data, paramMap);
    case 'box_plot':
      return generateBoxPlot(data, paramMap);
    case 'bar_plot':
      return generateBarPlot(data, paramMap);
    default:
      return generateDefaultPlot(data, paramMap);
  }
};

// 火山图生成函数
const generateVolcanoPlot = (data: any, params: Record<string, any>) => {
  const { log2FC, pValue, geneNames } = data;
  
  const log2FCThreshold = params.log2FCThreshold || 1;
  const pValueThreshold = params.pValueThreshold || 0.05;
  
  // 分类点
  const upregulated = [];
  const downregulated = [];
  const nonsignificant = [];
  
  for (let i = 0; i < log2FC.length; i++) {
    const fc = log2FC[i];
    const p = pValue[i];
    const point = {
      x: fc,
      y: -Math.log10(p),
      text: geneNames ? geneNames[i] : `Gene ${i}`,
      marker: { size: params.pointSize || 6 }
    };
    
    if (Math.abs(fc) >= log2FCThreshold && p <= pValueThreshold) {
      if (fc > 0) {
        upregulated.push(point);
      } else {
        downregulated.push(point);
      }
    } else {
      nonsignificant.push(point);
    }
  }

  const plotData = [
    {
      x: upregulated.map(p => p.x),
      y: upregulated.map(p => p.y),
      text: upregulated.map(p => p.text),
      mode: 'markers',
      type: 'scatter',
      name: 'Upregulated',
      marker: { 
        color: params.upregulatedColor || '#ff6b6b',
        size: params.pointSize || 6,
        opacity: params.pointAlpha || 0.7
      }
    },
    {
      x: downregulated.map(p => p.x),
      y: downregulated.map(p => p.y),
      text: downregulated.map(p => p.text),
      mode: 'markers',
      type: 'scatter',
      name: 'Downregulated',
      marker: { 
        color: params.downregulatedColor || '#4ecdc4',
        size: params.pointSize || 6,
        opacity: params.pointAlpha || 0.7
      }
    },
    {
      x: nonsignificant.map(p => p.x),
      y: nonsignificant.map(p => p.y),
      text: nonsignificant.map(p => p.text),
      mode: 'markers',
      type: 'scatter',
      name: 'Non-significant',
      marker: { 
        color: params.nonsignificantColor || '#95a5a6',
        size: params.pointSize || 6,
        opacity: params.pointAlpha || 0.5
      }
    }
  ];

  const layout = {
    title: params.title || 'Volcano Plot',
    xaxis: { 
      title: params.xLabel || 'Log2 Fold Change',
      showgrid: params.showGrid !== false,
      gridcolor: params.gridColor || '#f0f0f0'
    },
    yaxis: { 
      title: params.yLabel || '-Log10 P-value',
      showgrid: params.showGrid !== false,
      gridcolor: params.gridColor || '#f0f0f0'
    },
    hovermode: 'closest',
    showlegend: params.showLegend !== false,
    plot_bgcolor: params.backgroundColor || 'white',
    paper_bgcolor: params.backgroundColor || 'white'
  };

  // 添加阈值线
  if (params.showThresholdLines !== false) {
    layout.shapes = [
      // 垂直阈值线
      {
        type: 'line',
        x0: log2FCThreshold,
        x1: log2FCThreshold,
        y0: 0,
        y1: Math.max(...(upregulated.concat(downregulated, nonsignificant).map(p => p.y) || [1])),
        line: { color: params.thresholdLineColor || '#666', dash: 'dash' }
      },
      {
        type: 'line',
        x0: -log2FCThreshold,
        x1: -log2FCThreshold,
        y0: 0,
        y1: Math.max(...(upregulated.concat(downregulated, nonsignificant).map(p => p.y) || [1])),
        line: { color: params.thresholdLineColor || '#666', dash: 'dash' }
      },
      // 水平阈值线
      {
        type: 'line',
        x0: Math.min(...log2FC) - 1,
        x1: Math.max(...log2FC) + 1,
        y0: -Math.log10(pValueThreshold),
        y1: -Math.log10(pValueThreshold),
        line: { color: params.thresholdLineColor || '#666', dash: 'dash' }
      }
    ];
  }

  const config = {
    responsive: true,
    displayModeBar: true
  };

  return { data: plotData, layout, config };
};

// 散点图生成函数
const generateScatterPlot = (data: any, params: Record<string, any>) => {
  const plotData = [{
    x: data.x,
    y: data.y,
    mode: 'markers',
    type: 'scatter',
    marker: {
      size: params.pointSize || 8,
      color: data.color || params.pointColor || '#1f77b4',
      opacity: params.pointAlpha || 0.7
    },
    text: data.labels
  }];

  const layout = {
    title: params.title || 'Scatter Plot',
    xaxis: { title: params.xLabel || 'X Axis' },
    yaxis: { title: params.yLabel || 'Y Axis' },
    showlegend: params.showLegend !== false
  };

  return { data: plotData, layout, config: { responsive: true } };
};

// UMAP图生成函数
const generateUMAPPlot = (data: any, params: Record<string, any>) => {
  const plotData = [{
    x: data.umap1,
    y: data.umap2,
    mode: 'markers',
    type: 'scatter',
    marker: {
      size: params.pointSize || 6,
      color: data.clusters || data.colors,
      colorscale: params.colorPalette || 'Viridis',
      opacity: params.pointAlpha || 0.7,
      colorbar: { title: params.colorBy || 'Cluster' }
    },
    text: data.cellNames || data.labels
  }];

  const layout = {
    title: params.title || 'UMAP Plot',
    xaxis: { 
      title: params.showAxes !== false ? (params.xLabel || 'UMAP 1') : '',
      showticklabels: params.showAxes !== false
    },
    yaxis: { 
      title: params.showAxes !== false ? (params.yLabel || 'UMAP 2') : '',
      showticklabels: params.showAxes !== false
    },
    showlegend: params.showLegend !== false
  };

  return { data: plotData, layout, config: { responsive: true } };
};

// 热图生成函数
const generateHeatmap = (data: any, params: Record<string, any>) => {
  const plotData = [{
    z: data.matrix,
    x: data.columnNames,
    y: data.rowNames,
    type: 'heatmap',
    colorscale: params.colormap || 'RdBu',
    showscale: params.showColorbar !== false,
    colorbar: { title: params.colorbarLabel || 'Expression' }
  }];

  const layout = {
    title: params.title || 'Heatmap',
    xaxis: { 
      title: params.xLabel || '',
      showticklabels: params.showColumnNames !== false
    },
    yaxis: { 
      title: params.yLabel || '',
      showticklabels: params.showRowNames !== false
    }
  };

  return { data: plotData, layout, config: { responsive: true } };
};

// 箱线图生成函数
const generateBoxPlot = (data: any, params: Record<string, any>) => {
  const plotData = data.groups.map((group: any, index: number) => ({
    y: group.values,
    name: group.name,
    type: 'box',
    boxpoints: 'outliers'
  }));

  const layout = {
    title: params.title || 'Box Plot',
    xaxis: { title: params.xLabel || 'Groups' },
    yaxis: { title: params.yLabel || 'Values' },
    showlegend: params.showLegend !== false
  };

  return { data: plotData, layout, config: { responsive: true } };
};

// 柱状图生成函数
const generateBarPlot = (data: any, params: Record<string, any>) => {
  const plotData = [{
    x: data.categories,
    y: data.values,
    type: 'bar',
    marker: { color: params.barColor || '#1f77b4' }
  }];

  const layout = {
    title: params.title || 'Bar Plot',
    xaxis: { title: params.xLabel || 'Categories' },
    yaxis: { title: params.yLabel || 'Values' },
    showlegend: params.showLegend !== false
  };

  return { data: plotData, layout, config: { responsive: true } };
};

// 默认图表生成函数
const generateDefaultPlot = (data: any, params: Record<string, any>) => {
  const plotData = [{
    x: data.x || [1, 2, 3, 4, 5],
    y: data.y || [1, 4, 2, 8, 5],
    type: 'scatter',
    mode: 'lines+markers'
  }];

  const layout = {
    title: params.title || 'Plot',
    xaxis: { title: params.xLabel || 'X Axis' },
    yaxis: { title: params.yLabel || 'Y Axis' }
  };

  return { data: plotData, layout, config: { responsive: true } };
};