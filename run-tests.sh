#!/bin/bash

echo "🚀 开始 CBEP3 Chrome 扩展自动化测试"
echo "=================================="

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查是否安装了 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm"
    exit 1
fi

echo "📦 检查依赖..."

# 检查是否有 package.json
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到 package.json 文件"
    exit 1
fi

# 检查是否安装了 Playwright
if ! npm list @playwright/test &> /dev/null; then
    echo "📥 安装 Playwright..."
    npm install -D @playwright/test
    
    if [ $? -ne 0 ]; then
        echo "❌ 错误: Playwright 安装失败"
        exit 1
    fi
fi

# 安装 Chromium 浏览器
echo "🌐 安装测试浏览器..."
npx playwright install chromium

if [ $? -ne 0 ]; then
    echo "❌ 错误: 浏览器安装失败"
    exit 1
fi

# 检查扩展文件是否存在
echo "🔍 验证扩展文件..."
required_files=(
    "manifest.json"
    "background/service-worker.js"
    "sidebar/sidebar.html"
    "sidebar/sidebar.js"
    "options/options.html"
    "options/options.js"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 错误: 缺少必要文件 $file"
        exit 1
    fi
done

echo "✅ 扩展文件检查完成"

# 运行测试
echo ""
echo "🧪 开始执行自动化测试..."
echo "=================================="

# 运行核心功能测试
echo "📋 运行核心功能测试..."
npx playwright test tests/core-functionality.test.js --reporter=line

test_result=$?

if [ $test_result -eq 0 ]; then
    echo ""
    echo "🎉 所有测试通过！"
    echo "📊 生成测试报告..."
    npx playwright show-report &
    echo "测试报告将在浏览器中自动打开"
else
    echo ""
    echo "❌ 测试失败，退出代码: $test_result"
    echo "💡 建议："
    echo "  1. 检查扩展是否正确构建"
    echo "  2. 验证Chrome版本兼容性"
    echo "  3. 查看详细错误日志"
    exit $test_result
fi

echo ""
echo "✨ 测试执行完成"