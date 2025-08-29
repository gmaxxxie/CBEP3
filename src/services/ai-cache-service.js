/**
 * AI Analysis Caching Service
 * AI分析缓存服务，优化AI调用成本和性能
 */

class AIAnalysisCacheService {
  constructor() {
    this.cache = new Map();
    this.config = {
      maxCacheSize: 1000, // 最大缓存条目数
      defaultTTL: 24 * 60 * 60 * 1000, // 24小时过期
      shortTTL: 1 * 60 * 60 * 1000,    // 1小时过期（用于频繁变化内容）
      longTTL: 7 * 24 * 60 * 60 * 1000, // 7天过期（用于稳定内容）
      compressionEnabled: true,
      persistToStorage: true
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      saves: 0,
      evictions: 0
    };

    this.initialize();
  }

  /**
   * 初始化缓存服务
   */
  async initialize() {
    if (this.config.persistToStorage) {
      await this.loadFromStorage();
    }
    
    // 定期清理过期缓存
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // 每小时清理一次

    console.log('AI Analysis Cache Service initialized');
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(content, analysisType, options = {}) {
    const keyData = {
      content: this.hashContent(content),
      type: analysisType,
      options: this.normalizeOptions(options),
      version: '1.0' // 缓存版本，用于失效处理
    };

    return this.hashObject(keyData);
  }

  /**
   * 内容哈希
   */
  hashContent(content) {
    if (typeof content === 'object') {
      content = JSON.stringify(content);
    }
    
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * 对象哈希
   */
  hashObject(obj) {
    return this.hashContent(JSON.stringify(obj));
  }

  /**
   * 规范化选项
   */
  normalizeOptions(options) {
    const normalized = { ...options };
    
    // 移除不影响分析结果的选项
    delete normalized.requestId;
    delete normalized.timestamp;
    delete normalized.userId;
    
    // 排序键以确保一致性
    return Object.keys(normalized)
      .sort()
      .reduce((result, key) => {
        result[key] = normalized[key];
        return result;
      }, {});
  }

  /**
   * 获取缓存条目
   */
  async get(content, analysisType, options = {}) {
    const key = this.generateCacheKey(content, analysisType, options);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // 检查过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.evictions++;
      return null;
    }
    
    // 更新访问时间
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    
    this.stats.hits++;
    
    // 解压缩数据
    const data = this.config.compressionEnabled ? 
      this.decompress(entry.data) : entry.data;
    
    console.log(`Cache HIT for ${analysisType}: ${key.substring(0, 8)}`);
    
    return {
      ...data,
      cached: true,
      cacheKey: key,
      cachedAt: entry.cachedAt,
      accessCount: entry.accessCount
    };
  }

  /**
   * 设置缓存条目
   */
  async set(content, analysisType, result, options = {}) {
    const key = this.generateCacheKey(content, analysisType, options);
    const ttl = this.determineTTL(content, analysisType, options);
    
    // 压缩数据
    const data = this.config.compressionEnabled ? 
      this.compress(result) : result;
    
    const entry = {
      key,
      data,
      analysisType,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now(),
      accessCount: 0,
      contentHash: this.hashContent(content),
      size: JSON.stringify(data).length
    };
    
    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, entry);
    this.stats.saves++;
    
    console.log(`Cache SET for ${analysisType}: ${key.substring(0, 8)}, TTL: ${ttl}ms`);
    
    // 持久化到存储
    if (this.config.persistToStorage) {
      await this.saveToStorage(key, entry);
    }
    
    return key;
  }

  /**
   * 确定TTL
   */
  determineTTL(content, analysisType, options) {
    // 根据分析类型调整TTL
    const typeTTLMap = {
      'language': this.config.longTTL,     // 语言分析相对稳定
      'culture': this.config.longTTL,      // 文化分析相对稳定
      'compliance': this.config.defaultTTL, // 合规要求可能变化
      'userExperience': this.config.shortTTL, // 用户体验可能频繁优化
      'ai-deep-analysis': this.config.defaultTTL, // AI深度分析
      'network-performance': this.config.shortTTL  // 网络性能变化较快
    };
    
    let baseTTL = typeTTLMap[analysisType] || this.config.defaultTTL;
    
    // 根据内容类型调整
    if (typeof content === 'object' && content.url) {
      // 静态页面使用更长的TTL
      if (content.url.includes('/about') || content.url.includes('/contact')) {
        baseTTL *= 2;
      }
      
      // 产品页面使用中等TTL
      if (content.url.includes('/product') || content.url.includes('/shop')) {
        baseTTL *= 1.5;
      }
      
      // 首页和分类页使用默认TTL
    }
    
    // 根据内容大小调整（大内容缓存更久）
    const contentSize = JSON.stringify(content).length;
    if (contentSize > 50000) { // 50KB以上
      baseTTL *= 1.2;
    }
    
    return Math.min(baseTTL, this.config.longTTL);
  }

  /**
   * 淘汰最少使用的条目
   */
  evictLRU() {
    let lruKey = null;
    let lruTime = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
      console.log(`Evicted LRU cache entry: ${lruKey.substring(0, 8)}`);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    let cleanupCount = 0;
    
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanupCount++;
      }
    }
    
    if (cleanupCount > 0) {
      this.stats.evictions += cleanupCount;
      console.log(`Cleaned up ${cleanupCount} expired cache entries`);
    }
  }

  /**
   * 智能预热缓存
   */
  async preloadCache(commonContents, analysisTypes) {
    console.log('Starting cache preload...');
    
    const preloadPromises = [];
    
    for (const content of commonContents) {
      for (const analysisType of analysisTypes) {
        // 检查是否已缓存
        const existing = await this.get(content, analysisType);
        if (!existing) {
          // 模拟预加载（实际项目中会调用真实的AI分析）
          const mockResult = this.generateMockAnalysisResult(analysisType);
          preloadPromises.push(
            this.set(content, analysisType, mockResult)
          );
        }
      }
    }
    
    await Promise.all(preloadPromises);
    console.log(`Preloaded ${preloadPromises.length} cache entries`);
  }

  /**
   * 生成模拟分析结果（用于预热）
   */
  generateMockAnalysisResult(analysisType) {
    return {
      type: analysisType,
      result: `Mock ${analysisType} analysis result`,
      confidence: 0.8,
      timestamp: Date.now(),
      preloaded: true
    };
  }

  /**
   * 压缩数据
   */
  compress(data) {
    // 简化的压缩实现，实际可以使用LZ77等算法
    const jsonString = JSON.stringify(data);
    
    // 基本的字符串压缩
    const compressed = {
      original: jsonString,
      compressed: true,
      size: jsonString.length
    };
    
    return compressed;
  }

  /**
   * 解压缩数据
   */
  decompress(compressedData) {
    if (!compressedData.compressed) {
      return compressedData;
    }
    
    return JSON.parse(compressedData.original);
  }

  /**
   * 批量缓存操作
   */
  async batchSet(operations) {
    const results = [];
    
    for (const { content, analysisType, result, options } of operations) {
      const key = await this.set(content, analysisType, result, options);
      results.push(key);
    }
    
    return results;
  }

  /**
   * 批量获取操作
   */
  async batchGet(requests) {
    const results = [];
    
    for (const { content, analysisType, options } of requests) {
      const result = await this.get(content, analysisType, options);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 缓存统计信息
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    return {
      ...this.stats,
      totalRequests,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: this.cache.size,
      maxCacheSize: this.config.maxCacheSize,
      memoryUsage: this.calculateMemoryUsage()
    };
  }

  /**
   * 计算内存使用量
   */
  calculateMemoryUsage() {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache) {
      totalSize += entry.size || 0;
    }
    
    return {
      totalBytes: totalSize,
      totalKB: Math.round(totalSize / 1024),
      totalMB: Math.round(totalSize / (1024 * 1024)),
      averageEntrySize: this.cache.size > 0 ? Math.round(totalSize / this.cache.size) : 0
    };
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, saves: 0, evictions: 0 };
    console.log('Cache cleared');
  }

  /**
   * 删除特定条目
   */
  delete(content, analysisType, options = {}) {
    const key = this.generateCacheKey(content, analysisType, options);
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      console.log(`Deleted cache entry: ${key.substring(0, 8)}`);
    }
    
    return deleted;
  }

  /**
   * 按条件删除缓存
   */
  deleteByPattern(pattern) {
    let deletedCount = 0;
    
    for (const [key, entry] of this.cache) {
      if (pattern.test && pattern.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      } else if (typeof pattern === 'string' && key.includes(pattern)) {
        this.cache.delete(key);
        deletedCount++;
      } else if (typeof pattern === 'function' && pattern(entry)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    console.log(`Deleted ${deletedCount} cache entries by pattern`);
    return deletedCount;
  }

  /**
   * 保存到本地存储
   */
  async saveToStorage(key, entry) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Chrome扩展存储
        const storageKey = `aiCache_${key}`;
        await chrome.storage.local.set({
          [storageKey]: {
            ...entry,
            data: undefined // 不持久化数据，只保存元信息
          }
        });
      }
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  async loadFromStorage() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get();
        let loadedCount = 0;
        
        Object.entries(result).forEach(([storageKey, entry]) => {
          if (storageKey.startsWith('aiCache_')) {
            const key = storageKey.replace('aiCache_', '');
            // 只加载未过期的条目元信息
            if (Date.now() < entry.expiresAt) {
              // 实际数据需要重新获取，这里只恢复缓存结构
              loadedCount++;
            }
          }
        });
        
        console.log(`Loaded ${loadedCount} cache entries from storage`);
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * 导出缓存分析报告
   */
  generateCacheReport() {
    const stats = this.getStats();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 12),
      type: entry.analysisType,
      size: entry.size,
      cachedAt: new Date(entry.cachedAt).toISOString(),
      expiresAt: new Date(entry.expiresAt).toISOString(),
      accessCount: entry.accessCount,
      ttl: Math.round((entry.expiresAt - Date.now()) / 1000 / 60) // 剩余分钟
    }));
    
    return {
      summary: stats,
      entries: entries.slice(0, 20), // 只显示前20个条目
      recommendations: this.generateCacheRecommendations(stats)
    };
  }

  /**
   * 生成缓存优化建议
   */
  generateCacheRecommendations(stats) {
    const recommendations = [];
    
    if (stats.hitRate < 50) {
      recommendations.push({
        type: 'hitRate',
        message: '缓存命中率较低，建议调整TTL策略或预热常用内容',
        priority: 'high'
      });
    }
    
    if (stats.memoryUsage.totalMB > 50) {
      recommendations.push({
        type: 'memory',
        message: '缓存内存使用量较高，考虑减少缓存大小或启用压缩',
        priority: 'medium'
      });
    }
    
    if (stats.cacheSize / stats.maxCacheSize > 0.9) {
      recommendations.push({
        type: 'capacity',
        message: '缓存接近容量上限，建议增加maxCacheSize或优化淘汰策略',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAnalysisCacheService;
} else {
  window.AIAnalysisCacheService = AIAnalysisCacheService;
}