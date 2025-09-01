const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  fullyParallel: false, // 扩展测试不能并行运行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // 扩展测试只能单线程
  reporter: [
    ['line'],
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  use: {
    actionTimeout: 10000,
    navigationTimeout: 30000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chrome-extension',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome 扩展测试专用配置
        launchOptions: {
          headless: true, // 改为无头模式进行服务器测试
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--no-first-run',
            '--disable-default-apps',
            '--disable-extensions-except=.',
            '--load-extension=.'
          ]
        }
      },
    },
  ],

  // 测试输出目录
  outputDir: 'test-results/',
});