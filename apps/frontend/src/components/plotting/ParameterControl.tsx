import React, { useState } from 'react';
import { ParameterDefinition } from '@bioinformatics-platform/shared-types';
import { HexColorPicker } from 'react-colorful';

import { Label } from '@bioinformatics-platform/ui-components/ui/label';
import { Input } from '@bioinformatics-platform/ui-components/ui/input';
import { Textarea } from '@bioinformatics-platform/ui-components/ui/textarea';
import { Switch } from '@bioinformatics-platform/ui-components/ui/switch';
import { Slider } from '@bioinformatics-platform/ui-components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bioinformatics-platform/ui-components/ui/select';
import { Button } from '@bioinformatics-platform/ui-components/ui/button';
import { Badge } from '@bioinformatics-platform/ui-components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@bioinformatics-platform/ui-components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@bioinformatics-platform/ui-components/ui/tooltip';
import { Alert, AlertDescription } from '@bioinformatics-platform/ui-components/ui/alert';

import { Info, AlertCircle, Palette, Upload } from 'lucide-react';

interface ParameterControlProps {
  parameter: ParameterDefinition;
  value: any;
  register: any;
  error?: any;
  disabled?: boolean;
  onChange?: (value: any) => void;
}

export const ParameterControl: React.FC<ParameterControlProps> = ({
  parameter,
  value,
  register,
  error,
  disabled = false,
  onChange
}) => {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const handleValueChange = (newValue: any) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  const renderControl = () => {
    switch (parameter.type) {
      case 'string':
        if (parameter.description?.includes('multiline') || parameter.id.includes('description')) {
          return (
            <Textarea
              {...register(parameter.id)}
              placeholder={parameter.description}
              disabled={disabled}
              className={error ? 'border-destructive' : ''}
              rows={3}
            />
          );
        }
        return (
          <Input
            {...register(parameter.id)}
            type="text"
            placeholder={parameter.description}
            disabled={disabled}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'number':
        const hasRange = parameter.validation?.min !== undefined && parameter.validation?.max !== undefined;
        
        if (hasRange && (parameter.validation.max - parameter.validation.min) <= 100) {
          // 使用滑块用于小范围数值
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {parameter.validation.min}
                </span>
                <span className="text-sm font-medium">
                  {value || parameter.defaultValue}
                </span>
                <span className="text-sm text-muted-foreground">
                  {parameter.validation.max}
                </span>
              </div>
              <Slider
                {...register(parameter.id)}
                min={parameter.validation.min}
                max={parameter.validation.max}
                step={parameter.validation.step || 1}
                value={[value || parameter.defaultValue]}
                onValueChange={(values) => handleValueChange(values[0])}
                disabled={disabled}
                className={error ? 'accent-destructive' : ''}
              />
            </div>
          );
        }
        
        return (
          <Input
            {...register(parameter.id, { valueAsNumber: true })}
            type="number"
            min={parameter.validation?.min}
            max={parameter.validation?.max}
            step={parameter.validation?.step || 'any'}
            placeholder={parameter.description}
            disabled={disabled}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              {...register(parameter.id)}
              checked={value || parameter.defaultValue}
              onCheckedChange={handleValueChange}
              disabled={disabled}
            />
            <span className="text-sm text-muted-foreground">
              {value || parameter.defaultValue ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );

      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-12 h-8 p-0 border-2"
                  style={{ backgroundColor: value || parameter.defaultValue }}
                  disabled={disabled}
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3">
                <HexColorPicker
                  color={value || parameter.defaultValue}
                  onChange={(newColor) => {
                    handleValueChange(newColor);
                    if (register) {
                      register(parameter.id).onChange({ target: { value: newColor } });
                    }
                  }}
                />
                <div className="mt-2">
                  <Input
                    value={value || parameter.defaultValue}
                    onChange={(e) => {
                      handleValueChange(e.target.value);
                      if (register) {
                        register(parameter.id).onChange(e);
                      }
                    }}
                    placeholder="#000000"
                    disabled={disabled}
                  />
                </div>
              </PopoverContent>
            </Popover>
            <Input
              {...register(parameter.id)}
              type="text"
              value={value || parameter.defaultValue}
              placeholder="#000000"
              disabled={disabled}
              className={`flex-1 ${error ? 'border-destructive' : ''}`}
              onChange={(e) => handleValueChange(e.target.value)}
            />
          </div>
        );

      case 'select':
        return (
          <Select
            value={value || parameter.defaultValue}
            onValueChange={handleValueChange}
            disabled={disabled}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${parameter.name}`} />
            </SelectTrigger>
            <SelectContent>
              {parameter.validation?.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        const selectedValues = value || parameter.defaultValue || [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((selectedValue: any) => {
                const option = parameter.validation?.options?.find(opt => opt.value === selectedValue);
                return (
                  <Badge
                    key={selectedValue}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      const newValues = selectedValues.filter((v: any) => v !== selectedValue);
                      handleValueChange(newValues);
                    }}
                  >
                    {option?.label || selectedValue} ×
                  </Badge>
                );
              })}
            </div>
            <Select
              onValueChange={(selectedValue) => {
                if (!selectedValues.includes(selectedValue)) {
                  const newValues = [...selectedValues, selectedValue];
                  handleValueChange(newValues);
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger className={error ? 'border-destructive' : ''}>
                <SelectValue placeholder={`Add ${parameter.name}`} />
              </SelectTrigger>
              <SelectContent>
                {parameter.validation?.options?.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    disabled={selectedValues.includes(option.value)}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'range':
        const rangeValue = value || parameter.defaultValue || [0, 100];
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Min: {rangeValue[0]}
              </span>
              <span className="text-sm text-muted-foreground">
                Max: {rangeValue[1]}
              </span>
            </div>
            <Slider
              min={parameter.validation?.min || 0}
              max={parameter.validation?.max || 100}
              step={parameter.validation?.step || 1}
              value={rangeValue}
              onValueChange={handleValueChange}
              disabled={disabled}
              className={`${error ? 'accent-destructive' : ''} range-slider`}
            />
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <Input
              {...register(parameter.id)}
              type="file"
              accept={parameter.validation?.pattern}
              disabled={disabled}
              className={error ? 'border-destructive' : ''}
            />
            {value && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span>{typeof value === 'string' ? value : value.name}</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            {...register(parameter.id)}
            type="text"
            placeholder={parameter.description}
            disabled={disabled}
            className={error ? 'border-destructive' : ''}
          />
        );
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'basic': return 'default';
      case 'advanced': return 'secondary';
      case 'expert': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-2">
      {/* 参数标签和信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={parameter.id} className="text-sm font-medium">
            {parameter.name}
          </Label>
          <Badge variant={getLevelBadgeVariant(parameter.level)} className="text-xs">
            {parameter.level}
          </Badge>
          {parameter.validation?.required && (
            <span className="text-destructive">*</span>
          )}
        </div>
        
        {parameter.description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                  <Info className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-80">
                <p>{parameter.description}</p>
                {parameter.validation && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {parameter.validation.min !== undefined && (
                      <div>Min: {parameter.validation.min}</div>
                    )}
                    {parameter.validation.max !== undefined && (
                      <div>Max: {parameter.validation.max}</div>
                    )}
                    {parameter.validation.pattern && (
                      <div>Pattern: {parameter.validation.pattern}</div>
                    )}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* 参数控件 */}
      <div className="w-full">
        {renderControl()}
      </div>

      {/* 错误信息 */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {typeof error === 'string' ? error : error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* 默认值提示 */}
      {!error && parameter.defaultValue !== undefined && (
        <div className="text-xs text-muted-foreground">
          Default: {typeof parameter.defaultValue === 'object' 
            ? JSON.stringify(parameter.defaultValue) 
            : parameter.defaultValue.toString()}
        </div>
      )}
    </div>
  );
};