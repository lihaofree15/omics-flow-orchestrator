import { 
  Database, 
  CheckCircle,
  GitBranch,
  BarChart3
} from "lucide-react";
import AnalysisWorkflow from "@/components/AnalysisWorkflow";
import { useCreateAnalysisJob } from "@/hooks/useAnalysis";

// 工作流步骤定义
const workflowSteps = [
  { id: 'qc', name: '质量控制', icon: CheckCircle, status: 'queued' as const },
  { id: 'align', name: '序列比对', icon: GitBranch, status: 'queued' as const },
  { id: 'count', name: '表达定量', icon: BarChart3, status: 'queued' as const },
  { id: 'diff', name: '差异分析', icon: BarChart3, status: 'queued' as const }
];

// 流行的工具选项
const analysisTools = {
  qc: ['FastQC', 'MultiQC', 'Trim_Galore'],
  align: ['STAR', 'HISAT2', 'TopHat2'],
  count: ['Salmon', 'StringTie', 'RSEM', 'featureCounts'],
  diff: ['DESeq2', 'edgeR', 'limma']
};

export default function TranscriptomeAnalysis() {
  const createAnalysisJobMutation = useCreateAnalysisJob();

  const handleStartAnalysis = async (analysisData: any) => {
    try {
      await createAnalysisJobMutation.mutateAsync(analysisData);
    } catch (error) {
      console.error('Failed to start analysis:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">转录组分析</h1>
          <p className="text-muted-foreground">RNA-seq数据标准分析流程</p>
        </div>
      </div>

      {/* 工作流组件 */}
      <AnalysisWorkflow
        workflowType="transcriptome"
        workflowSteps={workflowSteps}
        analysisTools={analysisTools}
        onStartAnalysis={handleStartAnalysis}
      />
    </div>
  );
}