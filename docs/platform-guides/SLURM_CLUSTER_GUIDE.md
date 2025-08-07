# SLURM集群环境运行指南 / SLURM Cluster Setup Guide

本指南详细介绍如何在SLURM管理的HPC集群上部署和运行生物信息学分析流程。

## 集群环境要求 / Cluster Requirements

### 硬件要求 / Hardware Requirements
- **计算节点**: 16核+ CPU, 64GB+ RAM per node
- **存储**: 共享文件系统 (NFS/Lustre/GPFS)
- **网络**: 高速互联网络 (InfiniBand推荐)

### 软件环境 / Software Environment
- **SLURM**: 20.02+
- **Singularity/Apptainer**: 3.8+ (推荐用于容器支持)
- **Nextflow**: 21.04+
- **Java**: 11+
- **共享文件系统**: 用户主目录和数据存储

## 环境准备 / Environment Setup

### 1. 模块系统配置

大多数HPC系统使用Environment Modules管理软件，创建modulefile:

```bash
# 创建 ~/.modulefiles/genomics-pipeline/1.0
mkdir -p ~/.modulefiles/genomics-pipeline
cat > ~/.modulefiles/genomics-pipeline/1.0 << 'EOF'
#%Module1.0
proc ModulesHelp { } {
    puts stderr "Genomics Analysis Pipeline v1.0"
}

module-whatis "Genomics Analysis Pipeline for RNA-seq and genome sequencing"

# 设置环境变量
setenv GENOMICS_PIPELINE_HOME /path/to/genomics-analysis-platform
setenv NEXTFLOW_HOME $env(GENOMICS_PIPELINE_HOME)/nextflow
setenv NXF_WORK /scratch/$env(USER)/nextflow-work

# 加载依赖模块
module load java/11
module load singularity/3.8
module load nextflow/21.04

# 添加到PATH
prepend-path PATH $env(GENOMICS_PIPELINE_HOME)/bin
EOF

# 使用模块
module use ~/.modulefiles
module load genomics-pipeline/1.0
```

### 2. Nextflow配置 / Nextflow Configuration

创建适用于SLURM的Nextflow配置文件:

```bash
cat > nextflow.config << 'EOF'
// SLURM集群配置
params {
    // 输入参数
    input = ''
    outdir = 'results'
    
    // 资源配置
    max_memory = '256.GB'
    max_cpus = 48
    max_time = '240.h'
    
    // 集群特定配置
    scratch_dir = "/scratch/${USER}"
    singularity_cache = "/shared/singularity_cache"
}

profiles {
    slurm {
        process {
            executor = 'slurm'
            queue = 'normal'
            clusterOptions = '--account=your_account --time=24:00:00'
            
            // 资源标签
            withLabel: process_low {
                cpus = 2
                memory = 8.GB
                time = 2.h
                queue = 'short'
            }
            
            withLabel: process_medium {
                cpus = 8
                memory = 32.GB
                time = 8.h
                queue = 'normal'
            }
            
            withLabel: process_high {
                cpus = 16
                memory = 64.GB
                time = 24.h
                queue = 'normal'
            }
            
            withLabel: process_long {
                cpus = 8
                memory = 32.GB
                time = 72.h
                queue = 'long'
            }
            
            // 进程特定配置
            withName: 'FASTQC' {
                cpus = 4
                memory = 8.GB
                time = 2.h
            }
            
            withName: 'STAR_ALIGN' {
                cpus = 16
                memory = 64.GB
                time = 8.h
            }
            
            withName: 'FEATURECOUNTS' {
                cpus = 8
                memory = 16.GB
                time = 4.h
            }
            
            withName: 'DESEQ2_ANALYSIS' {
                cpus = 8
                memory = 32.GB
                time = 6.h
            }
        }
        
        executor {
            $slurm {
                queueSize = 50
                submitRateLimit = '10 sec'
                pollInterval = '30 sec'
            }
        }
    }
    
    singularity {
        singularity.enabled = true
        singularity.autoMounts = true
        singularity.cacheDir = params.singularity_cache
        
        process {
            container = 'library://default/rnaseq'
        }
    }
}

// 日志和报告配置
trace {
    enabled = true
    file = "${params.outdir}/pipeline_info/execution_trace.txt"
}

timeline {
    enabled = true
    file = "${params.outdir}/pipeline_info/execution_timeline.html"
}

report {
    enabled = true
    file = "${params.outdir}/pipeline_info/execution_report.html"
}

dag {
    enabled = true
    file = "${params.outdir}/pipeline_info/pipeline_dag.svg"
}

manifest {
    name = 'genomics-analysis-pipeline'
    author = 'Your Name'
    homePage = 'https://github.com/your-org/genomics-pipeline'
    description = 'Genomics analysis pipeline for HPC clusters'
    version = '1.0.0'
    nextflowVersion = '>=21.04.0'
}
EOF
```

### 3. 作业提交脚本 / Job Submission Scripts

#### 主要分析作业脚本
```bash
cat > submit_analysis.sh << 'EOF'
#!/bin/bash
#SBATCH --job-name=genomics-pipeline
#SBATCH --account=your_account
#SBATCH --partition=normal
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=4
#SBATCH --memory=16G
#SBATCH --time=24:00:00
#SBATCH --output=logs/pipeline_%j.out
#SBATCH --error=logs/pipeline_%j.err
#SBATCH --mail-type=ALL
#SBATCH --mail-user=your.email@domain.com

# 创建日志目录
mkdir -p logs

# 加载模块
module load genomics-pipeline/1.0

# 设置工作目录
export NXF_WORK="/scratch/${USER}/nextflow-work-${SLURM_JOB_ID}"
mkdir -p "${NXF_WORK}"

# 运行分析
echo "Starting genomics analysis pipeline..."
echo "Job ID: ${SLURM_JOB_ID}"
echo "Start time: $(date)"

nextflow run main.nf \
    -profile slurm,singularity \
    --input config/metadata.tsv \
    --outdir results/${SLURM_JOB_ID} \
    --max_memory 256.GB \
    --max_cpus 48 \
    --max_time 240.h \
    -resume \
    -with-report results/${SLURM_JOB_ID}/pipeline_report.html \
    -with-trace results/${SLURM_JOB_ID}/pipeline_trace.txt \
    -with-timeline results/${SLURM_JOB_ID}/pipeline_timeline.html \
    -with-dag results/${SLURM_JOB_ID}/pipeline_dag.svg

echo "End time: $(date)"

# 清理临时文件
if [ -d "${NXF_WORK}" ]; then
    echo "Cleaning up work directory: ${NXF_WORK}"
    rm -rf "${NXF_WORK}"
fi
EOF

chmod +x submit_analysis.sh
```

#### 交互式分析脚本
```bash
cat > interactive_analysis.sh << 'EOF'
#!/bin/bash
#SBATCH --job-name=genomics-interactive
#SBATCH --account=your_account
#SBATCH --partition=interactive
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --memory=32G
#SBATCH --time=4:00:00

# 启动交互式会话进行数据分析
echo "Interactive genomics analysis session"
echo "Loading environment..."

module load genomics-pipeline/1.0

# 设置环境
export SCRATCH_DIR="/scratch/${USER}/interactive-${SLURM_JOB_ID}"
mkdir -p "${SCRATCH_DIR}"
cd "${SCRATCH_DIR}"

# 启动分析环境
echo "Starting analysis environment..."
echo "Scratch directory: ${SCRATCH_DIR}"
echo "Use 'exit' to end session"

/bin/bash -l
EOF

chmod +x interactive_analysis.sh
```

## 数据管理 / Data Management

### 1. 数据存储策略

```bash
# 推荐的目录结构
/home/${USER}/                          # 用户主目录
├── genomics-analysis-platform/         # 项目代码
├── projects/                           # 项目数据
│   ├── project1/
│   │   ├── raw_data/                   # 原始数据
│   │   ├── reference/                  # 参考基因组
│   │   ├── config/                     # 配置文件
│   │   └── results/                    # 结果数据
│   └── project2/
└── shared_resources/                   # 共享资源
    ├── genomes/                        # 参考基因组
    ├── annotations/                    # 注释文件
    └── databases/                      # 数据库文件

/scratch/${USER}/                       # 临时工作空间
├── nextflow-work/                      # Nextflow工作目录
├── temp_analysis/                      # 临时分析文件
└── staging/                           # 数据暂存区
```

### 2. 数据传输脚本

```bash
cat > transfer_data.sh << 'EOF'
#!/bin/bash
#SBATCH --job-name=data-transfer
#SBATCH --account=your_account
#SBATCH --partition=transfer
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=4
#SBATCH --memory=8G
#SBATCH --time=12:00:00

# 数据传输作业
source_dir="$1"
dest_dir="$2"

if [ -z "$source_dir" ] || [ -z "$dest_dir" ]; then
    echo "Usage: sbatch transfer_data.sh <source_dir> <dest_dir>"
    exit 1
fi

echo "Transferring data from $source_dir to $dest_dir"
echo "Start time: $(date)"

# 使用rsync进行数据传输
rsync -avz --progress "$source_dir" "$dest_dir"

echo "Transfer completed at: $(date)"
EOF

chmod +x transfer_data.sh
```

## 资源监控 / Resource Monitoring

### 1. 作业监控脚本

```bash
cat > monitor_jobs.sh << 'EOF'
#!/bin/bash

# 作业监控脚本
echo "=== SLURM作业状态监控 ==="
echo "当前时间: $(date)"
echo

echo "=== 正在运行的作业 ==="
squeue -u $USER --format="%.18i %.9P %.20j %.8u %.8T %.10M %.9l %.6D %R"
echo

echo "=== 最近完成的作业 ==="
sacct -u $USER --starttime=today --format=JobID,JobName,State,ExitCode,Submit,Start,End,Elapsed,MaxRSS,MaxVMSize
echo

echo "=== 集群资源使用情况 ==="
sinfo -N -l
echo

echo "=== 存储使用情况 ==="
echo "主目录使用: $(du -sh $HOME 2>/dev/null | cut -f1)"
echo "Scratch使用: $(du -sh /scratch/$USER 2>/dev/null | cut -f1 || echo "N/A")"
df -h /home /scratch 2>/dev/null | grep -E "(Filesystem|/home|/scratch)"
EOF

chmod +x monitor_jobs.sh
```

### 2. 性能分析脚本

```bash
cat > analyze_performance.sh << 'EOF'
#!/bin/bash

job_id="$1"
if [ -z "$job_id" ]; then
    echo "Usage: $0 <job_id>"
    exit 1
fi

echo "=== 作业 $job_id 性能分析 ==="

# 作业详细信息
echo "=== 作业信息 ==="
sacct -j $job_id --format=JobID,JobName,State,ExitCode,Submit,Start,End,Elapsed,MaxRSS,MaxVMSize,ReqCPUS,ReqMem

# 效率分析
echo -e "\n=== 效率分析 ==="
seff $job_id

# 如果有Nextflow报告，显示路径
results_dir="results/$job_id"
if [ -d "$results_dir" ]; then
    echo -e "\n=== Nextflow报告 ==="
    echo "执行报告: $results_dir/pipeline_report.html"
    echo "时间线: $results_dir/pipeline_timeline.html"
    echo "执行轨迹: $results_dir/pipeline_trace.txt"
fi
EOF

chmod +x analyze_performance.sh
```

## 软件管理 / Software Management

### 1. Singularity容器管理

```bash
# 创建容器管理脚本
cat > manage_containers.sh << 'EOF'
#!/bin/bash

CACHE_DIR="/shared/singularity_cache"
CONTAINERS=(
    "biocontainers/fastqc:v0.11.9_cv8"
    "nfcore/star:2.7.10a"
    "nfcore/subread:2.0.1"
    "bioconductor/bioconductor_docker:RELEASE_3_14"
    "broadinstitute/gatk:4.2.6.1"
    "ewels/multiqc:latest"
)

case "$1" in
    pull)
        echo "拉取容器镜像到缓存..."
        mkdir -p $CACHE_DIR
        for container in "${CONTAINERS[@]}"; do
            echo "Pulling $container..."
            singularity pull $CACHE_DIR/$(echo $container | tr '/:' '_').sif docker://$container
        done
        ;;
    list)
        echo "已缓存的容器:"
        ls -lh $CACHE_DIR/*.sif 2>/dev/null || echo "无缓存容器"
        ;;
    clean)
        echo "清理容器缓存..."
        rm -f $CACHE_DIR/*.sif
        ;;
    *)
        echo "Usage: $0 {pull|list|clean}"
        exit 1
        ;;
esac
EOF

chmod +x manage_containers.sh
```

### 2. 软件模块管理

```bash
# 创建软件环境管理脚本
cat > setup_software_env.sh << 'EOF'
#!/bin/bash

# 软件环境设置脚本
setup_genomics_env() {
    echo "设置基因组学分析环境..."
    
    # 加载基础模块
    module purge
    module load java/11
    module load singularity/3.8
    module load python/3.8
    module load R/4.1.0
    
    # 设置Python环境
    if [ ! -d "$HOME/.conda/envs/genomics" ]; then
        echo "创建Python环境..."
        conda create -n genomics python=3.8 -y
        conda activate genomics
        pip install nextflow pandas numpy scipy matplotlib seaborn
    else
        conda activate genomics
    fi
    
    # 设置R环境
    if [ ! -f "$HOME/.Rprofile_genomics" ]; then
        echo "配置R环境..."
        cat > $HOME/.Rprofile_genomics << 'R_EOF'
# R genomics environment setup
.libPaths(c("~/R/genomics-lib", .libPaths()))

# Auto-install required packages
required_packages <- c("DESeq2", "edgeR", "limma", "clusterProfiler", 
                      "ggplot2", "pheatmap", "EnhancedVolcano")

new_packages <- required_packages[!(required_packages %in% installed.packages()[,"Package"])]
if(length(new_packages)) {
    if (!requireNamespace("BiocManager", quietly = TRUE))
        install.packages("BiocManager")
    BiocManager::install(new_packages)
}
R_EOF
    fi
    
    # 设置环境变量
    export R_PROFILE_USER="$HOME/.Rprofile_genomics"
    export GENOMICS_ENV_LOADED=1
    
    echo "基因组学分析环境设置完成!"
}

# 执行设置
setup_genomics_env
EOF

chmod +x setup_software_env.sh
```

## 故障排除 / Troubleshooting

### 1. 常见SLURM问题

```bash
# 检查作业状态
squeue -u $USER

# 查看作业详细信息
scontrol show job <job_id>

# 取消作业
scancel <job_id>

# 查看作业历史
sacct -u $USER --starttime=2024-01-01

# 检查节点状态
sinfo -N

# 查看分区信息
sinfo -s
```

### 2. Nextflow调试

```bash
# 详细日志模式
nextflow run main.nf -profile slurm,singularity --input config/metadata.tsv -with-trace -with-report

# 恢复失败的运行
nextflow run main.nf -resume <session_id>

# 检查工作目录
ls -la work/

# 查看失败任务日志
cat work/xx/xxxxxxxxx/.command.log
cat work/xx/xxxxxxxxx/.command.err
```

### 3. 存储问题解决

```bash
# 检查配额
quota -u $USER

# 清理临时文件
find /scratch/$USER -type f -mtime +7 -delete

# 检查磁盘使用
df -h /home /scratch

# 查找大文件
find $HOME -type f -size +1G -ls
```

## 性能优化 / Performance Optimization

### 1. 资源调优

```bash
# 根据数据大小调整资源请求
# 小数据集 (< 10GB)
#SBATCH --cpus-per-task=8
#SBATCH --memory=32G

# 中等数据集 (10-100GB)
#SBATCH --cpus-per-task=16
#SBATCH --memory=64G

# 大数据集 (> 100GB)
#SBATCH --cpus-per-task=32
#SBATCH --memory=128G
```

### 2. I/O优化

```bash
# 使用本地临时存储
export TMPDIR="/tmp"
export NXF_TEMP="/scratch/$USER/tmp"

# 并行I/O配置
process {
    withName: 'FASTQC' {
        scratch = '/tmp'
    }
    withName: 'STAR_ALIGN' {
        scratch = '/local/scratch'
    }
}
```

## 批量作业管理 / Batch Job Management

### 1. 批量提交脚本

```bash
cat > submit_batch.sh << 'EOF'
#!/bin/bash

# 批量作业提交脚本
projects_dir="$1"
if [ -z "$projects_dir" ]; then
    echo "Usage: $0 <projects_directory>"
    exit 1
fi

for project in "$projects_dir"/*/; do
    if [ -d "$project" ] && [ -f "$project/config/metadata.tsv" ]; then
        project_name=$(basename "$project")
        echo "Submitting analysis for project: $project_name"
        
        sbatch --job-name="genomics-$project_name" \
               --chdir="$project" \
               submit_analysis.sh
        
        # 避免过快提交
        sleep 2
    fi
done
EOF

chmod +x submit_batch.sh
```

### 2. 作业依赖管理

```bash
# 提交有依赖关系的作业
qc_job=$(sbatch --parsable submit_qc.sh)
align_job=$(sbatch --parsable --dependency=afterok:$qc_job submit_alignment.sh)
quant_job=$(sbatch --parsable --dependency=afterok:$align_job submit_quantification.sh)
de_job=$(sbatch --parsable --dependency=afterok:$quant_job submit_differential_expression.sh)

echo "作业提交完成:"
echo "QC: $qc_job"
echo "Alignment: $align_job"
echo "Quantification: $quant_job"
echo "Differential Expression: $de_job"
```

## 最佳实践 / Best Practices

### 1. 作业设计原则
- 合理估算资源需求
- 使用checkpoints和resume功能
- 分解大任务为小任务
- 使用适当的队列

### 2. 数据管理原则
- 定期清理临时文件
- 使用合适的存储层级
- 备份重要数据
- 监控存储使用

### 3. 调试策略
- 使用小数据集测试
- 保留详细日志
- 监控资源使用
- 定期检查作业状态

---

*更新日期: 2024年1月*