import { useState, useEffect } from "react";
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
  ArrowRight,
  Folder,
  FileText,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import ProjectSelector from "./ProjectSelector";
import { useProjects } from "@/hooks/useProjects";
import { useProjectFiles } from "@/hooks/useFiles";
import { Project, DataFile, AnalysisJob } from "@/types";

interface AnalysisWorkflowProps {
  workflowType: 'transcriptome' | 'single-cell' | 'genomics';
  workflowSteps: Array<{
    id: string;
    name: string;
    icon: any;
    status: 'completed' | 'running' | 'queued' | 'failed';
  }>;
  analysisTools: Record<string, string[]>;
  onStartAnalysis?: (params: any) => void;
}

export default function AnalysisWorkflow({
  workflowType,
  workflowSteps,
  analysisTools,
  onStartAnalysis
}: AnalysisWorkflowProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(workflowSteps[0]?.id || '');
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [analysisParams, setAnalysisParams] = useState<Record<string, any>>({});
  const [jobName, setJobName] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // 计算资源配置
  const [resourceConfig, setResourceConfig] = useState({
    cpuCores: 16,
    memory: 64,
    estimatedTime: '2-3小时',
    computeNode: 'auto'
  });

  // Fetch project files when project is selected
  const { data: projectFiles = [] } = useProjectFiles(selectedProjectId);

  // Filter files by type based on workflow
  const getRelevantFiles = (files: DataFile[]) => {
    const relevantTypes = {
      transcriptome: ['fastq', 'fasta'],
      'single-cell': ['fastq', 'fasta'],
      genomics: ['fastq', 'fasta', 'bam', 'sam', 'vcf']
    };
    
    return files.filter(file => 
      relevantTypes[workflowType]?.includes(file.type)
    );
  };

  const relevantFiles = getRelevantFiles(projectFiles);

  const getStepStatus = (stepId: string) => {
    const step = workflowSteps.find(s => s.id === stepId);
    return step?.status || 'queued';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'queued':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleFileSelection = (fileId: string, checked: boolean) => {
    setSelectedFiles(prev => 
      checked 
        ? [...prev, fileId]
        : prev.filter(id => id !== fileId)
    );
  };

  const handleStartAnalysis = () => {
    if (!selectedProjectId || selectedFiles.length === 0) {
      alert('请选择项目和输入文件');
      return;
    }

    const analysisData = {
      projectId: selectedProjectId,
      name: jobName || `${workflowType}_analysis_${Date.now()}`,
      description: jobDescription,
      type: workflowType,
      inputFiles: selectedFiles,
      parameters: {
        ...analysisParams,
        resourceConfig,
        steps: workflowSteps.map(step => ({
          ...step,
          tool: analysisParams[`${step.id}_tool`] || null,
          params: analysisParams[`${step.id}_params`] || {}
        }))
      }
    };

    onStartAnalysis?.(analysisData);
  };

  const canStartAnalysis = selectedProjectId && selectedFiles.length > 0 && jobName.trim();

  return (
    <div className="space-y-6">
      {/* 项目和数据选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            项目和数据选择
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 项目选择器 */}
          <div className="space-y-2">
            <Label>选择项目 *</Label>
            <ProjectSelector
              selectedProjectId={selectedProjectId}
              onSelectProject={(projectId) => setSelectedProjectId(projectId)}
              placeholder="选择要运行分析的项目..."
              className="w-full"
            />
          </div>

          {/* 分析任务信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobName">任务名称 *</Label>
              <Input
                id="jobName"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="输入分析任务名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobDescription">任务描述</Label>
              <Input
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="简要描述分析目的"
              />
            </div>
          </div>

          {/* 文件选择 */}
          {selectedProjectId && (
            <div className="space-y-2">
              <Label>选择输入文件 * ({selectedFiles.length} 已选择)</Label>
              <div className="border rounded-lg p-4 max-h-64 overflow-auto">
                {relevantFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      该项目中没有适用于{workflowType}分析的文件
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relevantFiles.map((file) => (
                      <div key={file._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={file._id}
                          checked={selectedFiles.includes(file._id)}
                          onCheckedChange={(checked) => 
                            handleFileSelection(file._id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={file._id} 
                          className="flex-1 cursor-pointer flex items-center justify-between"
                        >
                          <span className="text-sm">{file.originalName}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{file.type.toUpperCase()}</Badge>
                            <span className="text-xs text-gray-500">{file.sizeFormatted}</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 工作流配置 */}
      {selectedProjectId && selectedFiles.length > 0 && (
        <>
          {/* 工作流步骤 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" />
                分析流程配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={currentStep} onValueChange={setCurrentStep}>
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
                  {workflowSteps.map((step) => (
                    <TabsTrigger 
                      key={step.id} 
                      value={step.id}
                      className="text-xs"
                    >
                      {step.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {workflowSteps.map((step) => (
                  <TabsContent key={step.id} value={step.id} className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <step.icon className="w-5 h-5" />
                      <h3 className="text-lg font-medium">{step.name}</h3>
                    </div>

                    {/* 工具选择 */}
                    {analysisTools[step.id] && (
                      <div className="space-y-2">
                        <Label>选择工具</Label>
                        <Select
                          value={analysisParams[`${step.id}_tool`] || ''}
                          onValueChange={(value) => 
                            setAnalysisParams(prev => ({
                              ...prev,
                              [`${step.id}_tool`]: value
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择分析工具" />
                          </SelectTrigger>
                          <SelectContent>
                            {analysisTools[step.id].map((tool) => (
                              <SelectItem key={tool} value={tool}>{tool}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* 参数配置 */}
                    <div className="space-y-2">
                      <Label>参数配置 (可选)</Label>
                      <Textarea
                        placeholder="输入额外的分析参数，每行一个参数"
                        value={analysisParams[`${step.id}_params`] || ''}
                        onChange={(e) => 
                          setAnalysisParams(prev => ({
                            ...prev,
                            [`${step.id}_params`]: e.target.value
                          }))
                        }
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* 计算资源配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                计算资源配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>CPU 核心数</Label>
                  <Select
                    value={resourceConfig.cpuCores.toString()}
                    onValueChange={(value) => 
                      setResourceConfig(prev => ({ ...prev, cpuCores: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 核心</SelectItem>
                      <SelectItem value="8">8 核心</SelectItem>
                      <SelectItem value="16">16 核心</SelectItem>
                      <SelectItem value="32">32 核心</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>内存 (GB)</Label>
                  <Select
                    value={resourceConfig.memory.toString()}
                    onValueChange={(value) => 
                      setResourceConfig(prev => ({ ...prev, memory: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16">16 GB</SelectItem>
                      <SelectItem value="32">32 GB</SelectItem>
                      <SelectItem value="64">64 GB</SelectItem>
                      <SelectItem value="128">128 GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>计算节点</Label>
                  <Select
                    value={resourceConfig.computeNode}
                    onValueChange={(value) => 
                      setResourceConfig(prev => ({ ...prev, computeNode: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">自动选择</SelectItem>
                      <SelectItem value="gpu-node-1">GPU 节点 1</SelectItem>
                      <SelectItem value="cpu-node-1">CPU 节点 1</SelectItem>
                      <SelectItem value="cpu-node-2">CPU 节点 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>预计耗时</Label>
                  <div className="px-3 py-2 border rounded-md bg-gray-50 text-sm text-gray-600">
                    {resourceConfig.estimatedTime}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 启动分析 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">准备启动分析</h3>
                  <p className="text-sm text-gray-500">
                    项目: {selectedProjectId} | 文件: {selectedFiles.length} 个 | 资源: {resourceConfig.cpuCores} CPU, {resourceConfig.memory} GB RAM
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline">
                    <Save className="w-4 h-4 mr-2" />
                    保存为模板
                  </Button>
                  <Button 
                    onClick={handleStartAnalysis}
                    disabled={!canStartAnalysis}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    启动分析
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}