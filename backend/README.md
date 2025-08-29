# Cross-Border E-commerce Analysis Backend API

## 项目概述

这是跨境电商内容分析系统的后端API服务，为Chrome扩展提供AI分析、动态规则管理、用户行为追踪等功能支持。

## 功能特性

### 🤖 AI分析服务
- 多AI模型集成（DeepSeek、GLM-4、Qwen、GPT-4）
- 智能负载均衡和故障转移
- 异步分析处理和结果轮询
- 批量分析支持

### 📊 动态规则配置
- 实时规则更新和版本管理
- A/B测试支持
- 规则导入导出
- 多地区规则适配

### 👤 用户行为分析
- 实时行为追踪
- 用户画像生成
- 行为模式识别
- 个性化推荐

### 🚀 高性能架构
- Redis缓存层
- MongoDB数据持久化
- 请求速率限制
- 压缩和优化

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MongoDB >= 5.0
- Redis >= 6.0

### 安装依赖
```bash
npm install
```

### 环境变量配置
创建 `.env` 文件：
```env
# 服务配置
PORT=3000
NODE_ENV=development

# 数据库配置
MONGODB_URL=mongodb://localhost:27017/crossborder-analysis
REDIS_URL=redis://localhost:6379

# API密钥
API_KEYS=demo-key-123,extension-key-456

# AI服务配置
DEEPSEEK_API_KEY=your-deepseek-key
ZHIPU_API_KEY=your-zhipu-key
QWEN_API_KEY=your-qwen-key
OPENAI_API_KEY=your-openai-key

# 安全配置
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# 限流配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 启动开发服务器
```bash
npm run dev
```

### 启动生产服务器
```bash
npm start
```

## API文档

### 基础信息
- **Base URL**: `http://localhost:3000/api`
- **认证方式**: API Key (Header: `X-API-Key`)
- **响应格式**: JSON

### 健康检查
```http
GET /health
```

### AI分析服务

#### 执行AI分析
```http
POST /api/analysis/ai
Content-Type: application/json
X-API-Key: your-api-key

{
  "contentData": {
    "url": "https://example.com",
    "title": "Example Page",
    "text": {...},
    "images": [...],
    "meta": {...}
  },
  "targetRegions": ["US", "GB", "DE"],
  "options": {
    "includeDeepAnalysis": true,
    "aiProvider": "deepseek"
  }
}
```

**响应:**
```json
{
  "success": true,
  "analysisId": "analysis-1234567890-abc",
  "status": "processing",
  "estimatedTime": 15000,
  "resultUrl": "/api/analysis/ai/analysis-1234567890-abc"
}
```

#### 获取分析结果
```http
GET /api/analysis/ai/{analysisId}
X-API-Key: your-api-key
```

#### 批量AI分析
```http
POST /api/analysis/ai/batch
Content-Type: application/json
X-API-Key: your-api-key

{
  "requests": [
    {
      "contentData": {...},
      "targetRegions": ["US"],
      "options": {...}
    },
    ...
  ]
}
```

### 规则配置管理

#### 获取所有规则
```http
GET /api/rules?category=language&region=US
X-API-Key: your-api-key
```

#### 创建规则
```http
POST /api/rules
Content-Type: application/json
X-API-Key: your-api-key

{
  "name": "新语言检查规则",
  "category": "language",
  "priority": "high",
  "enabled": true,
  "weight": 25,
  "conditions": {...},
  "actions": {...},
  "regions": ["*"]
}
```

#### 更新规则
```http
PUT /api/rules/{ruleId}
Content-Type: application/json
X-API-Key: your-api-key

{
  "enabled": false,
  "weight": 30
}
```

#### 删除规则
```http
DELETE /api/rules/{ruleId}
X-API-Key: your-api-key
```

### 用户行为追踪

#### 记录用户行为
```http
POST /api/behavior/track
Content-Type: application/json
X-API-Key: your-api-key

{
  "type": "page_view",
  "properties": {
    "url": "https://example.com",
    "region": "US",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 批量记录行为
```http
POST /api/behavior/track/batch
Content-Type: application/json
X-API-Key: your-api-key

{
  "behaviors": [
    {
      "type": "analysis_started",
      "properties": {...}
    },
    ...
  ]
}
```

#### 获取行为分析
```http
GET /api/behavior/analysis?timeRange=7d&region=US
X-API-Key: your-api-key
```

#### 获取行为洞察
```http
GET /api/behavior/insights?region=US&timeRange=30d
X-API-Key: your-api-key
```

### 缓存管理

#### 获取缓存统计
```http
GET /api/cache/stats
X-API-Key: your-api-key
```

#### 清除缓存
```http
DELETE /api/cache?pattern=analysis-*
X-API-Key: your-api-key
```

#### 预热缓存
```http
POST /api/cache/warmup
Content-Type: application/json
X-API-Key: your-api-key

{
  "patterns": ["common-analysis-*", "rules-*"]
}
```

### 系统分析

#### 获取系统报告
```http
GET /api/analytics/system
X-API-Key: your-api-key
```

#### 获取使用统计
```http
GET /api/analytics/usage?timeRange=7d&groupBy=day
X-API-Key: your-api-key
```

## 错误处理

### HTTP状态码
- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源未找到
- `429` - 请求频率超限
- `500` - 服务器内部错误

### 错误响应格式
```json
{
  "error": "错误描述",
  "code": "ERROR_CODE",
  "details": {...},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 部署

### Docker部署
```bash
# 构建镜像
npm run docker:build

# 运行容器
npm run docker:run
```

### Docker Compose
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URL=mongodb://mongo:27017/crossborder
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
  
  mongo:
    image: mongo:5
    volumes:
      - mongo_data:/data/db
  
  redis:
    image: redis:6-alpine

volumes:
  mongo_data:
```

### PM2部署
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start api-server.js --name "crossborder-api"

# 查看状态
pm2 status

# 查看日志
pm2 logs crossborder-api
```

## 监控和日志

### 日志级别
- `error` - 错误信息
- `warn` - 警告信息
- `info` - 一般信息
- `debug` - 调试信息

### 监控指标
- 请求响应时间
- 错误率统计
- API调用频率
- 缓存命中率
- 数据库连接状态

### 健康检查端点
```http
GET /health
```

响应示例：
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "mongodb": true,
    "redis": true,
    "aiProviders": {
      "deepseek": true,
      "zhipu": false
    }
  },
  "uptime": 3600,
  "version": "1.0.0"
}
```

## 开发指南

### 目录结构
```
backend/
├── api-server.js           # 主服务器文件
├── package.json            # 项目配置
├── README.md              # 项目文档
├── controllers/           # 控制器
├── models/               # 数据模型
├── middlewares/          # 中间件
├── routes/              # 路由定义
├── services/           # 业务逻辑服务
├── utils/             # 工具函数
├── config/           # 配置文件
├── tests/           # 测试文件
└── docs/           # API文档
```

### 编码规范
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 RESTful API 设计原则
- 使用 JSDoc 注释

### 测试
```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --grep "AI Analysis"

# 生成测试覆盖率报告
npm test -- --coverage
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目主页: [GitHub Repository](https://github.com/crossborder-analysis/backend)
- 问题反馈: [Issues](https://github.com/crossborder-analysis/backend/issues)
- 邮箱: team@crossborder-analysis.com

---

© 2024 Cross-Border E-commerce Analysis Team