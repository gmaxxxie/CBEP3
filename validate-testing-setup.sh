#!/bin/bash

echo "🔬 CBEP3 服务器端测试可行性验证"
echo "================================="

# 检查操作系统
if [[ "$OSTYPE" == "linux"* ]]; then
    echo "✅ Linux 系统检测通过"
else
    echo "❌ 非 Linux 系统，某些功能可能不可用"
fi

# 检查基础命令
echo ""
echo "🔍 检查系统命令..."

commands=("node" "npm" "curl" "wget")
for cmd in "${commands[@]}"; do
    if command -v $cmd &> /dev/null; then
        echo "✅ $cmd: $(which $cmd)"
    else
        echo "❌ $cmd: 未安装"
    fi
done

# 检查是否可以安装 Xvfb
echo ""
echo "🖼️ 检查虚拟显示器支持..."

if command -v apt-get &> /dev/null; then
    echo "✅ apt-get 可用，可以安装 Xvfb"
    
    # 模拟安装过程（不实际安装）
    echo "模拟安装命令："
    echo "  sudo apt-get install -y xvfb google-chrome-stable"
    
elif command -v yum &> /dev/null; then
    echo "✅ yum 可用，可以安装相关包"
    echo "模拟安装命令："
    echo "  sudo yum install -y xorg-x11-server-Xvfb google-chrome-stable"
    
else
    echo "⚠️ 未检测到包管理器，需要手动安装"
fi

# 检查 Docker 支持
echo ""
echo "🐳 检查 Docker 支持..."

if command -v docker &> /dev/null; then
    echo "✅ Docker: $(docker --version)"
    
    # 检查 Docker 权限
    if docker ps &> /dev/null; then
        echo "✅ Docker 权限正常"
    else
        echo "⚠️ Docker 权限可能需要 sudo"
    fi
else
    echo "❌ Docker 未安装"
fi

# 检查网络连接
echo ""
echo "🌐 检查网络连接..."

if curl -s --head https://www.google.com | head -n 1 | grep -q "200 OK"; then
    echo "✅ 网络连接正常"
else
    echo "⚠️ 网络连接可能有问题"
fi

# 检查项目文件
echo ""
echo "📁 检查项目文件..."

required_files=(
    "manifest.json"
    "package.json"
    "tests/headless-extension.test.js"
    "Dockerfile.testing"
    "playwright.config.js"
)

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file (缺失)"
    fi
done

# 生成测试脚本
echo ""
echo "📋 生成快速测试脚本..."

cat > quick-test-validation.sh << 'EOF'
#!/bin/bash

echo "🚀 快速验证测试 (模拟模式)"

# 模拟启动 Xvfb
echo "启动虚拟显示器..."
export DISPLAY=:99
echo "export DISPLAY=:99"

# 模拟安装 npm 依赖
echo "安装测试依赖..."
echo "npm install -D @playwright/test (模拟)"

# 模拟运行测试
echo "运行扩展测试..."
echo "npx playwright test tests/headless-extension.test.js (模拟)"

echo "✅ 模拟测试完成"
echo ""
echo "实际部署时需要："
echo "1. sudo apt-get install -y xvfb google-chrome-stable"
echo "2. npm install -D @playwright/test"  
echo "3. npx playwright install chromium"
echo "4. export DISPLAY=:99 && Xvfb :99 &"
echo "5. npm run test:e2e"
EOF

chmod +x quick-test-validation.sh

echo "✅ 快速测试脚本已生成: quick-test-validation.sh"

# 输出总结
echo ""
echo "📊 验证总结"
echo "=========="

echo "推荐解决方案优先级:"
echo "1. 🥇 无头 Chrome + Xvfb (适合大多数服务器)"
echo "2. 🥈 Docker 容器化测试 (适合容器化环境)" 
echo "3. 🥉 云端 CI/CD 测试 (适合代码仓库集成)"

echo ""
echo "下一步行动:"
echo "1. 运行 ./setup-server-testing.sh 安装服务器环境"
echo "2. 或使用 Docker: docker build -f Dockerfile.testing -t cbep3-test ."
echo "3. 或集成到 GitHub Actions 使用云端测试"

echo ""
echo "💡 如需帮助，请查看 HYBRID-TESTING-STRATEGY.md 文档"