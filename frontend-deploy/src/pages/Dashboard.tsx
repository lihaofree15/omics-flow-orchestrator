import { 
  Server, 
  Cpu, 
  HardDrive, 
  Network, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  BarChart3,
  Microscope,
  Dna,
  GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// 模拟实时数据
const hardwareStats = {
  storage: {
    nodes: [
      { id: 1, total: 10240, used: 6144, iops: 1200, status: 'normal' },
      { id: 2, total: 10240, used: 7680, iops: 1450, status: 'warning' },
      { id: 3, total: 10240, used: 5120, iops: 980, status: 'normal' }
    ],
    totalUsed: 18944,
    totalCapacity: 30720
  },
  compute: {
    nodes: [
      { 
        id: 1, 
        name: "计算节点-1", 
        cpu: { cores: 32, used: 18, usage: 56.25 }, 
        memory: { total: 128, used: 89, usage: 69.5 },
        status: 'active'
      },
      { 
        id: 2, 
        name: "计算节点-2", 
        cpu: { cores: 32, used: 24, usage: 75 }, 
        memory: { total: 128, used: 112, usage: 87.5 },
        status: 'active'
      }
    ]
  },
  network: {
    bandwidth: { up: 8.5, down: 6.2, max: 10 },
    latency: 0.8
  }
};

const taskStats = {
  today: { transcriptome: 12, singleCell: 8, genomics: 5 },
  week: { transcriptome: 85, singleCell: 62, genomics: 33 },
  queue: 15,
  failed: 3
};

const quickActions = [
  {
    title: "转录组分析",
    description: "RNA-seq数据标准流程",
    icon: Dna,
    path: "/workflows/transcriptome",
    color: "success"
  },
  {
    title: "单细胞分析", 
    description: "10x单细胞转录组",
    icon: Microscope,
    path: "/workflows/single-cell",
    color: "primary"
  },
  {
    title: "基因组变异",
    description: "WGS/WES变异检测",
    icon: GitBranch,
    path: "/workflows/genomics",
    color: "warning"
  }
];

export default function Dashboard() {
  const getStatusColor = (usage: number) => {
    if (usage >= 90) return 'error';
    if (usage >= 70) return 'warning';
    return 'success';
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">控制台</h1>
          <p className="text-muted-foreground">硬件资源状态与任务概览</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4" />
          实时监控中
        </div>
      </div>

      {/* 硬件资源监控 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 分布式存储 */}
        <Card className="resource-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary" />
              分布式存储
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">
              {(hardwareStats.storage.totalUsed / 1024).toFixed(1)}TB
              <span className="text-sm font-normal text-muted-foreground ml-2">
                / {(hardwareStats.storage.totalCapacity / 1024).toFixed(1)}TB
              </span>
            </div>
            <Progress 
              value={(hardwareStats.storage.totalUsed / hardwareStats.storage.totalCapacity) * 100} 
              className="h-2"
            />
            
            <div className="space-y-2">
              {hardwareStats.storage.nodes.map((node) => (
                <div key={node.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">节点{node.id}</span>
                  <div className="flex items-center gap-2">
                    <span>{((node.used / node.total) * 100).toFixed(0)}%</span>
                    <div className={`status-indicator ${node.status === 'normal' ? 'completed' : 'warning'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 计算资源 */}
        <Card className="resource-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              计算资源
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hardwareStats.compute.nodes.map((node) => (
              <div key={node.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{node.name}</span>
                  <div className="status-indicator running"></div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CPU ({node.cpu.used}/{node.cpu.cores}核)</span>
                    <span className={`text-${getStatusColor(node.cpu.usage)}`}>
                      {node.cpu.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={node.cpu.usage} className="h-1.5" />
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">内存 ({node.memory.used}/{node.memory.total}GB)</span>
                    <span className={`text-${getStatusColor(node.memory.usage)}`}>
                      {node.memory.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={node.memory.usage} className="h-1.5" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 网络状态 */}
        <Card className="resource-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              网络状态
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-bold text-success">
                  {hardwareStats.network.bandwidth.up}GB/s
                </div>
                <div className="text-xs text-muted-foreground">上行流量</div>
              </div>
              <div>
                <div className="text-lg font-bold text-info">
                  {hardwareStats.network.bandwidth.down}GB/s
                </div>
                <div className="text-xs text-muted-foreground">下行流量</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">万兆端口利用率</span>
                <span>{((hardwareStats.network.bandwidth.up / hardwareStats.network.bandwidth.max) * 100).toFixed(0)}%</span>
              </div>
              <Progress 
                value={(hardwareStats.network.bandwidth.up / hardwareStats.network.bandwidth.max) * 100} 
                className="h-1.5" 
              />
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">节点延迟</span>
                <span className="text-success">{hardwareStats.network.latency}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 任务统计和快速入口 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 组学任务统计 */}
        <Card className="resource-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              组学任务统计
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 今日任务 */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">今日完成</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{taskStats.today.transcriptome}</div>
                  <div className="text-xs text-muted-foreground">转录组</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{taskStats.today.singleCell}</div>
                  <div className="text-xs text-muted-foreground">单细胞</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">{taskStats.today.genomics}</div>
                  <div className="text-xs text-muted-foreground">基因组</div>
                </div>
              </div>
            </div>

            {/* 本周统计 */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">本周总计</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">转录组分析</span>
                  <span className="font-medium">{taskStats.week.transcriptome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">单细胞分析</span>
                  <span className="font-medium">{taskStats.week.singleCell}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">基因组分析</span>
                  <span className="font-medium">{taskStats.week.genomics}</span>
                </div>
              </div>
            </div>

            {/* 队列状态 */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className="text-sm">待运行队列</span>
                </div>
                <span className="font-bold text-warning">{taskStats.queue}</span>
              </div>
              {taskStats.failed > 0 && (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-error" />
                    <span className="text-sm">失败任务</span>
                  </div>
                  <span className="font-bold text-error">{taskStats.failed}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 快速入口 */}
        <Card className="resource-card">
          <CardHeader>
            <CardTitle>快速入口</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickActions.map((action) => (
              <Button
                key={action.path}
                variant="outline"
                className="w-full h-auto p-4 justify-start hover:bg-accent/10 border-border"
              >
                <action.icon className={`w-6 h-6 mr-3 text-${action.color}`} />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">常用工作流</h4>
              <div className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  RNA-seq 标准流程
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  10x 单细胞分析流程
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  WGS 变异检测流程
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 系统公告 */}
      <Card className="resource-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            系统公告
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <div className="font-medium text-sm">计算节点维护通知</div>
                <div className="text-xs text-muted-foreground">计算节点-2将于今晚22:00-24:00进行系统更新，期间可能影响任务调度</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-info/10 rounded-lg border border-info/20">
              <CheckCircle className="w-4 h-4 text-info mt-0.5" />
              <div>
                <div className="font-medium text-sm">工作流更新</div>
                <div className="text-xs text-muted-foreground">单细胞分析流程已更新到v2.1，新增细胞周期分析模块</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}