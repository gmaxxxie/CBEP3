/**
 * Dynamic Rule Configuration System
 * 动态规则配置系统 - 支持实时规则更新、版本管理、A/B测试
 */

class DynamicRuleConfigurationSystem {
  constructor(options = {}) {
    this.config = {
      storageBackend: options.storageBackend || 'memory', // memory, mongodb, file
      enableVersioning: options.enableVersioning || true,
      enableABTesting: options.enableABTesting || true,
      maxVersionHistory: options.maxVersionHistory || 10,
      autoBackup: options.autoBackup || true,
      refreshInterval: options.refreshInterval || 60000, // 1分钟
      ...options
    };

    this.ruleStore = new Map();
    this.versionStore = new Map();
    this.abTestStore = new Map();
    this.subscribers = new Map();
    this.metrics = {
      rulesLoaded: 0,
      rulesUpdated: 0,
      versionsCreated: 0,
      abTestsRunning: 0
    };

    this.initialize();
  }

  /**
   * 初始化系统
   */
  async initialize() {
    console.log('Initializing Dynamic Rule Configuration System...');
    
    // 加载默认规则
    await this.loadDefaultRules();
    
    // 启动定期刷新
    if (this.config.refreshInterval > 0) {
      setInterval(() => {
        this.refreshRules();
      }, this.config.refreshInterval);
    }

    // 设置自动备份
    if (this.config.autoBackup) {
      this.setupAutoBackup();
    }

    console.log('Dynamic Rule Configuration System initialized');
  }

  /**
   * 加载默认规则
   */
  async loadDefaultRules() {
    const defaultRules = this.getDefaultRuleDefinitions();
    
    for (const rule of defaultRules) {
      await this.createRule(rule, { skipNotification: true });
    }

    this.metrics.rulesLoaded = defaultRules.length;
    console.log(`Loaded ${defaultRules.length} default rules`);
  }

  /**
   * 获取默认规则定义
   */
  getDefaultRuleDefinitions() {
    return [
      // 语言适配规则
      {
        id: 'language-consistency-check',
        category: 'language',
        name: '语言一致性检查',
        description: '检查页面声明语言与内容语言的一致性',
        priority: 'high',
        enabled: true,
        weight: 25,
        conditions: {
          triggers: ['language_mismatch'],
          thresholds: { min_confidence: 0.7 }
        },
        actions: {
          scoring: { deduction: 20 },
          message: '页面语言设置与内容不匹配'
        },
        regions: ['*'], // 适用于所有地区
        version: '1.0.0',
        tags: ['language', 'seo', 'basic']
      },
      {
        id: 'multi-language-support',
        category: 'language',
        name: '多语言支持检测',
        description: '检测是否支持目标地区的多语言切换',
        priority: 'medium',
        enabled: true,
        weight: 15,
        conditions: {
          triggers: ['missing_language_switcher'],
          regions_requiring: ['CN', 'JP', 'DE', 'FR', 'ES']
        },
        actions: {
          scoring: { deduction: 10 },
          message: '建议添加多语言切换功能'
        },
        regions: ['CN', 'JP', 'DE', 'FR', 'ES', 'BR', 'MX'],
        version: '1.0.0',
        tags: ['language', 'ux', 'international']
      },

      // 文化适配规则
      {
        id: 'cultural-color-sensitivity',
        category: 'culture',
        name: '文化色彩敏感性检查',
        description: '检查颜色选择是否符合目标地区文化习惯',
        priority: 'medium',
        enabled: true,
        weight: 15,
        conditions: {
          triggers: ['cultural_color_issue'],
          sensitive_combinations: {
            'CN': { avoid: ['white_dominant'], prefer: ['red', 'gold'] },
            'IN': { avoid: ['black_dominant'], prefer: ['orange', 'yellow'] },
            'JP': { avoid: ['green_medical'], prefer: ['white', 'red'] }
          }
        },
        actions: {
          scoring: { deduction: 10 },
          message: '颜色选择可能存在文化敏感性'
        },
        regions: ['CN', 'IN', 'JP', 'KR', 'AE', 'SA'],
        version: '1.0.0',
        tags: ['culture', 'design', 'sensitivity']
      },
      {
        id: 'holiday-marketing-alignment',
        category: 'culture',
        name: '节日营销对齐检查',
        description: '检查节日营销内容是否符合当地习俗',
        priority: 'high',
        enabled: true,
        weight: 20,
        conditions: {
          triggers: ['holiday_mismatch', 'religious_conflict'],
          seasonal_checks: true
        },
        actions: {
          scoring: { deduction: 15 },
          message: '节日营销内容需要本地化调整'
        },
        regions: ['*'],
        version: '1.0.0',
        tags: ['culture', 'marketing', 'seasonal']
      },

      // 合规性规则
      {
        id: 'gdpr-compliance-check',
        category: 'compliance',
        name: 'GDPR合规检查',
        description: '检查欧盟GDPR相关合规要求',
        priority: 'critical',
        enabled: true,
        weight: 30,
        conditions: {
          triggers: ['missing_privacy_policy', 'missing_cookie_consent'],
          required_elements: ['privacy_policy', 'cookie_banner', 'data_processing_info']
        },
        actions: {
          scoring: { deduction: 25 },
          message: '缺少GDPR合规声明和Cookie同意机制'
        },
        regions: ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'SE', 'DK', 'FI', 'PL', 'GB'],
        version: '1.1.0',
        tags: ['compliance', 'privacy', 'legal', 'gdpr']
      },
      {
        id: 'ccpa-compliance-check',
        category: 'compliance',
        name: 'CCPA合规检查',
        description: '检查加州消费者隐私法案合规要求',
        priority: 'high',
        enabled: true,
        weight: 25,
        conditions: {
          triggers: ['missing_ccpa_notice', 'missing_opt_out'],
          required_elements: ['privacy_notice', 'do_not_sell_link', 'opt_out_mechanism']
        },
        actions: {
          scoring: { deduction: 20 },
          message: '需要添加CCPA合规声明和选择退出机制'
        },
        regions: ['US'],
        version: '1.0.0',
        tags: ['compliance', 'privacy', 'legal', 'ccpa']
      },

      // 用户体验规则
      {
        id: 'mobile-optimization-check',
        category: 'userExperience',
        name: '移动端优化检查',
        description: '检查移动设备适配和触摸友好性',
        priority: 'high',
        enabled: true,
        weight: 25,
        conditions: {
          triggers: ['missing_viewport', 'poor_touch_targets', 'slow_mobile_load'],
          mobile_share_threshold: 60
        },
        actions: {
          scoring: { deduction: 20 },
          message: '移动端优化不足，影响用户体验'
        },
        regions: ['*'],
        dynamicWeight: {
          'CN': 30, 'IN': 30, 'BR': 28, 'KR': 32 // 移动优先市场加权
        },
        version: '1.2.0',
        tags: ['ux', 'mobile', 'performance']
      },
      {
        id: 'network-performance-optimization',
        category: 'userExperience',
        name: '网络性能优化检查',
        description: '根据地区网络条件检查性能优化',
        priority: 'high',
        enabled: true,
        weight: 20,
        conditions: {
          triggers: ['slow_load_time', 'large_resources'],
          regional_thresholds: {
            'US': 3000, 'DE': 2800, 'JP': 2500, 'KR': 2200,
            'CN': 4200, 'IN': 5000, 'BR': 5500
          }
        },
        actions: {
          scoring: { deduction: 15 },
          message: '页面加载时间超过当地用户容忍度'
        },
        regions: ['*'],
        version: '1.1.0',
        tags: ['ux', 'performance', 'network']
      },

      // 跨境电商特定规则
      {
        id: 'multi-currency-support',
        category: 'crossBorder',
        name: '多货币支持检查',
        description: '检查是否支持目标市场货币',
        priority: 'high',
        enabled: true,
        weight: 20,
        conditions: {
          triggers: ['missing_currency_support', 'wrong_currency_display'],
          required_currencies: {
            'US': 'USD', 'GB': 'GBP', 'DE': 'EUR', 'JP': 'JPY',
            'CN': 'CNY', 'KR': 'KRW', 'AU': 'AUD', 'CA': 'CAD'
          }
        },
        actions: {
          scoring: { deduction: 15 },
          message: '建议添加当地货币支持'
        },
        regions: ['*'],
        version: '1.0.0',
        tags: ['crossBorder', 'currency', 'ecommerce']
      },
      {
        id: 'international-payment-methods',
        category: 'crossBorder',
        name: '国际支付方式检查',
        description: '检查是否支持当地主流支付方式',
        priority: 'high',
        enabled: true,
        weight: 25,
        conditions: {
          triggers: ['limited_payment_options'],
          regional_preferences: {
            'CN': ['alipay', 'wechat_pay', 'unionpay'],
            'DE': ['paypal', 'sofort', 'klarna'],
            'JP': ['paypal', 'rakuten_pay', 'linepay'],
            'US': ['paypal', 'stripe', 'apple_pay', 'google_pay']
          }
        },
        actions: {
          scoring: { deduction: 20 },
          message: '建议集成当地主流支付方式'
        },
        regions: ['*'],
        version: '1.0.0',
        tags: ['crossBorder', 'payment', 'ecommerce']
      }
    ];
  }

  /**
   * 创建新规则
   */
  async createRule(ruleData, options = {}) {
    const rule = this.validateAndNormalizeRule(ruleData);
    
    // 生成唯一ID
    if (!rule.id) {
      rule.id = this.generateRuleId(rule.category, rule.name);
    }

    // 设置版本信息
    if (this.config.enableVersioning) {
      rule.version = rule.version || '1.0.0';
      rule.createdAt = new Date().toISOString();
      rule.updatedAt = rule.createdAt;
    }

    // 存储规则
    this.ruleStore.set(rule.id, rule);

    // 创建版本记录
    if (this.config.enableVersioning) {
      await this.createRuleVersion(rule);
    }

    // 通知订阅者
    if (!options.skipNotification) {
      this.notifySubscribers('ruleCreated', rule);
    }

    this.metrics.rulesUpdated++;
    console.log(`Created rule: ${rule.id}`);

    return rule;
  }

  /**
   * 更新规则
   */
  async updateRule(ruleId, updates, options = {}) {
    const existingRule = this.ruleStore.get(ruleId);
    if (!existingRule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    // 合并更新
    const updatedRule = {
      ...existingRule,
      ...updates,
      id: ruleId, // 确保ID不被覆盖
      updatedAt: new Date().toISOString()
    };

    // 验证更新后的规则
    const validatedRule = this.validateAndNormalizeRule(updatedRule);

    // 创建新版本
    if (this.config.enableVersioning && !options.skipVersioning) {
      validatedRule.version = this.incrementVersion(existingRule.version);
      await this.createRuleVersion(validatedRule);
    }

    // 更新存储
    this.ruleStore.set(ruleId, validatedRule);

    // 通知订阅者
    if (!options.skipNotification) {
      this.notifySubscribers('ruleUpdated', validatedRule, existingRule);
    }

    this.metrics.rulesUpdated++;
    console.log(`Updated rule: ${ruleId} to version ${validatedRule.version}`);

    return validatedRule;
  }

  /**
   * 删除规则
   */
  async deleteRule(ruleId, options = {}) {
    const rule = this.ruleStore.get(ruleId);
    if (!rule) {
      return false;
    }

    // 软删除或硬删除
    if (options.softDelete) {
      rule.deleted = true;
      rule.deletedAt = new Date().toISOString();
      this.ruleStore.set(ruleId, rule);
    } else {
      this.ruleStore.delete(ruleId);
      
      // 删除版本历史
      if (this.config.enableVersioning) {
        this.versionStore.delete(ruleId);
      }
    }

    // 通知订阅者
    if (!options.skipNotification) {
      this.notifySubscribers('ruleDeleted', rule);
    }

    console.log(`Deleted rule: ${ruleId}`);
    return true;
  }

  /**
   * 获取规则
   */
  getRule(ruleId) {
    return this.ruleStore.get(ruleId);
  }

  /**
   * 获取所有规则
   */
  getAllRules(options = {}) {
    let rules = Array.from(this.ruleStore.values());

    // 过滤已删除的规则
    if (!options.includeDeleted) {
      rules = rules.filter(rule => !rule.deleted);
    }

    // 按类别过滤
    if (options.category) {
      rules = rules.filter(rule => rule.category === options.category);
    }

    // 按地区过滤
    if (options.region) {
      rules = rules.filter(rule => 
        rule.regions.includes('*') || rule.regions.includes(options.region)
      );
    }

    // 只返回启用的规则
    if (options.enabledOnly) {
      rules = rules.filter(rule => rule.enabled);
    }

    // 排序
    if (options.sortBy) {
      rules = this.sortRules(rules, options.sortBy, options.sortOrder);
    }

    return rules;
  }

  /**
   * 获取规则版本历史
   */
  getRuleVersions(ruleId) {
    return this.versionStore.get(ruleId) || [];
  }

  /**
   * 恢复规则版本
   */
  async restoreRuleVersion(ruleId, version) {
    const versions = this.getRuleVersions(ruleId);
    const targetVersion = versions.find(v => v.version === version);
    
    if (!targetVersion) {
      throw new Error(`Version ${version} not found for rule ${ruleId}`);
    }

    // 恢复到指定版本
    const restoredRule = {
      ...targetVersion,
      version: this.incrementVersion(targetVersion.version),
      restoredFrom: version,
      updatedAt: new Date().toISOString()
    };

    return await this.updateRule(ruleId, restoredRule);
  }

  /**
   * 创建A/B测试
   */
  async createABTest(testConfig) {
    const abTest = {
      id: testConfig.id || this.generateABTestId(),
      name: testConfig.name,
      description: testConfig.description,
      ruleId: testConfig.ruleId,
      variants: testConfig.variants, // [{ name: 'A', rule: {...}}, { name: 'B', rule: {...}}]
      trafficSplit: testConfig.trafficSplit || { A: 50, B: 50 },
      regions: testConfig.regions || ['*'],
      startDate: testConfig.startDate || new Date().toISOString(),
      endDate: testConfig.endDate,
      status: 'active',
      metrics: {
        impressions: { A: 0, B: 0 },
        conversions: { A: 0, B: 0 }
      },
      createdAt: new Date().toISOString()
    };

    this.abTestStore.set(abTest.id, abTest);
    this.metrics.abTestsRunning++;

    console.log(`Created A/B test: ${abTest.id}`);
    return abTest;
  }

  /**
   * 获取适用的规则（考虑A/B测试）
   */
  getApplicableRules(context = {}) {
    const { region, userId, category } = context;
    let rules = this.getAllRules({ region, category, enabledOnly: true });

    // 应用A/B测试
    if (this.config.enableABTesting && userId) {
      rules = this.applyABTests(rules, userId, context);
    }

    return rules;
  }

  /**
   * 应用A/B测试
   */
  applyABTests(rules, userId, context) {
    const activeABTests = Array.from(this.abTestStore.values())
      .filter(test => test.status === 'active' && this.isTestApplicable(test, context));

    const modifiedRules = new Map(rules.map(rule => [rule.id, rule]));

    activeABTests.forEach(test => {
      const variant = this.assignUserToVariant(userId, test);
      const variantRule = test.variants.find(v => v.name === variant);
      
      if (variantRule && modifiedRules.has(test.ruleId)) {
        // 应用变体规则
        modifiedRules.set(test.ruleId, {
          ...modifiedRules.get(test.ruleId),
          ...variantRule.rule,
          abTestId: test.id,
          abTestVariant: variant
        });

        // 记录展示
        test.metrics.impressions[variant]++;
      }
    });

    return Array.from(modifiedRules.values());
  }

  /**
   * 分配用户到A/B测试变体
   */
  assignUserToVariant(userId, abTest) {
    const hash = this.hashUserId(userId, abTest.id);
    const percentage = hash % 100;
    
    let cumulative = 0;
    for (const [variant, split] of Object.entries(abTest.trafficSplit)) {
      cumulative += split;
      if (percentage < cumulative) {
        return variant;
      }
    }
    
    return Object.keys(abTest.trafficSplit)[0]; // 默认返回第一个变体
  }

  /**
   * 规则验证和规范化
   */
  validateAndNormalizeRule(ruleData) {
    if (!ruleData.id && !ruleData.name) {
      throw new Error('Rule must have either id or name');
    }

    if (!ruleData.category) {
      throw new Error('Rule must have a category');
    }

    const validCategories = ['language', 'culture', 'compliance', 'userExperience', 'crossBorder'];
    if (!validCategories.includes(ruleData.category)) {
      throw new Error(`Invalid category: ${ruleData.category}`);
    }

    // 规范化规则
    const normalizedRule = {
      id: ruleData.id,
      category: ruleData.category,
      name: ruleData.name,
      description: ruleData.description || '',
      priority: ruleData.priority || 'medium',
      enabled: ruleData.enabled !== false,
      weight: ruleData.weight || 10,
      conditions: ruleData.conditions || {},
      actions: ruleData.actions || {},
      regions: ruleData.regions || ['*'],
      version: ruleData.version || '1.0.0',
      tags: ruleData.tags || [],
      dynamicWeight: ruleData.dynamicWeight || {},
      ...ruleData
    };

    return normalizedRule;
  }

  /**
   * 创建规则版本
   */
  async createRuleVersion(rule) {
    const ruleId = rule.id;
    const versions = this.versionStore.get(ruleId) || [];
    
    // 添加新版本
    versions.push({
      ...rule,
      versionCreatedAt: new Date().toISOString()
    });

    // 限制版本历史数量
    if (versions.length > this.config.maxVersionHistory) {
      versions.splice(0, versions.length - this.config.maxVersionHistory);
    }

    this.versionStore.set(ruleId, versions);
    this.metrics.versionsCreated++;
  }

  /**
   * 订阅规则变化
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType).push(callback);

    // 返回取消订阅函数
    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * 通知订阅者
   */
  notifySubscribers(eventType, ...args) {
    const callbacks = this.subscribers.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Subscriber callback error for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * 刷新规则（从外部数据源）
   */
  async refreshRules() {
    try {
      // 这里可以从数据库、API或文件系统重新加载规则
      console.log('Refreshing rules from external sources...');
      
      // 示例：检查规则更新
      // const updatedRules = await this.fetchRulesFromAPI();
      // await this.updateRulesFromSource(updatedRules);
      
    } catch (error) {
      console.error('Failed to refresh rules:', error);
    }
  }

  /**
   * 获取系统指标
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalRules: this.ruleStore.size,
      totalVersions: Array.from(this.versionStore.values()).reduce((sum, versions) => sum + versions.length, 0),
      activeABTests: Array.from(this.abTestStore.values()).filter(test => test.status === 'active').length,
      subscribers: Array.from(this.subscribers.values()).reduce((sum, callbacks) => sum + callbacks.length, 0)
    };
  }

  /**
   * 导出规则配置
   */
  exportRules(options = {}) {
    const rules = this.getAllRules(options);
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      count: rules.length,
      rules: rules
    };

    if (options.includeVersions) {
      exportData.versions = Object.fromEntries(this.versionStore);
    }

    if (options.includeABTests) {
      exportData.abTests = Array.from(this.abTestStore.values());
    }

    return exportData;
  }

  /**
   * 导入规则配置
   */
  async importRules(importData, options = {}) {
    if (!importData.rules || !Array.isArray(importData.rules)) {
      throw new Error('Invalid import data: rules array required');
    }

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const ruleData of importData.rules) {
      try {
        const existingRule = this.ruleStore.get(ruleData.id);
        
        if (existingRule && !options.overwrite) {
          results.skipped++;
          continue;
        }

        if (existingRule) {
          await this.updateRule(ruleData.id, ruleData, { skipNotification: options.skipNotifications });
          results.updated++;
        } else {
          await this.createRule(ruleData, { skipNotification: options.skipNotifications });
          results.imported++;
        }
      } catch (error) {
        results.errors.push({
          ruleId: ruleData.id,
          error: error.message
        });
      }
    }

    return results;
  }

  // 辅助方法
  generateRuleId(category, name) {
    return `${category}-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  }

  generateABTestId() {
    return `ab-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  incrementVersion(version) {
    const parts = version.split('.').map(Number);
    parts[2]++; // 增加补丁版本
    return parts.join('.');
  }

  hashUserId(userId, seed) {
    let hash = 0;
    const str = userId + seed;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  sortRules(rules, sortBy, sortOrder = 'asc') {
    return rules.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'priority') {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        aVal = priorityOrder[aVal] || 0;
        bVal = priorityOrder[bVal] || 0;
      }

      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
  }

  isTestApplicable(abTest, context) {
    const now = new Date();
    const startDate = new Date(abTest.startDate);
    const endDate = abTest.endDate ? new Date(abTest.endDate) : null;

    if (now < startDate || (endDate && now > endDate)) {
      return false;
    }

    if (context.region && !abTest.regions.includes('*') && !abTest.regions.includes(context.region)) {
      return false;
    }

    return true;
  }

  setupAutoBackup() {
    // 每小时自动备份
    setInterval(() => {
      try {
        const backup = this.exportRules({ includeVersions: true, includeABTests: true });
        // 这里可以保存到文件系统或数据库
        console.log('Auto backup completed');
      } catch (error) {
        console.error('Auto backup failed:', error);
      }
    }, 60 * 60 * 1000);
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DynamicRuleConfigurationSystem;
} else {
  window.DynamicRuleConfigurationSystem = DynamicRuleConfigurationSystem;
}