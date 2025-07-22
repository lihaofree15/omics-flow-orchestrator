import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemMonitoring() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">系统监控</h1>
      <Card className="resource-card">
        <CardHeader>
          <CardTitle>硬件资源实时监控</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">系统监控页面开发中...</p>
        </CardContent>
      </Card>
    </div>
  );
}