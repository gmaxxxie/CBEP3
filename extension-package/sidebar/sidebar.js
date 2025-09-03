// 侧栏控制器
class SidebarController {
  constructor() {
    try {
      console.log('SidebarController 初始化开始...');
      
      this.selectedRegions = new Set(['US']);
      this.analysisOptions = {
        enableLocal: true,
        enableAI: true,
        enablePerformance: false
      };
      this.currentResults = null;
      this.isAnalyzing = false;
      this.currentTab = 'analyzer';
      
      // 延迟加载缓存和报告生成器
      this.cache = null;
      this.reportGenerator = null;
      
      this.initializeElements();
      this.attachEventListeners();
      this.loadSettings();
      this.updateUI();
      this.loadCurrentPageInfo();
      this.loadAnalysisHistory();
      
      console.log('SidebarController 初始化完成');
    } catch (error) {
      console.error('SidebarController 初始化失败:', error);
      this.handleInitError(error);
    }
  }

  async initializeCacheIfNeeded() {
    if (!this.cache && typeof AnalysisCache !== 'undefined') {
      this.cache = new AnalysisCache();
      console.log('AnalysisCache 延迟加载成功');
    }
    return this.cache;
  }

  async initializeReportGeneratorIfNeeded() {
    if (!this.reportGenerator && typeof ReportGenerator !== 'undefined') {
      this.reportGenerator = new ReportGenerator();
      console.log('ReportGenerator 延迟加载成功');
    }
    return this.reportGenerator;
  }

  handleInitError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      color: white;
      background: #ef4444;
      padding: 15px;
      margin: 10px;
      border-radius: 4px;
      text-align: center;
      font-weight: bold;
    `;
    errorDiv.innerHTML = `
      <strong>侧栏初始化失败</strong><br>
      ${error.message}<br>
      <small>请检查浏览器控制台获取详细信息</small>
    `;
    
    const container = document.querySelector('.sidebar-container');
    if (container) {
      container.insertBefore(errorDiv, container.firstChild);
    }
  }

  initializeElements() {
    // 导航标签
    this.navTabs = document.querySelectorAll('.nav-tab');
    this.tabContents = document.querySelectorAll('.tab-content');
    
    // 状态元素
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    
    // 当前页面信息
    this.currentUrl = document.getElementById('currentUrl');
    this.currentTitle = document.getElementById('currentTitle');
    this.currentDomain = document.getElementById('currentDomain');
    
    // 地区选择
    this.regionGrid = document.getElementById('regionGrid');
    this.regionItems = document.querySelectorAll('.region-item');
    
    // 分析选项
    this.enableLocalCheckbox = document.getElementById('enableLocal');
    this.enableAICheckbox = document.getElementById('enableAI');
    this.enablePerformanceCheckbox = document.getElementById('enablePerformance');
    
    // 按钮
    this.analyzeBtn = document.getElementById('analyzeBtn');
    this.quickSettingsBtn = document.getElementById('quickSettingsBtn');
    this.clearCacheBtn = document.getElementById('clearCacheBtn');
    this.stopAnalysisBtn = document.getElementById('stopAnalysisBtn');
    this.viewDetailedResultsBtn = document.getElementById('viewDetailedResults');
    this.exportQuickReportBtn = document.getElementById('exportQuickReport');
    
    // 分析进度
    this.analysisProgress = document.getElementById('analysisProgress');
    this.progressFill = document.getElementById('progressFill');
    this.progressPercentage = document.getElementById('progressPercentage');
    this.progressStatus = document.getElementById('progressStatus');
    this.progressSteps = document.querySelectorAll('.step');
    
    // 结果显示
    this.quickResults = document.getElementById('quickResults');
    this.overallScore = document.getElementById('overallScore');
    this.languageScore = document.getElementById('languageScore');
    this.cultureScore = document.getElementById('cultureScore');
    this.complianceScore = document.getElementById('complianceScore');
    this.uxScore = document.getElementById('uxScore');
    this.languageValue = document.getElementById('languageValue');
    this.cultureValue = document.getElementById('cultureValue');
    this.complianceValue = document.getElementById('complianceValue');
    this.uxValue = document.getElementById('uxValue');
    
    // 详细结果
    this.resultsMeta = document.getElementById('resultsMeta');
    this.detailedResultsContainer = document.getElementById('detailedResultsContainer');
    
    // 历史记录
    this.historyList = document.getElementById('historyList');
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    this.exportHistoryBtn = document.getElementById('exportHistoryBtn');
    
    // 设置
    this.autoAnalyzeCheckbox = document.getElementById('autoAnalyze');
    this.detailedReportsCheckbox = document.getElementById('detailedReports');
    this.enableCacheCheckbox = document.getElementById('enableCache');
    this.serverAddressInput = document.getElementById('serverAddress');
    this.aiProviderSelect = document.getElementById('aiProvider');
    this.saveSettingsBtn = document.getElementById('saveSettings');
    this.resetSettingsBtn = document.getElementById('resetSettings');
    this.openFullSettingsBtn = document.getElementById('openFullSettings');
  }

  attachEventListeners() {
    // 导航标签
    this.navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = e.target.dataset.tab;
        this.switchTab(tabId);
      });
    });

    // 地区选择
    this.regionItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const region = e.currentTarget.dataset.region;
        this.toggleRegionSelection(region);
      });
    });

    // 分析选项
    this.enableLocalCheckbox.addEventListener('change', (e) => {
      this.analysisOptions.enableLocal = e.target.checked;
      this.saveSettings();
    });

    this.enableAICheckbox.addEventListener('change', (e) => {
      this.analysisOptions.enableAI = e.target.checked;
      this.saveSettings();
    });

    this.enablePerformanceCheckbox.addEventListener('change', (e) => {
      this.analysisOptions.enablePerformance = e.target.checked;
      this.saveSettings();
    });

    // 主要按钮
    this.analyzeBtn.addEventListener('click', () => {
      this.startAnalysis();
    });

    this.quickSettingsBtn.addEventListener('click', () => {
      this.switchTab('settings');
    });

    this.clearCacheBtn.addEventListener('click', () => {
      this.clearCache();
    });

    this.stopAnalysisBtn.addEventListener('click', () => {
      this.stopAnalysis();
    });

    this.viewDetailedResultsBtn.addEventListener('click', () => {
      this.switchTab('results');
    });

    this.exportQuickReportBtn.addEventListener('click', () => {
      this.exportReport();
    });

    // 历史记录按钮
    this.clearHistoryBtn.addEventListener('click', () => {
      this.clearHistory();
    });

    this.exportHistoryBtn.addEventListener('click', () => {
      this.exportHistory();
    });

    // 设置按钮
    this.saveSettingsBtn.addEventListener('click', () => {
      this.saveSettings();
    });

    this.resetSettingsBtn.addEventListener('click', () => {
      this.resetSettings();
    });

    this.openFullSettingsBtn.addEventListener('click', () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('options/options.html')
      });
    });

    // 设置变更监听
    this.autoAnalyzeCheckbox.addEventListener('change', () => this.saveSettings());
    this.detailedReportsCheckbox.addEventListener('change', () => this.saveSettings());
    this.enableCacheCheckbox.addEventListener('change', () => this.saveSettings());
    this.serverAddressInput.addEventListener('change', () => this.saveSettings());
    this.aiProviderSelect.addEventListener('change', () => this.saveSettings());

    // 监听来自background script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'START_AUTO_ANALYSIS') {
        console.log('收到自动分析请求');
        // 延迟一点时间确保UI已准备好
        setTimeout(() => {
          this.startAnalysis();
        }, 500);
      }
      return true;
    });
  }

  switchTab(tabId) {
    console.log('切换到标签:', tabId);
    
    // 更新导航标签
    this.navTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // 更新标签内容
    this.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });

    this.currentTab = tabId;

    // 标签特定的加载逻辑
    if (tabId === 'results' && this.currentResults) {
      this.displayDetailedResults();
    } else if (tabId === 'history') {
      this.loadAnalysisHistory();
    }
  }

  async loadCurrentPageInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        this.currentUrl.textContent = tab.url;
        this.currentTitle.textContent = tab.title || '未知标题';
        const url = new URL(tab.url);
        this.currentDomain.textContent = url.hostname;
      }
    } catch (error) {
      console.warn('获取当前页面信息失败:', error);
      this.currentUrl.textContent = '无法获取页面信息';
    }
  }

  toggleRegionSelection(region) {
    if (this.selectedRegions.has(region)) {
      this.selectedRegions.delete(region);
    } else {
      this.selectedRegions.add(region);
    }
    this.updateUI();
    this.saveSettings();
  }

  updateUI() {
    // 更新地区选择状态
    this.regionItems.forEach(item => {
      const region = item.dataset.region;
      item.classList.toggle('selected', this.selectedRegions.has(region));
    });

    // 更新分析按钮状态
    this.analyzeBtn.disabled = this.selectedRegions.size === 0 || this.isAnalyzing;
    
    // 更新状态显示
    if (this.isAnalyzing) {
      this.statusDot.className = 'status-dot analyzing';
      this.statusText.textContent = '分析中...';
    } else if (this.currentResults) {
      this.statusDot.className = 'status-dot';
      this.statusText.textContent = '分析完成';
    } else {
      this.statusDot.className = 'status-dot';
      this.statusText.textContent = '准备就绪';
    }
  }

  async startAnalysis() {
    if (this.selectedRegions.size === 0) {
      this.showMessage('请至少选择一个目标地区', 'error');
      return;
    }

    this.isAnalyzing = true;
    this.updateUI();
    this.showAnalysisProgress();
    this.hideQuickResults();

    try {
      // 获取当前活跃标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('无法获取当前页面信息');
      }

      // 获取缓存设置
      const settingsResult = await chrome.storage.sync.get('settings');
      const cacheEnabled = settingsResult.settings?.enableCache !== false;

      // 检查缓存（如果缓存可用）
      const cache = await this.initializeCacheIfNeeded();
      if (cache && cacheEnabled) {
        this.updateProgress(5, '检查缓存中...', 'extract');
        const cachedResult = await cache.getCachedResult(tab.url, Array.from(this.selectedRegions));
        
        if (cachedResult) {
          this.updateProgress(100, '从缓存中加载结果', 'report');
          console.log('使用缓存结果:', cachedResult);
          
          setTimeout(() => {
            this.handleAnalysisComplete(cachedResult);
          }, 800);
          return;
        }
      }

      // 缓存未命中，执行完整分析
      this.updateProgress(10, '正在提取页面内容...', 'extract');

      // 向content script发送消息提取内容
      const response = await chrome.tabs.sendMessage(tab.id, { 
        type: 'EXTRACT_CONTENT' 
      });

      if (!response.success) {
        throw new Error('页面内容提取失败');
      }

      this.updateProgress(30, '正在执行本地规则分析...', 'local');

      // 执行本地分析
      const localResults = await this.performLocalAnalysis(response.data);
      
      this.updateProgress(60, '正在执行AI深度分析...', 'ai');

      // 执行AI分析（如果启用）
      let aiResults = null;
      if (this.analysisOptions.enableAI) {
        aiResults = await this.performAIAnalysis(response.data);
      }

      this.updateProgress(90, '正在生成分析报告...', 'report');

      // 合并结果
      const finalResults = this.mergeResults(localResults, aiResults);

      // 保存到缓存（如果启用且缓存可用）
      if (cache && cacheEnabled) {
        await cache.setCachedResult(tab.url, Array.from(this.selectedRegions), finalResults);
      }

      this.updateProgress(100, '分析完成！', 'report');

      setTimeout(() => {
        this.handleAnalysisComplete(finalResults);
      }, 500);

    } catch (error) {
      console.error('分析过程中出现错误:', error);
      this.handleAnalysisError(error.message);
    }
  }

  async performLocalAnalysis(contentData) {
    try {
      // 检查LocalRuleEngine是否可用
      if (typeof LocalRuleEngine === 'undefined') {
        console.warn('LocalRuleEngine 未定义，使用默认分析结果');
        return this.getDefaultAnalysisResult();
      }

      // 加载本地规则引擎
      const ruleEngine = new LocalRuleEngine();
      
      // 执行分析
      const results = ruleEngine.analyze(contentData, Array.from(this.selectedRegions));
      
      return results;
    } catch (error) {
      console.error('本地分析失败:', error);
      return this.getDefaultAnalysisResult();
    }
  }

  async performAIAnalysis(contentData) {
    try {
      // Get server address from settings
      const result = await chrome.storage.sync.get('settings');
      const serverAddress = result.settings?.serverAddress || 'http://192.168.31.196:3000';
      
      // 准备AI分析数据
      const aiPayload = {
        url: contentData.url,
        title: contentData.title,
        content: {
          headings: contentData.text.headings,
          paragraphs: contentData.text.paragraphs.slice(0, 15),
          buttons: contentData.text.buttons,
          navigation: contentData.text.navigation,
          forms: contentData.text.forms,
          footers: contentData.text.footers
        },
        meta: {
          ...contentData.meta,
          description: contentData.meta.basic?.description || contentData.meta.basic?.['og:description'],
          keywords: contentData.meta.basic?.keywords
        },
        ecommerce: {
          ...contentData.ecommerce,
          prices: contentData.ecommerce.prices || [],
          categories: contentData.ecommerce.categories || [],
          paymentMethods: contentData.ecommerce.checkout?.paymentMethods || [],
          shippingOptions: contentData.ecommerce.checkout?.shippingOptions || [],
          currency: this.detectCurrency(contentData),
          availability: this.detectAvailability(contentData)
        },
        targetRegions: Array.from(this.selectedRegions)
      };

      // 调用后端API进行AI分析
      const response = await fetch(`${serverAddress}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(aiPayload)
      });

      if (!response.ok) {
        throw new Error(`AI分析请求失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('AI分析失败，将仅使用本地分析结果:', error);
      return null;
    }
  }

  getDefaultAnalysisResult() {
    // 返回默认的分析结果结构
    const defaultResult = {};
    Array.from(this.selectedRegions).forEach(region => {
      defaultResult[region] = {
        region: { name: region },
        overallScore: 70,
        language: { score: 70, issues: ['本地分析引擎不可用'] },
        culture: { score: 70, issues: [] },
        compliance: { score: 70, issues: [] },
        userExperience: { score: 70, issues: [] }
      };
    });

    return {
      url: window.location?.href || 'unknown',
      timestamp: Date.now(),
      results: defaultResult
    };
  }

  mergeResults(localResults, aiResults) {
    if (!aiResults) {
      return localResults;
    }

    // 合并本地和AI分析结果（复用popup.js的逻辑）
    const mergedResults = { ...localResults };
    
    Object.keys(mergedResults.results).forEach(region => {
      const localRegionResult = mergedResults.results[region];
      const aiRegionResult = aiResults.results?.[region];
      
      if (aiRegionResult) {
        // 合并评分（取平均值）
        localRegionResult.language.score = Math.round(
          (localRegionResult.language.score + aiRegionResult.language.score) / 2
        );
        localRegionResult.culture.score = Math.round(
          (localRegionResult.culture.score + aiRegionResult.culture.score) / 2
        );
        localRegionResult.compliance.score = Math.round(
          (localRegionResult.compliance.score + aiRegionResult.compliance.score) / 2
        );
        
        // 合并问题和建议
        if (aiRegionResult.language.issues) {
          localRegionResult.language.issues.push(...aiRegionResult.language.issues);
        }
        if (aiRegionResult.culture.issues) {
          localRegionResult.culture.issues.push(...aiRegionResult.culture.issues);
        }
        if (aiRegionResult.compliance.issues) {
          localRegionResult.compliance.issues.push(...aiRegionResult.compliance.issues);
        }
        
        // 重新计算总体评分
        localRegionResult.overallScore = this.calculateOverallScore(localRegionResult);
        
        // 添加AI增强标记
        localRegionResult.aiEnhanced = true;
      }
    });

    return mergedResults;
  }

  calculateOverallScore(regionResult) {
    const weights = { language: 0.3, culture: 0.25, compliance: 0.25, userExperience: 0.2 };
    
    return Math.round(
      regionResult.language.score * weights.language +
      regionResult.culture.score * weights.culture +
      regionResult.compliance.score * weights.compliance +
      regionResult.userExperience.score * weights.userExperience
    );
  }

  showAnalysisProgress() {
    this.analysisProgress.style.display = 'block';
    this.updateProgress(0, '准备分析...', '');
  }

  hideAnalysisProgress() {
    this.analysisProgress.style.display = 'none';
  }

  updateProgress(percentage, status, currentStep = '') {
    this.progressFill.style.width = percentage + '%';
    this.progressPercentage.textContent = percentage + '%';
    this.progressStatus.textContent = status;

    // 更新步骤状态
    this.progressSteps.forEach(step => {
      const stepName = step.dataset.step;
      step.classList.remove('active', 'completed');
      
      if (stepName === currentStep) {
        step.classList.add('active');
      } else if (this.isStepCompleted(stepName, currentStep)) {
        step.classList.add('completed');
      }
    });
  }

  isStepCompleted(stepName, currentStep) {
    const stepOrder = ['extract', 'local', 'ai', 'report'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepName);
    return stepIndex < currentIndex;
  }

  handleAnalysisComplete(results) {
    this.isAnalyzing = false;
    this.currentResults = results;
    this.hideAnalysisProgress();
    this.showQuickResults(results);
    this.updateUI();
    this.saveAnalysisToHistory(results);
  }

  handleAnalysisError(errorMessage) {
    this.isAnalyzing = false;
    this.hideAnalysisProgress();
    this.showMessage(errorMessage, 'error');
    this.updateUI();
  }

  showQuickResults(results) {
    // 显示结果区域
    this.quickResults.style.display = 'block';

    // 获取主要地区的结果（第一个选中的地区）
    const primaryRegion = Array.from(this.selectedRegions)[0];
    const primaryResult = results.results[primaryRegion];

    if (!primaryResult) return;

    // 更新总体评分
    this.overallScore.textContent = primaryResult.overallScore;
    
    // 更新各项评分
    this.updateScoreBar(this.languageScore, this.languageValue, primaryResult.language.score);
    this.updateScoreBar(this.cultureScore, this.cultureValue, primaryResult.culture.score);
    this.updateScoreBar(this.complianceScore, this.complianceValue, primaryResult.compliance.score);
    this.updateScoreBar(this.uxScore, this.uxValue, primaryResult.userExperience.score);
  }

  hideQuickResults() {
    this.quickResults.style.display = 'none';
  }

  updateScoreBar(barElement, valueElement, score) {
    barElement.style.width = score + '%';
    valueElement.textContent = score;
  }

  stopAnalysis() {
    this.isAnalyzing = false;
    this.hideAnalysisProgress();
    this.updateUI();
    this.showMessage('分析已停止', 'info');
  }

  async clearCache() {
    const cache = await this.initializeCacheIfNeeded();
    if (cache) {
      try {
        const success = await cache.clearAllCache();
        if (success) {
          this.showMessage('缓存已清空', 'success');
        } else {
          this.showMessage('清空缓存失败', 'error');
        }
      } catch (error) {
        console.error('清空缓存失败:', error);
        this.showMessage('清空缓存失败', 'error');
      }
    } else {
      this.showMessage('缓存功能不可用', 'warning');
    }
  }

  async exportReport() {
    if (!this.currentResults) {
      this.showMessage('无可导出的结果', 'error');
      return;
    }

    const reportGenerator = await this.initializeReportGeneratorIfNeeded();
    if (reportGenerator) {
      try {
        const htmlReport = await reportGenerator.generateReport(this.currentResults, 'html');
        this.downloadFile(htmlReport, `analysis-report-${Date.now()}.html`, 'text/html');
        this.showMessage('报告已导出', 'success');
      } catch (error) {
        console.error('导出报告失败:', error);
        this.showMessage('导出报告失败', 'error');
      }
    } else {
      // 简单的JSON导出
      const blob = new Blob([JSON.stringify(this.currentResults, null, 2)], {
        type: 'application/json'
      });
      this.downloadFile(blob, `analysis-${Date.now()}.json`);
      this.showMessage('结果已导出为JSON', 'success');
    }
  }

  displayDetailedResults() {
    if (!this.currentResults) {
      return;
    }

    // 更新结果元信息
    const timestamp = new Date(this.currentResults.timestamp).toLocaleString();
    this.resultsMeta.innerHTML = `
      <div>分析时间: ${timestamp}</div>
      <div>分析网址: ${this.currentResults.url}</div>
      <div>目标地区: ${Array.from(this.selectedRegions).join(', ')}</div>
    `;

    // 生成详细结果HTML
    let resultsHTML = '';
    Object.keys(this.currentResults.results).forEach(region => {
      const result = this.currentResults.results[region];
      resultsHTML += this.generateRegionDetailHTML(region, result);
    });

    this.detailedResultsContainer.innerHTML = resultsHTML;
  }

  generateRegionDetailHTML(region, result) {
    return `
      <div class="region-detail-card">
        <div class="region-detail-header">
          <h3>🌍 ${result.region.name} (${region})</h3>
          <div class="overall-score-badge">${result.overallScore}</div>
        </div>
        
        <div class="scores-detail-grid">
          ${this.generateScoreDetailHTML('语言适配', result.language)}
          ${this.generateScoreDetailHTML('文化适配', result.culture)}
          ${this.generateScoreDetailHTML('合规性', result.compliance)}
          ${this.generateScoreDetailHTML('用户体验', result.userExperience)}
        </div>
      </div>
    `;
  }

  generateScoreDetailHTML(categoryName, scoreData) {
    const issuesHTML = scoreData.issues?.length > 0 
      ? `<div class="issues-list">
           <h5>发现的问题:</h5>
           <ul>${scoreData.issues.map(issue => `<li>${issue}</li>`).join('')}</ul>
         </div>`
      : '<p class="no-issues">✅ 未发现明显问题</p>';

    return `
      <div class="score-detail-card">
        <div class="score-detail-header">
          <h4>${categoryName}</h4>
          <div class="score-badge ${this.getScoreClass(scoreData.score)}">${scoreData.score}</div>
        </div>
        <div class="score-detail-content">
          ${issuesHTML}
        </div>
      </div>
    `;
  }

  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  async saveAnalysisToHistory(results) {
    try {
      const historyResult = await chrome.storage.local.get('analysisHistory');
      const history = historyResult.analysisHistory || [];
      
      const historyItem = {
        id: Date.now(),
        timestamp: results.timestamp,
        url: results.url,
        regions: Array.from(this.selectedRegions),
        avgScore: this.calculateAverageScore(results),
        results: results
      };
      
      history.unshift(historyItem);
      
      // 保持最多100条历史记录
      if (history.length > 100) {
        history.splice(100);
      }
      
      await chrome.storage.local.set({ analysisHistory: history });
      
      // 如果当前在历史页面，刷新显示
      if (this.currentTab === 'history') {
        this.loadAnalysisHistory();
      }
    } catch (error) {
      console.error('保存分析历史失败:', error);
    }
  }

  calculateAverageScore(results) {
    const scores = Object.values(results.results).map(r => r.overallScore);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  async loadAnalysisHistory() {
    try {
      const result = await chrome.storage.local.get('analysisHistory');
      const history = result.analysisHistory || [];
      
      if (history.length === 0) {
        this.historyList.innerHTML = `
          <div class="no-history-placeholder">
            <div class="placeholder-icon">📂</div>
            <h3>暂无分析历史</h3>
            <p>执行分析后，历史记录将显示在这里</p>
          </div>
        `;
        return;
      }

      let historyHTML = '';
      history.forEach(item => {
        const date = new Date(item.timestamp).toLocaleString();
        historyHTML += `
          <div class="history-item" data-id="${item.id}">
            <div class="history-header">
              <div class="history-url">${item.url}</div>
              <div class="history-score">${item.avgScore}</div>
            </div>
            <div class="history-meta">
              <span class="history-date">${date}</span>
              <span class="history-regions">${item.regions.join(', ')}</span>
            </div>
            <div class="history-actions">
              <button class="btn btn-sm btn-outline" onclick="sidebarController.viewHistoryItem(${item.id})">查看</button>
              <button class="btn btn-sm btn-outline" onclick="sidebarController.deleteHistoryItem(${item.id})">删除</button>
            </div>
          </div>
        `;
      });
      
      this.historyList.innerHTML = historyHTML;
    } catch (error) {
      console.error('加载分析历史失败:', error);
    }
  }

  async viewHistoryItem(id) {
    try {
      const result = await chrome.storage.local.get('analysisHistory');
      const history = result.analysisHistory || [];
      const item = history.find(h => h.id === id);
      
      if (item) {
        this.currentResults = item.results;
        this.selectedRegions = new Set(item.regions);
        this.updateUI();
        this.switchTab('results');
      }
    } catch (error) {
      console.error('查看历史记录失败:', error);
    }
  }

  async deleteHistoryItem(id) {
    try {
      const result = await chrome.storage.local.get('analysisHistory');
      let history = result.analysisHistory || [];
      history = history.filter(h => h.id !== id);
      
      await chrome.storage.local.set({ analysisHistory: history });
      this.loadAnalysisHistory();
      this.showMessage('历史记录已删除', 'success');
    } catch (error) {
      console.error('删除历史记录失败:', error);
      this.showMessage('删除历史记录失败', 'error');
    }
  }

  async clearHistory() {
    if (confirm('确定要清空所有分析历史吗？此操作不可恢复。')) {
      try {
        await chrome.storage.local.remove('analysisHistory');
        this.loadAnalysisHistory();
        this.showMessage('历史记录已清空', 'success');
      } catch (error) {
        console.error('清空历史记录失败:', error);
        this.showMessage('清空历史记录失败', 'error');
      }
    }
  }

  async exportHistory() {
    try {
      const result = await chrome.storage.local.get('analysisHistory');
      const history = result.analysisHistory || [];
      
      if (history.length === 0) {
        this.showMessage('无历史记录可导出', 'warning');
        return;
      }
      
      const blob = new Blob([JSON.stringify(history, null, 2)], {
        type: 'application/json'
      });
      this.downloadFile(blob, `analysis-history-${Date.now()}.json`);
      this.showMessage('历史记录已导出', 'success');
    } catch (error) {
      console.error('导出历史记录失败:', error);
      this.showMessage('导出历史记录失败', 'error');
    }
  }

  async saveSettings() {
    try {
      const settings = {
        selectedRegions: Array.from(this.selectedRegions),
        analysisOptions: this.analysisOptions,
        autoAnalyze: this.autoAnalyzeCheckbox.checked,
        detailedReports: this.detailedReportsCheckbox.checked,
        enableCache: this.enableCacheCheckbox.checked,
        serverAddress: this.serverAddressInput.value,
        defaultProvider: this.aiProviderSelect.value
      };
      
      await chrome.storage.sync.set({ settings });
      this.showMessage('设置已保存', 'success');
    } catch (error) {
      console.error('保存设置失败:', error);
      this.showMessage('保存设置失败', 'error');
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get('settings');
      if (result.settings) {
        this.selectedRegions = new Set(result.settings.selectedRegions || ['US']);
        this.analysisOptions = { ...this.analysisOptions, ...result.settings.analysisOptions };
        
        // 更新UI
        this.enableLocalCheckbox.checked = this.analysisOptions.enableLocal;
        this.enableAICheckbox.checked = this.analysisOptions.enableAI;
        this.enablePerformanceCheckbox.checked = this.analysisOptions.enablePerformance;
        
        if (this.autoAnalyzeCheckbox) this.autoAnalyzeCheckbox.checked = result.settings.autoAnalyze || false;
        if (this.detailedReportsCheckbox) this.detailedReportsCheckbox.checked = result.settings.detailedReports !== false;
        if (this.enableCacheCheckbox) this.enableCacheCheckbox.checked = result.settings.enableCache !== false;
        if (this.serverAddressInput) this.serverAddressInput.value = result.settings.serverAddress || 'http://192.168.31.196:3000';
        if (this.aiProviderSelect) this.aiProviderSelect.value = result.settings.defaultProvider || 'zhipu';
        
        this.updateUI();
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }

  async resetSettings() {
    if (confirm('确定要重置为默认设置吗？')) {
      try {
        await chrome.storage.sync.remove('settings');
        location.reload();
      } catch (error) {
        console.error('重置设置失败:', error);
        this.showMessage('重置设置失败', 'error');
      }
    }
  }

  downloadFile(blob, filename, mimeType = null) {
    if (typeof blob === 'string') {
      blob = new Blob([blob], { type: mimeType || 'text/plain' });
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  showMessage(text, type = 'info') {
    // 创建消息元素
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.textContent = text;
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#059669' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#6b7280'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      z-index: 1000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => message.remove(), 300);
    }, 3000);
  }

  // 辅助方法
  detectCurrency(contentData) {
    // 从价格数据中检测货币
    if (contentData.ecommerce?.prices?.length > 0) {
      const priceText = contentData.ecommerce.prices[0];
      if (priceText.includes('$')) return 'USD';
      if (priceText.includes('€')) return 'EUR';
      if (priceText.includes('£')) return 'GBP';
      if (priceText.includes('¥') || priceText.includes('￥')) return 'JPY';
    }
    
    // 从页面内容中检测
    const bodyText = contentData.text?.paragraphs?.join(' ').toLowerCase() || '';
    if (bodyText.includes('usd') || bodyText.includes('dollar')) return 'USD';
    if (bodyText.includes('eur') || bodyText.includes('euro')) return 'EUR';
    if (bodyText.includes('gbp') || bodyText.includes('pound')) return 'GBP';
    if (bodyText.includes('jpy') || bodyText.includes('yen')) return 'JPY';
    
    return 'USD'; // 默认
  }

  detectAvailability(contentData) {
    const text = (contentData.text?.paragraphs?.join(' ') || '').toLowerCase();
    const buttons = (contentData.text?.buttons || []).join(' ').toLowerCase();
    
    if (text.includes('out of stock') || text.includes('sold out') || buttons.includes('notify when available')) {
      return 'Out of Stock';
    }
    if (text.includes('in stock') || buttons.includes('add to cart') || buttons.includes('buy now')) {
      return 'In Stock';
    }
    if (text.includes('pre-order') || buttons.includes('pre-order')) {
      return 'Pre-order';
    }
    
    return 'Available'; // 默认
  }
}

// 全局函数，供HTML调用
function switchTab(tabId) {
  if (window.sidebarController) {
    window.sidebarController.switchTab(tabId);
  }
}

// 初始化侧栏控制器
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('DOM 内容加载完成，初始化 SidebarController...');
    window.sidebarController = new SidebarController();
  } catch (error) {
    console.error('SidebarController 创建失败:', error);
    
    // 显示错误信息给用户
    const container = document.querySelector('.sidebar-container');
    if (container) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        color: white;
        background: #ef4444;
        padding: 15px;
        margin: 10px;
        border-radius: 4px;
        text-align: center;
        font-weight: bold;
      `;
      errorDiv.textContent = '侧栏初始化失败，请刷新页面重试';
      container.innerHTML = '';
      container.appendChild(errorDiv);
    }
  }
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }

  .region-detail-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .region-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;
  }

  .overall-score-badge {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 18px;
    font-weight: bold;
  }

  .scores-detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  .score-detail-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 16px;
  }

  .score-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .score-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }

  .score-badge.excellent { background: #d1fae5; color: #065f46; }
  .score-badge.good { background: #dbeafe; color: #1e40af; }
  .score-badge.fair { background: #fef3c7; color: #92400e; }
  .score-badge.poor { background: #fee2e2; color: #b91c1c; }

  .issues-list ul {
    margin: 8px 0 0 16px;
  }

  .issues-list li {
    color: #dc2626;
    margin-bottom: 4px;
    font-size: 13px;
  }

  .no-issues {
    color: #059669;
    font-weight: 500;
    font-size: 13px;
  }

  .history-item {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .history-url {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
    flex: 1;
    word-break: break-all;
  }

  .history-score {
    background: #667eea;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    margin-left: 12px;
  }

  .history-meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 12px;
  }

  .history-actions {
    display: flex;
    gap: 8px;
  }
`;
document.head.appendChild(style);