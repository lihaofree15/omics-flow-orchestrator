import { Bell, User, Search, RefreshCw } from "lucide-react";

// Simple button component replacement
const Button = ({ children, className = "", variant = "default", size = "default", ...props }: any) => (
  <button 
    className={`px-4 py-2 rounded-md font-medium transition-colors ${
      variant === "outline" ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" :
      variant === "ghost" ? "text-gray-700 hover:bg-gray-100" :
      "bg-blue-600 text-white hover:bg-blue-700"
    } ${size === "sm" ? "px-2 py-1 text-sm" : ""} ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Simple input component replacement
const Input = ({ className = "", ...props }: any) => (
  <input 
    className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    {...props}
  />
);

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