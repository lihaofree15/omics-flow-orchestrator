import { NavLink } from "react-router-dom";
import { 
  Activity, 
  Database, 
  Workflow, 
  BarChart3, 
  Settings, 
  Cpu, 
  FileText,
  Dna,
  Microscope,
  GitBranch
} from "lucide-react";

const navItems = [
  {
    label: "控制台",
    path: "/",
    icon: Activity,
    description: "硬件状态与任务概览"
  },
  {
    label: "数据管理",
    path: "/data-management",
    icon: Database,
    description: "分布式存储管理"
  },
  {
    label: "分析流程",
    path: "/workflows",
    icon: Workflow,
    children: [
      {
        label: "转录组分析",
        path: "/workflows/transcriptome",
        icon: Dna,
        description: "RNA-seq数据处理流程"
      },
      {
        label: "单细胞分析",
        path: "/workflows/single-cell",
        icon: Microscope,
        description: "单细胞转录组分析"
      },
      {
        label: "基因组变异",
        path: "/workflows/genomics",
        icon: GitBranch,
        description: "变异检测与注释"
      }
    ]
  },
  {
    label: "结果展示",
    path: "/results",
    icon: BarChart3,
    description: "分析结果可视化"
  },
  {
    label: "系统监控",
    path: "/monitoring",
    icon: Cpu,
    description: "硬件资源监控"
  },
  {
    label: "系统设置",
    path: "/settings",
    icon: Settings,
    description: "平台配置管理"
  }
];

export function Sidebar() {
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo区域 */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Dna className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">多组学分析平台</h1>
            <p className="text-xs text-muted-foreground">Multi-Omics Platform</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <div key={item.path}>
            {item.children ? (
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
                <div className="ml-7 space-y-1">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={({ isActive }) =>
                        `nav-item text-sm ${isActive ? 'active' : ''}`
                      }
                    >
                      <child.icon className="w-4 h-4" />
                      <span>{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      {/* 底部状态信息 */}
      <div className="p-4 border-t border-border">
        <div className="resource-card p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">系统状态</span>
            <div className="status-indicator running"></div>
          </div>
          <div className="text-xs text-muted-foreground">
            计算节点: 2/2 在线<br />
            存储节点: 3/3 正常
          </div>
        </div>
      </div>
    </div>
  );
}