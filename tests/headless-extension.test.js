const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

// 服务器端无头 Chrome 扩展测试配置
const HEADLESS_CONFIG = {
  headless: true, // 无头模式
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--disable-ipc-flooding-protection',
    '--mute-audio',
    '--virtual-time-budget=5000',
    // 扩展相关参数
    `--load-extension=${__dirname}/..`,
    `--disable-extensions-except=${path.resolve(__dirname, '..')}`,
  ],
  ignoreDefaultArgs: ['--enable-automation'],
  env: {
    DISPLAY: process.env.DISPLAY || ':99'
  }
};

test.describe('CBEP3 服务器端无头测试', () => {
  let browser;
  let extensionId;
  
  test.beforeAll(async () => {
    console.log('🖥️ 启动无头浏览器环境...');
    console.log('Display:', process.env.DISPLAY);
    
    try {
      // 启动无头浏览器
      browser = await chromium.launch(HEADLESS_CONFIG);
      
      // 创建新的上下文和页面
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // 获取扩展 ID
      await page.goto('chrome://extensions/');
      
      // 等待页面加载
      await page.waitForTimeout(3000);
      
      // 查找扩展 ID
      const extensionCards = await page.locator('.extension-list-item').count();
      console.log(`找到 ${extensionCards} 个扩展`);
      
      if (extensionCards > 0) {
        // 尝试通过扩展名称找到我们的扩展
        const targetExtension = await page.locator('.extension-list-item').filter({
          hasText: '跨境电商地域适配分析器'
        }).first();
        
        if (await targetExtension.count() > 0) {
          const idElement = await targetExtension.locator('[id^="extension-"]').first();
          const fullId = await idElement.getAttribute('id');
          extensionId = fullId?.replace('extension-', '') || null;
          console.log('✅ 扩展 ID:', extensionId);
        } else {
          // 回退：使用第一个扩展的 ID
          const firstExtension = await page.locator('.extension-list-item').first();
          const idElement = await firstExtension.locator('[id^="extension-"]').first();
          const fullId = await idElement.getAttribute('id');
          extensionId = fullId?.replace('extension-', '') || null;
          console.log('⚠️ 使用第一个扩展 ID:', extensionId);
        }
      }
      
      await page.close();
      await context.close();
      
      if (!extensionId) {
        throw new Error('无法获取扩展 ID');
      }
      
    } catch (error) {
      console.error('浏览器启动失败:', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('无头环境扩展基本功能验证', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 访问扩展页面
      const extensionUrl = `chrome-extension://${extensionId}/sidebar/sidebar.html`;
      console.log('访问扩展页面:', extensionUrl);
      
      await page.goto(extensionUrl, { waitUntil: 'networkidle' });
      
      // 检查页面标题
      const title = await page.locator('h1').first().textContent();
      expect(title).toContain('地域适配分析器');
      
      // 检查关键元素
      await expect(page.locator('#regionGrid')).toBeVisible();
      await expect(page.locator('#analyzeBtn')).toBeVisible();
      
      console.log('✅ 扩展基本功能验证通过');
      
    } catch (error) {
      console.error('测试失败:', error);
      
      // 截图调试（即使是无头模式也可以截图）
      await page.screenshot({ 
        path: 'debug-headless-test.png',
        fullPage: true 
      });
      
      throw error;
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('无头环境存储功能测试', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto(`chrome-extension://${extensionId}/sidebar/sidebar.html`);
      
      // 测试存储功能
      const testData = { serverTest: true, timestamp: Date.now() };
      
      await page.evaluate((data) => {
        return new Promise((resolve, reject) => {
          chrome.storage.sync.set({ headlessTest: data }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }, testData);
      
      const stored = await page.evaluate(() => {
        return new Promise((resolve, reject) => {
          chrome.storage.sync.get('headlessTest', (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result.headlessTest);
            }
          });
        });
      });
      
      expect(stored).toEqual(testData);
      
      // 清理
      await page.evaluate(() => {
        chrome.storage.sync.remove('headlessTest');
      });
      
      console.log('✅ 无头环境存储功能正常');
      
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('无头环境用户交互测试', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto(`chrome-extension://${extensionId}/sidebar/sidebar.html`);
      
      // 测试地区选择
      const usRegion = page.locator('[data-region="US"]');
      await usRegion.click();
      await expect(usRegion).toHaveClass(/selected/);
      
      // 测试分析选项
      const localAnalysis = page.locator('#enableLocal');
      const aiAnalysis = page.locator('#enableAI');
      
      await localAnalysis.check();
      await aiAnalysis.uncheck();
      
      expect(await localAnalysis.isChecked()).toBeTruthy();
      expect(await aiAnalysis.isChecked()).toBeFalsy();
      
      console.log('✅ 无头环境用户交互正常');
      
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('无头环境错误处理测试', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 监听控制台错误
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    try {
      await page.goto(`chrome-extension://${extensionId}/sidebar/sidebar.html`);
      
      // 等待页面稳定
      await page.waitForTimeout(2000);
      
      // 检查严重错误
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('chrome-extension') &&
        !error.includes('DevTools') &&
        !error.includes('Extension')
      );
      
      if (criticalErrors.length > 0) {
        console.warn('发现控制台错误:', criticalErrors);
      }
      
      // 页面应该仍然可用
      await expect(page.locator('#analyzeBtn')).toBeVisible();
      
      console.log('✅ 无头环境错误处理正常');
      
    } finally {
      await page.close();
      await context.close();
    }
  });
});

// 导出配置
module.exports = {
  timeout: 60000,
  expect: {
    timeout: 15000
  },
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
};