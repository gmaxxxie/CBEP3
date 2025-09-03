#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('开始打包Chrome扩展...');

// 创建打包目录
const packageDir = path.join(__dirname, 'extension-package');
if (fs.existsSync(packageDir)) {
  fs.rmSync(packageDir, { recursive: true });
}
fs.mkdirSync(packageDir);

// 需要复制的文件和目录
const filesToCopy = [
  'manifest.json',
  'assets/',
  'background/',
  'options/',
  'popup/',
  'sidebar/',
  'src/',
  'data/'
];

// 复制文件和目录
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 复制必要文件到打包目录
filesToCopy.forEach(item => {
  const srcPath = path.join(__dirname, item);
  const destPath = path.join(packageDir, item);
  
  if (fs.existsSync(srcPath)) {
    console.log(`复制: ${item}`);
    copyRecursive(srcPath, destPath);
  } else {
    console.warn(`文件不存在，跳过: ${item}`);
  }
});

// 清理不必要的文件
const filesToRemove = [
  '.DS_Store',
  '._.DS_Store',
  'Thumbs.db'
];

function cleanupDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      cleanupDirectory(itemPath);
    } else if (filesToRemove.includes(item)) {
      fs.unlinkSync(itemPath);
      console.log(`已删除: ${itemPath}`);
    }
  });
}

cleanupDirectory(packageDir);

// 创建ZIP文件
const archiveName = `cbep3-extension-v${require('./package.json').version}.tar.gz`;
const archivePath = path.join(__dirname, archiveName);

try {
  // 使用tar命令创建压缩包
  execSync(`cd "${packageDir}" && tar -czf "../${archiveName}" *`, { stdio: 'inherit' });
  console.log(`\n✅ 扩展打包完成!`);
  console.log(`📦 压缩包: ${archiveName}`);
  console.log(`📁 源文件夹: ${packageDir}`);
  
  // 显示文件大小
  const stats = fs.statSync(archivePath);
  console.log(`📏 压缩包大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('\n📋 部署说明:');
  console.log('1. 解压缩文件到任意目录');
  console.log('2. 打开Chrome浏览器，进入 chrome://extensions/');
  console.log('3. 开启"开发者模式"');
  console.log('4. 点击"加载已解压的扩展程序"');
  console.log('5. 选择解压后的扩展文件夹');
  
} catch (error) {
  console.error('创建压缩包失败:', error.message);
  console.log('\n可以手动压缩以下目录:');
  console.log(packageDir);
}