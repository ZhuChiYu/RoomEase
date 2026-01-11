# 数据同步优化 v2 - 2025-11-29

## 问题描述

### 问题 1：修改订单姓名后，房态日历没有及时更新
用户反馈：修改订单信息（如客人姓名）后，返回房态日历，信息仍然显示旧数据，没有及时更新。

### 问题 2：修改密码功能报 404 错误
用户在个人中心修改密码时，提示"请求的资源不存在"（404错误）。

## 根本原因分析

### 问题 1 的原因：缓存竞态条件

#### 之前的流程（v1）
1. 用户修改订单
2. 调用 API 更新数据
3. `dataService` 清除缓存
4. **立即并行加载最新数据**
5. **立即更新 Redux**
6. 返回房态日历
7. `useFocusEffect` 触发，再次加载数据
8. **问题：步骤7可能使用了缓存数据**

**问题所在：** 虽然在步骤3清除了缓存，但在步骤4-5之间，数据被重新缓存。当步骤7触发时，如果缓存还没过期，就会使用缓存的数据，而不是最新的。

**实际日志验证：**
```
LOG  🔄 [修改订单] Redux数据已更新: {"房态数": 19, "预订数": 5}  // 步骤5
...返回房态日历...
LOG  📦 [Cache] 缓存命中: cache_reservations_... (102s ago)     // 步骤7使用了缓存
LOG  ⚡️ 使用缓存的预订列表
```

### 问题 2 的原因：后端未部署

后端代码中已经有 `change-password` 端点，但是腾讯云服务器上的 Docker 容器还没有重新构建和部署最新代码。

## 解决方案

### 解决方案 1：简化数据同步逻辑

**核心思想：** 不要在修改/取消/删除操作后手动更新数据，而是依赖 `useFocusEffect` 自动刷新，并确保每次都强制清除缓存。

#### 新流程
1. 用户修改订单
2. 调用 API 更新数据
3. `dataService` 清除缓存
4. **直接返回房态日历**
5. `useFocusEffect` 触发
6. **强制清除缓存并从 API 加载最新数据**
7. 更新 Redux
8. 页面显示最新数据

**优势：**
- 避免竞态条件
- 代码更简洁
- 数据一致性更好
- 减少重复的网络请求

### 解决方案 2：部署后端代码

在腾讯云服务器上执行：
```bash
cd /opt/RoomEase && \
git pull origin main && \
docker-compose stop api-gateway && \
docker-compose build --no-cache api-gateway && \
docker-compose up -d api-gateway
```

## 修改的文件

### 1. `/apps/mobile/app/edit-order.tsx`

**修改前：**
```typescript
await dataService.reservations.update(reservationId, updateData)

// 立即重新加载最新数据
const [updatedReservations, updatedRoomStatuses] = await Promise.all([...])
dispatch(setReservations(updatedReservations))
dispatch(setRoomStatuses(updatedRoomStatuses))
```

**修改后：**
```typescript
await dataService.reservations.update(reservationId, updateData)

// dataService 已自动清除缓存
// 返回房态日历后，useFocusEffect 会自动刷新
console.log('✅ [修改订单] 更新成功，缓存已清除')
```

**移除的导入：**
```typescript
- import { setReservations, setRoomStatuses } from './store/calendarSlice'
```

### 2. `/apps/mobile/app/order-details.tsx`

**修改：** 与 `edit-order.tsx` 类似，移除取消订单后的手动数据加载和 Redux 更新。

**移除的导入：**
```typescript
- import { cancelReservation, setReservations, setRoomStatuses } from './store/calendarSlice'
+ import { cancelReservation } from './store/calendarSlice'
- import { dataService } from './services/dataService'
```

### 3. `/apps/mobile/app/(tabs)/reservations.tsx`

**修改：** 移除删除订单后的手动数据加载和 Redux 更新。

### 4. `/apps/mobile/app/(tabs)/profile.tsx`

**修改密码 API 调用错误：**

**修改前：**
```typescript
const response = await dataService.api.auth.changePassword(...)
```

**修改后：**
```typescript
import { api } from '../services/api'
...
const response = await api.auth.changePassword(...)
```

**问题：** `dataService` 没有 `api` 属性，应该直接导入并使用 `api`。

## 核心机制

### dataService 的缓存清除

`dataService` 中所有修改操作都会自动清除缓存：

```typescript
// services/dataService.ts
update: async (id, data) => {
  const reservation = await api.reservations.update(id, data)
  await cache.clearAll()  // 自动清除缓存
  return reservation
}
```

### 房态日历的 useFocusEffect

房态日历在每次获得焦点时都会刷新数据：

```typescript
// apps/mobile/app/(tabs)/calendar.tsx
useFocusEffect(
  React.useCallback(() => {
    if (!hasMountedRef.current) {
      // 首次加载，不清除缓存
      loadDataFromAPI(true, false)
    } else {
      // 从其他页面返回，清除缓存
      loadDataFromAPI(false, true)
    }
  }, [loadDataFromAPI])
)
```

## 测试验证

### 测试场景 1：修改订单姓名
1. 打开房态日历，查看某个预订的客人姓名
2. 点击进入订单详情，修改客人姓名
3. 保存修改
4. **验证：** 返回房态日历后，立即看到修改后的姓名

### 测试场景 2：取消订单
1. 打开房态日历，查看某个预订
2. 点击进入订单详情，取消订单
3. 确认取消
4. **验证：** 返回房态日历后，该预订立即消失

### 测试场景 3：删除订单
1. 打开预订列表，找到一个已取消或已退房的订单
2. 点击删除按钮，确认删除
3. **验证：** 订单立即从列表中消失

### 测试场景 4：修改密码（需先部署后端）
1. 打开个人中心
2. 点击"修改密码"
3. 输入当前密码和新密码
4. 保存
5. **验证：** 显示"密码修改成功"，自动登出

## 性能对比

### v1 方案（手动更新）
- **优点：** 返回页面立即显示新数据
- **缺点：** 
  - 两次网络请求（修改操作 + 手动加载）
  - 可能出现缓存竞态条件
  - 代码复杂，容易出错

### v2 方案（自动刷新）
- **优点：** 
  - 一次网络请求（只有修改操作）
  - 没有竞态条件
  - 代码简洁，易维护
- **缺点：** 返回页面时可能有短暂的加载延迟（但 `useFocusEffect` 很快）

## 日志监控

修改后，控制台应该看到以下日志：

```
📤 [修改订单] 更新数据: {...}
✅ [修改订单] 更新成功，缓存已清除
📅 [修改订单] 返回房态日历后将自动刷新数据
// 返回房态日历
📅 [Calendar] 从其他页面返回，刷新数据
📅 [Calendar] 清除缓存...
📅 [Calendar] 开始从API加载数据...
📦 [Cache] 缓存未命中: cache_reservations_...  // 确认缓存已清除
🌐 从云服务API获取预订列表
✅ [Calendar] 数据加载完成，已更新到Redux
```

## 后续优化建议

1. **乐观更新（Optimistic Update）：** 先更新 UI，API 失败时回滚
2. **WebSocket 实时同步：** 多设备实时同步数据
3. **增量更新：** 只更新修改的预订，不重新加载所有数据
4. **智能缓存：** 使用版本号或时间戳，精确控制缓存失效

## 相关文件

- `apps/mobile/app/edit-order.tsx` - 修改订单页面
- `apps/mobile/app/order-details.tsx` - 订单详情页面
- `apps/mobile/app/(tabs)/reservations.tsx` - 预订列表页面
- `apps/mobile/app/(tabs)/profile.tsx` - 个人中心页面
- `apps/mobile/app/(tabs)/calendar.tsx` - 房态日历页面
- `apps/mobile/app/services/dataService.ts` - 数据服务（缓存管理）

## 部署说明

### 前端部署
手机上重新加载 Expo App 即可：
- 摇动手机 → 选择 "Reload"
- 或重新扫描二维码

### 后端部署
参考 `DEPLOY_CHANGE_PASSWORD.md`

---

**优化日期：** 2025-11-29  
**版本：** v2  
**优化人员：** AI Assistant  
**测试状态：** 待用户测试验证






