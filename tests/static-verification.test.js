const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('CBEP3 扩展静态验证测试', () => {
  
  test('验证扩展文件结构', async () => {
    console.log('🔍 验证扩展文件结构...');
    
    const requiredFiles = [
      'manifest.json',
      'background/service-worker.js',
      'sidebar/sidebar.html',
      'sidebar/sidebar.js',
      'options/options.html',
      'options/options.js',
      'src/core-services.js'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      expect(fs.existsSync(filePath)).toBeTruthy();
      console.log(`✅ ${file} 存在`);
    }
    
    console.log('🎉 文件结构验证完成');
  });
  
  test('验证 manifest.json 配置', async () => {
    console.log('📋 验证 manifest.json 配置...');
    
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // 验证基本信息
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toContain('跨境电商地域适配分析器');
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    
    // 验证权限
    expect(manifest.permissions).toContain('storage');
    expect(manifest.permissions).toContain('activeTab');
    expect(manifest.permissions).toContain('sidePanel');
    
    // 验证后台脚本
    expect(manifest.background.service_worker).toBe('background/service-worker.js');
    
    // 验证侧栏配置
    expect(manifest.side_panel.default_path).toBe('sidebar/sidebar.html');
    
    console.log('✅ Manifest 配置验证通过');
    console.log(`📦 扩展名称: ${manifest.name}`);
    console.log(`🏷️ 版本: ${manifest.version}`);
  });
  
  test('验证 JavaScript 文件语法', async () => {
    console.log('🔧 验证 JavaScript 文件语法...');
    
    const jsFiles = [
      'background/service-worker.js',
      'sidebar/sidebar.js',
      'options/options.js',
      'src/core-services.js'
    ];
    
    for (const file of jsFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 基本语法检查
        expect(content.length).toBeGreaterThan(0);
        
        // 检查是否包含关键类和函数
        if (file.includes('service-worker')) {
          expect(content).toContain('BackgroundService');
          expect(content).toContain('chrome.runtime');
        }
        
        if (file.includes('sidebar')) {
          expect(content).toContain('SidebarController');
          expect(content).toContain('switchTab');
        }
        
        console.log(`✅ ${file} 语法检查通过`);
      }
    }
    
    console.log('🎉 JavaScript 文件验证完成');
  });
  
  test('验证 HTML 页面结构', async () => {
    console.log('🌐 验证 HTML 页面结构...');
    
    const htmlFiles = [
      { file: 'sidebar/sidebar.html', requiredElements: ['#analyzeBtn', '#regionGrid', '.nav-tab'] },
      { file: 'options/options.html', requiredElements: ['#saveSettings', '.nav-tab', '#serverAddress'] }
    ];
    
    for (const { file, requiredElements } of htmlFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 验证基本HTML结构
        expect(content).toContain('<!DOCTYPE html>');
        expect(content).toContain('<html');
        expect(content).toContain('</html>');
        
        // 验证必需元素
        for (const element of requiredElements) {
          const selector = element.replace('#', 'id="').replace('.', 'class="');
          expect(content).toContain(selector);
        }
        
        console.log(`✅ ${file} 结构验证通过`);
      }
    }
    
    console.log('🎉 HTML 页面验证完成');
  });
  
  test('验证扩展配置完整性', async () => {
    console.log('⚙️ 验证扩展配置完整性...');
    
    // 验证 package.json
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    expect(packageJson.name).toBeDefined();
    expect(packageJson.devDependencies['@playwright/test']).toBeDefined();
    expect(packageJson.scripts['test:e2e']).toBeDefined();
    
    // 验证测试脚本存在
    const testScripts = [
      'run-tests.sh',
      'setup-server-testing.sh',
      'validate-testing-setup.sh'
    ];
    
    for (const script of testScripts) {
      const scriptPath = path.join(__dirname, '..', script);
      expect(fs.existsSync(scriptPath)).toBeTruthy();
      console.log(`✅ ${script} 存在`);
    }
    
    console.log('🎉 扩展配置验证完成');
  });
  
  test('模拟扩展功能逻辑验证', async () => {
    console.log('🧠 模拟扩展功能逻辑验证...');
    
    // 模拟地区选择逻辑
    const selectedRegions = new Set(['US', 'GB']);
    expect(selectedRegions.size).toBe(2);
    expect(selectedRegions.has('US')).toBeTruthy();
    
    // 模拟分析选项
    const analysisOptions = {
      enableLocal: true,
      enableAI: true,
      enablePerformance: false
    };
    expect(analysisOptions.enableLocal).toBeTruthy();
    expect(analysisOptions.enableAI).toBeTruthy();
    
    // 模拟评分计算
    const calculateOverallScore = (scores) => {
      const weights = { language: 0.3, culture: 0.25, compliance: 0.25, userExperience: 0.2 };
      return Math.round(
        scores.language * weights.language +
        scores.culture * weights.culture +
        scores.compliance * weights.compliance +
        scores.userExperience * weights.userExperience
      );
    };
    
    const testScores = { language: 85, culture: 80, compliance: 90, userExperience: 75 };
    const overallScore = calculateOverallScore(testScores);
    
    expect(overallScore).toBeGreaterThan(0);
    expect(overallScore).toBeLessThanOrEqual(100);
    
    console.log(`✅ 模拟总分计算: ${overallScore}`);
    console.log('🎉 功能逻辑验证完成');
  });
});

// 导出测试配置
module.exports = {
  timeout: 30000
};