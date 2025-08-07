import { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ProjectSelector from './ProjectSelector';
import { useUploadFiles } from '@/hooks/useFiles';
import { Project } from '@/types';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const allowedFileTypes = [
  '.fastq', '.fq', '.fastq.gz', '.fq.gz',
  '.fasta', '.fa', '.fasta.gz', '.fa.gz',
  '.bam', '.sam',
  '.vcf', '.vcf.gz',
  '.gff', '.gff3', '.gtf',
  '.csv', '.tsv', '.txt',
  '.json', '.bed'
];

function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [metadata, setMetadata] = useState({
    sampleId: '',
    readType: 'single' as 'single' | 'paired',
    qualityScore: '',
    sequencingPlatform: '',
    description: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadFiles();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: UploadFile[] = Array.from(files).map((file, index) => ({
      file,
      id: `${Date.now()}-${index}`,
      progress: 0,
      status: 'pending',
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    if (!selectedProject || uploadFiles.length === 0) return;

    try {
      // Create FileList from upload files
      const fileList = new DataTransfer();
      uploadFiles.forEach(uploadFile => {
        fileList.items.add(uploadFile.file);
      });

      // Update status to uploading
      setUploadFiles(prev => prev.map(f => ({
        ...f,
        status: 'uploading' as const,
        progress: 0,
      })));

      await uploadMutation.mutateAsync({
        projectId: selectedProject._id,
        files: fileList.files,
        metadata: {
          ...metadata,
          description: metadata.description || undefined,
        },
      });

      // Update status to completed
      setUploadFiles(prev => prev.map(f => ({
        ...f,
        status: 'completed' as const,
        progress: 100,
      })));

      // Reset form after successful upload
      setTimeout(() => {
        setUploadFiles([]);
        setMetadata({
          sampleId: '',
          readType: 'single',
          qualityScore: '',
          sequencingPlatform: '',
          description: '',
        });
        setIsOpen(false);
        onUploadComplete?.();
      }, 1000);

    } catch (error) {
      // Update status to error
      setUploadFiles(prev => prev.map(f => ({
        ...f,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Upload failed',
      })));
    }
  };

  const canUpload = selectedProject && uploadFiles.length > 0 && !uploadMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="space-x-2">
          <Upload className="h-4 w-4" />
          <span>上传数据</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>上传数据文件</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label>选择项目 *</Label>
            <ProjectSelector
              selectedProjectId={selectedProject?._id}
              onSelectProject={(projectId, project) => setSelectedProject(project)}
              placeholder="请先选择要上传到的项目"
              className="w-full"
            />
            {!selectedProject && (
              <p className="text-sm text-muted-foreground">
                必须先选择项目才能上传文件
              </p>
            )}
          </div>

          {/* File Selection */}
          <div className="space-y-2">
            <Label>选择文件</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={allowedFileTypes.join(',')}
                onChange={handleFileSelect}
                className="hidden"
                disabled={!selectedProject}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedProject}
                className="space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>选择文件</span>
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                支持的文件类型: {allowedFileTypes.join(', ')}
              </p>
            </div>
          </div>

          {/* Selected Files */}
          {uploadFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">已选择的文件 ({uploadFiles.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-48 overflow-auto">
                {uploadFiles.map((uploadFile) => (
                  <div key={uploadFile.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2 flex-1">
                      <FileText className="h-4 w-4" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(uploadFile.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {uploadFile.status === 'uploading' && (
                        <Progress value={uploadFile.progress} className="w-16" />
                      )}
                      {uploadFile.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {uploadFile.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {uploadFile.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {uploadFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">文件元数据 (可选)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sampleId">样本ID</Label>
                    <Input
                      id="sampleId"
                      value={metadata.sampleId}
                      onChange={(e) => setMetadata(prev => ({ ...prev, sampleId: e.target.value }))}
                      placeholder="例如: Sample_001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="readType">读取类型</Label>
                    <select
                      id="readType"
                      value={metadata.readType}
                      onChange={(e) => setMetadata(prev => ({ ...prev, readType: e.target.value as 'single' | 'paired' }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="single">Single-end</option>
                      <option value="paired">Paired-end</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qualityScore">质量评分</Label>
                    <Input
                      id="qualityScore"
                      value={metadata.qualityScore}
                      onChange={(e) => setMetadata(prev => ({ ...prev, qualityScore: e.target.value }))}
                      placeholder="例如: Phred+33"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sequencingPlatform">测序平台</Label>
                    <Input
                      id="sequencingPlatform"
                      value={metadata.sequencingPlatform}
                      onChange={(e) => setMetadata(prev => ({ ...prev, sequencingPlatform: e.target.value }))}
                      placeholder="例如: Illumina NovaSeq"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={metadata.description}
                    onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="文件描述信息..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Error */}
          {uploadMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!canUpload}
              className="space-x-2"
            >
              {uploadMutation.isPending && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>
                {uploadMutation.isPending ? '上传中...' : `上传 ${uploadFiles.length} 个文件`}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}