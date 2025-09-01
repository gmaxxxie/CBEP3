const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

test.describe('CBEP3 核心功能测试', () => {
  let browser;
  let extensionId;
  
  test.beforeAll(async () => {
    console.log('启动带有扩展的浏览器...');
    
    // 启动持久化上下文（模拟真实用户环境）
    browser = await chromium.launchPersistentContext('./test-profile', {
      headless: false,
      args: [
        `--load-extension=${__dirname}/..`,
        '--disable-extensions-except=' + path.resolve(__dirname, '..'),
        '--no-sandbox',
        '--disable-dev-shm-usage'
      ],
      slowMo: 500
    });
    
    // 等待扩展加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 获取扩展 ID
    const page = await browser.newPage();
    await page.goto('chrome://extensions/');
    
    // 查找我们的扩展
    const extensionCard = await page.locator('.extension-list-item').filter({
      hasText: '跨境电商地域适配分析器'
    }).first();
    
    if (await extensionCard.count() > 0) {
      const idElement = await extensionCard.locator('[id^="extension-"]');
      const fullId = await idElement.getAttribute('id');
      extensionId = fullId.replace('extension-', '');
      console.log('扩展 ID:', extensionId);
    } else {
      throw new Error('未找到扩展');
    }
    
    await page.close();
  });

  test.afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('验证扩展基本功能', async () => {
    const page = await browser.newPage();
    
    // 测试扩展页面可以正常访问
    await page.goto(`chrome-extension://${extensionId}/sidebar/sidebar.html`);
    
    // 检查标题
    const title = await page.locator('h1').textContent();
    expect(title).toContain('地域适配分析器');
    
    // 检查关键元素是否存在
    await expect(page.locator('#regionGrid')).toBeVisible();
    await expect(page.locator('#analyzeBtn')).toBeVisible();
    await expect(page.locator('.nav-tab')).toBeVisible();
    
    console.log('✅ 扩展基本功能验证通过');
    await page.close();
  });

  test('测试区域选择功能', async () => {
    const page = await browser.newPage();
    await page.goto(`chrome-extension://${extensionId}/sidebar/sidebar.html`);
    
    // 选择美国地区
    const usRegion = page.locator('[data-region="US"]');
    await usRegion.click();
    await expect(usRegion).toHaveClass(/selected/);
    
    // 选择德国地区  
    const deRegion = page.locator('[data-region="DE"]');
    await deRegion.click();
    await expect(deRegion).toHaveClass(/selected/);
    
    // 取消选择美国
    await usRegion.click();
    await expect(usRegion).not.toHaveClass(/selected/);
    
    console.log('✅ 区域选择功能正常');
    await page.close();
  });

  test('测试设置页面功能', async () => {
    const page = await browser.newPage();
    await page.goto(`chrome-extension://${extensionId}/options/options.html`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    const pageTitle = await page.locator('h1').first().textContent();
    expect(pageTitle).toContain('跨境电商地域适配分析器');
    
    // 测试导航标签切换
    const settingsTab = page.locator('[data-tab="settings"]');
    await settingsTab.click();
    
    const settingsContent = page.locator('#settings');
    await expect(settingsContent).toHaveClass(/active/);
    
    // 测试服务器地址设置
    const serverInput = page.locator('#serverAddress');
    await serverInput.fill('http://localhost:3000');
    
    // 保存设置
    const saveButton = page.locator('#saveSettings');
    await saveButton.click();
    
    // 等待保存完成
    await page.waitForTimeout(1000);
    
    console.log('✅ 设置页面功能正常');
    await page.close();
  });

  test('测试分析选项配置', async () => {
    const page = await browser.newPage();
    await page.goto(`chrome-extension://${extensionId}/sidebar/sidebar.html`);
    
    // 测试本地分析选项
    const localAnalysis = page.locator('#enableLocal');
    await localAnalysis.uncheck();
    expect(await localAnalysis.isChecked()).toBeFalsy();
    
    await localAnalysis.check();
    expect(await localAnalysis.isChecked()).toBeTruthy();
    
    // 测试AI分析选项
    const aiAnalysis = page.locator('#enableAI');
    await aiAnalysis.uncheck();
    expect(await aiAnalysis.isChecked()).toBeFalsy();
    
    await aiAnalysis.check();
    expect(await aiAnalysis.isChecked()).toBeTruthy();
    
    console.log('✅ 分析选项配置功能正常');
    await page.close();
  });

  test('测试存储功能', async () => {
    const page = await browser.newPage();
    await page.goto(`chrome-extension://${extensionId}/sidebar/sidebar.html`);
    
    // 测试数据存储和读取
    const testData = { test: 'playwright-test', timestamp: Date.now() };
    
    // 存储数据
    await page.evaluate((data) => {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.set({ playwrightTest: data }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }, testData);
    
    // 读取数据
    const storedData = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.get('playwrightTest', (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result.playwrightTest);
          }
        });
      });
    });
    
    expect(storedData).toEqual(testData);
    
    // 清理测试数据
    await page.evaluate(() => {
      chrome.storage.sync.remove('playwrightTest');
    });
    
    console.log('✅ Chrome存储功能正常');
    await page.close();
  });

  test('测试错误处理', async () => {
    const page = await browser.newPage();
    
    // 监听控制台错误
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(`chrome-extension://${extensionId}/sidebar/sidebar.html`);
    
    // 等待页面稳定
    await page.waitForTimeout(2000);
    
    // 检查是否有严重错误
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Extension') && 
      !error.includes('chrome-extension') &&
      !error.includes('DevTools')
    );
    
    if (criticalErrors.length > 0) {
      console.warn('发现控制台错误:', criticalErrors);
    }
    
    // 页面应该仍然可用
    await expect(page.locator('#analyzeBtn')).toBeVisible();
    
    console.log('✅ 错误处理测试完成');
    await page.close();
  });
});

// 导出测试配置
module.exports = {
  timeout: 30000,
  expect: {
    timeout: 10000
  }
};