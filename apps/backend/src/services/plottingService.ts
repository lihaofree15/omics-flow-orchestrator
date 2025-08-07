import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { 
  PlotParameters, 
  PlottingTask, 
  BatchPlottingTask,
  PlotType 
} from '@bioinformatics-platform/shared-types';

import { logger } from '@/config/logger';
import { PlottingTaskModel } from '@/models/plotting';

export class PlottingService {
  private readonly outputDir: string;
  private readonly scriptsDir: string;
  private readonly tempDir: string;
  private readonly pythonPath: string;
  private readonly rPath: string;

  constructor() {
    this.outputDir = process.env.PLOTS_OUTPUT_DIR || path.join(process.cwd(), 'data', 'plots');
    this.scriptsDir = path.join(process.cwd(), 'scripts', 'plotting');
    this.tempDir = path.join(process.cwd(), 'temp');
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.rPath = process.env.R_PATH || 'Rscript';
    
    this.ensureDirectories();
  }

  /**
   * 确保必要的目录存在
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(`Plotting directories initialized: ${this.outputDir}`);
    } catch (error) {
      logger.error('Failed to create plotting directories:', error);
    }
  }

  /**
   * 生成预览数据
   * Generate preview data for frontend
   */
  public async generatePreview(parameters: PlotParameters, userId: string): Promise<any> {
    try {
      logger.info(`Generating preview for ${parameters.plotType}`);
      
      // 生成轻量级预览数据
      const previewData = await this.generatePreviewData(parameters);
      
      return {
        plotData: previewData.data,
        layout: previewData.layout,
        config: previewData.config
      };
    } catch (error) {
      logger.error('Error generating preview:', error);
      throw new Error(`Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 异步生成高质量图表
   * Asynchronously generate high-quality plot
   */
  public async generatePlotAsync(task: PlottingTask): Promise<void> {
    try {
      // 更新任务状态
      await this.updateTaskStatus(task.id, 'processing');
      
      const startTime = Date.now();
      
      // 根据图表类型选择后端
      const backend = this.selectBackend(task.plotType);
      const result = await this.executePlotGeneration(task, backend);
      
      const duration = Date.now() - startTime;
      
      // 更新任务状态和结果
      await PlottingTaskModel.findOneAndUpdate(
        { id: task.id },
        {
          status: 'completed',
          outputFiles: result.outputFiles,
          duration,
          updatedAt: new Date().toISOString()
        }
      );
      
      logger.info(`Plot generation completed for task ${task.id} in ${duration}ms`);
    } catch (error) {
      logger.error(`Plot generation failed for task ${task.id}:`, error);
      
      // 更新任务状态为失败
      await PlottingTaskModel.findOneAndUpdate(
        { id: task.id },
        {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date().toISOString()
        }
      );
      
      throw error;
    }
  }

  /**
   * 处理批量绘图
   * Process batch plotting
   */
  public async processBatchPlotting(batchTask: BatchPlottingTask): Promise<void> {
    try {
      logger.info(`Processing batch plotting task ${batchTask.id} with ${batchTask.variations.length} variations`);
      
      const results: PlottingTask[] = [];
      let completed = 0;
      let failed = 0;
      
      for (const variation of batchTask.variations) {
        try {
          // 合并基础参数和变化参数
          const mergedParameters = this.mergeParameters(
            batchTask.baseParameters,
            variation.parameterOverrides
          );
          
          // 创建单个绘图任务
          const individualTask: PlottingTask = {
            id: uuidv4(),
            plotType: batchTask.plotType,
            status: 'pending',
            parameters: mergedParameters,
            inputData: variation.inputData,
            outputFiles: {},
            createdBy: batchTask.createdBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // 执行绘图
          await this.generatePlotAsync(individualTask);
          results.push(individualTask);
          completed++;
          
        } catch (error) {
          logger.error(`Failed to generate plot for variation ${variation.id}:`, error);
          failed++;
          
          // 创建失败的任务记录
          const failedTask: PlottingTask = {
            id: uuidv4(),
            plotType: batchTask.plotType,
            status: 'failed',
            parameters: batchTask.baseParameters,
            inputData: variation.inputData,
            outputFiles: {},
            error: error instanceof Error ? error.message : 'Unknown error',
            createdBy: batchTask.createdBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          results.push(failedTask);
        }
        
        // 更新批量任务进度（如果有数据库模型的话）
        // await BatchPlottingTaskModel.findOneAndUpdate(
        //   { id: batchTask.id },
        //   {
        //     progress: { total: batchTask.variations.length, completed, failed },
        //     results,
        //     updatedAt: new Date().toISOString()
        //   }
        // );
      }
      
      logger.info(`Batch plotting completed: ${completed} succeeded, ${failed} failed`);
      
    } catch (error) {
      logger.error(`Batch plotting failed for task ${batchTask.id}:`, error);
      throw error;
    }
  }

  /**
   * 选择绘图后端
   * Select plotting backend
   */
  private selectBackend(plotType: PlotType): 'python' | 'r' {
    // 根据图表类型选择最适合的后端
    switch (plotType) {
      case 'volcano_plot':
      case 'scatter_plot':
      case 'heatmap':
        return 'python'; // 使用 matplotlib/seaborn
      case 'umap_plot':
      case 'tsne_plot':
      case 'pca_plot':
        return 'python'; // 使用 plotly/matplotlib
      case 'box_plot':
      case 'violin_plot':
        return 'r'; // 使用 ggplot2
      default:
        return 'python';
    }
  }

  /**
   * 执行图表生成
   * Execute plot generation
   */
  private async executePlotGeneration(
    task: PlottingTask, 
    backend: 'python' | 'r'
  ): Promise<{ outputFiles: Record<string, string> }> {
    const taskDir = path.join(this.outputDir, task.id);
    await fs.mkdir(taskDir, { recursive: true });
    
    // 生成参数文件
    const parametersFile = path.join(taskDir, 'parameters.json');
    await fs.writeFile(parametersFile, JSON.stringify(task.parameters, null, 2));
    
    // 生成脚本参数
    const scriptArgs = {
      plotType: task.plotType,
      parametersFile,
      outputDir: taskDir,
      dataPath: task.inputData.dataPath,
      taskId: task.id
    };
    
    let outputFiles: Record<string, string>;
    
    if (backend === 'python') {
      outputFiles = await this.executePythonScript(scriptArgs);
    } else {
      outputFiles = await this.executeRScript(scriptArgs);
    }
    
    return { outputFiles };
  }

  /**
   * 执行Python脚本
   * Execute Python script
   */
  private async executePythonScript(args: any): Promise<Record<string, string>> {
    const scriptPath = path.join(this.scriptsDir, 'generate_plot.py');
    const configFile = path.join(args.outputDir, 'script_config.json');
    
    // 写入脚本配置
    await fs.writeFile(configFile, JSON.stringify(args, null, 2));
    
    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, [scriptPath, configFile], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONPATH: this.scriptsDir }
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          try {
            // Python脚本应该输出生成的文件路径
            const result = JSON.parse(stdout.trim());
            resolve(result.outputFiles);
          } catch (error) {
            reject(new Error(`Failed to parse Python script output: ${error}`));
          }
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });
      
      process.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });
    });
  }

  /**
   * 执行R脚本
   * Execute R script
   */
  private async executeRScript(args: any): Promise<Record<string, string>> {
    const scriptPath = path.join(this.scriptsDir, 'generate_plot.R');
    const configFile = path.join(args.outputDir, 'script_config.json');
    
    // 写入脚本配置
    await fs.writeFile(configFile, JSON.stringify(args, null, 2));
    
    return new Promise((resolve, reject) => {
      const process = spawn(this.rPath, [scriptPath, configFile], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          try {
            // R脚本应该输出生成的文件路径
            const result = JSON.parse(stdout.trim());
            resolve(result.outputFiles);
          } catch (error) {
            reject(new Error(`Failed to parse R script output: ${error}`));
          }
        } else {
          reject(new Error(`R script failed with code ${code}: ${stderr}`));
        }
      });
      
      process.on('error', (error) => {
        reject(new Error(`Failed to spawn R process: ${error.message}`));
      });
    });
  }

  /**
   * 生成预览数据
   * Generate preview data
   */
  private async generatePreviewData(parameters: PlotParameters): Promise<any> {
    // 这里生成用于前端预览的轻量级数据
    // 实际实现中可能需要调用数据服务获取样本数据
    
    switch (parameters.plotType) {
      case 'volcano_plot':
        return this.generateVolcanoPreviewData(parameters);
      case 'scatter_plot':
        return this.generateScatterPreviewData(parameters);
      case 'umap_plot':
        return this.generateUMAPPreviewData(parameters);
      case 'heatmap':
        return this.generateHeatmapPreviewData(parameters);
      default:
        return this.generateDefaultPreviewData(parameters);
    }
  }

  /**
   * 生成火山图预览数据
   * Generate volcano plot preview data
   */
  private generateVolcanoPreviewData(parameters: PlotParameters): any {
    // 生成模拟数据
    const numGenes = 1000;
    const log2FC = Array.from({ length: numGenes }, () => (Math.random() - 0.5) * 8);
    const pValue = Array.from({ length: numGenes }, () => Math.random());
    const geneNames = Array.from({ length: numGenes }, (_, i) => `Gene_${i + 1}`);
    
    return {
      data: { log2FC, pValue, geneNames },
      layout: {
        title: 'Volcano Plot Preview',
        xaxis: { title: 'Log2 Fold Change' },
        yaxis: { title: '-Log10 P-value' }
      },
      config: { responsive: true }
    };
  }

  /**
   * 生成散点图预览数据
   * Generate scatter plot preview data
   */
  private generateScatterPreviewData(parameters: PlotParameters): any {
    const numPoints = 500;
    const x = Array.from({ length: numPoints }, () => Math.random() * 100);
    const y = Array.from({ length: numPoints }, () => Math.random() * 100);
    
    return {
      data: { x, y },
      layout: {
        title: 'Scatter Plot Preview',
        xaxis: { title: 'X Values' },
        yaxis: { title: 'Y Values' }
      },
      config: { responsive: true }
    };
  }

  /**
   * 生成UMAP预览数据
   * Generate UMAP preview data
   */
  private generateUMAPPreviewData(parameters: PlotParameters): any {
    const numCells = 2000;
    const umap1 = Array.from({ length: numCells }, () => (Math.random() - 0.5) * 20);
    const umap2 = Array.from({ length: numCells }, () => (Math.random() - 0.5) * 20);
    const clusters = Array.from({ length: numCells }, () => Math.floor(Math.random() * 8));
    const cellNames = Array.from({ length: numCells }, (_, i) => `Cell_${i + 1}`);
    
    return {
      data: { umap1, umap2, clusters, cellNames },
      layout: {
        title: 'UMAP Plot Preview',
        xaxis: { title: 'UMAP 1' },
        yaxis: { title: 'UMAP 2' }
      },
      config: { responsive: true }
    };
  }

  /**
   * 生成热图预览数据
   * Generate heatmap preview data
   */
  private generateHeatmapPreviewData(parameters: PlotParameters): any {
    const rows = 50;
    const cols = 20;
    const matrix = Array.from({ length: rows }, () => 
      Array.from({ length: cols }, () => (Math.random() - 0.5) * 4)
    );
    const rowNames = Array.from({ length: rows }, (_, i) => `Gene_${i + 1}`);
    const columnNames = Array.from({ length: cols }, (_, i) => `Sample_${i + 1}`);
    
    return {
      data: { matrix, rowNames, columnNames },
      layout: {
        title: 'Heatmap Preview',
        xaxis: { title: 'Samples' },
        yaxis: { title: 'Genes' }
      },
      config: { responsive: true }
    };
  }

  /**
   * 生成默认预览数据
   * Generate default preview data
   */
  private generateDefaultPreviewData(parameters: PlotParameters): any {
    return {
      data: {
        x: [1, 2, 3, 4, 5],
        y: [2, 4, 3, 5, 1]
      },
      layout: {
        title: 'Preview Plot',
        xaxis: { title: 'X Axis' },
        yaxis: { title: 'Y Axis' }
      },
      config: { responsive: true }
    };
  }

  /**
   * 合并参数
   * Merge parameters for batch plotting
   */
  private mergeParameters(baseParameters: PlotParameters, overrides: any[]): PlotParameters {
    const merged = { ...baseParameters };
    const paramMap = new Map(merged.parameters.map(p => [p.parameterId, p]));
    
    overrides.forEach(override => {
      const existing = paramMap.get(override.parameterId);
      if (existing) {
        existing.value = override.value;
      } else {
        merged.parameters.push(override);
      }
    });
    
    return merged;
  }

  /**
   * 更新任务状态
   * Update task status
   */
  private async updateTaskStatus(taskId: string, status: string): Promise<void> {
    try {
      await PlottingTaskModel.findOneAndUpdate(
        { id: taskId },
        { 
          status, 
          updatedAt: new Date().toISOString() 
        }
      );
    } catch (error) {
      logger.error(`Failed to update task status for ${taskId}:`, error);
    }
  }

  /**
   * 清理临时文件
   * Cleanup temporary files
   */
  public async cleanup(taskId: string): Promise<void> {
    try {
      const taskDir = path.join(this.outputDir, taskId);
      await fs.rm(taskDir, { recursive: true, force: true });
      logger.info(`Cleaned up files for task ${taskId}`);
    } catch (error) {
      logger.error(`Failed to cleanup files for task ${taskId}:`, error);
    }
  }
}