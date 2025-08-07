# 生物信息学分析平台 | Bioinformatics Analysis Platform

> 🧬 一个全面的生物信息学分析平台，提供Web界面和工作流管理功能

## 项目概述 | Project Overview

本项目是一个现代化的生物信息学分析平台，支持RNA-seq、DNA-seq、单细胞分析等多种生物信息学工作流。平台采用微服务架构，包含前端Web界面、后端API服务、以及基于Nextflow的分析工作流。

This project is a modern bioinformatics analysis platform supporting various workflows including RNA-seq, DNA-seq, single-cell analysis, and more. The platform uses microservice architecture with a frontend web interface, backend API services, and Nextflow-based analysis workflows.

## 🏗️ 项目结构 | Project Structure

```
bioinformatics-platform/
├── apps/                          # 应用程序 | Applications
│   ├── frontend/                  # React前端应用 | React Frontend App
│   │   ├── src/                   # 源代码 | Source Code
│   │   │   ├── components/        # React组件 | React Components
│   │   │   ├── pages/             # 页面组件 | Page Components
│   │   │   ├── hooks/             # React Hooks
│   │   │   ├── services/          # API服务 | API Services
│   │   │   └── types/             # 类型定义 | Type Definitions
│   │   ├── public/                # 静态资源 | Static Assets
│   │   └── package.json           # 前端依赖 | Frontend Dependencies
│   └── backend/                   # Node.js后端应用 | Node.js Backend App
│       ├── src/                   # 源代码 | Source Code
│       │   ├── controllers/       # 控制器 | Controllers
│       │   ├── services/          # 业务逻辑 | Business Logic
│       │   ├── models/            # 数据模型 | Data Models
│       │   ├── routes/            # 路由 | Routes
│       │   └── middleware/        # 中间件 | Middleware
│       └── package.json           # 后端依赖 | Backend Dependencies
├── packages/                      # 共享包 | Shared Packages
│   ├── shared-types/             # 共享类型定义 | Shared Type Definitions
│   ├── ui-components/            # 共享UI组件 | Shared UI Components
│   └── bioinformatics-utils/     # 生物信息学工具库 | Bioinformatics Utilities
├── workflows/                     # 分析工作流 | Analysis Workflows
│   ├── nextflow/                 # Nextflow工作流 | Nextflow Workflows
│   │   ├── main.nf               # 主工作流文件 | Main Workflow File
│   │   ├── modules/              # 工作流模块 | Workflow Modules
│   │   └── nextflow.config       # Nextflow配置 | Nextflow Configuration
│   ├── rules/                    # 分析规则 | Analysis Rules
│   └── configs/                  # 工作流配置 | Workflow Configurations
├── docs/                         # 文档 | Documentation
├── scripts/                      # 构建和部署脚本 | Build and Deployment Scripts
│   ├── build.sh                 # 构建脚本 | Build Script
│   └── dev.sh                   # 开发脚本 | Development Script
├── configs/                      # 项目级配置 | Project-level Configurations
└── tools/                        # 开发工具 | Development Tools
```

## 🚀 快速开始 | Quick Start

### 环境要求 | Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Nextflow** >= 21.10.3 (可选，用于工作流 | Optional, for workflows)
- **Docker** (推荐，用于容器化部署 | Recommended, for containerized deployment)

### 安装依赖 | Installation

```bash
# 克隆仓库 | Clone repository
git clone <repository-url>
cd bioinformatics-platform

# 安装所有依赖 | Install all dependencies
npm run install:all

# 或者手动安装 | Or install manually
npm install
```

### 开发模式 | Development Mode

```bash
# 启动开发服务器 (前端 + 后端) | Start development servers (frontend + backend)
npm run dev

# 或者分别启动 | Or start separately
npm run frontend:dev  # 前端: http://localhost:5173
npm run backend:dev   # 后端: http://localhost:3001
```

### 生产构建 | Production Build

```bash
# 构建所有应用 | Build all applications
npm run build

# 构建特定应用 | Build specific applications
npm run frontend:build
npm run backend:build
npm run packages:build
```

## 📦 包管理 | Package Management

本项目使用npm workspaces进行包管理，支持以下包：

This project uses npm workspaces for package management with the following packages:

### 共享包 | Shared Packages

- **@bioinformatics-platform/shared-types**: 前后端共享的类型定义 | Shared type definitions
- **@bioinformatics-platform/ui-components**: 可复用的UI组件库 | Reusable UI component library  
- **@bioinformatics-platform/utils**: 生物信息学工具函数 | Bioinformatics utility functions

### 应用包 | Application Packages

- **frontend**: React前端应用 | React frontend application
- **backend**: Node.js后端API | Node.js backend API

## 🔬 工作流 | Workflows

### Nextflow工作流 | Nextflow Workflows

平台集成了模块化的Nextflow工作流，支持：

The platform includes modular Nextflow workflows supporting:

- **质量控制 | Quality Control**: FastQC, Trimmomatic, MultiQC
- **序列比对 | Sequence Alignment**: STAR, BWA, HISAT2
- **表达定量 | Expression Quantification**: featureCounts, Salmon, RSEM
- **差异表达分析 | Differential Expression**: DESeq2, edgeR, limma
- **变异检测 | Variant Calling**: GATK, FreeBayes

### 运行工作流 | Running Workflows

```bash
# 验证工作流 | Validate workflows
npm run workflow:validate

# 运行RNA-seq分析 | Run RNA-seq analysis
cd workflows/nextflow
nextflow run main.nf --input "data/*.fastq.gz" --analysis_type rna-seq

# 运行变异检测 | Run variant calling
nextflow run main.nf --input "data/*.fastq.gz" --analysis_type variant-calling
```

## 🔧 开发指南 | Development Guide

### 代码结构 | Code Structure

1. **前端 | Frontend** (`apps/frontend`):
   - React 18 + TypeScript
   - Vite构建工具 | Vite build tool
   - Tailwind CSS样式 | Tailwind CSS styling
   - shadcn/ui组件库 | shadcn/ui component library

2. **后端 | Backend** (`apps/backend`):
   - Node.js + Express
   - TypeScript
   - MongoDB数据库 | MongoDB database
   - JWT认证 | JWT authentication

3. **共享包 | Shared Packages** (`packages/`):
   - TypeScript模块 | TypeScript modules
   - 独立构建和测试 | Independent build and testing

### 添加新功能 | Adding New Features

1. **前端组件 | Frontend Components**:
   ```bash
   cd apps/frontend/src/components
   # 创建新组件 | Create new component
   ```

2. **后端API | Backend API**:
   ```bash
   cd apps/backend/src
   # 添加路由、控制器和服务 | Add routes, controllers, and services
   ```

3. **共享工具 | Shared Utilities**:
   ```bash
   cd packages/bioinformatics-utils/src
   # 添加工具函数 | Add utility functions
   ```

## 📊 功能特性 | Features

### ✅ 已实现功能 | Implemented Features

- 🔐 用户认证和权限管理 | User authentication and authorization
- 📁 项目管理和文件上传 | Project management and file upload
- 🧪 样本管理和分组 | Sample management and grouping
- 🔄 工作流执行和监控 | Workflow execution and monitoring
- 📈 结果可视化 | Results visualization
- ⚙️ 系统监控 | System monitoring

### 🚧 开发中功能 | In Development

- 🤖 自动化报告生成 | Automated report generation
- 🔍 高级搜索和筛选 | Advanced search and filtering
- 📱 移动端优化 | Mobile optimization
- 🔌 插件系统 | Plugin system

## 🛠️ 运维部署 | Operations & Deployment

### Docker部署 | Docker Deployment

```bash
# 构建镜像 | Build images
docker-compose build

# 启动服务 | Start services
docker-compose up -d

# 查看日志 | View logs
docker-compose logs -f
```

### 环境配置 | Environment Configuration

1. 复制环境变量文件 | Copy environment files:
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

2. 配置数据库连接 | Configure database connection
3. 设置文件存储路径 | Set file storage paths
4. 配置Nextflow执行器 | Configure Nextflow executor

## 📚 文档 | Documentation

- [API文档 | API Documentation](./docs/api.md)
- [工作流文档 | Workflow Documentation](./docs/workflows.md)
- [部署指南 | Deployment Guide](./docs/deployment.md)
- [开发指南 | Development Guide](./docs/development.md)

## 🤝 贡献指南 | Contributing

1. Fork本仓库 | Fork the repository
2. 创建特性分支 | Create a feature branch
3. 提交更改 | Commit your changes
4. 推送到分支 | Push to the branch
5. 创建Pull Request | Create a Pull Request

## 📄 许可证 | License

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 联系我们 | Contact

- 项目维护者 | Project Maintainer: Bioinformatics Platform Team
- 邮箱 | Email: [contact@bioinformatics-platform.com](mailto:contact@bioinformatics-platform.com)
- 问题反馈 | Issues: [GitHub Issues](https://github.com/bioinformatics-platform/platform/issues)

---

**🧬 让生物信息学分析更简单、更高效！ | Making bioinformatics analysis simpler and more efficient!**
