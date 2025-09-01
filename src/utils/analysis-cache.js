/**
 * 分析结果缓存管理器
 * 提供分析结果的缓存、读取和管理功能
 */

class AnalysisCache {
  constructor() {
    this.cacheKey = 'analysisCache';
    this.defaultMaxCacheSize = 50; // 默认最大缓存条目数
    this.defaultCacheExpiry = 24 * 60 * 60 * 1000; // 默认24小时过期时间 (毫秒)
  }

  /**
   * 获取缓存配置
   */
  async getCacheConfig() {
    try {
      const result = await chrome.storage.sync.get('settings');
      const settings = result.settings || {};
      
      return {
        maxCacheSize: settings.maxCacheSize || this.defaultMaxCacheSize,
        cacheExpiry: (settings.cacheExpiry || 24) * 60 * 60 * 1000, // 转换小时为毫秒
        enabled: settings.enableCache !== false
      };
    } catch (error) {
      console.error('Failed to get cache config:', error);
      return {
        maxCacheSize: this.defaultMaxCacheSize,
        cacheExpiry: this.defaultCacheExpiry,
        enabled: true
      };
    }
  }

  /**
   * 生成缓存键
   * @param {string} url - 页面URL
   * @param {Array} regions - 分析地区
   * @returns {string} 缓存键
   */
  generateCacheKey(url, regions) {
    // 使用URL和地区组合作为键，确保相同URL+地区组合能找到缓存
    const normalizedUrl = this.normalizeUrl(url);
    const sortedRegions = [...regions].sort().join(',');
    return `${normalizedUrl}|${sortedRegions}`;
  }

  /**
   * 标准化URL (移除查询参数和锚点，便于缓存匹配)
   * @param {string} url - 原始URL
   * @returns {string} 标准化后的URL
   */
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch (error) {
      console.warn('URL标准化失败:', error);
      return url;
    }
  }

  /**
   * 获取缓存的分析结果
   * @param {string} url - 页面URL
   * @param {Array} regions - 分析地区
   * @returns {Object|null} 缓存的分析结果或null
   */
  async getCachedResult(url, regions) {
    try {
      const config = await this.getCacheConfig();
      if (!config.enabled) {
        return null;
      }

      const cacheKey = this.generateCacheKey(url, regions);
      const result = await chrome.storage.local.get(this.cacheKey);
      const cache = result[this.cacheKey] || {};
      
      const cachedItem = cache[cacheKey];
      
      if (!cachedItem) {
        console.log('缓存未命中:', cacheKey);
        return null;
      }

      // 检查是否过期
      const now = Date.now();
      if (now - cachedItem.timestamp > config.cacheExpiry) {
        console.log('缓存已过期:', cacheKey);
        await this.removeCachedResult(cacheKey);
        return null;
      }

      console.log('缓存命中:', cacheKey);
      return {
        ...cachedItem.data,
        fromCache: true,
        cacheTimestamp: cachedItem.timestamp
      };

    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  }

  /**
   * 保存分析结果到缓存
   * @param {string} url - 页面URL
   * @param {Array} regions - 分析地区
   * @param {Object} analysisData - 分析结果数据
   */
  async setCachedResult(url, regions, analysisData) {
    try {
      const config = await this.getCacheConfig();
      if (!config.enabled) {
        return;
      }

      const cacheKey = this.generateCacheKey(url, regions);
      const result = await chrome.storage.local.get(this.cacheKey);
      let cache = result[this.cacheKey] || {};

      // 检查缓存大小，如果超过限制则清理最旧的条目
      const cacheKeys = Object.keys(cache);
      if (cacheKeys.length >= config.maxCacheSize) {
        await this.cleanupOldCache(cache, config);
        // 重新获取清理后的缓存
        const freshResult = await chrome.storage.local.get(this.cacheKey);
        cache = freshResult[this.cacheKey] || {};
      }

      // 保存新的缓存条目
      cache[cacheKey] = {
        timestamp: Date.now(),
        data: {
          ...analysisData,
          fromCache: false // 标记这是原始数据，不是来自缓存
        }
      };

      await chrome.storage.local.set({ [this.cacheKey]: cache });
      console.log('分析结果已缓存:', cacheKey);

    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  }

  /**
   * 移除特定的缓存条目
   * @param {string} cacheKey - 缓存键
   */
  async removeCachedResult(cacheKey) {
    try {
      const result = await chrome.storage.local.get(this.cacheKey);
      const cache = result[this.cacheKey] || {};
      
      if (cache[cacheKey]) {
        delete cache[cacheKey];
        await chrome.storage.local.set({ [this.cacheKey]: cache });
        console.log('缓存条目已删除:', cacheKey);
      }
    } catch (error) {
      console.error('删除缓存失败:', error);
    }
  }

  /**
   * 清理过期的缓存条目
   */
  async cleanupExpiredCache() {
    try {
      const config = await this.getCacheConfig();
      const result = await chrome.storage.local.get(this.cacheKey);
      const cache = result[this.cacheKey] || {};
      const now = Date.now();
      let cleanedCount = 0;

      Object.keys(cache).forEach(key => {
        if (now - cache[key].timestamp > config.cacheExpiry) {
          delete cache[key];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        await chrome.storage.local.set({ [this.cacheKey]: cache });
        console.log(`已清理 ${cleanedCount} 个过期缓存条目`);
      }

      return cleanedCount;
    } catch (error) {
      console.error('清理过期缓存失败:', error);
      return 0;
    }
  }

  /**
   * 清理最旧的缓存条目 (当缓存达到大小限制时)
   * @param {Object} cache - 当前缓存对象
   * @param {Object} config - 缓存配置
   */
  async cleanupOldCache(cache, config) {
    try {
      const entries = Object.entries(cache);
      // 按时间戳排序，删除最旧的条目
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // 删除最旧的25%条目
      const deleteCount = Math.floor(entries.length * 0.25) || 1;
      
      for (let i = 0; i < deleteCount; i++) {
        delete cache[entries[i][0]];
      }

      await chrome.storage.local.set({ [this.cacheKey]: cache });
      console.log(`已清理 ${deleteCount} 个最旧的缓存条目`);
    } catch (error) {
      console.error('清理旧缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  async getCacheStats() {
    try {
      const config = await this.getCacheConfig();
      const result = await chrome.storage.local.get(this.cacheKey);
      const cache = result[this.cacheKey] || {};
      const entries = Object.entries(cache);
      const now = Date.now();

      const stats = {
        totalEntries: entries.length,
        expiredEntries: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null
      };

      entries.forEach(([key, item]) => {
        if (now - item.timestamp > config.cacheExpiry) {
          stats.expiredEntries++;
        }

        // 估算数据大小
        stats.totalSize += JSON.stringify(item).length;

        // 记录最旧和最新条目时间
        if (!stats.oldestEntry || item.timestamp < stats.oldestEntry) {
          stats.oldestEntry = item.timestamp;
        }
        if (!stats.newestEntry || item.timestamp > stats.newestEntry) {
          stats.newestEntry = item.timestamp;
        }
      });

      // 转换大小为可读格式
      stats.totalSizeFormatted = this.formatBytes(stats.totalSize);

      return stats;
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return null;
    }
  }

  /**
   * 清空所有缓存
   */
  async clearAllCache() {
    try {
      await chrome.storage.local.remove(this.cacheKey);
      console.log('所有缓存已清空');
      return true;
    } catch (error) {
      console.error('清空缓存失败:', error);
      return false;
    }
  }

  /**
   * 格式化字节大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 检查是否应该使用缓存
   * @param {Object} settings - 用户设置
   * @returns {boolean} 是否启用缓存
   */
  isCacheEnabled(settings) {
    return settings?.enableCache !== false; // 默认启用
  }

  /**
   * 获取缓存中的所有条目 (用于管理界面)
   * @returns {Array} 缓存条目列表
   */
  async getAllCacheEntries() {
    try {
      const config = await this.getCacheConfig();
      const result = await chrome.storage.local.get(this.cacheKey);
      const cache = result[this.cacheKey] || {};
      
      return Object.entries(cache).map(([key, item]) => ({
        key,
        url: item.data.url,
        regions: key.split('|')[1],
        timestamp: item.timestamp,
        age: Date.now() - item.timestamp,
        size: JSON.stringify(item).length,
        expired: Date.now() - item.timestamp > config.cacheExpiry
      }));
    } catch (error) {
      console.error('获取缓存条目失败:', error);
      return [];
    }
  }
}

// 导出缓存管理器
if (typeof window !== 'undefined') {
  window.AnalysisCache = AnalysisCache;
} else {
  module.exports = AnalysisCache;
}