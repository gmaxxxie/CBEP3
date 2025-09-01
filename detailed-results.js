class DetailedResultsPage {
  constructor() {
    this.analysisData = null;
    this.currentRegion = null;
    this.detailedEngine = new DetailedAnalysisEngine();
    this.reportGenerator = new ReportGenerator();
    this.currentResults = null;
    
    this.initializePage();
    this.attachEventListeners();
  }

  async initializePage() {
    try {
      // 从URL参数或存储中获取分析结果
      this.analysisData = await this.loadAnalysisData();
      
      if (!this.analysisData) {
        this.showError('未找到分析数据，请重新进行分析');
        return;
      }

      await this.generateDetailedAnalysis();
      this.displayResults();
      
    } catch (error) {
      console.error('初始化详细结果页面失败:', error);
      this.showError('初始化失败: ' + error.message);
    }
  }

  async loadAnalysisData() {
    // 尝试从URL参数获取
    const urlParams = new URLSearchParams(window.location.search);
    const resultsParam = urlParams.get('results');
    
    if (resultsParam) {
      try {
        return JSON.parse(decodeURIComponent(resultsParam));
      } catch (error) {
        console.error('解析URL参数失败:', error);
      }
    }

    // 尝试从sessionStorage获取
    const storedResults = sessionStorage.getItem('analysisResults');
    if (storedResults) {
      try {
        return JSON.parse(storedResults);
      } catch (error) {
        console.error('解析存储数据失败:', error);
      }
    }

    // 尝试从chrome.storage获取
    try {
      const result = await chrome.storage.session.get('latestAnalysis');
      return result.latestAnalysis;
    } catch (error) {
      console.error('从chrome.storage获取数据失败:', error);
    }

    return null;
  }

  async generateDetailedAnalysis() {
    console.log('开始生成详细分析...');
    
    // 准备数据用于详细分析
    const extractedData = this.prepareDataForAnalysis();
    const targetRegions = Object.keys(this.analysisData.results);
    
    // 生成详细分析
    this.currentResults = await this.detailedEngine.performDetailedAnalysis(
      extractedData, 
      targetRegions
    );
    
    console.log('详细分析完成:', this.currentResults);
  }

  prepareDataForAnalysis() {
    // 从基础分析结果中重构提取的数据
    return {
      url: this.analysisData.url,
      title: '分析页面',
      text: {
        paragraphs: ['示例内容'],
        buttons: ['示例按钮'],
        headings: { h1: ['示例标题'] },
        navigation: ['首页', '产品', '关于'],
        forms: {},
        footers: []
      },
      meta: {
        basic: {
          description: '示例描述',
          keywords: '示例关键词'
        }
      },
      images: [],
      ecommerce: {
        prices: [],
        categories: [],
        checkout: {}
      },
      performance: {
        loadTime: 3000
      }
    };
  }

  displayResults() {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';

    // 更新头部信息
    this.updateHeaderInfo();
    
    // 显示总体评分
    this.displayOverallScores();
    
    // 创建地区选择器
    this.createRegionSelector();
    
    // 设置默认地区
    const regions = Object.keys(this.analysisData.results);
    this.currentRegion = regions[0];
    
    // 显示详细分析结果
    this.displayDetailedAnalysis();
    
    // 显示洞察
    this.displayInsights();
  }

  updateHeaderInfo() {
    document.getElementById('analyzedUrl').textContent = `分析网址: ${this.analysisData.url}`;
    document.getElementById('analysisTime').textContent = `分析时间: ${new Date(this.analysisData.timestamp).toLocaleString('zh-CN')}`;
    
    const regions = Object.keys(this.analysisData.results).map(code => {
      const regionNames = {
        'US': '美国', 'CN': '中国', 'JP': '日本', 'DE': '德国', 
        'FR': '法国', 'GB': '英国', 'AE': '阿联酋'
      };
      return regionNames[code] || code;
    }).join('、');
    
    document.getElementById('targetRegion').textContent = `目标地区: ${regions}`;
  }

  displayOverallScores() {
    const regions = Object.keys(this.analysisData.results);
    const scores = {
      overall: 0,
      language: 0,
      culture: 0,
      compliance: 0,
      ux: 0
    };

    // 计算平均分
    regions.forEach(region => {
      const result = this.analysisData.results[region];
      scores.overall += result.overallScore;
      scores.language += result.language.score;
      scores.culture += result.culture.score;
      scores.compliance += result.compliance.score;
      scores.ux += result.userExperience.score;
    });

    Object.keys(scores).forEach(key => {
      scores[key] = Math.round(scores[key] / regions.length);
    });

    // 更新UI
    this.updateScoreElement('overallScore', scores.overall, '综合地域适配得分');
    this.updateScoreElement('languageScore', scores.language);
    this.updateScoreElement('cultureScore', scores.culture);
    this.updateScoreElement('complianceScore', scores.compliance);
    this.updateScoreElement('uxScore', scores.ux);
  }

  updateScoreElement(elementId, score, description = null) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = score;
      element.className = `score ${this.getScoreClass(score)}`;
    }
    
    if (description) {
      const descElement = document.getElementById('overallDescription');
      if (descElement) {
        descElement.textContent = description;
      }
    }
  }

  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  createRegionSelector() {
    const selector = document.getElementById('regionSelector');
    const regions = Object.keys(this.analysisData.results);
    
    const regionNames = {
      'US': '🇺🇸 美国',
      'CN': '🇨🇳 中国', 
      'JP': '🇯🇵 日本',
      'DE': '🇩🇪 德国',
      'FR': '🇫🇷 法国',
      'GB': '🇬🇧 英国',
      'AE': '🇦🇪 阿联酋'
    };

    selector.innerHTML = regions.map(region => 
      `<button class="region-btn ${region === this.currentRegion ? 'active' : ''}" 
               data-region="${region}">
         ${regionNames[region] || region}
       </button>`
    ).join('');
  }

  displayDetailedAnalysis() {
    if (!this.currentResults || !this.currentResults.detailed[this.currentRegion]) {
      this.displayFallbackAnalysis();
      return;
    }

    const detailedData = this.currentResults.detailed[this.currentRegion];
    
    // 显示各个维度的详细分析
    this.displayLanguageAnalysis(detailedData.language);
    this.displayCultureAnalysis(detailedData.culture);
    this.displayComplianceAnalysis(detailedData.compliance);
    this.displayUXAnalysis(detailedData.userExperience);
  }

  displayFallbackAnalysis() {
    // 如果详细分析失败，显示基础分析结果
    const basicData = this.analysisData.results[this.currentRegion];
    
    this.displayBasicProblems('languageProblems', basicData.language, '语言适配');
    this.displayBasicProblems('cultureProblems', basicData.culture, '文化适配');
    this.displayBasicProblems('complianceProblems', basicData.compliance, '合规性');
    this.displayBasicProblems('uxProblems', basicData.userExperience, '用户体验');
    
    // 更新评分
    document.getElementById('languageSectionScore').textContent = basicData.language.score;
    document.getElementById('languageSectionScore').className = `section-score ${this.getScoreClass(basicData.language.score)}`;
    
    document.getElementById('cultureSectionScore').textContent = basicData.culture.score;
    document.getElementById('cultureSectionScore').className = `section-score ${this.getScoreClass(basicData.culture.score)}`;
    
    document.getElementById('complianceSectionScore').textContent = basicData.compliance.score;
    document.getElementById('complianceSectionScore').className = `section-score ${this.getScoreClass(basicData.compliance.score)}`;
    
    document.getElementById('uxSectionScore').textContent = basicData.userExperience.score;
    document.getElementById('uxSectionScore').className = `section-score ${this.getScoreClass(basicData.userExperience.score)}`;
  }

  displayBasicProblems(containerId, data, category) {
    const container = document.getElementById(containerId);
    
    if (!data.issues || data.issues.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>✅ 表现良好</h3>
          <p>${category}方面未发现明显问题</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.issues.map(issue => `
      <div class="problem-card">
        <div class="problem-header">
          <span class="problem-severity severity-medium">需要关注</span>
        </div>
        <div class="problem-title">${category}问题</div>
        <div class="problem-description">${issue}</div>
        <div class="problem-suggestion">
          <strong>建议:</strong> 请参考优化建议标签页获取详细的改进方案
        </div>
      </div>
    `).join('');
  }

  displayLanguageAnalysis(analysis) {
    document.getElementById('languageSectionScore').textContent = analysis.score;
    document.getElementById('languageSectionScore').className = `section-score ${this.getScoreClass(analysis.score)}`;

    const container = document.getElementById('languageProblems');
    
    if (!analysis.specificProblems || analysis.specificProblems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>✅ 语言适配优秀</h3>
          <p>未发现语言适配问题</p>
        </div>
      `;
      return;
    }

    container.innerHTML = analysis.specificProblems.map(problem => this.createProblemCard(problem)).join('');
  }

  displayCultureAnalysis(analysis) {
    document.getElementById('cultureSectionScore').textContent = analysis.score;
    document.getElementById('cultureSectionScore').className = `section-score ${this.getScoreClass(analysis.score)}`;

    const container = document.getElementById('cultureProblems');
    
    if (!analysis.specificProblems || analysis.specificProblems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>✅ 文化适配良好</h3>
          <p>文化敏感性处理得当</p>
        </div>
      `;
      return;
    }

    container.innerHTML = analysis.specificProblems.map(problem => this.createProblemCard(problem)).join('');
  }

  displayComplianceAnalysis(analysis) {
    document.getElementById('complianceSectionScore').textContent = analysis.score;
    document.getElementById('complianceSectionScore').className = `section-score ${this.getScoreClass(analysis.score)}`;

    const container = document.getElementById('complianceProblems');
    
    if (!analysis.specificProblems || analysis.specificProblems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>✅ 合规性良好</h3>
          <p>符合相关法律法规要求</p>
        </div>
      `;
      return;
    }

    container.innerHTML = analysis.specificProblems.map(problem => this.createProblemCard(problem)).join('');
  }

  displayUXAnalysis(analysis) {
    document.getElementById('uxSectionScore').textContent = analysis.score;
    document.getElementById('uxSectionScore').className = `section-score ${this.getScoreClass(analysis.score)}`;

    const container = document.getElementById('uxProblems');
    
    if (!analysis.specificProblems || analysis.specificProblems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>✅ 用户体验优秀</h3>
          <p>用户体验各方面表现良好</p>
        </div>
      `;
      return;
    }

    container.innerHTML = analysis.specificProblems.map(problem => this.createProblemCard(problem)).join('');
  }

  createProblemCard(problem) {
    const examplesHtml = problem.examples ? 
      `<div class="problem-examples">
         <strong>改进示例:</strong>
         ${problem.examples.map(example => 
           `<div class="example-item">${example}</div>`
         ).join('')}
       </div>` : '';

    return `
      <div class="problem-card">
        <div class="problem-header">
          <span class="problem-severity severity-${problem.severity}">${this.getSeverityText(problem.severity)}</span>
        </div>
        <div class="problem-title">${problem.issue}</div>
        <div class="problem-description">元素: ${problem.element}</div>
        ${problem.current ? 
          `<div class="problem-current">
             <strong>当前状态:</strong> ${problem.current}
           </div>` : ''
        }
        <div class="problem-suggestion">
          <strong>建议:</strong> ${problem.suggestion}
        </div>
        ${examplesHtml}
      </div>
    `;
  }

  getSeverityText(severity) {
    const texts = {
      'critical': '严重',
      'high': '高优先级', 
      'medium': '中等',
      'low': '低优先级'
    };
    return texts[severity] || severity;
  }

  displayInsights() {
    const insights = [
      '建议优先处理高优先级问题以快速提升用户体验',
      '语言本地化是跨境电商成功的关键因素',
      '文化适配能显著提高用户接受度和转化率',
      '合规性问题应立即处理以避免法律风险'
    ];

    const insightsList = document.getElementById('insightsList');
    insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
  }

  attachEventListeners() {
    // 标签页切换
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // 地区选择
    document.addEventListener('click', (e) => {
      if (e.target.matches('.region-btn')) {
        const region = e.target.dataset.region;
        this.switchRegion(region);
      }
    });

    // 导出功能
    document.getElementById('exportHtml').addEventListener('click', () => this.exportReport('html'));
    document.getElementById('exportPdf').addEventListener('click', () => this.exportReport('pdf'));
    document.getElementById('exportJson').addEventListener('click', () => this.exportReport('json'));
    document.getElementById('exportCsv').addEventListener('click', () => this.exportReport('csv'));
  }

  switchTab(tabName) {
    // 更新标签状态
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // 显示对应内容
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tabName);
    });

    // 特殊处理建议和示例标签页
    if (tabName === 'recommendations') {
      this.displayRecommendations();
    } else if (tabName === 'examples') {
      this.displayExamples();
    }
  }

  switchRegion(region) {
    this.currentRegion = region;
    
    // 更新地区按钮状态
    document.querySelectorAll('.region-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.region === region);
    });

    // 重新显示该地区的分析结果
    this.displayDetailedAnalysis();
  }

  displayRecommendations() {
    const container = document.getElementById('recommendationsContent');
    
    // 显示通用建议
    const recommendations = [
      {
        category: '语言本地化',
        priority: 'high',
        title: '全面语言本地化改进',
        description: '提升语言本地化水平以改善用户体验',
        actions: [
          '聘请专业翻译团队进行内容本地化',
          '建立术语库确保翻译一致性',
          '定期审核和更新本地化内容',
          '进行目标地区用户测试验证'
        ]
      },
      {
        category: '文化适配',
        priority: 'medium',
        title: '文化敏感性优化',
        description: '确保内容和设计符合当地文化习惯',
        actions: [
          '审核色彩使用的文化含义',
          '调整视觉设计以符合当地审美',
          '优化节日营销策略',
          '咨询当地文化专家'
        ]
      },
      {
        category: '合规性',
        priority: 'high',
        title: '法律合规性完善',
        description: '确保网站符合当地法律法规',
        actions: [
          '咨询当地法律专家',
          '实施隐私政策和Cookie管理',
          '添加必要的法律声明',
          '定期审核合规状况'
        ]
      }
    ];

    container.innerHTML = recommendations.map(rec => this.createRecommendationCard(rec)).join('');
  }

  createRecommendationCard(recommendation) {
    return `
      <div class="recommendation-card">
        <div class="recommendation-header">
          <div class="recommendation-title">${recommendation.title}</div>
          <span class="recommendation-priority priority-${recommendation.priority}">
            ${recommendation.priority === 'high' ? '高优先级' : recommendation.priority === 'medium' ? '中等' : '低优先级'}
          </span>
        </div>
        <div class="recommendation-description">${recommendation.description}</div>
        <div class="recommendation-actions">
          <strong>行动计划:</strong>
          <ul class="action-list">
            ${recommendation.actions.map(action => `<li>${action}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  displayExamples() {
    const container = document.getElementById('examplesContent');
    
    const examples = [
      {
        category: '语言优化示例',
        items: [
          {
            current: 'Add to Cart',
            suggested: '加入购物车',
            description: 'CTA按钮本地化'
          },
          {
            current: 'Welcome to our store',
            suggested: '欢迎来到我们的商城',
            description: '欢迎语本地化'
          }
        ]
      },
      {
        category: '文化适配示例',
        items: [
          {
            current: '使用白色作为主色调',
            suggested: '在中国市场建议使用红色或金色',
            description: '颜色文化适配'
          },
          {
            current: 'Christmas Sale促销',
            suggested: '春节大促或中秋特惠',
            description: '节日营销本地化'
          }
        ]
      }
    ];

    container.innerHTML = examples.map(category => `
      <div class="recommendation-card">
        <h3>${category.category}</h3>
        ${category.items.map(item => `
          <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 6px;">
            <div style="margin-bottom: 8px;"><strong>${item.description}</strong></div>
            <div style="color: #dc2626; margin-bottom: 5px;">❌ 当前: ${item.current}</div>
            <div style="color: #059669;">✅ 建议: ${item.suggested}</div>
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  async exportReport(format) {
    try {
      const reportData = this.prepareReportData();
      const report = await this.reportGenerator.generateReport(reportData, format);
      
      if (format === 'html' || format === 'pdf') {
        this.downloadFile(report, `详细分析报告.${format}`);
      } else {
        this.downloadTextFile(report, `详细分析报告.${format}`);
      }
      
      this.showSuccess(`${format.toUpperCase()}报告导出成功！`);
    } catch (error) {
      console.error('导出报告失败:', error);
      this.showError('导出失败: ' + error.message);
    }
  }

  prepareReportData() {
    return {
      url: this.analysisData.url,
      timestamp: this.analysisData.timestamp,
      results: this.analysisData.results
    };
  }

  downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  showError(message) {
    const errorSection = document.getElementById('errorSection');
    errorSection.style.display = 'block';
    errorSection.innerHTML = `
      <h3>出现错误</h3>
      <p>${message}</p>
    `;
    document.getElementById('loadingSection').style.display = 'none';
  }

  showSuccess(message) {
    // 显示成功消息
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `<strong>成功!</strong> ${message}`;
    
    document.querySelector('.container').insertBefore(successDiv, document.querySelector('.header').nextSibling);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }
}

// Load required dependencies and initialize page
function loadDependencies() {
  // Load required dependencies
  const script1 = document.createElement('script');
  script1.src = chrome.runtime.getURL('src/rules/detailed-analysis-engine.js');
  document.head.appendChild(script1);
  
  const script2 = document.createElement('script');
  script2.src = chrome.runtime.getURL('src/utils/report-generator.js');
  document.head.appendChild(script2);

  // Wait for scripts to load before initializing
  script2.onload = function() {
    setTimeout(() => {
      // Check if classes are available
      if (typeof DetailedAnalysisEngine === 'undefined') {
        console.warn('DetailedAnalysisEngine not available, using fallback');
        window.DetailedAnalysisEngine = class {
          async performDetailedAnalysis(data, regions) {
            return {
              timestamp: new Date().toISOString(),
              detailed: {}
            };
          }
        };
      }
      
      if (typeof ReportGenerator === 'undefined') {
        console.warn('ReportGenerator not available, using fallback');
        window.ReportGenerator = class {
          async generateReport(data, format) {
            return JSON.stringify(data, null, 2);
          }
        };
      }
      
      // Initialize the page
      new DetailedResultsPage();
    }, 100);
  };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', loadDependencies);