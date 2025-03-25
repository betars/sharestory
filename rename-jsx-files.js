const fs = require('fs');
const path = require('path');

// 需要扫描的目录
const directories = [
  './src',
  './src/components',
  './src/components/auth',
  './src/components/comments',
  './src/components/common',
  './src/components/layout',
  './src/components/posts',
  './src/contexts',
  './src/firebase',
  './src/pages'
];

// 递归扫描目录
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.endsWith('.js')) {
      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检查是否包含 JSX 语法 (简单检查，可能不完全准确)
      if (content.includes('import React') || 
          content.includes('<') && content.includes('/>') || 
          content.includes('</')) {
        
        // 重命名为 .jsx
        const newPath = filePath.replace('.js', '.jsx');
        fs.renameSync(filePath, newPath);
        console.log(`重命名: ${filePath} -> ${newPath}`);
      }
    }
  });
}

// 开始扫描
directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
});

console.log('文件重命名完成！'); 