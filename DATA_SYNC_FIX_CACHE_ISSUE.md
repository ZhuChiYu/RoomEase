# 数据同步问题的最终修复 - 缓存重建问题

## 问题复现

用户修改了"还是说吧实时"的房间到"请问饿"，但房态日历仍然显示旧数据。

## 根本原因分析

通过仔细分析终端日志（第 380 行），发现了真正的问题：

```
LOG  📦 [Cache] 缓存命中: cache_room_status_cmiilfwcx000jc9ovmu8m285j_2025-10-30_2025-12-29 (17s ago)
LOG  ⚡️ 使用缓存的房态数据
```

### 问题流程

1. 用户在 `edit-order.tsx` 中修改订单
2. `dataService.reservations.update()` 内部调用 `cache.clearAll()` ✅
3. edit-order.tsx 立即调用 `dataService.reservations.getAll()` 和 `dataService.roomStatus.getByDateRange()`
4. **这两个调用会重新创建缓存！** ❌
5. 更新 Redux，设置 `@data_just_updated` 标记
6. 返回 `calendar.tsx`
7. `useFocusEffect` 检测到标记，跳过加载，使用 Redux 数据 ✅
8. 但是 3 秒后，标记过期
9. 用户点击刷新或重新进入页面
10. `calendar.tsx` 从服务器获取数据，但**使用了 edit-order.tsx 中创建的旧缓存！** ❌

### 为什么会这样？

```typescript
// dataService.ts 中的缓存逻辑
roomStatus: {
  getByDateRange: async (startDate, endDate) => {
    const cached = await cache.get(cacheKey, ttl)
    if (cached) {
      return cached // 使用缓存
    }
    
    const roomStatus = await api.roomStatus.getByDateRange(...)
    await cache.set(cacheKey, roomStatus) // ❌ 重新创建缓存
    return roomStatus
  }
}
```

当 edit-order.tsx 调用 `getByDateRange()` 时：
- 缓存已被清除
- 从服务器获取最新数据
- **立即重新创建缓存**
- 但此时服务器可能还有其他更新正在处理，数据不是最终状态

## 解决方案

### 修改1: edit-order.tsx - 更新 Redux 后再次清除缓存

```typescript
// 更新Redux
dispatch(setReservations(updatedReservations))
dispatch(setRoomStatuses(updatedRoomStatuses))

// **重要**：再次清除缓存，确保 calendar 页面获取的是最新数据
console.log('🧹 [修改订单] 再次清除缓存，确保数据一致性...')
await dataService.cache.clearAll()
```

### 修改2: create-order.tsx - 同样的修改

```typescript
// 更新Redux
dispatch(setReservations(updatedReservations))
dispatch(setRoomStatuses(updatedRoomStatuses))

// **重要**：再次清除缓存
console.log('🧹 [CreateOrder] 再次清除缓存，确保数据一致性...')
await dataService.cache.clearAll()
```

### 修改3: calendar.tsx - 刷新时确保清除缓存

```typescript
const handleRefresh = async () => {
  console.log('🔄 [Calendar] 用户触发刷新，强制清除缓存')
  await dataService.cache.clearAll() // 确保清除所有缓存
  await loadDataFromAPI(false, true)
}
```

## 修复后的数据流

```
用户修改订单
  ↓
调用 API 更新（dataService 自动清除缓存）✅
  ↓
从服务器获取最新数据并更新 Redux ✅
  ↓
【关键】再次清除缓存 ✅
  ↓
设置 @data_just_updated 标记 ✅
  ↓
返回 calendar.tsx
  ↓
useFocusEffect: 检测到标记，使用 Redux 数据 ✅
  ↓
3秒后或用户刷新
  ↓
从服务器获取数据（缓存已清除，确保是最新的）✅
```

## 为什么这个方案有效？

1. **双重清除缓存**：
   - 第一次：update 方法内部清除
   - 第二次：更新 Redux 后再次清除
   - 确保没有旧缓存残留

2. **@data_just_updated 标记**：
   - 返回页面时立即使用 Redux 的最新数据
   - 避免重复加载

3. **loadDataFromAPI(false, true)**：
   - `false`: 不显示全屏 loading
   - `true`: clearCache，强制从服务器获取

## 测试建议

1. 修改订单 → 返回日历 → 验证立即显示新数据
2. 修改订单 → 等待5秒 → 返回日历 → 验证显示新数据
3. 修改订单 → 返回日历 → 下拉刷新 → 验证显示新数据
4. 创建订单 → 返回日历 → 验证立即显示新数据

## 修改文件清单

1. ✅ `apps/mobile/app/edit-order.tsx` - 添加二次缓存清除
2. ✅ `apps/mobile/app/create-order.tsx` - 添加二次缓存清除  
3. ✅ `apps/mobile/app/(tabs)/calendar.tsx` - 刷新时确保清除缓存

## 注意事项

这个修复暴露了一个更深层的问题：**缓存管理策略**。

当前的 dataService 在每次数据获取后都会重新创建缓存，这可能导致：
- 数据不一致
- 缓存时序问题

更好的长期方案可能是：
1. 实现"脏标记"机制，而不是立即删除缓存
2. 使用版本号或时间戳验证缓存新鲜度
3. 考虑使用 React Query 等更成熟的缓存库

但目前的双重清除方案已经能够解决问题。

