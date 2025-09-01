// Options page controller
class OptionsController {
  constructor() {
    console.log('OptionsController initializing...');
    this.currentTab = 'dashboard';
    this.settings = {};
    this.results = null;
    
    this.initializeElements();
    this.attachEventListeners();
    this.loadSettings();
    this.handleURLParams();
    this.loadDashboardData();
    console.log('OptionsController initialized successfully');
  }

  initializeElements() {
    console.log('Initializing elements...');
    
    // Navigation tabs
    this.navTabs = document.querySelectorAll('.nav-tab');
    this.tabContents = document.querySelectorAll('.tab-content');
    
    console.log('Found elements:', {
      navTabs: this.navTabs.length,
      tabContents: this.tabContents.length
    });
    
    // Settings elements
    this.aiProviderInputs = {
      deepseek: document.getElementById('deepseekKey'),
      zhipu: document.getElementById('zhipuKey'),
      qwen: document.getElementById('qwenKey'),
      openai: document.getElementById('openaiKey'),
      custom: document.getElementById('customApiKey')
    };
    
    this.providerStatusElements = {
      deepseek: document.getElementById('deepseekStatus'),
      zhipu: document.getElementById('zhipuStatus'),
      qwen: document.getElementById('qwenStatus'),
      openai: document.getElementById('openaiStatus'),
      custom: document.getElementById('customStatus')
    };
    
    // 自定义模型字段
    this.customModelInputs = {
      name: document.getElementById('customModelName'),
      apiUrl: document.getElementById('customApiUrl'),
      model: document.getElementById('customModel'),
      maxTokens: document.getElementById('customMaxTokens'),
      apiKey: document.getElementById('customApiKey')
    };
    
    this.testButtons = document.querySelectorAll('.btn-test');
    this.defaultProvider = document.getElementById('defaultProvider');
    
    // Settings checkboxes
    this.autoAnalyze = document.getElementById('autoAnalyze');
    this.detailedReports = document.getElementById('detailedReports');
    this.saveHistory = document.getElementById('saveHistory');
    this.analysisTimeout = document.getElementById('analysisTimeout');
    this.maxRetries = document.getElementById('maxRetries');
    this.serverAddress = document.getElementById('serverAddress');
    
    // Cache settings
    this.enableCache = document.getElementById('enableCache');
    this.cacheExpiry = document.getElementById('cacheExpiry');
    this.maxCacheSize = document.getElementById('maxCacheSize');
    
    // Cache statistics elements
    this.cacheEntries = document.getElementById('cacheEntries');
    this.cacheSize = document.getElementById('cacheSize');
    this.expiredEntries = document.getElementById('expiredEntries');
    
    // Action buttons
    this.saveSettingsBtn = document.getElementById('saveSettings');
    this.resetSettingsBtn = document.getElementById('resetSettings');
    
    // Cache action buttons
    this.cleanupCacheBtn = document.getElementById('cleanupCache');
    this.clearAllCacheBtn = document.getElementById('clearAllCache');
    this.refreshCacheStatsBtn = document.getElementById('refreshCacheStats');
    
    // Export buttons
    this.exportHTML = document.getElementById('exportHTML');
    this.exportJSON = document.getElementById('exportJSON');
    this.exportCSV = document.getElementById('exportCSV');
    
    // Dashboard elements
    this.recentAnalyses = document.getElementById('recentAnalyses');
    this.aiStatus = document.getElementById('aiStatus');
    this.totalAnalyses = document.getElementById('totalAnalyses');
    this.avgScore = document.getElementById('avgScore');
    
    // Results container
    this.detailedResults = document.getElementById('detailedResults');
    
    // Initialize cache manager
    this.cache = new AnalysisCache();
    
    console.log('All elements initialized');
  }

  attachEventListeners() {
    // Navigation tabs
    console.log('Found nav tabs:', this.navTabs.length);
    this.navTabs.forEach((tab, index) => {
      console.log(`Tab ${index}:`, tab.dataset.tab);
      tab.addEventListener('click', (e) => {
        console.log('Tab clicked:', e.target.dataset.tab);
        const tabId = e.target.dataset.tab;
        this.switchTab(tabId);
      });
    });

    // Test connection buttons
    this.testButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const provider = e.target.dataset.provider;
        this.testAPIConnection(provider);
      });
    });

    // Settings save/reset
    this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());

    // Cache action buttons
    this.cleanupCacheBtn.addEventListener('click', () => this.cleanupCache());
    this.clearAllCacheBtn.addEventListener('click', () => this.clearAllCache());
    this.refreshCacheStatsBtn.addEventListener('click', () => this.loadCacheStats());

    // Export buttons
    this.exportHTML.addEventListener('click', () => this.exportResults('html'));
    this.exportJSON.addEventListener('click', () => this.exportResults('json'));
    this.exportCSV.addEventListener('click', () => this.exportResults('csv'));
  }

  switchTab(tabId) {
    console.log('Switching to tab:', tabId);
    
    // Update nav tabs
    this.navTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update tab content
    this.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });

    this.currentTab = tabId;
    console.log('Current tab set to:', this.currentTab);

    // Load tab-specific data
    if (tabId === 'results' && this.results) {
      this.displayDetailedResults();
    }
  }

  handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const resultsParam = urlParams.get('results');
    
    if (resultsParam) {
      try {
        this.results = JSON.parse(decodeURIComponent(resultsParam));
        this.switchTab('results');
      } catch (error) {
        console.error('Failed to parse results from URL:', error);
      }
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['apiKeys', 'settings', 'analysisHistory', 'customModelConfig']);
      
      // Load API keys
      if (result.apiKeys) {
        Object.keys(this.aiProviderInputs).forEach(provider => {
          if (result.apiKeys[provider]) {
            this.aiProviderInputs[provider].value = '••••••••••••••••';
            this.providerStatusElements[provider].textContent = '已配置';
            this.providerStatusElements[provider].className = 'provider-status configured';
          }
        });
      }

      // Load custom model configuration
      if (result.customModelConfig) {
        const config = result.customModelConfig;
        this.customModelInputs.name.value = config.name || '';
        this.customModelInputs.apiUrl.value = config.apiUrl || '';
        this.customModelInputs.model.value = config.model || '';
        this.customModelInputs.maxTokens.value = config.maxTokens || 4000;
        
        // If custom model is configured, show configured status
        if (config.name && config.apiUrl && config.model && result.apiKeys?.custom) {
          this.customModelInputs.apiKey.value = '••••••••••••••••';
          this.providerStatusElements.custom.textContent = '已配置';
          this.providerStatusElements.custom.className = 'provider-status configured';
        }
      }

      // Load general settings
      if (result.settings) {
        this.settings = result.settings;
        this.autoAnalyze.checked = result.settings.autoAnalyze || false;
        this.detailedReports.checked = result.settings.detailedReports !== false;
        this.saveHistory.checked = result.settings.saveHistory !== false;
        this.analysisTimeout.value = result.settings.analysisTimeout || 120;
        this.maxRetries.value = result.settings.maxRetries || 3;
        this.serverAddress.value = result.settings.serverAddress || 'http://192.168.31.196:3000';
        this.defaultProvider.value = result.settings.defaultProvider || 'zhipu';
        
        // Load cache settings
        this.enableCache.checked = result.settings.enableCache !== false;
        this.cacheExpiry.value = result.settings.cacheExpiry || 24;
        this.maxCacheSize.value = result.settings.maxCacheSize || 50;
      }

      // Load analysis history for dashboard
      if (result.analysisHistory) {
        this.updateDashboardStats(result.analysisHistory);
      }
      
      // Load cache statistics
      this.loadCacheStats();

    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      // Collect current settings
      const settings = {
        autoAnalyze: this.autoAnalyze.checked,
        detailedReports: this.detailedReports.checked,
        saveHistory: this.saveHistory.checked,
        analysisTimeout: parseInt(this.analysisTimeout.value),
        maxRetries: parseInt(this.maxRetries.value),
        serverAddress: this.serverAddress.value,
        defaultProvider: this.defaultProvider.value,
        // Cache settings
        enableCache: this.enableCache.checked,
        cacheExpiry: parseInt(this.cacheExpiry.value),
        maxCacheSize: parseInt(this.maxCacheSize.value)
      };

      // Collect API keys (only save non-placeholder values)
      const apiKeys = {};
      Object.keys(this.aiProviderInputs).forEach(provider => {
        const input = this.aiProviderInputs[provider];
        if (input.value && !input.value.includes('•')) {
          apiKeys[provider] = input.value;
        }
      });

      // Save to storage
      await chrome.storage.sync.set({ settings, apiKeys });
      
      // Show success message
      this.showMessage('设置已保存', 'success');

    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showMessage('保存设置失败', 'error');
    }
  }

  async resetSettings() {
    if (confirm('确定要重置所有设置吗？此操作不可恢复。')) {
      try {
        await chrome.storage.sync.clear();
        location.reload();
      } catch (error) {
        console.error('Failed to reset settings:', error);
        this.showMessage('重置设置失败', 'error');
      }
    }
  }

  async testAPIConnection(provider) {
    const input = this.aiProviderInputs[provider];
    const status = this.providerStatusElements[provider];
    const button = document.querySelector(`[data-provider="${provider}"]`);
    
    // 处理自定义模型的特殊情况
    if (provider === 'custom') {
      return this.testCustomModel();
    }
    
    if (!input.value || input.value.includes('•')) {
      this.showMessage('请先输入API密钥', 'error');
      return;
    }

    button.disabled = true;
    button.textContent = '测试中...';
    status.textContent = '测试中...';
    status.className = 'provider-status testing';

    try {
      // Get server address from settings
      const settingsResult = await chrome.storage.sync.get('settings');
      const serverAddress = settingsResult.settings?.serverAddress || 'http://192.168.31.196:3000';
      
      // Try to test API connection via backend
      const response = await fetch(`${serverAddress}/api/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: provider,
          apiKey: input.value
        })
      });

      const apiResult = await response.json();
      
      if (apiResult.success) {
        status.textContent = '连接成功';
        status.className = 'provider-status configured';
        this.showMessage(`${provider} 连接测试成功`, 'success');
        
        // Save API key on successful test
        const apiKeys = await chrome.storage.sync.get('apiKeys');
        apiKeys.apiKeys = apiKeys.apiKeys || {};
        apiKeys.apiKeys[provider] = input.value;
        await chrome.storage.sync.set(apiKeys);
      } else {
        status.textContent = '连接失败';
        status.className = 'provider-status error';
        this.showMessage(`${provider} 连接测试失败: ${apiResult.error}`, 'error');
      }

    } catch (error) {
      console.error(`${provider} connection test failed:`, error);
      
      // Fallback: Save API key without testing when backend is unavailable
      status.textContent = '已保存';
      status.className = 'provider-status configured';
      this.showMessage(`${provider} API密钥已保存，后端服务离线时无法测试`, 'info');
      
      // Save API key
      try {
        const storageResult = await chrome.storage.sync.get('apiKeys');
        const apiKeys = storageResult.apiKeys || {};
        apiKeys[provider] = input.value;
        await chrome.storage.sync.set({ apiKeys });
      } catch (saveError) {
        console.error('Failed to save API key:', saveError);
        status.textContent = '保存失败';
        status.className = 'provider-status error';
        this.showMessage('API密钥保存失败', 'error');
      }
    } finally {
      button.disabled = false;
      button.textContent = '测试连接';
    }
  }

  async testCustomModel() {
    const status = this.providerStatusElements.custom;
    const button = document.querySelector('[data-provider="custom"]');
    
    // 验证自定义模型配置
    const config = {
      name: this.customModelInputs.name.value,
      apiUrl: this.customModelInputs.apiUrl.value,
      model: this.customModelInputs.model.value,
      maxTokens: parseInt(this.customModelInputs.maxTokens.value) || 4000,
      apiKey: this.customModelInputs.apiKey.value
    };
    
    // 检查必填字段
    if (!config.name || !config.apiUrl || !config.model || !config.apiKey) {
      this.showMessage('请填写所有自定义模型字段', 'error');
      return;
    }
    
    // 验证URL格式
    try {
      new URL(config.apiUrl);
    } catch (e) {
      this.showMessage('API地址格式不正确', 'error');
      return;
    }
    
    button.disabled = true;
    button.textContent = '测试中...';
    status.textContent = '测试中...';
    status.className = 'provider-status testing';

    try {
      // Get server address from settings
      const settingsResult = await chrome.storage.sync.get('settings');
      const serverAddress = settingsResult.settings?.serverAddress || 'http://192.168.31.196:3000';
      
      // Test custom model connection via backend
      const response = await fetch(`${serverAddress}/api/test-custom-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: config.name,
          apiUrl: config.apiUrl,
          model: config.model,
          maxTokens: config.maxTokens,
          apiKey: config.apiKey
        })
      });

      const result = await response.json();
      
      if (result.success) {
        status.textContent = '连接成功';
        status.className = 'provider-status configured';
        this.showMessage(`自定义模型 ${config.name} 连接测试成功`, 'success');
        
        // 保存自定义模型配置
        await this.saveCustomModelConfig(config);
      } else {
        status.textContent = '连接失败';
        status.className = 'provider-status error';
        this.showMessage(`自定义模型连接测试失败: ${result.error}`, 'error');
      }

    } catch (error) {
      console.error('Custom model connection test failed:', error);
      
      // Fallback: Save configuration without testing when backend is unavailable
      status.textContent = '已保存';
      status.className = 'provider-status configured';
      this.showMessage('自定义模型配置已保存，后端服务离线时无法测试', 'info');
      
      // Save custom model configuration
      try {
        await this.saveCustomModelConfig(config);
      } catch (saveError) {
        console.error('Failed to save custom model config:', saveError);
        status.textContent = '保存失败';
        status.className = 'provider-status error';
        this.showMessage('自定义模型配置保存失败', 'error');
      }
    } finally {
      button.disabled = false;
      button.textContent = '测试自定义模型';
    }
  }

  async saveCustomModelConfig(config) {
    // 保存自定义模型配置到Chrome存储
    await chrome.storage.sync.set({
      customModelConfig: {
        name: config.name,
        apiUrl: config.apiUrl,
        model: config.model,
        maxTokens: config.maxTokens
      }
    });
    
    // 保存API密钥到apiKeys中
    const storageResult = await chrome.storage.sync.get('apiKeys');
    const apiKeys = storageResult.apiKeys || {};
    apiKeys.custom = config.apiKey;
    await chrome.storage.sync.set({ apiKeys });
  }

  loadDashboardData() {
    // Load AI service status
    this.checkAIServiceStatus();
    
    // Load recent analyses
    this.loadRecentAnalyses();
  }

  async checkAIServiceStatus() {
    try {
      const settingsResult = await chrome.storage.sync.get('settings');
      const serverAddress = settingsResult.settings?.serverAddress || 'http://192.168.31.196:3000';
      const response = await fetch(`${serverAddress}/api/status`);
      const status = await response.json();
      
      this.aiStatus.innerHTML = `
        <div class="status-item ${status.available ? 'online' : 'offline'}">
          <span class="status-dot"></span>
          <span>${status.available ? '服务正常' : '服务离线'}</span>
        </div>
        <p class="status-detail">${status.message || ''}</p>
      `;
    } catch (error) {
      this.aiStatus.innerHTML = `
        <div class="status-item offline">
          <span class="status-dot"></span>
          <span>本地模式</span>
        </div>
        <p class="status-detail">使用本地规则引擎，AI分析功能需要后端服务</p>
      `;
    }
  }

  async loadRecentAnalyses() {
    try {
      const result = await chrome.storage.local.get('analysisHistory');
      const history = result.analysisHistory || [];
      
      if (history.length === 0) {
        return;
      }

      // Display recent analyses
      const recentList = history.slice(-5).reverse();
      this.recentAnalyses.innerHTML = recentList.map(analysis => `
        <div class="recent-item">
          <div class="recent-url">${analysis.url}</div>
          <div class="recent-score">总分: ${analysis.avgScore || '--'}</div>
          <div class="recent-time">${new Date(analysis.timestamp).toLocaleString()}</div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Failed to load recent analyses:', error);
    }
  }

  updateDashboardStats(history) {
    if (!history || history.length === 0) return;

    this.totalAnalyses.textContent = history.length;
    
    const scores = history
      .filter(h => h.avgScore !== undefined)
      .map(h => h.avgScore);
    
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      this.avgScore.textContent = Math.round(avg);
    }
  }

  displayDetailedResults() {
    if (!this.results) {
      this.detailedResults.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">📊</div>
          <h3>暂无分析结果</h3>
          <p>使用扩展分析页面后，详细结果将在此显示</p>
        </div>
      `;
      return;
    }

    // Generate detailed results view
    const resultsHTML = this.generateDetailedResultsHTML();
    this.detailedResults.innerHTML = resultsHTML;
  }

  generateDetailedResultsHTML() {
    const regions = Object.keys(this.results.results);
    
    let html = `
      <div class="results-overview">
        <h3>分析概览</h3>
        <div class="overview-info">
          <div class="info-item">
            <label>分析网址:</label>
            <span>${this.results.url}</span>
          </div>
          <div class="info-item">
            <label>分析时间:</label>
            <span>${new Date(this.results.timestamp).toLocaleString()}</span>
          </div>
          <div class="info-item">
            <label>目标地区:</label>
            <span>${regions.join(', ')}</span>
          </div>
        </div>
      </div>
    `;

    regions.forEach(region => {
      const result = this.results.results[region];
      html += `
        <div class="region-results">
          <h3>🌍 ${result.region.name} (${region})</h3>
          
          <div class="score-overview">
            <div class="overall-score-large">
              <div class="score-circle-large">
                <div class="score-number-large">${result.overallScore}</div>
                <div class="score-label-large">总分</div>
              </div>
            </div>
            
            <div class="detailed-scores">
              ${this.generateDetailedScoreHTML('语言适配', result.language)}
              ${this.generateDetailedScoreHTML('文化适配', result.culture)}
              ${this.generateDetailedScoreHTML('合规性', result.compliance)}
              ${this.generateDetailedScoreHTML('用户体验', result.userExperience)}
            </div>
          </div>

          ${result.recommendations && result.recommendations.length > 0 ? `
            <div class="recommendations">
              <h4>优化建议</h4>
              ${result.recommendations.map(rec => `
                <div class="recommendation-item ${rec.priority}-priority">
                  <div class="rec-header">
                    <span class="rec-category">${rec.category}</span>
                    <span class="rec-priority">${rec.priority === 'high' ? '高' : rec.priority === 'medium' ? '中' : '低'}优先级</span>
                  </div>
                  <div class="rec-issue">${rec.issue}</div>
                  <div class="rec-suggestion">${rec.suggestion}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    });

    return html;
  }

  generateDetailedScoreHTML(category, scoreData) {
    return `
      <div class="score-detail-item">
        <div class="score-detail-header">
          <span class="score-detail-name">${category}</span>
          <span class="score-detail-value">${scoreData.score}</span>
        </div>
        <div class="score-detail-bar">
          <div class="score-detail-fill" style="width: ${scoreData.score}%"></div>
        </div>
        ${scoreData.issues && scoreData.issues.length > 0 ? `
          <div class="score-issues">
            ${scoreData.issues.map(issue => `
              <div class="issue-tag">${issue}</div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  exportResults(format) {
    if (!this.results) {
      this.showMessage('无可导出的结果', 'error');
      return;
    }

    switch (format) {
      case 'json':
        this.exportJSON();
        break;
      case 'html':
        this.exportHTML();
        break;
      case 'csv':
        this.exportCSV();
        break;
    }
  }

  exportJSON() {
    const blob = new Blob([JSON.stringify(this.results, null, 2)], {
      type: 'application/json'
    });
    this.downloadFile(blob, `analysis-${Date.now()}.json`);
  }

  exportHTML() {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>地域适配分析报告</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
          .region-section { margin-bottom: 40px; }
          .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
          .score-card { border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; text-align: center; }
          .issues { margin-top: 20px; }
          .issue-item { background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 12px; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>地域适配分析报告</h1>
          <p><strong>分析网址:</strong> ${this.results.url}</p>
          <p><strong>分析时间:</strong> ${new Date(this.results.timestamp).toLocaleString()}</p>
        </div>
        ${Object.entries(this.results.results).map(([region, result]) => `
          <div class="region-section">
            <h2>${result.region.name} (${region}) - 总分: ${result.overallScore}</h2>
            <div class="score-grid">
              <div class="score-card">
                <h3>语言适配</h3>
                <div class="score">${result.language.score}</div>
              </div>
              <div class="score-card">
                <h3>文化适配</h3>
                <div class="score">${result.culture.score}</div>
              </div>
              <div class="score-card">
                <h3>合规性</h3>
                <div class="score">${result.compliance.score}</div>
              </div>
              <div class="score-card">
                <h3>用户体验</h3>
                <div class="score">${result.userExperience.score}</div>
              </div>
            </div>
            <div class="issues">
              <h3>发现的问题</h3>
              ${[...result.language.issues, ...result.culture.issues, ...result.compliance.issues, ...result.userExperience.issues].map(issue => `
                <div class="issue-item">${issue}</div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    this.downloadFile(blob, `analysis-report-${Date.now()}.html`);
  }

  exportCSV() {
    const rows = [['地区', '总分', '语言适配', '文化适配', '合规性', '用户体验', '问题数量']];
    
    Object.entries(this.results.results).forEach(([region, result]) => {
      const totalIssues = result.language.issues.length + 
                         result.culture.issues.length + 
                         result.compliance.issues.length + 
                         result.userExperience.issues.length;
      
      rows.push([
        result.region.name,
        result.overallScore,
        result.language.score,
        result.culture.score,
        result.compliance.score,
        result.userExperience.score,
        totalIssues
      ]);
    });

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    this.downloadFile(blob, `analysis-data-${Date.now()}.csv`);
  }

  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  showMessage(text, type = 'info') {
    // Create and show a temporary message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6b7280'};
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 3000);
  }

  // Cache management methods
  async loadCacheStats() {
    try {
      const stats = await this.cache.getCacheStats();
      if (stats) {
        this.cacheEntries.textContent = stats.totalEntries;
        this.cacheSize.textContent = stats.totalSizeFormatted;
        this.expiredEntries.textContent = stats.expiredEntries;
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  }

  async cleanupCache() {
    try {
      const cleanedCount = await this.cache.cleanupExpiredCache();
      this.showMessage(`已清理 ${cleanedCount} 个过期缓存条目`, 'success');
      this.loadCacheStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
      this.showMessage('清理缓存失败', 'error');
    }
  }

  async clearAllCache() {
    if (confirm('确定要清空所有缓存吗？此操作不可恢复。')) {
      try {
        const success = await this.cache.clearAllCache();
        if (success) {
          this.showMessage('所有缓存已清空', 'success');
          this.loadCacheStats(); // Refresh stats
        } else {
          this.showMessage('清空缓存失败', 'error');
        }
      } catch (error) {
        console.error('Failed to clear cache:', error);
        this.showMessage('清空缓存失败', 'error');
      }
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, creating OptionsController...');
  const controller = new OptionsController();
  
  // Make switchTab function globally available for onclick handlers
  window.switchTab = (tabId) => {
    console.log('Global switchTab called with:', tabId);
    controller.switchTab(tabId);
  };
  
  // Also make controller globally available for debugging
  window.optionsController = controller;
});