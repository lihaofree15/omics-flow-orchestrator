import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { IWorkflowConfig, IAnalysisJob, NextflowParams, NextflowResult } from '@/types';

export class NextflowService {
  private static instance: NextflowService;
  private runningJobs: Map<string, ChildProcess> = new Map();

  public static getInstance(): NextflowService {
    if (!NextflowService.instance) {
      NextflowService.instance = new NextflowService();
    }
    return NextflowService.instance;
  }

  public async executeWorkflow(
    workflow: IWorkflowConfig,
    job: IAnalysisJob,
    params: NextflowParams
  ): Promise<NextflowResult> {
    try {
      // Create work and output directories
      await this.ensureDirectories([params.workDir, params.outputDir]);

      // Generate Nextflow script and config files
      const scriptPath = await this.generateWorkflowScript(workflow, params);
      const configPath = await this.generateConfigFile(workflow, params);

      // Prepare Nextflow command
      const command = this.buildNextflowCommand(scriptPath, configPath, params);

      // Update job status
      await job.start();

      // Execute Nextflow
      const result = await this.runNextflowProcess(command, job);

      // Update job status based on result
      if (result.success) {
        await job.complete(result.outputFiles);
        await workflow.addExecutionRecord(job._id, 'success', result.duration);
      } else {
        await job.fail(`Nextflow execution failed: ${result.stderr}`);
        await workflow.addExecutionRecord(job._id, 'failed', result.duration);
      }

      return result;
    } catch (error: any) {
      await job.fail(error.message);
      await workflow.addExecutionRecord(job._id, 'failed');
      throw error;
    }
  }

  private async ensureDirectories(directories: string[]): Promise<void> {
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async generateWorkflowScript(
    workflow: IWorkflowConfig,
    params: NextflowParams
  ): Promise<string> {
    const scriptPath = path.join(params.workDir, 'main.nf');
    
    let script = '';
    switch (workflow.workflowType) {
      case 'rna-seq':
        script = this.generateRNASeqScript(workflow, params);
        break;
      case 'genome-seq':
        script = this.generateGenomeSeqScript(workflow, params);
        break;
      case 'single-cell-rna-seq':
        script = this.generateSingleCellRNASeqScript(workflow, params);
        break;
      default:
        throw new Error(`Unsupported workflow type: ${workflow.workflowType}`);
    }

    await fs.writeFile(scriptPath, script);
    return scriptPath;
  }

  private generateRNASeqScript(workflow: IWorkflowConfig, params: NextflowParams): string {
    const { rnaSeq } = workflow.parameters;
    return `#!/usr/bin/env nextflow

nextflow.enable.dsl=2

// Parameters
params.reads = "${params.inputFiles.join(',')}"
params.genome_ref = "${rnaSeq?.starIndex || ''}"
params.gtf = "${rnaSeq?.gtfFile || ''}"
params.outdir = "${params.outputDir}"
params.strandedness = "${rnaSeq?.strandedness || 'unstranded'}"

// Input channels
ch_reads = Channel.fromPath(params.reads.split(','), checkIfExists: true)
    .map { file -> 
        def meta = [id: file.baseName.replaceAll(/(_R[12])?(_001)?\\.(fastq|fq)(\\.gz)?$/, '')]
        return [meta, file]
    }

// Process: FastQC
process FASTQC {
    container '${workflow.containers.fastqc}'
    publishDir "\${params.outdir}/fastqc", mode: 'copy'
    
    input:
    tuple val(meta), path(reads)
    
    output:
    path("*.html")
    path("*.zip")
    
    script:
    """
    fastqc --quiet --threads $task.cpus $reads
    """
}

// Process: STAR Alignment
process STAR_ALIGN {
    container '${workflow.containers.star}'
    publishDir "\${params.outdir}/star", mode: 'copy'
    
    input:
    tuple val(meta), path(reads)
    
    output:
    tuple val(meta), path("*Aligned.sortedByCoord.out.bam"), emit: bam
    path("*Log.final.out"), emit: log
    
    script:
    def strandedness = params.strandedness == 'forward' ? '--outFilterIntronMotifs RemoveNoncanonical' : 
                      params.strandedness == 'reverse' ? '--outFilterIntronMotifs RemoveNoncanonical' : ''
    """
    STAR \\
        --genomeDir \${params.genome_ref} \\
        --readFilesIn $reads \\
        --runThreadN $task.cpus \\
        --outSAMtype BAM SortedByCoordinate \\
        --outFileNamePrefix \${meta.id}. \\
        --readFilesCommand zcat \\
        $strandedness
    """
}

// Process: featureCounts
process FEATURECOUNTS {
    container '${workflow.containers.featurecounts}'
    publishDir "\${params.outdir}/featurecounts", mode: 'copy'
    
    input:
    tuple val(meta), path(bam)
    
    output:
    path("*.txt"), emit: counts
    path("*.summary"), emit: summary
    
    script:
    def strandedness = params.strandedness == 'forward' ? '-s 1' : 
                      params.strandedness == 'reverse' ? '-s 2' : '-s 0'
    """
    featureCounts \\
        -T $task.cpus \\
        -a \${params.gtf} \\
        -o \${meta.id}.counts.txt \\
        $strandedness \\
        -t ${rnaSeq?.featureType || 'exon'} \\
        -g ${rnaSeq?.attributeType || 'gene_id'} \\
        $bam
    """
}

// Process: DESeq2 Analysis
process DESEQ2 {
    container '${workflow.containers.deseq2}'
    publishDir "\${params.outdir}/deseq2", mode: 'copy'
    
    input:
    path(count_files)
    
    output:
    path("*.csv")
    path("*.pdf")
    
    script:
    """
    #!/usr/bin/env Rscript
    library(DESeq2)
    library(ggplot2)
    
    # Read count files and create count matrix
    count_files <- list.files(".", pattern = ".counts.txt", full.names = TRUE)
    sample_names <- gsub(".counts.txt", "", basename(count_files))
    
    count_matrix <- NULL
    for (i in seq_along(count_files)) {
        counts <- read.table(count_files[i], header = TRUE, skip = 1, row.names = 1)
        if (is.null(count_matrix)) {
            count_matrix <- counts[, 6, drop = FALSE]
        } else {
            count_matrix <- cbind(count_matrix, counts[, 6])
        }
    }
    colnames(count_matrix) <- sample_names
    
    # Create sample metadata (simplified)
    sample_data <- data.frame(
        condition = rep(c("control", "treatment"), length.out = ncol(count_matrix)),
        row.names = colnames(count_matrix)
    )
    
    # Create DESeq2 object
    dds <- DESeqDataSetFromMatrix(
        countData = count_matrix,
        colData = sample_data,
        design = ~ condition
    )
    
    # Run DESeq2
    dds <- DESeq(dds)
    res <- results(dds, contrast = c("condition", "treatment", "control"))
    
    # Save results
    write.csv(as.data.frame(res), "deseq2_results.csv")
    
    # Generate plots
    pdf("deseq2_plots.pdf")
    plotMA(res, main = "MA Plot")
    plotCounts(dds, gene = which.min(res\$padj), intgroup = "condition")
    dev.off()
    """
}

// Workflow
workflow {
    // Quality control
    FASTQC(ch_reads)
    
    // Alignment
    STAR_ALIGN(ch_reads)
    
    // Quantification
    FEATURECOUNTS(STAR_ALIGN.out.bam)
    
    // Differential expression analysis
    count_files = FEATURECOUNTS.out.counts.collect()
    DESEQ2(count_files)
}`;
  }

  private generateGenomeSeqScript(workflow: IWorkflowConfig, params: NextflowParams): string {
    const { genomeSeq } = workflow.parameters;
    return `#!/usr/bin/env nextflow

nextflow.enable.dsl=2

// Parameters
params.reads = "${params.inputFiles.join(',')}"
params.genome_ref = "${genomeSeq?.bwaIndex || ''}"
params.gatk_bundle = "${genomeSeq?.gatkBundle || ''}"
params.known_sites = "${genomeSeq?.knownSites?.join(',') || ''}"
params.outdir = "${params.outputDir}"

// Input channels
ch_reads = Channel.fromPath(params.reads.split(','), checkIfExists: true)
    .map { file -> 
        def meta = [id: file.baseName.replaceAll(/(_R[12])?(_001)?\\.(fastq|fq)(\\.gz)?$/, '')]
        return [meta, file]
    }

// Process: FastQC
process FASTQC {
    container '${workflow.containers.fastqc}'
    publishDir "\${params.outdir}/fastqc", mode: 'copy'
    
    input:
    tuple val(meta), path(reads)
    
    output:
    path("*.html")
    path("*.zip")
    
    script:
    """
    fastqc --quiet --threads $task.cpus $reads
    """
}

// Process: BWA Alignment
process BWA_ALIGN {
    container '${workflow.containers.bwa}'
    publishDir "\${params.outdir}/bwa", mode: 'copy'
    
    input:
    tuple val(meta), path(reads)
    
    output:
    tuple val(meta), path("*.bam"), emit: bam
    
    script:
    """
    bwa mem -t $task.cpus \${params.genome_ref} $reads | \\
    samtools sort -@ $task.cpus -o \${meta.id}.sorted.bam -
    samtools index \${meta.id}.sorted.bam
    """
}

// Process: Mark Duplicates
process MARK_DUPLICATES {
    container '${workflow.containers.gatk}'
    publishDir "\${params.outdir}/marked_duplicates", mode: 'copy'
    
    input:
    tuple val(meta), path(bam)
    
    output:
    tuple val(meta), path("*.marked.bam"), emit: bam
    path("*.metrics.txt"), emit: metrics
    
    script:
    """
    gatk MarkDuplicates \\
        -I $bam \\
        -O \${meta.id}.marked.bam \\
        -M \${meta.id}.metrics.txt \\
        --CREATE_INDEX true
    """
}

// Process: Base Quality Score Recalibration
process BQSR {
    container '${workflow.containers.gatk}'
    publishDir "\${params.outdir}/bqsr", mode: 'copy'
    
    input:
    tuple val(meta), path(bam)
    
    output:
    tuple val(meta), path("*.recal.bam"), emit: bam
    path("*.recal_data.table"), emit: table
    
    script:
    def known_sites_args = params.known_sites ? 
        params.known_sites.split(',').collect { "--known-sites $it" }.join(' ') : ''
    """
    gatk BaseRecalibrator \\
        -I $bam \\
        -R \${params.genome_ref} \\
        $known_sites_args \\
        -O \${meta.id}.recal_data.table
    
    gatk ApplyBQSR \\
        -I $bam \\
        -R \${params.genome_ref} \\
        --bqsr-recal-file \${meta.id}.recal_data.table \\
        -O \${meta.id}.recal.bam
    """
}

// Process: Variant Calling
process HAPLOTYPE_CALLER {
    container '${workflow.containers.gatk}'
    publishDir "\${params.outdir}/variants", mode: 'copy'
    
    input:
    tuple val(meta), path(bam)
    
    output:
    tuple val(meta), path("*.vcf.gz"), emit: vcf
    
    script:
    """
    gatk HaplotypeCaller \\
        -I $bam \\
        -R \${params.genome_ref} \\
        -O \${meta.id}.vcf.gz \\
        -ploidy ${genomeSeq?.ploidy || 2}
    """
}

// Process: Variant Filtering
process VARIANT_FILTER {
    container '${workflow.containers.gatk}'
    publishDir "\${params.outdir}/filtered_variants", mode: 'copy'
    
    input:
    tuple val(meta), path(vcf)
    
    output:
    path("*.filtered.vcf.gz")
    
    script:
    def filter_expr = genomeSeq?.filterExpression || "QD < 2.0 || FS > 60.0 || MQ < 40.0"
    """
    gatk VariantFiltration \\
        -V $vcf \\
        -R \${params.genome_ref} \\
        --filter-expression "$filter_expr" \\
        --filter-name "basic_filter" \\
        -O \${meta.id}.filtered.vcf.gz
    """
}

// Workflow
workflow {
    // Quality control
    FASTQC(ch_reads)
    
    // Alignment
    BWA_ALIGN(ch_reads)
    
    // Mark duplicates
    MARK_DUPLICATES(BWA_ALIGN.out.bam)
    
    // Base quality recalibration
    BQSR(MARK_DUPLICATES.out.bam)
    
    // Variant calling
    HAPLOTYPE_CALLER(BQSR.out.bam)
    
    // Variant filtering
    VARIANT_FILTER(HAPLOTYPE_CALLER.out.vcf)
}`;
  }

  private generateSingleCellRNASeqScript(workflow: IWorkflowConfig, params: NextflowParams): string {
    const { scRnaSeq } = workflow.parameters;
    return `#!/usr/bin/env nextflow

nextflow.enable.dsl=2

// Parameters
params.reads = "${params.inputFiles.join(',')}"
params.cellranger_ref = "${scRnaSeq?.cellRangerRef || ''}"
params.expected_cells = ${scRnaSeq?.expectedCells || 3000}
params.chemistry = "${scRnaSeq?.chemistry || 'auto'}"
params.outdir = "${params.outputDir}"

// Input channels
ch_reads = Channel.fromPath(params.reads.split(','), checkIfExists: true)
    .map { file -> 
        def meta = [id: file.baseName.replaceAll(/_S[0-9]+_L[0-9]+_R[12]_001\\.(fastq|fq)(\\.gz)?$/, '')]
        return [meta, file]
    }
    .groupTuple()

// Process: FastQC
process FASTQC {
    container '${workflow.containers.fastqc}'
    publishDir "\${params.outdir}/fastqc", mode: 'copy'
    
    input:
    tuple val(meta), path(reads)
    
    output:
    path("*.html")
    path("*.zip")
    
    script:
    """
    fastqc --quiet --threads $task.cpus $reads
    """
}

// Process: Cell Ranger Count
process CELLRANGER_COUNT {
    container '${workflow.containers.cellranger}'
    publishDir "\${params.outdir}/cellranger", mode: 'copy'
    
    input:
    tuple val(meta), path(reads)
    
    output:
    tuple val(meta), path("\${meta.id}/outs/filtered_feature_bc_matrix"), emit: matrix
    path("\${meta.id}/outs/web_summary.html"), emit: summary
    path("\${meta.id}/outs/metrics_summary.csv"), emit: metrics
    
    script:
    """
    cellranger count \\
        --id=\${meta.id} \\
        --transcriptome=\${params.cellranger_ref} \\
        --fastqs=. \\
        --sample=\${meta.id} \\
        --chemistry=\${params.chemistry} \\
        --expect-cells=\${params.expected_cells} \\
        --localcores=$task.cpus \\
        --localmem=\${task.memory.toGiga()}
    """
}

// Process: Seurat Analysis
process SEURAT_ANALYSIS {
    container '${workflow.containers.seurat}'
    publishDir "\${params.outdir}/seurat", mode: 'copy'
    
    input:
    tuple val(meta), path(matrix_dir)
    
    output:
    path("*.rds"), emit: seurat_obj
    path("*.pdf"), emit: plots
    path("*.csv"), emit: markers
    
    script:
    """
    #!/usr/bin/env Rscript
    library(Seurat)
    library(dplyr)
    library(ggplot2)
    
    # Load data
    data <- Read10X(data.dir = "$matrix_dir")
    seurat_obj <- CreateSeuratObject(counts = data, project = "\${meta.id}")
    
    # Quality control metrics
    seurat_obj[["percent.mt"]] <- PercentageFeatureSet(seurat_obj, pattern = "^MT-")
    
    # Filter cells and features
    seurat_obj <- subset(seurat_obj, 
        subset = nFeature_RNA > ${scRnaSeq?.seurat?.minFeatures || 200} & 
                 nFeature_RNA < ${scRnaSeq?.seurat?.maxFeatures || 2500} & 
                 percent.mt < ${scRnaSeq?.seurat?.mtPercentCutoff || 20})
    
    # Normalization and scaling
    seurat_obj <- NormalizeData(seurat_obj)
    seurat_obj <- FindVariableFeatures(seurat_obj, selection.method = "vst", nfeatures = 2000)
    seurat_obj <- ScaleData(seurat_obj)
    
    # PCA
    seurat_obj <- RunPCA(seurat_obj, features = VariableFeatures(object = seurat_obj))
    
    # Clustering
    seurat_obj <- FindNeighbors(seurat_obj, dims = 1:${scRnaSeq?.seurat?.dims || 10})
    seurat_obj <- FindClusters(seurat_obj, resolution = ${scRnaSeq?.seurat?.resolution || 0.5})
    
    # UMAP
    seurat_obj <- RunUMAP(seurat_obj, dims = 1:${scRnaSeq?.seurat?.dims || 10})
    
    # Find markers
    markers <- FindAllMarkers(seurat_obj, only.pos = TRUE, min.pct = 0.25, logfc.threshold = 0.25)
    
    # Save results
    saveRDS(seurat_obj, "\${meta.id}_seurat.rds")
    write.csv(markers, "\${meta.id}_markers.csv")
    
    # Generate plots
    pdf("\${meta.id}_plots.pdf", width = 10, height = 8)
    VlnPlot(seurat_obj, features = c("nFeature_RNA", "nCount_RNA", "percent.mt"), ncol = 3)
    FeatureScatter(seurat_obj, feature1 = "nCount_RNA", feature2 = "percent.mt")
    FeatureScatter(seurat_obj, feature1 = "nCount_RNA", feature2 = "nFeature_RNA")
    ElbowPlot(seurat_obj)
    DimPlot(seurat_obj, reduction = "pca")
    DimPlot(seurat_obj, reduction = "umap", label = TRUE)
    dev.off()
    """
}

// Process: SingleR Cell Type Annotation
process SINGLER_ANNOTATION {
    container '${workflow.containers.singler}'
    publishDir "\${params.outdir}/singler", mode: 'copy'
    
    input:
    path(seurat_rds)
    
    output:
    path("*.csv"), emit: annotations
    path("*.pdf"), emit: plots
    
    script:
    """
    #!/usr/bin/env Rscript
    library(SingleR)
    library(celldex)
    library(Seurat)
    library(ggplot2)
    
    # Load Seurat object
    seurat_obj <- readRDS("$seurat_rds")
    
    # Get reference data
    ref_data <- ${scRnaSeq?.singleR?.referenceDataset || 'HumanPrimaryCellAtlasData'}()
    
    # Extract expression matrix
    expr_matrix <- GetAssayData(seurat_obj, assay = "RNA", slot = "data")
    
    # Run SingleR
    predictions <- SingleR(test = expr_matrix, 
                          ref = ref_data, 
                          labels = ref_data\$${scRnaSeq?.singleR?.labelColumn || 'label.main'})
    
    # Add annotations to Seurat object
    seurat_obj\$singler_labels <- predictions\$labels
    
    # Save annotations
    write.csv(predictions, "cell_type_annotations.csv")
    
    # Generate plots
    pdf("singler_plots.pdf", width = 10, height = 8)
    DimPlot(seurat_obj, group.by = "singler_labels", label = TRUE, label.size = 3) + NoLegend()
    plotScoreHeatmap(predictions)
    dev.off()
    """
}

// Workflow
workflow {
    // Quality control
    FASTQC(ch_reads)
    
    // Cell Ranger processing
    CELLRANGER_COUNT(ch_reads)
    
    // Seurat analysis
    SEURAT_ANALYSIS(CELLRANGER_COUNT.out.matrix)
    
    // Cell type annotation
    SINGLER_ANNOTATION(SEURAT_ANALYSIS.out.seurat_obj)
}`;
  }

  private async generateConfigFile(
    workflow: IWorkflowConfig,
    params: NextflowParams
  ): Promise<string> {
    const configPath = path.join(params.workDir, 'nextflow.config');
    
    const config = `
// Nextflow configuration
manifest {
    name = '${workflow.name}'
    description = '${workflow.description || ''}'
    version = '${workflow.version}'
}

// Process configuration
process {
    cpus = ${workflow.resources.cpu}
    memory = '${workflow.resources.memory}'
    time = '${workflow.resources.time}'
    
    withLabel: 'process_low' {
        cpus = 2
        memory = '4 GB'
    }
    
    withLabel: 'process_medium' {
        cpus = 4
        memory = '8 GB'
    }
    
    withLabel: 'process_high' {
        cpus = 8
        memory = '16 GB'
    }
}

// Docker configuration
docker {
    enabled = true
    runOptions = '-u $(id -u):$(id -g)'
}

// Resource configuration
executor {
    name = 'local'
    cpus = ${workflow.resources.cpu * 2}
    memory = '${workflow.resources.memory.replace(/[^\d]/g, '') * 2} GB'
}

// Timeline and report
timeline {
    enabled = true
    file = "\${params.outdir}/pipeline_info/execution_timeline.html"
}

report {
    enabled = true
    file = "\${params.outdir}/pipeline_info/execution_report.html"
}

trace {
    enabled = true
    file = "\${params.outdir}/pipeline_info/execution_trace.txt"
}

dag {
    enabled = true
    file = "\${params.outdir}/pipeline_info/pipeline_dag.svg"
}
`;

    await fs.writeFile(configPath, config);
    return configPath;
  }

  private buildNextflowCommand(
    scriptPath: string,
    configPath: string,
    params: NextflowParams
  ): string[] {
    const command = [
      'nextflow',
      'run',
      scriptPath,
      '-c', configPath,
      '-work-dir', params.workDir,
      '--outdir', params.outputDir
    ];

    if (params.profile) {
      command.push('-profile', params.profile);
    }

    if (params.resume) {
      command.push('-resume');
    }

    // Add custom parameters
    for (const [key, value] of Object.entries(params.parameters || {})) {
      if (value !== undefined && value !== null) {
        command.push(`--${key}`, String(value));
      }
    }

    return command;
  }

  private async runNextflowProcess(
    command: string[],
    job: IAnalysisJob
  ): Promise<NextflowResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';

      const process = spawn(command[0], command.slice(1), {
        stdio: 'pipe',
        env: { ...process.env, NXF_ANSI_LOG: 'false' }
      });

      this.runningJobs.set(job._id, process);

      process.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`[${job._id}] ${output}`);
        
        // Extract progress information
        const progressMatch = output.match(/(\d+)% complete/);
        if (progressMatch) {
          const progress = parseInt(progressMatch[1]);
          job.updateProgress(progress, [output]);
        }
      });

      process.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error(`[${job._id}] ${output}`);
        job.updateProgress(job.progress, [output]);
      });

      process.on('close', async (code) => {
        this.runningJobs.delete(job._id);
        const duration = Date.now() - startTime;
        
        const result: NextflowResult = {
          success: code === 0,
          exitCode: code || 0,
          stdout,
          stderr,
          workDir: command[command.indexOf('-work-dir') + 1],
          outputFiles: await this.collectOutputFiles(command[command.indexOf('--outdir') + 1]),
          duration
        };

        resolve(result);
      });

      process.on('error', (error) => {
        this.runningJobs.delete(job._id);
        reject(error);
      });
    });
  }

  private async collectOutputFiles(outputDir: string): Promise<string[]> {
    try {
      const files: string[] = [];
      
      const collectFiles = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await collectFiles(fullPath);
          } else {
            files.push(fullPath);
          }
        }
      };

      await collectFiles(outputDir);
      return files;
    } catch (error) {
      console.error('Error collecting output files:', error);
      return [];
    }
  }

  public cancelJob(jobId: string): boolean {
    const process = this.runningJobs.get(jobId);
    if (process) {
      process.kill('SIGTERM');
      this.runningJobs.delete(jobId);
      return true;
    }
    return false;
  }

  public getRunningJobs(): string[] {
    return Array.from(this.runningJobs.keys());
  }
}

// Export singleton instance
export const executeNextflowWorkflow = (
  workflow: IWorkflowConfig,
  job: IAnalysisJob,
  params: NextflowParams
): Promise<NextflowResult> => {
  return NextflowService.getInstance().executeWorkflow(workflow, job, params);
};

export const cancelNextflowJob = (jobId: string): boolean => {
  return NextflowService.getInstance().cancelJob(jobId);
};

export const getRunningNextflowJobs = (): string[] => {
  return NextflowService.getInstance().getRunningJobs();
};