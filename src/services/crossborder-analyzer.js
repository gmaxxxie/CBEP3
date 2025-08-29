/**
 * Independent Cross-Border Site Analysis
 * 独立跨境电商网站专项分析服务
 */

class CrossBorderSiteAnalyzer {
  constructor() {
    this.platformDetectors = this.initializePlatformDetectors();
    this.ecommercePatterns = this.initializeEcommercePatterns();
    this.crossBorderIndicators = this.initializeCrossBorderIndicators();
  }

  /**
   * 初始化平台检测器
   */
  initializePlatformDetectors() {
    return {
      shopify: {
        identifiers: [
          'cdn.shopify.com',
          'myshopify.com', 
          'shopify-pay',
          'Shopify.theme',
          'shopify_pay',
          'checkout.shopify.com'
        ],
        metaTags: ['generator', 'shopify'],
        jsVariables: ['Shopify', 'ShopifyAnalytics'],
        cssClasses: ['shopify-section', 'shopify-block']
      },
      woocommerce: {
        identifiers: [
          'woocommerce',
          'wc-enhanced-select',
          'woocommerce-js',
          '/wc-api/'
        ],
        metaTags: ['generator', 'woocommerce'],
        jsVariables: ['wc_params', 'woocommerce_params'],
        cssClasses: ['woocommerce', 'wc-product']
      },
      magento: {
        identifiers: [
          'magento',
          'mage/',
          'skin/frontend',
          'Mage.Cookies'
        ],
        metaTags: ['generator', 'magento'],
        jsVariables: ['Mage', 'VarienForm'],
        cssClasses: ['magento', 'catalog-product']
      },
      bigcommerce: {
        identifiers: [
          'bigcommerce',
          'bc-sf-filter',
          'bigcommerce.com'
        ],
        metaTags: ['generator', 'bigcommerce'],
        jsVariables: ['BigCommerce'],
        cssClasses: ['bigcommerce']
      },
      squarespace: {
        identifiers: [
          'squarespace',
          'static1.squarespace.com',
          'squarespace.com'
        ],
        metaTags: ['generator', 'squarespace'],
        jsVariables: ['Squarespace'],
        cssClasses: ['squarespace']
      },
      custom: {
        identifiers: [],
        patterns: ['独立开发', '自建商城', 'custom-built']
      }
    };
  }

  /**
   * 初始化电商特征模式
   */
  initializeEcommercePatterns() {
    return {
      productPages: {
        selectors: [
          '[itemtype*="schema.org/Product"]',
          '.product', '.product-details', '.product-info',
          '[data-product-id]', '.product-single',
          '.item-details', '.product-page'
        ],
        content: ['add to cart', 'buy now', 'purchase', 'price', '加入购物车', '立即购买', '价格']
      },
      categoryPages: {
        selectors: [
          '.category', '.collection', '.product-grid',
          '.products-list', '.catalog', '.shop-grid'
        ],
        content: ['filter', 'sort by', 'category', '筛选', '排序', '分类']
      },
      shoppingCart: {
        selectors: [
          '.cart', '.shopping-cart', '.basket',
          '[data-cart]', '.cart-items', '.checkout-cart'
        ],
        content: ['cart', 'checkout', 'total', '购物车', '结账', '总计']
      },
      checkout: {
        selectors: [
          '.checkout', '.payment', '.billing',
          '.shipping-address', '.order-summary'
        ],
        content: ['checkout', 'payment', 'billing', 'shipping', '结账', '支付', '账单', '配送']
      },
      accountPages: {
        selectors: [
          '.account', '.profile', '.user-account',
          '.customer-account', '.my-account'
        ],
        content: ['my account', 'profile', 'orders', '我的账户', '个人资料', '订单']
      }
    };
  }

  /**
   * 初始化跨境电商指标
   */
  initializeCrossBorderIndicators() {
    return {
      multiCurrency: {
        patterns: ['USD', 'EUR', 'GBP', 'CNY', 'JPY', '¥', '€', '£', '$'],
        selectors: ['.currency-selector', '.currency-switcher', '[data-currency]']
      },
      multiLanguage: {
        patterns: ['language', 'lang', 'translate', '语言', '翻译'],
        selectors: ['.language-selector', '.lang-switcher', '[hreflang]']
      },
      internationalShipping: {
        content: [
          'international shipping', 'worldwide shipping', 'global shipping',
          'ship to', 'shipping to', '国际运输', '全球配送', '海外配送'
        ]
      },
      paymentMethods: {
        international: [
          'paypal', 'stripe', 'alipay', 'wechat pay', 'klarna',
          'afterpay', 'apple pay', 'google pay', '支付宝', '微信支付'
        ]
      },
      complianceFeatures: {
        patterns: [
          'gdpr', 'privacy policy', 'cookie policy', 'terms of service',
          'ccpa', 'cookie consent', '隐私政策', '服务条款', 'cookie同意'
        ]
      }
    };
  }

  /**
   * 执行完整的跨境电商分析
   */
  analyzeCrossBorderSite(extractedData) {
    const analysis = {
      platform: this.detectPlatform(extractedData),
      ecommerceType: this.classifyEcommerceType(extractedData),
      crossBorderFeatures: this.analyzeCrossBorderFeatures(extractedData),
      marketReadiness: this.assessMarketReadiness(extractedData),
      technicalCapabilities: this.assessTechnicalCapabilities(extractedData),
      recommendations: []
    };

    // 生成专项建议
    analysis.recommendations = this.generateCrossBorderRecommendations(analysis, extractedData);

    return analysis;
  }

  /**
   * 检测电商平台
   */
  detectPlatform(data) {
    const detectedPlatforms = {};
    const content = JSON.stringify(data).toLowerCase();
    const html = data.html || '';

    Object.entries(this.platformDetectors).forEach(([platform, detector]) => {
      let confidence = 0;

      // 检查标识符
      detector.identifiers?.forEach(identifier => {
        if (content.includes(identifier.toLowerCase())) {
          confidence += 30;
        }
      });

      // 检查meta标签
      if (detector.metaTags && data.meta) {
        detector.metaTags.forEach(tag => {
          const metaValue = data.meta.basic?.[tag] || '';
          if (metaValue.toLowerCase().includes(platform)) {
            confidence += 40;
          }
        });
      }

      // 检查JavaScript变量
      detector.jsVariables?.forEach(variable => {
        if (html.includes(variable)) {
          confidence += 25;
        }
      });

      // 检查CSS类名
      detector.cssClasses?.forEach(className => {
        if (html.includes(className)) {
          confidence += 15;
        }
      });

      if (confidence > 0) {
        detectedPlatforms[platform] = {
          confidence: Math.min(confidence, 100),
          detected: confidence > 50
        };
      }
    });

    // 确定主要平台
    const primaryPlatform = Object.entries(detectedPlatforms)
      .sort(([,a], [,b]) => b.confidence - a.confidence)[0];

    return {
      detected: detectedPlatforms,
      primary: primaryPlatform ? primaryPlatform[0] : 'unknown',
      confidence: primaryPlatform ? primaryPlatform[1].confidence : 0,
      isIndependent: !primaryPlatform || primaryPlatform[1].confidence < 60
    };
  }

  /**
   * 分类电商网站类型
   */
  classifyEcommerceType(data) {
    const types = {};
    const content = JSON.stringify(data).toLowerCase();
    const html = data.html || '';

    Object.entries(this.ecommercePatterns).forEach(([type, pattern]) => {
      let score = 0;

      // 检查选择器
      pattern.selectors?.forEach(selector => {
        // 简化检查，实际中需要解析DOM
        const selectorClass = selector.replace(/[\[\]\.#]/g, '');
        if (html.includes(selectorClass)) {
          score += 20;
        }
      });

      // 检查内容关键词
      pattern.content?.forEach(keyword => {
        if (content.includes(keyword)) {
          score += 15;
        }
      });

      types[type] = {
        score,
        detected: score > 30
      };
    });

    return types;
  }

  /**
   * 分析跨境电商特征
   */
  analyzeCrossBorderFeatures(data) {
    const features = {};
    const content = JSON.stringify(data).toLowerCase();
    const html = data.html || '';

    Object.entries(this.crossBorderIndicators).forEach(([feature, config]) => {
      let detected = false;
      let details = [];

      // 检查模式匹配
      if (config.patterns) {
        config.patterns.forEach(pattern => {
          if (content.includes(pattern.toLowerCase())) {
            detected = true;
            details.push(`发现${pattern}支持`);
          }
        });
      }

      // 检查选择器
      if (config.selectors) {
        config.selectors.forEach(selector => {
          const selectorClass = selector.replace(/[\[\]\.#]/g, '');
          if (html.includes(selectorClass)) {
            detected = true;
            details.push(`发现${selector}元素`);
          }
        });
      }

      // 检查内容关键词
      if (config.content) {
        config.content.forEach(keyword => {
          if (content.includes(keyword)) {
            detected = true;
            details.push(`支持${keyword}`);
          }
        });
      }

      // 特殊检查逻辑
      if (config.international) {
        config.international.forEach(method => {
          if (content.includes(method)) {
            detected = true;
            details.push(`支持${method}支付`);
          }
        });
      }

      features[feature] = {
        detected,
        details,
        score: detected ? Math.min(details.length * 25, 100) : 0
      };
    });

    return features;
  }

  /**
   * 评估市场准备度
   */
  assessMarketReadiness(data) {
    const readiness = {
      overall: 0,
      categories: {}
    };

    // 技术准备度
    const technicalFeatures = [
      'multiCurrency', 'multiLanguage', 'internationalShipping', 'paymentMethods'
    ];
    
    let technicalScore = 0;
    const crossBorderFeatures = this.analyzeCrossBorderFeatures(data);
    
    technicalFeatures.forEach(feature => {
      if (crossBorderFeatures[feature]?.detected) {
        technicalScore += 25;
      }
    });

    readiness.categories.technical = Math.min(technicalScore, 100);

    // 合规准备度
    const complianceScore = crossBorderFeatures.complianceFeatures?.score || 0;
    readiness.categories.compliance = complianceScore;

    // 内容准备度（基于语言和文化适配）
    const hasMultiLanguage = crossBorderFeatures.multiLanguage?.detected;
    const contentScore = hasMultiLanguage ? 80 : 20;
    readiness.categories.content = contentScore;

    // 用户体验准备度
    const hasResponsiveDesign = data.meta?.basic?.viewport?.includes('device-width');
    const uxScore = hasResponsiveDesign ? 70 : 30;
    readiness.categories.userExperience = uxScore;

    // 计算总体准备度
    const categoryScores = Object.values(readiness.categories);
    readiness.overall = Math.round(
      categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length
    );

    return readiness;
  }

  /**
   * 评估技术能力
   */
  assessTechnicalCapabilities(data) {
    const capabilities = {
      seoOptimization: this.assessSEOCapabilities(data),
      performanceOptimization: this.assessPerformanceCapabilities(data),
      securityFeatures: this.assessSecurityFeatures(data),
      analyticsIntegration: this.assessAnalyticsIntegration(data)
    };

    return capabilities;
  }

  /**
   * 评估SEO能力
   */
  assessSEOCapabilities(data) {
    const seoFeatures = {
      metaTags: 0,
      structuredData: 0,
      alternateLanguages: 0,
      sitemap: 0
    };

    // 检查meta标签
    const meta = data.meta?.basic || {};
    if (meta.title) seoFeatures.metaTags += 25;
    if (meta.description) seoFeatures.metaTags += 25;
    if (meta.keywords) seoFeatures.metaTags += 25;
    if (meta.robots) seoFeatures.metaTags += 25;

    // 检查结构化数据
    const html = data.html || '';
    if (html.includes('application/ld+json') || html.includes('itemtype')) {
      seoFeatures.structuredData = 100;
    }

    // 检查多语言hreflang
    if (html.includes('hreflang')) {
      seoFeatures.alternateLanguages = 100;
    }

    // 检查sitemap（简化检查）
    if (html.includes('sitemap') || html.includes('robots.txt')) {
      seoFeatures.sitemap = 80;
    }

    const avgScore = Object.values(seoFeatures).reduce((sum, score) => sum + score, 0) / 4;

    return {
      score: Math.round(avgScore),
      features: seoFeatures,
      recommendations: this.generateSEORecommendations(seoFeatures)
    };
  }

  /**
   * 评估性能优化能力
   */
  assessPerformanceCapabilities(data) {
    const performanceFeatures = {
      imageOptimization: 0,
      caching: 0,
      compression: 0,
      cdn: 0
    };

    const html = data.html || '';
    const images = data.images || [];

    // 检查图片优化
    const webpImages = images.filter(img => img.src?.includes('.webp')).length;
    const lazyImages = images.filter(img => 
      img.loading === 'lazy' || html.includes('lazy')
    ).length;
    
    if (webpImages > 0 || lazyImages > 0) {
      performanceFeatures.imageOptimization = Math.min(80, (webpImages + lazyImages) * 20);
    }

    // 检查缓存策略
    if (html.includes('sw.js') || html.includes('service-worker')) {
      performanceFeatures.caching = 90;
    }

    // 检查压缩
    if (data.performance?.resources?.some(r => r.transferSize < r.decodedBodySize)) {
      performanceFeatures.compression = 85;
    }

    // 检查CDN使用
    const cdnPatterns = ['cdn.', 'cloudflare', 'cloudfront', 'fastly'];
    const usesCDN = cdnPatterns.some(pattern => html.includes(pattern));
    if (usesCDN) {
      performanceFeatures.cdn = 90;
    }

    const avgScore = Object.values(performanceFeatures).reduce((sum, score) => sum + score, 0) / 4;

    return {
      score: Math.round(avgScore),
      features: performanceFeatures,
      loadTime: data.performance?.loadTime || 0
    };
  }

  /**
   * 评估安全特性
   */
  assessSecurityFeatures(data) {
    const securityFeatures = {
      https: 0,
      securityHeaders: 0,
      contentSecurityPolicy: 0,
      cookiePolicy: 0
    };

    const url = data.url || '';
    const html = data.html || '';

    // HTTPS检查
    if (url.startsWith('https://')) {
      securityFeatures.https = 100;
    }

    // 安全头检查（简化）
    if (html.includes('X-Frame-Options') || html.includes('X-XSS-Protection')) {
      securityFeatures.securityHeaders = 80;
    }

    // CSP检查
    if (html.includes('Content-Security-Policy')) {
      securityFeatures.contentSecurityPolicy = 100;
    }

    // Cookie政策
    if (html.includes('cookie') && html.includes('policy')) {
      securityFeatures.cookiePolicy = 90;
    }

    const avgScore = Object.values(securityFeatures).reduce((sum, score) => sum + score, 0) / 4;

    return {
      score: Math.round(avgScore),
      features: securityFeatures
    };
  }

  /**
   * 评估分析集成
   */
  assessAnalyticsIntegration(data) {
    const analyticsFeatures = {
      googleAnalytics: 0,
      googleTagManager: 0,
      facebookPixel: 0,
      ecommerceTracking: 0
    };

    const html = data.html || '';

    // Google Analytics
    if (html.includes('gtag') || html.includes('analytics.js')) {
      analyticsFeatures.googleAnalytics = 100;
    }

    // Google Tag Manager
    if (html.includes('googletagmanager')) {
      analyticsFeatures.googleTagManager = 100;
    }

    // Facebook Pixel
    if (html.includes('fbq') || html.includes('facebook.com/tr')) {
      analyticsFeatures.facebookPixel = 100;
    }

    // 电商追踪
    if (html.includes('purchase') || html.includes('transaction')) {
      analyticsFeatures.ecommerceTracking = 80;
    }

    const avgScore = Object.values(analyticsFeatures).reduce((sum, score) => sum + score, 0) / 4;

    return {
      score: Math.round(avgScore),
      features: analyticsFeatures
    };
  }

  /**
   * 生成跨境电商专项建议
   */
  generateCrossBorderRecommendations(analysis, data) {
    const recommendations = [];

    // 平台相关建议
    if (analysis.platform.isIndependent) {
      recommendations.push({
        category: 'platform',
        priority: 'medium',
        issue: '独立站技术架构',
        suggestion: '考虑集成专业的跨境电商解决方案，如多货币支付网关和国际物流API'
      });
    }

    // 跨境功能建议
    Object.entries(analysis.crossBorderFeatures).forEach(([feature, info]) => {
      if (!info.detected) {
        const suggestions = {
          multiCurrency: '建议添加多货币支持，集成实时汇率转换功能',
          multiLanguage: '建议实现多语言切换功能，支持目标市场的本地语言',
          internationalShipping: '建议添加国际运输选项和运费计算器',
          paymentMethods: '建议集成国际支付方式，如PayPal、Stripe等',
          complianceFeatures: '建议添加GDPR、CCPA等合规声明和Cookie同意机制'
        };

        if (suggestions[feature]) {
          recommendations.push({
            category: 'crossBorderFeatures',
            priority: 'high',
            issue: `缺少${feature}功能`,
            suggestion: suggestions[feature]
          });
        }
      }
    });

    // 市场准备度建议
    if (analysis.marketReadiness.overall < 60) {
      recommendations.push({
        category: 'marketReadiness',
        priority: 'high',
        issue: '跨境市场准备度不足',
        suggestion: '需要全面提升技术、合规、内容和用户体验各方面的跨境电商能力'
      });
    }

    // 技术能力建议
    Object.entries(analysis.technicalCapabilities).forEach(([capability, info]) => {
      if (info.score < 70) {
        const suggestions = {
          seoOptimization: '建议完善SEO优化，添加完整的meta标签和结构化数据',
          performanceOptimization: '建议启用图片优化、缓存策略和CDN加速',
          securityFeatures: '建议加强安全防护，确保HTTPS和安全头配置',
          analyticsIntegration: '建议集成完整的分析追踪系统，监控跨境业务表现'
        };

        if (suggestions[capability]) {
          recommendations.push({
            category: 'technicalCapabilities',
            priority: 'medium',
            issue: `${capability}能力不足`,
            suggestion: suggestions[capability]
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * 生成SEO建议
   */
  generateSEORecommendations(seoFeatures) {
    const recommendations = [];

    if (seoFeatures.metaTags < 75) {
      recommendations.push('完善页面meta标签，包括title、description、keywords');
    }

    if (seoFeatures.structuredData === 0) {
      recommendations.push('添加结构化数据标记，提升搜索引擎理解');
    }

    if (seoFeatures.alternateLanguages === 0) {
      recommendations.push('为多语言页面添加hreflang标签');
    }

    if (seoFeatures.sitemap < 80) {
      recommendations.push('创建并提交XML网站地图');
    }

    return recommendations;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CrossBorderSiteAnalyzer;
} else {
  window.CrossBorderSiteAnalyzer = CrossBorderSiteAnalyzer;
}