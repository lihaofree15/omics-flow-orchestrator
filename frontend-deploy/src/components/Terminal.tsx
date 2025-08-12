import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Terminal as TerminalIcon, Send, X, Minus, Maximize2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  status: 'success' | 'error' | 'running';
  projectId?: string;
}

interface TerminalProps {
  projectId?: string;
  onClose?: () => void;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export function Terminal({ projectId, onClose, isMinimized, onMinimize, onMaximize }: TerminalProps) {
  const [commands, setCommands] = useState<TerminalCommand[]>([
    {
      id: '1',
      command: 'omics --version',
      output: 'Multi-Omics Analysis Platform v2.1.0\nBuild: 2024.01.15-stable',
      timestamp: new Date(Date.now() - 60000),
      status: 'success'
    },
    {
      id: '2', 
      command: 'omics project list',
      output: 'Available Projects:\n- proj_001: 肿瘤转录组分析 (active)\n- proj_002: 单细胞免疫分析 (completed)\n- proj_003: 基因组变异检测 (running)',
      timestamp: new Date(Date.now() - 30000),
      status: 'success'
    }
  ]);
  
  const [currentCommand, setCurrentCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commands]);

  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    const newCommand: TerminalCommand = {
      id: Date.now().toString(),
      command: cmd,
      output: '',
      timestamp: new Date(),
      status: 'running',
      projectId
    };

    setCommands(prev => [...prev, newCommand]);
    setCurrentCommand('');
    setIsLoading(true);

    // 模拟命令执行
    setTimeout(() => {
      const output = simulateCommand(cmd, projectId);
      setCommands(prev => prev.map(c => 
        c.id === newCommand.id 
          ? { ...c, output, status: output.includes('Error') ? 'error' : 'success' }
          : c
      ));
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const simulateCommand = (cmd: string, projectId?: string): string => {
    const lowerCmd = cmd.toLowerCase();
    
    if (lowerCmd.includes('help')) {
      return `Available Commands:
omics project list              - 列出所有项目
omics project create <name>     - 创建新项目
omics project switch <id>       - 切换项目
omics data upload <file>        - 上传数据文件
omics analysis run <workflow>   - 运行分析流程
omics analysis status           - 查看分析状态
omics results export <format>   - 导出结果
omics system status             - 系统状态
omics cluster info              - 集群信息`;
    }
    
    if (lowerCmd.includes('project list')) {
      return `Available Projects:
- proj_001: 肿瘤转录组分析 (active) - ${new Date().toLocaleDateString()}
- proj_002: 单细胞免疫分析 (completed) - ${new Date(Date.now() - 86400000).toLocaleDateString()}
- proj_003: 基因组变异检测 (running) - ${new Date().toLocaleDateString()}
- proj_004: 多组学整合分析 (created) - ${new Date().toLocaleDateString()}`;
    }
    
    if (lowerCmd.includes('project create')) {
      const projectName = cmd.split(' ').slice(2).join(' ') || 'unnamed_project';
      return `Project created successfully:
- ID: proj_${Date.now().toString().slice(-3)}
- Name: ${projectName}
- Created: ${new Date().toLocaleString()}
- Storage: 0 GB allocated`;
    }
    
    if (lowerCmd.includes('analysis status')) {
      return `Current Analysis Jobs:
┌─────────────┬──────────────────┬─────────┬──────────┬──────────┐
│ Job ID      │ Workflow         │ Status  │ Progress │ Runtime  │
├─────────────┼──────────────────┼─────────┼──────────┼──────────┤
│ job_001     │ RNA-seq Analysis │ Running │ 75%      │ 2h 15m   │
│ job_002     │ Single Cell QC   │ Queued  │ 0%       │ -        │
│ job_003     │ Variant Calling  │ Failed  │ 45%      │ 1h 30m   │
└─────────────┴──────────────────┴─────────┴──────────┴──────────┘`;
    }
    
    if (lowerCmd.includes('system status')) {
      return `System Status:
Compute Nodes: 2/2 online
- Node-1: CPU 68%, Memory 72%, Temp 45°C
- Node-2: CPU 45%, Memory 58%, Temp 42°C

Storage Nodes: 2/3 online
- Storage-1: 78% used, 2.1TB available
- Storage-2: 89% used, 0.8TB available ⚠️
- Storage-3: 65% used, 3.2TB available

Network: 2.4 GB/s throughput, 1ms latency`;
    }
    
    if (lowerCmd.includes('data upload')) {
      const filename = cmd.split(' ').slice(2)[0] || 'sample.fastq.gz';
      return `Uploading ${filename}...
Upload progress: [████████████████████] 100%
File uploaded successfully to: /projects/${projectId || 'current'}/raw_data/${filename}
Size: 2.3 GB
MD5: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`;
    }
    
    if (lowerCmd.includes('analysis run')) {
      const workflow = cmd.split(' ').slice(2)[0] || 'standard';
      return `Starting analysis workflow: ${workflow}
Job ID: job_${Date.now().toString().slice(-6)}
Allocated resources: 16 cores, 64GB RAM
Estimated runtime: 3-4 hours
Monitor progress: omics analysis status`;
    }
    
    if (lowerCmd.includes('cluster info')) {
      return `Cluster Information:
Total Nodes: 5 (2 compute + 3 storage)
Total CPU Cores: 64 (32 per compute node)
Total Memory: 256 GB
Total Storage: 24 TB (RAID-6)
Network: 10 Gigabit Ethernet
Uptime: 15 days, 3 hours, 42 minutes`;
    }
    
    return `Command not recognized: ${cmd}
Type 'omics help' for available commands.`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={onMaximize} className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4" />
          终端
          <Badge variant="secondary" className="ml-2">
            {commands.length}
          </Badge>
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-[600px] h-[400px] z-50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TerminalIcon className="w-4 h-4" />
            Omics Terminal
            {projectId && (
              <Badge variant="outline" className="text-xs">
                {projectId}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onMinimize}>
              <Minus className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[320px] flex flex-col">
        <ScrollArea ref={scrollRef} className="flex-1 p-3 bg-black text-green-400 font-mono text-xs">
          <div className="space-y-2">
            {commands.map((cmd) => (
              <div key={cmd.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">omics@platform:</span>
                  <span className="text-yellow-400">
                    {projectId ? `~/projects/${projectId}` : '~'}
                  </span>
                  <span className="text-white">$</span>
                  <span>{cmd.command}</span>
                  {cmd.status === 'running' && (
                    <Badge variant="secondary" className="text-xs">
                      运行中
                    </Badge>
                  )}
                </div>
                {cmd.output && (
                  <pre className={`text-xs whitespace-pre-wrap ml-4 ${
                    cmd.status === 'error' ? 'text-red-400' : 'text-gray-300'
                  }`}>
                    {cmd.output}
                  </pre>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 ml-4">
                <span className="animate-pulse">执行中...</span>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t bg-black">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-mono text-xs">omics@platform:</span>
            <span className="text-yellow-400 font-mono text-xs">
              {projectId ? `~/projects/${projectId}` : '~'}
            </span>
            <span className="text-white font-mono text-xs">$</span>
            <Input
              ref={inputRef}
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent border-none text-green-400 font-mono text-xs placeholder:text-gray-500 focus-visible:ring-0"
              placeholder="输入命令..."
              disabled={isLoading}
            />
            <Button 
              size="sm" 
              onClick={() => executeCommand(currentCommand)}
              disabled={isLoading || !currentCommand.trim()}
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}