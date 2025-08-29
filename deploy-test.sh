#!/bin/bash

# Chrome扩展测试部署脚本

echo "🚀 开始部署Chrome扩展进行测试..."

# 1. 检查必要文件
echo "📁 检查项目文件结构..."
if [ ! -f "manifest.json" ]; then
    echo "❌ manifest.json 文件缺失"
    exit 1
fi

if [ ! -d "src" ]; then
    echo "❌ src 目录缺失"
    exit 1
fi

if [ ! -d "data" ]; then
    echo "❌ data 目录缺失"
    exit 1
fi

echo "✅ 项目文件结构检查通过"

# 2. 验证manifest.json
echo "📝 验证manifest.json..."
node -e "
try {
    const manifest = require('./manifest.json');
    if (manifest.manifest_version !== 3) {
        throw new Error('需要Manifest V3');
    }
    console.log('✅ Manifest验证通过');
    console.log('   扩展名称:', manifest.name);
    console.log('   版本:', manifest.version);
} catch (error) {
    console.error('❌ Manifest验证失败:', error.message);
    process.exit(1);
}
"

# 3. 创建测试数据
echo "📊 准备测试数据..."
if [ ! -f "data/sources/countries.json" ]; then
    echo "⚠️  国家数据文件缺失，将影响本地分析功能"
fi

# 4. 检查权限配置
echo "🔒 检查权限配置..."
echo "   需要的权限: activeTab, storage, scripting, tabs"
echo "   主机权限: https://*/*"

# 5. 生成加载说明
cat > TESTING_GUIDE.md << 'EOF'
# Chrome扩展测试指南

## 加载扩展步骤

1. **打开Chrome扩展管理页面**
   - 地址栏输入: `chrome://extensions/`
   - 或者: 菜单 → 更多工具 → 扩展程序

2. **启用开发者模式**
   - 右上角切换"开发者模式"开关

3. **加载未打包的扩展程序**
   - 点击"加载已解压的扩展程序"
   - 选择项目根目录 (包含manifest.json的目录)

4. **验证加载成功**
   - 扩展列表中出现"跨境电商地域适配分析器"
   - 浏览器工具栏出现扩展图标

## 功能测试清单

### 基础功能测试
- [ ] 扩展图标显示正常
- [ ] 点击图标打开Popup界面
- [ ] Popup界面显示完整
- [ ] 地区选择功能正常
- [ ] 分析按钮可点击

### 内容分析测试
建议测试网站:
1. **亚马逊** - https://amazon.com
2. **淘宝** - https://taobao.com  
3. **Shopify示例店** - https://checkout.shopify.com
4. **独立电商站** - 任意电商网站

测试步骤:
1. 访问测试网站
2. 点击扩展图标
3. 选择目标地区 (美国、英国、德国等)
4. 点击"开始分析"
5. 等待分析完成
6. 查看分析结果

### 报告功能测试
- [ ] HTML报告生成
- [ ] PDF报告导出
- [ ] CSV数据导出
- [ ] 报告内容完整性

### 设置页面测试
- [ ] 右键扩展图标 → 选项
- [ ] 设置页面正常显示
- [ ] AI供应商配置
- [ ] API密钥设置

## 问题排查

### 控制台日志查看
1. **扩展页面**: `chrome://extensions/`
2. **点击**: 扩展详情 → "查看视图" → background.html
3. **打开**: 开发者工具 → Console标签

### 内容脚本日志
1. **访问**: 任意网页
2. **按F12**: 打开开发者工具
3. **Console标签**: 查看内容脚本日志

### 常见问题
1. **分析无响应**: 检查网络连接和API密钥
2. **页面数据提取失败**: 查看控制台错误信息
3. **PDF导出失败**: 可能需要允许弹窗权限

## 测试数据记录

请记录以下测试数据:
- 测试网站URL
- 选择的目标地区  
- 分析耗时
- 发现的问题
- 分析结果准确性

EOF

echo "✅ 测试指南已生成: TESTING_GUIDE.md"

# 6. 最终检查提示
echo ""
echo "🎯 Chrome扩展测试部署完成!"
echo ""
echo "📋 下一步操作:"
echo "   1. 阅读 TESTING_GUIDE.md"
echo "   2. 在Chrome中加载扩展"
echo "   3. 访问电商网站测试功能"
echo "   4. 记录测试结果和问题"
echo ""
echo "⚠️  注意事项:"
echo "   - 首次使用需要配置AI API密钥"
echo "   - 某些功能需要网络连接"
echo "   - 建议在开发者模式下测试"
echo ""