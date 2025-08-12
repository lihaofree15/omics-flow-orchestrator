import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const sampleSchema = z.object({
  sampleId: z.string().min(1, 'Sample ID is required'),
  sampleName: z.string().min(1, 'Sample name is required'),
  description: z.string().optional(),
  organism: z.string().min(1, 'Organism is required'),
  tissue: z.string().optional(),
  cellType: z.string().optional(),
  condition: z.string().optional(),
  treatment: z.string().optional(),
  timePoint: z.string().optional(),
  replicate: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  
  // Sequencing Information
  sequencingInfo: z.object({
    platform: z.enum(['Illumina', 'PacBio', 'Oxford Nanopore', 'BGI', 'Other']),
    instrument: z.string().optional(),
    readLength: z.number().min(1).optional(),
    readType: z.enum(['single', 'paired']),
    libraryStrategy: z.enum(['RNA-Seq', 'DNA-Seq', 'ChIP-Seq', 'ATAC-Seq', 'scRNA-Seq', 'Whole Genome', 'Exome', 'Amplicon', 'Other']),
    librarySelection: z.string().optional(),
    libraryLayout: z.enum(['SINGLE', 'PAIRED'])
  }),
  
  // Quality Metrics (optional)
  qualityMetrics: z.object({
    totalReads: z.number().min(0).optional(),
    qualityScore: z.number().min(0).max(50).optional(),
    gcContent: z.number().min(0).max(100).optional(),
    duplicationRate: z.number().min(0).max(100).optional()
  }).optional(),
  
  // Clinical Data (optional)
  clinicalData: z.object({
    age: z.number().min(0).optional(),
    gender: z.enum(['Male', 'Female', 'Unknown']).optional(),
    diseaseStatus: z.string().optional(),
    stage: z.string().optional(),
    grade: z.string().optional()
  }).optional()
});

type SampleFormData = z.infer<typeof sampleSchema>;

interface SampleUploadProps {
  projectId: string;
  onSampleCreated?: (sample: any) => void;
}

export function SampleUpload({ projectId, onSampleCreated }: SampleUploadProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<SampleFormData>({
    resolver: zodResolver(sampleSchema),
    defaultValues: {
      projectId,
      sequencingInfo: {
        platform: 'Illumina',
        readType: 'paired',
        libraryStrategy: 'RNA-Seq',
        libraryLayout: 'PAIRED'
      }
    }
  });

  const onSubmit = async (data: SampleFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/samples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create sample');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: 'Sample created successfully',
      });

      form.reset();
      onSampleCreated?.(result.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create sample',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const preview = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim());
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
          }, {} as any);
        });
        setCsvPreview(preview);
      };
      reader.readAsText(file);
    }
  };

  const handleBulkUpload = async () => {
    if (!csvFile) return;

    setIsSubmitting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        const samples = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const sample: any = { projectId };
          
          headers.forEach((header, index) => {
            const value = values[index];
            if (value) {
              // Map CSV headers to sample object structure
              if (header.includes('sequencing')) {
                if (!sample.sequencingInfo) sample.sequencingInfo = {};
                sample.sequencingInfo[header.replace('sequencing.', '')] = value;
              } else if (header.includes('quality')) {
                if (!sample.qualityMetrics) sample.qualityMetrics = {};
                sample.qualityMetrics[header.replace('quality.', '')] = isNaN(Number(value)) ? value : Number(value);
              } else if (header.includes('clinical')) {
                if (!sample.clinicalData) sample.clinicalData = {};
                sample.clinicalData[header.replace('clinical.', '')] = value;
              } else {
                sample[header] = value;
              }
            }
          });
          
          return sample;
        });

        const response = await fetch('/api/samples/bulk-import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ samples })
        });

        if (!response.ok) {
          throw new Error('Failed to upload samples');
        }

        const result = await response.json();
        toast({
          title: 'Success',
          description: `Successfully imported ${result.data.imported} samples`,
        });

        setCsvFile(null);
        setCsvPreview([]);
        onSampleCreated?.(result.data);
      };
      reader.readAsText(csvFile);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload samples',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Sample Information Upload
        </CardTitle>
        <CardDescription>
          Upload sample metadata for genomics analysis. You can add samples individually or upload multiple samples using CSV.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={uploadMode} onValueChange={(value) => setUploadMode(value as 'single' | 'bulk')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Sample</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sampleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sample ID *</FormLabel>
                          <FormControl>
                            <Input placeholder="SAMPLE_001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sampleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sample Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Control sample 1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Sample description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="organism"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organism *</FormLabel>
                          <FormControl>
                            <Input placeholder="Homo sapiens" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tissue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tissue</FormLabel>
                          <FormControl>
                            <Input placeholder="Brain" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cellType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cell Type</FormLabel>
                          <FormControl>
                            <Input placeholder="Neuron" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition</FormLabel>
                          <FormControl>
                            <Input placeholder="Control" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="treatment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment</FormLabel>
                          <FormControl>
                            <Input placeholder="None" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="replicate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Replicate</FormLabel>
                          <FormControl>
                            <Input placeholder="Rep1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Sequencing Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Sequencing Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sequencingInfo.platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Illumina">Illumina</SelectItem>
                              <SelectItem value="PacBio">PacBio</SelectItem>
                              <SelectItem value="Oxford Nanopore">Oxford Nanopore</SelectItem>
                              <SelectItem value="BGI">BGI</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sequencingInfo.instrument"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instrument</FormLabel>
                          <FormControl>
                            <Input placeholder="NovaSeq 6000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="sequencingInfo.readType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Read Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select read type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single">Single-end</SelectItem>
                              <SelectItem value="paired">Paired-end</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sequencingInfo.libraryStrategy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Library Strategy *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select strategy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="RNA-Seq">RNA-Seq</SelectItem>
                              <SelectItem value="DNA-Seq">DNA-Seq</SelectItem>
                              <SelectItem value="ChIP-Seq">ChIP-Seq</SelectItem>
                              <SelectItem value="ATAC-Seq">ATAC-Seq</SelectItem>
                              <SelectItem value="scRNA-Seq">scRNA-Seq</SelectItem>
                              <SelectItem value="Whole Genome">Whole Genome</SelectItem>
                              <SelectItem value="Exome">Exome</SelectItem>
                              <SelectItem value="Amplicon">Amplicon</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sequencingInfo.readLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Read Length</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="150" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Reset
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Sample'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">CSV Upload</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a CSV file with sample information. The first row should contain column headers.
                </p>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {csvFile ? csvFile.name : 'Upload CSV file'}
                        </span>
                        <input
                          id="csv-upload"
                          name="csv-upload"
                          type="file"
                          className="sr-only"
                          accept=".csv"
                          onChange={handleCsvUpload}
                        />
                      </label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        CSV files only
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {csvPreview.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Preview (first 5 rows)</h4>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {Object.keys(csvPreview[0]).map(header => (
                            <th key={header} className="px-3 py-2 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row, index) => (
                          <tr key={index} className="border-t">
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td key={cellIndex} className="px-3 py-2">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setCsvFile(null);
                    setCsvPreview([]);
                  }}
                  disabled={!csvFile}
                >
                  Clear
                </Button>
                <Button 
                  onClick={handleBulkUpload} 
                  disabled={!csvFile || isSubmitting}
                >
                  {isSubmitting ? 'Uploading...' : 'Upload Samples'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}