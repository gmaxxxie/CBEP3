const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// 中间件
app.use(cors({
  origin: '*', // 允许所有来源，Chrome扩展需要
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/api/status', (req, res) => {
  res.json({
    available: true,
    message: '后端服务正常运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API连接测试
app.post('/api/test-connection', (req, res) => {
  const { provider, apiKey } = req.body;
  
  console.log(`Testing connection for provider: ${provider}`);
  
  // 模拟API密钥验证
  if (!apiKey || apiKey.length < 10) {
    return res.json({
      success: false,
      error: 'API密钥格式不正确'
    });
  }
  
  // 模拟成功响应
  res.json({
    success: true,
    provider,
    message: `${provider} API连接测试成功`,
    timestamp: new Date().toISOString()
  });
});

// AI分析端点
app.post('/api/analyze', (req, res) => {
  const { url, title, content, meta, ecommerce, targetRegions } = req.body;
  
  console.log(`Analyzing content for regions: ${targetRegions?.join(', ')}`);
  
  // 模拟分析结果
  const mockResults = {};
  targetRegions?.forEach(region => {
    mockResults[region] = {
      region: getRegionInfo(region),
      overallScore: Math.floor(Math.random() * 30 + 70), // 70-100分
      language: {
        score: Math.floor(Math.random() * 20 + 80),
        issues: generateMockIssues('language', region)
      },
      culture: {
        score: Math.floor(Math.random() * 25 + 75),
        issues: generateMockIssues('culture', region)
      },
      compliance: {
        score: Math.floor(Math.random() * 15 + 85),
        issues: generateMockIssues('compliance', region)
      },
      userExperience: {
        score: Math.floor(Math.random() * 20 + 80),
        issues: generateMockIssues('ux', region)
      },
      recommendations: generateMockRecommendations(region),
      aiEnhanced: true
    };
  });
  
  // 模拟处理时间
  setTimeout(() => {
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      url: url,
      results: mockResults,
      processingTime: Math.floor(Math.random() * 5000 + 2000) // 2-7秒
    });
  }, 1000); // 1秒延迟模拟处理
});

// 批量分析
app.post('/api/analyze/batch', (req, res) => {
  const { requests } = req.body;
  
  if (!Array.isArray(requests) || requests.length === 0) {
    return res.status(400).json({ error: 'requests array is required' });
  }
  
  const batchId = 'batch-' + Date.now();
  
  // 模拟批量处理
  const results = requests.map((request, index) => ({
    requestId: `${batchId}-${index}`,
    status: 'completed',
    result: {
      overallScore: Math.floor(Math.random() * 30 + 70),
      timestamp: new Date().toISOString()
    }
  }));
  
  res.json({
    success: true,
    batchId,
    results,
    completedAt: new Date().toISOString()
  });
});

// 辅助函数
function getRegionInfo(regionCode) {
  const regions = {
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
  return regions[regionCode] || { name: regionCode, currency: 'USD', language: 'en', rtl: false };
}

function generateMockIssues(category, region) {
  const issueTemplates = {
    language: [
      '页面语言与目标地区不匹配',
      '关键术语需要本地化',
      '缺乏多语言切换选项',
      '部分文本内容未翻译'
    ],
    culture: [
      '颜色选择可能存在文化敏感性',
      '图片内容需要文化适配',
      '节日营销内容不符合当地习俗',
      '文本方向不适合该地区语言习惯'
    ],
    compliance: [
      '缺少GDPR合规声明',
      '需要符合当地法规要求',
      '缺少Cookie同意机制',
      '隐私政策需要更新'
    ],
    ux: [
      '页面加载时间过长',
      '移动端适配不足',
      '货币显示不符合当地习惯',
      '地址格式不符合当地标准'
    ]
  };
  
  const templates = issueTemplates[category] || [];
  const issueCount = Math.floor(Math.random() * 3); // 0-2个问题
  
  return templates.slice(0, issueCount);
}

function generateMockRecommendations(region) {
  const recommendations = [
    {
      category: 'language',
      priority: 'high',
      issue: '语言适配性不足',
      suggestion: '建议添加当地语言支持并优化关键术语翻译'
    },
    {
      category: 'culture',
      priority: 'medium',
      issue: '文化适配需要改进',
      suggestion: '考虑当地文化偏好，调整颜色搭配和视觉元素'
    },
    {
      category: 'compliance',
      priority: 'high',
      issue: '合规性风险',
      suggestion: '添加必要的法律声明和隐私政策'
    }
  ];
  
  return recommendations.slice(0, Math.floor(Math.random() * 3) + 1);
}

// 错误处理
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// 启动服务器
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 跨境电商分析API服务器运行在 http://0.0.0.0:${port}`);
  console.log(`📊 状态检查: http://0.0.0.0:${port}/api/status`);
  console.log(`🔧 API测试: POST http://0.0.0.0:${port}/api/test-connection`);
  console.log(`🎯 内容分析: POST http://0.0.0.0:${port}/api/analyze`);
  console.log('服务器已就绪，等待连接...');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});