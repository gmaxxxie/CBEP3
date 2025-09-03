/**
 * Device Market Data Analysis Service
 * 设备市场数据分析服务，提供地区设备使用习惯和市场占有率分析
 */

class DeviceMarketDataAnalyzer {
  constructor() {
    this.marketData = this.initializeMarketData();
    this.deviceCapabilities = this.initializeDeviceCapabilities();
    this.regionalPreferences = this.initializeRegionalPreferences();
  }

  /**
   * 初始化设备市场数据
   */
  initializeMarketData() {
    return {
      global: {
        mobile: { share: 58.99, trend: 'increasing' },
        desktop: { share: 39.35, trend: 'decreasing' },
        tablet: { share: 1.66, trend: 'stable' }
      },
      regions: {
        'US': {
          mobile: { share: 60.67, trend: 'increasing', preferredOS: 'iOS' },
          desktop: { share: 37.74, trend: 'decreasing', preferredOS: 'Windows' },
          tablet: { share: 1.59, trend: 'stable', preferredOS: 'iPadOS' },
          screenResolutions: {
            mobile: ['390x844', '414x896', '375x812'],
            desktop: ['1920x1080', '1366x768', '1536x864'],
            tablet: ['820x1180', '768x1024']
          },
          networkSpeeds: { '4G': 70, '5G': 25, 'WiFi': 90 },
          averageLoadTolerance: 3500 // ms
        },
        'GB': {
          mobile: { share: 63.21, trend: 'increasing', preferredOS: 'Android' },
          desktop: { share: 35.45, trend: 'decreasing', preferredOS: 'Windows' },
          tablet: { share: 1.34, trend: 'stable', preferredOS: 'Android' },
          screenResolutions: {
            mobile: ['390x844', '375x667', '414x896'],
            desktop: ['1920x1080', '1366x768'],
            tablet: ['800x1280', '768x1024']
          },
          networkSpeeds: { '4G': 75, '5G': 30, 'WiFi': 88 },
          averageLoadTolerance: 3200
        },
        'DE': {
          mobile: { share: 56.89, trend: 'increasing', preferredOS: 'Android' },
          desktop: { share: 41.23, trend: 'stable', preferredOS: 'Windows' },
          tablet: { share: 1.88, trend: 'stable', preferredOS: 'Android' },
          screenResolutions: {
            mobile: ['390x844', '375x667'],
            desktop: ['1920x1080', '1366x768', '1440x900'],
            tablet: ['800x1280']
          },
          networkSpeeds: { '4G': 72, '5G': 35, 'WiFi': 92 },
          averageLoadTolerance: 2800
        },
        'FR': {
          mobile: { share: 59.34, trend: 'increasing', preferredOS: 'Android' },
          desktop: { share: 38.92, trend: 'decreasing', preferredOS: 'Windows' },
          tablet: { share: 1.74, trend: 'stable', preferredOS: 'Android' },
          screenResolutions: {
            mobile: ['390x844', '375x812'],
            desktop: ['1920x1080', '1366x768'],
            tablet: ['768x1024']
          },
          networkSpeeds: { '4G': 68, '5G': 28, 'WiFi': 85 },
          averageLoadTolerance: 3100
        },
        'CN': {
          mobile: { share: 71.46, trend: 'increasing', preferredOS: 'Android' },
          desktop: { share: 27.32, trend: 'decreasing', preferredOS: 'Windows' },
          tablet: { share: 1.22, trend: 'stable', preferredOS: 'Android' },
          screenResolutions: {
            mobile: ['390x844', '375x812', '414x896'],
            desktop: ['1920x1080', '1366x768'],
            tablet: ['800x1280']
          },
          networkSpeeds: { '4G': 65, '5G': 45, 'WiFi': 78 },
          averageLoadTolerance: 4200,
          specialFeatures: ['WeChat integration', 'Alipay support', 'QR codes']
        },
        'JP': {
          mobile: { share: 68.73, trend: 'increasing', preferredOS: 'iOS' },
          desktop: { share: 29.84, trend: 'decreasing', preferredOS: 'Windows' },
          tablet: { share: 1.43, trend: 'stable', preferredOS: 'iPadOS' },
          screenResolutions: {
            mobile: ['390x844', '375x812'],
            desktop: ['1920x1080', '1366x768'],
            tablet: ['820x1180']
          },
          networkSpeeds: { '4G': 80, '5G': 60, 'WiFi': 95 },
          averageLoadTolerance: 2500,
          specialFeatures: ['High pixel density preference', 'Minimalist design']
        },
        'KR': {
          mobile: { share: 72.89, trend: 'increasing', preferredOS: 'Android' },
          desktop: { share: 25.67, trend: 'decreasing', preferredOS: 'Windows' },
          tablet: { share: 1.44, trend: 'stable', preferredOS: 'Android' },
          screenResolutions: {
            mobile: ['390x844', '360x800'],
            desktop: ['1920x1080', '1366x768'],
            tablet: ['800x1280']
          },
          networkSpeeds: { '4G': 78, '5G': 65, 'WiFi': 98 },
          averageLoadTolerance: 2200,
          specialFeatures: ['Fast network expectations', 'Samsung integration']
        },
        'AE': {
          mobile: { share: 65.23, trend: 'increasing', preferredOS: 'iOS' },
          desktop: { share: 33.12, trend: 'stable', preferredOS: 'Windows' },
          tablet: { share: 1.65, trend: 'stable', preferredOS: 'iPadOS' },
          screenResolutions: {
            mobile: ['390x844', '414x896'],
            desktop: ['1920x1080', '1366x768'],
            tablet: ['820x1180']
          },
          networkSpeeds: { '4G': 82, '5G': 40, 'WiFi': 90 },
          averageLoadTolerance: 3000,
          specialFeatures: ['High-end device preference', 'RTL support needed']
        },
        'BR': {
          mobile: { share: 69.87, trend: 'increasing', preferredOS: 'Android' },
          desktop: { share: 28.94, trend: 'decreasing', preferredOS: 'Windows' },
          tablet: { share: 1.19, trend: 'stable', preferredOS: 'Android' },
          screenResolutions: {
            mobile: ['390x844', '360x800'],
            desktop: ['1366x768', '1920x1080'],
            tablet: ['800x1280']
          },
          networkSpeeds: { '4G': 55, '5G': 15, 'WiFi': 65 },
          averageLoadTolerance: 5500,
          specialFeatures: ['Data cost sensitivity', 'Lower bandwidth optimization']
        }
      },
      browsers: {
        global: {
          chrome: 65.12,
          safari: 18.78,
          edge: 4.45,
          firefox: 3.17,
          samsung: 2.78,
          opera: 2.43,
          other: 3.27
        },
        mobile: {
          chrome: 62.85,
          safari: 25.84,
          samsung: 4.42,
          firefox: 1.89,
          edge: 1.78,
          other: 3.22
        }
      }
    };
  }

  /**
   * 初始化设备能力数据
   */
  initializeDeviceCapabilities() {
    return {
      mobile: {
        modernFeatures: {
          webp: 95,
          avif: 70,
          serviceWorker: 92,
          webAssembly: 88,
          touchEvents: 100,
          deviceOrientation: 98,
          geolocation: 95
        },
        performanceConstraints: {
          limitedRAM: true,
          limitedCPU: true,
          batteryConsciousness: true,
          dataCostAwareness: true
        },
        inputMethods: ['touch', 'voice', 'camera']
      },
      desktop: {
        modernFeatures: {
          webp: 98,
          avif: 85,
          serviceWorker: 95,
          webAssembly: 92,
          fullscreen: 98,
          dragDrop: 100,
          clipboard: 95
        },
        performanceConstraints: {
          limitedRAM: false,
          limitedCPU: false,
          batteryConsciousness: false,
          dataCostAwareness: false
        },
        inputMethods: ['mouse', 'keyboard', 'trackpad']
      },
      tablet: {
        modernFeatures: {
          webp: 93,
          avif: 75,
          serviceWorker: 90,
          webAssembly: 85,
          touchEvents: 100,
          deviceOrientation: 95
        },
        performanceConstraints: {
          limitedRAM: false,
          limitedCPU: false,
          batteryConsciousness: true,
          dataCostAwareness: false
        },
        inputMethods: ['touch', 'stylus', 'keyboard']
      }
    };
  }

  /**
   * 初始化地区设备偏好
   */
  initializeRegionalPreferences() {
    return {
      'US': {
        preferredDevices: ['iPhone', 'MacBook', 'iPad'],
        designPreferences: ['minimalist', 'large buttons', 'accessibility'],
        performanceExpectations: 'high',
        dataUsageConcern: 'low'
      },
      'CN': {
        preferredDevices: ['Xiaomi', 'Huawei', 'Oppo'],
        designPreferences: ['feature-rich', 'colorful', 'social integration'],
        performanceExpectations: 'medium',
        dataUsageConcern: 'medium',
        specialRequirements: ['WeChat integration', 'QR code support']
      },
      'JP': {
        preferredDevices: ['iPhone', 'Sony', 'Nintendo'],
        designPreferences: ['clean', 'precise', 'kawaii elements'],
        performanceExpectations: 'very high',
        dataUsageConcern: 'low'
      },
      'DE': {
        preferredDevices: ['Samsung', 'iPhone', 'ThinkPad'],
        designPreferences: ['functional', 'privacy-focused', 'efficient'],
        performanceExpectations: 'high',
        dataUsageConcern: 'medium'
      },
      'BR': {
        preferredDevices: ['Samsung', 'Motorola', 'LG'],
        designPreferences: ['vibrant', 'social', 'affordable'],
        performanceExpectations: 'medium',
        dataUsageConcern: 'high'
      }
    };
  }

  /**
   * 分析设备市场适配性
   */
  analyzeDeviceCompatibility(pageData, targetRegions) {
    const analysis = {
      overall: {},
      regions: {},
      recommendations: []
    };

    // 全局设备兼容性分析
    analysis.overall = this.analyzeGlobalCompatibility(pageData);

    // 地区特定分析
    targetRegions.forEach(region => {
      analysis.regions[region] = this.analyzeRegionalCompatibility(pageData, region);
    });

    // 生成建议
    analysis.recommendations = this.generateDeviceRecommendations(analysis, targetRegions);

    return analysis;
  }

  /**
   * 分析全局设备兼容性
   */
  analyzeGlobalCompatibility(pageData) {
    const compatibility = {
      mobile: this.analyzeMobileCompatibility(pageData),
      desktop: this.analyzeDesktopCompatibility(pageData),
      tablet: this.analyzeTabletCompatibility(pageData),
      crossDevice: this.analyzeCrossDeviceExperience(pageData)
    };

    // 计算总体评分
    const scores = Object.values(compatibility).map(c => c.score);
    const overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    return {
      ...compatibility,
      overallScore,
      primaryIssues: this.identifyPrimaryIssues(compatibility)
    };
  }

  /**
   * 分析移动端兼容性
   */
  analyzeMobileCompatibility(pageData) {
    const issues = [];
    let score = 100;

    // 检查响应式设计
    const viewport = pageData.meta?.basic?.viewport;
    if (!viewport || !viewport.includes('width=device-width')) {
      issues.push('缺少移动端viewport设置');
      score -= 25;
    }

    // 检查触摸友好性
    const touchElements = this.analyzeTouchFriendliness(pageData);
    if (!touchElements.adequate) {
      issues.push('按钮和链接对触摸操作不够友好');
      score -= 20;
    }

    // 检查加载性能
    const loadTime = pageData.performance?.loadTime || 0;
    if (loadTime > 3000) {
      issues.push('页面加载时间过长，影响移动端体验');
      score -= 15;
    }

    // 检查图片优化
    const imageOptimization = this.analyzeImageOptimization(pageData);
    if (!imageOptimization.optimized) {
      issues.push('图片未针对移动端优化');
      score -= 10;
    }

    // 检查移动端特有功能
    const mobileFeatures = this.analyzeMobileFeatures(pageData);
    if (mobileFeatures.missing > 0) {
      issues.push(`缺少${mobileFeatures.missing}个移动端增强功能`);
      score -= mobileFeatures.missing * 5;
    }

    return {
      score: Math.max(0, score),
      issues,
      details: {
        touchFriendly: touchElements.adequate,
        responsive: !!viewport,
        loadTime,
        imageOptimized: imageOptimization.optimized,
        mobileFeatures: mobileFeatures.available
      }
    };
  }

  /**
   * 分析桌面端兼容性
   */
  analyzeDesktopCompatibility(pageData) {
    const issues = [];
    let score = 100;

    // 检查键盘导航
    const keyboardNav = this.analyzeKeyboardNavigation(pageData);
    if (!keyboardNav.adequate) {
      issues.push('键盘导航支持不足');
      score -= 20;
    }

    // 检查鼠标交互
    const mouseInteraction = this.analyzeMouseInteraction(pageData);
    if (!mouseInteraction.optimized) {
      issues.push('鼠标交互体验可以优化');
      score -= 15;
    }

    // 检查大屏幕布局
    const layoutOptimization = this.analyzeDesktopLayout(pageData);
    if (!layoutOptimization.optimized) {
      issues.push('大屏幕布局未充分优化');
      score -= 15;
    }

    // 检查性能优化
    const performanceOptimization = this.analyzeDesktopPerformance(pageData);
    if (!performanceOptimization.optimized) {
      issues.push('桌面端性能可进一步优化');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      details: {
        keyboardAccessible: keyboardNav.adequate,
        mouseOptimized: mouseInteraction.optimized,
        layoutOptimized: layoutOptimization.optimized,
        performanceOptimized: performanceOptimization.optimized
      }
    };
  }

  /**
   * 分析平板端兼容性
   */
  analyzeTabletCompatibility(pageData) {
    const issues = [];
    let score = 100;

    // 检查中等屏幕适配
    const mediumScreenLayout = this.analyzeMediumScreenLayout(pageData);
    if (!mediumScreenLayout.optimized) {
      issues.push('中等屏幕尺寸适配不够优化');
      score -= 20;
    }

    // 检查触摸和鼠标双重支持
    const hybridInteraction = this.analyzeHybridInteraction(pageData);
    if (!hybridInteraction.supported) {
      issues.push('触摸和鼠标交互混合支持不足');
      score -= 15;
    }

    // 检查横竖屏适配
    const orientationSupport = this.analyzeOrientationSupport(pageData);
    if (!orientationSupport.adequate) {
      issues.push('横竖屏切换适配需要改进');
      score -= 15;
    }

    return {
      score: Math.max(0, score),
      issues,
      details: {
        mediumScreenOptimized: mediumScreenLayout.optimized,
        hybridInteractionSupported: hybridInteraction.supported,
        orientationAdaptive: orientationSupport.adequate
      }
    };
  }

  /**
   * 分析跨设备体验
   */
  analyzeCrossDeviceExperience(pageData) {
    const issues = [];
    let score = 100;

    // 检查一致性
    const designConsistency = this.analyzeDesignConsistency(pageData);
    if (!designConsistency.consistent) {
      issues.push('跨设备设计一致性需要改进');
      score -= 20;
    }

    // 检查功能可用性
    const featureAvailability = this.analyzeFeatureAvailability(pageData);
    if (!featureAvailability.consistent) {
      issues.push('不同设备上功能可用性不一致');
      score -= 15;
    }

    // 检查数据同步
    const dataSync = this.analyzeDataSync(pageData);
    if (!dataSync.supported) {
      issues.push('缺少跨设备数据同步机制');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      details: {
        designConsistent: designConsistency.consistent,
        featuresConsistent: featureAvailability.consistent,
        dataSyncSupported: dataSync.supported
      }
    };
  }

  /**
   * 分析地区特定设备兼容性
   */
  analyzeRegionalCompatibility(pageData, region) {
    const regionData = this.marketData.regions[region];
    if (!regionData) {
      return { error: `不支持的地区: ${region}` };
    }

    const analysis = {
      marketShare: regionData,
      deviceOptimization: this.analyzeRegionalDeviceOptimization(pageData, region),
      networkOptimization: this.analyzeNetworkOptimization(pageData, region),
      culturalAdaptation: this.analyzeDeviceCulturalAdaptation(pageData, region),
      recommendations: []
    };

    // 计算地区适配评分
    const scores = [
      analysis.deviceOptimization.score,
      analysis.networkOptimization.score,
      analysis.culturalAdaptation.score
    ];
    
    analysis.overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    return analysis;
  }

  /**
   * 分析地区设备优化
   */
  analyzeRegionalDeviceOptimization(pageData, region) {
    const regionData = this.marketData.regions[region];
    const issues = [];
    let score = 100;

    // 检查主流设备适配
    const mobileShare = regionData.mobile.share;
    if (mobileShare > 60) {
      const mobileOptimization = this.analyzeMobileCompatibility(pageData);
      if (mobileOptimization.score < 80) {
        issues.push(`该地区移动端使用率${mobileShare}%，但移动端优化不足`);
        score -= 20;
      }
    }

    // 检查屏幕分辨率适配
    const resolutionOptimization = this.analyzeResolutionOptimization(pageData, regionData.screenResolutions);
    if (!resolutionOptimization.adequate) {
      issues.push('主流屏幕分辨率适配不够完善');
      score -= 15;
    }

    // 检查操作系统特性支持
    const osOptimization = this.analyzeOSOptimization(pageData, regionData);
    if (!osOptimization.adequate) {
      issues.push(`${regionData.mobile.preferredOS}特性支持不足`);
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      details: {
        mobileOptimized: mobileShare <= 60 || this.analyzeMobileCompatibility(pageData).score >= 80,
        resolutionOptimized: resolutionOptimization.adequate,
        osOptimized: osOptimization.adequate
      }
    };
  }

  /**
   * 分析网络优化
   */
  analyzeNetworkOptimization(pageData, region) {
    const regionData = this.marketData.regions[region];
    const issues = [];
    let score = 100;

    // 检查加载时间与地区容忍度
    const loadTime = pageData.performance?.loadTime || 0;
    const tolerance = regionData.averageLoadTolerance;
    
    if (loadTime > tolerance) {
      issues.push(`页面加载时间${loadTime}ms超过地区容忍度${tolerance}ms`);
      score -= Math.min(30, Math.floor((loadTime - tolerance) / 100));
    }

    // 检查网络条件适配
    const networkSpeeds = regionData.networkSpeeds;
    if (networkSpeeds['WiFi'] < 80 && !this.hasLowBandwidthOptimization(pageData)) {
      issues.push('该地区网络条件一般，但缺少低带宽优化');
      score -= 20;
    }

    // 检查数据节约功能
    if (regionData.specialFeatures?.includes('Data cost sensitivity')) {
      if (!this.hasDataSavingFeatures(pageData)) {
        issues.push('该地区用户关注数据成本，建议添加数据节约功能');
        score -= 15;
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      details: {
        loadTimeAppropriate: loadTime <= tolerance,
        networkOptimized: networkSpeeds['WiFi'] >= 80 || this.hasLowBandwidthOptimization(pageData),
        dataSavingEnabled: !regionData.specialFeatures?.includes('Data cost sensitivity') || this.hasDataSavingFeatures(pageData)
      }
    };
  }

  /**
   * 分析设备文化适配
   */
  analyzeDeviceCulturalAdaptation(pageData, region) {
    const preferences = this.regionalPreferences[region];
    if (!preferences) {
      return { score: 100, issues: [], details: {} };
    }

    const issues = [];
    let score = 100;

    // 检查设计偏好适配
    const designAdaptation = this.analyzeDesignPreferences(pageData, preferences.designPreferences);
    if (!designAdaptation.adequate) {
      issues.push(`设计风格不符合${region}地区偏好`);
      score -= 15;
    }

    // 检查特殊需求支持
    if (preferences.specialRequirements) {
      const specialSupport = this.analyzeSpecialRequirements(pageData, preferences.specialRequirements);
      if (!specialSupport.adequate) {
        issues.push(`缺少${region}地区特殊功能支持`);
        score -= 20;
      }
    }

    // 检查性能期望匹配
    const performanceExpectation = preferences.performanceExpectations;
    const actualPerformance = this.evaluateActualPerformance(pageData);
    if (!this.meetsPerformanceExpectation(actualPerformance, performanceExpectation)) {
      issues.push(`性能水平未达到${region}地区期望`);
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      details: {
        designAdapted: designAdaptation.adequate,
        specialRequirementsSupported: !preferences.specialRequirements || this.analyzeSpecialRequirements(pageData, preferences.specialRequirements).adequate,
        performanceExpectationMet: this.meetsPerformanceExpectation(actualPerformance, performanceExpectation)
      }
    };
  }

  /**
   * 生成设备优化建议
   */
  generateDeviceRecommendations(analysis, targetRegions) {
    const recommendations = [];

    // 全局设备兼容性建议
    if (analysis.overall.mobile.score < 70) {
      recommendations.push({
        category: 'mobile',
        priority: 'high',
        issue: '移动端兼容性不足',
        suggestion: '优化响应式设计，改进触摸交互，压缩图片资源',
        affectedRegions: targetRegions.filter(r => this.marketData.regions[r]?.mobile.share > 60)
      });
    }

    if (analysis.overall.desktop.score < 70) {
      recommendations.push({
        category: 'desktop',
        priority: 'medium',
        issue: '桌面端体验可优化',
        suggestion: '增强键盘导航，优化鼠标交互，改进大屏幕布局',
        affectedRegions: targetRegions.filter(r => this.marketData.regions[r]?.desktop.share > 35)
      });
    }

    // 地区特定建议
    targetRegions.forEach(region => {
      const regionAnalysis = analysis.regions[region];
      if (regionAnalysis && regionAnalysis.overallScore < 75) {
        recommendations.push({
          category: 'regional',
          priority: 'high',
          issue: `${region}地区设备适配性不足`,
          suggestion: `针对${region}地区主流设备和网络条件进行专项优化`,
          region: region,
          specificIssues: [
            ...regionAnalysis.deviceOptimization.issues,
            ...regionAnalysis.networkOptimization.issues,
            ...regionAnalysis.culturalAdaptation.issues
          ].slice(0, 3)
        });
      }
    });

    // 跨设备一致性建议
    if (analysis.overall.crossDevice.score < 80) {
      recommendations.push({
        category: 'crossDevice',
        priority: 'medium',
        issue: '跨设备体验一致性需要改进',
        suggestion: '统一设计系统，确保功能在各设备上的一致性，实现数据同步'
      });
    }

    return recommendations;
  }

  // 辅助分析方法（简化实现）
  analyzeTouchFriendliness(pageData) {
    // 简化检查：查找按钮和链接元素
    const html = pageData.html || '';
    const hasButtons = html.includes('button') || html.includes('btn');
    const hasLinks = html.includes('<a ');
    return { adequate: hasButtons && hasLinks };
  }

  analyzeImageOptimization(pageData) {
    const images = pageData.images || [];
    const webpImages = images.filter(img => img.src?.includes('.webp')).length;
    const totalImages = images.length;
    return { optimized: totalImages === 0 || webpImages / totalImages > 0.3 };
  }

  analyzeMobileFeatures(pageData) {
    const html = pageData.html || '';
    const features = ['geolocation', 'camera', 'touch', 'offline'];
    const available = features.filter(feature => html.includes(feature)).length;
    return { available, missing: features.length - available };
  }

  analyzeKeyboardNavigation(pageData) {
    const html = pageData.html || '';
    const hasTabindex = html.includes('tabindex');
    const hasFocusStyles = html.includes('focus') || html.includes(':focus');
    return { adequate: hasTabindex || hasFocusStyles };
  }

  analyzeMouseInteraction(pageData) {
    const html = pageData.html || '';
    const hasHover = html.includes('hover') || html.includes(':hover');
    return { optimized: hasHover };
  }

  analyzeDesktopLayout(pageData) {
    const html = pageData.html || '';
    const hasGrid = html.includes('grid') || html.includes('flex');
    return { optimized: hasGrid };
  }

  analyzeDesktopPerformance(pageData) {
    const loadTime = pageData.performance?.loadTime || 0;
    return { optimized: loadTime < 2000 };
  }

  analyzeMediumScreenLayout(pageData) {
    const html = pageData.html || '';
    const hasResponsive = html.includes('media') || html.includes('responsive');
    return { optimized: hasResponsive };
  }

  analyzeHybridInteraction(pageData) {
    const html = pageData.html || '';
    const hasTouch = html.includes('touch');
    const hasMouse = html.includes('mouse') || html.includes('click');
    return { supported: hasTouch && hasMouse };
  }

  analyzeOrientationSupport(pageData) {
    const html = pageData.html || '';
    const hasOrientation = html.includes('orientation') || html.includes('media');
    return { adequate: hasOrientation };
  }

  analyzeDesignConsistency(pageData) {
    return { consistent: true }; // 简化实现
  }

  analyzeFeatureAvailability(pageData) {
    return { consistent: true }; // 简化实现
  }

  analyzeDataSync(pageData) {
    const html = pageData.html || '';
    const hasSync = html.includes('sync') || html.includes('storage');
    return { supported: hasSync };
  }

  analyzeResolutionOptimization(pageData, resolutions) {
    return { adequate: true }; // 简化实现
  }

  analyzeOSOptimization(pageData, regionData) {
    return { adequate: true }; // 简化实现
  }

  hasLowBandwidthOptimization(pageData) {
    const html = pageData.html || '';
    return html.includes('lazy') || html.includes('compress');
  }

  hasDataSavingFeatures(pageData) {
    const html = pageData.html || '';
    return html.includes('data-saver') || html.includes('compress');
  }

  analyzeDesignPreferences(pageData, preferences) {
    return { adequate: true }; // 简化实现
  }

  analyzeSpecialRequirements(pageData, requirements) {
    const html = pageData.html || '';
    const supported = requirements.filter(req => 
      html.toLowerCase().includes(req.toLowerCase())
    ).length;
    return { adequate: supported / requirements.length > 0.5 };
  }

  evaluateActualPerformance(pageData) {
    const loadTime = pageData.performance?.loadTime || 0;
    if (loadTime < 1500) return 'very high';
    if (loadTime < 2500) return 'high';
    if (loadTime < 4000) return 'medium';
    return 'low';
  }

  meetsPerformanceExpectation(actual, expected) {
    const performanceMap = { 'very high': 4, 'high': 3, 'medium': 2, 'low': 1 };
    return performanceMap[actual] >= performanceMap[expected];
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeviceMarketDataAnalyzer;
} else {
  window.DeviceMarketDataAnalyzer = DeviceMarketDataAnalyzer;
}