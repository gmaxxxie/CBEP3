// 自动打包的核心服务文件

// === src/utils/analysis-cache.js ===
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

// === src/data/data-loader.js ===
/**
 * Data Loader Service
 * 加载和管理本地数据源，为规则引擎提供数据支持
 */

class DataLoader {
  constructor() {
    this.data = {
      countries: null,
      holidays: null,
      privacyRegions: null,
      taxes: null,
      timezones: null,
      addresses: null,
      tlds: null,
      rates: null,
      cldr: null
    };
    this.loaded = false;
    this.loadPromise = null;
  }

  /**
   * 加载所有数据源
   */
  async loadAllData() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadData();
    return this.loadPromise;
  }

  async _loadData() {
    try {
      // 并行加载所有数据文件
      const [
        countries,
        holidays, 
        privacyRegions,
        taxes,
        timezones,
        addresses,
        tlds,
        rates,
        cldr
      ] = await Promise.allSettled([
        this._loadJSON('/data/sources/countries.json'),
        this._loadJSON('/data/sources/holidays.json'),
        this._loadJSON('/data/sources/privacy_regions.json'),
        this._loadJSON('/data/sources/taxes.json'),
        this._loadJSON('/data/sources/timezones.json'),
        this._loadJSON('/data/sources/addresses.json'),
        this._loadJSON('/data/sources/tlds.json'),
        this._loadJSON('/data/sources/rates-ecb.json'),
        this._loadJSON('/data/sources/cldr-core.json')
      ]);

      // 处理加载结果
      this.data.countries = countries.status === 'fulfilled' ? countries.value : null;
      this.data.holidays = holidays.status === 'fulfilled' ? holidays.value : null;
      this.data.privacyRegions = privacyRegions.status === 'fulfilled' ? privacyRegions.value : null;
      this.data.taxes = taxes.status === 'fulfilled' ? taxes.value : null;
      this.data.timezones = timezones.status === 'fulfilled' ? timezones.value : null;
      this.data.addresses = addresses.status === 'fulfilled' ? addresses.value : null;
      this.data.tlds = tlds.status === 'fulfilled' ? tlds.value : null;
      this.data.rates = rates.status === 'fulfilled' ? rates.value : null;
      this.data.cldr = cldr.status === 'fulfilled' ? cldr.value : null;

      this.loaded = true;

      console.log('Data Loader: All data sources loaded', {
        countries: !!this.data.countries,
        holidays: !!this.data.holidays,
        privacyRegions: !!this.data.privacyRegions,
        taxes: !!this.data.taxes,
        timezones: !!this.data.timezones,
        addresses: !!this.data.addresses,
        tlds: !!this.data.tlds,
        rates: !!this.data.rates,
        cldr: !!this.data.cldr
      });

      return this.data;
    } catch (error) {
      console.error('Data Loader: Failed to load data sources', error);
      throw error;
    }
  }

  async _loadJSON(path) {
    try {
      const response = await fetch(chrome.runtime.getURL(path));
      if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Data Loader: Failed to load ${path}`, error);
      throw error;
    }
  }

  /**
   * 获取国家信息
   */
  getCountryInfo(countryCode) {
    if (!this.data.countries || !this.data.countries.data) {
      return null;
    }

    return this.data.countries.data.find(
      country => 
        country.countryCode === countryCode || 
        country.countryCode3 === countryCode
    );
  }

  /**
   * 获取国家语言列表
   */
  getCountryLanguages(countryCode) {
    const country = this.getCountryInfo(countryCode);
    return country ? Object.values(country.languages || {}) : [];
  }

  /**
   * 获取国家货币信息
   */
  getCountryCurrencies(countryCode) {
    const country = this.getCountryInfo(countryCode);
    return country ? country.currencies : {};
  }

  /**
   * 获取隐私政策要求
   */
  getPrivacyRequirements(countryCode) {
    if (!this.data.privacyRegions || !this.data.privacyRegions.data) {
      return null;
    }

    const regions = this.data.privacyRegions.data.regions;
    return regions[countryCode] || null;
  }

  /**
   * 获取国家假日信息
   */
  getCountryHolidays(countryCode) {
    if (!this.data.holidays || !this.data.holidays.data) {
      return [];
    }

    // holidays.json结构需要进一步分析来实现完整的假日查询
    const countries = this.data.holidays.data.countries || [];
    return countries.includes(countryCode) ? [] : [];
  }

  /**
   * 检查是否为严格隐私保护地区 (GDPR等)
   */
  isStrictPrivacyRegion(countryCode) {
    const privacy = this.getPrivacyRequirements(countryCode);
    return privacy && privacy.regime === 'strict';
  }

  /**
   * 检查是否需要Cookie同意
   */
  requiresCookieConsent(countryCode) {
    const privacy = this.getPrivacyRequirements(countryCode);
    return privacy && (
      privacy.cookie_consent === 'required' || 
      privacy.cookie_consent === 'likely_required'
    );
  }

  /**
   * 获取适用的法律法规
   */
  getApplicableLaws(countryCode) {
    const privacy = this.getPrivacyRequirements(countryCode);
    return privacy ? privacy.laws || [] : [];
  }

  /**
   * 检查国家是否支持特定语言
   */
  supportsLanguage(countryCode, languageCode) {
    const languages = this.getCountryLanguages(countryCode);
    return languages.some(lang => 
      lang.toLowerCase().includes(languageCode.toLowerCase())
    );
  }

  /**
   * 获取国家的主要语言
   */
  getPrimaryLanguage(countryCode) {
    const country = this.getCountryInfo(countryCode);
    if (!country || !country.languages) {
      return null;
    }

    const languages = Object.keys(country.languages);
    return languages[0] || null;
  }

  /**
   * 获取所有可用的国家代码
   */
  getAllCountryCodes() {
    if (!this.data.countries || !this.data.countries.data) {
      return [];
    }

    return this.data.countries.data.map(country => country.countryCode);
  }

  /**
   * 检查数据是否已加载
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * 获取数据源元信息
   */
  getMetaInfo() {
    const meta = {};
    Object.keys(this.data).forEach(key => {
      if (this.data[key] && this.data[key]._meta) {
        meta[key] = this.data[key]._meta;
      }
    });
    return meta;
  }
}

// 创建全局实例
const dataLoader = new DataLoader();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataLoader;
} else {
  window.DataLoader = DataLoader;
  window.dataLoader = dataLoader;
}

// === src/rules/rule-engine.js ===
// 本地规则引擎 - 快速分析地域适配性
class LocalRuleEngine {
  constructor() {
    this.regions = this.initializeRegions();
    this.rules = this.initializeRules();
    this.dataLoader = null;
    this.dataLoaded = false;
  }

  // 初始化数据加载器
  async initializeDataLoader() {
    if (!this.dataLoader) {
      this.dataLoader = window.dataLoader || new DataLoader();
      await this.dataLoader.loadAllData();
      this.dataLoaded = true;
      
      // 更新规则实例，传入数据加载器
      this.rules = {
        language: new LanguageRules(this.dataLoader),
        culture: new CultureRules(this.dataLoader),
        compliance: new ComplianceRules(this.dataLoader),
        userExperience: new UserExperienceRules(this.dataLoader)
      };
    }
    return this.dataLoader;
  }

  // 初始化支持的地区
  initializeRegions() {
    return {
      'US': { name: '美国', currency: 'USD', language: 'en', rtl: false },
      'GB': { name: '英国', currency: 'GBP', language: 'en', rtl: false },
      'DE': { name: '德国', currency: 'EUR', language: 'de', rtl: false },
      'FR': { name: '法国', currency: 'EUR', language: 'fr', rtl: false },
      'JP': { name: '日本', currency: 'JPY', language: 'ja', rtl: false },
      'KR': { name: '韩国', currency: 'KRW', language: 'ko', rtl: false },
      'CN': { name: '中国', currency: 'CNY', language: 'zh-CN', rtl: false },
      'AE': { name: '阿联酋', currency: 'AED', language: 'ar', rtl: true },
      'SA': { name: '沙特阿拉伯', currency: 'SAR', language: 'ar', rtl: true },
      'BR': { name: '巴西', currency: 'BRL', language: 'pt', rtl: false },
      'MX': { name: '墨西哥', currency: 'MXN', language: 'es', rtl: false },
      'ES': { name: '西班牙', currency: 'EUR', language: 'es', rtl: false }
    };
  }

  // 初始化分析规则
  initializeRules() {
    return {
      language: new LanguageRules(),
      culture: new CultureRules(),
      compliance: new ComplianceRules(),
      userExperience: new UserExperienceRules()
    };
  }

  // 执行完整分析
  async analyze(extractedData, targetRegions = ['US']) {
    // 确保数据已加载
    await this.initializeDataLoader();
    
    const results = {};

    targetRegions.forEach(region => {
      results[region] = {
        region: this.regions[region],
        language: this.rules.language.analyze(extractedData, region),
        culture: this.rules.culture.analyze(extractedData, region),
        compliance: this.rules.compliance.analyze(extractedData, region),
        userExperience: this.rules.userExperience.analyze(extractedData, region),
        overallScore: 0,
        recommendations: []
      };

      // 计算总体评分
      results[region].overallScore = this.calculateOverallScore(results[region]);
      
      // 生成推荐建议
      results[region].recommendations = this.generateRecommendations(results[region], extractedData);
    });

    return {
      timestamp: new Date().toISOString(),
      url: extractedData.url,
      results: results
    };
  }

  // 计算总体评分
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

  // 生成优化建议
  generateRecommendations(regionResult, extractedData) {
    const recommendations = [];

    // 语言相关建议
    if (regionResult.language.score < 70) {
      recommendations.push({
        category: 'language',
        priority: 'high',
        issue: '语言适配性不足',
        suggestion: regionResult.language.issues.join('; ')
      });
    }

    // 文化相关建议
    if (regionResult.culture.score < 70) {
      recommendations.push({
        category: 'culture',
        priority: 'medium',
        issue: '文化适配需要改进',
        suggestion: regionResult.culture.issues.join('; ')
      });
    }

    // 合规性建议
    if (regionResult.compliance.score < 80) {
      recommendations.push({
        category: 'compliance',
        priority: 'high',
        issue: '合规性风险',
        suggestion: regionResult.compliance.issues.join('; ')
      });
    }

    // 用户体验建议
    if (regionResult.userExperience.score < 75) {
      recommendations.push({
        category: 'userExperience',
        priority: 'medium',
        issue: '用户体验可优化',
        suggestion: regionResult.userExperience.issues.join('; ')
      });
    }

    return recommendations;
  }
}

// 语言规则类
class LanguageRules {
  constructor(dataLoader = null) {
    this.dataLoader = dataLoader;
    this.languageDetectors = {
      'zh-CN': /[\u4e00-\u9fff]/g,
      'en': /^[a-zA-Z\s.,!?\-'"]+$/,
      'es': /[ñáéíóúü]/gi,
      'fr': /[àâäçéèêëïîôùûüÿæœ]/gi,
      'de': /[äöüßÄÖÜ]/gi,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/g,
      'ko': /[\uac00-\ud7af]/g,
      'ar': /[\u0600-\u06FF]/g
    };

    this.commonTerms = {
      'US': ['shipping', 'delivery', 'customer service', 'returns', 'warranty'],
      'CN': ['物流', '配送', '客服', '退货', '保修'],
      'DE': ['versand', 'lieferung', 'kundenservice', 'rücksendung', 'garantie'],
      'JP': ['配送', 'お客様サービス', '返品', '保証'],
      'KR': ['배송', '고객서비스', '반품', '보증']
    };
  }

  analyze(data, targetRegion) {
    const targetLang = this.getTargetLanguage(targetRegion);
    const issues = [];
    let score = 100;

    // 检查声明语言与目标语言是否匹配
    if (data.language.declared && data.language.declared !== targetLang) {
      issues.push(`页面声明语言(${data.language.declared})与目标地区语言(${targetLang})不匹配`);
      score -= 20;
    }

    // 检查内容语言一致性
    const contentLangMatch = this.checkContentLanguageConsistency(data.text, targetLang);
    if (!contentLangMatch.consistent) {
      issues.push('内容语言与目标地区不一致');
      score -= contentLangMatch.penalty;
    }

    // 检查关键术语本地化
    const termLocalization = this.checkTermLocalization(data, targetRegion);
    if (!termLocalization.adequate) {
      issues.push('关键术语需要本地化');
      score -= 15;
    }

    // 检查多语言支持
    const multiLangSupport = this.checkMultiLanguageSupport(data);
    if (!multiLangSupport && targetRegion !== 'US') {
      issues.push('缺乏多语言切换选项');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues: issues,
      details: {
        declaredLanguage: data.language.declared,
        detectedLanguage: data.language.detected,
        targetLanguage: targetLang,
        contentConsistency: contentLangMatch,
        termLocalization: termLocalization
      }
    };
  }

  getTargetLanguage(region) {
    // 优先使用数据加载器中的真实国家语言数据
    if (this.dataLoader && this.dataLoader.isLoaded()) {
      const primaryLang = this.dataLoader.getPrimaryLanguage(region);
      if (primaryLang) {
        // 转换语言代码到标准格式
        const langMap = {
          'Dutch': 'nl', 'English': 'en', 'German': 'de', 'French': 'fr',
          'Spanish': 'es', 'Portuguese': 'pt', 'Chinese': 'zh-CN',
          'Japanese': 'ja', 'Korean': 'ko', 'Arabic': 'ar'
        };
        return langMap[primaryLang] || primaryLang.toLowerCase().slice(0, 2);
      }
    }
    
    // 回退到静态映射
    const regionLanguages = {
      'US': 'en', 'GB': 'en', 'CA': 'en',
      'CN': 'zh-CN', 'TW': 'zh-TW', 'HK': 'zh-HK',
      'JP': 'ja', 'KR': 'ko',
      'DE': 'de', 'FR': 'fr', 'ES': 'es', 'IT': 'it',
      'AE': 'ar', 'SA': 'ar',
      'BR': 'pt', 'MX': 'es'
    };
    return regionLanguages[region] || 'en';
  }

  checkContentLanguageConsistency(textData, targetLang) {
    let totalText = '';
    
    // 合并所有文本内容
    if (textData.headings) {
      Object.values(textData.headings).forEach(headings => {
        headings.forEach(h => totalText += h.text + ' ');
      });
    }
    if (textData.paragraphs) {
      totalText += textData.paragraphs.join(' ');
    }
    if (textData.buttons) {
      totalText += textData.buttons.join(' ');
    }

    const sample = totalText.slice(0, 2000);
    const detector = this.languageDetectors[targetLang];
    
    if (!detector) return { consistent: true, penalty: 0 };

    const matches = (sample.match(detector) || []).length;
    const total = sample.length;
    const ratio = total > 0 ? matches / total : 0;

    // 根据语言类型调整阈值
    const threshold = targetLang.includes('zh') || targetLang === 'ja' || targetLang === 'ko' ? 0.3 : 0.8;
    
    return {
      consistent: ratio >= threshold,
      penalty: ratio < threshold ? Math.min(30, Math.floor((threshold - ratio) * 100)) : 0,
      ratio: ratio
    };
  }

  checkTermLocalization(data, region) {
    const expectedTerms = this.commonTerms[region] || [];
    if (expectedTerms.length === 0) return { adequate: true };

    let foundTerms = 0;
    const allText = JSON.stringify(data.text).toLowerCase();
    
    expectedTerms.forEach(term => {
      if (allText.includes(term.toLowerCase())) {
        foundTerms++;
      }
    });

    return {
      adequate: foundTerms / expectedTerms.length >= 0.3,
      foundRatio: foundTerms / expectedTerms.length
    };
  }

  checkMultiLanguageSupport(data) {
    const langSwitchers = [
      'language', 'lang', '语言', 'language selector',
      'idioma', 'langue', 'sprache', '언어', '言語'
    ];
    
    const allText = JSON.stringify(data).toLowerCase();
    return langSwitchers.some(term => allText.includes(term));
  }
}

// 文化规则类
class CultureRules {
  constructor(dataLoader = null) {
    this.dataLoader = dataLoader;
    this.culturalData = this.initializeCulturalData();
  }

  initializeCulturalData() {
    return {
      colors: {
        'CN': { avoid: ['white'], prefer: ['red', 'gold'] },
        'JP': { avoid: ['green'], prefer: ['white', 'red'] },
        'IN': { avoid: ['black'], prefer: ['orange', 'yellow'] },
        'AE': { avoid: ['pink'], prefer: ['green', 'gold'] }
      },
      symbols: {
        'CN': { avoid: ['clock', 'knife'], sensitive: ['dragon', 'phoenix'] },
        'IN': { respect: ['lotus', 'elephant'], avoid: ['cow'] },
        'JP': { respect: ['cherry blossom', 'crane'], avoid: ['four'] },
        'AE': { respect: ['crescent', 'palm'], avoid: ['pig', 'alcohol'] }
      },
      holidays: {
        'CN': ['chinese new year', 'mid-autumn', 'golden week'],
        'US': ['thanksgiving', 'independence day', 'memorial day'],
        'IN': ['diwali', 'holi', 'dussehra'],
        'AE': ['ramadan', 'eid', 'national day']
      }
    };
  }

  analyze(data, targetRegion) {
    const issues = [];
    let score = 100;

    // 检查颜色使用
    const colorAnalysis = this.analyzeColors(data, targetRegion);
    if (colorAnalysis.hasIssues) {
      issues.push('颜色选择可能存在文化敏感性');
      score -= colorAnalysis.penalty;
    }

    // 检查图片内容
    const imageAnalysis = this.analyzeImages(data, targetRegion);
    if (imageAnalysis.hasIssues) {
      issues.push('图片内容需要文化适配');
      score -= imageAnalysis.penalty;
    }

    // 检查节日营销
    const holidayAnalysis = this.analyzeHolidayContent(data, targetRegion);
    if (holidayAnalysis.hasIssues) {
      issues.push('节日营销内容不符合当地习俗');
      score -= holidayAnalysis.penalty;
    }

    // 检查文本方向 (RTL语言)
    const textDirectionAnalysis = this.analyzeTextDirection(data, targetRegion);
    if (textDirectionAnalysis.hasIssues) {
      issues.push('文本方向不适合该地区语言习惯');
      score -= textDirectionAnalysis.penalty;
    }

    return {
      score: Math.max(0, score),
      issues: issues,
      details: {
        colors: colorAnalysis,
        images: imageAnalysis,
        holidays: holidayAnalysis,
        textDirection: textDirectionAnalysis
      }
    };
  }

  analyzeColors(data, region) {
    // 简化实现 - 实际需要分析CSS样式
    return { hasIssues: false, penalty: 0 };
  }

  analyzeImages(data, region) {
    const sensitiveContent = this.culturalData.symbols[region];
    if (!sensitiveContent || !data.images) {
      return { hasIssues: false, penalty: 0 };
    }

    let issues = 0;
    data.images.forEach(img => {
      const alt = (img.alt || '').toLowerCase();
      const src = (img.src || '').toLowerCase();
      
      if (sensitiveContent.avoid) {
        sensitiveContent.avoid.forEach(term => {
          if (alt.includes(term) || src.includes(term)) {
            issues++;
          }
        });
      }
    });

    return {
      hasIssues: issues > 0,
      penalty: Math.min(20, issues * 5),
      issueCount: issues
    };
  }

  analyzeHolidayContent(data, region) {
    // 使用真实假日数据进行分析
    if (this.dataLoader && this.dataLoader.isLoaded()) {
      const holidays = this.dataLoader.getCountryHolidays(region);
      // 检查页面内容是否包含不当的假日营销
      // 这里可以根据假日数据进行更复杂的分析
    }
    
    // 基础分析：检查是否有明显的节日不匹配
    const allText = JSON.stringify(data.text).toLowerCase();
    const westernHolidays = ['christmas', 'easter', 'valentine'];
    const asianHolidays = ['chinese new year', 'lunar new year', 'spring festival'];
    
    let hasIssues = false;
    let penalty = 0;
    
    if (['CN', 'JP', 'KR'].includes(region)) {
      // 亚洲地区检查是否过度使用西方节日
      const westernCount = westernHolidays.filter(h => allText.includes(h)).length;
      if (westernCount > 1) {
        hasIssues = true;
        penalty = 10;
      }
    }
    
    return { hasIssues, penalty };
  }

  analyzeTextDirection(data, region) {
    const isRTLRegion = ['AE', 'SA', 'EG', 'MA'].includes(region);
    if (!isRTLRegion) return { hasIssues: false, penalty: 0 };

    // 检查是否设置了RTL样式
    const htmlDir = document.documentElement.dir;
    const hasRTLSupport = htmlDir === 'rtl';

    return {
      hasIssues: !hasRTLSupport,
      penalty: hasRTLSupport ? 0 : 15
    };
  }
}

// 合规性规则类 - 增强实现
class ComplianceRules {
  constructor(dataLoader = null) {
    this.dataLoader = dataLoader;
  }

  analyze(data, targetRegion) {
    const issues = [];
    let score = 100;

    // 使用真实隐私法规数据进行合规检查
    if (this.dataLoader && this.dataLoader.isLoaded()) {
      const privacyReqs = this.dataLoader.getPrivacyRequirements(targetRegion);
      if (privacyReqs) {
        // 检查是否需要严格的隐私合规
        if (privacyReqs.regime === 'strict') {
          const hasCompliance = this.checkPrivacyCompliance(data, privacyReqs);
          if (!hasCompliance.compliant) {
            issues.push(`缺少${privacyReqs.laws.join('/')}合规声明`);
            score -= 25;
          }
        }
        
        // 检查Cookie同意要求
        if (this.dataLoader.requiresCookieConsent(targetRegion)) {
          const hasCookieConsent = this.checkCookieConsent(data);
          if (!hasCookieConsent.compliant) {
            issues.push('缺少Cookie同意机制');
            score -= 15;
          }
        }
      }
    } else {
      // 回退到静态检查
      if (['DE', 'FR', 'ES', 'IT', 'NL', 'GB'].includes(targetRegion)) {
        const hasGDPR = this.checkGDPRCompliance(data);
        if (!hasGDPR.compliant) {
          issues.push('缺少GDPR合规声明');
          score -= 25;
        }
      }
    }

    // 中国合规检查
    if (targetRegion === 'CN') {
      const chinaCompliance = this.checkChinaCompliance(data);
      if (!chinaCompliance.compliant) {
        issues.push('需要符合中国法规要求');
        score -= 20;
      }
    }

    return { score: Math.max(0, score), issues: issues };
  }

  checkPrivacyCompliance(data, privacyReqs) {
    const content = JSON.stringify(data).toLowerCase();
    const laws = privacyReqs.laws || [];
    
    let foundCompliance = false;
    
    // 根据适用法律检查相应关键词
    if (laws.includes('GDPR')) {
      const gdprKeywords = ['privacy policy', 'cookie consent', 'data protection', 'gdpr'];
      foundCompliance = gdprKeywords.some(keyword => content.includes(keyword));
    }
    
    if (laws.includes('CCPA/CPRA')) {
      const ccpaKeywords = ['privacy rights', 'do not sell', 'ccpa', 'cpra'];
      foundCompliance = foundCompliance || ccpaKeywords.some(keyword => content.includes(keyword));
    }
    
    return { compliant: foundCompliance };
  }
  
  checkCookieConsent(data) {
    const content = JSON.stringify(data).toLowerCase();
    const cookieKeywords = ['cookie consent', 'accept cookies', 'cookie policy', 'cookie banner'];
    const found = cookieKeywords.some(keyword => content.includes(keyword));
    return { compliant: found };
  }

  checkGDPRCompliance(data) {
    const gdprKeywords = ['privacy policy', 'cookie consent', 'data protection'];
    const content = JSON.stringify(data).toLowerCase();
    const found = gdprKeywords.some(keyword => content.includes(keyword));
    return { compliant: found };
  }

  checkChinaCompliance(data) {
    return { compliant: true }; // 简化实现
  }
}

// 用户体验规则类 - 增强实现
class UserExperienceRules {
  constructor(dataLoader = null) {
    this.dataLoader = dataLoader;
  }

  analyze(data, targetRegion) {
    const issues = [];
    let score = 100;

    // 性能检查
    if (data.performance && data.performance.loadTime > 3000) {
      issues.push('页面加载时间过长');
      score -= 15;
    }

    // 移动端适配检查
    const mobileOptimized = this.checkMobileOptimization(data);
    if (!mobileOptimized) {
      issues.push('移动端适配不足');
      score -= 20;
    }
    
    // 货币和支付方式检查
    if (this.dataLoader && this.dataLoader.isLoaded()) {
      const currencies = this.dataLoader.getCountryCurrencies(targetRegion);
      const currencyAnalysis = this.analyzeCurrencySupport(data, currencies);
      if (!currencyAnalysis.adequate) {
        issues.push('货币显示不符合当地习惯');
        score -= 10;
      }
    }
    
    // 地址格式检查
    const addressFormatAnalysis = this.analyzeAddressFormat(data, targetRegion);
    if (!addressFormatAnalysis.appropriate) {
      issues.push('地址格式不符合当地标准');
      score -= 10;
    }

    return { 
      score: Math.max(0, score), 
      issues: issues,
      details: {
        performance: data.performance,
        mobileOptimized,
        currencySupport: this.dataLoader ? this.analyzeCurrencySupport(data, this.dataLoader.getCountryCurrencies(targetRegion)) : null,
        addressFormat: addressFormatAnalysis
      }
    };
  }

  checkMobileOptimization(data) {
    const viewport = data.meta?.basic?.viewport;
    return viewport && viewport.includes('width=device-width');
  }
  
  analyzeCurrencySupport(data, currencies) {
    if (!currencies || Object.keys(currencies).length === 0) {
      return { adequate: true };
    }
    
    const content = JSON.stringify(data).toLowerCase();
    const currencySymbols = Object.values(currencies).map(curr => curr.symbol?.toLowerCase() || '');
    const currencyNames = Object.values(currencies).map(curr => curr.name?.toLowerCase() || '');
    
    const hasSymbol = currencySymbols.some(symbol => symbol && content.includes(symbol));
    const hasName = currencyNames.some(name => name && content.includes(name));
    
    return {
      adequate: hasSymbol || hasName,
      foundSymbol: hasSymbol,
      foundName: hasName
    };
  }
  
  analyzeAddressFormat(data, region) {
    // 简化的地址格式检查
    const content = JSON.stringify(data).toLowerCase();
    
    // 检查是否有地址相关字段
    const addressFields = ['address', 'street', 'city', 'postal', 'zip', 'country'];
    const hasAddressFields = addressFields.some(field => content.includes(field));
    
    if (!hasAddressFields) {
      return { appropriate: true }; // 没有地址字段，无需检查
    }
    
    // 根据地区检查特定格式要求
    const regionRequirements = {
      'US': ['zip code', 'state'],
      'GB': ['postcode'],
      'CN': ['province', '省', '市'],
      'JP': ['prefecture', '都道府県']
    };
    
    const requirements = regionRequirements[region] || [];
    if (requirements.length === 0) {
      return { appropriate: true };
    }
    
    const hasRequiredFields = requirements.some(req => content.includes(req.toLowerCase()));
    
    return {
      appropriate: hasRequiredFields,
      region,
      requirements,
      hasRequiredFields
    };
  }
}

// 导出规则引擎
window.LocalRuleEngine = LocalRuleEngine;

// === src/utils/report-generator.js ===
// 报告生成服务
class ReportGenerator {
  constructor() {
    this.templates = {
      html: this.getHTMLTemplate(),
      pdf: this.getPDFTemplate()
    };
    this.pdfGenerator = null;
  }

  // 生成完整分析报告
  async generateReport(analysisData, format = 'html', options = {}) {
    const reportData = this.prepareReportData(analysisData, options);
    
    switch (format) {
      case 'html':
        return this.generateHTMLReport(reportData);
      case 'pdf':
        return await this.generatePDFReport(reportData, options);
      case 'json':
        return this.generateJSONReport(reportData);
      case 'csv':
        return this.generateCSVReport(reportData);
      default:
        throw new Error(`不支持的报告格式: ${format}`);
    }
  }

  // 准备报告数据
  prepareReportData(analysisData, options) {
    const reportData = {
      meta: {
        title: '跨境电商地域适配分析报告',
        url: analysisData.url,
        timestamp: new Date().toLocaleString('zh-CN'),
        generatedBy: '地域适配分析器 v1.0.0',
        analysisId: Date.now().toString(),
        options: options
      },
      summary: this.generateSummary(analysisData),
      regions: [],
      insights: this.generateInsights(analysisData),
      recommendations: this.generateRecommendations(analysisData)
    };

    // 处理每个地区的结果
    Object.keys(analysisData.results).forEach(regionCode => {
      const regionResult = analysisData.results[regionCode];
      const regionData = this.processRegionResult(regionCode, regionResult);
      reportData.regions.push(regionData);
    });

    return reportData;
  }

  // 生成总体摘要
  generateSummary(analysisData) {
    const regions = Object.keys(analysisData.results);
    const scores = regions.map(region => analysisData.results[region].overallScore);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    const allIssues = [];
    regions.forEach(region => {
      const result = analysisData.results[region];
      allIssues.push(...result.language.issues);
      allIssues.push(...result.culture.issues);
      allIssues.push(...result.compliance.issues);
      allIssues.push(...result.userExperience.issues);
    });

    return {
      overallScore: avgScore,
      totalRegions: regions.length,
      totalIssues: allIssues.length,
      highPriorityIssues: this.countHighPriorityIssues(analysisData),
      bestRegion: this.findBestRegion(analysisData),
      worstRegion: this.findWorstRegion(analysisData)
    };
  }

  // 处理单个地区结果
  processRegionResult(regionCode, regionResult) {
    return {
      code: regionCode,
      name: regionResult.region?.name || regionCode,
      overallScore: regionResult.overallScore,
      categories: {
        language: {
          score: regionResult.language.score,
          issues: regionResult.language.issues || [],
          suggestions: regionResult.aiSuggestions?.language || []
        },
        culture: {
          score: regionResult.culture.score,
          issues: regionResult.culture.issues || [],
          suggestions: regionResult.aiSuggestions?.culture || []
        },
        compliance: {
          score: regionResult.compliance.score,
          issues: regionResult.compliance.issues || [],
          suggestions: regionResult.aiSuggestions?.compliance || []
        },
        userExperience: {
          score: regionResult.userExperience.score,
          issues: regionResult.userExperience.issues || [],
          suggestions: regionResult.aiSuggestions?.userExperience || []
        }
      },
      aiEnhanced: regionResult.aiEnhanced || false
    };
  }

  // 生成HTML报告
  generateHTMLReport(reportData) {
    const template = this.templates.html;
    
    let html = template
      .replace(/\{\{title\}\}/g, reportData.meta.title)
      .replace(/\{\{timestamp\}\}/g, reportData.meta.timestamp)
      .replace(/\{\{url\}\}/g, reportData.meta.url)
      .replace(/\{\{overallScore\}\}/g, reportData.summary.overallScore)
      .replace(/\{\{totalRegions\}\}/g, reportData.summary.totalRegions)
      .replace(/\{\{totalIssues\}\}/g, reportData.summary.totalIssues);

    // 生成地区详细信息
    const regionsHTML = reportData.regions.map(region => this.generateRegionHTML(region)).join('');
    html = html.replace('{{regions}}', regionsHTML);

    // 生成洞察信息
    const insightsHTML = this.generateInsightsHTML(reportData.insights);
    html = html.replace('{{insights}}', insightsHTML);

    // 生成建议信息
    const recommendationsHTML = this.generateRecommendationsHTML(reportData.recommendations);
    html = html.replace('{{recommendations}}', recommendationsHTML);

    return html;
  }

  // 生成地区HTML
  generateRegionHTML(region) {
    const categoryHTML = Object.keys(region.categories).map(categoryKey => {
      const category = region.categories[categoryKey];
      const categoryName = this.getCategoryName(categoryKey);
      
      return `
        <div class="category">
          <div class="category-header">
            <h4>${categoryName}</h4>
            <div class="score ${this.getScoreClass(category.score)}">${category.score}</div>
          </div>
          <div class="category-content">
            ${category.issues.length > 0 ? `
              <div class="issues">
                <h5>发现的问题：</h5>
                <ul>
                  ${category.issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
              </div>
            ` : '<p class="no-issues">✅ 未发现明显问题</p>'}
            
            ${category.suggestions.length > 0 ? `
              <div class="suggestions">
                <h5>AI建议：</h5>
                <ul>
                  ${category.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="region-section">
        <div class="region-header">
          <h3>${region.name} (${region.code})</h3>
          <div class="overall-score ${this.getScoreClass(region.overallScore)}">
            ${region.overallScore}
            ${region.aiEnhanced ? '<span class="ai-badge">AI增强</span>' : ''}
          </div>
        </div>
        <div class="categories">
          ${categoryHTML}
        </div>
      </div>
    `;
  }

  // 生成PDF报告
  async generatePDFReport(reportData, options = {}) {
    if (!this.pdfGenerator) {
      this.pdfGenerator = new PDFReportGenerator();
    }

    try {
      const pdfData = await this.pdfGenerator.getPDFData(reportData, {
        title: reportData.meta.title,
        includeCharts: options.includeCharts || false,
        language: options.language || 'zh-CN'
      });

      return {
        format: 'pdf',
        data: pdfData.dataUri,
        blob: pdfData.blob,
        filename: `${reportData.meta.title}_${Date.now()}.pdf`,
        size: pdfData.blob.size
      };
    } catch (error) {
      console.error('PDF generation failed:', error);
      // 回退到简化的文本格式
      const pdfContent = {
        title: reportData.meta.title,
        error: 'PDF生成失败，返回文本格式数据',
        content: this.generateTextReport(reportData),
        timestamp: reportData.meta.timestamp
      };

      return {
        format: 'json',
        data: JSON.stringify(pdfContent, null, 2),
        filename: `${reportData.meta.title}_${Date.now()}.json`,
        error: error.message
      };
    }
  }

  // 生成JSON报告
  generateJSONReport(reportData) {
    return JSON.stringify(reportData, null, 2);
  }

  // 生成CSV报告
  generateCSVReport(reportData) {
    const csvData = [];
    csvData.push(['地区', '总分', '语言适配', '文化适配', '合规性', '用户体验', '主要问题']);
    
    reportData.regions.forEach(region => {
      const mainIssues = Object.values(region.categories)
        .map(cat => cat.issues.slice(0, 2))
        .flat()
        .join('; ')
        .substring(0, 100);
        
      csvData.push([
        region.name,
        region.overallScore,
        region.categories.language.score,
        region.categories.culture.score,
        region.categories.compliance.score,
        region.categories.userExperience.score,
        mainIssues
      ]);
    });

    return csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\\n');
  }

  // HTML模板
  getHTMLTemplate() {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f8f9fa;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    .header {
      text-align: center;
      border-bottom: 2px solid #667eea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #667eea;
      margin-bottom: 10px;
    }
    
    .meta-info {
      color: #666;
      font-size: 14px;
    }
    
    .summary-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 15px;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-number {
      font-size: 2em;
      font-weight: bold;
      display: block;
    }
    
    .summary-label {
      font-size: 0.9em;
      opacity: 0.9;
    }
    
    .region-section {
      margin-bottom: 40px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }
    
    .region-header {
      background: #f8f9fa;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .overall-score {
      font-size: 2em;
      font-weight: bold;
      padding: 10px 20px;
      border-radius: 25px;
      position: relative;
    }
    
    .overall-score.excellent { background: #10b981; color: white; }
    .overall-score.good { background: #3b82f6; color: white; }
    .overall-score.fair { background: #f59e0b; color: white; }
    .overall-score.poor { background: #ef4444; color: white; }
    
    .ai-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #8b5cf6;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
    }
    
    .categories {
      padding: 20px;
    }
    
    .category {
      margin-bottom: 25px;
      border-left: 4px solid #667eea;
      padding-left: 15px;
    }
    
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .category-header h4 {
      color: #374151;
    }
    
    .score {
      font-weight: bold;
      padding: 5px 10px;
      border-radius: 15px;
      font-size: 14px;
    }
    
    .score.excellent { background: #d1fae5; color: #065f46; }
    .score.good { background: #dbeafe; color: #1e40af; }
    .score.fair { background: #fef3c7; color: #92400e; }
    .score.poor { background: #fee2e2; color: #b91c1c; }
    
    .issues, .suggestions {
      margin-top: 10px;
    }
    
    .issues h5, .suggestions h5 {
      color: #374151;
      margin-bottom: 8px;
    }
    
    .issues ul, .suggestions ul {
      margin-left: 20px;
    }
    
    .issues li {
      color: #dc2626;
      margin-bottom: 5px;
    }
    
    .suggestions li {
      color: #059669;
      margin-bottom: 5px;
    }
    
    .no-issues {
      color: #059669;
      font-weight: 500;
    }
    
    .insights-section, .recommendations-section {
      margin-top: 40px;
      padding: 25px;
      background: #f8f9fa;
      border-radius: 10px;
    }
    
    .insights-section h2, .recommendations-section h2 {
      color: #667eea;
      margin-bottom: 20px;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #666;
      font-size: 14px;
    }
    
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
      .region-section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{title}}</h1>
      <div class="meta-info">
        <p>分析网址：{{url}}</p>
        <p>生成时间：{{timestamp}}</p>
      </div>
    </div>
    
    <div class="summary-section">
      <h2>分析摘要</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-number">{{overallScore}}</span>
          <span class="summary-label">总体评分</span>
        </div>
        <div class="summary-item">
          <span class="summary-number">{{totalRegions}}</span>
          <span class="summary-label">分析地区</span>
        </div>
        <div class="summary-item">
          <span class="summary-number">{{totalIssues}}</span>
          <span class="summary-label">发现问题</span>
        </div>
      </div>
    </div>
    
    <div class="regions-section">
      {{regions}}
    </div>
    
    <div class="insights-section">
      <h2>分析洞察</h2>
      {{insights}}
    </div>
    
    <div class="recommendations-section">
      <h2>优化建议</h2>
      {{recommendations}}
    </div>
    
    <div class="footer">
      <p>本报告由地域适配分析器自动生成</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // PDF模板 (与HTML模板相同，PDF生成时会进行格式转换)
  getPDFTemplate() {
    return this.getHTMLTemplate(); // 复用HTML模板
  }

  // 辅助方法
  getCategoryName(categoryKey) {
    const names = {
      'language': '语言适配',
      'culture': '文化适配',
      'compliance': '合规性',
      'userExperience': '用户体验'
    };
    return names[categoryKey] || categoryKey;
  }

  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  countHighPriorityIssues(analysisData) {
    let count = 0;
    Object.values(analysisData.results).forEach(result => {
      if (result.compliance.score < 70) count += result.compliance.issues.length;
      if (result.language.score < 60) count += result.language.issues.length;
    });
    return count;
  }

  findBestRegion(analysisData) {
    let bestScore = 0;
    let bestRegion = null;
    
    Object.keys(analysisData.results).forEach(region => {
      const score = analysisData.results[region].overallScore;
      if (score > bestScore) {
        bestScore = score;
        bestRegion = region;
      }
    });
    
    return bestRegion;
  }

  findWorstRegion(analysisData) {
    let worstScore = 100;
    let worstRegion = null;
    
    Object.keys(analysisData.results).forEach(region => {
      const score = analysisData.results[region].overallScore;
      if (score < worstScore) {
        worstScore = score;
        worstRegion = region;
      }
    });
    
    return worstRegion;
  }

  generateInsights(analysisData) {
    const insights = [];
    
    // 语言分析洞察
    const languageScores = Object.values(analysisData.results).map(r => r.language.score);
    const avgLanguageScore = languageScores.reduce((a, b) => a + b, 0) / languageScores.length;
    
    if (avgLanguageScore < 70) {
      insights.push('语言适配是当前的主要挑战，建议优先进行本地化改进');
    }
    
    // 合规性洞察
    const complianceIssues = Object.values(analysisData.results)
      .map(r => r.compliance.issues.length)
      .reduce((a, b) => a + b, 0);
      
    if (complianceIssues > 0) {
      insights.push('存在合规性风险，建议尽快咨询法律专业人士');
    }
    
    return insights;
  }

  generateRecommendations(analysisData) {
    const recommendations = [];
    
    // 基于分析结果生成推荐
    Object.keys(analysisData.results).forEach(region => {
      const result = analysisData.results[region];
      
      if (result.overallScore < 70) {
        recommendations.push(`${result.region?.name || region}: 需要全面优化，重点关注得分较低的维度`);
      }
    });
    
    return recommendations;
  }

  generateInsightsHTML(insights) {
    if (insights.length === 0) {
      return '<p>暂无特别洞察</p>';
    }
    
    return `<ul>${insights.map(insight => `<li>${insight}</li>`).join('')}</ul>`;
  }

  generateRecommendationsHTML(recommendations) {
    if (recommendations.length === 0) {
      return '<p>当前表现良好，继续保持！</p>';
    }
    
    return `<ul>${recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>`;
  }

  generateTextReport(reportData) {
    // 生成纯文本格式报告
    let text = `${reportData.meta.title}\\n`;
    text += `生成时间: ${reportData.meta.timestamp}\\n`;
    text += `分析网址: ${reportData.meta.url}\\n\\n`;
    
    text += `总体评分: ${reportData.summary.overallScore}\\n`;
    text += `分析地区: ${reportData.summary.totalRegions}\\n`;
    text += `发现问题: ${reportData.summary.totalIssues}\\n\\n`;
    
    reportData.regions.forEach(region => {
      text += `\\n=== ${region.name} (${region.code}) ===\\n`;
      text += `总分: ${region.overallScore}\\n`;
      
      Object.keys(region.categories).forEach(categoryKey => {
        const category = region.categories[categoryKey];
        const categoryName = this.getCategoryName(categoryKey);
        text += `${categoryName}: ${category.score}分\\n`;
        
        if (category.issues.length > 0) {
          text += `问题: ${category.issues.join(', ')}\\n`;
        }
      });
    });
    
    return text;
  }
}

// 导出报告生成器
window.ReportGenerator = ReportGenerator;

