/**
 * User Behavior Data Integration System
 * 用户行为数据集成系统 - 收集、分析和洞察用户行为模式
 */

class UserBehaviorDataIntegration {
  constructor(options = {}) {
    this.config = {
      storageType: options.storageType || 'indexedDB', // localStorage, indexedDB, remote
      maxLocalEvents: options.maxLocalEvents || 10000,
      syncInterval: options.syncInterval || 300000, // 5分钟
      enableRealtimeTracking: options.enableRealtimeTracking || true,
      privacyCompliant: options.privacyCompliant || true,
      anonymizeData: options.anonymizeData || true,
      retentionPeriod: options.retentionPeriod || 90, // 天
      ...options
    };

    this.storage = null;
    this.eventQueue = [];
    this.sessionData = null;
    this.userProfile = null;
    this.behaviorPatterns = new Map();
    this.insights = new Map();
    
    this.eventTypes = this.initializeEventTypes();
    this.metrics = this.initializeMetrics();
    
    this.initialize();
  }

  /**
   * 初始化系统
   */
  async initialize() {
    console.log('Initializing User Behavior Data Integration...');
    
    // 初始化存储
    await this.initializeStorage();
    
    // 初始化用户会话
    await this.initializeSession();
    
    // 加载用户配置文件
    await this.loadUserProfile();
    
    // 设置自动同步
    this.setupAutoSync();
    
    // 设置隐私控制
    this.setupPrivacyControls();

    console.log('User Behavior Data Integration initialized');
  }

  /**
   * 初始化事件类型
   */
  initializeEventTypes() {
    return {
      // 页面交互事件
      pageView: {
        name: 'page_view',
        properties: ['url', 'title', 'referrer', 'timestamp', 'region', 'language']
      },
      pageExit: {
        name: 'page_exit', 
        properties: ['url', 'duration', 'scrollDepth', 'interactions']
      },
      
      // 分析相关事件
      analysisStarted: {
        name: 'analysis_started',
        properties: ['analysisType', 'regions', 'url', 'timestamp']
      },
      analysisCompleted: {
        name: 'analysis_completed',
        properties: ['analysisId', 'duration', 'resultsViewed', 'regionsAnalyzed']
      },
      reportGenerated: {
        name: 'report_generated',
        properties: ['reportType', 'format', 'regions', 'timestamp']
      },
      reportDownloaded: {
        name: 'report_downloaded',
        properties: ['reportId', 'format', 'size']
      },

      // 功能使用事件
      regionSelected: {
        name: 'region_selected',
        properties: ['region', 'previousRegion', 'source']
      },
      settingsChanged: {
        name: 'settings_changed',
        properties: ['settingType', 'oldValue', 'newValue']
      },
      featureUsed: {
        name: 'feature_used',
        properties: ['featureName', 'context', 'success']
      },

      // 错误和性能事件
      errorOccurred: {
        name: 'error_occurred',
        properties: ['errorType', 'errorMessage', 'context', 'timestamp']
      },
      performanceMetric: {
        name: 'performance_metric',
        properties: ['metricType', 'value', 'context', 'timestamp']
      },

      // 用户反馈事件
      feedbackSubmitted: {
        name: 'feedback_submitted',
        properties: ['type', 'rating', 'category', 'timestamp']
      },
      recommendationInteracted: {
        name: 'recommendation_interacted',
        properties: ['recommendationId', 'action', 'category']
      }
    };
  }

  /**
   * 初始化指标
   */
  initializeMetrics() {
    return {
      totalEvents: 0,
      sessionsTracked: 0,
      analysesPerformed: 0,
      reportsGenerated: 0,
      errorsLogged: 0,
      lastSyncTime: null,
      storageUsage: 0
    };
  }

  /**
   * 初始化存储
   */
  async initializeStorage() {
    if (this.config.storageType === 'indexedDB') {
      this.storage = new BehaviorIndexedDBStorage();
    } else {
      this.storage = new BehaviorLocalStorage();
    }
    
    await this.storage.initialize();
  }

  /**
   * 初始化用户会话
   */
  async initializeSession() {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();
    
    this.sessionData = {
      sessionId,
      startTime: now,
      lastActivityTime: now,
      pageViews: 0,
      analysesPerformed: 0,
      reportsGenerated: 0,
      userAgent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };

    // 保存会话数据
    await this.storage.setSession(this.sessionData);
  }

  /**
   * 加载用户配置文件
   */
  async loadUserProfile() {
    try {
      this.userProfile = await this.storage.getUserProfile();
      
      if (!this.userProfile) {
        // 创建新的用户配置文件
        this.userProfile = {
          userId: this.generateUserId(),
          createdAt: new Date().toISOString(),
          preferences: {},
          behaviorSummary: {
            totalSessions: 0,
            totalAnalyses: 0,
            favoriteRegions: [],
            mostUsedFeatures: [],
            avgSessionDuration: 0
          }
        };
        
        await this.storage.setUserProfile(this.userProfile);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      this.userProfile = { userId: this.generateUserId() };
    }
  }

  /**
   * 记录事件
   */
  async trackEvent(eventType, properties = {}) {
    if (!this.eventTypes[eventType]) {
      console.warn(`Unknown event type: ${eventType}`);
      return;
    }

    const event = {
      id: this.generateEventId(),
      type: eventType,
      sessionId: this.sessionData.sessionId,
      userId: this.userProfile.userId,
      timestamp: new Date().toISOString(),
      properties: this.sanitizeProperties(properties),
      url: window.location?.href,
      userAgent: navigator.userAgent
    };

    // 添加到事件队列
    this.eventQueue.push(event);
    this.metrics.totalEvents++;

    // 实时处理（如果启用）
    if (this.config.enableRealtimeTracking) {
      await this.processEventRealtime(event);
    }

    // 批量存储
    if (this.eventQueue.length >= 50) {
      await this.flushEvents();
    }

    // 更新会话数据
    await this.updateSessionActivity();

    return event.id;
  }

  /**
   * 批量记录事件
   */
  async trackEvents(events) {
    const processedEvents = [];
    
    for (const eventData of events) {
      const eventId = await this.trackEvent(eventData.type, eventData.properties);
      processedEvents.push(eventId);
    }

    return processedEvents;
  }

  /**
   * 记录页面访问
   */
  async trackPageView(pageData = {}) {
    const properties = {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      region: pageData.region,
      language: document.documentElement.lang,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      ...pageData
    };

    await this.trackEvent('pageView', properties);
    this.sessionData.pageViews++;
  }

  /**
   * 记录分析开始
   */
  async trackAnalysisStarted(analysisData) {
    const properties = {
      analysisType: analysisData.type,
      regions: analysisData.regions,
      url: analysisData.url,
      options: analysisData.options
    };

    return await this.trackEvent('analysisStarted', properties);
  }

  /**
   * 记录分析完成
   */
  async trackAnalysisCompleted(analysisData) {
    const properties = {
      analysisId: analysisData.id,
      duration: analysisData.duration,
      success: analysisData.success,
      regionsAnalyzed: analysisData.regions,
      overallScore: analysisData.overallScore,
      issuesFound: analysisData.issuesCount
    };

    await this.trackEvent('analysisCompleted', properties);
    this.sessionData.analysesPerformed++;
    this.metrics.analysesPerformed++;
  }

  /**
   * 记录报告生成
   */
  async trackReportGenerated(reportData) {
    const properties = {
      reportType: reportData.type,
      format: reportData.format,
      regions: reportData.regions,
      size: reportData.size,
      analysisId: reportData.analysisId
    };

    await this.trackEvent('reportGenerated', properties);
    this.sessionData.reportsGenerated++;
    this.metrics.reportsGenerated++;
  }

  /**
   * 记录错误
   */
  async trackError(errorData) {
    const properties = {
      errorType: errorData.type,
      errorMessage: errorData.message,
      errorStack: errorData.stack,
      context: errorData.context,
      severity: errorData.severity || 'error'
    };

    await this.trackEvent('errorOccurred', properties);
    this.metrics.errorsLogged++;
  }

  /**
   * 记录用户反馈
   */
  async trackUserFeedback(feedbackData) {
    const properties = {
      type: feedbackData.type,
      rating: feedbackData.rating,
      category: feedbackData.category,
      comment: feedbackData.comment,
      context: feedbackData.context
    };

    return await this.trackEvent('feedbackSubmitted', properties);
  }

  /**
   * 实时事件处理
   */
  async processEventRealtime(event) {
    try {
      // 更新行为模式
      await this.updateBehaviorPatterns(event);
      
      // 检测异常行为
      await this.detectAnomalies(event);
      
      // 更新用户画像
      await this.updateUserProfile(event);
      
    } catch (error) {
      console.error('Realtime event processing failed:', error);
    }
  }

  /**
   * 更新行为模式
   */
  async updateBehaviorPatterns(event) {
    const patternKey = `${event.type}_patterns`;
    let patterns = this.behaviorPatterns.get(patternKey) || {
      frequency: {},
      timing: [],
      contexts: {}
    };

    // 更新频率统计
    const hour = new Date(event.timestamp).getHours();
    patterns.frequency[hour] = (patterns.frequency[hour] || 0) + 1;

    // 更新时间模式
    patterns.timing.push(new Date(event.timestamp).getTime());
    if (patterns.timing.length > 100) {
      patterns.timing = patterns.timing.slice(-100);
    }

    // 更新上下文模式
    if (event.properties.context) {
      patterns.contexts[event.properties.context] = 
        (patterns.contexts[event.properties.context] || 0) + 1;
    }

    this.behaviorPatterns.set(patternKey, patterns);
  }

  /**
   * 检测异常行为
   */
  async detectAnomalies(event) {
    // 检测异常高频操作
    const recentEvents = this.eventQueue.filter(e => 
      e.type === event.type && 
      Date.now() - new Date(e.timestamp).getTime() < 60000 // 1分钟内
    );

    if (recentEvents.length > 20) {
      await this.trackEvent('anomalyDetected', {
        anomalyType: 'high_frequency',
        eventType: event.type,
        frequency: recentEvents.length,
        timeWindow: '1min'
      });
    }

    // 检测错误模式
    if (event.type === 'errorOccurred') {
      const recentErrors = this.eventQueue.filter(e => 
        e.type === 'errorOccurred' && 
        Date.now() - new Date(e.timestamp).getTime() < 300000 // 5分钟内
      );

      if (recentErrors.length > 5) {
        await this.trackEvent('anomalyDetected', {
          anomalyType: 'error_spike',
          errorCount: recentErrors.length,
          timeWindow: '5min'
        });
      }
    }
  }

  /**
   * 更新用户画像
   */
  async updateUserProfile(event) {
    if (!this.userProfile.behaviorSummary) {
      this.userProfile.behaviorSummary = {
        totalSessions: 0,
        totalAnalyses: 0,
        favoriteRegions: [],
        mostUsedFeatures: [],
        avgSessionDuration: 0
      };
    }

    // 更新偏好地区
    if (event.properties.region || event.properties.regions) {
      const regions = event.properties.regions || [event.properties.region];
      regions.forEach(region => {
        const existing = this.userProfile.behaviorSummary.favoriteRegions.find(r => r.code === region);
        if (existing) {
          existing.count++;
        } else {
          this.userProfile.behaviorSummary.favoriteRegions.push({ code: region, count: 1 });
        }
      });

      // 排序并限制数量
      this.userProfile.behaviorSummary.favoriteRegions
        .sort((a, b) => b.count - a.count)
        .splice(10); // 保留前10个
    }

    // 更新最常用功能
    if (event.type === 'featureUsed') {
      const feature = event.properties.featureName;
      const existing = this.userProfile.behaviorSummary.mostUsedFeatures.find(f => f.name === feature);
      if (existing) {
        existing.count++;
      } else {
        this.userProfile.behaviorSummary.mostUsedFeatures.push({ name: feature, count: 1 });
      }

      this.userProfile.behaviorSummary.mostUsedFeatures
        .sort((a, b) => b.count - a.count)
        .splice(15);
    }

    // 定期保存用户画像
    if (this.metrics.totalEvents % 25 === 0) {
      await this.storage.setUserProfile(this.userProfile);
    }
  }

  /**
   * 刷新事件到存储
   */
  async flushEvents() {
    if (this.eventQueue.length === 0) return;

    try {
      await this.storage.saveEvents(this.eventQueue);
      console.log(`Flushed ${this.eventQueue.length} events to storage`);
      this.eventQueue = [];
    } catch (error) {
      console.error('Failed to flush events:', error);
      
      // 如果存储失败，保留最近的事件
      if (this.eventQueue.length > this.config.maxLocalEvents) {
        this.eventQueue = this.eventQueue.slice(-this.config.maxLocalEvents / 2);
      }
    }
  }

  /**
   * 生成用户行为洞察
   */
  async generateBehaviorInsights() {
    const insights = {
      generatedAt: new Date().toISOString(),
      userId: this.userProfile.userId,
      sessionInsights: await this.generateSessionInsights(),
      usagePatterns: await this.generateUsagePatterns(),
      preferenceInsights: await this.generatePreferenceInsights(),
      performanceInsights: await this.generatePerformanceInsights(),
      recommendations: await this.generatePersonalizedRecommendations()
    };

    this.insights.set('latest', insights);
    return insights;
  }

  /**
   * 生成会话洞察
   */
  async generateSessionInsights() {
    const sessions = await this.storage.getSessions(30); // 最近30天
    
    if (sessions.length === 0) {
      return { message: 'Insufficient session data' };
    }

    const avgSessionDuration = sessions.reduce((sum, session) => {
      const duration = new Date(session.endTime || Date.now()) - new Date(session.startTime);
      return sum + duration;
    }, 0) / sessions.length;

    const avgAnalysesPerSession = sessions.reduce((sum, session) => 
      sum + (session.analysesPerformed || 0), 0) / sessions.length;

    return {
      totalSessions: sessions.length,
      avgSessionDuration: Math.round(avgSessionDuration / 1000), // 秒
      avgAnalysesPerSession: Math.round(avgAnalysesPerSession * 10) / 10,
      mostActiveHours: this.findMostActiveHours(sessions),
      sessionTrend: this.calculateSessionTrend(sessions)
    };
  }

  /**
   * 生成使用模式洞察
   */
  async generateUsagePatterns() {
    const events = await this.storage.getEvents(30); // 最近30天
    
    const featureUsage = {};
    const regionUsage = {};
    const errorPatterns = {};

    events.forEach(event => {
      // 功能使用统计
      if (event.type === 'featureUsed') {
        const feature = event.properties.featureName;
        featureUsage[feature] = (featureUsage[feature] || 0) + 1;
      }

      // 地区偏好统计
      if (event.properties.region) {
        regionUsage[event.properties.region] = (regionUsage[event.properties.region] || 0) + 1;
      }

      // 错误模式统计
      if (event.type === 'errorOccurred') {
        const errorType = event.properties.errorType;
        errorPatterns[errorType] = (errorPatterns[errorType] || 0) + 1;
      }
    });

    return {
      topFeatures: Object.entries(featureUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      topRegions: Object.entries(regionUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      commonErrors: Object.entries(errorPatterns)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      totalEvents: events.length
    };
  }

  /**
   * 生成偏好洞察
   */
  async generatePreferenceInsights() {
    return {
      favoriteRegions: this.userProfile.behaviorSummary.favoriteRegions.slice(0, 5),
      mostUsedFeatures: this.userProfile.behaviorSummary.mostUsedFeatures.slice(0, 8),
      preferredAnalysisTypes: await this.getPreferredAnalysisTypes(),
      preferredReportFormats: await this.getPreferredReportFormats()
    };
  }

  /**
   * 生成性能洞察
   */
  async generatePerformanceInsights() {
    const performanceEvents = await this.storage.getEventsByType('performanceMetric', 7);
    
    if (performanceEvents.length === 0) {
      return { message: 'No performance data available' };
    }

    const loadTimes = performanceEvents
      .filter(e => e.properties.metricType === 'pageLoad')
      .map(e => e.properties.value);

    const analysisTime = performanceEvents
      .filter(e => e.properties.metricType === 'analysisTime')
      .map(e => e.properties.value);

    return {
      avgPageLoadTime: loadTimes.length > 0 ? 
        Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length) : null,
      avgAnalysisTime: analysisTime.length > 0 ? 
        Math.round(analysisTime.reduce((a, b) => a + b, 0) / analysisTime.length) : null,
      performanceTrend: this.calculatePerformanceTrend(performanceEvents)
    };
  }

  /**
   * 生成个性化推荐
   */
  async generatePersonalizedRecommendations() {
    const recommendations = [];
    const insights = await this.generateUsagePatterns();

    // 基于地区使用推荐
    if (insights.topRegions.length > 0) {
      const topRegion = insights.topRegions[0][0];
      recommendations.push({
        type: 'region_optimization',
        title: `${topRegion}地区专项优化建议`,
        description: `基于您的使用习惯，为${topRegion}地区提供专门的优化建议`,
        priority: 'high'
      });
    }

    // 基于功能使用推荐
    if (insights.topFeatures.length > 0) {
      const underutilizedFeatures = this.findUnderutilizedFeatures(insights.topFeatures);
      if (underutilizedFeatures.length > 0) {
        recommendations.push({
          type: 'feature_discovery',
          title: '发现新功能',
          description: `尝试${underutilizedFeatures[0]}功能，可能对您的分析有帮助`,
          priority: 'medium'
        });
      }
    }

    // 基于错误模式推荐
    if (insights.commonErrors.length > 0) {
      recommendations.push({
        type: 'error_prevention',
        title: '避免常见问题',
        description: '根据您的使用模式，提供问题预防建议',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * 获取用户行为统计
   */
  async getBehaviorStats(timeRange = 30) {
    const events = await this.storage.getEvents(timeRange);
    const sessions = await this.storage.getSessions(timeRange);

    return {
      totalEvents: events.length,
      totalSessions: sessions.length,
      eventsByType: this.groupEventsByType(events),
      dailyActivity: this.calculateDailyActivity(events),
      userMetrics: this.metrics,
      storageUsage: await this.storage.getStorageUsage()
    };
  }

  /**
   * 设置自动同步
   */
  setupAutoSync() {
    if (this.config.syncInterval > 0) {
      setInterval(async () => {
        try {
          await this.flushEvents();
          await this.syncWithRemote();
          this.metrics.lastSyncTime = new Date().toISOString();
        } catch (error) {
          console.error('Auto sync failed:', error);
        }
      }, this.config.syncInterval);
    }
  }

  /**
   * 设置隐私控制
   */
  setupPrivacyControls() {
    if (this.config.privacyCompliant) {
      // 实现数据匿名化
      this.originalTrackEvent = this.trackEvent;
      this.trackEvent = this.privacyAwareTrackEvent;
      
      // 设置数据清理
      this.setupDataCleanup();
    }
  }

  /**
   * 隐私感知的事件跟踪
   */
  async privacyAwareTrackEvent(eventType, properties = {}) {
    if (this.config.anonymizeData) {
      properties = this.anonymizeProperties(properties);
    }

    return await this.originalTrackEvent.call(this, eventType, properties);
  }

  // 辅助方法
  generateSessionId() {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  generateUserId() {
    return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 12);
  }

  generateEventId() {
    return 'event-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  sanitizeProperties(properties) {
    const sanitized = { ...properties };
    
    // 移除敏感信息
    delete sanitized.password;
    delete sanitized.apiKey;
    delete sanitized.token;
    
    // 限制字符串长度
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '...';
      }
    });

    return sanitized;
  }

  anonymizeProperties(properties) {
    const anonymized = { ...properties };
    
    // 匿名化URL
    if (anonymized.url) {
      try {
        const url = new URL(anonymized.url);
        anonymized.url = url.protocol + '//' + url.hostname + url.pathname;
      } catch (e) {
        delete anonymized.url;
      }
    }

    // 移除个人标识信息
    delete anonymized.email;
    delete anonymized.phone;
    delete anonymized.name;

    return anonymized;
  }

  async updateSessionActivity() {
    this.sessionData.lastActivityTime = new Date().toISOString();
    await this.storage.setSession(this.sessionData);
  }

  async syncWithRemote() {
    // 实现与远程服务器的数据同步
    console.log('Syncing behavior data with remote server...');
  }

  setupDataCleanup() {
    // 每天清理过期数据
    setInterval(async () => {
      await this.cleanupOldData();
    }, 24 * 60 * 60 * 1000);
  }

  async cleanupOldData() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);
    
    await this.storage.deleteEventsBefore(cutoffDate);
    console.log('Cleaned up old behavior data');
  }

  groupEventsByType(events) {
    return events.reduce((groups, event) => {
      groups[event.type] = (groups[event.type] || 0) + 1;
      return groups;
    }, {});
  }

  calculateDailyActivity(events) {
    const daily = {};
    
    events.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      daily[date] = (daily[date] || 0) + 1;
    });

    return Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  findMostActiveHours(sessions) {
    const hourCounts = {};
    
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  }

  calculateSessionTrend(sessions) {
    // 简化的趋势计算
    const recentWeek = sessions.filter(s => 
      Date.now() - new Date(s.startTime).getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;
    
    const previousWeek = sessions.filter(s => {
      const time = Date.now() - new Date(s.startTime).getTime();
      return time >= 7 * 24 * 60 * 60 * 1000 && time < 14 * 24 * 60 * 60 * 1000;
    }).length;

    if (previousWeek === 0) return 'neutral';
    
    const change = (recentWeek - previousWeek) / previousWeek;
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  calculatePerformanceTrend(events) {
    // 简化的性能趋势分析
    return 'stable';
  }

  async getPreferredAnalysisTypes() {
    const events = await this.storage.getEventsByType('analysisStarted', 30);
    const types = {};
    
    events.forEach(event => {
      const type = event.properties.analysisType;
      types[type] = (types[type] || 0) + 1;
    });

    return Object.entries(types)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }

  async getPreferredReportFormats() {
    const events = await this.storage.getEventsByType('reportGenerated', 30);
    const formats = {};
    
    events.forEach(event => {
      const format = event.properties.format;
      formats[format] = (formats[format] || 0) + 1;
    });

    return Object.entries(formats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
  }

  findUnderutilizedFeatures(topFeatures) {
    const allFeatures = ['aiAnalysis', 'networkTest', 'crossBorderCheck', 'deviceAnalysis', 'reportExport'];
    const usedFeatures = topFeatures.map(([name]) => name);
    return allFeatures.filter(feature => !usedFeatures.includes(feature));
  }
}

// 存储实现类
class BehaviorIndexedDBStorage {
  constructor() {
    this.db = null;
    this.dbName = 'UserBehaviorDB';
    this.version = 1;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建事件存储
        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'id' });
          eventStore.createIndex('type', 'type', { unique: false });
          eventStore.createIndex('timestamp', 'timestamp', { unique: false });
          eventStore.createIndex('sessionId', 'sessionId', { unique: false });
        }

        // 创建会话存储
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'sessionId' });
        }

        // 创建用户配置存储
        if (!db.objectStoreNames.contains('userProfile')) {
          db.createObjectStore('userProfile', { keyPath: 'userId' });
        }
      };
    });
  }

  async saveEvents(events) {
    const transaction = this.db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    
    for (const event of events) {
      await store.put(event);
    }
  }

  async getEvents(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const transaction = this.db.transaction(['events'], 'readonly');
    const store = transaction.objectStore('events');
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.lowerBound(cutoff.toISOString()));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getEventsByType(type, days) {
    const events = await this.getEvents(days);
    return events.filter(event => event.type === type);
  }

  async setSession(session) {
    const transaction = this.db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    await store.put(session);
  }

  async getSessions(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const transaction = this.db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const sessions = request.result.filter(session => 
          new Date(session.startTime) >= cutoff
        );
        resolve(sessions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getUserProfile() {
    const transaction = this.db.transaction(['userProfile'], 'readonly');
    const store = transaction.objectStore('userProfile');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result[0] || null);
      request.onerror = () => reject(request.error);
    });
  }

  async setUserProfile(profile) {
    const transaction = this.db.transaction(['userProfile'], 'readwrite');
    const store = transaction.objectStore('userProfile');
    await store.put(profile);
  }

  async deleteEventsBefore(date) {
    const transaction = this.db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    const index = store.index('timestamp');
    
    const request = index.openCursor(IDBKeyRange.upperBound(date.toISOString()));
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  async getStorageUsage() {
    // 简化的存储使用量计算
    return { used: 0, quota: 0 };
  }
}

class BehaviorLocalStorage {
  constructor() {
    this.prefix = 'behavior_';
  }

  async initialize() {
    // LocalStorage 不需要初始化
  }

  async saveEvents(events) {
    const existing = this.getStoredData('events') || [];
    existing.push(...events);
    
    // 限制存储的事件数量
    if (existing.length > 5000) {
      existing.splice(0, existing.length - 5000);
    }
    
    this.setStoredData('events', existing);
  }

  async getEvents(days) {
    const events = this.getStoredData('events') || [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return events.filter(event => new Date(event.timestamp) >= cutoff);
  }

  async getEventsByType(type, days) {
    const events = await this.getEvents(days);
    return events.filter(event => event.type === type);
  }

  async setSession(session) {
    this.setStoredData('currentSession', session);
  }

  async getSessions(days) {
    const sessions = this.getStoredData('sessions') || [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return sessions.filter(session => new Date(session.startTime) >= cutoff);
  }

  async getUserProfile() {
    return this.getStoredData('userProfile');
  }

  async setUserProfile(profile) {
    this.setStoredData('userProfile', profile);
  }

  async deleteEventsBefore(date) {
    const events = this.getStoredData('events') || [];
    const filtered = events.filter(event => new Date(event.timestamp) >= date);
    this.setStoredData('events', filtered);
  }

  async getStorageUsage() {
    let totalSize = 0;
    for (let key in localStorage) {
      if (key.startsWith(this.prefix)) {
        totalSize += localStorage[key].length;
      }
    }
    return { used: totalSize, quota: 5 * 1024 * 1024 }; // 5MB 估算配额
  }

  getStoredData(key) {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to parse stored data:', key, e);
      return null;
    }
  }

  setStoredData(key, data) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to store data:', key, e);
      
      // 如果存储失败，尝试清理一些数据
      this.cleanup();
    }
  }

  cleanup() {
    const events = this.getStoredData('events') || [];
    if (events.length > 1000) {
      this.setStoredData('events', events.slice(-1000));
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    UserBehaviorDataIntegration, 
    BehaviorIndexedDBStorage, 
    BehaviorLocalStorage 
  };
} else {
  window.UserBehaviorDataIntegration = UserBehaviorDataIntegration;
}