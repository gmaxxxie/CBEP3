# Chrome扩展部署说明

## 文件说明
- `cbep3-extension-v1.0.0.tar.gz` - 压缩的扩展包
- `extension-package/` - 解压后的扩展源码目录

## 部署步骤

### 方法1: 使用压缩包
1. 解压 `cbep3-extension-v1.0.0.tar.gz` 到任意目录
   ```bash
   tar -xzf cbep3-extension-v1.0.0.tar.gz -C /path/to/extract/
   ```

2. 在Chrome浏览器中加载扩展:
   - 打开Chrome浏览器
   - 访问 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择解压后的扩展目录

### 方法2: 直接使用源码目录
直接选择 `extension-package/` 目录加载到Chrome扩展管理页面。

## 扩展功能
- 跨境电商内容地域适配分析
- 多维度评估：语言、文化、合规、用户体验
- 侧边栏展示分析结果
- 支持多区域配置

## 注意事项
- 需要Chrome浏览器版本 88+ (支持Manifest V3)
- 首次使用需要授予网页访问权限
- 扩展会在右侧显示侧边栏进行分析结果展示

## 文件大小
压缩包大小: 376 KB