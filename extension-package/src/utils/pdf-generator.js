/**
 * PDF Report Generator
 * PDF报告生成器，支持将分析结果导出为PDF格式
 */

class PDFReportGenerator {
  constructor() {
    this.jsPDF = null;
    this.initialized = false;
  }

  /**
   * 初始化jsPDF库
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // 动态加载jsPDF库
      if (typeof window !== 'undefined' && !window.jsPDF) {
        await this.loadjsPDF();
      }
      this.jsPDF = window.jsPDF || jsPDF;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize PDF generator:', error);
      throw new Error('PDF生成器初始化失败');
    }
  }

  /**
   * 动态加载jsPDF库
   */
  async loadjsPDF() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.head.appendChild(script);
    });
  }

  /**
   * 生成PDF报告
   */
  async generatePDF(analysisData, options = {}) {
    await this.initialize();

    const {
      title = '跨境电商内容分析报告',
      includeCharts = false,
      language = 'zh-CN'
    } = options;

    // 创建PDF文档
    const doc = new this.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 设置中文字体支持（简化处理）
    this.setupFonts(doc);

    let currentY = 20;

    // 生成报告内容
    currentY = this.addHeader(doc, title, analysisData, currentY);
    currentY = this.addExecutiveSummary(doc, analysisData, currentY);
    currentY = this.addDetailedAnalysis(doc, analysisData, currentY);
    currentY = this.addRecommendations(doc, analysisData, currentY);
    
    if (includeCharts) {
      currentY = this.addCharts(doc, analysisData, currentY);
    }
    
    currentY = this.addFooter(doc, currentY);

    return doc;
  }

  /**
   * 设置字体
   */
  setupFonts(doc) {
    // 使用内置字体，实际项目中可以添加中文字体文件
    doc.setFont('helvetica');
  }

  /**
   * 添加报告头部
   */
  addHeader(doc, title, data, startY) {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // 标题
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, startY, { align: 'center' });
    
    let currentY = startY + 15;

    // 基本信息
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    if (data.url) {
      doc.text(`URL: ${data.url}`, 20, currentY);
      currentY += 10;
    }
    
    if (data.timestamp) {
      const date = new Date(data.timestamp).toLocaleString('zh-CN');
      doc.text(`报告生成时间: ${date}`, 20, currentY);
      currentY += 10;
    }
    
    if (data.results && Object.keys(data.results).length > 0) {
      const regions = Object.keys(data.results).join(', ');
      doc.text(`分析地区: ${regions}`, 20, currentY);
      currentY += 15;
    }

    return currentY;
  }

  /**
   * 添加执行摘要
   */
  addExecutiveSummary(doc, data, startY) {
    let currentY = this.addSectionHeader(doc, '执行摘要', startY);
    
    if (!data.results) {
      doc.text('无分析数据', 20, currentY);
      return currentY + 15;
    }

    const results = data.results;
    const regions = Object.keys(results);
    
    // 计算总体评分
    const overallScores = [];
    regions.forEach(region => {
      if (results[region].overallScore !== undefined) {
        overallScores.push({
          region,
          score: results[region].overallScore
        });
      }
    });

    if (overallScores.length > 0) {
      const avgScore = Math.round(
        overallScores.reduce((sum, item) => sum + item.score, 0) / overallScores.length
      );
      
      doc.text(`总体适配评分: ${avgScore}/100`, 20, currentY);
      currentY += 8;
      
      // 最佳和最差地区
      overallScores.sort((a, b) => b.score - a.score);
      doc.text(`表现最佳地区: ${overallScores[0].region} (${overallScores[0].score}分)`, 20, currentY);
      currentY += 8;
      
      if (overallScores.length > 1) {
        const worst = overallScores[overallScores.length - 1];
        doc.text(`需要改进地区: ${worst.region} (${worst.score}分)`, 20, currentY);
        currentY += 8;
      }
    }

    // 主要问题概述
    const allIssues = [];
    regions.forEach(region => {
      const regionResult = results[region];
      ['language', 'culture', 'compliance', 'userExperience'].forEach(category => {
        if (regionResult[category] && regionResult[category].issues) {
          allIssues.push(...regionResult[category].issues.map(issue => ({
            region,
            category,
            issue
          })));
        }
      });
    });

    if (allIssues.length > 0) {
      currentY += 5;
      doc.text('主要问题:', 20, currentY);
      currentY += 8;
      
      // 显示前5个最重要的问题
      const topIssues = allIssues.slice(0, 5);
      topIssues.forEach((item, index) => {
        const text = `${index + 1}. ${item.region}: ${item.issue}`;
        const lines = doc.splitTextToSize(text, 170);
        lines.forEach(line => {
          if (currentY > 250) { // 检查是否需要换页
            doc.addPage();
            currentY = 20;
          }
          doc.text(line, 25, currentY);
          currentY += 6;
        });
      });
    }

    return currentY + 10;
  }

  /**
   * 添加详细分析
   */
  addDetailedAnalysis(doc, data, startY) {
    let currentY = this.addSectionHeader(doc, '详细分析', startY);
    
    if (!data.results) {
      return currentY + 10;
    }

    const results = data.results;
    const regions = Object.keys(results);

    regions.forEach(region => {
      // 检查是否需要换页
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      const regionResult = results[region];
      
      // 地区标题
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${region} - ${regionResult.region?.name || region}`, 20, currentY);
      currentY += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // 各维度评分
      const categories = {
        language: '语言适配',
        culture: '文化适配', 
        compliance: '合规性',
        userExperience: '用户体验'
      };

      Object.entries(categories).forEach(([key, name]) => {
        if (regionResult[key]) {
          const score = regionResult[key].score || 0;
          doc.text(`${name}: ${score}/100`, 25, currentY);
          
          // 显示主要问题
          if (regionResult[key].issues && regionResult[key].issues.length > 0) {
            regionResult[key].issues.forEach(issue => {
              currentY += 6;
              const lines = doc.splitTextToSize(`- ${issue}`, 160);
              lines.forEach(line => {
                if (currentY > 270) {
                  doc.addPage();
                  currentY = 20;
                }
                doc.text(line, 30, currentY);
                currentY += 6;
              });
            });
          }
          
          currentY += 8;
        }
      });

      currentY += 5;
    });

    return currentY;
  }

  /**
   * 添加优化建议
   */
  addRecommendations(doc, data, startY) {
    let currentY = this.addSectionHeader(doc, '优化建议', startY);
    
    if (!data.results) {
      return currentY + 10;
    }

    const results = data.results;
    const regions = Object.keys(results);
    
    // 收集所有建议
    const allRecommendations = [];
    regions.forEach(region => {
      const regionResult = results[region];
      if (regionResult.recommendations) {
        regionResult.recommendations.forEach(rec => {
          allRecommendations.push({
            region,
            ...rec
          });
        });
      }
    });

    // 按优先级排序
    allRecommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });

    if (allRecommendations.length === 0) {
      doc.text('暂无优化建议', 20, currentY);
      return currentY + 10;
    }

    allRecommendations.forEach((rec, index) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // 建议标题
      const priorityText = rec.priority === 'high' ? '高' : rec.priority === 'medium' ? '中' : '低';
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${rec.region} - ${rec.issue} [优先级: ${priorityText}]`, 20, currentY);
      currentY += 8;

      // 建议内容
      doc.setFont('helvetica', 'normal');
      const suggestionLines = doc.splitTextToSize(rec.suggestion, 170);
      suggestionLines.forEach(line => {
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(line, 25, currentY);
        currentY += 6;
      });
      
      currentY += 10;
    });

    return currentY;
  }

  /**
   * 添加图表（简化实现）
   */
  addCharts(doc, data, startY) {
    let currentY = this.addSectionHeader(doc, '数据图表', startY);
    
    // 这里可以集成图表生成库，如Chart.js
    doc.text('图表功能需要集成专用图表库', 20, currentY);
    doc.text('可显示：评分趋势、地区对比、问题分布等', 20, currentY + 10);
    
    return currentY + 30;
  }

  /**
   * 添加页脚
   */
  addFooter(doc, currentY) {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`第 ${i} 页，共 ${pageCount} 页`, 
        doc.internal.pageSize.getWidth() - 20, 
        doc.internal.pageSize.getHeight() - 10, 
        { align: 'right' }
      );
      doc.text('跨境电商内容分析报告 - 由Chrome插件生成', 
        20, 
        doc.internal.pageSize.getHeight() - 10
      );
    }
    
    return currentY;
  }

  /**
   * 添加节标题
   */
  addSectionHeader(doc, title, y) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, y);
    
    // 添加下划线
    doc.setLineWidth(0.5);
    doc.line(20, y + 2, 190, y + 2);
    
    return y + 15;
  }

  /**
   * 导出PDF文件
   */
  async exportToPDF(analysisData, filename = null, options = {}) {
    const doc = await this.generatePDF(analysisData, options);
    
    if (!filename) {
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
      filename = `跨境电商分析报告_${timestamp}.pdf`;
    }
    
    // 保存文件
    doc.save(filename);
    
    return {
      success: true,
      filename,
      size: doc.output('datauristring').length
    };
  }

  /**
   * 获取PDF数据（不下载）
   */
  async getPDFData(analysisData, options = {}) {
    const doc = await this.generatePDF(analysisData, options);
    return {
      blob: doc.output('blob'),
      dataUri: doc.output('datauristring'),
      arrayBuffer: doc.output('arraybuffer')
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PDFReportGenerator;
} else {
  window.PDFReportGenerator = PDFReportGenerator;
}