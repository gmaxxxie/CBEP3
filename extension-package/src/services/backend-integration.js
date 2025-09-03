/**
 * Backend Integration Service
 * 后端集成服务 - 连接Chrome扩展与REST API服务的桥梁
 */

class BackendIntegrationService {
  constructor(config = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || 'http://localhost:3000/api',
      apiKey: config.apiKey || 'demo-key-123',
      timeout: config.timeout || 30000,
      retryCount: config.retryCount || 3,
      retryDelay: config.retryDelay || 1000,
      enableCaching: config.enableCaching !== false,
      enableBatchRequests: config.enableBatchRequests !== false,
      maxConcurrentRequests: config.maxConcurrentRequests || 5,
      ...config
    };

    this.requestQueue = [];
    this.pendingRequests = new Map();
    this.ruleConfigService = null;
    this.behaviorTracker = null;
    this.requestCounter = 0;
    
    this.initialize();
  }

  /**
   * 初始化服务
   */
  async initialize() {
    console.log('Initializing Backend Integration Service...');
    
    try {
      // 测试API连接
      await this.testAPIConnection();
      
      // 初始化规则配置服务
      this.ruleConfigService = new DynamicRuleConfigurationSystem();
      
      // 初始化行为跟踪
      this.behaviorTracker = new UserBehaviorDataIntegration({
        enableRealtimeTracking: true,
        syncInterval: 300000 // 5分钟同步一次
      });

      // 订阅规则变更
      this.setupRuleSubscriptions();
      
      // 设置请求队列处理
      this.setupRequestQueue();

      console.log('Backend Integration Service initialized successfully');
      return true;
    } catch (error) {
      console.warn('Backend Integration Service failed to initialize:', error);
      return false;
    }
  }

  /**
   * 测试API连接
   */
  async testAPIConnection() {
    try {
      const response = await this.makeRequest('GET', '/health');
      if (response.status === 'healthy') {
        console.log('API connection successful');
        return true;
      }
    } catch (error) {
      console.warn('API connection test failed:', error);
      throw new Error('Failed to connect to backend API');
    }
  }

  /**
   * 执行AI分析（通过后端API）
   */
  async performAIAnalysis(contentData, targetRegions, options = {}) {
    try {
      // 记录分析开始
      await this.behaviorTracker.trackAnalysisStarted({
        type: 'ai_backend',
        regions: targetRegions,
        url: contentData.url,
        options
      });

      const startTime = Date.now();

      // 发送AI分析请求
      const response = await this.makeRequest('POST', '/analysis/ai', {
        contentData,
        targetRegions,
        options: {
          ...options,
          source: 'chrome_extension',
          version: '1.0.0'
        }
      });

      if (response.success) {
        // 轮询获取结果
        const result = await this.pollForResult(response.resultUrl, response.estimatedTime);
        
        // 记录分析完成
        await this.behaviorTracker.trackAnalysisCompleted({
          id: response.analysisId,
          duration: Date.now() - startTime,
          success: true,
          regions: targetRegions,
          overallScore: result.result?.overallScore || 0,
          issuesCount: this.countIssues(result.result)
        });

        return result.result;
      } else {
        throw new Error(response.error || 'AI analysis failed');
      }
    } catch (error) {
      console.error('AI Analysis via backend failed:', error);
      
      // 记录错误
      await this.behaviorTracker.trackError({
        type: 'ai_analysis_error',
        message: error.message,
        context: 'backend_integration'
      });

      throw error;
    }
  }

  /**
   * 批量AI分析
   */
  async performBatchAIAnalysis(requests) {
    if (!this.config.enableBatchRequests) {
      // 如果不启用批量请求，串行处理
      const results = [];
      for (const request of requests) {
        const result = await this.performAIAnalysis(
          request.contentData,
          request.targetRegions,
          request.options
        );
        results.push(result);
      }
      return results;
    }

    try {
      const response = await this.makeRequest('POST', '/analysis/ai/batch', { requests });
      
      if (response.success) {
        const result = await this.pollForResult(response.resultUrl);
        return result.result.results;
      } else {
        throw new Error(response.error || 'Batch AI analysis failed');
      }
    } catch (error) {
      console.error('Batch AI Analysis failed:', error);
      throw error;
    }
  }

  /**
   * 获取动态规则
   */
  async getDynamicRules(context = {}) {
    try {
      // 首先从本地规则服务获取
      const localRules = this.ruleConfigService.getApplicableRules(context);

      // 尝试从后端获取更新的规则
      try {
        const backendRules = await this.makeRequest('GET', '/rules', {
          region: context.region,
          category: context.category
        });

        if (backendRules.success && backendRules.rules.length > 0) {
          // 合并规则并优先使用后端规则
          return this.mergeRules(localRules, backendRules.rules);
        }
      } catch (error) {
        console.warn('Failed to fetch backend rules, using local rules:', error);
      }

      return localRules;
    } catch (error) {
      console.error('Failed to get dynamic rules:', error);
      return [];
    }
  }

  /**
   * 更新规则配置
   */
  async updateRuleConfiguration(ruleId, updates) {
    try {
      // 本地更新
      await this.ruleConfigService.updateRule(ruleId, updates);

      // 同步到后端
      const response = await this.makeRequest('PUT', `/rules/${ruleId}`, updates);
      
      if (response.success) {
        console.log(`Rule ${ruleId} updated successfully`);
        return response.rule;
      } else {
        throw new Error(response.error || 'Failed to update rule');
      }
    } catch (error) {
      console.error('Failed to update rule:', error);
      throw error;
    }
  }

  /**
   * 创建新规则
   */
  async createRule(ruleData) {
    try {
      // 本地创建
      const localRule = await this.ruleConfigService.createRule(ruleData);

      // 同步到后端
      try {
        const response = await this.makeRequest('POST', '/rules', ruleData);
        if (response.success) {
          console.log('Rule synced to backend successfully');
        }
      } catch (error) {
        console.warn('Failed to sync rule to backend:', error);
      }

      return localRule;
    } catch (error) {
      console.error('Failed to create rule:', error);
      throw error;
    }
  }

  /**
   * 记录用户行为
   */
  async trackUserBehavior(eventType, properties) {
    try {
      // 本地记录
      await this.behaviorTracker.trackEvent(eventType, properties);

      // 批量同步到后端（异步）
      this.queueBehaviorSync({
        type: eventType,
        properties,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to track user behavior:', error);
    }
  }

  /**
   * 获取用户行为洞察
   */
  async getBehaviorInsights(options = {}) {
    try {
      // 优先从本地生成洞察
      const localInsights = await this.behaviorTracker.generateBehaviorInsights();

      // 尝试从后端获取增强洞察
      try {
        const response = await this.makeRequest('GET', '/behavior/insights', options);
        if (response.success) {
          return this.mergeInsights(localInsights, response.insights);
        }
      } catch (error) {
        console.warn('Failed to get backend insights, using local insights:', error);
      }

      return localInsights;
    } catch (error) {
      console.error('Failed to get behavior insights:', error);
      return null;
    }
  }

  /**
   * 获取缓存统计
   */
  async getCacheStats() {
    try {
      const response = await this.makeRequest('GET', '/cache/stats');
      if (response.success) {
        return response.stats;
      }
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * 清除缓存
   */
  async clearCache(pattern = null) {
    try {
      const params = pattern ? { pattern } : {};
      const response = await this.makeRequest('DELETE', '/cache', params);
      
      if (response.success) {
        console.log(`Cleared ${response.cleared} cache entries`);
        return response.cleared;
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return 0;
    }
  }

  /**
   * 获取系统分析报告
   */
  async getSystemAnalytics(options = {}) {
    try {
      const response = await this.makeRequest('GET', '/analytics/system', options);
      if (response.success) {
        return response.report;
      }
    } catch (error) {
      console.warn('Failed to get system analytics:', error);
      return null;
    }
  }

  /**
   * 发送HTTP请求
   */
  async makeRequest(method, endpoint, data = null, options = {}) {
    const requestId = ++this.requestCounter;
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    console.log(`[${requestId}] ${method} ${endpoint}`);

    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        ...options.headers
      },
      ...options
    };

    if (data) {
      if (method === 'GET') {
        // GET请求将数据作为查询参数
        const params = new URLSearchParams(data);
        url += (url.includes('?') ? '&' : '?') + params.toString();
      } else {
        requestOptions.body = JSON.stringify(data);
      }
    }

    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    requestOptions.signal = controller.signal;

    try {
      const response = await this.executeWithRetry(async () => {
        const res = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        return await res.json();
      });

      console.log(`[${requestId}] Success`);
      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[${requestId}] Failed:`, error.message);
      throw error;
    }
  }

  /**
   * 带重试的请求执行
   */
  async executeWithRetry(requestFn) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (attempt < this.config.retryCount) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${this.config.retryCount})`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 轮询获取结果
   */
  async pollForResult(resultUrl, estimatedTime = 5000) {
    const maxAttempts = Math.ceil(Math.max(estimatedTime, 10000) / 2000); // 每2秒轮询一次
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(this.config.apiBaseUrl.replace('/api', '') + resultUrl, {
          headers: {
            'X-API-Key': this.config.apiKey
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.status === 'completed') {
            return result;
          } else if (result.error) {
            throw new Error(result.error);
          }
        }

        // 等待后重试
        if (attempt < maxAttempts) {
          await this.sleep(2000);
        }
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error('Timeout waiting for analysis result');
        }
        await this.sleep(2000);
      }
    }

    throw new Error('Failed to get analysis result after maximum attempts');
  }

  /**
   * 设置规则订阅
   */
  setupRuleSubscriptions() {
    // 订阅规则变更事件
    this.ruleConfigService.subscribe('ruleUpdated', async (rule) => {
      console.log('Rule updated:', rule.id);
      // 可以在这里触发UI更新或其他操作
    });

    this.ruleConfigService.subscribe('ruleCreated', async (rule) => {
      console.log('Rule created:', rule.id);
    });
  }

  /**
   * 设置请求队列处理
   */
  setupRequestQueue() {
    // 定期处理请求队列
    setInterval(() => {
      this.processRequestQueue();
    }, 10000); // 每10秒处理一次队列
  }

  /**
   * 队列行为同步
   */
  queueBehaviorSync(behaviorData) {
    this.requestQueue.push({
      type: 'behavior',
      data: behaviorData,
      timestamp: Date.now()
    });
  }

  /**
   * 处理请求队列
   */
  async processRequestQueue() {
    if (this.requestQueue.length === 0) return;

    const behaviorEvents = this.requestQueue
      .filter(item => item.type === 'behavior')
      .map(item => item.data)
      .slice(0, 100); // 限制批量大小

    if (behaviorEvents.length > 0) {
      try {
        await this.makeRequest('POST', '/behavior/track/batch', {
          behaviors: behaviorEvents
        });

        // 移除已处理的事件
        this.requestQueue = this.requestQueue.filter(item => 
          item.type !== 'behavior' || 
          !behaviorEvents.includes(item.data)
        );

        console.log(`Synced ${behaviorEvents.length} behavior events to backend`);
      } catch (error) {
        console.error('Failed to sync behavior events:', error);
      }
    }
  }

  /**
   * 合并规则
   */
  mergeRules(localRules, backendRules) {
    const merged = [...localRules];
    const localRuleIds = new Set(localRules.map(rule => rule.id));

    // 添加后端独有的规则
    backendRules.forEach(rule => {
      if (!localRuleIds.has(rule.id)) {
        merged.push(rule);
      } else {
        // 更新本地规则（后端规则优先）
        const index = merged.findIndex(r => r.id === rule.id);
        if (index !== -1) {
          merged[index] = { ...merged[index], ...rule };
        }
      }
    });

    return merged;
  }

  /**
   * 合并洞察
   */
  mergeInsights(localInsights, backendInsights) {
    return {
      ...localInsights,
      ...backendInsights,
      source: 'hybrid',
      localData: localInsights,
      backendData: backendInsights
    };
  }

  /**
   * 计算问题数量
   */
  countIssues(analysisResult) {
    if (!analysisResult || !analysisResult.results) return 0;
    
    let totalIssues = 0;
    Object.values(analysisResult.results).forEach(regionResult => {
      ['language', 'culture', 'compliance', 'userExperience'].forEach(category => {
        if (regionResult[category] && regionResult[category].issues) {
          totalIssues += regionResult[category].issues.length;
        }
      });
    });
    
    return totalIssues;
  }

  /**
   * 获取连接状态
   */
  async getConnectionStatus() {
    try {
      await this.testAPIConnection();
      return {
        connected: true,
        apiUrl: this.config.apiBaseUrl,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * 获取服务统计
   */
  getServiceStats() {
    return {
      requestCounter: this.requestCounter,
      queueLength: this.requestQueue.length,
      pendingRequests: this.pendingRequests.size,
      config: {
        apiBaseUrl: this.config.apiBaseUrl,
        timeout: this.config.timeout,
        retryCount: this.config.retryCount,
        enableCaching: this.config.enableCaching,
        enableBatchRequests: this.config.enableBatchRequests
      }
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('Backend integration config updated');
  }

  // 辅助方法
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理资源
   */
  cleanup() {
    // 清理待处理的请求
    this.pendingRequests.clear();
    
    // 清理请求队列
    this.requestQueue = [];
    
    console.log('Backend Integration Service cleaned up');
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackendIntegrationService;
} else {
  window.BackendIntegrationService = BackendIntegrationService;
}