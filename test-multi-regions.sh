#!/bin/bash

# 多区域分析测试脚本
echo "🌍 CBEP3 多区域分析测试"
echo "======================================"

regions=("US" "GB" "DE" "CN")

for region in "${regions[@]}"; do
    echo ""
    echo "🔍 正在分析 $region 市场..."
    echo "--------------------------------------"
    
    # 运行特定区域的分析
    TARGET_REGION=$region npx playwright test tests/bloomchic-real.test.js:231 --reporter=line --quiet
    
    if [ $? -eq 0 ]; then
        echo "✅ $region 市场分析完成"
        
        # 重命名结果文件
        if [ -f "bloomchic-ai-analysis.json" ]; then
            mv bloomchic-ai-analysis.json "bloomchic-ai-analysis-$region.json"
            echo "📊 结果保存为: bloomchic-ai-analysis-$region.json"
        fi
    else
        echo "❌ $region 市场分析失败"
    fi
done

echo ""
echo "🎉 多区域分析测试完成！"
echo "======================================"
echo "📂 生成的分析文件："
ls -la bloomchic-ai-analysis-*.json 2>/dev/null || echo "未找到分析文件"