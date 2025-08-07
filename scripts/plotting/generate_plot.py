#!/usr/bin/env python3
"""
生物信息学绘图脚本
Bioinformatics plotting script for various omics visualizations
"""

import sys
import json
import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from pathlib import Path
import argparse
from typing import Dict, Any, List, Optional, Tuple
import warnings

# 设置matplotlib后端
import matplotlib
matplotlib.use('Agg')

# 忽略警告
warnings.filterwarnings('ignore')

class PlotGenerator:
    """绘图生成器类"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.plot_type = config['plotType']
        self.output_dir = Path(config['outputDir'])
        self.task_id = config['taskId']
        
        # 加载参数
        with open(config['parametersFile'], 'r') as f:
            params_data = json.load(f)
        
        self.parameters = self._parse_parameters(params_data['parameters'])
        self.plot_config = params_data
        
        # 设置输出文件路径
        self.output_files = {
            'preview': str(self.output_dir / f'{self.task_id}_preview.png'),
            'highRes': str(self.output_dir / f'{self.task_id}_high_res.png'),
            'svg': str(self.output_dir / f'{self.task_id}.svg'),
            'pdf': str(self.output_dir / f'{self.task_id}.pdf')
        }
        
        # 设置绘图样式
        self._setup_plotting_style()
    
    def _parse_parameters(self, params_list: List[Dict]) -> Dict[str, Any]:
        """解析参数列表为字典"""
        return {param['parameterId']: param['value'] for param in params_list}
    
    def _setup_plotting_style(self):
        """设置绘图样式"""
        # 设置matplotlib样式
        plt.style.use('default')
        
        # 设置字体
        font_family = self.parameters.get('fontFamily', 'Arial')
        plt.rcParams['font.family'] = font_family
        plt.rcParams['font.size'] = self.parameters.get('fontSize', 12)
        
        # 设置DPI
        dpi = self.parameters.get('dpi', 300)
        plt.rcParams['figure.dpi'] = dpi
        plt.rcParams['savefig.dpi'] = dpi
        
        # 设置图形背景
        plt.rcParams['figure.facecolor'] = 'white'
        plt.rcParams['axes.facecolor'] = 'white'
    
    def generate_plot(self) -> Dict[str, str]:
        """生成图表的主函数"""
        try:
            # 加载数据
            data = self._load_data()
            
            # 根据图表类型生成图表
            if self.plot_type == 'volcano_plot':
                self._generate_volcano_plot(data)
            elif self.plot_type == 'scatter_plot':
                self._generate_scatter_plot(data)
            elif self.plot_type == 'umap_plot':
                self._generate_umap_plot(data)
            elif self.plot_type == 'heatmap':
                self._generate_heatmap(data)
            elif self.plot_type == 'box_plot':
                self._generate_box_plot(data)
            elif self.plot_type == 'bar_plot':
                self._generate_bar_plot(data)
            else:
                raise ValueError(f"Unsupported plot type: {self.plot_type}")
            
            return self.output_files
            
        except Exception as e:
            raise RuntimeError(f"Failed to generate {self.plot_type}: {str(e)}")
    
    def _load_data(self) -> pd.DataFrame:
        """加载数据"""
        data_path = self.config.get('dataPath')
        
        if data_path and os.path.exists(data_path):
            # 从文件加载真实数据
            if data_path.endswith('.csv'):
                return pd.read_csv(data_path)
            elif data_path.endswith('.tsv'):
                return pd.read_csv(data_path, sep='\t')
            elif data_path.endswith('.xlsx'):
                return pd.read_excel(data_path)
            else:
                raise ValueError(f"Unsupported data format: {data_path}")
        else:
            # 生成模拟数据用于演示
            return self._generate_mock_data()
    
    def _generate_mock_data(self) -> pd.DataFrame:
        """生成模拟数据"""
        np.random.seed(42)  # 确保可重现性
        
        if self.plot_type == 'volcano_plot':
            n_genes = 2000
            log2fc = np.random.normal(0, 2, n_genes)
            pvalue = np.random.beta(0.5, 5, n_genes)
            gene_names = [f'Gene_{i+1}' for i in range(n_genes)]
            
            return pd.DataFrame({
                'log2FC': log2fc,
                'pvalue': pvalue,
                'gene_name': gene_names
            })
            
        elif self.plot_type == 'umap_plot':
            n_cells = 1000
            umap1 = np.random.normal(0, 5, n_cells)
            umap2 = np.random.normal(0, 5, n_cells)
            clusters = np.random.choice(['Cluster_1', 'Cluster_2', 'Cluster_3', 'Cluster_4'], n_cells)
            
            return pd.DataFrame({
                'UMAP1': umap1,
                'UMAP2': umap2,
                'cluster': clusters,
                'cell_name': [f'Cell_{i+1}' for i in range(n_cells)]
            })
            
        elif self.plot_type == 'heatmap':
            genes = [f'Gene_{i+1}' for i in range(50)]
            samples = [f'Sample_{i+1}' for i in range(20)]
            
            # 生成表达矩阵
            data = np.random.normal(0, 1, (50, 20))
            
            return pd.DataFrame(data, index=genes, columns=samples)
            
        else:
            # 默认散点图数据
            n_points = 500
            return pd.DataFrame({
                'x': np.random.normal(50, 15, n_points),
                'y': np.random.normal(50, 15, n_points),
                'group': np.random.choice(['A', 'B', 'C'], n_points)
            })
    
    def _generate_volcano_plot(self, data: pd.DataFrame):
        """生成火山图"""
        # 参数
        log2fc_threshold = self.parameters.get('log2FCThreshold', 1)
        pvalue_threshold = self.parameters.get('pValueThreshold', 0.05)
        point_size = self.parameters.get('pointSize', 6)
        point_alpha = self.parameters.get('pointAlpha', 0.7)
        
        # 颜色设置
        up_color = self.parameters.get('upregulatedColor', '#ff6b6b')
        down_color = self.parameters.get('downregulatedColor', '#4ecdc4')
        ns_color = self.parameters.get('nonsignificantColor', '#95a5a6')
        
        # 计算-log10(p-value)
        data['-log10_pvalue'] = -np.log10(data['pvalue'])
        
        # 分类基因
        data['significance'] = 'Non-significant'
        data.loc[(data['log2FC'] >= log2fc_threshold) & (data['pvalue'] <= pvalue_threshold), 'significance'] = 'Upregulated'
        data.loc[(data['log2FC'] <= -log2fc_threshold) & (data['pvalue'] <= pvalue_threshold), 'significance'] = 'Downregulated'
        
        # 创建图形
        fig, ax = plt.subplots(figsize=(10, 8))
        
        # 绘制点
        for sig, color in [('Non-significant', ns_color), ('Upregulated', up_color), ('Downregulated', down_color)]:
            subset = data[data['significance'] == sig]
            ax.scatter(subset['log2FC'], subset['-log10_pvalue'], 
                      c=color, s=point_size, alpha=point_alpha, label=sig)
        
        # 添加阈值线
        if self.parameters.get('showThresholdLines', True):
            ax.axvline(x=log2fc_threshold, color='gray', linestyle='--', alpha=0.7)
            ax.axvline(x=-log2fc_threshold, color='gray', linestyle='--', alpha=0.7)
            ax.axhline(y=-np.log10(pvalue_threshold), color='gray', linestyle='--', alpha=0.7)
        
        # 设置标签和标题
        ax.set_xlabel(self.parameters.get('xLabel', 'Log2 Fold Change'))
        ax.set_ylabel(self.parameters.get('yLabel', '-Log10 P-value'))
        ax.set_title(self.parameters.get('title', 'Volcano Plot'))
        
        # 图例
        if self.parameters.get('showLegend', True):
            ax.legend()
        
        # 网格
        if self.parameters.get('showGrid', True):
            ax.grid(True, alpha=0.3)
        
        # 保存图形
        self._save_figure(fig)
        plt.close(fig)
    
    def _generate_scatter_plot(self, data: pd.DataFrame):
        """生成散点图"""
        point_size = self.parameters.get('pointSize', 8)
        point_color = self.parameters.get('pointColor', '#1f77b4')
        
        fig, ax = plt.subplots(figsize=(10, 8))
        
        ax.scatter(data['x'], data['y'], s=point_size, c=point_color, alpha=0.7)
        
        ax.set_xlabel(self.parameters.get('xLabel', 'X Values'))
        ax.set_ylabel(self.parameters.get('yLabel', 'Y Values'))
        ax.set_title(self.parameters.get('title', 'Scatter Plot'))
        
        if self.parameters.get('showGrid', True):
            ax.grid(True, alpha=0.3)
        
        self._save_figure(fig)
        plt.close(fig)
    
    def _generate_umap_plot(self, data: pd.DataFrame):
        """生成UMAP图"""
        point_size = self.parameters.get('pointSize', 6)
        color_palette = self.parameters.get('colorPalette', 'tab10')
        
        fig, ax = plt.subplots(figsize=(10, 8))
        
        # 按聚类着色
        unique_clusters = data['cluster'].unique()
        colors = plt.cm.get_cmap(color_palette)(np.linspace(0, 1, len(unique_clusters)))
        
        for i, cluster in enumerate(unique_clusters):
            subset = data[data['cluster'] == cluster]
            ax.scatter(subset['UMAP1'], subset['UMAP2'], 
                      c=[colors[i]], s=point_size, alpha=0.7, label=cluster)
        
        ax.set_xlabel(self.parameters.get('xLabel', 'UMAP 1'))
        ax.set_ylabel(self.parameters.get('yLabel', 'UMAP 2'))
        ax.set_title(self.parameters.get('title', 'UMAP Plot'))
        
        if self.parameters.get('showLegend', True):
            ax.legend()
        
        # 移除坐标轴刻度（UMAP通常不显示）
        if not self.parameters.get('showAxes', False):
            ax.set_xticks([])
            ax.set_yticks([])
        
        self._save_figure(fig)
        plt.close(fig)
    
    def _generate_heatmap(self, data: pd.DataFrame):
        """生成热图"""
        colormap = self.parameters.get('colormap', 'RdBu_r')
        show_row_names = self.parameters.get('showRowNames', True)
        show_col_names = self.parameters.get('showColumnNames', True)
        
        fig, ax = plt.subplots(figsize=(12, 10))
        
        # 创建热图
        im = ax.imshow(data.values, cmap=colormap, aspect='auto')
        
        # 设置标签
        if show_row_names:
            ax.set_yticks(range(len(data.index)))
            ax.set_yticklabels(data.index)
        else:
            ax.set_yticks([])
        
        if show_col_names:
            ax.set_xticks(range(len(data.columns)))
            ax.set_xticklabels(data.columns, rotation=45, ha='right')
        else:
            ax.set_xticks([])
        
        ax.set_title(self.parameters.get('title', 'Heatmap'))
        
        # 添加颜色条
        if self.parameters.get('showColorbar', True):
            cbar = plt.colorbar(im, ax=ax)
            cbar.set_label(self.parameters.get('colorbarLabel', 'Expression'))
        
        plt.tight_layout()
        self._save_figure(fig)
        plt.close(fig)
    
    def _generate_box_plot(self, data: pd.DataFrame):
        """生成箱线图"""
        fig, ax = plt.subplots(figsize=(10, 8))
        
        # 假设数据有group和value列
        if 'group' in data.columns and 'value' in data.columns:
            groups = data['group'].unique()
            box_data = [data[data['group'] == group]['value'] for group in groups]
            ax.boxplot(box_data, labels=groups)
        else:
            # 使用所有数值列
            numeric_cols = data.select_dtypes(include=[np.number]).columns
            ax.boxplot([data[col].dropna() for col in numeric_cols], labels=numeric_cols)
        
        ax.set_xlabel(self.parameters.get('xLabel', 'Groups'))
        ax.set_ylabel(self.parameters.get('yLabel', 'Values'))
        ax.set_title(self.parameters.get('title', 'Box Plot'))
        
        if self.parameters.get('showGrid', True):
            ax.grid(True, alpha=0.3)
        
        self._save_figure(fig)
        plt.close(fig)
    
    def _generate_bar_plot(self, data: pd.DataFrame):
        """生成柱状图"""
        bar_color = self.parameters.get('barColor', '#1f77b4')
        
        fig, ax = plt.subplots(figsize=(10, 8))
        
        # 假设数据有category和value列
        if 'category' in data.columns and 'value' in data.columns:
            ax.bar(data['category'], data['value'], color=bar_color)
        else:
            # 使用第一列作为类别，第二列作为值
            ax.bar(data.iloc[:, 0], data.iloc[:, 1], color=bar_color)
        
        ax.set_xlabel(self.parameters.get('xLabel', 'Categories'))
        ax.set_ylabel(self.parameters.get('yLabel', 'Values'))
        ax.set_title(self.parameters.get('title', 'Bar Plot'))
        
        if self.parameters.get('showGrid', True):
            ax.grid(True, alpha=0.3, axis='y')
        
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        self._save_figure(fig)
        plt.close(fig)
    
    def _save_figure(self, fig):
        """保存图形到多种格式"""
        # 预览版本（低分辨率）
        fig.savefig(self.output_files['preview'], dpi=150, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        
        # 高分辨率版本
        dpi = self.parameters.get('dpi', 300)
        fig.savefig(self.output_files['highRes'], dpi=dpi, bbox_inches='tight',
                   facecolor='white', edgecolor='none')
        
        # SVG版本
        fig.savefig(self.output_files['svg'], format='svg', bbox_inches='tight',
                   facecolor='white', edgecolor='none')
        
        # PDF版本
        fig.savefig(self.output_files['pdf'], format='pdf', bbox_inches='tight',
                   facecolor='white', edgecolor='none')


def main():
    """主函数"""
    if len(sys.argv) != 2:
        print("Usage: python generate_plot.py <config_file>", file=sys.stderr)
        sys.exit(1)
    
    config_file = sys.argv[1]
    
    try:
        # 加载配置
        with open(config_file, 'r') as f:
            config = json.load(f)
        
        # 创建绘图生成器
        generator = PlotGenerator(config)
        
        # 生成图表
        output_files = generator.generate_plot()
        
        # 输出结果（JSON格式，供Node.js读取）
        result = {
            'success': True,
            'outputFiles': output_files,
            'message': f'Successfully generated {config["plotType"]}'
        }
        
        print(json.dumps(result))
        sys.exit(0)
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'message': f'Failed to generate plot: {str(e)}'
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()