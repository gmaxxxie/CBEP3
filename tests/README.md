# Playwright Chrome Extension Testing

这个目录包含了 CBEP3 Chrome 扩展的自动化测试。

## 测试覆盖范围

### 功能测试
- ✅ 扩展加载和初始化
- ✅ 侧栏开启和功能
- ✅ 设置页面交互
- ✅ 内容脚本注入
- ✅ 分析功能端到端测试
- ✅ Chrome 存储功能
- ✅ 错误处理和恢复

### 测试场景
1. **扩展基础功能**：验证扩展是否正确加载和启用
2. **用户界面**：测试侧栏和设置页面的可用性
3. **核心分析功能**：端到端测试分析流程
4. **数据持久化**：Chrome 存储 API 功能测试
5. **容错性**：网络错误和异常情况的处理

## 运行测试

### 先决条件
```bash
# 安装 Playwright
npm install -D @playwright/test

# 安装浏览器
npx playwright install chromium
```

### 执行测试
```bash
# 运行所有测试
npx playwright test tests/extension.test.js

# 运行特定测试
npx playwright test tests/extension.test.js -g "侧栏功能测试"

# 以调试模式运行
npx playwright test tests/extension.test.js --debug

# 生成测试报告
npx playwright test tests/extension.test.js --reporter=html
```

## 测试结果分析

### 成功指标
- 所有测试用例通过
- 扩展功能正常响应
- 错误处理机制生效
- 用户界面交互流畅

### 失败排查
1. 检查 Chrome 版本兼容性
2. 验证扩展权限设置
3. 确认测试 URL 可访问
4. 检查控制台错误日志

## 注意事项

- 扩展测试需要运行在有头模式（headless: false）
- 测试过程中会自动加载扩展到 Chrome 浏览器
- 某些测试可能需要网络连接
- 建议在隔离环境中运行测试以避免影响开发数据