# Chrome扩展无头测试方法论（可复用模板）

## 1. 目标与适用范围
- 面向 Manifest V3 Chrome 扩展及衍生浏览器扩展（如 Edge、Opera）。
- 支撑本地化、内容采集、侧边栏 UI 等复杂交互的自动化质量保障。
- 适用于 CI/CD、灰度发布前冒烟、回归测试与性能基线监控。

## 2. 核心方法论原则
- **分层覆盖**：静态验证 → 单元测试 → 集成 → 端到端 → 非功能测试，全链路覆盖扩展生命周期。
- **上下文真实**：使用 `launchPersistentContext` 加载扩展包，复现真实浏览器持久态。
- **风险驱动**：优先实现阻断风险（权限、加载失败）、体验退化（侧边栏异常）、观察项（性能波动）。
- **治具复用**：统一封装上下文、数据夹具、API Stub，确保跨项目迁移成本低。
- **持续演进**：维护“测试矩阵 + 已知风险”双文档，随功能变更同步刷新。

## 3. 分层测试矩阵示例
| 层级 | 目标 | 主要内容 | CBEP3 覆盖示例 |
| ---- | ---- | -------- | -------------- |
| 静态验证 | 配置正确 | Manifest 权限、文件存在性、打包产物校验 | `manifest.json` 权限快照对比 |
| 单元测试 | 业务逻辑纯度 | 评分引擎、数据处理、规则引擎 | 评分引擎 92.3% 通过率 |
| 集成测试 | 模块协作 | Service Worker ↔ Content Script、消息通道、缓存 | Service Worker 消息回路验证 |
| 端到端 | 用户旅程 | 页面加载、侧边栏交互、地域切换、多站点巡检 | 端到端通过率 79.2% |
| 非功能 | 性能/容错 | 首次加载耗时、内存、水位、异常恢复 | 性能基线、AI 服务降级脚本 |

## 4. 实施步骤模板
1. **架构抽象**：梳理扩展模块（Service Worker、Content Scripts、UI 面板、选项页、后台服务）与外部依赖。
2. **测试矩阵落地**：以“模块/旅程 × 场景/风险”构建表格，记录前置条件、数据源、断言、优先级。
3. **治具封装**：实现上下文工厂、页面夹具、API Stub、地域配置工具，统一放在 `tests/helpers`。
4. **脚本与配置**：
   - `jest.config.ts` 或 `playwright.config.ts` 中声明无头执行参数。
   - `package.json` 新增 `test:unit`、`test:headless`、`test:e2e`。
5. **CI/CD 集成**：流水线分阶段执行（Lint → Unit → Headless → E2E），上传 Trace、截图、覆盖率。
6. **监控与演进**：维护质量看板（通过率、平均耗时、失败 TopN），新增功能先更新矩阵，再追加用例。

## 5. 目录与文件模板
```text
tests/
  config/
    playwright.config.ts
    env.example.json
  helpers/
    extensionContext.ts
    fixtures.ts
    llmStub.ts
  unit/
    *.spec.ts
  integration/
    *.spec.ts
  e2e/
    *.spec.ts
scripts/
  run-headless-tests.sh
```

## 6. 核心治具与代码片段
```ts
// tests/helpers/extensionContext.ts
import { chromium, BrowserContext } from '@playwright/test';
import path from 'path';

export async function createExtensionContext(profileDir = ''): Promise<BrowserContext> {
  const extensionPath = path.resolve(__dirname, '../../dist');
  return chromium.launchPersistentContext(profileDir, {
    headless: true,
    args: [
      `--load-extension=${extensionPath}`,
      `--disable-extensions-except=${extensionPath}`,
      '--no-sandbox',
    ],
  });
}
```

```ts
// tests/helpers/llmStub.ts
export async function mockLLMResponse(page) {
  await page.route('https://llm.example.com/api/*', async (route) => {
    const body = { suggestions: ['改进本地化文案', '补充合规模板'] };
    await route.fulfill({ status: 200, body: JSON.stringify(body) });
  });
}
```

```ts
// tests/e2e/sidebar.spec.ts
import { test, expect } from '@playwright/test';
import { createExtensionContext } from '../helpers/extensionContext';
import { mockLLMResponse } from '../helpers/llmStub';

test('侧边栏评分与地域切换', async () => {
  const context = await createExtensionContext();
  const page = await context.newPage();
  await mockLLMResponse(page);

  await page.goto('https://mock-shop.example/eu');
  await page.getByRole('button', { name: '开启分析' }).click();
  await expect(page.getByTestId('score-card')).toContainText('语言本地化');

  await page.getByRole('combobox', { name: '地域配置' }).selectOption('US');
  await expect(page.getByTestId('score-card')).toContainText('合规性检查');

  await context.close();
});
```

```sh
# package.json 脚本片段
"scripts": {
  "test:unit": "jest --config tests/config/jest.config.ts",
  "test:headless": "playwright test --config tests/config/playwright.config.ts --project=chromium",
  "test:e2e": "playwright test tests/e2e"
}
```

## 7. CI/CD 集成建议
- **阶段化执行**：
  - Step1：ESLint + Type Check
  - Step2：`npm run test:unit`
  - Step3：`npm run test:headless`
  - Step4：`npm run test:e2e`
- **产物归档**：收集 Playwright Trace、HAR、截图、覆盖率 (`coverage/`)；失败时自动上传供调试。
- **并发优化**：通过 `--workers` 控制并行度；对风险高的 E2E 套件单线程执行保证稳定。

## 8. 迁移与复用操作手册
1. 复制 `tests/helpers` 与配置样板到新项目，调整 `dist`、API 域名等路径。
2. 根据新项目核心功能更新测试矩阵，标记优先级与预期断言。
3. 补齐需要的 Mock/夹具（如不同站点 HTML、地域配置 JSON）。
4. 在 CI 中复用 `test:headless` 流水线，确认浏览器缓存策略与权限。
5. 发布前运行完整流水线，若性能指标或失败率超阈值自动阻断发布。

## 9. CBEP3 项目落地摘要
- 已用该方法论实现 Chrome 扩展端到端无头测试，端到端通过率 79.2%。
- 评分引擎单元测试通过率 92.3%，支撑多维度分析引擎回归。
- LLM 接口采用 Stub + 智能降级策略，保证离线环境可复现。
- 项目经验可无缝复制到其它跨境电商分析、内容审查、自动化监测类扩展。

---
如需扩展到更多浏览器或引入移动端 WebView，可在现有模板上扩展启动参数与治具。

