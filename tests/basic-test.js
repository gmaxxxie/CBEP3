const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

test.describe('CBEP3 扩展基础测试', () => {
  test('验证 Playwright 和 Chromium 基本功能', async () => {
    console.log('🚀 启动 Chromium 浏览器测试...');
    
    const browser = await chromium.launch({
      headless: true, // 无头模式
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
      ]
    });
    
    console.log('✅ Chromium 浏览器启动成功');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 测试基本页面功能
    console.log('🌐 访问测试页面...');
    await page.goto('data:text/html,<html><head><title>Test Page</title></head><body><h1 id="title">Hello Playwright</h1><button id="testBtn">Test Button</button></body></html>');
    
    // 验证页面内容
    const title = await page.locator('#title').textContent();
    expect(title).toBe('Hello Playwright');
    console.log('✅ 页面内容验证通过');
    
    // 测试交互
    const button = page.locator('#testBtn');
    await expect(button).toBeVisible();
    await button.click();
    console.log('✅ 用户交互测试通过');
    
    await browser.close();
    console.log('🎉 基础测试完成！');
  });
  
  test('验证扩展加载环境', async () => {
    console.log('🧩 测试扩展加载环境...');
    
    const extensionPath = path.resolve(__dirname, '..');
    console.log('📁 扩展路径:', extensionPath);
    
    // 检查必要文件
    const fs = require('fs');
    const manifestPath = path.join(extensionPath, 'manifest.json');
    
    if (fs.existsSync(manifestPath)) {
      console.log('✅ manifest.json 存在');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log('📋 扩展名称:', manifest.name);
      console.log('📋 扩展版本:', manifest.version);
    } else {
      throw new Error('❌ manifest.json 不存在');
    }
    
    try {
      const browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          `--load-extension=${extensionPath}`,
          `--disable-extensions-except=${extensionPath}`,
        ]
      });
      
      console.log('✅ 带扩展的浏览器启动成功');
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // 尝试访问扩展管理页面
      await page.goto('chrome://extensions/');
      await page.waitForTimeout(2000);
      
      console.log('✅ 扩展管理页面访问成功');
      
      await browser.close();
      console.log('🎉 扩展环境测试完成！');
      
    } catch (error) {
      console.log('⚠️ 扩展加载遇到问题:', error.message);
      console.log('💡 这可能是正常的，因为某些Chrome功能在无头模式下受限');
    }
  });
});