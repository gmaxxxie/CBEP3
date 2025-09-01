#!/bin/bash
# GitHub推送脚本 - 请在GitHub上创建仓库后运行

echo "🚀 准备推送CBEP3项目到GitHub..."

# 检查当前状态
git status
git log --oneline -1

# 推送到GitHub (需要先在GitHub上创建CBEP3仓库)
echo "📤 推送到 https://github.com/gmaxxxie/CBEP3.git"
git push -u origin main

echo "✅ 推送完成！"
echo "🌐 访问你的项目：https://github.com/gmaxxxie/CBEP3"