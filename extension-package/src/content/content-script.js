// 内容抓取脚本 - 提取页面关键信息用于地域适配分析
class ContentExtractor {
  constructor() {
    this.extractedData = null;
    this.isShopifyStore = this.detectShopify();
    this.enhancedAnalysisService = null;
    this.initializeEnhancedAnalysis();
  }

  // 初始化增强分析服务
  async initializeEnhancedAnalysis() {
    try {
      // 动态加载增强分析服务的依赖
      await this.loadAnalysisServices();
      this.enhancedAnalysisService = new EnhancedAnalysisService();
      console.log('Enhanced analysis service initialized in content script');
    } catch (error) {
      console.warn('Failed to initialize enhanced analysis:', error);
    }
  }

  // 动态加载分析服务
  async loadAnalysisServices() {
    const services = [
      'src/data/data-loader.js',
      'src/rules/rule-engine.js',
      'src/services/crossborder-analyzer.js',
      'src/services/device-market-analyzer.js',
      'src/services/network-performance.js',
      'src/services/ai-cache-service.js',
      'src/ai/ai-service.js',
      'src/services/enhanced-analysis-service.js'
    ];

    for (const service of services) {
      try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(service);
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      } catch (error) {
        console.warn(`Failed to load ${service}:`, error);
      }
    }
  }

  // 检测是否为Shopify店铺
  detectShopify() {
    return !!(
      window.Shopify || 
      document.querySelector('script[src*="shopify"]') ||
      document.querySelector('meta[name="generator"][content*="Shopify"]')
    );
  }

  // 主要内容提取方法
  extractPageContent() {
    const data = {
      url: window.location.href,
      title: document.title,
      language: this.detectLanguage(),
      meta: this.extractMetaData(),
      text: this.extractTextContent(),
      images: this.extractImages(),
      structure: this.analyzePageStructure(),
      ecommerce: this.extractEcommerceData(),
      performance: this.measurePerformance(),
      timestamp: new Date().toISOString()
    };

    this.extractedData = data;
    return data;
  }

  // 语言检测
  detectLanguage() {
    const htmlLang = document.documentElement.lang;
    const metaLang = document.querySelector('meta[http-equiv="content-language"]')?.content;
    const detectedLang = this.detectFromContent();
    
    return {
      declared: htmlLang || metaLang,
      detected: detectedLang,
      confidence: this.getLanguageConfidence(detectedLang)
    };
  }

  // 从内容检测语言
  detectFromContent() {
    const textSample = document.body.innerText.slice(0, 1000);
    const patterns = {
      'zh-CN': /[\u4e00-\u9fff]/g,
      'en': /^[a-zA-Z\s.,!?]+$/,
      'es': /[ñáéíóúü]/gi,
      'fr': /[àâäçéèêëïîôùûüÿæœ]/gi,
      'de': /[äöüß]/gi,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/g,
      'ko': /[\uac00-\ud7af]/g
    };

    let maxScore = 0;
    let detectedLang = 'en';
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = (textSample.match(pattern) || []).length;
      if (matches > maxScore) {
        maxScore = matches;
        detectedLang = lang;
      }
    }
    
    return detectedLang;
  }

  // 提取Meta数据
  extractMetaData() {
    const metas = {};
    document.querySelectorAll('meta').forEach(meta => {
      const name = meta.name || meta.property || meta.httpEquiv;
      const content = meta.content;
      if (name && content) {
        metas[name] = content;
      }
    });

    return {
      basic: metas,
      structured: this.extractStructuredData(),
      og: this.extractOpenGraph(),
      twitter: this.extractTwitterCard()
    };
  }

  // 提取结构化数据
  extractStructuredData() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const structuredData = [];
    
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        structuredData.push(data);
      } catch (e) {
        console.warn('无法解析结构化数据:', e);
      }
    });

    return structuredData;
  }

  // 提取文本内容
  extractTextContent() {
    const textElements = {
      headings: this.extractHeadings(),
      paragraphs: this.extractParagraphs(),
      navigation: this.extractNavigation(),
      buttons: this.extractButtons(),
      forms: this.extractForms(),
      footers: this.extractFooters()
    };

    return textElements;
  }

  // 提取标题层次
  extractHeadings() {
    const headings = {};
    for (let i = 1; i <= 6; i++) {
      headings[`h${i}`] = Array.from(document.querySelectorAll(`h${i}`))
        .map(h => ({ text: h.textContent.trim(), id: h.id }));
    }
    return headings;
  }

  // 提取段落内容
  extractParagraphs() {
    return Array.from(document.querySelectorAll('p'))
      .map(p => p.textContent.trim())
      .filter(text => text.length > 20)
      .slice(0, 50); // 限制数量避免过量数据
  }

  // 提取导航内容
  extractNavigation() {
    const navSelectors = ['nav', '.navigation', '.menu', 'header nav', '.navbar'];
    const navItems = [];
    
    navSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(nav => {
        const links = Array.from(nav.querySelectorAll('a'))
          .map(a => ({ text: a.textContent.trim(), href: a.href }));
        navItems.push(...links);
      });
    });

    return navItems.slice(0, 30);
  }

  // 提取按钮文本
  extractButtons() {
    return Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], .btn'))
      .map(btn => btn.textContent.trim() || btn.value)
      .filter(text => text)
      .slice(0, 20);
  }

  // 提取图片信息
  extractImages() {
    return Array.from(document.querySelectorAll('img'))
      .map(img => ({
        src: img.src,
        alt: img.alt,
        title: img.title,
        lazy: img.loading === 'lazy'
      }))
      .slice(0, 50);
  }

  // 提取电商相关数据
  extractEcommerceData() {
    const ecommerceData = {
      products: this.extractProductInfo(),
      prices: this.extractPrices(),
      categories: this.extractCategories(),
      reviews: this.extractReviews(),
      checkout: this.extractCheckoutInfo(),
      shipping: this.extractShippingInfo()
    };

    if (this.isShopifyStore) {
      ecommerceData.shopify = this.extractShopifySpecific();
    }

    return ecommerceData;
  }

  // 提取产品信息
  extractProductInfo() {
    const productSelectors = [
      '.product', '.product-item', '.product-card',
      '[data-product]', '.shopify-product-form'
    ];

    const products = [];
    productSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(product => {
        const title = product.querySelector('.product-title, h1, h2, h3')?.textContent.trim();
        const price = product.querySelector('.price, .product-price')?.textContent.trim();
        const description = product.querySelector('.product-description, .description')?.textContent.trim();
        
        if (title) {
          products.push({ title, price, description: description?.slice(0, 200) });
        }
      });
    });

    return products.slice(0, 10);
  }

  // 性能测量
  measurePerformance() {
    const perf = performance.getEntriesByType('navigation')[0];
    
    return {
      loadTime: perf ? perf.loadEventEnd - perf.loadEventStart : null,
      domContentLoaded: perf ? perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart : null,
      firstPaint: this.getFirstPaint(),
      resourcesCount: performance.getEntriesByType('resource').length
    };
  }

  // 获取首次绘制时间
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fp = paintEntries.find(entry => entry.name === 'first-paint');
    return fp ? fp.startTime : null;
  }

  // 发送数据到扩展（增强版）
  async sendToExtension() {
    if (!this.extractedData) {
      this.extractPageContent();
    }

    // 尝试执行增强分析
    let enhancedAnalysis = null;
    if (this.enhancedAnalysisService) {
      try {
        console.log('执行增强分析...');
        enhancedAnalysis = await this.enhancedAnalysisService.performEnhancedAnalysis(
          this.extractedData,
          ['US', 'GB', 'DE'], // 默认目标地区
          {
            includeNetworkPerformance: true,
            includeAIAnalysis: false, // 在内容脚本中禁用AI分析以节省资源
            networkTimeout: 8000
          }
        );
        console.log('增强分析完成:', enhancedAnalysis.id);
      } catch (error) {
        console.error('增强分析失败:', error);
      }
    }

    chrome.runtime.sendMessage({
      type: 'CONTENT_EXTRACTED',
      data: this.extractedData,
      enhancedAnalysis: enhancedAnalysis
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('发送数据失败:', chrome.runtime.lastError);
      } else if (response?.success && enhancedAnalysis) {
        console.log('增强分析数据已发送到扩展');
      }
    });
  }

  // 提取Open Graph数据
  extractOpenGraph() {
    const ogData = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
      const property = meta.getAttribute('property').replace('og:', '');
      ogData[property] = meta.getAttribute('content');
    });
    return ogData;
  }

  // 提取Twitter Card数据
  extractTwitterCard() {
    const twitterData = {};
    document.querySelectorAll('meta[name^="twitter:"]').forEach(meta => {
      const name = meta.getAttribute('name').replace('twitter:', '');
      twitterData[name] = meta.getAttribute('content');
    });
    return twitterData;
  }

  // 提取表单信息
  extractForms() {
    return Array.from(document.querySelectorAll('form')).map(form => {
      const inputs = Array.from(form.querySelectorAll('input, select, textarea'))
        .map(input => ({
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
          required: input.required
        }));
      
      return {
        action: form.action,
        method: form.method,
        inputs: inputs,
        submitText: form.querySelector('button[type="submit"], input[type="submit"]')?.textContent?.trim() || form.querySelector('button[type="submit"], input[type="submit"]')?.value
      };
    });
  }

  // 提取页脚信息
  extractFooters() {
    const footerSelectors = ['footer', '.footer', '.site-footer'];
    const footerData = [];
    
    footerSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(footer => {
        const links = Array.from(footer.querySelectorAll('a')).map(a => ({
          text: a.textContent.trim(),
          href: a.href
        }));
        
        const text = footer.textContent.trim().substring(0, 500);
        if (text) {
          footerData.push({ text, links });
        }
      });
    });
    
    return footerData;
  }

  // 增强价格提取
  extractPrices() {
    const priceSelectors = [
      '.price', '.product-price', '.price-current', '.sale-price',
      '.regular-price', '.original-price', '.discounted-price',
      '[data-price]', '.money', '.amount', '.cost',
      '.price-box', '.price-wrapper', '.product-price-wrapper',
      // 常见电商网站价格选择器
      '.a-price .a-offscreen', // Amazon
      '.notranslate', // 通用价格类
      '.price-current-label + .sr-only', // Walmart
      '.price-group .price', // 通用
      '.product-price .price', // Shopify通用
    ];
    
    const prices = new Set();
    const currencySymbols = /[\$£€¥₹₽￥]/;
    const pricePattern = /[\$£€¥₹₽￥]?\s*[\d,]+\.?\d{0,2}/g;
    
    priceSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        const text = element.textContent.trim();
        if (text && (currencySymbols.test(text) || pricePattern.test(text))) {
          // 清理价格文本
          const cleanPrice = text.replace(/[^\d\$£€¥₹₽￥,\.]/g, '').trim();
          if (cleanPrice && cleanPrice.length > 1) {
            prices.add(cleanPrice);
          }
        }
      });
    });
    
    // 从文本中查找价格模式
    const bodyText = document.body.textContent;
    const foundPrices = bodyText.match(pricePattern);
    if (foundPrices) {
      foundPrices.forEach(price => prices.add(price.trim()));
    }
    
    return Array.from(prices).slice(0, 20);
  }

  // 提取商品分类
  extractCategories() {
    const categorySelectors = [
      '.category', '.product-category', '.breadcrumb',
      '.navigation-item', '.nav-item', '.menu-item',
      '[data-category]', '.taxonomy', '.product-type'
    ];
    
    const categories = new Set();
    
    categorySelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        const text = element.textContent.trim();
        if (text && text.length < 100) {
          categories.add(text);
        }
      });
    });
    
    return Array.from(categories).slice(0, 30);
  }

  // 提取用户评价
  extractReviews() {
    const reviewSelectors = [
      '.review', '.reviews', '.rating', '.testimonial',
      '.feedback', '.comment', '[data-review]',
      '.review-item', '.review-content', '.user-review'
    ];
    
    const reviews = [];
    
    reviewSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        const text = element.textContent.trim();
        const rating = element.querySelector('.rating, .stars, [data-rating]')?.textContent.trim();
        
        if (text && text.length > 10) {
          reviews.push({
            text: text.substring(0, 300),
            rating: rating || null,
            hasStars: !!element.querySelector('.star, .fa-star')
          });
        }
      });
    });
    
    return reviews.slice(0, 10);
  }

  // 提取结账相关信息
  extractCheckoutInfo() {
    const checkoutData = {
      paymentMethods: this.extractPaymentMethods(),
      shippingOptions: this.extractShippingOptions(),
      checkoutButtons: this.extractCheckoutButtons(),
      securityBadges: this.extractSecurityBadges(),
      currencies: this.extractCurrencyInfo()
    };
    
    return checkoutData;
  }
  
  // 提取支付方式
  extractPaymentMethods() {
    const paymentMethods = new Set();
    
    // 检查图片alt属性和title
    document.querySelectorAll('img').forEach(img => {
      const alt = img.alt.toLowerCase();
      const title = img.title.toLowerCase();
      const src = img.src.toLowerCase();
      
      const paymentKeywords = [
        'paypal', 'visa', 'mastercard', 'amex', 'american express',
        'discover', 'apple pay', 'google pay', 'alipay', 'wechat pay',
        '支付宝', '微信支付', 'unionpay', 'jcb', 'diners', 'klarna',
        'afterpay', 'stripe', 'square', 'bitcoin', 'cryptocurrency'
      ];
      
      paymentKeywords.forEach(keyword => {
        if (alt.includes(keyword) || title.includes(keyword) || src.includes(keyword)) {
          paymentMethods.add(keyword);
        }
      });
    });
    
    // 检查文本内容
    const bodyText = document.body.textContent.toLowerCase();
    const paymentTexts = [
      'paypal', 'visa', 'mastercard', 'apple pay', 'google pay',
      'alipay', 'wechat pay', '支付宝', '微信支付'
    ];
    
    paymentTexts.forEach(payment => {
      if (bodyText.includes(payment)) {
        paymentMethods.add(payment);
      }
    });
    
    return Array.from(paymentMethods);
  }
  
  // 提取配送选项
  extractShippingOptions() {
    const shippingTexts = [];
    const shippingSelectors = [
      '.shipping', '.delivery', '.shipping-option',
      '.delivery-option', '[data-shipping]'
    ];
    
    shippingSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        const text = element.textContent.trim();
        if (text && text.length < 200) {
          shippingTexts.push(text);
        }
      });
    });
    
    return shippingTexts.slice(0, 10);
  }
  
  // 提取结账按钮
  extractCheckoutButtons() {
    const buttonSelectors = [
      '.checkout', '.buy-now', '.add-to-cart', '.purchase',
      '[data-checkout]', '.btn-checkout', '.cart-button'
    ];
    
    const buttons = [];
    
    buttonSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        const text = element.textContent.trim();
        if (text) {
          buttons.push(text);
        }
      });
    });
    
    return buttons;
  }
  
  // 提取安全标识
  extractSecurityBadges() {
    const badges = [];
    
    document.querySelectorAll('img').forEach(img => {
      const alt = img.alt.toLowerCase();
      const securityKeywords = ['ssl', 'secure', 'trusted', 'verified', 'certificate'];
      
      securityKeywords.forEach(keyword => {
        if (alt.includes(keyword)) {
          badges.push(alt);
        }
      });
    });
    
    return badges;
  }
  
  // 提取货币信息
  extractCurrencyInfo() {
    const currencies = new Set();
    const currencyPattern = /[\$£€¥₹₽￥]/g;
    const currencyNames = ['usd', 'eur', 'gbp', 'jpy', 'cny', 'cad', 'aud'];
    
    const bodyText = document.body.textContent.toLowerCase();
    
    // 检查货币符号
    const symbols = bodyText.match(currencyPattern);
    if (symbols) {
      symbols.forEach(symbol => currencies.add(symbol));
    }
    
    // 检查货币名称
    currencyNames.forEach(currency => {
      if (bodyText.includes(currency)) {
        currencies.add(currency.toUpperCase());
      }
    });
    
    return Array.from(currencies);
  }

  // 提取运输信息
  extractShippingInfo() {
    const shippingInfo = {
      methods: [],
      costs: [],
      regions: [],
      timeframes: []
    };
    
    const shippingText = document.body.textContent.toLowerCase();
    
    // 运输方式关键词
    const shippingMethods = [
      'free shipping', 'express', 'standard', 'overnight',
      'next day', 'two-day', '2-day', 'ground', 'air',
      'international', 'domestic', 'fedex', 'ups', 'dhl'
    ];
    
    shippingMethods.forEach(method => {
      if (shippingText.includes(method)) {
        shippingInfo.methods.push(method);
      }
    });
    
    return shippingInfo;
  }

  // Shopify特定数据提取
  extractShopifySpecific() {
    const shopifyData = {
      theme: null,
      variants: [],
      collections: [],
      shop: null
    };
    
    // 检查Shopify全局对象
    if (window.Shopify) {
      shopifyData.shop = window.Shopify.shop;
      shopifyData.currency = window.Shopify.currency;
    }
    
    // 查找产品变体信息
    const variantScript = document.querySelector('script[data-product-json]');
    if (variantScript) {
      try {
        const productData = JSON.parse(variantScript.textContent);
        shopifyData.variants = productData.variants || [];
      } catch (e) {
        console.warn('无法解析Shopify产品数据:', e);
      }
    }
    
    return shopifyData;
  }

  // 页面结构分析
  analyzePageStructure() {
    return {
      hasHeader: !!document.querySelector('header, .header'),
      hasNavigation: !!document.querySelector('nav, .nav, .navigation'),
      hasFooter: !!document.querySelector('footer, .footer'),
      hasSidebar: !!document.querySelector('.sidebar, aside'),
      hasSearchBox: !!document.querySelector('input[type="search"], .search'),
      hasShoppingCart: !!document.querySelector('.cart, .shopping-cart, [data-cart]'),
      isResponsive: !!document.querySelector('meta[name="viewport"]'),
      hasBreadcrumbs: !!document.querySelector('.breadcrumb, .breadcrumbs'),
      totalElements: document.querySelectorAll('*').length,
      scriptTags: document.querySelectorAll('script').length,
      styleTags: document.querySelectorAll('link[rel="stylesheet"], style').length
    };
  }

  // 语言置信度计算
  getLanguageConfidence(detectedLang) {
    const textSample = document.body.innerText.slice(0, 2000);
    const patterns = {
      'zh-CN': /[\u4e00-\u9fff]/g,
      'en': /\b[a-zA-Z]+\b/g,
      'es': /[ñáéíóúü]/gi,
      'fr': /[àâäçéèêëïîôùûüÿæœ]/gi,
      'de': /[äöüß]/gi,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/g,
      'ko': /[\uac00-\ud7af]/g
    };
    
    const pattern = patterns[detectedLang];
    if (!pattern) return 0.5;
    
    const matches = (textSample.match(pattern) || []).length;
    const totalWords = (textSample.match(/\b\w+\b/g) || []).length;
    
    return totalWords > 0 ? Math.min(matches / totalWords, 1.0) : 0.5;
  }
}

// 初始化内容提取器
const contentExtractor = new ContentExtractor();

// 页面加载完成后自动提取内容
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => contentExtractor.sendToExtension(), 1000);
  });
} else {
  setTimeout(() => contentExtractor.sendToExtension(), 1000);
}

// 监听来自popup的消息（增强版）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTRACT_CONTENT') {
    const data = contentExtractor.extractPageContent();
    sendResponse({ success: true, data });
  } else if (request.type === 'RUN_ENHANCED_ANALYSIS') {
    // 异步执行增强分析
    (async () => {
      try {
        if (!contentExtractor.enhancedAnalysisService) {
          await contentExtractor.initializeEnhancedAnalysis();
        }
        
        const analysisData = contentExtractor.extractedData || contentExtractor.extractPageContent();
        const options = request.options || {};
        
        const enhancedAnalysis = await contentExtractor.enhancedAnalysisService.performEnhancedAnalysis(
          analysisData,
          request.targetRegions || ['US'],
          options
        );
        
        sendResponse({ 
          success: true, 
          analysis: enhancedAnalysis,
          message: `增强分析完成 [${enhancedAnalysis.id}]`
        });
      } catch (error) {
        console.error('Enhanced analysis failed:', error);
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      }
    })();
    
    return true; // 保持消息通道开放以支持异步响应
  }
});