// LLM API 测试脚本 - 浏览器版本
// 在浏览器控制台中运行此脚本来测试API连接

class LLMAPITesterBrowser {
  constructor() {
    this.providers = {
      deepseek: {
        name: 'DeepSeek',
        apiUrl: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat'
      },
      zhipu: {
        name: 'GLM-4', 
        apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        model: 'glm-4'
      },
      qwen: {
        name: 'Qwen',
        apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        model: 'qwen-plus'
      },
      openai: {
        name: 'GPT-4',
        apiUrl: 'https://api.openai.com/v1/chat/completions', 
        model: 'gpt-4'
      }
    };
  }

  async getAPIKey(provider) {
    // 从Chrome存储获取API密钥
    try {
      const result = await chrome.storage.sync.get('apiKeys');
      return result.apiKeys?.[provider] || null;
    } catch (error) {
      console.error('获取API密钥失败:', error);
      return null;
    }
  }

  async testProvider(providerKey, customApiKey = null) {
    const provider = this.providers[providerKey];
    let apiKey = customApiKey || await this.getAPIKey(providerKey);

    console.log(`\n🧪 测试 ${provider.name} (${providerKey})...`);
    
    if (!apiKey) {
      console.log(`❌ 未找到 API 密钥`);
      console.log(`   请在扩展选项页面配置或通过参数传入`);
      return {
        success: false,
        error: '未找到API密钥'
      };
    }

    try {
      const requestBody = this.buildRequestBody(provider);
      const headers = this.buildRequestHeaders(provider, apiKey);

      console.log(`   🔗 正在连接 ${provider.apiUrl}...`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(provider.apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ API 请求失败: ${response.status}`);
        console.log(`   错误详情: ${errorText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const data = await response.json();
      const content = this.extractResponseContent(provider, data);
      
      if (content) {
        console.log(`✅ 连接成功!`);
        console.log(`   模型: ${provider.model}`);
        console.log(`   响应长度: ${content.length} 字符`);
        console.log(`   响应内容: ${content}`);
        return {
          success: true,
          model: provider.model,
          responseLength: content.length,
          content: content
        };
      } else {
        console.log(`❌ 响应格式异常`);
        console.log(`   原始响应:`, data);
        return {
          success: false,
          error: '响应格式异常'
        };
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`❌ 请求超时 (30秒)`);
        return {
          success: false,
          error: '请求超时'
        };
      } else {
        console.log(`❌ 网络错误: ${error.message}`);
        return {
          success: false,
          error: error.message
        };
      }
    }
  }

  buildRequestBody(provider) {
    const testPrompt = "请简单回答：你是哪个AI模型？";

    const baseBody = {
      model: provider.model,
      messages: [
        {
          role: 'user',
          content: testPrompt
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    };

    // Qwen API 使用不同的请求格式
    if (provider.name === 'Qwen') {
      return {
        model: provider.model,
        input: {
          messages: baseBody.messages
        },
        parameters: {
          max_tokens: 100,
          temperature: 0.3
        }
      };
    }

    return baseBody;
  }

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

  extractResponseContent(provider, data) {
    if (provider.name === 'Qwen') {
      return data.output?.text || data.output?.choices?.[0]?.message?.content || '';
    }
    
    return data.choices?.[0]?.message?.content || '';
  }

  async testAllProviders(apiKeys = {}) {
    console.log('🚀 开始测试所有 LLM API 连接...\n');
    
    const results = {};
    
    for (const [key, provider] of Object.entries(this.providers)) {
      results[key] = await this.testProvider(key, apiKeys[key]);
      
      // 避免请求频率过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(50));

    const successful = [];
    const failed = [];

    for (const [key, result] of Object.entries(results)) {
      const provider = this.providers[key];
      if (result.success) {
        successful.push(`✅ ${provider.name}: 正常`);
      } else {
        failed.push(`❌ ${provider.name}: ${result.error}`);
      }
    }

    if (successful.length > 0) {
      console.log('\n✅ 可用服务商:');
      successful.forEach(msg => console.log(`   ${msg}`));
    }

    if (failed.length > 0) {
      console.log('\n❌ 不可用服务商:');
      failed.forEach(msg => console.log(`   ${msg}`));
    }

    console.log(`\n📈 成功率: ${successful.length}/${Object.keys(this.providers).length} (${Math.round(successful.length / Object.keys(this.providers).length * 100)}%)`);

    return results;
  }

  // 便捷测试方法
  async quickTest(provider, apiKey) {
    return await this.testProvider(provider, apiKey);
  }
}

// 全局实例
window.LLMTester = new LLMAPITesterBrowser();

// 使用说明
console.log(`
🔧 LLM API 测试工具已加载

📖 使用方法:
1. 测试单个服务商:
   LLMTester.quickTest('deepseek', 'sk-your-api-key')
   LLMTester.quickTest('zhipu', 'your-zhipu-key')
   LLMTester.quickTest('qwen', 'sk-your-qwen-key')
   LLMTester.quickTest('openai', 'sk-your-openai-key')

2. 测试所有服务商:
   LLMTester.testAllProviders({
     deepseek: 'sk-your-deepseek-key',
     zhipu: 'your-zhipu-key',
     qwen: 'sk-your-qwen-key',
     openai: 'sk-your-openai-key'
   })

3. 使用扩展存储的密钥测试:
   LLMTester.testAllProviders()

💡 提示: 请确保你已经获得相应的API密钥
`);