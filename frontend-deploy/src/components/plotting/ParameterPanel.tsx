import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  PlotType, 
  ParameterDefinition, 
  ParameterValue, 
  ParameterLevel,
  PlotParameters 
} from '@bioinformatics-platform/shared-types';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bioinformatics-platform/ui-components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@bioinformatics-platform/ui-components/ui/card';
import { Separator } from '@bioinformatics-platform/ui-components/ui/separator';
import { Badge } from '@bioinformatics-platform/ui-components/ui/badge';
import { Button } from '@bioinformatics-platform/ui-components/ui/button';
import { ScrollArea } from '@bioinformatics-platform/ui-components/ui/scroll-area';
import { Alert, AlertDescription } from '@bioinformatics-platform/ui-components/ui/alert';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@bioinformatics-platform/ui-components/ui/collapsible';

import { Settings, ChevronDown, ChevronRight, Info, AlertTriangle } from 'lucide-react';

import { ParameterControl } from './ParameterControl';
import { ParameterGroup } from './ParameterGroup';

interface ParameterPanelProps {
  plotType: PlotType;
  parameterDefinitions: ParameterDefinition[];
  initialParameters?: PlotParameters;
  onParametersChange: (parameters: PlotParameters) => void;
  onPreview?: (parameters: PlotParameters) => void;
  userLevel?: ParameterLevel;
  disabled?: boolean;
  validationErrors?: Record<string, string>;
}

// 创建动态验证schema
const createValidationSchema = (definitions: ParameterDefinition[]) => {
  const schema: Record<string, any> = {};
  
  definitions.forEach(def => {
    let fieldSchema: any;
    
    switch (def.type) {
      case 'string':
        fieldSchema = z.string();
        if (def.validation?.pattern) {
          fieldSchema = fieldSchema.regex(new RegExp(def.validation.pattern));
        }
        break;
      case 'number':
        fieldSchema = z.number();
        if (def.validation?.min !== undefined) {
          fieldSchema = fieldSchema.min(def.validation.min);
        }
        if (def.validation?.max !== undefined) {
          fieldSchema = fieldSchema.max(def.validation.max);
        }
        break;
      case 'boolean':
        fieldSchema = z.boolean();
        break;
      case 'color':
        fieldSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
        break;
      case 'select':
        if (def.validation?.options) {
          const values = def.validation.options.map(opt => opt.value);
          fieldSchema = z.enum(values as [string, ...string[]]);
        } else {
          fieldSchema = z.string();
        }
        break;
      default:
        fieldSchema = z.any();
    }
    
    if (!def.validation?.required) {
      fieldSchema = fieldSchema.optional();
    }
    
    schema[def.id] = fieldSchema;
  });
  
  return z.object(schema);
};

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  plotType,
  parameterDefinitions,
  initialParameters,
  onParametersChange,
  onPreview,
  userLevel = 'basic',
  disabled = false,
  validationErrors = {}
}) => {
  const [activeLevel, setActiveLevel] = useState<ParameterLevel>(userLevel);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [parameterValues, setParameterValues] = useState<Record<string, any>>({});

  // 根据用户级别过滤参数定义
  const levelOrder: ParameterLevel[] = ['basic', 'advanced', 'expert'];
  const maxLevelIndex = levelOrder.indexOf(userLevel);
  
  const filteredDefinitions = useMemo(() => {
    return parameterDefinitions.filter(def => {
      const defLevelIndex = levelOrder.indexOf(def.level);
      return defLevelIndex <= maxLevelIndex;
    });
  }, [parameterDefinitions, maxLevelIndex]);

  // 按级别分组参数
  const parametersByLevel = useMemo(() => {
    const grouped: Record<ParameterLevel, ParameterDefinition[]> = {
      basic: [],
      advanced: [],
      expert: []
    };
    
    filteredDefinitions.forEach(def => {
      grouped[def.level].push(def);
    });
    
    return grouped;
  }, [filteredDefinitions]);

  // 按分组组织参数
  const parametersByGroup = useMemo(() => {
    const level = activeLevel;
    const params = parametersByLevel[level];
    const grouped: Record<string, ParameterDefinition[]> = {};
    
    params.forEach(def => {
      const group = def.group || 'General';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(def);
    });
    
    // 按order排序
    Object.keys(grouped).forEach(group => {
      grouped[group].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    
    return grouped;
  }, [parametersByLevel, activeLevel]);

  // 验证schema
  const validationSchema = useMemo(() => {
    return createValidationSchema(filteredDefinitions);
  }, [filteredDefinitions]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid }
  } = useForm({
    resolver: zodResolver(validationSchema),
    mode: 'onChange'
  });

  // 初始化参数值
  useEffect(() => {
    if (initialParameters) {
      const values: Record<string, any> = {};
      initialParameters.parameters.forEach(param => {
        values[param.parameterId] = param.value;
      });
      setParameterValues(values);
      
      // 设置表单值
      Object.keys(values).forEach(key => {
        setValue(key, values[key]);
      });
    } else {
      // 使用默认值
      const defaults: Record<string, any> = {};
      filteredDefinitions.forEach(def => {
        defaults[def.id] = def.defaultValue;
      });
      setParameterValues(defaults);
      
      Object.keys(defaults).forEach(key => {
        setValue(key, defaults[key]);
      });
    }
  }, [initialParameters, filteredDefinitions, setValue]);

  // 监听表单变化
  const watchedValues = watch();
  
  useEffect(() => {
    setParameterValues(watchedValues);
  }, [watchedValues]);

  // 检查参数依赖关系
  const isParameterVisible = (parameter: ParameterDefinition): boolean => {
    if (!parameter.dependencies) return true;
    
    return parameter.dependencies.every(dep => {
      const depValue = parameterValues[dep.parameter];
      return depValue === dep.condition;
    });
  };

  // 生成参数对象
  const generateParameters = (): PlotParameters => {
    const parameters: ParameterValue[] = filteredDefinitions.map(def => ({
      parameterId: def.id,
      value: parameterValues[def.id] ?? def.defaultValue,
      isValid: !errors[def.id] && !validationErrors[def.id],
      errorMessage: errors[def.id]?.message || validationErrors[def.id]
    }));

    return {
      plotType,
      parameters,
      metadata: {
        title: parameterValues.title || `${plotType} Plot`,
        description: parameterValues.description,
        tags: [plotType, activeLevel]
      }
    };
  };

  // 触发参数变化事件
  useEffect(() => {
    const currentParams = generateParameters();
    onParametersChange(currentParams);
  }, [parameterValues, plotType, activeLevel]);

  // 处理预览
  const handlePreview = () => {
    if (onPreview && isValid) {
      const currentParams = generateParameters();
      onPreview(currentParams);
    }
  };

  // 切换分组折叠状态
  const toggleGroup = (groupName: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    setCollapsedGroups(newCollapsed);
  };

  // 获取级别badge颜色
  const getLevelBadgeVariant = (level: ParameterLevel) => {
    switch (level) {
      case 'basic': return 'default';
      case 'advanced': return 'secondary';
      case 'expert': return 'destructive';
      default: return 'default';
    }
  };

  // 计算错误数量
  const errorCount = Object.keys(errors).length + Object.keys(validationErrors).length;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Plot Parameters</CardTitle>
            <Badge variant="outline">{plotType.replace('_', ' ').toUpperCase()}</Badge>
          </div>
          {errorCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errorCount} errors
            </Badge>
          )}
        </div>
        <CardDescription>
          Configure plot parameters for your {plotType.replace('_', ' ')} visualization
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeLevel} onValueChange={(value) => setActiveLevel(value as ParameterLevel)}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                Basic
                <Badge variant={getLevelBadgeVariant('basic')} className="text-xs">
                  {parametersByLevel.basic.length}
                </Badge>
              </TabsTrigger>
              {maxLevelIndex >= 1 && (
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  Advanced
                  <Badge variant={getLevelBadgeVariant('advanced')} className="text-xs">
                    {parametersByLevel.advanced.length}
                  </Badge>
                </TabsTrigger>
              )}
              {maxLevelIndex >= 2 && (
                <TabsTrigger value="expert" className="flex items-center gap-2">
                  Expert
                  <Badge variant={getLevelBadgeVariant('expert')} className="text-xs">
                    {parametersByLevel.expert.length}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-300px)] px-6">
            <TabsContent value="basic" className="mt-4">
              <ParameterGroupContent
                parametersByGroup={parametersByGroup}
                parameterValues={parameterValues}
                register={register}
                errors={errors}
                validationErrors={validationErrors}
                collapsedGroups={collapsedGroups}
                toggleGroup={toggleGroup}
                isParameterVisible={isParameterVisible}
                disabled={disabled}
              />
            </TabsContent>
            
            <TabsContent value="advanced" className="mt-4">
              <ParameterGroupContent
                parametersByGroup={parametersByGroup}
                parameterValues={parameterValues}
                register={register}
                errors={errors}
                validationErrors={validationErrors}
                collapsedGroups={collapsedGroups}
                toggleGroup={toggleGroup}
                isParameterVisible={isParameterVisible}
                disabled={disabled}
              />
            </TabsContent>
            
            <TabsContent value="expert" className="mt-4">
              <ParameterGroupContent
                parametersByGroup={parametersByGroup}
                parameterValues={parameterValues}
                register={register}
                errors={errors}
                validationErrors={validationErrors}
                collapsedGroups={collapsedGroups}
                toggleGroup={toggleGroup}
                isParameterVisible={isParameterVisible}
                disabled={disabled}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {onPreview && (
          <div className="px-6 py-4 border-t">
            <Button 
              onClick={handlePreview} 
              disabled={!isValid || disabled}
              className="w-full"
            >
              Update Preview
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 参数分组内容组件
interface ParameterGroupContentProps {
  parametersByGroup: Record<string, ParameterDefinition[]>;
  parameterValues: Record<string, any>;
  register: any;
  errors: any;
  validationErrors: Record<string, string>;
  collapsedGroups: Set<string>;
  toggleGroup: (groupName: string) => void;
  isParameterVisible: (parameter: ParameterDefinition) => boolean;
  disabled: boolean;
}

const ParameterGroupContent: React.FC<ParameterGroupContentProps> = ({
  parametersByGroup,
  parameterValues,
  register,
  errors,
  validationErrors,
  collapsedGroups,
  toggleGroup,
  isParameterVisible,
  disabled
}) => {
  return (
    <div className="space-y-4">
      {Object.entries(parametersByGroup).map(([groupName, parameters]) => {
        const visibleParameters = parameters.filter(isParameterVisible);
        if (visibleParameters.length === 0) return null;

        const isCollapsed = collapsedGroups.has(groupName);
        const hasErrors = visibleParameters.some(param => 
          errors[param.id] || validationErrors[param.id]
        );

        return (
          <Collapsible key={groupName} open={!isCollapsed}>
            <CollapsibleTrigger 
              onClick={() => toggleGroup(groupName)}
              className="flex w-full items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{groupName}</span>
                <Badge variant="outline">{visibleParameters.length}</Badge>
                {hasErrors && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                  </Badge>
                )}
              </div>
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-3 pt-3">
              {visibleParameters.map((parameter, index) => (
                <div key={parameter.id}>
                  <ParameterControl
                    parameter={parameter}
                    value={parameterValues[parameter.id]}
                    register={register}
                    error={errors[parameter.id] || validationErrors[parameter.id]}
                    disabled={disabled}
                  />
                  {index < visibleParameters.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};