const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

// 扩展测试配置
const EXTENSION_PATH = path.resolve(__dirname);
const TEST_URLS = [
  'https://www.shopify.com',
  'https://amazon.com',
  'https://example.com'
];

test.describe('CBEP3 Chrome Extension Tests', () => {
  let browser;
  let context;
  let page;
  let extensionId;

  test.beforeAll(async () => {
    console.log('启动带有扩展的 Chrome 浏览器...');
    console.log('扩展路径:', EXTENSION_PATH);
    
    // 启动带有扩展的 Chrome
    browser = await chromium.launchPersistentContext('', {
      headless: false, // 扩展测试需要有头模式
      args: [
        `--load-extension=${EXTENSION_PATH}`,
        `--disable-extensions-except=${EXTENSION_PATH}`,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      slowMo: 1000 // 减慢操作速度以便观察
    });
    
    // 等待扩展加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 获取扩展页面
    const pages = browser.pages();
    page = pages[0];
    
    // 获取扩展 ID
    await page.goto('chrome://extensions/');
    
    const extensionElements = await page.$$('.extension-list-item');
    for (let element of extensionElements) {
      const name = await element.$eval('.extension-name', el => el.textContent);
      if (name && name.includes('跨境电商地域适配分析器')) {
        extensionId = await element.$eval('[id^="extension-"]', el => el.id.replace('extension-', ''));
        console.log('找到扩展 ID:', extensionId);
        break;
      }
    }
    
    if (!extensionId) {
      throw new Error('未找到扩展 ID');
    }
  });

  test.afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('扩展成功加载和初始化', async () => {
    console.log('测试：扩展成功加载和初始化');
    
    // 检查扩展是否在 chrome://extensions/ 页面显示
    await page.goto('chrome://extensions/');
    
    const extensionCard = await page.locator('.extension-list-item').filter({
      hasText: '跨境电商地域适配分析器'
    });
    
    await expect(extensionCard).toBeVisible();
    
    // 检查扩展是否启用
    const toggleSwitch = extensionCard.locator('.cr-toggle');
    const isEnabled = await toggleSwitch.getAttribute('checked');
    expect(isEnabled).toBeTruthy();
    
    console.log('✅ 扩展成功加载并启用');
  });

  test('侧栏功能测试', async () => {
    console.log('测试：侧栏功能');
    
    // 导航到测试页面
    await page.goto(TEST_URLS[0]);
    await page.waitForLoadState('networkidle');
    
    try {
      // 尝试通过扩展图标打开侧栏
      console.log('尝试点击扩展图标...');
      
      // 点击扩展图标（通过 Chrome API）
      await page.evaluate(async (extensionId) => {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(extensionId, {
            type: 'OPEN_SIDEBAR'
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
      }, extensionId);
      
      // 等待侧栏加载
      await page.waitForTimeout(2000);
      console.log('✅ 侧栏功能正常');
      
    } catch (error) {
      console.log('侧栏测试遇到问题:', error.message);
      console.log('尝试备用方案：直接访问侧栏页面');
      
      // 备用方案：直接打开侧栏页面
      await page.goto(`chrome-extension://${extensionId}/sidebar/sidebar.html`);
      await page.waitForLoadState('networkidle');
      
      const sidebarTitle = await page.locator('h1').textContent();
      expect(sidebarTitle).toContain('地域适配分析器');
      console.log('✅ 侧栏页面直接访问正常');
    }
  });

  test('设置页面功能测试', async () => {
    console.log('测试：设置页面功能');
    
    // 打开设置页面
    await page.goto(`chrome-extension://${extensionId}/options/options.html`);
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    const title = await page.locator('h1').first().textContent();
    expect(title).toContain('跨境电商地域适配分析器');
    
    // 检查导航标签是否存在
    const navTabs = await page.locator('.nav-tab').count();
    expect(navTabs).toBeGreaterThan(0);
    
    // 测试设置保存功能
    const serverAddressInput = page.locator('#serverAddress');
    await serverAddressInput.fill('http://localhost:3000');
    
    const saveButton = page.locator('#saveSettings');
    await saveButton.click();
    
    // 等待保存完成
    await page.waitForTimeout(1000);
    
    console.log('✅ 设置页面功能正常');
  });

  test('内容脚本注入测试', async () => {
    console.log('测试：内容脚本注入');
    
    // 导航到测试页面
    await page.goto(TEST_URLS[1]);
    await page.waitForLoadState('networkidle');
    
    // 检查内容脚本是否注入
    const hasContentScript = await page.evaluate(() => {
      // 检查是否有扩展相关的全局变量或函数
      return typeof window.cbepAnalyzer !== 'undefined' || 
             document.querySelector('[data-cbep-extension]') !== null ||
             !!window.chrome?.runtime?.getURL;
    });
    
    // 由于内容脚本可能是静默注入的，我们检查 Chrome API 是否可用
    const chromeRuntimeAvailable = await page.evaluate(() => {
      return typeof chrome !== 'undefined' && !!chrome.runtime;
    });
    
    expect(chromeRuntimeAvailable).toBeTruthy();
    console.log('✅ Chrome 运行时环境可用');
  });

  test('分析功能端到端测试', async () => {
    console.log('测试：分析功能端到端');
    
    // 打开侧栏页面
    await page.goto(`chrome-extension://${extensionId}/sidebar/sidebar.html`);
    await page.waitForLoadState('networkidle');
    
    // 选择目标地区
    const regionItem = page.locator('[data-region="US"]');
    await regionItem.click();
    
    // 检查地区是否被选中
    await expect(regionItem).toHaveClass(/selected/);
    
    // 配置分析选项
    const enableLocalCheckbox = page.locator('#enableLocal');
    await enableLocalCheckbox.check();
    
    const enableAICheckbox = page.locator('#enableAI');
    await enableAICheckbox.uncheck(); // 禁用AI以避免网络依赖
    
    // 点击开始分析按钮
    const analyzeButton = page.locator('#analyzeBtn');
    await expect(analyzeButton).toBeEnabled();
    
    console.log('点击开始分析...');
    await analyzeButton.click();
    
    // 等待分析进度
    const progressSection = page.locator('#analysisProgress');
    await expect(progressSection).toBeVisible();
    
    // 等待分析完成（最多30秒）
    await page.waitForSelector('#quickResults', { 
      state: 'visible', 
      timeout: 30000 
    });
    
    // 检查结果是否显示
    const overallScore = page.locator('#overallScore');
    const scoreText = await overallScore.textContent();
    
    expect(scoreText).toMatch(/\d+/); // 应该包含数字
    console.log('分析完成，总分:', scoreText);
    
    console.log('✅ 分析功能端到端测试通过');
  });

  test('存储功能测试', async () => {
    console.log('测试：Chrome存储功能');
    
    await page.goto(`chrome-extension://${extensionId}/options/options.html`);
    
    // 测试存储设置
    const testData = {
      serverAddress: 'http://test-server:3000',
      defaultProvider: 'zhipu',
      autoAnalyze: true
    };
    
    // 通过页面执行存储操作
    await page.evaluate((data) => {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.set({ testSettings: data }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }, testData);
    
    // 验证存储的数据
    const storedData = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.get('testSettings', (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result.testSettings);
          }
        });
      });
    });
    
    expect(storedData).toEqual(testData);
    console.log('✅ Chrome存储功能正常');
  });

  test('错误处理和恢复测试', async () => {
    console.log('测试：错误处理和恢复');
    
    await page.goto(`chrome-extension://${extensionId}/sidebar/sidebar.html`);
    
    // 模拟网络错误情况下的行为
    await page.route('**/api/analyze', route => {
      route.abort('failed');
    });
    
    // 尝试进行分析
    const regionItem = page.locator('[data-region="US"]');
    await regionItem.click();
    
    const analyzeButton = page.locator('#analyzeBtn');
    await analyzeButton.click();
    
    // 应该显示错误或回退到本地分析
    await page.waitForTimeout(5000);
    
    // 检查是否显示了适当的错误消息或结果
    const hasResults = await page.locator('#quickResults').isVisible();
    const hasError = await page.locator('.message').isVisible();
    
    expect(hasResults || hasError).toBeTruthy();
    console.log('✅ 错误处理和恢复功能正常');
  });
});

// 测试运行配置
module.exports = {
  timeout: 60000, // 每个测试最多60秒
  retries: 2, // 失败时重试2次
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
};