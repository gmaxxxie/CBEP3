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