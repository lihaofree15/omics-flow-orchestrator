import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResourceChart } from "@/components/charts/ResourceChart";
import { 
  Server, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Network, 
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";

interface SystemMetrics {
  time: string;
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

interface NodeStatus {
  id: string;
  name: string;
  type: 'compute' | 'storage';
  status: 'online' | 'offline' | 'warning';
  cpu: number;
  memory: number;
  storage?: number;
  temperature: number;
  uptime: string;
}

export default function SystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [nodes, setNodes] = useState<NodeStatus[]>([
    {
      id: 'compute-1',
      name: '计算节点-1',
      type: 'compute',
      status: 'online',
      cpu: 68,
      memory: 72,
      temperature: 45,
      uptime: '15天 3小时'
    },
    {
      id: 'compute-2', 
      name: '计算节点-2',
      type: 'compute',
      status: 'online',
      cpu: 45,
      memory: 58,
      temperature: 42,
      uptime: '15天 3小时'
    },
    {
      id: 'storage-1',
      name: '存储节点-1',
      type: 'storage',
      status: 'online',
      cpu: 12,
      memory: 35,
      storage: 78,
      temperature: 38,
      uptime: '20天 6小时'
    },
    {
      id: 'storage-2',
      name: '存储节点-2', 
      type: 'storage',
      status: 'warning',
      cpu: 8,
      memory: 28,
      storage: 89,
      temperature: 52,
      uptime: '20天 6小时'
    },
    {
      id: 'storage-3',
      name: '存储节点-3',
      type: 'storage', 
      status: 'online',
      cpu: 15,
      memory: 42,
      storage: 65,
      temperature: 41,
      uptime: '20天 6小时'
    }
  ]);

  useEffect(() => {
    // 模拟实时数据
    const generateMetrics = () => {
      const now = new Date();
      const newMetrics: SystemMetrics[] = [];
      
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        newMetrics.push({
          time: timestamp.toISOString(),
          cpu: 40 + Math.random() * 40,
          memory: 30 + Math.random() * 50,
          storage: 60 + Math.random() * 20,
          network: 20 + Math.random() * 60
        });
      }
      
      setMetrics(newMetrics);
    };

    generateMetrics();
    const interval = setInterval(generateMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'offline': return 'bg-error';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'offline': return <AlertTriangle className="w-4 h-4 text-error" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">系统监控</h1>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新数据
        </Button>
      </div>

      {/* 系统状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">计算节点</p>
                <p className="text-2xl font-bold">2/2</p>
                <p className="text-xs text-success">在线</p>
              </div>
              <Server className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">存储节点</p>
                <p className="text-2xl font-bold">2/3</p>
                <p className="text-xs text-warning">1个预警</p>
              </div>
              <HardDrive className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均CPU使用率</p>
                <p className="text-2xl font-bold">56%</p>
                <p className="text-xs text-success">正常</p>
              </div>
              <Cpu className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">网络流量</p>
                <p className="text-2xl font-bold">2.4GB/s</p>
                <p className="text-xs text-success">正常</p>
              </div>
              <Network className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 预警信息 */}
      <Alert className="border-warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          存储节点-2 磁盘使用率达到89%，建议清理临时文件或扩容
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">系统概览</TabsTrigger>
          <TabsTrigger value="nodes">节点状态</TabsTrigger>
          <TabsTrigger value="performance">性能监控</TabsTrigger>
          <TabsTrigger value="alerts">告警管理</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>系统资源趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceChart data={metrics} type="area" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>存储分布</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>存储节点-1</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>存储节点-2</span>
                    <span>89%</span>
                  </div>
                  <Progress value={89} className="[&>div]:bg-warning" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>存储节点-3</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nodes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node) => (
              <Card key={node.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{node.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(node.status)}
                      <Badge variant={node.status === 'online' ? 'default' : node.status === 'warning' ? 'secondary' : 'destructive'}>
                        {node.status === 'online' ? '在线' : node.status === 'warning' ? '预警' : '离线'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU</span>
                      <span>{node.cpu}%</span>
                    </div>
                    <Progress value={node.cpu} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>内存</span>
                      <span>{node.memory}%</span>
                    </div>
                    <Progress value={node.memory} />
                  </div>
                  
                  {node.storage !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>存储</span>
                        <span>{node.storage}%</span>
                      </div>
                      <Progress value={node.storage} className={node.storage > 85 ? "[&>div]:bg-warning" : ""} />
                    </div>
                  )}
                  
                  <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                    <div>温度: {node.temperature}°C</div>
                    <div>运行时间: {node.uptime}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>详细性能监控</CardTitle>
            </CardHeader>
            <CardContent>
              <ResourceChart data={metrics} type="line" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>告警规则配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  CPU使用率持续1小时超过90%时触发告警
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  存储使用率超过85%时触发预警
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  节点温度超过55°C时触发告警
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}