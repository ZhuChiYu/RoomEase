# 数据管理指南

## 📋 概述

RoomEase 现已支持完整的本地数据存储和导入导出功能，方便您在未来迁移到服务器存储时无缝过渡。

## 🎯 功能特性

### 1. 本地数据存储
- ✅ 所有数据存储在设备本地
- ✅ 完全离线工作
- ✅ 快速响应，无网络延迟
- ✅ 数据隐私保护
- ✅ 自动持久化到本地存储

### 2. 数据导出
支持多种导出格式：

#### JSON格式（完整备份）
- 包含所有房间、预订和房态数据
- 保留完整的数据结构
- 可用于数据备份和迁移
- 文件名格式：`RoomEase_Backup_YYYY-MM-DD.json`

#### CSV格式（用于Excel）
- **房间数据CSV**：包含房间ID、房间号、房型
- **预订数据CSV**：包含订单号、客人信息、日期、金额等
- 可直接在Excel中打开和编辑
- 文件名格式：`RoomEase_Rooms_YYYY-MM-DD.csv` 或 `RoomEase_Reservations_YYYY-MM-DD.csv`

### 3. 数据导入
- ⚠️ 导入会替换当前所有本地数据
- 支持从JSON备份文件导入
- 导入前会显示数据预览
- 建议导入前先导出当前数据备份

### 4. 数据备份
- 一键备份所有数据
- 自动生成时间戳命名的备份文件
- 可分享到云盘或其他设备
- 支持定时自动备份（可在设置中开启）

## 📱 使用方法

### 在应用中操作

1. **打开个人中心**
   - 点击底部导航栏的"个人"标签
   - 滚动到"数据管理"部分

2. **查看数据统计**
   - 查看当前存储的房间、预订、房态数量
   - 查看占用的存储空间

3. **导出数据**
   ```
   个人中心 → 数据管理 → 数据导出 → 选择格式
   ```
   - 选择"完整备份（JSON）"：导出所有数据
   - 选择"预订数据（CSV）"：仅导出预订记录
   - 选择"房间数据（CSV）"：仅导出房间信息
   
4. **导入数据**
   ```
   个人中心 → 数据管理 → 数据导入 → 选择文件
   ```
   - 选择之前导出的JSON备份文件
   - 确认导入预览信息
   - 点击"确定导入"

5. **数据备份**
   ```
   个人中心 → 数据管理 → 数据备份
   ```
   - 查看数据统计
   - 点击"开始备份"
   - 选择分享到云盘或其他位置

## 🔄 迁移到服务器存储

### 准备工作

1. **导出当前数据**
   ```
   个人中心 → 数据管理 → 数据导出 → 完整备份（JSON）
   ```
   这将生成一个包含所有数据的JSON文件。

2. **保存备份文件**
   - 将导出的JSON文件保存到安全位置
   - 建议保存多个副本（云盘、电脑等）

### 切换到服务器存储

3. **修改数据源配置**
   
   编辑文件：`apps/mobile/app/config/dataSource.ts`
   
   ```typescript
   export const dataSourceConfig: DataSourceConfig = {
     // type: 'local',  // 注释掉本地存储
     type: 'remote',    // 启用远程API
     
     apiUrl: 'https://your-server.com',  // 修改为您的服务器地址
     timeout: 10000,
     enableCache: true,
     enableOfflineMode: true,
   }
   ```

4. **配置服务器API地址**
   
   创建或编辑 `.env` 文件：
   ```
   EXPO_PUBLIC_API_URL=https://your-server.com
   ```

5. **重启应用**
   ```bash
   cd apps/mobile
   pnpm start
   ```

6. **导入数据到服务器**
   
   您可以通过以下方式将备份数据导入到服务器：
   
   **方式一：使用应用内导入**
   - 在应用中登录服务器账号
   - 使用"数据导入"功能上传之前的备份文件
   
   **方式二：服务器端导入**
   - 将JSON备份文件上传到服务器
   - 使用服务器端工具导入数据
   ```bash
   # 示例：使用API导入
   curl -X POST https://your-server.com/api/import \
     -H "Content-Type: application/json" \
     -d @RoomEase_Backup_2024-01-15.json
   ```

## 📊 数据格式说明

### JSON备份文件结构

```json
{
  "version": "1.0.0",
  "exportDate": "2024-01-15T10:30:00.000Z",
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
        "id": "xxx",
        "orderId": "ORD20240115xxxx",
        "roomId": "1202",
        "guestName": "张三",
        "guestPhone": "13800138000",
        "checkInDate": "2024-01-15",
        "checkOutDate": "2024-01-17",
        "roomPrice": 200,
        "totalAmount": 400,
        "nights": 2,
        "status": "confirmed",
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "roomStatuses": [
      {
        "roomId": "1202",
        "date": "2024-01-15",
        "status": "occupied",
        "reservationId": "xxx"
      }
    ]
  },
  "metadata": {
    "totalRooms": 7,
    "totalReservations": 15,
    "totalRoomStatuses": 45
  }
}
```

## 🔧 技术实现

### 文件结构
```
apps/mobile/app/
├── config/
│   └── dataSource.ts           # 数据源配置
├── services/
│   ├── storage.ts              # 本地存储服务
│   ├── localDataService.ts     # 本地数据服务（模拟API）
│   ├── dataBackupService.ts    # 数据备份导入导出
│   └── api.ts                  # 远程API服务
├── store/
│   ├── index.ts                # Redux store（含持久化中间件）
│   ├── calendarSlice.ts        # 日历状态管理
│   └── types.ts                # 类型定义
└── hooks/
    └── useApi.ts               # API Hooks（自动选择数据源）
```

### 数据持久化机制

1. **Redux状态管理**
   - 使用Redux管理应用状态
   - 自定义中间件实现自动持久化
   - 500ms防抖避免频繁写入

2. **本地存储**
   - 使用AsyncStorage存储数据
   - 自动序列化/反序列化JSON
   - 应用启动时自动恢复状态

3. **数据源切换**
   - 配置文件统一管理
   - useApi自动选择数据源
   - 无需修改业务代码

## ⚠️ 注意事项

1. **数据安全**
   - 定期导出备份数据
   - 将备份文件保存到多个位置
   - 重要操作前先备份

2. **数据导入**
   - 导入会完全替换现有数据
   - 导入前务必先导出备份
   - 确认导入的文件是正确的备份

3. **存储空间**
   - 定期检查存储使用情况
   - 及时清理过期数据
   - 大量数据建议迁移到服务器

4. **版本兼容**
   - 备份文件包含版本号
   - 确保导入的数据版本兼容
   - 跨版本导入可能需要数据迁移

## 🆘 常见问题

### Q: 导出的文件保存在哪里？
A: 导出后会弹出系统分享菜单，您可以选择保存到文件、云盘或发送给其他应用。

### Q: 可以在不同设备间同步数据吗？
A: 本地存储模式不支持自动同步，但您可以：
- 在设备A导出数据
- 将文件传输到设备B
- 在设备B导入数据

### Q: 如何恢复误删的数据？
A: 如果有备份文件：
1. 进入个人中心 → 数据管理 → 数据导入
2. 选择最近的备份文件
3. 确认导入

如果没有备份，数据无法恢复。建议开启自动备份功能。

### Q: 切换到服务器后还能用本地存储吗？
A: 可以。配置文件支持启用离线模式：
```typescript
enableOfflineMode: true
```
这样在网络不可用时会自动使用本地缓存。

### Q: CSV文件的编码问题？
A: 导出的CSV文件使用UTF-8编码。在Excel中打开中文乱码时：
1. 用记事本打开CSV文件
2. 另存为，选择"ANSI"编码
3. 再用Excel打开

## 📞 技术支持

如有问题，请联系：
- 邮箱：support@roomease.com
- 技术文档：查看项目 README.md

---

**版本**：v1.0.0  
**更新日期**：2024-01-15

