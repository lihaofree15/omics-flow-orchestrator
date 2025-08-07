# 项目结构重组说明 | Project Structure Reorganization

## 📋 重组概览 | Reorganization Overview

本文档详细说明了生物信息学分析平台的项目结构重组过程和新的组织方式。

This document details the project structure reorganization process and new organization of the bioinformatics analysis platform.

## 🔄 重组前后对比 | Before/After Comparison

### 原始结构 | Original Structure
```
project-root/
├── src/                    # 前端源码 | Frontend source
├── backend/                # 后端应用 | Backend app  
├── public/                 # 静态资源 | Static assets
├── workflow-steps/         # 工作流步骤 | Workflow steps
├── config/                 # 配置文件 | Config files
├── docs/                   # 文档 | Documentation
├── package.json            # 根依赖 | Root dependencies
└── 各种配置文件...          # Various config files...
```

### 新结构 | New Structure
```
bioinformatics-platform/
├── apps/                          # 🏗️ 应用程序目录
│   ├── frontend/                  # 🌐 React前端应用
│   │   ├── src/                   # 前端源码
│   │   │   ├── components/        # React组件
│   │   │   │   ├── charts/        # 图表组件
│   │   │   │   └── (其他组件)      # Other components  
│   │   │   ├── pages/             # 页面组件
│   │   │   ├── hooks/             # React Hooks
│   │   │   ├── services/          # API服务
│   │   │   ├── lib/               # 工具库
│   │   │   ├── assets/            # 静态资源
│   │   │   └── types/             # 前端类型
│   │   ├── public/                # 公共静态文件
│   │   ├── index.html             # HTML入口
│   │   ├── vite.config.ts         # Vite配置
│   │   ├── tailwind.config.ts     # Tailwind配置
│   │   ├── tsconfig*.json         # TypeScript配置
│   │   ├── eslint.config.js       # ESLint配置
│   │   ├── postcss.config.js      # PostCSS配置
│   │   ├── components.json        # UI组件配置
│   │   └── package.json           # 前端依赖
│   └── backend/                   # 🔧 Node.js后端应用
│       ├── src/                   # 后端源码
│       │   ├── controllers/       # 控制器层
│       │   ├── services/          # 服务层
│       │   ├── models/            # 数据模型
│       │   ├── routes/            # 路由定义
│       │   ├── middleware/        # 中间件
│       │   ├── scripts/           # 脚本文件
│       │   ├── config/            # 配置管理
│       │   ├── types/             # 后端类型
│       │   └── index.ts           # 应用入口
│       ├── Dockerfile             # Docker配置
│       ├── docker-compose.yml     # Docker Compose
│       ├── nodemon.json           # Nodemon配置
│       ├── tsconfig.json          # TypeScript配置
│       ├── .env                   # 环境变量
│       ├── .env.example           # 环境变量示例
│       ├── README.md              # 后端文档
│       └── package.json           # 后端依赖
├── packages/                      # 📦 共享包目录
│   ├── shared-types/              # 🔗 共享类型定义
│   │   ├── src/                   # 类型源码
│   │   │   ├── shared-types.ts    # 通用共享类型
│   │   │   ├── backend-types.ts   # 后端特有类型
│   │   │   ├── frontend-types.ts  # 前端特有类型
│   │   │   └── index.ts           # 类型导出
│   │   ├── package.json           # 类型包配置
│   │   └── tsconfig.json          # TypeScript配置
│   ├── ui-components/             # 🎨 共享UI组件
│   │   ├── ui/                    # UI组件库
│   │   │   ├── button.tsx         # 按钮组件
│   │   │   ├── card.tsx           # 卡片组件
│   │   │   ├── input.tsx          # 输入组件
│   │   │   └── (50+其他组件)      # 50+ other components
│   │   ├── src/                   # 组件源码
│   │   │   └── index.ts           # 组件导出
│   │   ├── package.json           # UI包配置
│   │   └── tsconfig.json          # TypeScript配置
│   └── bioinformatics-utils/      # 🧬 生物信息学工具
│       ├── src/                   # 工具源码
│       │   ├── file-utils.ts      # 文件处理工具
│       │   └── index.ts           # 工具导出
│       ├── package.json           # 工具包配置
│       └── tsconfig.json          # TypeScript配置
├── workflows/                     # 🔬 工作流目录
│   ├── nextflow/                  # 🌊 Nextflow工作流
│   │   ├── main.nf                # 主工作流文件
│   │   ├── nextflow.config        # Nextflow配置
│   │   └── modules/               # 工作流模块
│   │       └── quality_control.nf # 质量控制模块
│   ├── rules/                     # 📋 分析规则
│   │   ├── quality_control.rules  # 质量控制规则
│   │   ├── alignment.rules        # 比对规则
│   │   ├── quantification.rules   # 定量规则
│   │   ├── differential_expression.rules # 差异表达规则
│   │   └── variant_calling.rules  # 变异检测规则
│   └── configs/                   # ⚙️ 工作流配置
│       ├── config.yaml            # 主配置文件
│       └── metadata.tsv           # 元数据文件
├── docs/                          # 📚 文档目录
│   ├── DEPENDENCIES_INSTALLATION_GUIDE.md # 依赖安装指南
│   └── platform-guides/          # 平台指南
├── scripts/                       # 🔨 构建脚本
│   ├── build.sh                  # 构建脚本
│   └── dev.sh                    # 开发脚本
├── configs/                       # 🔧 项目配置
└── tools/                         # 🛠️ 开发工具
```

## 🎯 重组目标与收益 | Reorganization Goals & Benefits

### 目标 | Goals

1. **模块化分离** | Modular Separation
   - 前后端应用完全分离 | Complete frontend/backend separation
   - 共享代码提取到独立包 | Shared code extracted to independent packages
   - 工作流独立管理 | Independent workflow management

2. **可维护性提升** | Improved Maintainability  
   - 清晰的代码组织结构 | Clear code organization
   - 降低耦合度 | Reduced coupling
   - 便于协作开发 | Easier collaborative development

3. **可扩展性增强** | Enhanced Scalability
   - 支持未来功能扩展 | Support for future feature expansion
   - 便于添加新的应用 | Easy addition of new applications
   - 模块化组件复用 | Modular component reuse

### 收益 | Benefits

✅ **开发体验改善** | Improved Development Experience
- 独立的前后端开发环境 | Independent frontend/backend development
- 热重载和快速构建 | Hot reload and fast builds
- 清晰的依赖管理 | Clear dependency management

✅ **代码复用性** | Code Reusability  
- 共享类型定义防止类型不一致 | Shared types prevent inconsistencies
- UI组件库支持跨项目复用 | UI library supports cross-project reuse
- 生物信息学工具函数统一管理 | Unified bioinformatics utilities

✅ **工作流管理** | Workflow Management
- Nextflow工作流模块化 | Modular Nextflow workflows
- 配置文件集中管理 | Centralized configuration management
- 支持多种分析类型 | Support for multiple analysis types

✅ **部署和运维** | Deployment & Operations
- 独立的应用部署 | Independent application deployment
- 容器化支持 | Containerization support
- 统一的构建流程 | Unified build process

## 📂 目录功能说明 | Directory Function Description

### apps/ - 应用程序目录 | Applications Directory

包含所有可独立运行的应用程序，采用微服务架构。

Contains all independently runnable applications using microservice architecture.

- **frontend/**: React前端单页应用，负责用户界面 | React SPA for user interface
- **backend/**: Node.js后端API服务，处理业务逻辑 | Node.js API service for business logic

### packages/ - 共享包目录 | Shared Packages Directory

存放可复用的代码模块，支持跨应用共享。

Contains reusable code modules for cross-application sharing.

- **shared-types/**: 前后端共享的TypeScript类型定义 | Shared TypeScript type definitions
- **ui-components/**: 基于shadcn/ui的组件库 | Component library based on shadcn/ui
- **bioinformatics-utils/**: 生物信息学专用工具函数 | Bioinformatics-specific utilities

### workflows/ - 工作流目录 | Workflows Directory

包含所有生物信息学分析工作流和相关配置。

Contains all bioinformatics analysis workflows and configurations.

- **nextflow/**: Nextflow DSL2工作流实现 | Nextflow DSL2 workflow implementation
- **rules/**: 模块化分析步骤定义 | Modular analysis step definitions  
- **configs/**: 工作流配置和参数文件 | Workflow configurations and parameters

### scripts/ - 脚本目录 | Scripts Directory

提供开发、构建、部署等自动化脚本。

Provides automation scripts for development, build, and deployment.

- **build.sh**: 全项目构建脚本 | Full project build script
- **dev.sh**: 开发环境启动脚本 | Development environment startup script

## 🚀 使用新结构的工作流 | Working with the New Structure

### 开发工作流 | Development Workflow

1. **启动开发环境** | Start Development Environment
   ```bash
   # 一键启动前后端 | Start frontend and backend
   npm run dev
   
   # 或分别启动 | Or start separately  
   npm run frontend:dev
   npm run backend:dev
   ```

2. **开发共享包** | Develop Shared Packages
   ```bash
   # 构建所有共享包 | Build all shared packages
   npm run packages:build
   
   # 监听模式开发 | Watch mode development
   cd packages/ui-components
   npm run dev
   ```

3. **工作流开发** | Workflow Development
   ```bash
   # 验证工作流 | Validate workflows
   npm run workflow:validate
   
   # 测试工作流 | Test workflows
   cd workflows/nextflow
   nextflow run main.nf -profile test
   ```

### 构建部署流程 | Build & Deployment Process

1. **构建所有应用** | Build All Applications
   ```bash
   npm run build
   ```

2. **Docker部署** | Docker Deployment
   ```bash
   # 前端
   cd apps/frontend && docker build -t frontend .
   
   # 后端  
   cd apps/backend && docker-compose up -d
   ```

## 🔧 配置文件管理 | Configuration Management

### 环境配置 | Environment Configuration

- **开发环境** | Development: 使用 `.env` 文件 | Use `.env` files
- **生产环境** | Production: 使用环境变量或配置中心 | Use env vars or config center
- **工作流配置** | Workflow Config: `workflows/configs/` 目录 | In `workflows/configs/` directory

### 包管理配置 | Package Management Configuration

- **Workspaces**: npm workspaces管理多包 | npm workspaces for multi-package management
- **依赖共享** | Dependency Sharing: 避免重复安装 | Avoid duplicate installations
- **版本管理** | Version Management: 统一版本控制 | Unified version control

## 📈 后续改进计划 | Future Improvement Plans

### 短期目标 | Short-term Goals

- [ ] 完善单元测试覆盖 | Complete unit test coverage
- [ ] 添加集成测试 | Add integration tests  
- [ ] 优化构建性能 | Optimize build performance
- [ ] 完善文档系统 | Complete documentation system

### 长期目标 | Long-term Goals

- [ ] 微前端架构支持 | Micro-frontend architecture support
- [ ] 插件系统实现 | Plugin system implementation
- [ ] 多租户支持 | Multi-tenancy support
- [ ] 云原生部署优化 | Cloud-native deployment optimization

---

通过这次重组，项目结构更加清晰，代码组织更加合理，为后续的功能开发和维护奠定了良好的基础。

Through this reorganization, the project structure is clearer, code organization is more reasonable, laying a solid foundation for future feature development and maintenance.