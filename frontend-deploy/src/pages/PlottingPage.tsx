import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlotType, 
  PlotParameters, 
  ParameterDefinition,
  PlotConfiguration,
  ParameterTemplate,
  ParameterLevel 
} from '@bioinformatics-platform/shared-types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@bioinformatics-platform/ui-components/ui/card';
import { Button } from '@bioinformatics-platform/ui-components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bioinformatics-platform/ui-components/ui/select';
import { Badge } from '@bioinformatics-platform/ui-components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bioinformatics-platform/ui-components/ui/tabs';
import { Separator } from '@bioinformatics-platform/ui-components/ui/separator';
import { Alert, AlertDescription } from '@bioinformatics-platform/ui-components/ui/alert';
import { Skeleton } from '@bioinformatics-platform/ui-components/ui/skeleton';

import { 
  Settings, 
  Palette, 
  Download, 
  Save, 
  Upload, 
  Layers,
  Code2,
  Sparkles,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

import { ParameterPanel } from '../components/plotting/ParameterPanel';
import { PlotPreview } from '../components/plotting/PlotPreview';
import { TemplateManager } from '../components/plotting/TemplateManager';
import { AdvancedCodeEditor } from '../components/plotting/AdvancedCodeEditor';
import { BatchPlottingDialog } from '../components/plotting/BatchPlottingDialog';

import { plotConfigService } from '../services/plotConfigService';
import { plottingApi } from '../services/api/plottingApi';

export const PlottingPage: React.FC = () => {
  // 状态管理
  const [selectedPlotType, setSelectedPlotType] = useState<PlotType>('volcano_plot');
  const [currentParameters, setCurrentParameters] = useState<PlotParameters | null>(null);
  const [userLevel, setUserLevel] = useState<ParameterLevel>('basic');
  const [activeTab, setActiveTab] = useState('parameters');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  // 获取绘图配置
  const { data: plotConfigurations, isLoading: configLoading } = useQuery({
    queryKey: ['plot-configurations'],
    queryFn: plottingApi.getConfigurations
  });

  // 获取当前图表类型的配置
  const { data: currentConfig, isLoading: currentConfigLoading } = useQuery({
    queryKey: ['plot-configuration', selectedPlotType],
    queryFn: () => plottingApi.getConfiguration(selectedPlotType),
    enabled: !!selectedPlotType
  });

  // 获取参数模板
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['plot-templates', selectedPlotType],
    queryFn: () => plottingApi.getTemplates({ plotType: selectedPlotType }),
    enabled: !!selectedPlotType
  });

  // 参数验证mutation
  const validateParametersMutation = useMutation({
    mutationFn: plottingApi.validateParameters,
    onSuccess: (result) => {
      if (!result.data.isValid) {
        setValidationErrors(result.data.errors);
      } else {
        setValidationErrors({});
      }
    }
  });

  // 生成预览mutation
  const generatePreviewMutation = useMutation({
    mutationFn: plottingApi.generatePreview,
    onError: (error) => {
      console.error('Preview generation failed:', error);
    }
  });

  // 生成图表mutation
  const generatePlotMutation = useMutation({
    mutationFn: plottingApi.generatePlot,
    onSuccess: (result) => {
      // 处理图表生成成功
      console.log('Plot generation started:', result.data.taskId);
    },
    onError: (error) => {
      console.error('Plot generation failed:', error);
    }
  });

  // 初始化默认参数
  useEffect(() => {
    if (currentConfig && !currentParameters) {
      setCurrentParameters(currentConfig.defaultParameters);
    }
  }, [currentConfig, currentParameters]);

  // 处理图表类型变化
  const handlePlotTypeChange = (newPlotType: PlotType) => {
    setSelectedPlotType(newPlotType);
    setCurrentParameters(null); // 清空当前参数，触发重新加载
    setValidationErrors({});
  };

  // 处理参数变化
  const handleParametersChange = (newParameters: PlotParameters) => {
    setCurrentParameters(newParameters);
    
    // 实时验证参数
    if (newParameters.parameters.length > 0) {
      validateParametersMutation.mutate(newParameters);
    }
  };

  // 处理预览生成
  const handlePreviewGeneration = async (parameters: PlotParameters) => {
    try {
      await generatePreviewMutation.mutateAsync(parameters);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  // 处理图表生成
  const handlePlotGeneration = async () => {
    if (!currentParameters) return;
    
    try {
      await generatePlotMutation.mutateAsync(currentParameters);
    } catch (error) {
      console.error('Failed to generate plot:', error);
    }
  };

  // 处理模板应用
  const handleTemplateApply = (template: ParameterTemplate) => {
    setCurrentParameters(template.parameters);
    setActiveTab('parameters');
  };

  // 获取可用的图表类型
  const availablePlotTypes = plotConfigurations?.data || [];

  // 渲染主要内容
  const renderMainContent = () => {
    if (configLoading || currentConfigLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      );
    }

    if (!currentConfig || !currentParameters) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please select a plot type to configure parameters.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：参数配置和模板管理 */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="parameters" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Parameters
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="parameters">
              <ParameterPanel
                plotType={selectedPlotType}
                parameterDefinitions={currentConfig.parameterDefinitions}
                initialParameters={currentParameters}
                onParametersChange={handleParametersChange}
                onPreview={handlePreviewGeneration}
                userLevel={userLevel}
                validationErrors={validationErrors}
              />
            </TabsContent>

            <TabsContent value="templates">
              <TemplateManager
                plotType={selectedPlotType}
                currentParameters={currentParameters}
                templates={templates?.data || []}
                onTemplateApply={handleTemplateApply}
                isLoading={templatesLoading}
              />
            </TabsContent>

            <TabsContent value="advanced">
              <AdvancedCodeEditor
                plotType={selectedPlotType}
                parameters={currentParameters}
                onParametersChange={handleParametersChange}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* 右侧：实时预览 */}
        <div>
          <PlotPreview
            parameters={currentParameters}
            onGeneratePreview={handlePreviewGeneration}
            loading={generatePreviewMutation.isPending}
            error={generatePreviewMutation.error?.message}
            className="h-full"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="h-8 w-8" />
            Interactive Plotting
          </h1>
          <p className="text-muted-foreground">
            Create and customize omics visualizations with real-time preview
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* 用户级别选择 */}
          <Select value={userLevel} onValueChange={(value) => setUserLevel(value as ParameterLevel)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Basic
                </div>
              </SelectItem>
              <SelectItem value="advanced">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Advanced
                </div>
              </SelectItem>
              <SelectItem value="expert">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  Expert
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* 生成图表按钮 */}
          <Button 
            onClick={handlePlotGeneration}
            disabled={!currentParameters || Object.keys(validationErrors).length > 0 || generatePlotMutation.isPending}
            className="flex items-center gap-2"
          >
            {generatePlotMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Plot
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 图表类型选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Plot Type Selection
          </CardTitle>
          <CardDescription>
            Choose the type of visualization you want to create
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {availablePlotTypes.map((plotType) => (
              <Button
                key={plotType}
                variant={selectedPlotType === plotType ? "default" : "outline"}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => handlePlotTypeChange(plotType)}
              >
                <div className="text-sm font-medium">
                  {plotType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                {selectedPlotType === plotType && (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 状态指示器 */}
      {validationErrors && Object.keys(validationErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please fix the following parameter errors before generating the plot:
            <ul className="mt-2 space-y-1">
              {Object.entries(validationErrors).map(([param, error]) => (
                <li key={param} className="text-sm">
                  • {param}: {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {generatePlotMutation.isSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Plot generation started successfully! You can check the progress in the task panel.
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* 主要内容区域 */}
      {renderMainContent()}

      {/* 批量绘图对话框 */}
      <BatchPlottingDialog
        plotType={selectedPlotType}
        baseParameters={currentParameters}
        isOpen={false} // 这里可以添加状态控制
        onClose={() => {}}
      />
    </div>
  );
};