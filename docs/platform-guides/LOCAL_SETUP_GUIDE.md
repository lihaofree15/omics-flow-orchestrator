# 本地环境运行指南 / Local Environment Setup Guide

本指南将帮助您在本地计算机上设置和运行生物信息学分析流程。

## 系统要求 / System Requirements

### 最低硬件要求 / Minimum Hardware Requirements
- **CPU**: 8核或更多 (推荐16核+)
- **内存**: 32GB RAM (推荐64GB+)
- **存储**: 500GB 可用空间 (推荐1TB+ SSD)
- **网络**: 稳定的互联网连接用于下载容器镜像

### 支持的操作系统 / Supported Operating Systems
- **Linux**: Ubuntu 20.04+, CentOS 8+, RHEL 8+
- **macOS**: 10.15+ (Catalina或更新版本)
- **Windows**: Windows 10/11 (需要WSL2)

## 前置软件安装 / Prerequisites Installation

### 1. Docker 安装

#### Linux (Ubuntu/Debian)
```bash
# 更新包索引
sudo apt-get update

# 安装必要的包
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# 添加Docker官方GPG密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 设置稳定版仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 将用户添加到docker组
sudo usermod -aG docker $USER
```

#### macOS
```bash
# 使用Homebrew安装
brew install --cask docker

# 或从官网下载安装包
# https://docs.docker.com/desktop/mac/install/
```

#### Windows (WSL2)
```bash
# 安装WSL2
wsl --install

# 从官网下载Docker Desktop for Windows
# https://docs.docker.com/desktop/windows/install/
```

### 2. Node.js 安装

#### 使用 Node Version Manager (推荐)
```bash
# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新载入终端配置
source ~/.bashrc

# 安装Node.js LTS版本
nvm install --lts
nvm use --lts
```

#### 直接安装
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node

# 验证安装
node --version
npm --version
```

### 3. Nextflow 安装

```bash
# 安装Java (Nextflow依赖)
sudo apt-get install -y openjdk-11-jdk  # Linux
brew install openjdk@11                 # macOS

# 安装Nextflow
curl -s https://get.nextflow.io | bash

# 移动到PATH中
sudo mv nextflow /usr/local/bin/

# 验证安装
nextflow -version
```

### 4. MongoDB 安装

#### Docker方式 (推荐)
```bash
# 运行MongoDB容器
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:5.0
```

#### 本地安装
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# macOS
brew tap mongodb/brew
brew install mongodb-community@5.0
brew services start mongodb/brew/mongodb-community
```

## 项目部署 / Project Deployment

### 1. 克隆项目

```bash
git clone <项目仓库地址>
cd genomics-analysis-platform
```

### 2. 环境配置

#### 后端配置
```bash
cd backend

# 安装依赖
npm install

# 创建环境配置文件
cp .env.example .env

# 编辑配置文件
nano .env
```

**.env 配置示例**:
```env
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/genomics_analysis
MONGODB_TEST_URI=mongodb://localhost:27017/genomics_analysis_test

# JWT配置
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# 服务器配置
NODE_ENV=development
PORT=5000

# 文件存储配置
UPLOAD_PATH=/path/to/uploads
MAX_FILE_SIZE=10737418240  # 10GB

# Nextflow配置
NEXTFLOW_WORK_DIR=/tmp/nextflow-work
NEXTFLOW_OUTPUT_DIR=/path/to/results

# 外部工具路径
DOCKER_CMD=docker
NEXTFLOW_CMD=nextflow

# 邮件配置 (可选)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### 前端配置
```bash
cd ../

# 安装依赖
npm install

# 创建环境配置文件
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
```

### 3. 启动服务

#### 启动后端
```bash
cd backend
npm run dev
```

#### 启动前端 (新终端)
```bash
npm run dev
```

### 4. 验证部署

访问以下地址验证部署：
- 前端应用: http://localhost:5173
- 后端API: http://localhost:5000/api/health

## 数据准备 / Data Preparation

### 1. 参考基因组准备

```bash
# 创建参考数据目录
mkdir -p reference

# 下载人类参考基因组 (示例)
cd reference

# 基因组序列
wget http://ftp.ensembl.org/pub/release-107/fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.primary_assembly.fa.gz
gunzip Homo_sapiens.GRCh38.dna.primary_assembly.fa.gz
mv Homo_sapiens.GRCh38.dna.primary_assembly.fa genome.fa

# 基因注释
wget http://ftp.ensembl.org/pub/release-107/gtf/homo_sapiens/Homo_sapiens.GRCh38.107.gtf.gz
gunzip Homo_sapiens.GRCh38.107.gtf.gz
mv Homo_sapiens.GRCh38.107.gtf annotation.gtf

# 转录本序列
wget http://ftp.ensembl.org/pub/release-107/fasta/homo_sapiens/cdna/Homo_sapiens.GRCh38.cdna.all.fa.gz
gunzip Homo_sapiens.GRCh38.cdna.all.fa.gz
mv Homo_sapiens.GRCh38.cdna.all.fa transcripts.fa
```

### 2. 测试数据

```bash
# 创建测试数据目录
mkdir -p data/raw

# 下载示例数据 (或放置您的数据)
# 确保文件命名符合metadata.tsv中的定义
```

## 容器镜像预下载 / Container Images Pre-download

```bash
# 下载常用容器镜像
docker pull biocontainers/fastqc:v0.11.9_cv8
docker pull nfcore/star:2.7.10a
docker pull nfcore/subread:2.0.1
docker pull bioconductor/bioconductor_docker:RELEASE_3_14
docker pull broadinstitute/gatk:4.2.6.1
docker pull ewels/multiqc:latest
```

## 运行分析 / Running Analysis

### 1. 配置项目

编辑配置文件:
```bash
# 编辑样品信息
nano config/metadata.tsv

# 编辑分析参数
nano config/config.yaml
```

### 2. 通过Web界面运行

1. 访问 http://localhost:5173
2. 登录/注册账户
3. 创建新项目
4. 上传数据文件
5. 配置分析参数
6. 提交分析任务

### 3. 通过命令行运行

```bash
# 使用Nextflow直接运行
nextflow run workflow-steps/quality_control.rules \
  --metadata config/metadata.tsv \
  --config config/config.yaml \
  --outdir results/

# 或使用平台API
curl -X POST http://localhost:5000/api/workflows/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "workflowId": "<workflow_id>",
    "inputFiles": ["file1_id", "file2_id"],
    "parameters": {...}
  }'
```

## 故障排除 / Troubleshooting

### 常见问题 / Common Issues

#### 1. Docker权限问题
```bash
# 确保用户在docker组中
sudo usermod -aG docker $USER
# 重新登录或执行
newgrp docker
```

#### 2. 内存不足
```bash
# 监控资源使用
htop
docker stats

# 调整Docker内存限制
# 编辑 ~/.docker/config.json
```

#### 3. 端口冲突
```bash
# 检查端口占用
netstat -tulpn | grep :5000
lsof -i :5000

# 修改端口配置
# 编辑 .env 文件中的 PORT 变量
```

#### 4. MongoDB连接问题
```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 检查连接
mongosh "mongodb://localhost:27017/genomics_analysis"
```

### 日志查看 / Log Viewing

```bash
# 应用日志
tail -f backend/logs/app.log

# Docker容器日志
docker logs -f <container_name>

# Nextflow日志
cat .nextflow.log
```

### 性能优化 / Performance Optimization

#### 1. 调整Nextflow配置
```bash
# 编辑 nextflow.config
echo "
process {
    executor = 'local'
    cpus = 8
    memory = '16 GB'
}
docker {
    enabled = true
    fixOwnership = true
}
" > nextflow.config
```

#### 2. Docker配置优化
```bash
# 增加Docker资源限制
# 编辑 /etc/docker/daemon.json
{
  "default-runtime": "runc",
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## 维护和更新 / Maintenance and Updates

### 定期维护任务
```bash
# 清理Docker镜像
docker system prune -a

# 更新容器镜像
docker pull biocontainers/fastqc:v0.11.9_cv8

# 备份数据库
mongodump --db genomics_analysis --out backup/

# 更新项目代码
git pull origin main
npm install  # 更新依赖
```

### 监控脚本
```bash
#!/bin/bash
# 创建 monitor.sh
echo "=== 系统资源监控 ==="
echo "内存使用:"
free -h
echo "磁盘使用:"
df -h
echo "Docker状态:"
docker ps
echo "服务状态:"
curl -s http://localhost:5000/api/health || echo "后端服务未响应"
curl -s http://localhost:5173 > /dev/null || echo "前端服务未响应"
```

## 获取帮助 / Getting Help

- 项目文档: `/docs`
- 问题报告: GitHub Issues
- 技术支持: support@bioinfo.org
- 社区论坛: [链接]

---

*更新日期: 2024年1月*