// Service Worker - 后台脚本
class BackgroundService {
  constructor() {
    this.aiService = null;
    this.localRuleEngine = null;
    this.analysisQueue = new Map();
    
    this.initializeServices();
    this.setupMessageHandlers();
    this.setupContextMenus();
  }

  async initializeServices() {
    // 动态导入服务
    await this.loadServices();
  }

  async loadServices() {
    try {
      // 注意：在service worker中需要使用importScripts或动态import
      // 这里模拟加载过程
      this.aiService = new AIAnalysisService();
      this.localRuleEngine = new LocalRuleEngine();
    } catch (error) {
      console.error('服务初始化失败:', error);
    }
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 保持消息通道开启以支持异步响应
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.type) {
        case 'START_ANALYSIS':
          await this.handleStartAnalysis(request, sender, sendResponse);
          break;
          
        case 'GET_ANALYSIS_STATUS':
          this.handleGetAnalysisStatus(request, sendResponse);
          break;
          
        case 'CANCEL_ANALYSIS':
          this.handleCancelAnalysis(request, sendResponse);
          break;
          
        case 'UPDATE_SETTINGS':
          await this.handleUpdateSettings(request, sendResponse);
          break;
          
        case 'GET_API_STATUS':
          await this.handleGetAPIStatus(request, sendResponse);
          break;
          
        default:
          sendResponse({ error: '未知的请求类型' });
      }
    } catch (error) {
      console.error('处理消息时出错:', error);
      sendResponse({ error: error.message });
    }
  }

  async handleStartAnalysis(request, sender, sendResponse) {
    const { contentData, targetRegions, options } = request;
    const tabId = sender.tab.id;
    const analysisId = `analysis_${tabId}_${Date.now()}`;

    // 添加到分析队列
    this.analysisQueue.set(analysisId, {
      tabId,
      status: 'pending',
      progress: 0,
      startTime: Date.now()
    });

    try {
      // 发送分析开始通知
      this.sendMessageToTab(tabId, {
        type: 'ANALYSIS_PROGRESS',
        analysisId,
        progress: 5,
        status: '开始分析...'
      });

      // 执行本地规则分析
      this.updateAnalysisProgress(analysisId, 20, '执行本地规则分析...');
      const localResults = await this.performLocalAnalysis(contentData, targetRegions);

      // 执行AI分析（如果启用）
      let aiResults = null;
      if (options.enableAI) {
        this.updateAnalysisProgress(analysisId, 60, '执行AI深度分析...');
        aiResults = await this.performAIAnalysis(contentData, targetRegions, options);
      }

      // 合并结果
      this.updateAnalysisProgress(analysisId, 90, '合并分析结果...');
      const finalResults = this.mergeAnalysisResults(localResults, aiResults);

      // 分析完成
      this.updateAnalysisProgress(analysisId, 100, '分析完成');
      this.analysisQueue.delete(analysisId);

      // 发送完成通知
      this.sendMessageToTab(tabId, {
        type: 'ANALYSIS_COMPLETE',
        analysisId,
        results: finalResults
      });

      sendResponse({ success: true, analysisId, results: finalResults });

    } catch (error) {
      console.error('分析过程中出现错误:', error);
      
      this.analysisQueue.set(analysisId, {
        ...this.analysisQueue.get(analysisId),
        status: 'error',
        error: error.message
      });

      this.sendMessageToTab(tabId, {
        type: 'ANALYSIS_ERROR',
        analysisId,
        error: error.message
      });

      sendResponse({ error: error.message });
    }
  }

  async performLocalAnalysis(contentData, targetRegions) {
    if (!this.localRuleEngine) {
      // 如果服务未初始化，重新加载
      await this.loadServices();
    }

    return this.localRuleEngine.analyze(contentData, targetRegions);
  }

  async performAIAnalysis(contentData, targetRegions, options) {
    if (!this.aiService) {
      await this.loadServices();
    }

    return await this.aiService.analyze(contentData, targetRegions, options);
  }

  mergeAnalysisResults(localResults, aiResults) {
    if (!aiResults) {
      return localResults;
    }

    const mergedResults = JSON.parse(JSON.stringify(localResults));
    
    Object.keys(mergedResults.results).forEach(region => {
      const localRegionResult = mergedResults.results[region];
      const aiRegionResult = aiResults.results[region];
      
      if (aiRegionResult) {
        // 合并评分（加权平均）
        const weights = { local: 0.4, ai: 0.6 };
        
        localRegionResult.language.score = Math.round(
          localRegionResult.language.score * weights.local +
          aiRegionResult.language.score * weights.ai
        );
        
        localRegionResult.culture.score = Math.round(
          localRegionResult.culture.score * weights.local +
          aiRegionResult.culture.score * weights.ai
        );
        
        localRegionResult.compliance.score = Math.round(
          localRegionResult.compliance.score * weights.local +
          aiRegionResult.compliance.score * weights.ai
        );
        
        localRegionResult.userExperience.score = Math.round(
          localRegionResult.userExperience.score * weights.local +
          aiRegionResult.userExperience.score * weights.ai
        );

        // 合并问题和建议
        if (aiRegionResult.language.issues) {
          localRegionResult.language.issues = [
            ...new Set([...localRegionResult.language.issues, ...aiRegionResult.language.issues])
          ];
        }
        
        if (aiRegionResult.culture.issues) {
          localRegionResult.culture.issues = [
            ...new Set([...localRegionResult.culture.issues, ...aiRegionResult.culture.issues])
          ];
        }
        
        if (aiRegionResult.compliance.issues) {
          localRegionResult.compliance.issues = [
            ...new Set([...localRegionResult.compliance.issues, ...aiRegionResult.compliance.issues])
          ];
        }
        
        if (aiRegionResult.userExperience.issues) {
          localRegionResult.userExperience.issues = [
            ...new Set([...localRegionResult.userExperience.issues, ...aiRegionResult.userExperience.issues])
          ];
        }

        // 添加AI建议
        localRegionResult.aiSuggestions = {
          language: aiRegionResult.language.suggestions || [],
          culture: aiRegionResult.culture.suggestions || [],
          compliance: aiRegionResult.compliance.suggestions || [],
          userExperience: aiRegionResult.userExperience.suggestions || []
        };

        // 重新计算总体评分
        localRegionResult.overallScore = this.calculateOverallScore(localRegionResult);
        
        // 标记为AI增强
        localRegionResult.aiEnhanced = true;
      }
    });

    mergedResults.aiProvider = aiResults.provider;
    return mergedResults;
  }

  calculateOverallScore(regionResult) {
    const weights = {
      language: 0.3,
      culture: 0.25,
      compliance: 0.25,
      userExperience: 0.2
    };

    return Math.round(
      regionResult.language.score * weights.language +
      regionResult.culture.score * weights.culture +
      regionResult.compliance.score * weights.compliance +
      regionResult.userExperience.score * weights.userExperience
    );
  }

  updateAnalysisProgress(analysisId, progress, status) {
    const analysis = this.analysisQueue.get(analysisId);
    if (analysis) {
      analysis.progress = progress;
      analysis.status = status;
      
      this.sendMessageToTab(analysis.tabId, {
        type: 'ANALYSIS_PROGRESS',
        analysisId,
        progress,
        status
      });
    }
  }

  sendMessageToTab(tabId, message) {
    chrome.tabs.sendMessage(tabId, message).catch(error => {
      console.warn('发送消息到标签页失败:', error);
    });
  }

  handleGetAnalysisStatus(request, sendResponse) {
    const { analysisId } = request;
    const analysis = this.analysisQueue.get(analysisId);
    
    if (analysis) {
      sendResponse({
        success: true,
        status: analysis.status,
        progress: analysis.progress
      });
    } else {
      sendResponse({ error: '未找到分析任务' });
    }
  }

  handleCancelAnalysis(request, sendResponse) {
    const { analysisId } = request;
    
    if (this.analysisQueue.has(analysisId)) {
      this.analysisQueue.delete(analysisId);
      sendResponse({ success: true });
    } else {
      sendResponse({ error: '未找到要取消的分析任务' });
    }
  }

  async handleUpdateSettings(request, sendResponse) {
    try {
      const { settings } = request;
      await chrome.storage.sync.set({ settings });
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  async handleGetAPIStatus(request, sendResponse) {
    try {
      const apiKeys = await chrome.storage.sync.get('apiKeys');
      const status = {};
      
      if (this.aiService) {
        const providers = this.aiService.getAvailableProviders();
        
        for (const provider of providers) {
          const hasKey = !!(apiKeys.apiKeys && apiKeys.apiKeys[provider.key]);
          status[provider.key] = {
            name: provider.name,
            hasKey,
            status: hasKey ? 'ready' : 'missing_key'
          };
        }
      }
      
      sendResponse({ success: true, status });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  setupContextMenus() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'open-sidebar',
        title: '打开分析侧栏',
        contexts: ['page']
      });
      
      chrome.contextMenus.create({
        id: 'analyze-page',
        title: '分析页面地域适配性',
        contexts: ['page']
      });
      
      chrome.contextMenus.create({
        id: 'analyze-selection',
        title: '分析选中内容适配性',
        contexts: ['selection']
      });
    });

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (info.menuItemId === 'open-sidebar') {
        // 打开侧栏
        await this.openSidebar(tab.id);
      } else if (info.menuItemId === 'analyze-page') {
        // 打开侧栏并开始分析
        await this.openSidebarAndAnalyze(tab.id);
      } else if (info.menuItemId === 'analyze-selection') {
        // 分析选中内容
        this.analyzeSelection(info, tab);
      }
    });

    // 处理扩展图标点击 - 打开侧栏而不是popup
    chrome.action.onClicked.addListener(async (tab) => {
      await this.openSidebar(tab.id);
    });
  }

  async openSidebar(tabId) {
    try {
      await chrome.sidePanel.open({ tabId });
      console.log('侧栏已打开');
    } catch (error) {
      console.error('打开侧栏失败:', error);
      // 回退到打开新标签页
      chrome.tabs.create({
        url: chrome.runtime.getURL('sidebar/sidebar.html')
      });
    }
  }

  async openSidebarAndAnalyze(tabId) {
    try {
      await this.openSidebar(tabId);
      // 等待侧栏加载后发送分析消息
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'START_AUTO_ANALYSIS',
          tabId: tabId
        });
      }, 1000);
    } catch (error) {
      console.error('打开侧栏并分析失败:', error);
    }
  }

  async analyzeSelection(info, tab) {
    try {
      const selectionData = {
        text: info.selectionText,
        url: tab.url,
        title: tab.title
      };

      // 发送到content script进行处理
      chrome.tabs.sendMessage(tab.id, {
        type: 'ANALYZE_SELECTION',
        data: selectionData
      });
    } catch (error) {
      console.error('分析选中内容时出错:', error);
    }
  }

  // 处理扩展安装和更新
  handleInstalled() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        // 首次安装
        this.showWelcomePage();
      } else if (details.reason === 'update') {
        // 更新
        this.handleUpdate(details.previousVersion);
      }
    });
  }

  showWelcomePage() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/options.html?welcome=true')
    });
  }

  handleUpdate(previousVersion) {
    console.log(`扩展从 ${previousVersion} 更新到 ${chrome.runtime.getManifest().version}`);
    // 处理更新逻辑
  }
}

// 初始化后台服务
const backgroundService = new BackgroundService();
backgroundService.handleInstalled();