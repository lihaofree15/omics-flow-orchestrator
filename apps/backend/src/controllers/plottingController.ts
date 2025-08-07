import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { 
  PlotType, 
  PlotParameters, 
  PlottingTask, 
  ParameterTemplate, 
  PlotConfiguration,
  PlotPreviewResponse,
  PlotGenerationResponse,
  BatchPlottingTask
} from '@bioinformatics-platform/shared-types';

import { logger } from '@/config/logger';
import { PlottingTaskModel, ParameterTemplateModel } from '@/models/plotting';
import { PlottingService } from '@/services/plottingService';
import { plotConfigService } from '@/services/plotConfigService';
import { AuthenticatedRequest } from '@/types/auth';

/**
 * 获取绘图配置
 * Get plot configurations
 */
export const getPlotConfigurations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plotType } = req.params;
    
    if (plotType) {
      const configuration = plotConfigService.getConfiguration(plotType as PlotType);
      if (!configuration) {
        res.status(404).json({
          success: false,
          message: `Configuration for plot type '${plotType}' not found`,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      res.json({
        success: true,
        data: configuration,
        timestamp: new Date().toISOString()
      });
    } else {
      const allConfigurations = plotConfigService.getAllConfigurations();
      res.json({
        success: true,
        data: allConfigurations,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Error getting plot configurations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 验证绘图参数
 * Validate plot parameters
 */
export const validatePlotParameters = async (req: Request, res: Response): Promise<void> => {
  try {
    const parameters: PlotParameters = req.body;
    
    const validation = plotConfigService.validateParameters(parameters.plotType, parameters);
    
    res.json({
      success: validation.isValid,
      data: {
        isValid: validation.isValid,
        errors: validation.errors
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error validating plot parameters:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 生成绘图预览
 * Generate plot preview
 */
export const generatePlotPreview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parameters: PlotParameters = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 验证参数
    const validation = plotConfigService.validateParameters(parameters.plotType, parameters);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: validation.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 生成预览
    const plottingService = new PlottingService();
    const previewData = await plottingService.generatePreview(parameters, userId);
    
    const response: PlotPreviewResponse = {
      success: true,
      data: previewData,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Error generating plot preview:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate preview',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 生成高质量图表
 * Generate high-quality plot
 */
export const generatePlot = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parameters: PlotParameters = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 验证参数
    const validation = plotConfigService.validateParameters(parameters.plotType, parameters);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: validation.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 创建绘图任务
    const taskId = uuidv4();
    const task: PlottingTask = {
      id: taskId,
      plotType: parameters.plotType,
      status: 'pending',
      parameters,
      inputData: {
        taskId: parameters.taskId,
        dataPath: req.body.dataPath,
        columns: req.body.columns
      },
      outputFiles: {},
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 保存任务到数据库
    const savedTask = await PlottingTaskModel.create(task);
    
    // 异步生成图表
    const plottingService = new PlottingService();
    plottingService.generatePlotAsync(savedTask)
      .then(result => {
        logger.info(`Plot generation completed for task ${taskId}`);
      })
      .catch(error => {
        logger.error(`Plot generation failed for task ${taskId}:`, error);
      });
    
    const response: PlotGenerationResponse = {
      success: true,
      data: {
        taskId,
        files: {},
        parameters,
        metadata: {
          duration: 0,
          backend: 'python',
          version: '1.0.0'
        }
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(202).json(response); // 202 Accepted for async processing
  } catch (error) {
    logger.error('Error generating plot:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate plot',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 批量生成图表
 * Batch generate plots
 */
export const batchGeneratePlots = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const batchRequest: BatchPlottingTask = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 验证基础参数
    const validation = plotConfigService.validateParameters(
      batchRequest.plotType, 
      batchRequest.baseParameters
    );
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid base parameters',
        errors: validation.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 创建批量任务
    const batchTaskId = uuidv4();
    const batchTask: BatchPlottingTask = {
      ...batchRequest,
      id: batchTaskId,
      status: 'pending',
      progress: {
        total: batchRequest.variations.length,
        completed: 0,
        failed: 0
      },
      results: [],
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 保存批量任务到数据库
    // await BatchPlottingTaskModel.create(batchTask);
    
    // 异步处理批量生成
    const plottingService = new PlottingService();
    plottingService.processBatchPlotting(batchTask)
      .then(result => {
        logger.info(`Batch plotting completed for task ${batchTaskId}`);
      })
      .catch(error => {
        logger.error(`Batch plotting failed for task ${batchTaskId}:`, error);
      });
    
    res.status(202).json({
      success: true,
      data: {
        batchTaskId,
        status: 'pending',
        total: batchTask.variations.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error processing batch plot generation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process batch plotting',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 下载生成的图表
 * Download generated plot
 */
export const downloadPlot = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId, format } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 获取任务信息
    const task = await PlottingTaskModel.findOne({ 
      id: taskId, 
      createdBy: userId 
    });
    
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Plot not found or access denied',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (task.status !== 'completed') {
      res.status(400).json({
        success: false,
        message: `Plot is not ready. Current status: ${task.status}`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 获取文件路径
    const fileKey = format.toLowerCase() as keyof typeof task.outputFiles;
    const filePath = task.outputFiles[fileKey];
    
    if (!filePath) {
      res.status(404).json({
        success: false,
        message: `Plot in format '${format}' is not available`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch {
      res.status(404).json({
        success: false,
        message: 'Plot file not found on server',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 设置下载头部
    const filename = `${task.plotType}_${taskId}.${format.toLowerCase()}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', getContentType(format));
    
    // 发送文件
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    logger.error('Error downloading plot:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download plot',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 获取用户的参数模板
 * Get user's parameter templates
 */
export const getPlotTemplates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { plotType, page = 1, limit = 20 } = req.query;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const query: any = {
      $or: [
        { createdBy: userId },
        { isPublic: true }
      ]
    };
    
    if (plotType) {
      query.plotType = plotType;
    }

    const templates = await ParameterTemplateModel.find(query)
      .sort({ updatedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    
    const total = await ParameterTemplateModel.countDocuments(query);
    
    res.json({
      success: true,
      data: templates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting plot templates:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get templates',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 保存参数模板
 * Save parameter template
 */
export const savePlotTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const templateData: ParameterTemplate = req.body;
    const { templateId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 验证参数
    const validation = plotConfigService.validateParameters(
      templateData.plotType, 
      templateData.parameters
    );
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid template parameters',
        errors: validation.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    let template: ParameterTemplate;
    
    if (templateId) {
      // 更新现有模板
      const existingTemplate = await ParameterTemplateModel.findOne({
        id: templateId,
        createdBy: userId
      });
      
      if (!existingTemplate) {
        res.status(404).json({
          success: false,
          message: 'Template not found or access denied',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      template = {
        ...templateData,
        id: templateId,
        createdBy: userId,
        createdAt: existingTemplate.createdAt,
        updatedAt: new Date().toISOString()
      };
      
      await ParameterTemplateModel.findOneAndUpdate(
        { id: templateId },
        template,
        { new: true }
      );
    } else {
      // 创建新模板
      template = {
        ...templateData,
        id: uuidv4(),
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      };
      
      await ParameterTemplateModel.create(template);
    }
    
    res.status(templateId ? 200 : 201).json({
      success: true,
      data: template,
      message: templateId ? 'Template updated successfully' : 'Template created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error saving plot template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save template',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 删除参数模板
 * Delete parameter template
 */
export const deletePlotTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const result = await ParameterTemplateModel.findOneAndDelete({
      id: templateId,
      createdBy: userId
    });
    
    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Template not found or access denied',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Template deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error deleting plot template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete template',
      timestamp: new Date().toISOString()
    });
  }
};

// 辅助函数
function getContentType(format: string): string {
  switch (format.toLowerCase()) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}