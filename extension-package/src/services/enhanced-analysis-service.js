/**
 * Enhanced Analysis Service
 * 增强分析服务 - 集成所有分析组件的主控制器
 */

class EnhancedAnalysisService {
  constructor() {
    this.localRuleEngine = null;
    this.aiAnalysisService = null;
    this.crossBorderAnalyzer = null;
    this.deviceMarketAnalyzer = null;
    this.networkPerformanceService = null;
    this.cacheService = null;
    
    this.initialized = false;
    this.initializeServices();
  }

  /**
   * 初始化所有服务
   */
  async initializeServices() {
    try {
      // 初始化本地规则引擎
      this.localRuleEngine = new LocalRuleEngine();
      
      // 初始化AI分析服务
      this.aiAnalysisService = new AIAnalysisService();
      
      // 初始化跨境电商分析器
      this.crossBorderAnalyzer = new CrossBorderSiteAnalyzer();
      
      // 初始化设备市场分析器
      this.deviceMarketAnalyzer = new DeviceMarketDataAnalyzer();
      
      // 初始化网络性能测试服务
      this.networkPerformanceService = new NetworkPerformanceTesting();
      
      // 初始化缓存服务
      this.cacheService = new AIAnalysisCacheService();
      
      this.initialized = true;
      console.log('Enhanced Analysis Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Enhanced Analysis Service:', error);
      this.initialized = false;
    }
  }

  /**
   * 执行完整的增强分析
   */
  async performEnhancedAnalysis(extractedData, targetRegions = ['US'], options = {}) {
    if (!this.initialized) {
      await this.initializeServices();
    }

    const analysisId = this.generateAnalysisId();
    console.log(`开始增强分析 [${analysisId}]:`, { targetRegions, options });

    const startTime = Date.now();
    const analysis = {
      id: analysisId,
      timestamp: new Date().toISOString(),
      url: extractedData.url,
      targetRegions,
      phases: {
        local: null,
        crossBorder: null,
        deviceMarket: null,
        networkPerformance: null,
        ai: null
      },
      integrated: null,
      performance: {
        startTime,
        endTime: null,
        duration: null,
        phaseTiming: {}
      }
    };

    try {
      // 阶段1: 本地规则分析
      analysis.phases.local = await this.runLocalAnalysis(extractedData, targetRegions, options);
      analysis.performance.phaseTiming.local = Date.now() - startTime;

      // 阶段2: 跨境电商专项分析
      const crossBorderStart = Date.now();
      analysis.phases.crossBorder = await this.runCrossBorderAnalysis(extractedData, options);
      analysis.performance.phaseTiming.crossBorder = Date.now() - crossBorderStart;

      // 阶段3: 设备市场分析
      const deviceMarketStart = Date.now();
      analysis.phases.deviceMarket = await this.runDeviceMarketAnalysis(extractedData, targetRegions, options);
      analysis.performance.phaseTiming.deviceMarket = Date.now() - deviceMarketStart;

      // 阶段4: 网络性能测试（可选）
      if (options.includeNetworkPerformance !== false) {
        const networkStart = Date.now();
        analysis.phases.networkPerformance = await this.runNetworkPerformanceTest(targetRegions, options);
        analysis.performance.phaseTiming.networkPerformance = Date.now() - networkStart;
      }

      // 阶段5: AI深度分析（可选）
      if (options.includeAIAnalysis !== false) {
        const aiStart = Date.now();
        analysis.phases.ai = await this.runAIAnalysis(extractedData, targetRegions, options);
        analysis.performance.phaseTiming.ai = Date.now() - aiStart;
      }

      // 最终阶段: 结果集成
      const integrationStart = Date.now();
      analysis.integrated = await this.integrateAnalysisResults(analysis);
      analysis.performance.phaseTiming.integration = Date.now() - integrationStart;

      // 完成性能统计
      analysis.performance.endTime = Date.now();
      analysis.performance.duration = analysis.performance.endTime - startTime;

      console.log(`增强分析完成 [${analysisId}]: ${analysis.performance.duration}ms`);

      return analysis;
    } catch (error) {
      console.error(`增强分析失败 [${analysisId}]:`, error);
      analysis.error = error.message;
      analysis.performance.endTime = Date.now();
      analysis.performance.duration = analysis.performance.endTime - startTime;
      return analysis;
    }
  }

  /**
   * 运行本地规则分析
   */
  async runLocalAnalysis(extractedData, targetRegions, options) {
    console.log('执行本地规则分析...');
    try {
      return await this.localRuleEngine.analyze(extractedData, targetRegions);
    } catch (error) {
      console.error('本地规则分析失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 运行跨境电商分析
   */
  async runCrossBorderAnalysis(extractedData, options) {
    console.log('执行跨境电商专项分析...');
    try {
      return this.crossBorderAnalyzer.analyzeCrossBorderSite(extractedData);
    } catch (error) {
      console.error('跨境电商分析失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 运行设备市场分析
   */
  async runDeviceMarketAnalysis(extractedData, targetRegions, options) {
    console.log('执行设备市场分析...');
    try {
      return this.deviceMarketAnalyzer.analyzeDeviceCompatibility(extractedData, targetRegions);
    } catch (error) {
      console.error('设备市场分析失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 运行网络性能测试
   */
  async runNetworkPerformanceTest(targetRegions, options) {
    console.log('执行网络性能测试...');
    try {
      return await this.networkPerformanceService.runPerformanceTest(targetRegions, {
        timeout: options.networkTimeout || 10000,
        retryCount: options.networkRetry || 2
      });
    } catch (error) {
      console.error('网络性能测试失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 运行AI深度分析
   */
  async runAIAnalysis(extractedData, targetRegions, options) {
    console.log('执行AI深度分析...');
    try {
      return await this.aiAnalysisService.analyze(extractedData, targetRegions, options);
    } catch (error) {
      console.error('AI深度分析失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 集成所有分析结果
   */
  async integrateAnalysisResults(analysis) {
    console.log('集成分析结果...');

    const integrated = {
      overall: {
        score: 0,
        confidence: 0,
        status: 'completed'
      },
      regions: {},
      insights: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: []
      },
      recommendations: {
        immediate: [],
        shortTerm: [],
        longTerm: []
      },
      features: {
        platformType: null,
        crossBorderReadiness: 0,
        deviceCompatibility: 0,
        networkOptimization: 0,
        aiEnhanced: false
      }
    };

    try {
      // 集成各地区的分析结果
      analysis.targetRegions.forEach(region => {
        integrated.regions[region] = this.integrateRegionResults(region, analysis);
      });

      // 计算总体评分
      integrated.overall = this.calculateOverallScore(integrated.regions);

      // 生成洞察
      integrated.insights = this.generateInsights(analysis);

      // 生成综合建议
      integrated.recommendations = this.generateIntegratedRecommendations(analysis);

      // 提取特性信息
      integrated.features = this.extractFeatures(analysis);

      return integrated;
    } catch (error) {
      console.error('结果集成失败:', error);
      integrated.overall.status = 'failed';
      integrated.error = error.message;
      return integrated;
    }
  }

  /**
   * 集成地区特定结果
   */
  integrateRegionResults(region, analysis) {
    const regionResult = {
      region,
      scores: {
        language: 0,
        culture: 0,
        compliance: 0,
        userExperience: 0,
        crossBorder: 0,
        deviceCompatibility: 0,
        networkPerformance: 0
      },
      overall: 0,
      issues: [],
      recommendations: [],
      aiEnhanced: false
    };

    // 集成本地规则分析结果
    if (analysis.phases.local?.results?.[region]) {
      const localResult = analysis.phases.local.results[region];
      regionResult.scores.language = localResult.language?.score || 0;
      regionResult.scores.culture = localResult.culture?.score || 0;
      regionResult.scores.compliance = localResult.compliance?.score || 0;
      regionResult.scores.userExperience = localResult.userExperience?.score || 0;
      
      // 收集问题
      ['language', 'culture', 'compliance', 'userExperience'].forEach(category => {
        if (localResult[category]?.issues) {
          regionResult.issues.push(...localResult[category].issues.map(issue => ({
            category,
            source: 'local',
            issue
          })));
        }
      });
    }

    // 集成跨境电商分析结果
    if (analysis.phases.crossBorder) {
      const crossBorderScore = analysis.phases.crossBorder.marketReadiness?.overall || 0;
      regionResult.scores.crossBorder = crossBorderScore;
      
      if (analysis.phases.crossBorder.recommendations) {
        regionResult.recommendations.push(...analysis.phases.crossBorder.recommendations.map(rec => ({
          ...rec,
          source: 'crossBorder'
        })));
      }
    }

    // 集成设备市场分析结果
    if (analysis.phases.deviceMarket?.regions?.[region]) {
      const deviceResult = analysis.phases.deviceMarket.regions[region];
      regionResult.scores.deviceCompatibility = deviceResult.overallScore || 0;
    }

    // 集成网络性能结果
    if (analysis.phases.networkPerformance?.results?.[region]) {
      const networkResult = analysis.phases.networkPerformance.results[region];
      regionResult.scores.networkPerformance = networkResult.metrics?.networkScore || 0;
    }

    // 集成AI分析结果（如果可用）
    if (analysis.phases.ai?.results?.[region]) {
      const aiResult = analysis.phases.ai.results[region];
      regionResult.aiEnhanced = true;
      
      // AI结果优先级更高，用于调整分数
      if (aiResult.language?.score !== undefined) {
        regionResult.scores.language = Math.max(regionResult.scores.language, aiResult.language.score);
      }
      if (aiResult.culture?.score !== undefined) {
        regionResult.scores.culture = Math.max(regionResult.scores.culture, aiResult.culture.score);
      }
      if (aiResult.compliance?.score !== undefined) {
        regionResult.scores.compliance = Math.max(regionResult.scores.compliance, aiResult.compliance.score);
      }
      if (aiResult.userExperience?.score !== undefined) {
        regionResult.scores.userExperience = Math.max(regionResult.scores.userExperience, aiResult.userExperience.score);
      }
    }

    // 计算地区总体评分
    const scores = Object.values(regionResult.scores).filter(score => score > 0);
    regionResult.overall = scores.length > 0 ? 
      Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

    return regionResult;
  }

  /**
   * 计算总体评分
   */
  calculateOverallScore(regions) {
    const regionScores = Object.values(regions).map(region => region.overall);
    if (regionScores.length === 0) {
      return { score: 0, confidence: 0, status: 'no_data' };
    }

    const avgScore = Math.round(regionScores.reduce((sum, score) => sum + score, 0) / regionScores.length);
    const confidence = this.calculateConfidence(regions);

    return {
      score: avgScore,
      confidence: Math.round(confidence * 100) / 100,
      status: avgScore >= 70 ? 'good' : avgScore >= 50 ? 'fair' : 'poor'
    };
  }

  /**
   * 计算置信度
   */
  calculateConfidence(regions) {
    let totalDataSources = 0;
    let availableDataSources = 0;

    Object.values(regions).forEach(region => {
      const scores = Object.values(region.scores);
      totalDataSources += scores.length;
      availableDataSources += scores.filter(score => score > 0).length;
      
      if (region.aiEnhanced) {
        availableDataSources += 2; // AI增强提供额外置信度
      }
    });

    return totalDataSources > 0 ? Math.min(availableDataSources / totalDataSources, 1.0) : 0;
  }

  /**
   * 生成洞察
   */
  generateInsights(analysis) {
    const insights = {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: []
    };

    // 基于跨境电商分析生成洞察
    if (analysis.phases.crossBorder) {
      const crossBorder = analysis.phases.crossBorder;
      
      if (crossBorder.platform?.detected) {
        const platform = crossBorder.platform.primary;
        insights.strengths.push(`使用${platform}平台，具备良好的电商基础`);
      }

      if (crossBorder.marketReadiness?.overall > 70) {
        insights.strengths.push('跨境市场准备度较高，具备良好的国际化基础');
      } else {
        insights.weaknesses.push('跨境市场准备度不足，需要加强国际化建设');
      }
    }

    // 基于设备市场分析生成洞察
    if (analysis.phases.deviceMarket) {
      const deviceMarket = analysis.phases.deviceMarket;
      
      if (deviceMarket.overall?.mobile?.score > 80) {
        insights.strengths.push('移动端兼容性优秀，适合移动优先市场');
      } else if (deviceMarket.overall?.mobile?.score < 60) {
        insights.threats.push('移动端兼容性不足，在移动优先市场面临竞争劣势');
      }
    }

    // 基于网络性能生成洞察
    if (analysis.phases.networkPerformance?.summary) {
      const network = analysis.phases.networkPerformance.summary;
      
      if (network.averageScore > 80) {
        insights.strengths.push('网络性能优秀，用户体验良好');
      } else if (network.averageScore < 60) {
        insights.weaknesses.push('网络性能需要优化，可能影响用户体验');
      }
    }

    return insights;
  }

  /**
   * 生成综合建议
   */
  generateIntegratedRecommendations(analysis) {
    const recommendations = {
      immediate: [], // 立即执行
      shortTerm: [],  // 1-3个月
      longTerm: []    // 3个月以上
    };

    // 收集所有建议并按优先级分类
    const allRecommendations = [];

    // 从各个分析阶段收集建议
    Object.values(analysis.phases).forEach(phase => {
      if (phase?.recommendations) {
        allRecommendations.push(...phase.recommendations);
      }
    });

    // 按优先级分类建议
    allRecommendations.forEach(rec => {
      const priority = rec.priority || 'medium';
      
      if (priority === 'high' || rec.category === 'compliance') {
        recommendations.immediate.push(rec);
      } else if (priority === 'medium') {
        recommendations.shortTerm.push(rec);
      } else {
        recommendations.longTerm.push(rec);
      }
    });

    // 限制每个类别的建议数量并去重
    recommendations.immediate = this.deduplicateRecommendations(recommendations.immediate).slice(0, 5);
    recommendations.shortTerm = this.deduplicateRecommendations(recommendations.shortTerm).slice(0, 8);
    recommendations.longTerm = this.deduplicateRecommendations(recommendations.longTerm).slice(0, 10);

    return recommendations;
  }

  /**
   * 建议去重
   */
  deduplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      const key = `${rec.category}-${rec.issue}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * 提取特性信息
   */
  extractFeatures(analysis) {
    const features = {
      platformType: 'unknown',
      crossBorderReadiness: 0,
      deviceCompatibility: 0,
      networkOptimization: 0,
      aiEnhanced: false
    };

    // 平台类型
    if (analysis.phases.crossBorder?.platform) {
      features.platformType = analysis.phases.crossBorder.platform.primary || 'custom';
    }

    // 跨境准备度
    if (analysis.phases.crossBorder?.marketReadiness) {
      features.crossBorderReadiness = analysis.phases.crossBorder.marketReadiness.overall;
    }

    // 设备兼容性
    if (analysis.phases.deviceMarket?.overall) {
      features.deviceCompatibility = analysis.phases.deviceMarket.overall.overallScore;
    }

    // 网络优化
    if (analysis.phases.networkPerformance?.summary) {
      features.networkOptimization = analysis.phases.networkPerformance.summary.averageScore;
    }

    // AI增强
    features.aiEnhanced = !!analysis.phases.ai && !analysis.phases.ai.error;

    return features;
  }

  /**
   * 生成分析ID
   */
  generateAnalysisId() {
    return 'enhanced-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 获取分析统计
   */
  getAnalysisStats() {
    return {
      servicesInitialized: this.initialized,
      availableServices: {
        localRules: !!this.localRuleEngine,
        aiAnalysis: !!this.aiAnalysisService,
        crossBorderAnalysis: !!this.crossBorderAnalyzer,
        deviceMarketAnalysis: !!this.deviceMarketAnalyzer,
        networkPerformance: !!this.networkPerformanceService,
        caching: !!this.cacheService
      }
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedAnalysisService;
} else {
  window.EnhancedAnalysisService = EnhancedAnalysisService;
}