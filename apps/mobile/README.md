# KemanCloud Mobile（客满云）

客满云移动端应用 - 基于React Native和Expo构建的酒店与民宿管理移动应用。

**品牌定位**: "客满＋云"，专注住宿行业SaaS，适合小酒店＋民宿混合经营。

## 📱 应用特性

### 核心功能
- 📅 **房态日历**: 直观查看所有房间的预订状态
- 🏨 **预订管理**: 创建、编辑、取消预订
- 📊 **数据统计**: 入住率、营收分析、趋势图表
- 🔔 **消息通知**: 入住提醒、退房通知
- 📸 **证件扫描**: OCR身份证识别（计划中）

### 开发者功能
- 🔧 **数据源切换**: 本地存储 ⇄ 服务器API
- 📦 **数据导入导出**: 完整的数据备份和恢复
- 🧪 **示例数据**: 一键初始化测试数据
- 📱 **离线模式**: 无网络环境下仍可使用

## 🚀 快速开始

### 方式1: 使用启动脚本（推荐）

```bash
cd apps/mobile
./start-mobile.sh
```

按提示选择启动模式即可。

### 方式2: 手动启动

```bash
# 安装依赖
cd apps/mobile
npm install

# 启动Expo开发服务器
npm start

# 或直接在特定平台运行
npm run ios      # iOS模拟器
npm run android  # Android模拟器
```

## 📋 环境要求

- Node.js >= 18.x
- npm 或 pnpm
- Expo CLI
- iOS: Xcode 14+ (仅macOS)
- Android: Android Studio

## 🔧 开发者模式

应用内置强大的开发者工具：

### 1. 切换数据源

在应用底部导航栏点击 **"开发者"** 标签，可以切换数据模式：

**本地存储模式** 🏠
- 所有数据保存在设备本地
- 离线可用，无需网络
- 支持数据导入导出
- 适合开发和演示

**服务器API模式** 🌐
- 数据从后端服务器获取
- 支持多设备同步
- 实时数据更新
- 需要网络连接

### 2. 数据管理功能

#### 导出数据
将所有本地数据（房间、预订、房态）导出为JSON文件：

```json
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T...",
  "data": {
    "rooms": [...],
    "reservations": [...],
    "roomStatuses": [...]
  },
  "metadata": {
    "totalRooms": 7,
    "totalReservations": 15,
    ...
  }
}
```

#### 导入数据
- **替换模式**: 清空现有数据，恢复备份数据
- **合并模式**: 保留现有数据，添加备份数据（自动去重）

#### 初始化示例数据
自动创建以下测试房间：
- 1202, 1203, 1204 (大床房)
- 12345 (双人房)
- 1301, 1302 (豪华房)
- 1401 (套房)

#### 清空数据
删除所有本地数据（谨慎操作，不可恢复）

## 🏗️ 项目结构

```
apps/mobile/
├── app/                          # 应用代码
│   ├── (tabs)/                   # 标签页
│   │   ├── index.tsx            # 首页
│   │   ├── calendar.tsx         # 房态日历
│   │   ├── reservations.tsx     # 预订管理
│   │   ├── statistics.tsx       # 统计分析
│   │   ├── profile.tsx          # 个人中心
│   │   └── developer.tsx        # 开发者设置 ⭐
│   ├── services/                 # 服务层
│   │   ├── dataService.ts       # 统一数据服务 ⭐
│   │   ├── api.ts               # API客户端
│   │   ├── apiClient.ts         # Axios配置
│   │   ├── localDataService.ts  # 本地存储服务
│   │   ├── dataBackupService.ts # 数据备份服务 ⭐
│   │   ├── storage.ts           # AsyncStorage封装
│   │   └── notifications.ts     # 通知服务
│   ├── store/                    # Redux状态管理
│   │   ├── index.ts
│   │   ├── calendarSlice.ts
│   │   └── types.ts
│   ├── config/                   # 配置文件
│   │   ├── environment.ts       # 环境配置 ⭐
│   │   └── dataSource.ts
│   └── components/               # 组件
│       └── DateWheelPicker.tsx
├── assets/                       # 静态资源
├── app.json                      # Expo配置 ⭐
├── eas.json                      # EAS Build配置 ⭐
├── package.json
├── tsconfig.json
├── start-mobile.sh              # 启动脚本 ⭐
├── iOS_BUILD_GUIDE.md           # iOS构建指南 ⭐
└── README.md                     # 本文档
```

⭐ = 新增或重要更新的文件

## 🍎 iOS开发配置

### Apple Developer信息
- **账号**: zhu.cy@outlook.com
- **Bundle ID**: com.kemancloud.mobile
- **App Store名称**: KemanCloud · Hotel & BnB Manager

### 在Xcode中构建

详细步骤请参考 [iOS_BUILD_GUIDE.md](./iOS_BUILD_GUIDE.md)

#### 快速开始

```bash
# 1. 预构建原生项目
npx expo prebuild --platform ios

# 2. 在Xcode中打开
open ios/RoomEaseMobile.xcworkspace

# 3. 配置签名（首次）
# - 选择你的Apple Developer账号
# - Team: zhu.cy@outlook.com

# 4. 连接设备并运行
# - 点击播放按钮 ▶️
```

### 使用EAS Build云构建

```bash
# 安装EAS CLI
npm install -g eas-cli

# 登录
eas login

# 构建开发版
eas build --platform ios --profile development

# 构建生产版
eas build --platform ios --profile production
```

## 🌐 API配置

### 修改API地址

编辑 `app/config/environment.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: isDev 
    ? 'http://YOUR_LOCAL_IP:4000'  // 修改为你的IP
    : 'https://api.roomease.com',
}
```

### 获取本地IP

```bash
# macOS
ipconfig getifaddr en0

# 或
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 测试API连接

在移动设备浏览器访问：
```
http://YOUR_LOCAL_IP:4000/health
```

## 🔌 依赖包

### 核心依赖
- `expo` - Expo框架
- `expo-router` - 文件路由
- `react-native` - React Native
- `@reduxjs/toolkit` - 状态管理
- `axios` - HTTP客户端

### 数据存储
- `@react-native-async-storage/async-storage` - 本地存储

### 文件操作
- `expo-file-system` - 文件系统访问
- `expo-document-picker` - 文档选择器
- `expo-sharing` - 文件分享

### 其他功能
- `expo-camera` - 相机访问
- `expo-notifications` - 推送通知
- `react-native-chart-kit` - 图表

## 📖 使用教程

### 1. 首次启动

1. 启动应用
2. 点击底部 **"开发者"** 标签
3. 开启 **"本地存储模式"**
4. 点击 **"初始化示例数据"**
5. 返回首页，查看示例房间

### 2. 创建预订

1. 进入 **"房态日历"** 标签
2. 点击空白日期单元格
3. 选择房间和日期范围
4. 填写客人信息
5. 确认创建

### 3. 数据备份

1. 进入 **"开发者"** 标签
2. 点击 **"导出所有数据"**
3. 选择保存位置
4. JSON文件已导出

### 4. 数据恢复

1. 进入 **"开发者"** 标签
2. 点击 **"导入数据"**
3. 选择导入模式（替换/合并）
4. 选择JSON备份文件
5. 确认恢复

### 5. 切换到服务器模式

1. 确保后端服务已启动
   ```bash
   cd ../../
   ./start-backend.sh
   ```

2. 在开发者设置中关闭 **"本地存储模式"**
3. 应用将自动连接到服务器API

## 🐛 调试

### 查看日志

```bash
# 详细日志
npx expo start --verbose

# 清除缓存启动
npx expo start --clear
```

### React Native Debugger

1. 在应用中摇晃设备
2. 选择 "Debug Remote JS"
3. Chrome中打开: http://localhost:8081/debugger-ui

### Expo DevTools

启动后自动在浏览器打开，或访问：
```
http://localhost:19002
```

## 🧪 测试建议

### 本地存储模式测试
1. 关闭网络连接
2. 创建一些预订
3. 导出数据
4. 清空数据
5. 重新导入数据
6. 验证数据完整性

### 服务器API模式测试
1. 连接网络
2. 切换到服务器模式
3. 测试CRUD操作
4. 检查数据同步
5. 测试网络错误处理

## 📝 环境变量

应用配置在 `app/config/environment.ts`:

```typescript
// 开发环境
isDev = true
API_BASE_URL = 'http://192.168.31.221:4000'

// 生产环境
isDev = false
API_BASE_URL = 'https://api.roomease.com'
```

## 🔐 数据安全

- 所有本地数据使用AsyncStorage加密存储
- 敏感信息不会明文保存
- 导出的JSON文件包含完整数据，请妥善保管
- 建议定期备份数据

## 📚 相关文档

- [iOS构建指南](./iOS_BUILD_GUIDE.md)
- [Expo文档](https://docs.expo.dev/)
- [React Native文档](https://reactnative.dev/)
- [项目总README](../../README.md)

## 🤝 开发团队

- **项目**: KemanCloud（客满云）
- **中文品牌**: 客满云
- **英文品牌**: KemanCloud
- **定位**: 住宿行业SaaS - 小酒店＋民宿管理系统
- **负责人**: zhu.cy@outlook.com
- **最后更新**: 2025-11-27

## 📄 License

MIT

---

**提示**: 如果遇到问题，请先查看 [iOS_BUILD_GUIDE.md](./iOS_BUILD_GUIDE.md) 中的常见问题解决方案。

