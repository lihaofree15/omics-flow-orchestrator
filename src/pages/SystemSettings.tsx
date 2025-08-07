import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Network,
  Save,
  RotateCcw,
  Info
} from "lucide-react";
import { useState } from "react";

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    // 系统配置
    systemName: "多组学分析平台",
    maxConcurrentJobs: 10,
    defaultTimeout: 24,
    autoCleanup: true,
    logLevel: "info",
    
    // 资源配置
    cpuCoresPerJob: 16,
    memoryPerJob: 64,
    maxStoragePerProject: 1000,
    
    // 安全配置
    sessionTimeout: 8,
    enableAuditLog: true,
    requirePasswordChange: false,
    
    // 通知配置
    emailNotifications: true,
    systemAlerts: true,
    jobCompletion: true,
    
    // 网络配置
    maxUploadSize: 10,
    networkTimeout: 300,
    enableCompression: true
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // 保存设置逻辑
    console.log('保存设置:', settings);
  };

  const handleReset = () => {
    // 重置设置逻辑
    console.log('重置设置');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">系统设置</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            保存设置
          </Button>
        </div>
      </div>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="system">系统配置</TabsTrigger>
          <TabsTrigger value="resources">资源管理</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
          <TabsTrigger value="notifications">通知设置</TabsTrigger>
          <TabsTrigger value="network">网络配置</TabsTrigger>
          <TabsTrigger value="advanced">高级设置</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                基础系统配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="systemName">系统名称</Label>
                  <Input
                    id="systemName"
                    value={settings.systemName}
                    onChange={(e) => handleSettingChange('systemName', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxJobs">最大并发任务数</Label>
                  <Input
                    id="maxJobs"
                    type="number"
                    value={settings.maxConcurrentJobs}
                    onChange={(e) => handleSettingChange('maxConcurrentJobs', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeout">默认任务超时(小时)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={settings.defaultTimeout}
                    onChange={(e) => handleSettingChange('defaultTimeout', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logLevel">日志级别</Label>
                  <Select value={settings.logLevel} onValueChange={(value) => handleSettingChange('logLevel', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">调试</SelectItem>
                      <SelectItem value="info">信息</SelectItem>
                      <SelectItem value="warning">警告</SelectItem>
                      <SelectItem value="error">错误</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="autoCleanup">自动清理临时文件</Label>
                  <p className="text-sm text-muted-foreground">定期清理过期的临时分析文件</p>
                </div>
                <Switch
                  id="autoCleanup"
                  checked={settings.autoCleanup}
                  onCheckedChange={(checked) => handleSettingChange('autoCleanup', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                计算资源配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cpuCores">单任务默认CPU核数</Label>
                  <Input
                    id="cpuCores"
                    type="number"
                    value={settings.cpuCoresPerJob}
                    onChange={(e) => handleSettingChange('cpuCoresPerJob', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">最大32核</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="memory">单任务默认内存(GB)</Label>
                  <Input
                    id="memory"
                    type="number"
                    value={settings.memoryPerJob}
                    onChange={(e) => handleSettingChange('memoryPerJob', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">最大128GB</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storage">单项目存储限额(GB)</Label>
                  <Input
                    id="storage"
                    type="number"
                    value={settings.maxStoragePerProject}
                    onChange={(e) => handleSettingChange('maxStoragePerProject', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  资源配置影响系统性能，请根据硬件规格合理设置
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                安全与访问控制
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">会话超时(小时)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="auditLog">启用审计日志</Label>
                    <p className="text-sm text-muted-foreground">记录用户操作和系统事件</p>
                  </div>
                  <Switch
                    id="auditLog"
                    checked={settings.enableAuditLog}
                    onCheckedChange={(checked) => handleSettingChange('enableAuditLog', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="passwordChange">强制定期更改密码</Label>
                    <p className="text-sm text-muted-foreground">要求用户每90天更改密码</p>
                  </div>
                  <Switch
                    id="passwordChange"
                    checked={settings.requirePasswordChange}
                    onCheckedChange={(checked) => handleSettingChange('requirePasswordChange', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                通知与提醒设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="emailNotifications">邮件通知</Label>
                  <p className="text-sm text-muted-foreground">发送重要通知到用户邮箱</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="systemAlerts">系统告警</Label>
                  <p className="text-sm text-muted-foreground">硬件异常和系统错误提醒</p>
                </div>
                <Switch
                  id="systemAlerts"
                  checked={settings.systemAlerts}
                  onCheckedChange={(checked) => handleSettingChange('systemAlerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="jobCompletion">任务完成通知</Label>
                  <p className="text-sm text-muted-foreground">分析任务完成后发送通知</p>
                </div>
                <Switch
                  id="jobCompletion"
                  checked={settings.jobCompletion}
                  onCheckedChange={(checked) => handleSettingChange('jobCompletion', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                网络与传输配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="uploadSize">最大上传文件大小(GB)</Label>
                  <Input
                    id="uploadSize"
                    type="number"
                    value={settings.maxUploadSize}
                    onChange={(e) => handleSettingChange('maxUploadSize', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="networkTimeout">网络超时(秒)</Label>
                  <Input
                    id="networkTimeout"
                    type="number"
                    value={settings.networkTimeout}
                    onChange={(e) => handleSettingChange('networkTimeout', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="compression">启用数据压缩</Label>
                  <p className="text-sm text-muted-foreground">压缩传输数据以节省带宽</p>
                </div>
                <Switch
                  id="compression"
                  checked={settings.enableCompression}
                  onCheckedChange={(checked) => handleSettingChange('enableCompression', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>高级配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customConfig">自定义配置</Label>
                <Textarea
                  id="customConfig"
                  placeholder="JSON格式的高级配置选项..."
                  className="min-h-[200px]"
                />
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  高级配置需要技术人员操作，错误的配置可能导致系统异常
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}