// AI分析服务集成
class AIAnalysisService {
  constructor() {
    // 主要支持的AI服务商
    this.providers = {
      zhipu: {
        name: 'GLM-4',
        apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        model: 'glm-4',
        maxTokens: 4000,
        priority: 1
      },
      deepseek: {
        name: 'DeepSeek',
        apiUrl: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        maxTokens: 4000,
        priority: 2
      }
    };
    
    // 备用服务商（暂时隐藏，可在需要时启用）
    this.hiddenProviders = {
      qwen: {
        name: 'Qwen',
        apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        model: 'qwen-plus',
        maxTokens: 4000
      },
      openai: {
        name: 'GPT-4',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4',
        maxTokens: 4000
      }
    };
    
    this.currentProvider = 'zhipu'; // 默认使用智谱GLM-4
    this.retryCount = 3;
    this.timeout = 30000; // 30秒超时
    
    // 集成缓存服务
    this.cacheService = null;
    this.initializeCacheService();
  }
  
  // 初始化缓存服务
  async initializeCacheService() {
    try {
      this.cacheService = new AIAnalysisCacheService();
      console.log('AI Analysis Cache Service initialized');
    } catch (error) {
      console.warn('Failed to initialize cache service:', error);
    }
  }

  // 主要AI分析入口
  async analyze(contentData, targetRegions, options = {}) {
    const results = {};
    
    for (const region of targetRegions) {
      try {
        // 先检查缓存
        const cachedResult = await this.checkCache(contentData, region, options);
        if (cachedResult) {
          results[region] = cachedResult;
          continue;
        }
        
        // 执行AI分析
        const analysisResult = await this.analyzeForRegion(contentData, region, options);
        
        // 缓存结果
        await this.cacheResult(contentData, region, analysisResult, options);
        
        results[region] = analysisResult;
      } catch (error) {
        console.error(`AI分析失败 - 地区 ${region}:`, error);
        results[region] = this.getFallbackResult(region);
      }
    }

    return {
      timestamp: new Date().toISOString(),
      provider: this.currentProvider,
      results: results
    };
  }

  // 针对特定地区的AI分析
  async analyzeForRegion(contentData, targetRegion, options = {}) {
    const prompt = this.buildAnalysisPrompt(contentData, targetRegion);
    const response = await this.callAIProvider(prompt, options);
    
    return this.parseAIResponse(response, targetRegion);
  }

  // 构建分析提示词
  buildAnalysisPrompt(contentData, targetRegion) {
    const regionInfo = this.getRegionInfo(targetRegion);
    
    return `
作为跨境电商本地化专家，请分析以下网页内容在${regionInfo.name}市场的适配性。

## 网页信息
- URL: ${contentData.url}
- 标题: ${contentData.title}
- 声明语言: ${contentData.language?.declared || '未声明'}
- 检测语言: ${contentData.language?.detected || '未检测'}

## 页面内容
### 标题层次
${JSON.stringify(contentData.text?.headings || {}, null, 2)}

### 主要文本内容
${(contentData.text?.paragraphs || []).slice(0, 5).join('\\n')}

### 导航菜单
${JSON.stringify(contentData.text?.navigation || [], null, 2)}

### 按钮文本
${JSON.stringify(contentData.text?.buttons || [], null, 2)}

### 产品信息
${JSON.stringify(contentData.ecommerce?.products || [], null, 2)}

### Meta信息
${JSON.stringify(contentData.meta?.basic || {}, null, 2)}

## 目标市场: ${regionInfo.name}
- 主要语言: ${regionInfo.language}
- 货币: ${regionInfo.currency}
- 文化特点: ${regionInfo.culture}
- 主要法规: ${regionInfo.regulations}

## 分析要求
请从以下四个维度对网页内容进行详细分析，每个维度给出1-100分的评分：

### 1. 语言适配性分析 (Language Localization)
- 语言一致性检查
- 术语本地化程度
- 翻译质量评估
- 多语言支持情况

### 2. 文化适配性分析 (Cultural Adaptation) 
- 文化敏感性检查
- 颜色和符号的文化含义
- 节日和习俗的适配
- 图片和视觉元素适配

### 3. 合规性分析 (Compliance Analysis)
- 当地法规符合程度
- 隐私政策合规性
- 广告内容合规性
- 禁售商品检查

### 4. 用户体验分析 (User Experience)
- 界面布局适配
- 支付方式本地化
- 客服渠道适配
- 移动端体验优化

## 输出格式
请严格按照以下JSON格式输出分析结果：

\`\`\`json
{
  "language": {
    "score": 85,
    "issues": ["具体问题描述1", "具体问题描述2"],
    "suggestions": ["优化建议1", "优化建议2"],
    "details": {
      "consistency": "语言一致性评估",
      "terminology": "术语本地化评估",
      "translation": "翻译质量评估"
    }
  },
  "culture": {
    "score": 78,
    "issues": ["文化适配问题1", "文化适配问题2"],
    "suggestions": ["文化优化建议1", "文化优化建议2"],
    "details": {
      "sensitivity": "文化敏感性评估",
      "symbols": "符号适配评估",
      "holidays": "节日营销评估"
    }
  },
  "compliance": {
    "score": 92,
    "issues": ["合规问题1"],
    "suggestions": ["合规优化建议1"],
    "details": {
      "privacy": "隐私政策评估",
      "advertising": "广告合规评估",
      "restricted": "禁售商品评估"
    }
  },
  "userExperience": {
    "score": 88,
    "issues": ["用户体验问题1"],
    "suggestions": ["用户体验优化建议1"],
    "details": {
      "layout": "界面布局评估",
      "payment": "支付方式评估",
      "support": "客服支持评估"
    }
  },
  "summary": {
    "overallScore": 86,
    "mainIssues": ["主要问题1", "主要问题2"],
    "priorityActions": ["优先改进行动1", "优先改进行动2"]
  }
}
\`\`\`

请确保分析客观、准确，给出具体可操作的建议。
    `;
  }

  // 获取地区信息
  getRegionInfo(region) {
    const regions = {
      'US': {
        name: '美国',
        language: '英语',
        currency: 'USD',
        culture: '多元文化、个人主义、商业导向',
        regulations: 'FTC、COPPA、州级消费者保护法'
      },
      'CN': {
        name: '中国',
        language: '中文',
        currency: 'CNY',
        culture: '集体主义、传统文化重视、移动优先',
        regulations: '网络安全法、消费者权益保护法、广告法'
      },
      'DE': {
        name: '德国',
        language: '德语',
        currency: 'EUR',
        culture: '注重隐私、品质导向、环保意识强',
        regulations: 'GDPR、消费者保护法、竞争法'
      },
      'JP': {
        name: '日本',
        language: '日语',
        currency: 'JPY',
        culture: '礼貌文化、品质追求、细节重视',
        regulations: '个人信息保护法、消费者契约法、景品表示法'
      },
      'KR': {
        name: '韩国',
        language: '韩语',
        currency: 'KRW',
        culture: '集体文化、美容时尚、技术先进',
        regulations: '个人信息保护法、电子商务法、公正交易法'
      },
      'FR': {
        name: '法国',
        language: '法语',
        currency: 'EUR',
        culture: '浪漫文化、奢侈品偏好、文化保护',
        regulations: 'GDPR、消费者法典、朗德法'
      },
      'GB': {
        name: '英国',
        language: '英语',
        currency: 'GBP',
        culture: '传统与现代结合、保守务实',
        regulations: 'UK GDPR、消费者权利法、公平贸易法'
      },
      'AE': {
        name: '阿联酋',
        language: '阿拉伯语',
        currency: 'AED',
        culture: '伊斯兰文化、奢华消费、国际化',
        regulations: '消费者保护法、网络犯罪法、数据保护法'
      }
    };
    
    return regions[region] || regions['US'];
  }

  // 调用AI服务商API
  async callAIProvider(prompt, options = {}) {
    const provider = this.providers[this.currentProvider];
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await this.makeAPIRequest(provider, prompt, options);
        return response;
      } catch (error) {
        console.warn(`AI API调用失败 (尝试 ${attempt}/${this.retryCount}):`, error);
        
        if (attempt === this.retryCount) {
          // 尝试切换到备用服务商
          const fallbackProvider = this.getFallbackProvider();
          if (fallbackProvider && fallbackProvider !== this.currentProvider) {
            console.log(`切换到备用服务商: ${fallbackProvider}`);
            this.currentProvider = fallbackProvider;
            return await this.makeAPIRequest(this.providers[fallbackProvider], prompt, options);
          }
          throw error;
        }
        
        // 等待后重试
        await this.delay(1000 * attempt);
      }
    }
  }

  // 发送API请求
  async makeAPIRequest(provider, prompt, options = {}) {
    const apiKey = await this.getAPIKey(provider.name.toLowerCase());
    
    if (!apiKey) {
      throw new Error(`未找到 ${provider.name} 的API密钥`);
    }

    const requestBody = this.buildRequestBody(provider, prompt, options);
    const headers = this.buildRequestHeaders(provider, apiKey);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(provider.apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API请求失败: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return this.extractResponseContent(provider, data);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // 构建请求体
  buildRequestBody(provider, prompt, options = {}) {
    const baseBody = {
      model: provider.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的跨境电商本地化分析专家，擅长分析网页内容的多地域适配性。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: provider.maxTokens,
      temperature: 0.3
    };

    // 根据不同服务商调整请求格式
    if (provider.name === 'Qwen') {
      return {
        model: provider.model,
        input: {
          messages: baseBody.messages
        },
        parameters: {
          max_tokens: provider.maxTokens,
          temperature: 0.3
        }
      };
    }

    return baseBody;
  }

  // 构建请求头
  buildRequestHeaders(provider, apiKey) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (provider.name === 'DeepSeek' || provider.name === 'GPT-4') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (provider.name === 'GLM-4') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (provider.name === 'Qwen') {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['X-DashScope-SSE'] = 'disable';
    }

    return headers;
  }

  // 提取响应内容
  extractResponseContent(provider, data) {
    if (provider.name === 'Qwen') {
      return data.output?.text || data.output?.choices?.[0]?.message?.content || '';
    }
    
    return data.choices?.[0]?.message?.content || '';
  }

  // 解析AI响应
  parseAIResponse(response, targetRegion) {
    try {
      // 提取JSON内容
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : response;
      
      const parsed = JSON.parse(jsonContent);
      
      // 验证响应格式
      if (!this.validateResponseFormat(parsed)) {
        throw new Error('AI响应格式不符合预期');
      }
      
      return {
        region: targetRegion,
        language: parsed.language || { score: 50, issues: [], suggestions: [] },
        culture: parsed.culture || { score: 50, issues: [], suggestions: [] },
        compliance: parsed.compliance || { score: 50, issues: [], suggestions: [] },
        userExperience: parsed.userExperience || { score: 50, issues: [], suggestions: [] },
        summary: parsed.summary || { overallScore: 50, mainIssues: [], priorityActions: [] },
        aiEnhanced: true
      };
    } catch (error) {
      console.error('解析AI响应失败:', error);
      return this.getFallbackResult(targetRegion);
    }
  }

  // 验证响应格式
  validateResponseFormat(data) {
    const requiredFields = ['language', 'culture', 'compliance', 'userExperience'];
    
    return requiredFields.every(field => {
      return data[field] && 
             typeof data[field].score === 'number' &&
             Array.isArray(data[field].issues) &&
             Array.isArray(data[field].suggestions);
    });
  }

  // 检查缓存
  async checkCache(contentData, targetRegion, options) {
    if (!this.cacheService) return null;
    
    try {
      const cacheKey = `ai-analysis-${targetRegion}`;
      return await this.cacheService.get(contentData, cacheKey, options);
    } catch (error) {
      console.warn('Cache check failed:', error);
      return null;
    }
  }
  
  // 缓存结果
  async cacheResult(contentData, targetRegion, result, options) {
    if (!this.cacheService) return;
    
    try {
      const cacheKey = `ai-analysis-${targetRegion}`;
      await this.cacheService.set(contentData, cacheKey, result, options);
    } catch (error) {
      console.warn('Failed to cache result:', error);
    }
  }

  // 获取API密钥
  async getAPIKey(providerKey) {
    try {
      const result = await chrome.storage.sync.get('apiKeys');
      return result.apiKeys?.[providerKey] || null;
    } catch (error) {
      console.error('获取API密钥失败:', error);
      return null;
    }
  }

  // 获取备用服务商
  getFallbackProvider() {
    // 按优先级顺序尝试备用服务商
    if (this.currentProvider === 'zhipu' && this.providers['deepseek']) {
      return 'deepseek';
    } else if (this.currentProvider === 'deepseek' && this.providers['zhipu']) {
      return 'zhipu';
    }
    
    return null;
  }

  // 获取降级结果
  getFallbackResult(targetRegion) {
    return {
      region: targetRegion,
      language: { score: 70, issues: ['AI分析暂时不可用'], suggestions: ['请稍后重试AI分析'] },
      culture: { score: 70, issues: ['AI分析暂时不可用'], suggestions: ['请稍后重试AI分析'] },
      compliance: { score: 70, issues: ['AI分析暂时不可用'], suggestions: ['请稍后重试AI分析'] },
      userExperience: { score: 70, issues: ['AI分析暂时不可用'], suggestions: ['请稍后重试AI分析'] },
      summary: { overallScore: 70, mainIssues: ['AI服务暂时不可用'], priorityActions: ['请检查网络连接和API设置'] },
      aiEnhanced: false
    };
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 设置当前服务商
  setProvider(providerKey) {
    if (this.providers[providerKey]) {
      this.currentProvider = providerKey;
      console.log(`AI服务商切换为: ${this.providers[providerKey].name}`);
    } else {
      console.warn(`不支持的服务商: ${providerKey}`);
    }
  }

  // 获取可用服务商列表
  getAvailableProviders() {
    return Object.keys(this.providers).map(key => ({
      key,
      name: this.providers[key].name,
      model: this.providers[key].model,
      priority: this.providers[key].priority || 99
    })).sort((a, b) => a.priority - b.priority);
  }

  // 启用隐藏的服务商（管理员功能）
  enableHiddenProvider(providerKey) {
    if (this.hiddenProviders[providerKey]) {
      this.providers[providerKey] = this.hiddenProviders[providerKey];
      delete this.hiddenProviders[providerKey];
      console.log(`已启用服务商: ${this.providers[providerKey].name}`);
      return true;
    }
    return false;
  }
}

// 导出AI分析服务
window.AIAnalysisService = AIAnalysisService;