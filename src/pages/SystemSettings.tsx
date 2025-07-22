import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">系统设置</h1>
      <Card className="resource-card">
        <CardHeader>
          <CardTitle>平台配置管理</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">系统设置页面开发中...</p>
        </CardContent>
      </Card>
    </div>
  );
}