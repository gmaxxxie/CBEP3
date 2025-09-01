#!/bin/bash
# 服务器端 Chrome 扩展测试环境设置脚本

echo "🖥️ 设置服务器端 Chrome 扩展测试环境"
echo "========================================="

# 检查操作系统
if [[ "$OSTYPE" == "linux"* ]]; then
    echo "✅ Linux 系统检测到"
else
    echo "❌ 此脚本仅支持 Linux 服务器"
    exit 1
fi

# 1. 安装必要的系统依赖
echo "📦 安装系统依赖..."
sudo apt-get update
sudo apt-get install -y \
    wget \
    gnupg \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    curl \
    xvfb \
    x11vnc \
    fluxbox \
    dbus-x11

# 2. 安装 Google Chrome
echo "🌐 安装 Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# 3. 验证 Chrome 安装
CHROME_VERSION=$(google-chrome --version)
echo "✅ Chrome 版本: $CHROME_VERSION"

# 4. 安装 Node.js 和 npm（如果尚未安装）
if ! command -v node &> /dev/null; then
    echo "📥 安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "✅ Node.js 版本: $NODE_VERSION"
echo "✅ npm 版本: $NPM_VERSION"

# 5. 创建虚拟显示器服务
echo "🖼️ 设置虚拟显示器..."
cat > /tmp/xvfb.service << EOF
[Unit]
Description=Virtual Frame Buffer X Server
After=network.target

[Service]
ExecStart=/usr/bin/Xvfb :99 -ac -screen 0 1280x1024x16 -nolisten tcp
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
EOF

sudo cp /tmp/xvfb.service /etc/systemd/system/
sudo systemctl enable xvfb
sudo systemctl start xvfb

# 6. 设置显示器环境变量
export DISPLAY=:99
echo "export DISPLAY=:99" >> ~/.bashrc

# 7. 创建测试运行脚本
cat > run-headless-tests.sh << 'EOF'
#!/bin/bash

echo "🚀 启动无头 Chrome 扩展测试"
echo "=========================="

# 设置显示器
export DISPLAY=:99

# 检查 Xvfb 是否运行
if ! pgrep -x "Xvfb" > /dev/null; then
    echo "启动虚拟显示器..."
    Xvfb :99 -ac -screen 0 1280x1024x16 -nolisten tcp &
    sleep 3
fi

# 检查 Chrome 是否可以启动
echo "🔍 测试 Chrome 启动..."
timeout 10s google-chrome --headless --no-sandbox --disable-gpu --remote-debugging-port=9222 --version
if [ $? -eq 0 ]; then
    echo "✅ Chrome 无头模式正常"
else
    echo "❌ Chrome 启动失败"
    exit 1
fi

# 安装 Playwright 依赖
if [ ! -d "node_modules/@playwright" ]; then
    echo "📦 安装 Playwright..."
    npm install -D @playwright/test
    npx playwright install chromium
fi

# 运行扩展测试
echo "🧪 执行扩展测试..."
npx playwright test tests/headless-extension.test.js --reporter=line

test_result=$?

if [ $test_result -eq 0 ]; then
    echo "🎉 测试通过！"
else
    echo "❌ 测试失败"
    exit $test_result
fi
EOF

chmod +x run-headless-tests.sh

echo ""
echo "🎉 服务器端测试环境设置完成！"
echo ""
echo "使用方法："
echo "  1. 运行测试: ./run-headless-tests.sh"
echo "  2. 或直接: DISPLAY=:99 npm run test:e2e"
echo ""
echo "调试选项："
echo "  - 查看 Chrome 进程: ps aux | grep chrome"
echo "  - 检查显示器: echo \$DISPLAY"
echo "  - VNC 查看器: 安装 x11vnc 并连接到 :99"