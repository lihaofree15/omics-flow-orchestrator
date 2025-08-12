import { Bell, User, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* 左侧 - 搜索栏 */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="搜索任务、数据或工作流..." 
            className="pl-10 bg-background border-border"
          />
        </div>
      </div>

      {/* 右侧 - 操作按钮和用户信息 */}
      <div className="flex items-center gap-4">
        {/* 刷新按钮 */}
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </Button>

        {/* 通知按钮 */}
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></span>
        </Button>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-border"></div>

        {/* 用户信息 */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">生信分析师</div>
            <div className="text-xs text-muted-foreground">admin@biotech.lab</div>
          </div>
          <Button variant="ghost" size="sm" className="w-8 h-8 rounded-full bg-primary/10">
            <User className="w-4 h-4 text-primary" />
          </Button>
        </div>
      </div>
    </header>
  );
}