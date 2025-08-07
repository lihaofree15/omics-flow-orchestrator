import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Copy, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Workflow
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const workflowExecutionSchema = z.object({
  workflowId: z.string().min(1, 'Workflow is required'),
  inputFiles: z.array(z.string()).min(1, 'At least one input file is required'),
  sampleIds: z.array(z.string()).optional(),
  outputDir: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  resume: z.boolean().default(false)
});

type WorkflowExecutionData = z.infer<typeof workflowExecutionSchema>;

interface WorkflowTemplate {
  _id: string;
  name: string;
  description: string;
  workflowType: 'rna-seq' | 'genome-seq' | 'single-cell-rna-seq';
  version: string;
  parameters: any;
  resources: {
    cpu: number;
    memory: string;
    time: string;
  };
}

interface AnalysisJob {
  _id: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  logs: string[];
}

interface WorkflowManagerProps {
  projectId: string;
  availableFiles: Array<{ _id: string; filename: string; type: string }>;
  availableSamples: Array<{ _id: string; sampleId: string; sampleName: string }>;
}

export function WorkflowManager({ projectId, availableFiles, availableSamples }: WorkflowManagerProps) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [runningJobs, setRunningJobs] = useState<AnalysisJob[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const { toast } = useToast();

  const form = useForm<WorkflowExecutionData>({
    resolver: zodResolver(workflowExecutionSchema),
    defaultValues: {
      priority: 'normal',
      resume: false,
      inputFiles: [],
      sampleIds: []
    }
  });

  useEffect(() => {
    fetchTemplates();
    fetchRunningJobs();
    
    // Poll for job status updates
    const interval = setInterval(fetchRunningJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/workflows/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchRunningJobs = async () => {
    try {
      const response = await fetch(`/api/analysis?projectId=${projectId}&status=pending,running`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setRunningJobs(result.data);
      }
    } catch (error) {
      console.error('Error fetching running jobs:', error);
    }
  };

  const executeWorkflow = async (data: WorkflowExecutionData) => {
    setIsExecuting(true);
    try {
      const response = await fetch(`/api/workflows/${data.workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to execute workflow');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: 'Workflow execution started successfully',
      });

      form.reset();
      setSelectedTemplate(null);
      fetchRunningJobs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute workflow',
        variant: 'destructive'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/analysis/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Job cancelled successfully',
        });
        fetchRunningJobs();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel job',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getWorkflowTypeColor = (type: string) => {
    switch (type) {
      case 'rna-seq':
        return 'bg-blue-100 text-blue-800';
      case 'genome-seq':
        return 'bg-green-100 text-green-800';
      case 'single-cell-rna-seq':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          Workflow Manager
        </CardTitle>
        <CardDescription>
          Execute genomics analysis workflows on your data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="execution">Execute</TabsTrigger>
            <TabsTrigger value="jobs">Running Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template._id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge className={getWorkflowTypeColor(template.workflowType)}>
                          {template.workflowType}
                        </Badge>
                        <Badge variant="outline">v{template.version}</Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          form.setValue('workflowId', template._id);
                          setActiveTab('execution');
                        }}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>CPU: {template.resources.cpu} cores</span>
                      <span>Memory: {template.resources.memory}</span>
                      <span>Time: {template.resources.time}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="execution" className="space-y-6">
            {selectedTemplate ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge className={getWorkflowTypeColor(selectedTemplate.workflowType)}>
                        {selectedTemplate.workflowType}
                      </Badge>
                      {selectedTemplate.name}
                    </CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </CardHeader>
                </Card>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(executeWorkflow)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="inputFiles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Input Files *</FormLabel>
                            <div className="space-y-2">
                              {availableFiles.map((file) => (
                                <div key={file._id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={file._id}
                                    checked={field.value.includes(file._id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.onChange([...field.value, file._id]);
                                      } else {
                                        field.onChange(field.value.filter(id => id !== file._id));
                                      }
                                    }}
                                  />
                                  <label htmlFor={file._id} className="text-sm">
                                    {file.filename} 
                                    <Badge variant="secondary" className="ml-2">{file.type}</Badge>
                                  </label>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sampleIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Associated Samples</FormLabel>
                            <div className="space-y-2">
                              {availableSamples.map((sample) => (
                                <div key={sample._id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={sample._id}
                                    checked={field.value?.includes(sample._id) || false}
                                    onChange={(e) => {
                                      const currentValue = field.value || [];
                                      if (e.target.checked) {
                                        field.onChange([...currentValue, sample._id]);
                                      } else {
                                        field.onChange(currentValue.filter(id => id !== sample._id));
                                      }
                                    }}
                                  />
                                  <label htmlFor={sample._id} className="text-sm">
                                    {sample.sampleId} - {sample.sampleName}
                                  </label>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="outputDir"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Output Directory</FormLabel>
                            <FormControl>
                              <Input placeholder="/path/to/output" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="resume"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Resume from checkpoint</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setSelectedTemplate(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isExecuting}>
                        {isExecuting ? 'Starting...' : 'Execute Workflow'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            ) : (
              <div className="text-center py-12">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Select a Template</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a workflow template from the Templates tab to begin execution.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            {runningJobs.length > 0 ? (
              runningJobs.map((job) => (
                <Card key={job._id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <CardTitle className="text-lg">{job.name}</CardTitle>
                        <Badge variant="outline">{job.type}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.status === 'running' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => cancelJob(job._id)}
                          >
                            <Square className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              Logs
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Job Logs - {job.name}</DialogTitle>
                              <DialogDescription>
                                Real-time execution logs
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-96 w-full rounded border p-4">
                              <pre className="text-sm whitespace-pre-wrap">
                                {job.logs.join('\n') || 'No logs available yet...'}
                              </pre>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="w-full" />
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Started:</span>{' '}
                          {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Not started'}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>{' '}
                          {job.startedAt ? formatDuration(job.startedAt, job.completedAt) : '-'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Running Jobs</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Execute a workflow to see job status and progress here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}