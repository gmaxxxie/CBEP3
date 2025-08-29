/**
 * Backend REST API Server
 * 后端REST API服务架构 - 支持AI模型调用、规则管理、数据同步
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

class CrossBorderAnalysisAPIServer {
  constructor(config = {}) {
    this.app = express();
    this.config = {
      port: config.port || 3000,
      mongoUrl: config.mongoUrl || 'mongodb://localhost:27017/crossborder-analysis',
      redisUrl: config.redisUrl || 'redis://localhost:6379',
      allowedOrigins: config.allowedOrigins || ['chrome-extension://*'],
      rateLimit: config.rateLimit || { windowMs: 15 * 60 * 1000, max: 100 },
      apiKeys: config.apiKeys || {},
      ...config
    };
    
    this.services = {
      ruleConfigService: null,
      userBehaviorService: null,
      aiModelService: null,
      cacheService: null,
      analyticsService: null
    };
    
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeServices();
  }

  /**
   * 设置中间件
   */
  setupMiddleware() {
    // 安全中间件
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS配置
    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        const isAllowed = this.config.allowedOrigins.some(allowedOrigin => {
          if (allowedOrigin.includes('*')) {
            const pattern = new RegExp(allowedOrigin.replace('*', '.*'));
            return pattern.test(origin);
          }
          return allowedOrigin === origin;
        });
        
        callback(null, isAllowed);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials: true
    }));

    // 基础中间件
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 速率限制
    const limiter = rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: {
        error: 'Too many requests from this IP',
        retryAfter: this.config.rateLimit.windowMs / 1000
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // API密钥验证中间件
    this.app.use('/api/', this.authenticateAPIKey.bind(this));

    // 请求日志
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * API密钥验证
   */
  authenticateAPIKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // 简化的API密钥验证（实际项目中应使用数据库）
    const validKeys = ['demo-key-123', 'extension-key-456', ...Object.keys(this.config.apiKeys)];
    
    if (!validKeys.includes(apiKey)) {
      return res.status(403).json({ error: 'Invalid API key' });
    }

    req.apiKey = apiKey;
    next();
  }

  /**
   * 设置路由
   */
  setupRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: this.getServiceStatus()
      });
    });

    // API根路径
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Cross-Border E-commerce Analysis API',
        version: '1.0.0',
        description: '跨境电商内容分析REST API服务',
        endpoints: this.getAPIEndpoints()
      });
    });

    // AI分析相关路由
    this.setupAIAnalysisRoutes();
    
    // 规则配置相关路由
    this.setupRuleConfigRoutes();
    
    // 用户行为数据相关路由
    this.setupUserBehaviorRoutes();
    
    // 缓存管理相关路由
    this.setupCacheManagementRoutes();
    
    // 分析报告相关路由
    this.setupAnalyticsRoutes();

    // 错误处理
    this.app.use(this.errorHandler.bind(this));
  }

  /**
   * AI分析路由
   */
  setupAIAnalysisRoutes() {
    // 执行AI分析
    this.app.post('/api/analysis/ai', async (req, res) => {
      try {
        const { contentData, targetRegions, options = {} } = req.body;
        
        if (!contentData || !targetRegions) {
          return res.status(400).json({ 
            error: 'contentData and targetRegions are required' 
          });
        }

        const analysisId = this.generateAnalysisId();
        
        // 异步执行AI分析
        const analysisPromise = this.services.aiModelService.performAIAnalysis(
          contentData,
          targetRegions,
          { ...options, analysisId, apiKey: req.apiKey }
        );

        // 立即返回分析ID，分析结果通过回调或轮询获取
        res.json({
          success: true,
          analysisId,
          status: 'processing',
          estimatedTime: this.estimateAnalysisTime(contentData, targetRegions),
          resultUrl: `/api/analysis/ai/${analysisId}`
        });

        // 后台处理分析
        analysisPromise.then(result => {
          this.services.cacheService.setAnalysisResult(analysisId, result);
        }).catch(error => {
          this.services.cacheService.setAnalysisResult(analysisId, { error: error.message });
        });

      } catch (error) {
        console.error('AI analysis request failed:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 获取AI分析结果
    this.app.get('/api/analysis/ai/:analysisId', async (req, res) => {
      try {
        const { analysisId } = req.params;
        const result = await this.services.cacheService.getAnalysisResult(analysisId);

        if (!result) {
          return res.status(404).json({ error: 'Analysis not found' });
        }

        if (result.error) {
          return res.status(500).json({ error: result.error });
        }

        res.json({
          success: true,
          analysisId,
          status: 'completed',
          result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Get AI analysis result failed:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 批量AI分析
    this.app.post('/api/analysis/ai/batch', async (req, res) => {
      try {
        const { requests } = req.body;
        
        if (!Array.isArray(requests) || requests.length === 0) {
          return res.status(400).json({ error: 'requests array is required' });
        }

        if (requests.length > 10) {
          return res.status(400).json({ error: 'Maximum 10 requests per batch' });
        }

        const batchId = this.generateBatchId();
        const analysisPromises = requests.map((request, index) => {
          const analysisId = `${batchId}-${index}`;
          return this.services.aiModelService.performAIAnalysis(
            request.contentData,
            request.targetRegions,
            { ...request.options, analysisId, apiKey: req.apiKey }
          );
        });

        res.json({
          success: true,
          batchId,
          analysisIds: requests.map((_, index) => `${batchId}-${index}`),
          status: 'processing',
          resultUrl: `/api/analysis/ai/batch/${batchId}`
        });

        // 处理批量分析
        Promise.allSettled(analysisPromises).then(results => {
          const batchResult = {
            batchId,
            results: results.map((result, index) => ({
              analysisId: `${batchId}-${index}`,
              status: result.status,
              data: result.status === 'fulfilled' ? result.value : { error: result.reason.message }
            })),
            completedAt: new Date().toISOString()
          };
          this.services.cacheService.setAnalysisResult(batchId, batchResult);
        });

      } catch (error) {
        console.error('Batch AI analysis failed:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 获取批量分析结果
    this.app.get('/api/analysis/ai/batch/:batchId', async (req, res) => {
      try {
        const { batchId } = req.params;
        const result = await this.services.cacheService.getAnalysisResult(batchId);

        if (!result) {
          return res.status(404).json({ error: 'Batch analysis not found' });
        }

        res.json({
          success: true,
          batchId,
          status: 'completed',
          result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Get batch analysis result failed:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  /**
   * 规则配置路由
   */
  setupRuleConfigRoutes() {
    // 获取所有规则配置
    this.app.get('/api/rules', async (req, res) => {
      try {
        const rules = await this.services.ruleConfigService.getAllRules();
        res.json({
          success: true,
          rules,
          count: rules.length
        });
      } catch (error) {
        console.error('Get rules failed:', error);
        res.status(500).json({ error: 'Failed to fetch rules' });
      }
    });

    // 获取特定类别的规则
    this.app.get('/api/rules/:category', async (req, res) => {
      try {
        const { category } = req.params;
        const rules = await this.services.ruleConfigService.getRulesByCategory(category);
        
        res.json({
          success: true,
          category,
          rules,
          count: rules.length
        });
      } catch (error) {
        console.error('Get rules by category failed:', error);
        res.status(500).json({ error: 'Failed to fetch rules' });
      }
    });

    // 创建新规则
    this.app.post('/api/rules', async (req, res) => {
      try {
        const ruleData = req.body;
        const newRule = await this.services.ruleConfigService.createRule(ruleData);
        
        res.status(201).json({
          success: true,
          rule: newRule,
          message: 'Rule created successfully'
        });
      } catch (error) {
        console.error('Create rule failed:', error);
        res.status(400).json({ error: error.message });
      }
    });

    // 更新规则
    this.app.put('/api/rules/:ruleId', async (req, res) => {
      try {
        const { ruleId } = req.params;
        const updateData = req.body;
        
        const updatedRule = await this.services.ruleConfigService.updateRule(ruleId, updateData);
        
        if (!updatedRule) {
          return res.status(404).json({ error: 'Rule not found' });
        }

        res.json({
          success: true,
          rule: updatedRule,
          message: 'Rule updated successfully'
        });
      } catch (error) {
        console.error('Update rule failed:', error);
        res.status(400).json({ error: error.message });
      }
    });

    // 删除规则
    this.app.delete('/api/rules/:ruleId', async (req, res) => {
      try {
        const { ruleId } = req.params;
        const deleted = await this.services.ruleConfigService.deleteRule(ruleId);
        
        if (!deleted) {
          return res.status(404).json({ error: 'Rule not found' });
        }

        res.json({
          success: true,
          message: 'Rule deleted successfully'
        });
      } catch (error) {
        console.error('Delete rule failed:', error);
        res.status(500).json({ error: 'Failed to delete rule' });
      }
    });

    // 批量更新规则
    this.app.put('/api/rules/batch', async (req, res) => {
      try {
        const { rules } = req.body;
        
        if (!Array.isArray(rules)) {
          return res.status(400).json({ error: 'rules must be an array' });
        }

        const results = await this.services.ruleConfigService.batchUpdateRules(rules);
        
        res.json({
          success: true,
          results,
          message: `Updated ${results.updated} rules, ${results.failed} failed`
        });
      } catch (error) {
        console.error('Batch update rules failed:', error);
        res.status(500).json({ error: 'Batch update failed' });
      }
    });
  }

  /**
   * 用户行为数据路由
   */
  setupUserBehaviorRoutes() {
    // 记录用户行为
    this.app.post('/api/behavior/track', async (req, res) => {
      try {
        const behaviorData = req.body;
        await this.services.userBehaviorService.trackBehavior(behaviorData);
        
        res.json({
          success: true,
          message: 'Behavior tracked successfully'
        });
      } catch (error) {
        console.error('Track behavior failed:', error);
        res.status(500).json({ error: 'Failed to track behavior' });
      }
    });

    // 批量记录用户行为
    this.app.post('/api/behavior/track/batch', async (req, res) => {
      try {
        const { behaviors } = req.body;
        
        if (!Array.isArray(behaviors)) {
          return res.status(400).json({ error: 'behaviors must be an array' });
        }

        await this.services.userBehaviorService.batchTrackBehaviors(behaviors);
        
        res.json({
          success: true,
          count: behaviors.length,
          message: 'Behaviors tracked successfully'
        });
      } catch (error) {
        console.error('Batch track behaviors failed:', error);
        res.status(500).json({ error: 'Failed to track behaviors' });
      }
    });

    // 获取用户行为分析
    this.app.get('/api/behavior/analysis', async (req, res) => {
      try {
        const { 
          timeRange = '7d', 
          region, 
          category,
          limit = 100,
          offset = 0 
        } = req.query;

        const analysis = await this.services.userBehaviorService.getBehaviorAnalysis({
          timeRange,
          region,
          category,
          limit: parseInt(limit),
          offset: parseInt(offset)
        });

        res.json({
          success: true,
          analysis,
          filters: { timeRange, region, category }
        });
      } catch (error) {
        console.error('Get behavior analysis failed:', error);
        res.status(500).json({ error: 'Failed to get behavior analysis' });
      }
    });

    // 获取用户行为洞察
    this.app.get('/api/behavior/insights', async (req, res) => {
      try {
        const { region, timeRange = '30d' } = req.query;
        
        const insights = await this.services.userBehaviorService.getBehaviorInsights({
          region,
          timeRange
        });

        res.json({
          success: true,
          insights,
          generatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Get behavior insights failed:', error);
        res.status(500).json({ error: 'Failed to get behavior insights' });
      }
    });
  }

  /**
   * 缓存管理路由
   */
  setupCacheManagementRoutes() {
    // 获取缓存统计
    this.app.get('/api/cache/stats', async (req, res) => {
      try {
        const stats = await this.services.cacheService.getCacheStats();
        res.json({
          success: true,
          stats
        });
      } catch (error) {
        console.error('Get cache stats failed:', error);
        res.status(500).json({ error: 'Failed to get cache stats' });
      }
    });

    // 清除缓存
    this.app.delete('/api/cache', async (req, res) => {
      try {
        const { pattern } = req.query;
        
        let cleared;
        if (pattern) {
          cleared = await this.services.cacheService.clearByPattern(pattern);
        } else {
          cleared = await this.services.cacheService.clearAll();
        }

        res.json({
          success: true,
          cleared,
          message: `Cleared ${cleared} cache entries`
        });
      } catch (error) {
        console.error('Clear cache failed:', error);
        res.status(500).json({ error: 'Failed to clear cache' });
      }
    });

    // 预热缓存
    this.app.post('/api/cache/warmup', async (req, res) => {
      try {
        const { patterns } = req.body;
        const warmedUp = await this.services.cacheService.warmup(patterns);
        
        res.json({
          success: true,
          warmedUp,
          message: `Warmed up ${warmedUp} cache entries`
        });
      } catch (error) {
        console.error('Cache warmup failed:', error);
        res.status(500).json({ error: 'Cache warmup failed' });
      }
    });
  }

  /**
   * 分析报告路由
   */
  setupAnalyticsRoutes() {
    // 获取系统分析报告
    this.app.get('/api/analytics/system', async (req, res) => {
      try {
        const report = await this.services.analyticsService.getSystemAnalytics();
        res.json({
          success: true,
          report
        });
      } catch (error) {
        console.error('Get system analytics failed:', error);
        res.status(500).json({ error: 'Failed to get system analytics' });
      }
    });

    // 获取使用统计
    this.app.get('/api/analytics/usage', async (req, res) => {
      try {
        const { timeRange = '7d', groupBy = 'day' } = req.query;
        const usage = await this.services.analyticsService.getUsageStatistics({
          timeRange,
          groupBy
        });
        
        res.json({
          success: true,
          usage,
          timeRange,
          groupBy
        });
      } catch (error) {
        console.error('Get usage statistics failed:', error);
        res.status(500).json({ error: 'Failed to get usage statistics' });
      }
    });
  }

  /**
   * 初始化服务
   */
  async initializeServices() {
    try {
      // 这里会初始化各个服务实例
      // 实际实现中会注入具体的服务实现
      console.log('Initializing backend services...');
      
      // 占位符 - 实际项目中会替换为真实服务
      this.services.ruleConfigService = new MockRuleConfigService();
      this.services.userBehaviorService = new MockUserBehaviorService();
      this.services.aiModelService = new MockAIModelService();
      this.services.cacheService = new MockCacheService();
      this.services.analyticsService = new MockAnalyticsService();
      
      console.log('Backend services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  }

  /**
   * 错误处理中间件
   */
  errorHandler(error, req, res, next) {
    console.error('API Error:', error);
    
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }

  /**
   * 获取服务状态
   */
  getServiceStatus() {
    return {
      ruleConfig: !!this.services.ruleConfigService,
      userBehavior: !!this.services.userBehaviorService,
      aiModel: !!this.services.aiModelService,
      cache: !!this.services.cacheService,
      analytics: !!this.services.analyticsService
    };
  }

  /**
   * 获取API端点列表
   */
  getAPIEndpoints() {
    return {
      analysis: {
        ai: 'POST /api/analysis/ai',
        aiResult: 'GET /api/analysis/ai/:id',
        aiBatch: 'POST /api/analysis/ai/batch'
      },
      rules: {
        list: 'GET /api/rules',
        category: 'GET /api/rules/:category',
        create: 'POST /api/rules',
        update: 'PUT /api/rules/:id',
        delete: 'DELETE /api/rules/:id',
        batchUpdate: 'PUT /api/rules/batch'
      },
      behavior: {
        track: 'POST /api/behavior/track',
        batchTrack: 'POST /api/behavior/track/batch',
        analysis: 'GET /api/behavior/analysis',
        insights: 'GET /api/behavior/insights'
      },
      cache: {
        stats: 'GET /api/cache/stats',
        clear: 'DELETE /api/cache',
        warmup: 'POST /api/cache/warmup'
      },
      analytics: {
        system: 'GET /api/analytics/system',
        usage: 'GET /api/analytics/usage'
      }
    };
  }

  /**
   * 生成分析ID
   */
  generateAnalysisId() {
    return 'analysis-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 生成批次ID
   */
  generateBatchId() {
    return 'batch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 估算分析时间
   */
  estimateAnalysisTime(contentData, targetRegions) {
    const baseTime = 5000; // 5秒基础时间
    const regionMultiplier = targetRegions.length * 1000; // 每个地区增加1秒
    const contentMultiplier = Math.min((JSON.stringify(contentData).length / 10000) * 1000, 10000);
    
    return Math.round(baseTime + regionMultiplier + contentMultiplier);
  }

  /**
   * 启动服务器
   */
  async start() {
    try {
      await this.initializeServices();
      
      this.server = this.app.listen(this.config.port, () => {
        console.log(`🚀 Cross-Border Analysis API Server running on port ${this.config.port}`);
        console.log(`📖 API Documentation: http://localhost:${this.config.port}/api`);
        console.log(`💚 Health Check: http://localhost:${this.config.port}/health`);
      });

      // 优雅关闭处理
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * 优雅关闭
   */
  async gracefulShutdown(signal) {
    console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
    
    if (this.server) {
      this.server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    }
  }
}

// Mock服务类（实际项目中会替换为真实实现）
class MockRuleConfigService {
  async getAllRules() { return []; }
  async getRulesByCategory(category) { return []; }
  async createRule(ruleData) { return { id: 'mock-rule', ...ruleData }; }
  async updateRule(ruleId, updateData) { return { id: ruleId, ...updateData }; }
  async deleteRule(ruleId) { return true; }
  async batchUpdateRules(rules) { return { updated: rules.length, failed: 0 }; }
}

class MockUserBehaviorService {
  async trackBehavior(behaviorData) { return true; }
  async batchTrackBehaviors(behaviors) { return true; }
  async getBehaviorAnalysis(options) { return { insights: [], stats: {} }; }
  async getBehaviorInsights(options) { return { patterns: [], recommendations: [] }; }
}

class MockAIModelService {
  async performAIAnalysis(contentData, targetRegions, options) {
    return { analysisId: options.analysisId, results: {}, timestamp: new Date().toISOString() };
  }
}

class MockCacheService {
  async getCacheStats() { return { hits: 0, misses: 0, size: 0 }; }
  async clearByPattern(pattern) { return 0; }
  async clearAll() { return 0; }
  async warmup(patterns) { return 0; }
  async getAnalysisResult(id) { return null; }
  async setAnalysisResult(id, result) { return true; }
}

class MockAnalyticsService {
  async getSystemAnalytics() { return { uptime: 0, requests: 0 }; }
  async getUsageStatistics(options) { return { data: [], summary: {} }; }
}

// 导出
module.exports = CrossBorderAnalysisAPIServer;

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  const server = new CrossBorderAnalysisAPIServer({
    port: process.env.PORT || 3000,
    allowedOrigins: ['chrome-extension://*', 'http://localhost:*']
  });
  
  server.start();
}