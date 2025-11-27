# 🚀 客满云移动端 - 快速启动指南

## ✅ 问题已解决

已移除 workspace 依赖，现在可以独立使用 npm 安装。

## 📦 安装依赖

```bash
cd apps/mobile

# 清理旧的依赖（如果有）
rm -rf node_modules package-lock.json

# 安装依赖
npm install
```

## 🚀 启动应用

### 方式1: 使用 Expo Go（最简单）

```bash
# 启动开发服务器
npm start

# 用手机扫描二维码（需要在手机上安装 Expo Go App）
# iOS: App Store 搜索 "Expo Go"
# Android: Google Play 搜索 "Expo Go"
```

### 方式2: iOS 模拟器

```bash
npm run ios
```

### 方式3: Android 模拟器

```bash
npm run android
```

### 方式4: 使用启动脚本

```bash
./start-mobile.sh
```

## 📱 首次使用

1. **启动应用后**，点击底部 "开发者" 标签
2. **开启本地存储模式**（离线可用）
3. **初始化示例数据**（一键创建测试房间）
4. 返回首页，开始使用

## 🔧 常见问题

### 问题1: npm install 报错 "workspace:"
**已解决** - 已从 package.json 移除 workspace 依赖

### 问题2: 找不到模块
```bash
# 清理缓存重新安装
rm -rf node_modules .expo
npm install
```

### 问题3: Metro bundler 错误
```bash
# 清除 Expo 缓存
npx expo start --clear
```

## 📚 更多文档

- 完整文档: `README.md`
- iOS 构建: `iOS_BUILD_GUIDE.md`
- 品牌更新: `BRAND_UPDATE.md`

---

**品牌**: KemanCloud（客满云）  
**更新**: 2025-11-27
