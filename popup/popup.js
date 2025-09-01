// Popup交互脚本
class PopupController {
  constructor() {
    try {
      console.log('PopupController 初始化开始...');
      
      this.selectedRegions = new Set(['US']);
      this.analysisOptions = {
        enableLocal: true,
        enableAI: true,
        enablePerformance: false
      };
      this.currentResults = null;
      this.isAnalyzing = false;
      
      // 检查 AnalysisCache 是否可用
      if (typeof AnalysisCache !== 'undefined') {
        this.cache = new AnalysisCache();
        console.log('AnalysisCache 初始化成功');
      } else {
        console.warn('AnalysisCache 未定义，缓存功能将不可用');
        this.cache = null;
      }
      
      this.initializeElements();
      this.attachEventListeners();
      this.loadSettings();
      this.updateUI();
      
      console.log('PopupController 初始化完成');
    } catch (error) {
      console.error('PopupController 初始化失败:', error);
      this.handleInitError(error);
    }
  }

  handleInitError(error) {
    // 创建错误显示
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      color: red;
      padding: 10px;
      background: #ffebee;
      border: 1px solid #f44336;
      border-radius: 4px;
      margin: 10px;
      font-size: 12px;
    `;
    errorDiv.innerHTML = `
      <strong>初始化错误:</strong><br>
      ${error.message}<br>
      <small>请检查浏览器控制台获取详细信息</small>
    `;
    
    const container = document.querySelector('.popup-container');
    if (container) {
      container.insertBefore(errorDiv, container.firstChild);
    }
  }

  initializeElements() {
    // 状态元素
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    
    // 地区选择
    this.regionGrid = document.getElementById('regionGrid');
    this.regionItems = document.querySelectorAll('.region-item');
    
    // 分析选项
    this.enableLocalCheckbox = document.getElementById('enableLocal');
    this.enableAICheckbox = document.getElementById('enableAI');
    this.enablePerformanceCheckbox = document.getElementById('enablePerformance');
    
    // 按钮
    this.analyzeBtn = document.getElementById('analyzeBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.detailsBtn = document.getElementById('detailsBtn');
    
    // 结果区域
    this.resultsSection = document.getElementById('resultsSection');
    this.loadingSection = document.getElementById('loading');
    this.progressFill = document.getElementById('progressFill');
    this.progressText = document.getElementById('progressText');
    
    // 评分元素
    this.scoreNumber = document.getElementById('scoreNumber');
    this.languageScore = document.getElementById('languageScore');
    this.cultureScore = document.getElementById('cultureScore');
    this.complianceScore = document.getElementById('complianceScore');
    this.uxScore = document.getElementById('uxScore');
    this.languageValue = document.getElementById('languageValue');
    this.cultureValue = document.getElementById('cultureValue');
    this.complianceValue = document.getElementById('complianceValue');
    this.uxValue = document.getElementById('uxValue');
    
    this.issuesList = document.getElementById('issuesList');
  }

  attachEventListeners() {
    // 地区选择事件
    this.regionItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const region = e.currentTarget.dataset.region;
        this.toggleRegionSelection(region);
      });
    });

    // 分析选项事件
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

    // 按钮事件
    this.analyzeBtn.addEventListener('click', () => {
      this.startAnalysis();
    });

    this.settingsBtn.addEventListener('click', () => {
      this.openSettings();
    });

    this.exportBtn.addEventListener('click', () => {
      this.exportReport();
    });

    this.detailsBtn.addEventListener('click', () => {
      this.showDetailedResults();
    });

    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'CONTENT_EXTRACTED') {
        this.handleContentExtracted(request.data);
      } else if (request.type === 'ANALYSIS_PROGRESS') {
        this.updateProgress(request.progress, request.status);
      } else if (request.type === 'ANALYSIS_COMPLETE') {
        this.handleAnalysisComplete(request.results);
      }
    });
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
      if (this.selectedRegions.has(region)) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
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
      this.showError('请至少选择一个目标地区');
      return;
    }

    this.isAnalyzing = true;
    this.updateUI();
    this.showLoading();

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
      if (this.cache && cacheEnabled) {
        this.updateProgress(5, '检查缓存中...');
        const cachedResult = await this.cache.getCachedResult(tab.url, Array.from(this.selectedRegions));
        
        if (cachedResult) {
          this.updateProgress(100, '从缓存中加载结果');
          console.log('使用缓存结果:', cachedResult);
          
          setTimeout(() => {
            this.handleAnalysisComplete(cachedResult);
          }, 500);
          return;
        }
      }

      // 缓存未命中，执行完整分析
      this.updateProgress(10, '正在提取页面内容...');

      // 向content script发送消息提取内容
      const response = await chrome.tabs.sendMessage(tab.id, { 
        type: 'EXTRACT_CONTENT' 
      });

      if (!response.success) {
        throw new Error('页面内容提取失败');
      }

      this.updateProgress(30, '正在执行本地规则分析...');

      // 执行本地分析
      const localResults = await this.performLocalAnalysis(response.data);
      
      this.updateProgress(60, '正在执行AI深度分析...');

      // 执行AI分析（如果启用）
      let aiResults = null;
      if (this.analysisOptions.enableAI) {
        aiResults = await this.performAIAnalysis(response.data);
      }

      this.updateProgress(90, '正在生成分析报告...');

      // 合并结果
      const finalResults = this.mergeResults(localResults, aiResults);

      // 保存到缓存（如果启用且缓存可用）
      if (this.cache && cacheEnabled) {
        this.updateProgress(95, '保存分析结果...');
        await this.cache.setCachedResult(tab.url, Array.from(this.selectedRegions), finalResults);
      }

      this.updateProgress(100, '分析完成！');

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

  async performAIAnalysis(contentData) {
    try {
      // Get server address from settings
      const result = await chrome.storage.sync.get('settings');
      const serverAddress = result.settings?.serverAddress || 'http://192.168.31.196:3000';
      
      // 准备AI分析数据（增强版）
      const aiPayload = {
        url: contentData.url,
        title: contentData.title,
        content: {
          headings: contentData.text.headings,
          paragraphs: contentData.text.paragraphs.slice(0, 15), // 增加数据量
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
          // 添加增强的电商数据
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

  mergeResults(localResults, aiResults) {
    if (!aiResults) {
      return localResults;
    }

    // 合并本地和AI分析结果
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

  handleAnalysisComplete(results) {
    this.isAnalyzing = false;
    this.currentResults = results;
    this.hideLoading();
    this.showResults(results);
    this.updateUI();
  }

  handleAnalysisError(errorMessage) {
    this.isAnalyzing = false;
    this.hideLoading();
    this.showError(errorMessage);
    this.updateUI();
  }

  showResults(results) {
    // 显示结果区域
    this.resultsSection.style.display = 'block';

    // 获取主要地区的结果（第一个选中的地区）
    const primaryRegion = Array.from(this.selectedRegions)[0];
    const primaryResult = results.results[primaryRegion];

    if (!primaryResult) return;

    // 更新总体评分
    this.scoreNumber.textContent = primaryResult.overallScore;
    
    // 更新各项评分
    this.updateScoreBar(this.languageScore, this.languageValue, primaryResult.language.score);
    this.updateScoreBar(this.cultureScore, this.cultureValue, primaryResult.culture.score);
    this.updateScoreBar(this.complianceScore, this.complianceValue, primaryResult.compliance.score);
    this.updateScoreBar(this.uxScore, this.uxValue, primaryResult.userExperience.score);

    // 显示问题列表
    this.displayIssues(primaryResult);
  }

  updateScoreBar(barElement, valueElement, score) {
    barElement.style.width = score + '%';
    valueElement.textContent = score;
  }

  displayIssues(result) {
    this.issuesList.innerHTML = '';

    const allIssues = [];
    
    // 收集所有问题
    if (result.language.issues.length > 0) {
      allIssues.push(...result.language.issues.map(issue => ({
        category: 'language',
        text: issue,
        priority: result.language.score < 60 ? 'high' : 'medium'
      })));
    }
    
    if (result.culture.issues.length > 0) {
      allIssues.push(...result.culture.issues.map(issue => ({
        category: 'culture',
        text: issue,
        priority: result.culture.score < 60 ? 'high' : 'medium'
      })));
    }
    
    if (result.compliance.issues.length > 0) {
      allIssues.push(...result.compliance.issues.map(issue => ({
        category: 'compliance',
        text: issue,
        priority: 'high'
      })));
    }
    
    if (result.userExperience.issues.length > 0) {
      allIssues.push(...result.userExperience.issues.map(issue => ({
        category: 'userExperience',
        text: issue,
        priority: 'medium'
      })));
    }

    // 如果没有问题
    if (allIssues.length === 0) {
      const noIssuesDiv = document.createElement('div');
      noIssuesDiv.className = 'no-issues';
      noIssuesDiv.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #059669;">
          <span style="font-size: 24px;">✅</span>
          <div style="margin-top: 8px; font-weight: 500;">太棒了！</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">未发现明显的适配问题</div>
        </div>
      `;
      this.issuesList.appendChild(noIssuesDiv);
      return;
    }

    // 按优先级排序
    allIssues.sort((a, b) => {
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // 显示问题
    allIssues.slice(0, 5).forEach(issue => {
      const issueDiv = document.createElement('div');
      issueDiv.className = `issue-item ${issue.priority}-priority`;
      
      const categoryNames = {
        'language': '语言适配',
        'culture': '文化适配',
        'compliance': '合规性',
        'userExperience': '用户体验'
      };
      
      issueDiv.innerHTML = `
        <div class="issue-title">${categoryNames[issue.category]}</div>
        <div class="issue-description">${issue.text}</div>
      `;
      
      this.issuesList.appendChild(issueDiv);
    });

    // 如果问题太多，显示省略提示
    if (allIssues.length > 5) {
      const moreDiv = document.createElement('div');
      moreDiv.className = 'more-issues';
      moreDiv.innerHTML = `
        <div style="text-align: center; padding: 12px; color: #6b7280; font-size: 12px;">
          还有 ${allIssues.length - 5} 个问题，点击"详细结果"查看完整报告
        </div>
      `;
      this.issuesList.appendChild(moreDiv);
    }
  }

  showLoading() {
    this.loadingSection.style.display = 'block';
    this.resultsSection.style.display = 'none';
  }

  hideLoading() {
    this.loadingSection.style.display = 'none';
  }

  updateProgress(percentage, status) {
    this.progressFill.style.width = percentage + '%';
    this.progressText.textContent = status;
  }

  showError(message) {
    // 简单的错误显示，实际应用中可以使用更好的UI组件
    alert('错误: ' + message);
  }

  exportReport() {
    if (!this.currentResults) return;
    
    // 生成报告并下载
    const reportData = this.generateReportData();
    this.downloadReport(reportData);
  }

  generateReportData() {
    // 生成详细的分析报告数据
    return {
      timestamp: this.currentResults.timestamp,
      url: this.currentResults.url,
      selectedRegions: Array.from(this.selectedRegions),
      results: this.currentResults.results
    };
  }

  downloadReport(reportData) {
    // 创建下载链接
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localization-analysis-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  showDetailedResults() {
    if (!this.currentResults) return;
    
    // 存储分析结果到session storage和chrome storage
    try {
      const resultsData = JSON.stringify(this.currentResults);
      sessionStorage.setItem('analysisResults', resultsData);
      
      // 同时保存到chrome storage作为备份
      chrome.storage.session.set({ 'latestAnalysis': this.currentResults });
      
      // 打开详细结果页面
      chrome.tabs.create({
        url: chrome.runtime.getURL('detailed-results.html')
      });
    } catch (error) {
      console.error('保存分析结果失败:', error);
      // 回退到URL参数方式（如果数据不太大）
      try {
        const compactResults = this.createCompactResults(this.currentResults);
        chrome.tabs.create({
          url: chrome.runtime.getURL('detailed-results.html') + '?results=' + 
               encodeURIComponent(JSON.stringify(compactResults))
        });
      } catch (urlError) {
        console.error('URL参数方式也失败:', urlError);
        alert('无法打开详细结果页面，请重新分析');
      }
    }
  }

  // 创建紧凑的结果数据用于URL传递
  createCompactResults(fullResults) {
    return {
      url: fullResults.url,
      timestamp: fullResults.timestamp,
      results: fullResults.results
    };
  }

  openSettings() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/options.html')
    });
  }

  saveSettings() {
    const settings = {
      selectedRegions: Array.from(this.selectedRegions),
      analysisOptions: this.analysisOptions
    };
    chrome.storage.sync.set({ settings });
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
        
        this.updateUI();
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }

  // 检测货币
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

  // 检测产品可用性
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

// 初始化popup控制器
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('DOM 内容加载完成，初始化 PopupController...');
    new PopupController();
  } catch (error) {
    console.error('PopupController 创建失败:', error);
    
    // 显示错误信息给用户
    const container = document.querySelector('.popup-container');
    if (container) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        color: white;
        background: #f44336;
        padding: 15px;
        margin: 10px;
        border-radius: 4px;
        text-align: center;
        font-weight: bold;
      `;
      errorDiv.textContent = '扩展初始化失败，请刷新页面重试';
      container.innerHTML = '';
      container.appendChild(errorDiv);
    }
  }
});