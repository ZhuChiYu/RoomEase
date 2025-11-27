# RoomEase Mobile 开发者模式实现指南

## 📋 概述

本文档说明了RoomEase Mobile应用中开发者模式的实现，包括数据源切换、数据导入导出等功能。

## 🎯 实现的功能

### 1. 数据源动态切换 ⭐

应用支持在两种数据模式之间无缝切换：

#### 本地存储模式 🏠
- **数据存储**: 使用AsyncStorage保存所有数据
- **优势**: 
  - ✅ 离线可用
  - ✅ 快速响应
  - ✅ 无需网络
  - ✅ 适合开发和演示
- **用例**: 
  - 开发调试
  - 离线演示
  - 功能测试
  - 数据备份

#### 服务器API模式 🌐
- **数据存储**: 从后端API获取和保存数据
- **优势**:
  - ✅ 多设备同步
  - ✅ 云端备份
  - ✅ 实时更新
  - ✅ 数据一致性
- **用例**:
  - 生产环境
  - 多用户协作
  - 实时数据同步

### 2. 数据管理功能 📦

#### 导出所有数据
- 将房间、预订、房态数据导出为JSON文件
- 包含完整的元数据和时间戳
- 支持通过系统分享功能保存或发送

#### 导入数据
- **替换模式**: 清空现有数据，完全恢复备份
- **合并模式**: 保留现有数据，合并导入数据（自动去重）
- 验证数据格式和版本

#### 初始化示例数据
- 一键创建7个示例房间
- 不同房型：大床房、双人房、豪华房、套房
- 适合首次使用和演示

#### 清空数据
- 删除所有本地数据
- 二次确认，防止误操作

## 🏗️ 架构设计

### 文件结构

```
apps/mobile/app/
├── services/
│   ├── dataService.ts           # 统一数据服务层（核心）⭐
│   ├── api.ts                   # 服务器API实现
│   ├── localDataService.ts      # 本地存储实现
│   ├── dataBackupService.ts     # 数据备份服务 ⭐
│   └── storage.ts               # AsyncStorage封装
├── (tabs)/
│   └── developer.tsx            # 开发者设置UI ⭐
└── config/
    └── environment.ts           # 环境配置 ⭐
```

### 核心实现

#### 1. 统一数据服务层 (`dataService.ts`)

这是整个系统的核心，实现了透明的数据源切换：

```typescript
// 根据配置自动选择数据源
export const dataService = {
  rooms: {
    getAll: async () => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.rooms.getAll()
      } else {
        return await api.rooms.getAll()
      }
    },
    // ... 其他方法
  },
  // ... 其他模块
}
```

**设计原则**:
- ✅ 单一职责：每个方法只负责数据路由
- ✅ 透明切换：上层代码无感知
- ✅ 一致接口：本地和远程API完全相同
- ✅ 配置驱动：通过AsyncStorage动态配置

#### 2. 开发者模式配置

```typescript
// 开发者模式配置存储
interface DeveloperModeConfig {
  useLocalStorage: boolean  // true=本地，false=服务器
  lastUpdated: string
}

// 持久化在AsyncStorage
const DEV_MODE_KEY = 'developer_mode_config'
```

#### 3. 本地数据服务 (`localDataService.ts`)

完整实现了所有API接口，使用AsyncStorage：

```typescript
export const localDataService = {
  auth: { login, logout, getCurrentUser },
  rooms: { getAll, getById, create, update, delete },
  reservations: { getAll, create, update, cancel, checkIn, checkOut },
  roomStatus: { getByDateRange, setDirty, setClean, closeRoom },
  statistics: { getDashboard, getOccupancyRate, getRevenue },
}
```

#### 4. 数据备份服务 (`dataBackupService.ts`)

处理数据的导入导出：

```typescript
export const dataBackupService = {
  exportAllData,              // 导出为JSON
  importDataFromFile,         // 从文件导入
  restoreBackupData,          // 恢复数据（替换/合并）
  clearAllData,               // 清空数据
  getDataStats,               // 获取统计信息
  exportReservationsByDateRange, // 按日期导出
}
```

## 💡 使用方式

### 对于开发者

#### 在代码中使用

```typescript
import { dataService } from '@/services/dataService'

// 获取房间列表（自动选择数据源）
const rooms = await dataService.rooms.getAll()

// 创建预订（自动选择数据源）
const reservation = await dataService.reservations.create({
  roomId: '1202',
  checkInDate: '2025-12-01',
  checkOutDate: '2025-12-03',
  // ...
})
```

**注意**: 始终使用 `dataService` 而不是直接使用 `api` 或 `localDataService`

#### 切换数据源

```typescript
import { setDeveloperMode } from '@/services/dataService'

// 切换到本地存储
await setDeveloperMode(true)

// 切换到服务器API
await setDeveloperMode(false)
```

### 对于用户

1. 打开应用
2. 点击底部导航栏的 **"开发者"** 标签
3. 使用开关切换 **"本地存储模式"**
4. 使用数据管理功能

## 📄 数据格式

### 导出的JSON格式

```json
{
  "version": "1.0.0",
  "timestamp": "2025-11-27T10:30:00.000Z",
  "data": {
    "rooms": [
      {
        "id": "1202",
        "name": "1202",
        "type": "大床房"
      }
    ],
    "reservations": [
      {
        "id": "abc123",
        "orderId": "ORD20251127001",
        "roomId": "1202",
        "guestName": "张三",
        "checkInDate": "2025-12-01",
        "checkOutDate": "2025-12-03",
        "status": "confirmed",
        "totalAmount": 500,
        "createdAt": "2025-11-27T10:30:00.000Z"
      }
    ],
    "roomStatuses": [
      {
        "roomId": "1202",
        "date": "2025-12-01",
        "status": "occupied",
        "reservationId": "abc123"
      }
    ]
  },
  "metadata": {
    "totalRooms": 7,
    "totalReservations": 15,
    "totalRoomStatuses": 45,
    "exportedBy": "RoomEase Mobile App",
    "deviceInfo": "ios"
  }
}
```

## 🔧 配置说明

### environment.ts

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://192.168.31.221:4000',  // API地址
  TIMEOUT: 30000,                          // 超时时间
  ENABLE_LOGGING: true,                    // 启用日志
}

export const FEATURE_FLAGS = {
  ENABLE_DATA_BACKUP: true,        // 启用数据备份
  SHOW_DEVELOPER_TAB: true,        // 显示开发者标签
}

export const APP_CONFIG = {
  APPLE_DEVELOPER_EMAIL: 'zhu.cy@outlook.com',  // Apple开发者账号
  BUNDLE_ID: 'com.roomease.mobile',             // Bundle标识符
}
```

### app.json

```json
{
  "expo": {
    "name": "RoomEase Mobile",
    "slug": "roomease-mobile",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.roomease.mobile"
    }
  }
}
```

### eas.json

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "zhu.cy@outlook.com"
      }
    }
  }
}
```

## 🚀 iOS构建配置

### Apple Developer信息
- **账号**: zhu.cy@outlook.com
- **Bundle ID**: com.roomease.mobile

### 构建方法

#### 方法1: 使用Expo Go (开发)
```bash
npm start
# 扫描二维码在Expo Go中打开
```

#### 方法2: 使用Xcode (本地)
```bash
npx expo prebuild --platform ios
open ios/RoomEaseMobile.xcworkspace
# 在Xcode中配置签名并运行
```

#### 方法3: 使用EAS Build (云端)
```bash
eas build --platform ios --profile production
```

详细步骤请参考: [iOS_BUILD_GUIDE.md](./apps/mobile/iOS_BUILD_GUIDE.md)

## 🧪 测试建议

### 测试场景1: 本地存储功能

```bash
# 1. 切换到本地模式
# 2. 初始化示例数据
# 3. 创建几个预订
# 4. 导出数据
# 5. 清空数据
# 6. 重新导入数据（替换模式）
# 7. 验证数据完整性
```

### 测试场景2: 数据合并

```bash
# 1. 在本地模式创建一些数据（数据集A）
# 2. 导出数据为文件A
# 3. 清空数据
# 4. 创建不同的数据（数据集B）
# 5. 导入文件A（合并模式）
# 6. 验证同时包含A和B的数据
```

### 测试场景3: 模式切换

```bash
# 1. 在本地模式创建数据
# 2. 切换到服务器模式
# 3. 验证数据来源变更
# 4. 在服务器模式创建数据
# 5. 切换回本地模式
# 6. 验证本地数据未受影响
```

## 📊 性能优化

### AsyncStorage优化
- ✅ 使用批量读写操作
- ✅ 缓存常用数据
- ✅ 异步操作不阻塞UI

### 数据同步优化
- ✅ 仅在数据变更时持久化
- ✅ 使用防抖减少写入频率
- ✅ 后台任务处理大数据

## 🔐 安全考虑

### 数据安全
- AsyncStorage数据加密存储
- 敏感信息不明文保存
- 导出文件包含时间戳和版本

### API安全
- Token自动刷新
- 请求超时处理
- 错误重试机制

## 🐛 已知问题

1. **大数据量导出**: 超过1000条记录可能较慢
   - 解决方案: 添加分页导出

2. **合并模式去重**: 仅基于ID去重
   - 解决方案: 未来可添加更智能的冲突解决

3. **网络切换**: 从服务器切换到本地时，之前的服务器数据不会自动同步
   - 解决方案: 添加数据同步功能

## 📝 未来计划

- [ ] 数据自动同步（本地 ⇄ 服务器）
- [ ] 增量备份（仅备份变更）
- [ ] 云端备份集成
- [ ] 多设备数据同步
- [ ] 冲突解决策略
- [ ] 数据加密导出
- [ ] 定时自动备份

## 🤝 贡献指南

如需修改开发者模式功能：

1. 修改 `dataService.ts` - 添加新的数据路由
2. 更新 `localDataService.ts` - 实现本地版本
3. 更新 `api.ts` - 实现服务器版本
4. 在 `developer.tsx` 中添加UI控制
5. 更新本文档

## 📚 相关文档

- [移动端README](./apps/mobile/README.md)
- [iOS构建指南](./apps/mobile/iOS_BUILD_GUIDE.md)
- [项目总README](./README.md)

---

**创建日期**: 2025-11-27  
**最后更新**: 2025-11-27  
**维护者**: RoomEase Team  
**联系方式**: zhu.cy@outlook.com

