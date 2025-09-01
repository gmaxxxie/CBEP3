/**
 * Enhanced Detailed Analysis Engine
 * 详细分析引擎 - 提供具体的改进建议和详细分析结果
 */

class DetailedAnalysisEngine {
  constructor() {
    this.languageAnalyzer = new DetailedLanguageAnalyzer();
    this.culturalAnalyzer = new DetailedCulturalAnalyzer();
    this.complianceAnalyzer = new DetailedComplianceAnalyzer();
    this.uxAnalyzer = new DetailedUXAnalyzer();
  }

  /**
   * 执行详细分析
   */
  async performDetailedAnalysis(extractedData, targetRegions = ['US']) {
    const analysis = {
      timestamp: new Date().toISOString(),
      url: extractedData.url,
      targetRegions,
      detailed: {}
    };

    for (const region of targetRegions) {
      console.log(`开始详细分析地区: ${region}`);
      
      analysis.detailed[region] = {
        language: await this.languageAnalyzer.analyzeInDetail(extractedData, region),
        culture: await this.culturalAnalyzer.analyzeInDetail(extractedData, region),
        compliance: await this.complianceAnalyzer.analyzeInDetail(extractedData, region),
        userExperience: await this.uxAnalyzer.analyzeInDetail(extractedData, region)
      };
    }

    return analysis;
  }
}

/**
 * 详细语言分析器
 */
class DetailedLanguageAnalyzer {
  constructor() {
    this.languagePatterns = this.initializeLanguagePatterns();
    this.terminologyMaps = this.initializeTerminologyMaps();
    this.commonPhrases = this.initializeCommonPhrases();
  }

  initializeLanguagePatterns() {
    return {
      'en': {
        patterns: /^[a-zA-Z\s.,!?\-'"():;]+$/,
        commonWords: ['the', 'and', 'for', 'with', 'you', 'your', 'our', 'we', 'this', 'that'],
        formalityIndicators: ['please', 'thank you', 'would', 'could', 'may', 'might'],
        businessTerms: ['customer', 'service', 'quality', 'premium', 'professional']
      },
      'zh-CN': {
        patterns: /[\u4e00-\u9fff]/,
        commonWords: ['的', '和', '在', '有', '是', '我', '您', '我们', '这', '那'],
        formalityIndicators: ['请', '谢谢', '感谢', '敬请', '恭候', '诚邀'],
        businessTerms: ['客户', '服务', '品质', '高端', '专业']
      },
      'ja': {
        patterns: /[\u3040-\u309f\u30a0-\u30ff]/,
        commonWords: ['の', 'に', 'は', 'を', 'が', 'で', 'と', 'から', 'まで', 'へ'],
        formalityIndicators: ['です', 'ます', 'ございます', 'いたします', 'させていただき'],
        businessTerms: ['お客様', 'サービス', '品質', 'プレミアム', 'プロフェッショナル']
      }
    };
  }

  initializeTerminologyMaps() {
    return {
      ecommerce: {
        'US': {
          'cart': 'Shopping Cart',
          'checkout': 'Checkout',
          'shipping': 'Shipping',
          'delivery': 'Delivery', 
          'returns': 'Returns',
          'customer_service': 'Customer Service',
          'warranty': 'Warranty',
          'size_guide': 'Size Guide'
        },
        'CN': {
          'cart': '购物车',
          'checkout': '结账/去付款',
          'shipping': '配送/物流',
          'delivery': '送货/交货',
          'returns': '退货/退换',
          'customer_service': '客服/在线客服',
          'warranty': '保修/售后',
          'size_guide': '尺码表/尺寸指南'
        },
        'JP': {
          'cart': 'ショッピングカート/カート',
          'checkout': 'レジに進む/決済',
          'shipping': '配送',
          'delivery': 'お届け',
          'returns': '返品/交換',
          'customer_service': 'カスタマーサービス/お客様サポート',
          'warranty': '保証/アフターサービス',
          'size_guide': 'サイズガイド'
        },
        'DE': {
          'cart': 'Warenkorb',
          'checkout': 'Zur Kasse',
          'shipping': 'Versand',
          'delivery': 'Lieferung',
          'returns': 'Rücksendung',
          'customer_service': 'Kundenservice',
          'warranty': 'Garantie',
          'size_guide': 'Größentabelle'
        },
        'FR': {
          'cart': 'Panier',
          'checkout': 'Commander',
          'shipping': 'Expédition',
          'delivery': 'Livraison',
          'returns': 'Retours',
          'customer_service': 'Service Client',
          'warranty': 'Garantie',
          'size_guide': 'Guide des Tailles'
        }
      },
      ui: {
        'US': {
          'add_to_cart': 'Add to Cart',
          'buy_now': 'Buy Now',
          'view_details': 'View Details',
          'quick_view': 'Quick View',
          'compare': 'Compare',
          'wishlist': 'Add to Wishlist',
          'notify_me': 'Notify Me',
          'out_of_stock': 'Out of Stock'
        },
        'CN': {
          'add_to_cart': '加入购物车',
          'buy_now': '立即购买',
          'view_details': '查看详情',
          'quick_view': '快速查看',
          'compare': '对比',
          'wishlist': '收藏/添加到心愿单',
          'notify_me': '到货通知',
          'out_of_stock': '缺货/售罄'
        },
        'JP': {
          'add_to_cart': 'カートに追加',
          'buy_now': '今すぐ購入',
          'view_details': '詳細を見る',
          'quick_view': 'クイックビュー',
          'compare': '比較する',
          'wishlist': 'ウィッシュリストに追加',
          'notify_me': '入荷通知',
          'out_of_stock': '在庫切れ'
        }
      }
    };
  }

  initializeCommonPhrases() {
    return {
      'US': {
        greeting: ['Welcome', 'Hello', 'Hi there'],
        courtesy: ['Please', 'Thank you', 'You\'re welcome'],
        urgency: ['Limited time', 'Hurry', 'Last chance', 'Sale ends soon'],
        quality: ['Premium quality', 'High-end', 'Professional grade', 'Top-rated']
      },
      'CN': {
        greeting: ['欢迎', '您好', '欢迎光临'],
        courtesy: ['请', '谢谢', '不客气', '感谢您'],
        urgency: ['限时', '抢购', '最后机会', '即将结束'],
        quality: ['优质', '高端', '专业级', '精品']
      },
      'JP': {
        greeting: ['いらっしゃいませ', 'こんにちは', 'ようこそ'],
        courtesy: ['お願いします', 'ありがとうございます', 'どういたしまして'],
        urgency: ['期間限定', 'お急ぎください', 'ラストチャンス', 'セール終了間近'],
        quality: ['高品質', 'ハイエンド', 'プロ仕様', '高評価']
      }
    };
  }

  async analyzeInDetail(data, targetRegion) {
    const analysis = {
      score: 0,
      summary: '',
      issues: [],
      specificProblems: [],
      detailedRecommendations: [],
      examples: []
    };

    try {
      // 1. 内容语言检测与分析
      const languageConsistency = await this.analyzeLanguageConsistency(data, targetRegion);
      analysis.specificProblems.push(...languageConsistency.problems);

      // 2. 术语本地化分析
      const terminologyAnalysis = await this.analyzeTerminology(data, targetRegion);
      analysis.specificProblems.push(...terminologyAnalysis.problems);

      // 3. 语言风格和语调分析
      const styleAnalysis = await this.analyzeLanguageStyle(data, targetRegion);
      analysis.specificProblems.push(...styleAnalysis.problems);

      // 4. UI文本分析
      const uiTextAnalysis = await this.analyzeUIText(data, targetRegion);
      analysis.specificProblems.push(...uiTextAnalysis.problems);

      // 计算综合评分
      analysis.score = this.calculateLanguageScore(analysis.specificProblems);
      
      // 生成详细建议
      analysis.detailedRecommendations = this.generateDetailedLanguageRecommendations(
        analysis.specificProblems, targetRegion, data
      );

      // 生成总结
      analysis.summary = this.generateLanguageSummary(analysis.score, analysis.specificProblems.length);

      return analysis;
    } catch (error) {
      console.error('详细语言分析失败:', error);
      return { 
        score: 50, 
        summary: '分析过程中出现错误',
        issues: ['分析系统错误'],
        specificProblems: [],
        detailedRecommendations: ['请检查页面内容并重新分析']
      };
    }
  }

  async analyzeLanguageConsistency(data, targetRegion) {
    const problems = [];
    const targetLang = this.getTargetLanguage(targetRegion);
    const expectedPattern = this.languagePatterns[targetLang];

    if (!expectedPattern) {
      return { problems: [] };
    }

    // 分析页面标题
    if (data.title) {
      const titleConsistency = this.checkTextConsistency(data.title, expectedPattern, targetLang);
      if (!titleConsistency.consistent) {
        problems.push({
          type: 'language_inconsistency',
          element: 'title',
          current: data.title,
          issue: `页面标题语言不符合${targetRegion}地区标准`,
          severity: 'high',
          suggestion: `建议将标题改为符合${targetLang}语言习惯的表达`,
          examples: this.generateTitleExamples(data.title, targetLang)
        });
      }
    }

    // 分析主要内容段落
    if (data.text?.paragraphs) {
      data.text.paragraphs.slice(0, 5).forEach((paragraph, index) => {
        if (paragraph.length > 20) { // 只分析较长的段落
          const consistency = this.checkTextConsistency(paragraph, expectedPattern, targetLang);
          if (!consistency.consistent) {
            problems.push({
              type: 'language_inconsistency',
              element: `paragraph_${index}`,
              current: paragraph.substring(0, 100) + '...',
              issue: `第${index + 1}段内容语言混用或不符合目标地区习惯`,
              severity: 'medium',
              suggestion: `建议将此段落完全翻译为${targetLang}语言，并确保语法正确`,
              examples: this.generateParagraphExamples(paragraph, targetLang)
            });
          }
        }
      });
    }

    return { problems };
  }

  async analyzeTerminology(data, targetRegion) {
    const problems = [];
    const expectedTerms = this.terminologyMaps.ecommerce[targetRegion];
    const uiTerms = this.terminologyMaps.ui[targetRegion];

    if (!expectedTerms || !uiTerms) {
      return { problems: [] };
    }

    const pageText = JSON.stringify(data).toLowerCase();

    // 检查电商术语本地化
    Object.keys(expectedTerms).forEach(termKey => {
      const expectedTerm = expectedTerms[termKey].toLowerCase();
      const englishTerm = this.terminologyMaps.ecommerce['US'][termKey].toLowerCase();
      
      // 如果目标不是英语地区，检查是否使用了英文术语
      if (targetRegion !== 'US' && pageText.includes(englishTerm) && !pageText.includes(expectedTerm)) {
        problems.push({
          type: 'terminology_not_localized',
          element: termKey,
          current: this.terminologyMaps.ecommerce['US'][termKey],
          issue: `使用英文术语"${this.terminologyMaps.ecommerce['US'][termKey]}"，未进行本地化`,
          severity: 'high',
          suggestion: `建议将"${this.terminologyMaps.ecommerce['US'][termKey]}"改为"${expectedTerms[termKey]}"`,
          targetText: expectedTerms[termKey],
          category: 'ecommerce_terminology'
        });
      }
    });

    // 检查UI按钮和交互元素术语
    if (data.text?.buttons) {
      data.text.buttons.forEach((buttonText, index) => {
        const buttonAnalysis = this.analyzeButtonText(buttonText, targetRegion);
        if (buttonAnalysis.needsLocalization) {
          problems.push({
            type: 'ui_terminology_issue',
            element: `button_${index}`,
            current: buttonText,
            issue: buttonAnalysis.issue,
            severity: 'medium',
            suggestion: buttonAnalysis.suggestion,
            targetText: buttonAnalysis.suggested,
            category: 'ui_elements'
          });
        }
      });
    }

    return { problems };
  }

  async analyzeLanguageStyle(data, targetRegion) {
    const problems = [];
    const expectedStyle = this.getExpectedLanguageStyle(targetRegion);

    // 分析正式程度
    const formalityAnalysis = this.analyzeFormalityLevel(data, targetRegion);
    if (formalityAnalysis.issues.length > 0) {
      problems.push(...formalityAnalysis.issues);
    }

    // 分析语调一致性
    const toneAnalysis = this.analyzeToneConsistency(data, targetRegion);
    if (toneAnalysis.issues.length > 0) {
      problems.push(...toneAnalysis.issues);
    }

    // 分析文化敏感性
    const culturalLanguageAnalysis = this.analyzeCulturalLanguageUsage(data, targetRegion);
    if (culturalLanguageAnalysis.issues.length > 0) {
      problems.push(...culturalLanguageAnalysis.issues);
    }

    return { problems };
  }

  async analyzeUIText(data, targetRegion) {
    const problems = [];

    // 分析导航文本
    if (data.text?.navigation) {
      data.text.navigation.forEach((navItem, index) => {
        const navAnalysis = this.analyzeNavigationText(navItem, targetRegion);
        if (navAnalysis.hasIssues) {
          problems.push({
            type: 'navigation_text_issue',
            element: `nav_${index}`,
            current: navItem,
            issue: navAnalysis.issue,
            severity: 'medium',
            suggestion: navAnalysis.suggestion,
            category: 'navigation'
          });
        }
      });
    }

    // 分析表单标签
    if (data.text?.forms) {
      Object.keys(data.text.forms).forEach(formKey => {
        const formData = data.text.forms[formKey];
        if (formData.labels) {
          formData.labels.forEach((label, index) => {
            const labelAnalysis = this.analyzeFormLabel(label, targetRegion);
            if (labelAnalysis.hasIssues) {
              problems.push({
                type: 'form_label_issue',
                element: `form_${formKey}_label_${index}`,
                current: label,
                issue: labelAnalysis.issue,
                severity: 'low',
                suggestion: labelAnalysis.suggestion,
                category: 'forms'
              });
            }
          });
        }
      });
    }

    return { problems };
  }

  generateDetailedLanguageRecommendations(problems, targetRegion, data) {
    const recommendations = [];
    const targetLang = this.getTargetLanguage(targetRegion);
    
    // 按问题类型分组并生成建议
    const problemsByType = this.groupProblemsByType(problems);

    Object.keys(problemsByType).forEach(type => {
      const typeProblems = problemsByType[type];
      
      switch (type) {
        case 'language_inconsistency':
          recommendations.push({
            category: '语言一致性',
            priority: 'high',
            title: '统一页面语言',
            description: `发现${typeProblems.length}处语言不一致问题，需要统一为${targetLang}语言`,
            actions: [
              `检查并翻译所有英文内容为${this.getLanguageName(targetLang)}`,
              '确保专业术语翻译准确',
              '保持语言风格一致性',
              '验证语法和拼写正确性'
            ],
            examples: typeProblems.slice(0, 3).map(p => ({
              current: p.current,
              suggested: p.examples?.[0] || '需要专业翻译',
              element: p.element
            }))
          });
          break;

        case 'terminology_not_localized':
          recommendations.push({
            category: '术语本地化',
            priority: 'high',
            title: '电商术语本地化',
            description: `${typeProblems.length}个关键术语需要本地化处理`,
            actions: [
              '将所有英文电商术语替换为当地惯用表达',
              '确保CTA按钮文字符合当地用户习惯',
              '统一购物流程相关术语',
              '考虑SEO关键词本地化'
            ],
            examples: typeProblems.slice(0, 5).map(p => ({
              current: p.current,
              suggested: p.targetText,
              element: p.element,
              category: p.category
            }))
          });
          break;

        case 'ui_terminology_issue':
          recommendations.push({
            category: 'UI界面文本',
            priority: 'medium',
            title: '界面交互元素本地化',
            description: `${typeProblems.length}个UI元素文本需要优化`,
            actions: [
              '优化按钮文字，提高点击转化率',
              '调整表单标签，符合当地用户填写习惯',
              '改进错误提示信息的表达',
              '统一交互反馈用语'
            ],
            examples: typeProblems.slice(0, 3).map(p => ({
              current: p.current,
              suggested: p.targetText || '需要优化',
              element: p.element
            }))
          });
          break;
      }
    });

    // 添加总体建议
    if (problems.length > 5) {
      recommendations.push({
        category: '整体建议',
        priority: 'high',
        title: '全面语言本地化',
        description: '页面存在较多语言适配问题，建议进行全面的本地化改进',
        actions: [
          '与专业翻译团队合作，确保翻译质量',
          '建立术语库，保持翻译一致性',
          '定期审查和更新本地化内容',
          '进行目标地区用户测试验证',
          '考虑聘请当地母语人士进行内容审核'
        ]
      });
    }

    return recommendations;
  }

  // 辅助方法
  getTargetLanguage(region) {
    const regionLanguages = {
      'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en',
      'CN': 'zh-CN', 'TW': 'zh-TW', 'HK': 'zh-HK',
      'JP': 'ja', 'KR': 'ko',
      'DE': 'de', 'FR': 'fr', 'ES': 'es', 'IT': 'it',
      'AE': 'ar', 'SA': 'ar',
      'BR': 'pt', 'MX': 'es'
    };
    return regionLanguages[region] || 'en';
  }

  getLanguageName(langCode) {
    const names = {
      'en': '英语',
      'zh-CN': '简体中文',
      'zh-TW': '繁体中文',
      'ja': '日语',
      'ko': '韩语',
      'de': '德语',
      'fr': '法语',
      'es': '西班牙语',
      'ar': '阿拉伯语',
      'pt': '葡萄牙语'
    };
    return names[langCode] || langCode;
  }

  checkTextConsistency(text, expectedPattern, targetLang) {
    if (!text || !expectedPattern) return { consistent: true };

    // 简单的一致性检查
    const matches = (text.match(expectedPattern.patterns) || []).join('').length;
    const ratio = matches / text.length;
    
    // 不同语言的阈值不同
    const threshold = targetLang.includes('zh') || targetLang === 'ja' || targetLang === 'ko' ? 0.5 : 0.8;
    
    return {
      consistent: ratio >= threshold,
      ratio: ratio,
      confidence: Math.min(ratio / threshold, 1.0)
    };
  }

  generateTitleExamples(currentTitle, targetLang) {
    // 基于目标语言生成标题示例
    const examples = [];
    
    switch (targetLang) {
      case 'zh-CN':
        examples.push(
          currentTitle.replace(/Welcome to/, '欢迎来到').replace(/Shop/, '商城'),
          currentTitle.replace(/Store/, '商店').replace(/Online/, '在线')
        );
        break;
      case 'ja':
        examples.push(
          currentTitle.replace(/Welcome/, 'ようこそ').replace(/Shop/, 'ショップ')
        );
        break;
      default:
        examples.push('请咨询专业翻译');
    }
    
    return examples.filter(e => e !== currentTitle);
  }

  generateParagraphExamples(paragraph, targetLang) {
    // 生成段落改进示例
    const examples = [];
    
    if (targetLang === 'zh-CN') {
      examples.push('建议：使用简洁的中文表达，避免直译英文句式');
      examples.push('建议：采用中文用户熟悉的描述方式');
    } else if (targetLang === 'ja') {
      examples.push('建議：丁寧語を使用し、日本のお客様に適した表現にする');
    }
    
    return examples;
  }

  analyzeButtonText(buttonText, targetRegion) {
    const expectedTerms = this.terminologyMaps.ui[targetRegion];
    if (!expectedTerms) return { needsLocalization: false };

    const normalizedText = buttonText.toLowerCase().trim();
    
    // 检查是否需要本地化
    const englishTerms = this.terminologyMaps.ui['US'];
    const englishKeys = Object.keys(englishTerms);
    
    for (const key of englishKeys) {
      const englishTerm = englishTerms[key].toLowerCase();
      if (normalizedText.includes(englishTerm) || normalizedText === englishTerm) {
        return {
          needsLocalization: targetRegion !== 'US',
          issue: `按钮文字"${buttonText}"使用英文，需要本地化`,
          suggestion: `建议改为"${expectedTerms[key]}"`,
          suggested: expectedTerms[key]
        };
      }
    }
    
    return { needsLocalization: false };
  }

  analyzeFormalityLevel(data, targetRegion) {
    const issues = [];
    const expectedFormality = this.getExpectedFormality(targetRegion);
    
    // 分析页面整体正式程度
    const pageText = [
      data.title,
      ...(data.text?.paragraphs || []).slice(0, 3),
      ...(data.text?.buttons || [])
    ].join(' ');

    const formalityLevel = this.detectFormalityLevel(pageText, this.getTargetLanguage(targetRegion));
    
    if (Math.abs(formalityLevel - expectedFormality) > 0.3) {
      issues.push({
        type: 'formality_mismatch',
        element: 'overall_tone',
        current: `当前正式程度: ${formalityLevel.toFixed(1)}`,
        issue: `页面语言正式程度与${targetRegion}地区用户期望不符`,
        severity: 'medium',
        suggestion: expectedFormality > formalityLevel ? 
          '建议使用更正式的语言表达' : 
          '建议使用更亲切友好的表达方式'
      });
    }

    return { issues };
  }

  analyzeToneConsistency(data, targetRegion) {
    const issues = [];
    
    // 检查语调是否一致
    // 这里简化实现，实际可以使用更复杂的NLP分析
    
    return { issues };
  }

  analyzeCulturalLanguageUsage(data, targetRegion) {
    const issues = [];
    
    // 检查文化敏感的语言使用
    const culturallyProblematicTerms = this.getCulturallyProblematicTerms(targetRegion);
    const pageText = JSON.stringify(data).toLowerCase();
    
    culturallyProblematicTerms.forEach(term => {
      if (pageText.includes(term.term.toLowerCase())) {
        issues.push({
          type: 'cultural_language_issue',
          element: 'content',
          current: term.term,
          issue: term.issue,
          severity: 'high',
          suggestion: term.suggestion,
          culturalNote: term.culturalNote
        });
      }
    });
    
    return { issues };
  }

  analyzeNavigationText(navText, targetRegion) {
    // 分析导航文本是否合适
    return { hasIssues: false };
  }

  analyzeFormLabel(label, targetRegion) {
    // 分析表单标签文本
    return { hasIssues: false };
  }

  calculateLanguageScore(problems) {
    let score = 100;
    
    problems.forEach(problem => {
      switch (problem.severity) {
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  generateLanguageSummary(score, problemCount) {
    if (score >= 90) {
      return '语言适配优秀，仅有少量细节需要优化';
    } else if (score >= 75) {
      return '语言适配良好，有几处需要改进的地方';
    } else if (score >= 60) {
      return `发现${problemCount}个语言适配问题，建议优先处理`;
    } else {
      return `语言适配存在较多问题(${problemCount}个)，需要全面优化`;
    }
  }

  groupProblemsByType(problems) {
    const grouped = {};
    problems.forEach(problem => {
      if (!grouped[problem.type]) {
        grouped[problem.type] = [];
      }
      grouped[problem.type].push(problem);
    });
    return grouped;
  }

  getExpectedFormality(targetRegion) {
    const formalityLevels = {
      'US': 0.6, 'GB': 0.7, 'CA': 0.6,
      'CN': 0.8, 'JP': 0.9, 'KR': 0.8,
      'DE': 0.7, 'FR': 0.7, 'ES': 0.6,
      'AE': 0.8, 'SA': 0.8
    };
    return formalityLevels[targetRegion] || 0.6;
  }

  detectFormalityLevel(text, language) {
    // 简化的正式程度检测
    const formalIndicators = this.languagePatterns[language]?.formalityIndicators || [];
    const formalCount = formalIndicators.filter(indicator => 
      text.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    return Math.min(formalCount * 0.1 + 0.5, 1.0);
  }

  getCulturallyProblematicTerms(targetRegion) {
    const problematicTerms = {
      'CN': [
        {
          term: 'Made in Taiwan',
          issue: '政治敏感表述',
          suggestion: '使用"台湾地区制造"或避免此类表述',
          culturalNote: '涉及政治敏感话题'
        }
      ],
      'AE': [
        {
          term: 'pork',
          issue: '宗教敏感产品',
          suggestion: '避免展示猪肉相关产品',
          culturalNote: '伊斯兰文化不接受猪肉制品'
        },
        {
          term: 'alcohol',
          issue: '宗教敏感产品',
          suggestion: '谨慎处理酒类产品展示',
          culturalNote: '伊斯兰文化对酒类有限制'
        }
      ]
    };
    
    return problematicTerms[targetRegion] || [];
  }

  getExpectedLanguageStyle(targetRegion) {
    return {
      formality: this.getExpectedFormality(targetRegion),
      tone: 'professional_friendly',
      culturalNotes: this.getCulturalLanguageNotes(targetRegion)
    };
  }

  getCulturalLanguageNotes(targetRegion) {
    const notes = {
      'JP': ['使用敬语', '避免直接的销售语言', '重视细节和精确性'],
      'CN': ['避免政治敏感话题', '注重实用性描述', '重视品质和价值'],
      'DE': ['直接且精确的表达', '重视技术规格', '环保和质量意识'],
      'AE': ['尊重伊斯兰文化', '避免宗教敏感内容', '重视家庭价值观']
    };
    
    return notes[targetRegion] || [];
  }
}

/**
 * 详细文化分析器
 */
class DetailedCulturalAnalyzer {
  constructor() {
    this.culturalFactors = this.initializeCulturalFactors();
    this.colorMeanings = this.initializeColorMeanings();
    this.culturalSymbols = this.initializeCulturalSymbols();
    this.holidayCalendar = this.initializeHolidayCalendar();
  }

  initializeCulturalFactors() {
    return {
      'US': {
        values: ['individualism', 'efficiency', 'innovation', 'diversity'],
        communicationStyle: 'direct',
        colorPreferences: ['blue', 'red', 'white'],
        avoidColors: [],
        imagery: ['success', 'freedom', 'technology'],
        avoidImagery: ['excessive luxury']
      },
      'CN': {
        values: ['harmony', 'respect', 'family', 'prosperity'],
        communicationStyle: 'indirect',
        colorPreferences: ['red', 'gold', 'yellow'],
        avoidColors: ['white', 'black'],
        imagery: ['dragons', 'prosperity', 'tradition'],
        avoidImagery: ['political symbols', 'inappropriate traditional elements']
      },
      'JP': {
        values: ['precision', 'respect', 'harmony', 'craftsmanship'],
        communicationStyle: 'very_indirect',
        colorPreferences: ['white', 'red', 'blue'],
        avoidColors: ['green'],
        imagery: ['cherry_blossoms', 'minimalism', 'nature'],
        avoidImagery: ['loud designs', 'excessive decoration']
      },
      'AE': {
        values: ['respect', 'family', 'tradition', 'hospitality'],
        communicationStyle: 'formal',
        colorPreferences: ['gold', 'green', 'blue'],
        avoidColors: ['pink'],
        imagery: ['geometric_patterns', 'nature', 'family'],
        avoidImagery: ['human_figures', 'alcohol', 'pork']
      }
    };
  }

  initializeColorMeanings() {
    return {
      'CN': {
        'red': { meaning: '好运、繁荣、喜庆', appropriate: true, usage: 'CTA按钮、重要信息' },
        'gold': { meaning: '财富、成功', appropriate: true, usage: '高端产品、会员等级' },
        'white': { meaning: '死亡、悲伤', appropriate: false, usage: '避免用作主色调' },
        'green': { meaning: '健康、自然', appropriate: true, usage: '健康产品、环保' },
        'black': { meaning: '死亡、不吉利', appropriate: false, usage: '避免过多使用' }
      },
      'JP': {
        'white': { meaning: '纯洁、简洁', appropriate: true, usage: '背景、产品展示' },
        'red': { meaning: '活力、重要', appropriate: true, usage: 'CTA按钮、促销' },
        'green': { meaning: '不成熟、病态', appropriate: false, usage: '避免用于重要元素' },
        'blue': { meaning: '信任、稳定', appropriate: true, usage: '企业色彩、信任标识' }
      },
      'AE': {
        'green': { meaning: '伊斯兰、自然', appropriate: true, usage: '宗教节日、环保产品' },
        'gold': { meaning: '财富、奢华', appropriate: true, usage: '奢侈品、VIP服务' },
        'blue': { meaning: '保护、平静', appropriate: true, usage: '安全、信任' },
        'pink': { meaning: '女性化', appropriate: false, usage: '在保守地区避免使用' }
      }
    };
  }

  initializeCulturalSymbols() {
    return {
      'CN': {
        positive: [
          { symbol: 'dragon', meaning: '力量、好运', usage: '装饰图案、吉祥物' },
          { symbol: 'phoenix', meaning: '重生、美好', usage: '女性产品、品牌形象' },
          { symbol: 'bamboo', meaning: '成长、坚韧', usage: '环保产品、企业文化' },
          { symbol: 'lotus', meaning: '纯洁、优雅', usage: '美容产品、高端品牌' }
        ],
        negative: [
          { symbol: 'clock', meaning: '死亡暗示', reason: '送钟谐音送终' },
          { symbol: 'knife', meaning: '切断关系', reason: '刀具有分离寓意' },
          { symbol: 'mirror', meaning: '破碎、分离', reason: '易碎品寓意不好' }
        ]
      },
      'JP': {
        positive: [
          { symbol: 'cherry_blossom', meaning: '美丽、短暂', usage: '春季营销、美容产品' },
          { symbol: 'crane', meaning: '长寿、和平', usage: '健康产品、祝福' },
          { symbol: 'mount_fuji', meaning: '永恒、力量', usage: '品牌象征、旅游' }
        ],
        negative: [
          { symbol: 'number_four', meaning: '死亡', reason: '四与死同音' },
          { symbol: 'white_flowers', meaning: '葬礼', reason: '丧事用花' }
        ]
      },
      'AE': {
        positive: [
          { symbol: 'crescent_moon', meaning: '伊斯兰信仰', usage: '宗教节日、清真认证' },
          { symbol: 'palm_tree', meaning: '生命、繁荣', usage: '自然产品、度假' },
          { symbol: 'geometric_patterns', meaning: '艺术、精神', usage: '装饰设计' }
        ],
        negative: [
          { symbol: 'pig', meaning: '不洁', reason: '伊斯兰教禁忌' },
          { symbol: 'dog', meaning: '不洁动物', reason: '传统观念中不洁' },
          { symbol: 'human_figures', meaning: '偶像崇拜', reason: '某些解释认为违反宗教' }
        ]
      }
    };
  }

  initializeHolidayCalendar() {
    return {
      'CN': [
        { name: '春节', date: '农历正月初一', importance: 'highest', marketing: '新年促销、红色主题、团圆概念' },
        { name: '中秋节', date: '农历八月十五', importance: 'high', marketing: '团圆、月饼、家庭概念' },
        { name: '国庆节', date: '10月1日', importance: 'high', marketing: '爱国主题、红色、旅游' },
        { name: '双11购物节', date: '11月11日', importance: 'commercial', marketing: '大促销、限时优惠' }
      ],
      'US': [
        { name: 'Christmas', date: '12月25日', importance: 'highest', marketing: '红绿配色、礼品、家庭' },
        { name: 'Thanksgiving', date: '11月第4个周四', importance: 'high', marketing: '感恩、家庭聚餐、感谢' },
        { name: 'Black Friday', date: '感恩节后', importance: 'commercial', marketing: '大折扣、购物狂欢' },
        { name: 'Memorial Day', date: '5月最后周一', importance: 'high', marketing: '爱国主题、夏季开始' }
      ],
      'AE': [
        { name: 'Ramadan', date: '伊斯兰历9月', importance: 'highest', marketing: '斋月主题、慈善、精神' },
        { name: 'Eid al-Fitr', date: '伊斯兰历10月1日', importance: 'highest', marketing: '开斋节、礼品、家庭团聚' },
        { name: 'UAE National Day', date: '12月2日', importance: 'high', marketing: '爱国主题、传统文化' }
      ]
    };
  }

  async analyzeInDetail(data, targetRegion) {
    const analysis = {
      score: 0,
      summary: '',
      specificProblems: [],
      detailedRecommendations: [],
      culturalInsights: []
    };

    try {
      // 1. 颜色使用分析
      const colorAnalysis = await this.analyzeColorUsage(data, targetRegion);
      analysis.specificProblems.push(...colorAnalysis.problems);

      // 2. 图像和视觉元素分析
      const visualAnalysis = await this.analyzeVisualElements(data, targetRegion);
      analysis.specificProblems.push(...visualAnalysis.problems);

      // 3. 节日和季节性内容分析
      const seasonalAnalysis = await this.analyzeSeasonalContent(data, targetRegion);
      analysis.specificProblems.push(...seasonalAnalysis.problems);

      // 4. 文化价值观对齐分析
      const valueAlignmentAnalysis = await this.analyzeValueAlignment(data, targetRegion);
      analysis.specificProblems.push(...valueAlignmentAnalysis.problems);

      // 5. 社交和家庭概念分析
      const socialAnalysis = await this.analyzeSocialConcepts(data, targetRegion);
      analysis.specificProblems.push(...socialAnalysis.problems);

      // 计算评分
      analysis.score = this.calculateCulturalScore(analysis.specificProblems);

      // 生成详细建议
      analysis.detailedRecommendations = this.generateDetailedCulturalRecommendations(
        analysis.specificProblems, targetRegion, data
      );

      // 生成文化洞察
      analysis.culturalInsights = this.generateCulturalInsights(targetRegion, analysis.specificProblems);

      // 生成总结
      analysis.summary = this.generateCulturalSummary(analysis.score, analysis.specificProblems.length, targetRegion);

      return analysis;
    } catch (error) {
      console.error('详细文化分析失败:', error);
      return {
        score: 50,
        summary: '文化分析过程中出现错误',
        specificProblems: [],
        detailedRecommendations: ['请检查页面内容并重新分析'],
        culturalInsights: []
      };
    }
  }

  async analyzeColorUsage(data, targetRegion) {
    const problems = [];
    const colorMeanings = this.colorMeanings[targetRegion];
    
    if (!colorMeanings) {
      return { problems: [] };
    }

    // 分析页面中提到的颜色
    const pageContent = JSON.stringify(data).toLowerCase();
    
    Object.keys(colorMeanings).forEach(color => {
      const colorData = colorMeanings[color];
      
      if (pageContent.includes(color) && !colorData.appropriate) {
        problems.push({
          type: 'inappropriate_color_usage',
          element: 'color_scheme',
          current: color,
          issue: `在${targetRegion}文化中，${color}颜色${colorData.meaning}，不适合使用`,
          severity: 'high',
          suggestion: `避免使用${color}颜色，${colorData.usage}`,
          culturalNote: colorData.meaning,
          category: 'color_psychology'
        });
      }
    });

    // 检查是否缺少文化上积极的颜色
    const positiveColors = Object.keys(colorMeanings).filter(color => colorMeanings[color].appropriate);
    const hasPositiveColor = positiveColors.some(color => pageContent.includes(color));
    
    if (!hasPositiveColor && positiveColors.length > 0) {
      problems.push({
        type: 'missing_positive_colors',
        element: 'color_scheme',
        current: '当前配色方案',
        issue: `建议在设计中融入${targetRegion}文化中寓意积极的颜色`,
        severity: 'medium',
        suggestion: `考虑使用${positiveColors.slice(0, 2).join('、')}等颜色来增强文化认同感`,
        recommendations: positiveColors.map(color => ({
          color,
          meaning: colorMeanings[color].meaning,
          usage: colorMeanings[color].usage
        })),
        category: 'color_enhancement'
      });
    }

    return { problems };
  }

  async analyzeVisualElements(data, targetRegion) {
    const problems = [];
    const culturalSymbols = this.culturalSymbols[targetRegion];
    
    if (!culturalSymbols || !data.images) {
      return { problems: [] };
    }

    // 检查图片描述和alt文本中的敏感符号
    data.images.forEach((img, index) => {
      const altText = (img.alt || '').toLowerCase();
      const srcText = (img.src || '').toLowerCase();
      const imgText = altText + ' ' + srcText;

      // 检查负面符号
      culturalSymbols.negative.forEach(negSymbol => {
        if (imgText.includes(negSymbol.symbol.replace('_', ' '))) {
          problems.push({
            type: 'inappropriate_cultural_symbol',
            element: `image_${index}`,
            current: img.alt || img.src,
            issue: `图片包含文化敏感元素"${negSymbol.symbol}"，在${targetRegion}文化中${negSymbol.meaning}`,
            severity: 'high',
            suggestion: `移除或替换包含"${negSymbol.symbol}"的图片`,
            culturalNote: negSymbol.reason,
            category: 'visual_symbols'
          });
        }
      });
    });

    // 检查是否可以增加积极的文化元素
    const positiveSymbolsUsed = culturalSymbols.positive.filter(symbol => {
      const symbolText = symbol.symbol.replace('_', ' ');
      return data.images.some(img => 
        (img.alt || '').toLowerCase().includes(symbolText) ||
        (img.src || '').toLowerCase().includes(symbolText)
      );
    });

    if (positiveSymbolsUsed.length === 0) {
      problems.push({
        type: 'missing_positive_cultural_elements',
        element: 'visual_design',
        current: '当前视觉设计',
        issue: `可以考虑在设计中融入${targetRegion}文化中的积极元素`,
        severity: 'low',
        suggestion: '适当使用文化上积极的视觉元素可以增强用户的文化认同感',
        recommendations: culturalSymbols.positive.slice(0, 3).map(symbol => ({
          symbol: symbol.symbol,
          meaning: symbol.meaning,
          usage: symbol.usage
        })),
        category: 'cultural_enhancement'
      });
    }

    return { problems };
  }

  async analyzeSeasonalContent(data, targetRegion) {
    const problems = [];
    const holidays = this.holidayCalendar[targetRegion];
    
    if (!holidays) {
      return { problems: [] };
    }

    const currentMonth = new Date().getMonth() + 1;
    const pageContent = JSON.stringify(data).toLowerCase();

    // 检查是否有不合适的节日内容
    const otherRegionHolidays = Object.keys(this.holidayCalendar)
      .filter(region => region !== targetRegion)
      .flatMap(region => this.holidayCalendar[region]);

    otherRegionHolidays.forEach(holiday => {
      const holidayName = holiday.name.toLowerCase();
      if (pageContent.includes(holidayName)) {
        problems.push({
          type: 'inappropriate_holiday_content',
          element: 'seasonal_marketing',
          current: holiday.name,
          issue: `页面包含不适合${targetRegion}地区的节日内容"${holiday.name}"`,
          severity: 'medium',
          suggestion: `移除或替换为${targetRegion}地区相关的节日内容`,
          category: 'seasonal_content'
        });
      }
    });

    // 检查当前是否有合适的季节性营销机会
    const currentSeasonHolidays = holidays.filter(holiday => {
      // 简化的月份匹配逻辑
      return holiday.date.includes(currentMonth.toString()) || 
             (currentMonth === 12 && holiday.name.includes('Christmas')) ||
             (currentMonth === 11 && holiday.name.includes('11'));
    });

    if (currentSeasonHolidays.length > 0) {
      const hasSeasonalContent = currentSeasonHolidays.some(holiday => 
        pageContent.includes(holiday.name.toLowerCase())
      );

      if (!hasSeasonalContent) {
        problems.push({
          type: 'missing_seasonal_opportunity',
          element: 'marketing_content',
          current: '当前营销内容',
          issue: `错过了当前时期${targetRegion}地区的季节性营销机会`,
          severity: 'low',
          suggestion: `考虑加入相关的节日营销元素`,
          opportunities: currentSeasonHolidays.map(holiday => ({
            name: holiday.name,
            importance: holiday.importance,
            marketing: holiday.marketing
          })),
          category: 'marketing_opportunity'
        });
      }
    }

    return { problems };
  }

  async analyzeValueAlignment(data, targetRegion) {
    const problems = [];
    const culturalValues = this.culturalFactors[targetRegion];
    
    if (!culturalValues) {
      return { problems: [] };
    }

    const pageContent = JSON.stringify(data).toLowerCase();
    
    // 检查是否体现了文化价值观
    const valueKeywords = {
      'individualism': ['personal', 'individual', 'unique', 'customize'],
      'harmony': ['balance', 'harmony', 'peaceful', 'together'],
      'respect': ['respect', 'honor', 'courtesy', 'polite'],
      'family': ['family', 'together', 'unite', 'bond'],
      'efficiency': ['fast', 'quick', 'efficient', 'instant'],
      'innovation': ['new', 'innovative', 'advanced', 'cutting-edge'],
      'tradition': ['traditional', 'heritage', 'classic', 'time-honored']
    };

    const presentValues = culturalValues.values.filter(value => {
      const keywords = valueKeywords[value] || [];
      return keywords.some(keyword => pageContent.includes(keyword));
    });

    if (presentValues.length < culturalValues.values.length * 0.5) {
      problems.push({
        type: 'weak_cultural_value_alignment',
        element: 'content_messaging',
        current: '当前页面信息',
        issue: `页面内容与${targetRegion}文化价值观的对齐程度较低`,
        severity: 'medium',
        suggestion: `在内容中更多体现${targetRegion}文化重视的价值观`,
        missingValues: culturalValues.values.filter(v => !presentValues.includes(v)),
        recommendations: culturalValues.values.map(value => ({
          value,
          keywords: valueKeywords[value] || [],
          importance: '体现此价值观可增强当地用户认同感'
        })),
        category: 'cultural_values'
      });
    }

    return { problems };
  }

  async analyzeSocialConcepts(data, targetRegion) {
    const problems = [];
    
    // 分析社交媒体和分享功能
    const pageContent = JSON.stringify(data).toLowerCase();
    
    // 检查不同地区的社交媒体偏好
    const socialPlatforms = {
      'US': ['facebook', 'instagram', 'twitter', 'tiktok'],
      'CN': ['wechat', 'weibo', 'douyin', 'xiaohongshu'],
      'JP': ['line', 'twitter', 'instagram'],
      'AE': ['whatsapp', 'instagram', 'snapchat']
    };

    const expectedPlatforms = socialPlatforms[targetRegion] || [];
    const foundPlatforms = expectedPlatforms.filter(platform => pageContent.includes(platform));

    if (foundPlatforms.length === 0 && expectedPlatforms.length > 0) {
      problems.push({
        type: 'inappropriate_social_media_integration',
        element: 'social_sharing',
        current: '当前社交媒体集成',
        issue: `未集成${targetRegion}地区流行的社交媒体平台`,
        severity: 'low',
        suggestion: `考虑集成当地流行的社交平台分享功能`,
        recommendations: expectedPlatforms.map(platform => ({
          platform,
          importance: '提高用户分享和社交互动'
        })),
        category: 'social_integration'
      });
    }

    return { problems };
  }

  generateDetailedCulturalRecommendations(problems, targetRegion, data) {
    const recommendations = [];
    const problemsByType = this.groupProblemsByType(problems);

    Object.keys(problemsByType).forEach(type => {
      const typeProblems = problemsByType[type];
      
      switch (type) {
        case 'inappropriate_color_usage':
          recommendations.push({
            category: '色彩文化适配',
            priority: 'high',
            title: '优化色彩方案的文化适配性',
            description: `发现${typeProblems.length}处颜色使用可能引起文化敏感`,
            actions: [
              '审查当前配色方案，移除文化上不合适的颜色',
              '采用目标地区文化中寓意积极的颜色',
              '确保CTA按钮和重要元素使用文化友好的颜色',
              '咨询当地设计师关于色彩心理学的建议'
            ],
            culturalContext: this.getCulturalColorContext(targetRegion),
            examples: typeProblems.map(p => ({
              issue: p.issue,
              suggestion: p.suggestion,
              culturalNote: p.culturalNote
            }))
          });
          break;

        case 'inappropriate_cultural_symbol':
          recommendations.push({
            category: '视觉符号文化敏感性',
            priority: 'high',
            title: '修复文化敏感的视觉元素',
            description: `发现${typeProblems.length}个可能引起文化冲突的视觉元素`,
            actions: [
              '立即移除或替换文化敏感的图像和符号',
              '使用文化上积极正面的视觉元素',
              '确保所有图片和插图符合当地文化价值观',
              '建立视觉内容审核流程'
            ],
            culturalContext: this.getCulturalSymbolContext(targetRegion),
            examples: typeProblems.map(p => ({
              element: p.element,
              issue: p.issue,
              culturalNote: p.culturalNote
            }))
          });
          break;

        case 'inappropriate_holiday_content':
          recommendations.push({
            category: '节日营销文化适配',
            priority: 'medium',
            title: '调整节日和季节性营销内容',
            description: '营销内容需要根据当地节日文化进行调整',
            actions: [
              '移除不适合当地的节日营销内容',
              '制定本地化的节日营销日历',
              '了解当地重要节日的文化意义和营销机会',
              '准备符合当地文化的节日视觉和文案'
            ],
            culturalCalendar: this.getRelevantHolidays(targetRegion),
            marketingOpportunities: this.getHolidayMarketingTips(targetRegion)
          });
          break;

        case 'weak_cultural_value_alignment':
          recommendations.push({
            category: '文化价值观对齐',
            priority: 'medium',
            title: '强化与当地文化价值观的对齐',
            description: '页面内容需要更好地体现当地文化价值观',
            actions: [
              '在产品描述中融入当地重视的价值观',
              '调整品牌信息传达方式',
              '优化客户服务和沟通方式',
              '确保企业社会责任信息符合当地期望'
            ],
            cultureValues: this.getCulturalValueDetails(targetRegion),
            messagingGuidance: this.getMessagingGuidance(targetRegion)
          });
          break;
      }
    });

    // 添加综合文化提升建议
    if (problems.length > 3) {
      recommendations.push({
        category: '全面文化本地化',
        priority: 'high',
        title: '实施全面的文化本地化策略',
        description: '基于发现的多个文化适配问题，建议实施系统性的文化本地化',
        actions: [
          '建立文化顾问团队，包括当地文化专家',
          '制定全面的文化本地化指导原则',
          '定期进行文化适配性审核',
          '收集当地用户反馈并持续改进',
          '培训团队成员的文化敏感性意识'
        ],
        longTermStrategy: [
          '建立本地化内容管理系统',
          '与当地文化机构建立合作关系',
          '定期更新文化适配性最佳实践',
          '监控文化趋势和变化'
        ]
      });
    }

    return recommendations;
  }

  // 辅助方法实现
  calculateCulturalScore(problems) {
    let score = 100;
    
    problems.forEach(problem => {
      switch (problem.severity) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 12;
          break;
        case 'low':
          score -= 6;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  generateCulturalSummary(score, problemCount, targetRegion) {
    const regionName = this.getRegionName(targetRegion);
    
    if (score >= 90) {
      return `${regionName}文化适配优秀，文化敏感性处理得当`;
    } else if (score >= 75) {
      return `${regionName}文化适配良好，有少量细节需要优化`;
    } else if (score >= 60) {
      return `发现${problemCount}个文化适配问题，需要重点关注文化敏感性`;
    } else {
      return `${regionName}文化适配存在较多问题(${problemCount}个)，建议全面文化本地化`;
    }
  }

  generateCulturalInsights(targetRegion, problems) {
    const insights = [];
    
    // 基于问题类型生成洞察
    const highSeverityProblems = problems.filter(p => p.severity === 'high');
    
    if (highSeverityProblems.length > 0) {
      insights.push(`存在${highSeverityProblems.length}个高优先级文化适配问题，需要立即处理以避免文化冲突`);
    }
    
    // 基于地区特点生成洞察
    const culturalFactors = this.culturalFactors[targetRegion];
    if (culturalFactors) {
      insights.push(`${this.getRegionName(targetRegion)}文化重视${culturalFactors.values.join('、')}，建议在内容和设计中体现这些价值观`);
    }
    
    return insights;
  }

  groupProblemsByType(problems) {
    const grouped = {};
    problems.forEach(problem => {
      if (!grouped[problem.type]) {
        grouped[problem.type] = [];
      }
      grouped[problem.type].push(problem);
    });
    return grouped;
  }

  getRegionName(regionCode) {
    const names = {
      'US': '美国',
      'CN': '中国',
      'JP': '日本',
      'AE': '阿联酋',
      'DE': '德国',
      'FR': '法国',
      'GB': '英国',
      'KR': '韩国'
    };
    return names[regionCode] || regionCode;
  }

  getCulturalColorContext(targetRegion) {
    return this.colorMeanings[targetRegion] || {};
  }

  getCulturalSymbolContext(targetRegion) {
    return this.culturalSymbols[targetRegion] || { positive: [], negative: [] };
  }

  getRelevantHolidays(targetRegion) {
    return this.holidayCalendar[targetRegion] || [];
  }

  getHolidayMarketingTips(targetRegion) {
    const tips = {
      'CN': [
        '春节期间使用红色和金色主题',
        '强调家庭团聚和传统价值',
        '避免使用与死亡相关的符号'
      ],
      'AE': [
        '斋月期间调整营销策略，体现精神价值',
        '使用伊斯兰艺术图案',
        '避免展示食物和饮料（斋月白天）'
      ]
    };
    
    return tips[targetRegion] || [];
  }

  getCulturalValueDetails(targetRegion) {
    return this.culturalFactors[targetRegion] || {};
  }

  getMessagingGuidance(targetRegion) {
    const guidance = {
      'CN': '使用间接沟通方式，强调集体利益和和谐',
      'US': '直接明确的沟通，强调个人成就和效率',
      'JP': '非常间接和礼貌的沟通，重视精确性和完美',
      'AE': '正式和尊重的沟通方式，考虑宗教和传统价值'
    };
    
    return guidance[targetRegion] || '根据当地文化调整沟通方式';
  }
}

/**
 * 详细合规性分析器
 */
class DetailedComplianceAnalyzer {
  constructor() {
    this.complianceFrameworks = this.initializeComplianceFrameworks();
    this.privacyRequirements = this.initializePrivacyRequirements();
    this.accessibilityStandards = this.initializeAccessibilityStandards();
  }

  initializeComplianceFrameworks() {
    return {
      'US': {
        frameworks: ['ADA', 'CCPA', 'COPPA', 'CAN-SPAM'],
        requirements: {
          'ADA': '网站可访问性合规',
          'CCPA': '加州消费者隐私法合规',
          'COPPA': '儿童在线隐私保护',
          'CAN-SPAM': '反垃圾邮件法'
        }
      },
      'EU': {
        frameworks: ['GDPR', 'ePrivacy', 'Digital Services Act'],
        requirements: {
          'GDPR': '通用数据保护条例',
          'ePrivacy': '电子隐私指令',
          'Digital Services Act': '数字服务法'
        }
      },
      'CN': {
        frameworks: ['PIPL', 'Cybersecurity Law', 'Data Security Law'],
        requirements: {
          'PIPL': '个人信息保护法',
          'Cybersecurity Law': '网络安全法',
          'Data Security Law': '数据安全法'
        }
      }
    };
  }

  initializePrivacyRequirements() {
    return {
      'GDPR': {
        requiredElements: [
          'Cookie同意横幅',
          '隐私政策链接',
          '数据处理目的说明',
          '用户权利说明',
          '数据保护官联系方式',
          '撤回同意机制'
        ],
        penalties: '最高可达全球年营业额的4%或2000万欧元'
      },
      'CCPA': {
        requiredElements: [
          '"Do Not Sell"链接',
          '隐私政策',
          '消费者权利说明',
          '个人信息类别披露',
          '第三方数据共享说明'
        ],
        penalties: '每次违规最高7500美元'
      },
      'PIPL': {
        requiredElements: [
          '个人信息处理同意',
          '隐私政策',
          '个人信息保护负责人信息',
          '境外传输告知',
          '用户权利保障机制'
        ],
        penalties: '最高5000万元人民币或上一年度营业额5%'
      }
    };
  }

  initializeAccessibilityStandards() {
    return {
      'WCAG_2.1': {
        levels: ['A', 'AA', 'AAA'],
        requirements: {
          'A': ['图片alt文本', '键盘导航', '颜色对比'],
          'AA': ['颜色对比4.5:1', '文本调整', '音频控制'],
          'AAA': ['颜色对比7:1', '上下文帮助', '错误预防']
        }
      }
    };
  }

  async analyzeInDetail(data, targetRegion) {
    const analysis = {
      score: 0,
      summary: '',
      specificProblems: [],
      detailedRecommendations: [],
      complianceGaps: []
    };

    try {
      // 1. 隐私法规合规分析
      const privacyAnalysis = await this.analyzePrivacyCompliance(data, targetRegion);
      analysis.specificProblems.push(...privacyAnalysis.problems);

      // 2. 可访问性合规分析
      const accessibilityAnalysis = await this.analyzeAccessibilityCompliance(data, targetRegion);
      analysis.specificProblems.push(...accessibilityAnalysis.problems);

      // 3. Cookie和跟踪合规
      const cookieAnalysis = await this.analyzeCookieCompliance(data, targetRegion);
      analysis.specificProblems.push(...cookieAnalysis.problems);

      // 4. 内容合规性分析
      const contentAnalysis = await this.analyzeContentCompliance(data, targetRegion);
      analysis.specificProblems.push(...contentAnalysis.problems);

      // 计算评分
      analysis.score = this.calculateComplianceScore(analysis.specificProblems);

      // 生成详细建议
      analysis.detailedRecommendations = this.generateDetailedComplianceRecommendations(
        analysis.specificProblems, targetRegion, data
      );

      // 生成合规性差距分析
      analysis.complianceGaps = this.identifyComplianceGaps(targetRegion, analysis.specificProblems);

      // 生成总结
      analysis.summary = this.generateComplianceSummary(analysis.score, analysis.specificProblems.length, targetRegion);

      return analysis;
    } catch (error) {
      console.error('详细合规性分析失败:', error);
      return {
        score: 50,
        summary: '合规性分析过程中出现错误',
        specificProblems: [],
        detailedRecommendations: ['请咨询法律专业人士'],
        complianceGaps: []
      };
    }
  }

  async analyzePrivacyCompliance(data, targetRegion) {
    const problems = [];
    const pageContent = JSON.stringify(data).toLowerCase();
    
    // 确定适用的隐私法规
    const applicableLaws = this.getApplicablePrivacyLaws(targetRegion);
    
    applicableLaws.forEach(law => {
      const requirements = this.privacyRequirements[law];
      if (!requirements) return;

      requirements.requiredElements.forEach(requirement => {
        const hasRequirement = this.checkPrivacyRequirement(pageContent, requirement, law);
        
        if (!hasRequirement.found) {
          problems.push({
            type: 'missing_privacy_requirement',
            element: 'privacy_compliance',
            current: '当前隐私设置',
            issue: `缺少${law}要求的"${requirement}"`,
            severity: 'high',
            suggestion: hasRequirement.suggestion,
            legalFramework: law,
            penalty: requirements.penalties,
            category: 'privacy_law'
          });
        }
      });
    });

    return { problems };
  }

  async analyzeAccessibilityCompliance(data, targetRegion) {
    const problems = [];
    
    // 检查图片alt文本
    if (data.images) {
      data.images.forEach((img, index) => {
        if (!img.alt || img.alt.trim().length === 0) {
          problems.push({
            type: 'missing_alt_text',
            element: `image_${index}`,
            current: img.src,
            issue: '图片缺少alt文本，违反WCAG可访问性标准',
            severity: 'high',
            suggestion: '为所有图片添加描述性的alt文本',
            wcagLevel: 'A',
            category: 'accessibility'
          });
        }
      });
    }

    // 检查表单标签
    if (data.text?.forms) {
      Object.keys(data.text.forms).forEach(formKey => {
        const form = data.text.forms[formKey];
        if (form.inputs && form.inputs.length > 0 && (!form.labels || form.labels.length === 0)) {
          problems.push({
            type: 'missing_form_labels',
            element: formKey,
            current: '表单输入字段',
            issue: '表单缺少标签，影响屏幕阅读器用户',
            severity: 'high',
            suggestion: '为所有表单输入字段添加相应的标签',
            wcagLevel: 'A',
            category: 'accessibility'
          });
        }
      });
    }

    return { problems };
  }

  async analyzeCookieCompliance(data, targetRegion) {
    const problems = [];
    const pageContent = JSON.stringify(data).toLowerCase();
    
    // 检查是否需要Cookie同意
    const requiresCookieConsent = this.requiresCookieConsent(targetRegion);
    
    if (requiresCookieConsent) {
      const cookieConsentKeywords = [
        'cookie consent', 'accept cookies', 'cookie policy', 
        'cookie banner', 'cookies consent', '同意cookie'
      ];
      
      const hasCookieConsent = cookieConsentKeywords.some(keyword => 
        pageContent.includes(keyword.toLowerCase())
      );
      
      if (!hasCookieConsent) {
        problems.push({
          type: 'missing_cookie_consent',
          element: 'cookie_management',
          current: '当前Cookie处理',
          issue: `${targetRegion}地区要求显示Cookie同意横幅`,
          severity: 'high',
          suggestion: '添加Cookie同意横幅，允许用户选择接受或拒绝Cookie',
          legalRequirement: '满足GDPR/ePrivacy指令要求',
          category: 'cookie_compliance'
        });
      }
    }

    return { problems };
  }

  async analyzeContentCompliance(data, targetRegion) {
    const problems = [];
    
    // 检查年龄限制内容
    const hasAgeRestrictedContent = this.detectAgeRestrictedContent(data);
    if (hasAgeRestrictedContent.found && !hasAgeRestrictedContent.hasWarning) {
      problems.push({
        type: 'missing_age_verification',
        element: 'content_restrictions',
        current: hasAgeRestrictedContent.content,
        issue: '包含年龄限制内容但缺少年龄验证',
        severity: 'high',
        suggestion: '添加年龄验证机制或内容警告',
        category: 'content_compliance'
      });
    }

    // 检查禁售商品
    const prohibitedItems = this.detectProhibitedItems(data, targetRegion);
    if (prohibitedItems.length > 0) {
      problems.push({
        type: 'prohibited_items_detected',
        element: 'product_content',
        current: prohibitedItems.join(', '),
        issue: `检测到${targetRegion}地区的禁售或限制商品`,
        severity: 'high',
        suggestion: '移除或限制这些商品在该地区的销售',
        prohibitedItems: prohibitedItems,
        category: 'product_compliance'
      });
    }

    return { problems };
  }

  generateDetailedComplianceRecommendations(problems, targetRegion, data) {
    const recommendations = [];
    const problemsByType = this.groupProblemsByType(problems);

    // 隐私法规建议
    if (problemsByType['missing_privacy_requirement']) {
      recommendations.push({
        category: '隐私法规合规',
        priority: 'critical',
        title: '实施隐私法规合规措施',
        description: '需要立即处理隐私法规合规问题以避免法律风险',
        actions: [
          '咨询专业法律顾问确定具体合规要求',
          '实施完整的隐私政策和Cookie管理系统',
          '建立用户数据处理和权利响应流程',
          '定期审核和更新隐私合规措施'
        ],
        urgency: '高风险 - 需要立即处理',
        legalRisks: problemsByType['missing_privacy_requirement'].map(p => ({
          framework: p.legalFramework,
          penalty: p.penalty,
          requirement: p.issue
        }))
      });
    }

    // 可访问性建议
    if (problemsByType['missing_alt_text'] || problemsByType['missing_form_labels']) {
      recommendations.push({
        category: 'Web可访问性',
        priority: 'high',
        title: '提升网站可访问性合规',
        description: '改善网站可访问性以符合WCAG标准',
        actions: [
          '为所有图片添加有意义的alt文本',
          '确保表单字段都有相应的标签',
          '测试键盘导航功能',
          '验证颜色对比度符合标准',
          '实施屏幕阅读器测试'
        ],
        standards: ['WCAG 2.1 AA', 'Section 508', 'ADA'],
        benefits: ['改善用户体验', '扩大用户群体', '避免法律风险']
      });
    }

    // Cookie合规建议
    if (problemsByType['missing_cookie_consent']) {
      recommendations.push({
        category: 'Cookie合规管理',
        priority: 'high',
        title: '实施Cookie同意和管理系统',
        description: '建立符合GDPR和其他隐私法规的Cookie管理',
        actions: [
          '部署Cookie同意横幅',
          '提供Cookie类别选择选项',
          '创建详细的Cookie政策页面',
          '实施Cookie同意记录和管理',
          '定期审核第三方Cookie使用'
        ],
        technicalRequirements: [
          '同意横幅UI组件',
          '用户偏好存储系统',
          'Cookie扫描和分类',
          '同意撤回机制'
        ]
      });
    }

    return recommendations;
  }

  // 辅助方法
  getApplicablePrivacyLaws(targetRegion) {
    const lawMapping = {
      'US': ['CCPA'],
      'GB': ['GDPR'],
      'DE': ['GDPR'], 
      'FR': ['GDPR'],
      'ES': ['GDPR'],
      'IT': ['GDPR'],
      'CN': ['PIPL']
    };
    
    return lawMapping[targetRegion] || [];
  }

  checkPrivacyRequirement(pageContent, requirement, law) {
    const requirementChecks = {
      'Cookie同意横幅': {
        keywords: ['cookie consent', 'accept cookies', 'cookie policy'],
        found: false,
        suggestion: '添加Cookie同意横幅，允许用户接受或拒绝Cookie'
      },
      '隐私政策链接': {
        keywords: ['privacy policy', 'privacy notice', '隐私政策'],
        found: false,
        suggestion: '在页面明显位置添加隐私政策链接'
      },
      '"Do Not Sell"链接': {
        keywords: ['do not sell', 'opt out', 'ccpa'],
        found: false,
        suggestion: '在页面底部添加"Do Not Sell My Personal Information"链接'
      }
    };

    const check = requirementChecks[requirement];
    if (check) {
      check.found = check.keywords.some(keyword => pageContent.includes(keyword));
      return check;
    }

    return { found: true, suggestion: '请咨询法律专业人士' };
  }

  requiresCookieConsent(targetRegion) {
    const cookieConsentRequired = ['GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT'];
    return cookieConsentRequired.includes(targetRegion);
  }

  detectAgeRestrictedContent(data) {
    const ageRestrictedKeywords = ['alcohol', 'wine', 'beer', 'tobacco', 'adult', '18+'];
    const pageContent = JSON.stringify(data).toLowerCase();
    
    const foundContent = ageRestrictedKeywords.filter(keyword => 
      pageContent.includes(keyword)
    );
    
    const hasWarning = pageContent.includes('age verification') || 
                      pageContent.includes('18+') || 
                      pageContent.includes('adult only');
    
    return {
      found: foundContent.length > 0,
      content: foundContent.join(', '),
      hasWarning
    };
  }

  detectProhibitedItems(data, targetRegion) {
    const prohibitedItems = {
      'AE': ['alcohol', 'pork', 'gambling'],
      'SA': ['alcohol', 'pork', 'adult content'],
      'CN': ['gambling', 'political content']
    };
    
    const prohibited = prohibitedItems[targetRegion] || [];
    const pageContent = JSON.stringify(data).toLowerCase();
    
    return prohibited.filter(item => pageContent.includes(item));
  }

  calculateComplianceScore(problems) {
    let score = 100;
    
    problems.forEach(problem => {
      switch (problem.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  generateComplianceSummary(score, problemCount, targetRegion) {
    const regionName = this.getRegionName(targetRegion);
    
    if (score >= 90) {
      return `${regionName}地区合规性表现优秀，法律风险很低`;
    } else if (score >= 75) {
      return `${regionName}地区合规性良好，有少量需要改进的地方`;
    } else if (score >= 60) {
      return `发现${problemCount}个合规性问题，建议优先处理高风险项目`;
    } else {
      return `合规性存在重大问题(${problemCount}个)，建议立即咨询法律专业人士`;
    }
  }

  identifyComplianceGaps(targetRegion, problems) {
    const gaps = [];
    
    // 基于问题类型识别合规差距
    const privacyProblems = problems.filter(p => p.category === 'privacy_law');
    if (privacyProblems.length > 0) {
      gaps.push({
        area: '隐私法规合规',
        risk: 'high',
        description: '缺少基本的隐私法规合规措施',
        immediateActions: [
          '咨询隐私法律专家',
          '制定隐私政策',
          '实施Cookie同意机制'
        ]
      });
    }

    return gaps;
  }

  groupProblemsByType(problems) {
    const grouped = {};
    problems.forEach(problem => {
      if (!grouped[problem.type]) {
        grouped[problem.type] = [];
      }
      grouped[problem.type].push(problem);
    });
    return grouped;
  }

  getRegionName(regionCode) {
    const names = {
      'US': '美国',
      'CN': '中国',
      'JP': '日本',
      'AE': '阿联酋',
      'DE': '德国',
      'FR': '法国',
      'GB': '英国'
    };
    return names[regionCode] || regionCode;
  }
}

/**
 * 详细用户体验分析器
 */
class DetailedUXAnalyzer {
  constructor() {
    this.uxMetrics = this.initializeUXMetrics();
    this.deviceFactors = this.initializeDeviceFactors();
    this.regionalUXPreferences = this.initializeRegionalUXPreferences();
  }

  initializeUXMetrics() {
    return {
      performance: {
        loadTime: { optimal: 3000, acceptable: 5000 },
        firstContentfulPaint: { optimal: 1500, acceptable: 2500 },
        largestContentfulPaint: { optimal: 2500, acceptable: 4000 }
      },
      usability: {
        clickTargetSize: { minimum: 44, recommended: 48 },
        textReadability: { minFontSize: 16, lineHeight: 1.4 }
      }
    };
  }

  initializeDeviceFactors() {
    return {
      'CN': {
        dominantDevices: ['mobile', 'tablet'],
        screenSizes: ['360x640', '414x896', '375x667'],
        connectionTypes: ['4G', 'WiFi', '5G'],
        browserPreferences: ['WeChat Browser', 'UC Browser', 'QQ Browser']
      },
      'US': {
        dominantDevices: ['desktop', 'mobile'],
        screenSizes: ['1920x1080', '375x667', '414x896'],
        connectionTypes: ['WiFi', '4G', '5G'],
        browserPreferences: ['Chrome', 'Safari', 'Edge']
      },
      'JP': {
        dominantDevices: ['mobile', 'desktop'],
        screenSizes: ['375x667', '414x896', '1920x1080'],
        connectionTypes: ['WiFi', '4G', '5G'],
        browserPreferences: ['Chrome', 'Safari']
      }
    };
  }

  initializeRegionalUXPreferences() {
    return {
      'CN': {
        loadingTolerance: 'low',
        interactionStyle: 'gesture-heavy',
        contentDensity: 'high',
        paymentUX: ['Alipay', 'WeChat Pay', 'UnionPay']
      },
      'US': {
        loadingTolerance: 'medium',
        interactionStyle: 'click-focused',
        contentDensity: 'medium',
        paymentUX: ['Credit Card', 'PayPal', 'Apple Pay']
      },
      'JP': {
        loadingTolerance: 'high',
        interactionStyle: 'precise',
        contentDensity: 'low',
        paymentUX: ['Credit Card', 'Konbini', 'Bank Transfer']
      }
    };
  }

  async analyzeInDetail(data, targetRegion) {
    const analysis = {
      score: 0,
      summary: '',
      specificProblems: [],
      detailedRecommendations: [],
      uxInsights: []
    };

    try {
      // 1. 性能用户体验分析
      const performanceAnalysis = await this.analyzePerformanceUX(data, targetRegion);
      analysis.specificProblems.push(...performanceAnalysis.problems);

      // 2. 移动端用户体验分析
      const mobileAnalysis = await this.analyzeMobileUX(data, targetRegion);
      analysis.specificProblems.push(...mobileAnalysis.problems);

      // 3. 导航和信息架构分析
      const navigationAnalysis = await this.analyzeNavigationUX(data, targetRegion);
      analysis.specificProblems.push(...navigationAnalysis.problems);

      // 4. 转化路径用户体验分析
      const conversionAnalysis = await this.analyzeConversionUX(data, targetRegion);
      analysis.specificProblems.push(...conversionAnalysis.problems);

      // 5. 地区特定用户体验分析
      const regionalAnalysis = await this.analyzeRegionalUX(data, targetRegion);
      analysis.specificProblems.push(...regionalAnalysis.problems);

      // 计算评分
      analysis.score = this.calculateUXScore(analysis.specificProblems);

      // 生成详细建议
      analysis.detailedRecommendations = this.generateDetailedUXRecommendations(
        analysis.specificProblems, targetRegion, data
      );

      // 生成用户体验洞察
      analysis.uxInsights = this.generateUXInsights(targetRegion, analysis.specificProblems);

      // 生成总结
      analysis.summary = this.generateUXSummary(analysis.score, analysis.specificProblems.length, targetRegion);

      return analysis;
    } catch (error) {
      console.error('详细用户体验分析失败:', error);
      return {
        score: 50,
        summary: '用户体验分析过程中出现错误',
        specificProblems: [],
        detailedRecommendations: ['请检查页面技术配置'],
        uxInsights: []
      };
    }
  }

  async analyzePerformanceUX(data, targetRegion) {
    const problems = [];
    const performance = data.performance || {};
    
    // 检查加载时间
    if (performance.loadTime > this.uxMetrics.performance.loadTime.acceptable) {
      problems.push({
        type: 'poor_loading_performance',
        element: 'page_load',
        current: `${performance.loadTime}ms`,
        issue: '页面加载时间过长，影响用户体验',
        severity: 'high',
        suggestion: '优化图片、压缩资源、使用CDN加速',
        benchmark: `建议控制在${this.uxMetrics.performance.loadTime.optimal}ms内`,
        category: 'performance'
      });
    }

    // 检查核心网页指标
    if (performance.coreWebVitals) {
      const { lcp, fid, cls } = performance.coreWebVitals;
      
      if (lcp > 2500) {
        problems.push({
          type: 'poor_lcp',
          element: 'largest_contentful_paint',
          current: `${lcp}ms`,
          issue: '最大内容绘制时间过长',
          severity: 'high',
          suggestion: '优化关键资源加载顺序，预加载重要内容',
          category: 'core_web_vitals'
        });
      }
    }

    return { problems };
  }

  async analyzeMobileUX(data, targetRegion) {
    const problems = [];
    const deviceFactors = this.deviceFactors[targetRegion];
    
    if (!deviceFactors) {
      return { problems: [] };
    }

    // 检查移动端适配
    const hasViewport = data.meta?.basic?.viewport;
    if (!hasViewport || !hasViewport.includes('width=device-width')) {
      problems.push({
        type: 'missing_mobile_viewport',
        element: 'meta_viewport',
        current: hasViewport || '无viewport设置',
        issue: '缺少移动端视口设置，在手机上显示可能异常',
        severity: 'high',
        suggestion: '添加<meta name="viewport" content="width=device-width, initial-scale=1">',
        category: 'mobile_responsiveness'
      });
    }

    // 检查触摸友好性
    if (data.text?.buttons) {
      const smallButtons = this.detectSmallButtons(data.text.buttons);
      if (smallButtons.length > 0) {
        problems.push({
          type: 'touch_target_too_small',
          element: 'interactive_elements',
          current: `${smallButtons.length}个按钮可能过小`,
          issue: '部分按钮或链接可能不适合触摸操作',
          severity: 'medium',
          suggestion: '确保所有可点击元素至少44x44px',
          affectedElements: smallButtons,
          category: 'touch_usability'
        });
      }
    }

    return { problems };
  }

  async analyzeNavigationUX(data, targetRegion) {
    const problems = [];

    // 检查导航结构
    if (data.text?.navigation) {
      const navigationAnalysis = this.analyzeNavigationStructure(data.text.navigation);
      
      if (navigationAnalysis.tooManyItems) {
        problems.push({
          type: 'complex_navigation',
          element: 'main_navigation',
          current: `${navigationAnalysis.itemCount}个导航项`,
          issue: '导航项目过多，可能影响用户找到目标内容',
          severity: 'medium',
          suggestion: '考虑使用分类导航或隐藏次要导航项',
          category: 'information_architecture'
        });
      }

      if (navigationAnalysis.unclearLabels.length > 0) {
        problems.push({
          type: 'unclear_navigation_labels',
          element: 'navigation_text',
          current: navigationAnalysis.unclearLabels.join(', '),
          issue: '部分导航标签不够清晰',
          severity: 'low',
          suggestion: '使用更明确的导航标签，帮助用户理解页面内容',
          category: 'navigation_clarity'
        });
      }
    }

    return { problems };
  }

  async analyzeConversionUX(data, targetRegion) {
    const problems = [];

    // 检查购买流程
    const hasEcommerce = data.ecommerce && Object.keys(data.ecommerce).length > 0;
    if (hasEcommerce) {
      // 检查CTA按钮
      const ctaAnalysis = this.analyzeCTAButtons(data);
      if (ctaAnalysis.issues.length > 0) {
        problems.push(...ctaAnalysis.issues);
      }

      // 检查结账流程
      const checkoutAnalysis = this.analyzeCheckoutFlow(data, targetRegion);
      if (checkoutAnalysis.issues.length > 0) {
        problems.push(...checkoutAnalysis.issues);
      }

      // 检查信任信号
      const trustAnalysis = this.analyzeTrustSignals(data);
      if (trustAnalysis.lacking.length > 0) {
        problems.push({
          type: 'insufficient_trust_signals',
          element: 'trust_elements',
          current: '当前信任信号',
          issue: '缺少足够的信任信号，可能影响转化率',
          severity: 'medium',
          suggestion: '添加客户评价、安全认证、退换货政策等信任信号',
          missingElements: trustAnalysis.lacking,
          category: 'conversion_optimization'
        });
      }
    }

    return { problems };
  }

  async analyzeRegionalUX(data, targetRegion) {
    const problems = [];
    const preferences = this.regionalUXPreferences[targetRegion];
    
    if (!preferences) {
      return { problems: [] };
    }

    // 检查支付方式本地化
    const paymentAnalysis = this.analyzePaymentMethods(data, preferences.paymentUX);
    if (!paymentAnalysis.adequate) {
      problems.push({
        type: 'inadequate_payment_methods',
        element: 'payment_options',
        current: paymentAnalysis.found.join(', ') || '未检测到支付方式',
        issue: `缺少${targetRegion}地区主流的支付方式`,
        severity: 'high',
        suggestion: `集成当地流行的支付方式: ${preferences.paymentUX.join(', ')}`,
        recommendedMethods: preferences.paymentUX,
        category: 'payment_localization'
      });
    }

    // 检查内容密度
    const contentDensityAnalysis = this.analyzeContentDensity(data, preferences.contentDensity);
    if (contentDensityAnalysis.mismatch) {
      problems.push({
        type: 'content_density_mismatch',
        element: 'page_layout',
        current: contentDensityAnalysis.current,
        issue: `内容密度与${targetRegion}用户习惯不符`,
        severity: 'low',
        suggestion: contentDensityAnalysis.suggestion,
        category: 'regional_preferences'
      });
    }

    return { problems };
  }

  generateDetailedUXRecommendations(problems, targetRegion, data) {
    const recommendations = [];
    const problemsByType = this.groupProblemsByType(problems);

    // 性能优化建议
    const performanceProblems = ['poor_loading_performance', 'poor_lcp', 'poor_fid'];
    const hasPerformanceIssues = performanceProblems.some(type => problemsByType[type]);
    
    if (hasPerformanceIssues) {
      recommendations.push({
        category: '性能用户体验优化',
        priority: 'high',
        title: '提升页面加载性能',
        description: '优化页面性能以改善用户体验和搜索排名',
        actions: [
          '压缩和优化图片，使用WebP格式',
          '启用Gzip/Brotli压缩',
          '使用CDN加速静态资源',
          '实施关键资源预加载',
          '优化CSS和JavaScript加载策略',
          '减少第三方脚本的影响'
        ],
        metrics: {
          current: this.getPerformanceMetrics(problems),
          targets: {
            'Load Time': '< 3秒',
            'LCP': '< 2.5秒',
            'FID': '< 100ms',
            'CLS': '< 0.1'
          }
        },
        toolsRecommended: ['Google PageSpeed Insights', 'WebPageTest', 'Chrome DevTools']
      });
    }

    // 移动端优化建议
    const mobileProblems = ['missing_mobile_viewport', 'touch_target_too_small'];
    const hasMobileIssues = mobileProblems.some(type => problemsByType[type]);
    
    if (hasMobileIssues) {
      const deviceFactors = this.deviceFactors[targetRegion];
      recommendations.push({
        category: '移动端用户体验',
        priority: 'high',
        title: '优化移动端体验',
        description: `提升在${targetRegion}主流移动设备上的用户体验`,
        actions: [
          '确保响应式设计适配所有屏幕尺寸',
          '优化触摸交互，确保按钮足够大',
          '简化移动端导航结构',
          '优化移动端页面加载速度',
          '测试主流移动浏览器兼容性'
        ],
        regionalContext: {
          dominantDevices: deviceFactors?.dominantDevices || [],
          popularScreenSizes: deviceFactors?.screenSizes || [],
          preferredBrowsers: deviceFactors?.browserPreferences || []
        },
        testingRecommendation: '在真实设备上进行用户体验测试'
      });
    }

    // 转化优化建议
    const conversionProblems = ['insufficient_trust_signals', 'inadequate_payment_methods'];
    const hasConversionIssues = conversionProblems.some(type => problemsByType[type]);
    
    if (hasConversionIssues) {
      recommendations.push({
        category: '转化率优化',
        priority: 'medium',
        title: '提升转化用户体验',
        description: '优化购买流程和信任信号以提高转化率',
        actions: [
          '简化结账流程，减少步骤',
          '添加多种本地化支付方式',
          '显示安全认证和信任标志',
          '优化产品页面信息展示',
          '添加客户评价和社会证明',
          '提供清晰的退换货政策'
        ],
        conversionOptimization: {
          trustSignals: ['SSL证书显示', '客户评价', '安全支付标志', '退货保证'],
          ctaOptimization: ['明确的行动指引', '突出的按钮设计', '紧迫感营造'],
          checkoutOptimization: ['访客结账', '进度指示器', '错误处理优化']
        }
      });
    }

    return recommendations;
  }

  // 辅助方法实现
  detectSmallButtons(buttons) {
    // 简化实现：假设按钮文字过短可能表示按钮太小
    return buttons.filter(buttonText => buttonText.length < 3);
  }

  analyzeNavigationStructure(navigation) {
    const itemCount = navigation.length;
    const unclearLabels = navigation.filter(item => 
      item.length < 2 || item.length > 20 || !/^[a-zA-Z\u4e00-\u9fff\s]+$/.test(item)
    );

    return {
      itemCount,
      tooManyItems: itemCount > 7,
      unclearLabels
    };
  }

  analyzeCTAButtons(data) {
    const issues = [];
    
    if (data.text?.buttons) {
      const vagueCTAs = data.text.buttons.filter(button => {
        const vague = ['click here', 'more', 'here', '更多', '点击'];
        return vague.some(term => button.toLowerCase().includes(term));
      });

      if (vagueCTAs.length > 0) {
        issues.push({
          type: 'vague_cta_text',
          element: 'cta_buttons',
          current: vagueCTAs.join(', '),
          issue: '部分CTA按钮文字不够明确',
          severity: 'low',
          suggestion: '使用更明确的行动指引文字，如"立即购买"、"添加到购物车"',
          category: 'cta_optimization'
        });
      }
    }

    return { issues };
  }

  analyzeCheckoutFlow(data, targetRegion) {
    const issues = [];
    
    // 检查是否有结账相关内容
    const hasCheckout = data.ecommerce?.checkout;
    if (!hasCheckout) {
      issues.push({
        type: 'missing_checkout_info',
        element: 'checkout_process',
        current: '未检测到结账信息',
        issue: '缺少结账流程信息',
        severity: 'medium',
        suggestion: '确保结账流程信息清晰可见',
        category: 'checkout_flow'
      });
    }

    return { issues };
  }

  analyzeTrustSignals(data) {
    const trustSignals = [
      'reviews', 'testimonials', 'security', 'guarantee', 
      'ssl', 'certified', '评价', '保证', '认证'
    ];
    
    const pageContent = JSON.stringify(data).toLowerCase();
    const present = trustSignals.filter(signal => pageContent.includes(signal));
    const lacking = trustSignals.filter(signal => !pageContent.includes(signal));

    return {
      present,
      lacking: lacking.slice(0, 3), // 只显示前3个缺失的
      adequate: present.length >= 3
    };
  }

  analyzePaymentMethods(data, expectedMethods) {
    const pageContent = JSON.stringify(data).toLowerCase();
    const found = expectedMethods.filter(method => 
      pageContent.includes(method.toLowerCase())
    );

    return {
      found,
      adequate: found.length >= Math.min(2, expectedMethods.length),
      missing: expectedMethods.filter(method => !found.includes(method))
    };
  }

  analyzeContentDensity(data, expectedDensity) {
    // 简化的内容密度分析
    const textContent = data.text?.paragraphs?.join(' ') || '';
    const wordsPerPage = textContent.split(' ').length;
    
    let currentDensity;
    if (wordsPerPage > 500) currentDensity = 'high';
    else if (wordsPerPage > 200) currentDensity = 'medium';
    else currentDensity = 'low';

    const mismatch = currentDensity !== expectedDensity;
    let suggestion = '';
    
    if (mismatch) {
      if (expectedDensity === 'high' && currentDensity !== 'high') {
        suggestion = '增加页面信息密度，提供更多详细信息';
      } else if (expectedDensity === 'low' && currentDensity !== 'low') {
        suggestion = '简化页面内容，突出重点信息';
      }
    }

    return {
      current: currentDensity,
      expected: expectedDensity,
      mismatch,
      suggestion
    };
  }

  calculateUXScore(problems) {
    let score = 100;
    
    problems.forEach(problem => {
      switch (problem.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  generateUXSummary(score, problemCount, targetRegion) {
    const regionName = this.getRegionName(targetRegion);
    
    if (score >= 90) {
      return `${regionName}用户体验优秀，各项指标表现良好`;
    } else if (score >= 75) {
      return `${regionName}用户体验良好，有几处可以优化的地方`;
    } else if (score >= 60) {
      return `发现${problemCount}个用户体验问题，建议重点优化`;
    } else {
      return `用户体验存在较多问题(${problemCount}个)，需要全面优化`;
    }
  }

  generateUXInsights(targetRegion, problems) {
    const insights = [];
    const preferences = this.regionalUXPreferences[targetRegion];
    
    if (preferences) {
      insights.push(`${this.getRegionName(targetRegion)}用户偏好${preferences.interactionStyle}交互方式，加载容忍度为${preferences.loadingTolerance}`);
    }

    const performanceProblems = problems.filter(p => p.category === 'performance');
    if (performanceProblems.length > 0) {
      insights.push('性能优化是当前用户体验改善的重点，建议优先处理');
    }

    return insights;
  }

  getPerformanceMetrics(problems) {
    const performanceData = {};
    problems.forEach(problem => {
      if (problem.type === 'poor_loading_performance') {
        performanceData['Load Time'] = problem.current;
      }
    });
    return performanceData;
  }

  groupProblemsByType(problems) {
    const grouped = {};
    problems.forEach(problem => {
      if (!grouped[problem.type]) {
        grouped[problem.type] = [];
      }
      grouped[problem.type].push(problem);
    });
    return grouped;
  }

  getRegionName(regionCode) {
    const names = {
      'US': '美国',
      'CN': '中国',
      'JP': '日本',
      'AE': '阿联酋',
      'DE': '德国',
      'FR': '法国',
      'GB': '英国'
    };
    return names[regionCode] || regionCode;
  }
}

// 导出详细分析引擎
window.DetailedAnalysisEngine = DetailedAnalysisEngine;