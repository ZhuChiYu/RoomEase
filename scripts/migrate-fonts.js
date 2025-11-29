#!/usr/bin/env node

/**
 * 字体适配快速迁移脚本
 * 批量替换常见的 fontSize 和 padding/margin 值
 */

const fs = require('fs');
const path = require('path');

// 字体大小映射
const fontSizeMap = {
  '10': 'FontSizes.tiny',
  '11': 'FontSizes.tiny',
  '12': 'FontSizes.small',
  '13': 'FontSizes.small',
  '14': 'FontSizes.normal',
  '15': 'FontSizes.normal',
  '16': 'FontSizes.medium',
  '17': 'FontSizes.medium',
  '18': 'FontSizes.large',
  '19': 'FontSizes.large',
  '20': 'FontSizes.xlarge',
  '22': 'FontSizes.xlarge',
  '24': 'FontSizes.xxlarge',
  '28': 'FontSizes.xxlarge',
  '32': 'FontSizes.huge',
  '64': 'FontSizes.giant',
};

// 间距映射
const spacingMap = {
  '4': 'Spacings.xs',
  '8': 'Spacings.sm',
  '12': 'Spacings.md',
  '16': 'Spacings.lg',
  '20': 'Spacings.xl',
  '24': 'Spacings.xxl',
  '32': 'Spacings.xxxl',
};

// 圆角映射
const borderRadiusMap = {
  '8': 'ComponentSizes.borderRadius',
  '12': 'ComponentSizes.borderRadiusLarge',
};

function replaceFontSizes(content) {
  let updated = content;
  
  // 替换 fontSize
  Object.entries(fontSizeMap).forEach(([size, constant]) => {
    const regex = new RegExp(`fontSize:\\s*${size}(?!\\d)`, 'g');
    updated = updated.replace(regex, `fontSize: ${constant}`);
  });
  
  return updated;
}

function replaceSpacings(content) {
  let updated = content;
  
  // 替换 padding, paddingHorizontal, paddingVertical, margin 等
  const properties = [
    'padding',
    'paddingHorizontal',
    'paddingVertical',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'margin',
    'marginHorizontal',
    'marginVertical',
    'marginTop',
    'marginBottom',
    'marginLeft',
    'marginRight',
  ];
  
  properties.forEach(prop => {
    Object.entries(spacingMap).forEach(([size, constant]) => {
      const regex = new RegExp(`${prop}:\\s*${size}(?!\\d)`, 'g');
      updated = updated.replace(regex, `${prop}: ${constant}`);
    });
  });
  
  return updated;
}

function replaceBorderRadius(content) {
  let updated = content;
  
  Object.entries(borderRadiusMap).forEach(([size, constant]) => {
    const regex = new RegExp(`borderRadius:\\s*${size}(?!\\d)`, 'g');
    updated = updated.replace(regex, `borderRadius: ${constant}`);
  });
  
  return updated;
}

function replaceHeights(content) {
  let updated = content;
  
  // 将固定 height: 50 替换为 minHeight: ComponentSizes.inputHeight
  updated = updated.replace(/height:\s*50(?!\d)/g, 'minHeight: ComponentSizes.inputHeight');
  updated = updated.replace(/height:\s*44(?!\d)/g, 'minHeight: ComponentSizes.inputHeightSmall');
  updated = updated.replace(/height:\s*40(?!\d)/g, 'minHeight: ComponentSizes.buttonHeightSmall');
  
  return updated;
}

function addImport(content) {
  // 检查是否已经有导入
  if (content.includes('from \'../utils/responsive\'') || content.includes('from \'./utils/responsive\'')) {
    return content;
  }
  
  // 查找 StyleSheet 的导入
  const styleSheetImportRegex = /from 'react-native'/;
  const match = content.match(styleSheetImportRegex);
  
  if (match) {
    const insertIndex = content.indexOf(match[0]) + match[0].length;
    const importStatement = '\nimport { FontSizes, Spacings, ComponentSizes } from \'../utils/responsive\'';
    content = content.slice(0, insertIndex) + importStatement + content.slice(insertIndex);
  }
  
  return content;
}

function migrateFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 添加导入
  content = addImport(content);
  
  // 替换字体大小
  content = replaceFontSizes(content);
  
  // 替换间距
  content = replaceSpacings(content);
  
  // 替换圆角
  content = replaceBorderRadius(content);
  
  // 替换固定高度
  content = replaceHeights(content);
  
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log(`✅ Migrated: ${filePath}`);
}

// 获取命令行参数
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node migrate-fonts.js <file1> <file2> ...');
  console.log('Example: node migrate-fonts.js apps/mobile/app/(tabs)/profile.tsx');
  process.exit(1);
}

// 处理每个文件
args.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    migrateFile(filePath);
  } else {
    console.error(`❌ File not found: ${filePath}`);
  }
});

console.log('\n✨ Migration completed!');

