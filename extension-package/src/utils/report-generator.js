// 报告生成服务
class ReportGenerator {
  constructor() {
    this.templates = {
      html: this.getHTMLTemplate(),
      pdf: this.getPDFTemplate()
    };
    this.pdfGenerator = null;
  }

  // 生成完整分析报告
  async generateReport(analysisData, format = 'html', options = {}) {
    const reportData = this.prepareReportData(analysisData, options);
    
    switch (format) {
      case 'html':
        return this.generateHTMLReport(reportData);
      case 'pdf':
        return await this.generatePDFReport(reportData, options);
      case 'json':
        return this.generateJSONReport(reportData);
      case 'csv':
        return this.generateCSVReport(reportData);
      default:
        throw new Error(`不支持的报告格式: ${format}`);
    }
  }

  // 准备报告数据
  prepareReportData(analysisData, options) {
    const reportData = {
      meta: {
        title: '跨境电商地域适配分析报告',
        url: analysisData.url,
        timestamp: new Date().toLocaleString('zh-CN'),
        generatedBy: '地域适配分析器 v1.0.0',
        analysisId: Date.now().toString(),
        options: options
      },
      summary: this.generateSummary(analysisData),
      regions: [],
      insights: this.generateInsights(analysisData),
      recommendations: this.generateRecommendations(analysisData)
    };

    // 处理每个地区的结果
    Object.keys(analysisData.results).forEach(regionCode => {
      const regionResult = analysisData.results[regionCode];
      const regionData = this.processRegionResult(regionCode, regionResult);
      reportData.regions.push(regionData);
    });

    return reportData;
  }

  // 生成总体摘要
  generateSummary(analysisData) {
    const regions = Object.keys(analysisData.results);
    const scores = regions.map(region => analysisData.results[region].overallScore);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    const allIssues = [];
    regions.forEach(region => {
      const result = analysisData.results[region];
      allIssues.push(...result.language.issues);
      allIssues.push(...result.culture.issues);
      allIssues.push(...result.compliance.issues);
      allIssues.push(...result.userExperience.issues);
    });

    return {
      overallScore: avgScore,
      totalRegions: regions.length,
      totalIssues: allIssues.length,
      highPriorityIssues: this.countHighPriorityIssues(analysisData),
      bestRegion: this.findBestRegion(analysisData),
      worstRegion: this.findWorstRegion(analysisData)
    };
  }

  // 处理单个地区结果
  processRegionResult(regionCode, regionResult) {
    return {
      code: regionCode,
      name: regionResult.region?.name || regionCode,
      overallScore: regionResult.overallScore,
      categories: {
        language: {
          score: regionResult.language.score,
          issues: regionResult.language.issues || [],
          suggestions: regionResult.aiSuggestions?.language || []
        },
        culture: {
          score: regionResult.culture.score,
          issues: regionResult.culture.issues || [],
          suggestions: regionResult.aiSuggestions?.culture || []
        },
        compliance: {
          score: regionResult.compliance.score,
          issues: regionResult.compliance.issues || [],
          suggestions: regionResult.aiSuggestions?.compliance || []
        },
        userExperience: {
          score: regionResult.userExperience.score,
          issues: regionResult.userExperience.issues || [],
          suggestions: regionResult.aiSuggestions?.userExperience || []
        }
      },
      aiEnhanced: regionResult.aiEnhanced || false
    };
  }

  // 生成HTML报告
  generateHTMLReport(reportData) {
    const template = this.templates.html;
    
    let html = template
      .replace(/\{\{title\}\}/g, reportData.meta.title)
      .replace(/\{\{timestamp\}\}/g, reportData.meta.timestamp)
      .replace(/\{\{url\}\}/g, reportData.meta.url)
      .replace(/\{\{overallScore\}\}/g, reportData.summary.overallScore)
      .replace(/\{\{totalRegions\}\}/g, reportData.summary.totalRegions)
      .replace(/\{\{totalIssues\}\}/g, reportData.summary.totalIssues);

    // 生成地区详细信息
    const regionsHTML = reportData.regions.map(region => this.generateRegionHTML(region)).join('');
    html = html.replace('{{regions}}', regionsHTML);

    // 生成洞察信息
    const insightsHTML = this.generateInsightsHTML(reportData.insights);
    html = html.replace('{{insights}}', insightsHTML);

    // 生成建议信息
    const recommendationsHTML = this.generateRecommendationsHTML(reportData.recommendations);
    html = html.replace('{{recommendations}}', recommendationsHTML);

    return html;
  }

  // 生成地区HTML
  generateRegionHTML(region) {
    const categoryHTML = Object.keys(region.categories).map(categoryKey => {
      const category = region.categories[categoryKey];
      const categoryName = this.getCategoryName(categoryKey);
      
      return `
        <div class="category">
          <div class="category-header">
            <h4>${categoryName}</h4>
            <div class="score ${this.getScoreClass(category.score)}">${category.score}</div>
          </div>
          <div class="category-content">
            ${category.issues.length > 0 ? `
              <div class="issues">
                <h5>发现的问题：</h5>
                <ul>
                  ${category.issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
              </div>
            ` : '<p class="no-issues">✅ 未发现明显问题</p>'}
            
            ${category.suggestions.length > 0 ? `
              <div class="suggestions">
                <h5>AI建议：</h5>
                <ul>
                  ${category.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="region-section">
        <div class="region-header">
          <h3>${region.name} (${region.code})</h3>
          <div class="overall-score ${this.getScoreClass(region.overallScore)}">
            ${region.overallScore}
            ${region.aiEnhanced ? '<span class="ai-badge">AI增强</span>' : ''}
          </div>
        </div>
        <div class="categories">
          ${categoryHTML}
        </div>
      </div>
    `;
  }

  // 生成PDF报告
  async generatePDFReport(reportData, options = {}) {
    if (!this.pdfGenerator) {
      this.pdfGenerator = new PDFReportGenerator();
    }

    try {
      const pdfData = await this.pdfGenerator.getPDFData(reportData, {
        title: reportData.meta.title,
        includeCharts: options.includeCharts || false,
        language: options.language || 'zh-CN'
      });

      return {
        format: 'pdf',
        data: pdfData.dataUri,
        blob: pdfData.blob,
        filename: `${reportData.meta.title}_${Date.now()}.pdf`,
        size: pdfData.blob.size
      };
    } catch (error) {
      console.error('PDF generation failed:', error);
      // 回退到简化的文本格式
      const pdfContent = {
        title: reportData.meta.title,
        error: 'PDF生成失败，返回文本格式数据',
        content: this.generateTextReport(reportData),
        timestamp: reportData.meta.timestamp
      };

      return {
        format: 'json',
        data: JSON.stringify(pdfContent, null, 2),
        filename: `${reportData.meta.title}_${Date.now()}.json`,
        error: error.message
      };
    }
  }

  // 生成JSON报告
  generateJSONReport(reportData) {
    return JSON.stringify(reportData, null, 2);
  }

  // 生成CSV报告
  generateCSVReport(reportData) {
    const csvData = [];
    csvData.push(['地区', '总分', '语言适配', '文化适配', '合规性', '用户体验', '主要问题']);
    
    reportData.regions.forEach(region => {
      const mainIssues = Object.values(region.categories)
        .map(cat => cat.issues.slice(0, 2))
        .flat()
        .join('; ')
        .substring(0, 100);
        
      csvData.push([
        region.name,
        region.overallScore,
        region.categories.language.score,
        region.categories.culture.score,
        region.categories.compliance.score,
        region.categories.userExperience.score,
        mainIssues
      ]);
    });

    return csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\\n');
  }

  // HTML模板
  getHTMLTemplate() {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f8f9fa;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    .header {
      text-align: center;
      border-bottom: 2px solid #667eea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #667eea;
      margin-bottom: 10px;
    }
    
    .meta-info {
      color: #666;
      font-size: 14px;
    }
    
    .summary-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 15px;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-number {
      font-size: 2em;
      font-weight: bold;
      display: block;
    }
    
    .summary-label {
      font-size: 0.9em;
      opacity: 0.9;
    }
    
    .region-section {
      margin-bottom: 40px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }
    
    .region-header {
      background: #f8f9fa;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .overall-score {
      font-size: 2em;
      font-weight: bold;
      padding: 10px 20px;
      border-radius: 25px;
      position: relative;
    }
    
    .overall-score.excellent { background: #10b981; color: white; }
    .overall-score.good { background: #3b82f6; color: white; }
    .overall-score.fair { background: #f59e0b; color: white; }
    .overall-score.poor { background: #ef4444; color: white; }
    
    .ai-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #8b5cf6;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
    }
    
    .categories {
      padding: 20px;
    }
    
    .category {
      margin-bottom: 25px;
      border-left: 4px solid #667eea;
      padding-left: 15px;
    }
    
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .category-header h4 {
      color: #374151;
    }
    
    .score {
      font-weight: bold;
      padding: 5px 10px;
      border-radius: 15px;
      font-size: 14px;
    }
    
    .score.excellent { background: #d1fae5; color: #065f46; }
    .score.good { background: #dbeafe; color: #1e40af; }
    .score.fair { background: #fef3c7; color: #92400e; }
    .score.poor { background: #fee2e2; color: #b91c1c; }
    
    .issues, .suggestions {
      margin-top: 10px;
    }
    
    .issues h5, .suggestions h5 {
      color: #374151;
      margin-bottom: 8px;
    }
    
    .issues ul, .suggestions ul {
      margin-left: 20px;
    }
    
    .issues li {
      color: #dc2626;
      margin-bottom: 5px;
    }
    
    .suggestions li {
      color: #059669;
      margin-bottom: 5px;
    }
    
    .no-issues {
      color: #059669;
      font-weight: 500;
    }
    
    .insights-section, .recommendations-section {
      margin-top: 40px;
      padding: 25px;
      background: #f8f9fa;
      border-radius: 10px;
    }
    
    .insights-section h2, .recommendations-section h2 {
      color: #667eea;
      margin-bottom: 20px;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #666;
      font-size: 14px;
    }
    
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
      .region-section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{title}}</h1>
      <div class="meta-info">
        <p>分析网址：{{url}}</p>
        <p>生成时间：{{timestamp}}</p>
      </div>
    </div>
    
    <div class="summary-section">
      <h2>分析摘要</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-number">{{overallScore}}</span>
          <span class="summary-label">总体评分</span>
        </div>
        <div class="summary-item">
          <span class="summary-number">{{totalRegions}}</span>
          <span class="summary-label">分析地区</span>
        </div>
        <div class="summary-item">
          <span class="summary-number">{{totalIssues}}</span>
          <span class="summary-label">发现问题</span>
        </div>
      </div>
    </div>
    
    <div class="regions-section">
      {{regions}}
    </div>
    
    <div class="insights-section">
      <h2>分析洞察</h2>
      {{insights}}
    </div>
    
    <div class="recommendations-section">
      <h2>优化建议</h2>
      {{recommendations}}
    </div>
    
    <div class="footer">
      <p>本报告由地域适配分析器自动生成</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // PDF模板 (与HTML模板相同，PDF生成时会进行格式转换)
  getPDFTemplate() {
    return this.getHTMLTemplate(); // 复用HTML模板
  }

  // 辅助方法
  getCategoryName(categoryKey) {
    const names = {
      'language': '语言适配',
      'culture': '文化适配',
      'compliance': '合规性',
      'userExperience': '用户体验'
    };
    return names[categoryKey] || categoryKey;
  }

  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  countHighPriorityIssues(analysisData) {
    let count = 0;
    Object.values(analysisData.results).forEach(result => {
      if (result.compliance.score < 70) count += result.compliance.issues.length;
      if (result.language.score < 60) count += result.language.issues.length;
    });
    return count;
  }

  findBestRegion(analysisData) {
    let bestScore = 0;
    let bestRegion = null;
    
    Object.keys(analysisData.results).forEach(region => {
      const score = analysisData.results[region].overallScore;
      if (score > bestScore) {
        bestScore = score;
        bestRegion = region;
      }
    });
    
    return bestRegion;
  }

  findWorstRegion(analysisData) {
    let worstScore = 100;
    let worstRegion = null;
    
    Object.keys(analysisData.results).forEach(region => {
      const score = analysisData.results[region].overallScore;
      if (score < worstScore) {
        worstScore = score;
        worstRegion = region;
      }
    });
    
    return worstRegion;
  }

  generateInsights(analysisData) {
    const insights = [];
    
    // 语言分析洞察
    const languageScores = Object.values(analysisData.results).map(r => r.language.score);
    const avgLanguageScore = languageScores.reduce((a, b) => a + b, 0) / languageScores.length;
    
    if (avgLanguageScore < 70) {
      insights.push('语言适配是当前的主要挑战，建议优先进行本地化改进');
    }
    
    // 合规性洞察
    const complianceIssues = Object.values(analysisData.results)
      .map(r => r.compliance.issues.length)
      .reduce((a, b) => a + b, 0);
      
    if (complianceIssues > 0) {
      insights.push('存在合规性风险，建议尽快咨询法律专业人士');
    }
    
    return insights;
  }

  generateRecommendations(analysisData) {
    const recommendations = [];
    
    // 基于分析结果生成推荐
    Object.keys(analysisData.results).forEach(region => {
      const result = analysisData.results[region];
      
      if (result.overallScore < 70) {
        recommendations.push(`${result.region?.name || region}: 需要全面优化，重点关注得分较低的维度`);
      }
    });
    
    return recommendations;
  }

  generateInsightsHTML(insights) {
    if (insights.length === 0) {
      return '<p>暂无特别洞察</p>';
    }
    
    return `<ul>${insights.map(insight => `<li>${insight}</li>`).join('')}</ul>`;
  }

  generateRecommendationsHTML(recommendations) {
    if (recommendations.length === 0) {
      return '<p>当前表现良好，继续保持！</p>';
    }
    
    return `<ul>${recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>`;
  }

  generateTextReport(reportData) {
    // 生成纯文本格式报告
    let text = `${reportData.meta.title}\\n`;
    text += `生成时间: ${reportData.meta.timestamp}\\n`;
    text += `分析网址: ${reportData.meta.url}\\n\\n`;
    
    text += `总体评分: ${reportData.summary.overallScore}\\n`;
    text += `分析地区: ${reportData.summary.totalRegions}\\n`;
    text += `发现问题: ${reportData.summary.totalIssues}\\n\\n`;
    
    reportData.regions.forEach(region => {
      text += `\\n=== ${region.name} (${region.code}) ===\\n`;
      text += `总分: ${region.overallScore}\\n`;
      
      Object.keys(region.categories).forEach(categoryKey => {
        const category = region.categories[categoryKey];
        const categoryName = this.getCategoryName(categoryKey);
        text += `${categoryName}: ${category.score}分\\n`;
        
        if (category.issues.length > 0) {
          text += `问题: ${category.issues.join(', ')}\\n`;
        }
      });
    });
    
    return text;
  }
}

// 导出报告生成器
window.ReportGenerator = ReportGenerator;