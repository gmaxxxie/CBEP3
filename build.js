#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('开始构建优化版本...');

// 创建打包后的核心服务文件
function bundleServices() {
  const files = [
    'src/utils/analysis-cache.js',
    'src/data/data-loader.js', 
    'src/rules/rule-engine.js',
    'src/utils/report-generator.js'
  ];
  
  let bundledContent = '// 自动打包的核心服务文件\n\n';
  
  files.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      bundledContent += `// === ${filePath} ===\n`;
      bundledContent += content.replace(/\/\/ Service Worker[^\n]*/g, ''); // 移除注释
      bundledContent += '\n\n';
    } else {
      console.warn(`文件不存在: ${filePath}`);
    }
  });
  
  // 写入打包文件
  const outputPath = path.join(__dirname, 'src/core-services.js');
  fs.writeFileSync(outputPath, bundledContent);
  console.log(`核心服务已打包到: ${outputPath}`);
}

// 更新sidebar.html引用打包后的文件
function updateSidebarHTML() {
  const sidebarPath = path.join(__dirname, 'sidebar/sidebar.html');
  let content = fs.readFileSync(sidebarPath, 'utf8');
  
  // 替换多个脚本引用为单个打包文件
  const oldScripts = [
    '<script src="../src/utils/analysis-cache.js"></script>',
    '<script src="../src/data/data-loader.js"></script>',
    '<script src="../src/rules/rule-engine.js"></script>',
    '<script src="../src/utils/report-generator.js"></script>'
  ];
  
  oldScripts.forEach(script => {
    content = content.replace(script, '');
  });
  
  // 添加打包后的脚本
  content = content.replace(
    '<script src="sidebar.js"></script>',
    '<script src="../src/core-services.js"></script>\n  <script src="sidebar.js"></script>'
  );
  
  fs.writeFileSync(sidebarPath, content);
  console.log('已更新sidebar.html脚本引用');
}

// 压缩CSS文件
function minifyCSS() {
  const cssFiles = ['sidebar/sidebar.css', 'options/options.css', 'src/content/content-styles.css'];
  
  cssFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // 简单的CSS压缩：移除多余空白和注释
      content = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
        .replace(/\s+/g, ' ') // 多个空白替换为单个空格
        .replace(/;\s*}/g, '}') // 移除最后一个分号前的空格
        .replace(/\s*{\s*/g, '{') // 移除大括号周围空格
        .replace(/;\s*/g, ';') // 移除分号后空格
        .trim();
      
      fs.writeFileSync(fullPath, content);
      console.log(`已压缩CSS文件: ${filePath}`);
    }
  });
}

// 清理不必要的文件
function cleanupFiles() {
  const unnecessaryFiles = [
    '.git',
    '.gitignore',
    'README.md',
    'package.json',
    'build.js'
  ];
  
  // 注意：这里只是记录，不实际删除这些文件以避免破坏项目
  console.log('建议在发布前手动移除的文件:', unnecessaryFiles);
}

// 执行构建
try {
  bundleServices();
  updateSidebarHTML();
  minifyCSS();
  cleanupFiles();
  
  // 计算优化后的文件大小
  const totalSize = calculateDirectorySize(__dirname);
  console.log(`构建完成！当前目录大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
} catch (error) {
  console.error('构建过程中出现错误:', error);
}

function calculateDirectorySize(dirPath) {
  let totalSize = 0;
  
  function traverse(currentPath) {
    const stats = fs.statSync(currentPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        traverse(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }
  
  try {
    traverse(dirPath);
  } catch (error) {
    console.warn('计算目录大小时出错:', error.message);
  }
  
  return totalSize;
}