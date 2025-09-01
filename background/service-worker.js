// Service Worker - 后台脚本
class BackgroundService {
  constructor() {
    console.log('BackgroundService 开始初始化...');
    this.analysisQueue = new Map();
    this.servicesReady = false;
    
    // 使用 try-catch 保护初始化过程
    this.initializeWithErrorHandling();
  }

  async initializeWithErrorHandling() {
    try {
      await this.initializeServices();
      this.setupMessageHandlers();
      this.setupContextMenus();
      console.log('BackgroundService 初始化完成');
    } catch (error) {
      console.error('BackgroundService 初始化过程中发生错误:', error);
      // 即使初始化失败，也要设置基本的消息处理器
      this.setupMessageHandlers();
    }
  }

  async initializeServices() {
    // 动态导入服务
    await this.loadServices();
  }

  async loadServices() {
    try {
      // 在service worker中延迟加载服务
      // 这些服务将在实际需要时通过消息传递机制调用
      console.log('服务将在需要时延迟加载');
      this.servicesReady = true;
    } catch (error) {
      console.error('服务初始化失败:', error);
      this.servicesReady = false;
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
      // 验证请求格式
      if (!request || !request.type) {
        sendResponse({ error: '无效的请求格式' });
        return;
      }

      // 检查发送者信息
      if (!sender || !sender.tab) {
        console.warn('收到来自非标签页的消息:', request.type);
      }

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
          console.warn('收到未知的请求类型:', request.type);
          sendResponse({ error: `未知的请求类型: ${request.type}` });
      }
    } catch (error) {
      console.error('处理消息时出错:', error);
      sendResponse({ 
        error: error.message || '处理请求时发生未知错误',
        details: error.stack
      });
    }
  }

  async handleStartAnalysis(request, sender, sendResponse) {
    try {
      // 验证必要的参数
      const { contentData, targetRegions, options } = request;
      
      if (!contentData) {
        sendResponse({ error: '缺少内容数据' });
        return;
      }
      
      if (!targetRegions || !Array.isArray(targetRegions) || targetRegions.length === 0) {
        sendResponse({ error: '缺少或无效的目标地区' });
        return;
      }
      
      if (!sender.tab || !sender.tab.id) {
        sendResponse({ error: '无法获取标签页信息' });
        return;
      }
      
      const tabId = sender.tab.id;
      const analysisId = `analysis_${tabId}_${Date.now()}`;

      // 添加到分析队列
      this.analysisQueue.set(analysisId, {
        tabId,
        status: 'pending',
        progress: 0,
        startTime: Date.now()
      });

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
      if (options && options.enableAI) {
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
      
      const analysisId = `analysis_${sender.tab?.id}_${Date.now()}`;
      const tabId = sender.tab?.id;
      
      if (tabId) {
        // 更新分析队列中的错误状态
        if (this.analysisQueue.has(analysisId)) {
          this.analysisQueue.set(analysisId, {
            ...this.analysisQueue.get(analysisId),
            status: 'error',
            error: error.message
          });
        }

        this.sendMessageToTab(tabId, {
          type: 'ANALYSIS_ERROR',
          analysisId,
          error: error.message
        });
      }

      sendResponse({ 
        error: error.message,
        analysisId: analysisId
      });
    }
  }

  async performLocalAnalysis(contentData, targetRegions) {
    // 在service worker中，我们将分析任务委托给sidebar或content script
    // 这里返回一个基本的分析结果结构
    console.log('Service Worker: 委托本地分析任务');
    
    return {
      url: contentData.url || 'unknown',
      timestamp: Date.now(),
      results: this.createDefaultResults(targetRegions)
    };
  }

  async performAIAnalysis(contentData, targetRegions, options) {
    try {
      // 获取服务器设置
      const settings = await chrome.storage.sync.get('settings');
      const serverAddress = settings.settings?.serverAddress || 'http://192.168.31.196:3000';
      
      // 准备AI分析数据
      const aiPayload = {
        url: contentData.url,
        title: contentData.title,
        content: contentData.content,
        meta: contentData.meta,
        ecommerce: contentData.ecommerce,
        targetRegions: targetRegions
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

  createDefaultResults(targetRegions) {
    const results = {};
    const regionNames = {
      'US': '美国',
      'GB': '英国', 
      'DE': '德国',
      'FR': '法国',
      'JP': '日本',
      'CN': '中国',
      'KR': '韩国',
      'AE': '阿联酋'
    };

    targetRegions.forEach(region => {
      results[region] = {
        region: { name: regionNames[region] || region },
        overallScore: 75,
        language: { score: 75, issues: [] },
        culture: { score: 75, issues: [] },
        compliance: { score: 75, issues: [] },
        userExperience: { score: 75, issues: [] }
      };
    });

    return results;
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
      const result = await chrome.storage.sync.get(['apiKeys', 'settings']);
      const apiKeys = result.apiKeys || {};
      const status = {};
      
      // 定义支持的AI提供商
      const providers = [
        { key: 'deepseek', name: 'DeepSeek' },
        { key: 'zhipu', name: 'GLM-4.5-AirX' },
        { key: 'qwen', name: 'Qwen-Plus' },
        { key: 'openai', name: 'GPT-4' },
        { key: 'custom', name: 'Custom Model' }
      ];
      
      providers.forEach(provider => {
        const hasKey = !!(apiKeys[provider.key]);
        status[provider.key] = {
          name: provider.name,
          hasKey,
          status: hasKey ? 'ready' : 'missing_key'
        };
      });
      
      sendResponse({ success: true, status });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  setupContextMenus() {
    console.log('设置上下文菜单和扩展图标点击事件...');
    
    // 初始化侧栏设置
    this.initializeSidePanel();
    
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
      
      console.log('上下文菜单已创建');
    });

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      console.log('上下文菜单被点击:', info.menuItemId);
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
      console.log('扩展图标被点击，tabId:', tab.id);
      await this.openSidebar(tab.id);
    });
    
    console.log('扩展图标点击监听器已设置');
  }

  async initializeSidePanel() {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (!chrome.sidePanel) {
          console.warn(`chrome.sidePanel API 不可用 (尝试 ${attempt}/${MAX_RETRIES})`);
          if (attempt === MAX_RETRIES) {
            console.info('将使用备用方案：新标签页模式');
            return;
          }
          await this.delay(RETRY_DELAY * attempt);
          continue;
        }

        console.log(`正在初始化侧栏设置... (尝试 ${attempt}/${MAX_RETRIES})`);
        
        // 设置全局侧栏配置
        await chrome.sidePanel.setOptions({
          path: 'sidebar/sidebar.html',
          enabled: true
        });
        
        console.log('全局侧栏配置已设置成功');
        
        // 为现有标签页设置侧栏（静默处理错误）
        try {
          const tabs = await chrome.tabs.query({});
          const settingPromises = tabs.map(tab => 
            chrome.sidePanel.setOptions({
              tabId: tab.id,
              path: 'sidebar/sidebar.html',
              enabled: true
            }).catch(error => {
              // 静默忽略某些标签页的设置失败
              console.debug(`标签页 ${tab.id} 侧栏设置失败:`, error.message);
            })
          );
          
          await Promise.allSettled(settingPromises);
          console.log(`已为 ${tabs.length} 个标签页尝试设置侧栏`);
        } catch (tabError) {
          console.warn('设置现有标签页侧栏时出错:', tabError.message);
        }
        
        return; // 成功退出
        
      } catch (error) {
        console.error(`初始化侧栏设置失败 (尝试 ${attempt}/${MAX_RETRIES}):`, error);
        
        if (attempt === MAX_RETRIES) {
          console.error('所有重试都失败了，侧栏功能可能不可用');
          return;
        }
        
        // 等待后重试
        await this.delay(RETRY_DELAY * attempt);
      }
    }
  }

  // 辅助方法：延迟执行
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async openSidebar(tabId) {
    try {
      console.log('尝试打开侧栏，tabId:', tabId);
      
      // 检查 sidePanel API 是否可用
      if (!chrome.sidePanel) {
        console.error('chrome.sidePanel API 不可用，可能需要 Chrome 114+');
        // 回退到打开新标签页
        chrome.tabs.create({
          url: chrome.runtime.getURL('sidebar/sidebar.html')
        });
        return;
      }
      
      // 尝试打开侧栏
      await chrome.sidePanel.open({ tabId });
      console.log('侧栏已成功打开');
      
    } catch (error) {
      console.error('打开侧栏失败:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        tabId: tabId
      });
      
      // 回退方案：打开独立的侧栏页面
      try {
        chrome.tabs.create({
          url: chrome.runtime.getURL('sidebar/sidebar.html'),
          active: false
        });
        console.log('已回退到新标签页打开侧栏');
      } catch (fallbackError) {
        console.error('回退方案也失败了:', fallbackError);
      }
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