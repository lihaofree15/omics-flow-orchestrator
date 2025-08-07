# 依赖安装指南 / Dependencies Installation Guide

本指南详细说明了运行生物信息学分析平台所需的所有软件依赖及其安装方法。

## 概览 / Overview

本平台包含以下主要组件和依赖：

### 技术栈 / Technology Stack
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **后端**: Node.js + Express + TypeScript + MongoDB + Redis
- **工作流**: Nextflow + Docker/Singularity
- **生物信息学工具**: 通过Docker容器提供
- **分析语言**: R + Python

## 系统级依赖 / System Dependencies

### 基础工具 / Basic Tools

#### Ubuntu/Debian
```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    unzip \
    htop \
    tree \
    vim \
    nano
```

#### CentOS/RHEL
```bash
# 更新系统包
sudo yum update -y

# 安装基础工具
sudo yum install -y \
    curl \
    wget \
    git \
    gcc \
    gcc-c++ \
    make \
    unzip \
    htop \
    tree \
    vim \
    nano
```

#### macOS
```bash
# 安装Homebrew (如果尚未安装)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装基础工具
brew install \
    curl \
    wget \
    git \
    tree \
    htop
```

## Node.js 环境 / Node.js Environment

### 安装 Node.js

#### 使用 Node Version Manager (推荐)
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载shell配置
source ~/.bashrc

# 安装并使用 LTS 版本
nvm install --lts
nvm use --lts
nvm alias default node

# 验证安装
node --version  # 应该显示 v18.x.x 或更高版本
npm --version   # 应该显示 v9.x.x 或更高版本
```

#### 直接安装
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum install -y nodejs

# macOS
brew install node

# 验证安装
node --version
npm --version
```

### 前端依赖安装

```bash
# 在项目根目录中安装前端依赖
npm install

# 主要依赖说明
echo "前端主要依赖:"
echo "- React 18.3.1 - 用户界面框架"
echo "- TypeScript 5.5.3 - 类型安全的JavaScript"
echo "- Vite 5.4.1 - 构建工具和开发服务器"
echo "- Tailwind CSS 3.4.11 - CSS框架"
echo "- shadcn/ui - 组件库"
echo "- React Router DOM 6.26.2 - 路由管理"
echo "- React Hook Form 7.53.0 - 表单管理"
echo "- TanStack Query 5.56.2 - 数据获取和状态管理"
echo "- Recharts 2.12.7 - 图表组件"
echo "- Zod 3.23.8 - 模式验证"
```

### 后端依赖安装

```bash
# 安装后端依赖
cd backend
npm install

# 主要依赖说明
echo "后端主要依赖:"
echo "- Express 4.18.2 - Web框架"
echo "- TypeScript 5.3.3 - 类型安全"
echo "- MongoDB/Mongoose 8.0.3 - 数据库"
echo "- Bull 4.12.2 - 任务队列"
echo "- Socket.io 4.7.4 - 实时通信"
echo "- Winston 3.11.0 - 日志系统"
echo "- Multer 1.4.5 - 文件上传"
echo "- Sharp 0.33.1 - 图像处理"
echo "- Express Validator 7.0.1 - 输入验证"
```

## 数据库 / Databases

### MongoDB 安装

#### Docker 方式 (推荐)
```bash
# 安装并运行 MongoDB
docker run -d \
    --name mongodb \
    --restart unless-stopped \
    -p 27017:27017 \
    -v mongodb_data:/data/db \
    -e MONGO_INITDB_ROOT_USERNAME=admin \
    -e MONGO_INITDB_ROOT_PASSWORD=your_password \
    mongo:5.0

# 验证安装
docker exec -it mongodb mongosh --eval "db.runCommand('ping')"
```

#### 原生安装
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl enable mongod

# CentOS/RHEL
cat > /etc/yum.repos.d/mongodb-org-5.0.repo << 'EOF'
[mongodb-org-5.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/5.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-5.0.asc
EOF

sudo yum install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# macOS
brew tap mongodb/brew
brew install mongodb-community@5.0
brew services start mongodb/brew/mongodb-community
```

### Redis 安装

#### Docker 方式 (推荐)
```bash
# 安装并运行 Redis
docker run -d \
    --name redis \
    --restart unless-stopped \
    -p 6379:6379 \
    -v redis_data:/data \
    redis:7-alpine \
    redis-server --appendonly yes

# 验证安装
docker exec -it redis redis-cli ping
```

#### 原生安装
```bash
# Ubuntu/Debian
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# CentOS/RHEL
sudo yum install -y redis
sudo systemctl start redis
sudo systemctl enable redis

# macOS
brew install redis
brew services start redis

# 验证安装
redis-cli ping  # 应该返回 PONG
```

## 容器化环境 / Containerization

### Docker 安装

#### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 添加用户到docker组
sudo usermod -aG docker $USER

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker run hello-world
```

#### macOS
```bash
# 使用Homebrew
brew install --cask docker

# 或从官网下载Docker Desktop
# https://docs.docker.com/desktop/mac/install/
```

#### Windows
```bash
# 安装WSL2 (如果使用Windows)
wsl --install

# 从官网下载Docker Desktop for Windows
# https://docs.docker.com/desktop/windows/install/
```

### Docker Compose 安装

```bash
# Linux
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version

# macOS/Windows
# Docker Compose 已包含在 Docker Desktop 中
```

## 工作流引擎 / Workflow Engine

### Nextflow 安装

```bash
# 安装Java (Nextflow依赖)
# Ubuntu/Debian
sudo apt install -y openjdk-11-jdk

# CentOS/RHEL
sudo yum install -y java-11-openjdk

# macOS
brew install openjdk@11

# 安装Nextflow
curl -s https://get.nextflow.io | bash

# 移动到系统路径
sudo mv nextflow /usr/local/bin/

# 验证安装
nextflow -version

# 测试运行
nextflow run hello
```

### Singularity/Apptainer 安装 (用于HPC环境)

#### Ubuntu/Debian
```bash
# 安装依赖
sudo apt update
sudo apt install -y \
    build-essential \
    libssl-dev \
    uuid-dev \
    libgpgme11-dev \
    squashfs-tools \
    libseccomp-dev \
    wget \
    pkg-config \
    git \
    cryptsetup

# 安装Go
export VERSION=1.19.5 OS=linux ARCH=amd64
wget https://dl.google.com/go/go$VERSION.$OS-$ARCH.tar.gz
sudo tar -C /usr/local -xzvf go$VERSION.$OS-$ARCH.tar.gz
rm go$VERSION.$OS-$ARCH.tar.gz

# 设置Go环境
echo 'export PATH=/usr/local/go/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 安装Singularity
export VERSION=3.11.4
wget https://github.com/sylabs/singularity/releases/download/v${VERSION}/singularity-ce-${VERSION}.tar.gz
tar -xzf singularity-ce-${VERSION}.tar.gz
cd singularity-ce-${VERSION}

./mconfig
make -C builddir
sudo make -C builddir install

# 验证安装
singularity --version
```

## 生物信息学工具容器 / Bioinformatics Tool Containers

### 拉取预构建容器

```bash
# 创建容器管理脚本
cat > pull_containers.sh << 'EOF'
#!/bin/bash

echo "正在拉取生物信息学工具容器..."

# 基础容器
containers=(
    # 质量控制
    "biocontainers/fastqc:v0.11.9_cv8"
    "ewels/multiqc:latest"
    "quay.io/biocontainers/trimmomatic:0.39--hdfd78af_2"
    
    # 比对工具
    "nfcore/star:2.7.10a"
    "biocontainers/bwa:v0.7.17_cv1"
    "biocontainers/samtools:v1.15.1_cv0.3"
    "broadinstitute/picard:latest"
    
    # 定量工具
    "nfcore/subread:2.0.1"
    "combinelab/salmon:latest"
    "quay.io/biocontainers/htseq:0.13.5--py39h38f01e4_1"
    "quay.io/biocontainers/stringtie:2.2.1--hecb563c_2"
    "quay.io/biocontainers/rsem:1.3.3--pl5321h4ac6f70_3"
    
    # 变异检测
    "broadinstitute/gatk:4.2.6.1"
    "quay.io/biocontainers/snpeff:5.0--hdfd78af_1"
    "ensemblorg/ensembl-vep:latest"
    "quay.io/biocontainers/bcftools:1.15.1--h0ea216a_0"
    
    # R/统计分析
    "bioconductor/bioconductor_docker:RELEASE_3_14"
    
    # 单细胞分析
    "nfcore/cellranger:7.0.0"
    "satijalab/seurat:4.3.0"
)

for container in "${containers[@]}"; do
    echo "拉取 $container..."
    docker pull "$container"
done

echo "容器拉取完成!"
EOF

chmod +x pull_containers.sh
./pull_containers.sh
```

### 验证容器

```bash
# 创建容器验证脚本
cat > verify_containers.sh << 'EOF'
#!/bin/bash

echo "验证生物信息学工具容器..."

# 测试FastQC
echo "测试 FastQC..."
docker run --rm biocontainers/fastqc:v0.11.9_cv8 fastqc --version

# 测试STAR
echo "测试 STAR..."
docker run --rm nfcore/star:2.7.10a STAR --version

# 测试Salmon
echo "测试 Salmon..."
docker run --rm combinelab/salmon:latest salmon --version

# 测试GATK
echo "测试 GATK..."
docker run --rm broadinstitute/gatk:4.2.6.1 gatk --version

# 测试R/Bioconductor
echo "测试 R/Bioconductor..."
docker run --rm bioconductor/bioconductor_docker:RELEASE_3_14 R --version

echo "容器验证完成!"
EOF

chmod +x verify_containers.sh
./verify_containers.sh
```

## R 语言和包 / R Language and Packages

### R 安装

#### Ubuntu/Debian
```bash
# 添加CRAN仓库
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9
sudo add-apt-repository 'deb https://cloud.r-project.org/bin/linux/ubuntu focal-cran40/'

# 安装R
sudo apt update
sudo apt install -y r-base r-base-dev

# 安装系统依赖
sudo apt install -y \
    libssl-dev \
    libcurl4-openssl-dev \
    libxml2-dev \
    libfontconfig1-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libfreetype6-dev \
    libpng-dev \
    libtiff5-dev \
    libjpeg-dev
```

#### CentOS/RHEL
```bash
# 启用EPEL
sudo yum install -y epel-release

# 安装R
sudo yum install -y R

# 安装系统依赖
sudo yum install -y \
    openssl-devel \
    libcurl-devel \
    xml2-devel \
    fontconfig-devel \
    harfbuzz-devel \
    fribidi-devel \
    freetype-devel \
    libpng-devel \
    libtiff-devel \
    libjpeg-turbo-devel
```

#### macOS
```bash
# 使用Homebrew
brew install r

# 或从官网下载安装包
# https://cran.r-project.org/bin/macosx/
```

### R 包安装

```r
# 创建R包安装脚本
cat > install_r_packages.R << 'EOF'
#!/usr/bin/env Rscript

# 设置镜像
options(repos = c(CRAN = "https://cloud.r-project.org/"))

# 安装BiocManager
if (!requireNamespace("BiocManager", quietly = TRUE))
    install.packages("BiocManager")

# 设置Bioconductor版本
BiocManager::install(version = "3.14")

# 核心R包
core_packages <- c(
    "tidyverse",
    "ggplot2", 
    "dplyr",
    "readr",
    "stringr",
    "purrr",
    "tibble",
    "tidyr",
    "forcats",
    "lubridate"
)

# 生物信息学R包 (Bioconductor)
bioc_packages <- c(
    "DESeq2",
    "edgeR", 
    "limma",
    "clusterProfiler",
    "DOSE",
    "pathview",
    "enrichplot",
    "org.Hs.eg.db",
    "org.Mm.eg.db",
    "org.Rn.eg.db",
    "GO.db",
    "KEGG.db",
    "reactome.db",
    "GenomicFeatures",
    "GenomicRanges",
    "Biostrings",
    "IRanges",
    "S4Vectors",
    "SummarizedExperiment",
    "SingleCellExperiment",
    "scater",
    "scran",
    "Seurat",
    "monocle3"
)

# 可视化和分析包
viz_packages <- c(
    "pheatmap",
    "ComplexHeatmap",
    "EnhancedVolcano",
    "ggrepel",
    "ggpubr",
    "cowplot",
    "patchwork",
    "RColorBrewer",
    "viridis",
    "plotly",
    "DT",
    "knitr",
    "rmarkdown",
    "shiny",
    "shinydashboard"
)

# 统计和机器学习包
stats_packages <- c(
    "caret",
    "randomForest",
    "e1071",
    "cluster",
    "factoextra",
    "FactoMineR",
    "corrplot",
    "Hmisc",
    "psych"
)

# 数据处理包
data_packages <- c(
    "data.table",
    "openxlsx",
    "readxl",
    "writexl",
    "jsonlite",
    "httr",
    "xml2",
    "rvest"
)

# 安装函数
install_packages <- function(packages, use_bioc = FALSE) {
    for (pkg in packages) {
        if (!require(pkg, character.only = TRUE, quietly = TRUE)) {
            cat("Installing", pkg, "...\n")
            if (use_bioc) {
                BiocManager::install(pkg, update = FALSE, ask = FALSE)
            } else {
                install.packages(pkg, dependencies = TRUE)
            }
        } else {
            cat(pkg, "already installed.\n")
        }
    }
}

# 执行安装
cat("Installing core R packages...\n")
install_packages(core_packages)

cat("Installing Bioconductor packages...\n")
install_packages(bioc_packages, use_bioc = TRUE)

cat("Installing visualization packages...\n")
install_packages(viz_packages)

cat("Installing statistics packages...\n")
install_packages(stats_packages)

cat("Installing data processing packages...\n")
install_packages(data_packages)

cat("R package installation completed!\n")

# 验证关键包
cat("\nVerifying key packages...\n")
key_packages <- c("DESeq2", "edgeR", "limma", "ggplot2", "dplyr")
for (pkg in key_packages) {
    if (require(pkg, character.only = TRUE, quietly = TRUE)) {
        cat("✓", pkg, "loaded successfully\n")
    } else {
        cat("✗", pkg, "failed to load\n")
    }
}
EOF

# 执行R包安装
Rscript install_r_packages.R
```

## Python 环境 / Python Environment

### Python 安装

#### 使用 Conda (推荐)
```bash
# 安装Miniconda
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh

# 重新加载shell
source ~/.bashrc

# 创建Python环境
conda create -n genomics python=3.9 -y
conda activate genomics

# 验证安装
python --version
pip --version
```

#### 系统安装
```bash
# Ubuntu/Debian
sudo apt install -y python3 python3-pip python3-venv python3-dev

# CentOS/RHEL
sudo yum install -y python3 python3-pip python3-devel

# macOS
brew install python
```

### Python 包安装

```bash
# 创建Python包安装脚本
cat > install_python_packages.py << 'EOF'
#!/usr/bin/env python3

import subprocess
import sys

def install_package(package):
    """安装Python包"""
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
        print(f"✓ {package} installed successfully")
    except subprocess.CalledProcessError:
        print(f"✗ Failed to install {package}")

# 核心科学计算包
scientific_packages = [
    "numpy>=1.21.0",
    "pandas>=1.3.0", 
    "scipy>=1.7.0",
    "matplotlib>=3.4.0",
    "seaborn>=0.11.0",
    "plotly>=5.0.0",
    "jupyter>=1.0.0",
    "ipython>=7.0.0",
    "scikit-learn>=1.0.0"
]

# 生物信息学包
bioinformatics_packages = [
    "biopython>=1.79",
    "pysam>=0.17.0",
    "scanpy>=1.8.0",
    "anndata>=0.8.0",
    "scanpy[leiden]",
    "scrublet>=0.2.3",
    "cellxgene>=1.0.0",
    "squidpy>=1.0.0"
]

# 数据处理包
data_packages = [
    "openpyxl>=3.0.0",
    "xlrd>=2.0.0",
    "requests>=2.25.0",
    "beautifulsoup4>=4.9.0",
    "lxml>=4.6.0",
    "h5py>=3.1.0",
    "tables>=3.6.0"
]

# 机器学习包
ml_packages = [
    "tensorflow>=2.6.0",
    "torch>=1.9.0",
    "torchvision>=0.10.0",
    "xgboost>=1.4.0",
    "lightgbm>=3.2.0",
    "catboost>=0.26.0"
]

# 可视化包
viz_packages = [
    "bokeh>=2.3.0",
    "altair>=4.1.0",
    "plotnine>=0.8.0",
    "dash>=2.0.0",
    "streamlit>=1.0.0"
]

print("Installing Python packages for genomics analysis...")

# 升级pip
subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'])

# 安装包组
package_groups = [
    ("Scientific packages", scientific_packages),
    ("Bioinformatics packages", bioinformatics_packages), 
    ("Data processing packages", data_packages),
    ("Visualization packages", viz_packages)
]

for group_name, packages in package_groups:
    print(f"\nInstalling {group_name}...")
    for package in packages:
        install_package(package)

print("\nPython package installation completed!")

# 验证关键包
print("\nVerifying key packages...")
key_packages = ["numpy", "pandas", "matplotlib", "biopython", "scanpy"]
for package in key_packages:
    try:
        __import__(package)
        print(f"✓ {package} imported successfully")
    except ImportError:
        print(f"✗ {package} failed to import")
EOF

# 执行Python包安装
python install_python_packages.py
```

## 系统资源配置 / System Resource Configuration

### 内存和文件限制

```bash
# 增加系统文件描述符限制
cat >> /etc/security/limits.conf << 'EOF'
# 增加文件描述符限制用于生物信息学分析
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF

# 增加系统内存映射限制
echo 'vm.max_map_count=262144' >> /etc/sysctl.conf
sysctl -p

# 优化内存使用
echo 'vm.swappiness=10' >> /etc/sysctl.conf
echo 'vm.dirty_ratio=15' >> /etc/sysctl.conf
echo 'vm.dirty_background_ratio=5' >> /etc/sysctl.conf
```

### 存储配置

```bash
# 创建数据目录
sudo mkdir -p /data/{raw,processed,results,reference,temp}
sudo chown -R $USER:$USER /data/

# 设置环境变量
cat >> ~/.bashrc << 'EOF'
# 生物信息学分析环境变量
export GENOMICS_DATA_DIR="/data"
export GENOMICS_RAW_DIR="/data/raw"
export GENOMICS_PROCESSED_DIR="/data/processed"
export GENOMICS_RESULTS_DIR="/data/results"
export GENOMICS_REF_DIR="/data/reference"
export TMPDIR="/data/temp"

# Nextflow配置
export NXF_WORK="/data/temp/nextflow-work"
export NXF_CONDA_CACHEDIR="/data/temp/conda"
export NXF_SINGULARITY_CACHEDIR="/data/temp/singularity"

# 添加工具到PATH
export PATH="/usr/local/bin:$PATH"
EOF

source ~/.bashrc
```

## 验证安装 / Verification

### 创建综合验证脚本

```bash
cat > verify_installation.sh << 'EOF'
#!/bin/bash

echo "=== 生物信息学分析平台依赖验证 ==="
echo "检查时间: $(date)"
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 已安装: $(command -v $1)"
        if [ "$2" ]; then
            echo "  版本: $($1 $2 2>/dev/null || echo '未知')"
        fi
    else
        echo -e "${RED}✗${NC} $1 未找到"
        return 1
    fi
}

check_service() {
    if systemctl is-active --quiet $1 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 服务正在运行"
    elif docker ps --format "table {{.Names}}" | grep -q $1; then
        echo -e "${GREEN}✓${NC} $1 容器正在运行"
    else
        echo -e "${YELLOW}!${NC} $1 服务未运行"
    fi
}

check_port() {
    if netstat -tuln 2>/dev/null | grep -q ":$1 "; then
        echo -e "${GREEN}✓${NC} 端口 $1 正在监听"
    else
        echo -e "${YELLOW}!${NC} 端口 $1 未在监听"
    fi
}

echo "=== 基础工具 ==="
check_command curl --version
check_command wget --version
check_command git --version
echo

echo "=== Node.js 环境 ==="
check_command node --version
check_command npm --version
echo

echo "=== 数据库服务 ==="
check_service mongodb
check_service mongod
check_port 27017
check_service redis
check_port 6379
echo

echo "=== 容器化环境 ==="
check_command docker --version
check_command docker-compose --version
echo

echo "=== 工作流引擎 ==="
check_command nextflow -version
check_command java -version
if command -v singularity &> /dev/null; then
    check_command singularity --version
fi
echo

echo "=== 分析语言 ==="
check_command R --version
check_command python3 --version
check_command pip3 --version
echo

echo "=== 关键R包检查 ==="
Rscript -e '
packages <- c("DESeq2", "edgeR", "limma", "ggplot2", "dplyr")
for (pkg in packages) {
    if (require(pkg, character.only = TRUE, quietly = TRUE)) {
        cat("✓", pkg, "已安装\n")
    } else {
        cat("✗", pkg, "未安装\n")
    }
}
' 2>/dev/null
echo

echo "=== 关键Python包检查 ==="
python3 -c '
import sys
packages = ["numpy", "pandas", "matplotlib", "biopython", "scanpy"]
for pkg in packages:
    try:
        __import__(pkg)
        print(f"✓ {pkg} 已安装")
    except ImportError:
        print(f"✗ {pkg} 未安装")
'
echo

echo "=== Docker容器检查 ==="
containers=(
    "biocontainers/fastqc:v0.11.9_cv8"
    "nfcore/star:2.7.10a"
    "combinelab/salmon:latest"
    "broadinstitute/gatk:4.2.6.1"
    "bioconductor/bioconductor_docker:RELEASE_3_14"
)

for container in "${containers[@]}"; do
    if docker images --format "table {{.Repository}}:{{.Tag}}" | grep -q "$container"; then
        echo -e "${GREEN}✓${NC} $container 已拉取"
    else
        echo -e "${YELLOW}!${NC} $container 未拉取"
    fi
done
echo

echo "=== 系统资源 ==="
echo "CPU 核心数: $(nproc)"
echo "内存总量: $(free -h | awk '/^Mem:/ {print $2}')"
echo "磁盘空间: $(df -h / | awk 'NR==2 {print $4}') 可用"
echo "文件描述符限制: $(ulimit -n)"
echo

echo "=== 网络连接测试 ==="
if curl -s --connect-timeout 5 https://google.com > /dev/null; then
    echo -e "${GREEN}✓${NC} 互联网连接正常"
else
    echo -e "${RED}✗${NC} 互联网连接有问题"
fi

if curl -s --connect-timeout 5 https://hub.docker.com > /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Hub 可访问"
else
    echo -e "${YELLOW}!${NC} Docker Hub 访问有问题"
fi

echo
echo "=== 验证完成 ==="
EOF

chmod +x verify_installation.sh
./verify_installation.sh
```

## 故障排除 / Troubleshooting

### 常见问题解决

#### 1. 权限问题
```bash
# Docker权限
sudo usermod -aG docker $USER
newgrp docker

# 文件权限
sudo chown -R $USER:$USER /path/to/directory

# MongoDB权限
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown mongodb:mongodb /tmp/mongodb-27017.sock
```

#### 2. 端口冲突
```bash
# 检查端口占用
netstat -tulpn | grep :5000
lsof -i :5000

# 终止占用进程
sudo kill -9 $(lsof -t -i:5000)
```

#### 3. 内存不足
```bash
# 增加swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 4. R包安装失败
```bash
# 安装系统依赖 (Ubuntu)
sudo apt install -y \
    build-essential \
    libcurl4-gnutls-dev \
    libxml2-dev \
    libssl-dev \
    libgit2-dev

# 设置CRAN镜像
echo 'options(repos = c(CRAN = "https://cloud.r-project.org/"))' >> ~/.Rprofile
```

#### 5. Python包安装失败
```bash
# 升级pip
python3 -m pip install --upgrade pip

# 使用国内镜像
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple/ package_name

# 安装系统依赖
sudo apt install -y python3-dev python3-distutils
```

## 性能优化建议 / Performance Optimization

### 1. 系统调优
```bash
# CPU调度优化
echo 'kernel.sched_autogroup_enabled = 0' >> /etc/sysctl.conf

# 网络优化
echo 'net.core.rmem_max = 134217728' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 134217728' >> /etc/sysctl.conf
```

### 2. 应用配置
```bash
# Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=8192"

# Java内存配置
export JAVA_OPTS="-Xmx8g -Xms2g"

# Nextflow配置
export NXF_OPTS="-Xmx8g"
```

---

*更新日期: 2024年1月*