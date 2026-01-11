# 数据同步最终修复 - 缓存清除问题

## 问题发现

用户反馈：修改和添加订单后，数据显示还是不及时，要等几秒钟才生效。

通过分析终端日志（第 106-111、210-214、320-325、427-431行），发现：

```
LOG  📦 [Cache] 已清除所有缓存
LOG  🌐 从云服务API获取房间列表
LOG  📦 [Cache] 缓存命中: cache_rooms_cmiilfwcx000jc9ovmu8m285j (62s ago)
LOG  ⚡️ 使用缓存的房间列表
LOG  📦 [Cache] 缓存命中: cache_reservations_{"startDate":"2025-11-21"...} (120s ago)
LOG  ⚡️ 使用缓存的预订列表
```

**问题**：虽然调用了 `dataService.cache.clearAll()`，但**数据仍然使用了缓存**！

## 根本原因

### dataService.ts 中的缓存键策略

```typescript
// 房间缓存键
const cacheKey = `${CACHE_KEYS.ROOMS}_${effectivePropertyId}`
// 示例：cache_rooms_cmiilfwcx000jc9ovmu8m285j

// 预订缓存键
const cacheKey = `${CACHE_KEYS.RESERVATIONS}_${JSON.stringify(effectiveParams)}`
// 示例：cache_reservations_{"startDate":"2025-11-21","endDate":"2025-12-28"...}

// 房态缓存键
const cacheKey = `${CACHE_KEYS.ROOM_STATUS}_${effectivePropertyId}_${startDate}_${endDate}`
// 示例：cache_room_status_cmiilfwcx000jc9ovmu8m285j_2025-11-21_2025-12-28
```

### 原始的 clearAll() 实现（有问题）

```typescript
clearAll: async (): Promise<void> => {
  await Promise.all(
    Object.values(CACHE_KEYS).map(key => storage.removeItem(key))
  )
  console.log('📦 [Cache] 已清除所有缓存')
}
```

**问题**：
- 只清除了基础缓存键：`cache_rooms`, `cache_reservations`, `cache_room_status`
- **没有清除带参数的缓存键**，例如：
  - `cache_rooms_cmiilfwcx000jc9ovmu8m285j`
  - `cache_reservations_{"startDate":"2025-11-21"...}`
  - `cache_room_status_cmiilfwcx000jc9ovmu8m285j_2025-11-21_2025-12-28`

这就是为什么清除缓存后，数据仍然使用旧缓存的原因！

## 解决方案

### 修改 dataService.ts

使用 `getAllKeys()` 找出所有缓存键，然后清除所有以 `cache_` 开头的键：

```typescript
clearAll: async (): Promise<void> => {
  // 获取所有存储的键
  const allKeys = await storage.getAllKeys()
  
  // 过滤出所有缓存键（以 cache_ 开头）
  const cacheKeys = allKeys.filter(key => 
    key.startsWith('cache_rooms') || 
    key.startsWith('cache_reservations') || 
    key.startsWith('cache_room_status') || 
    key.startsWith('cache_statistics')
  )
  
  // 删除所有缓存键
  if (cacheKeys.length > 0) {
    await Promise.all(cacheKeys.map(key => storage.removeItem(key)))
    console.log(`📦 [Cache] 已清除所有缓存 (${cacheKeys.length} 个键)`)
  } else {
    console.log('📦 [Cache] 没有缓存需要清除')
  }
}
```

**关键改进**：
- ✅ 使用 `getAllKeys()` 获取所有存储键
- ✅ 过滤出所有以 `cache_` 开头的键
- ✅ 删除所有找到的缓存键，包括带参数的
- ✅ 显示清除的键数量，方便调试

### 额外优化 - calendar.tsx

添加100ms等待时间，确保缓存清除操作完全生效后再加载数据：

```typescript
// 如果需要清除缓存 - 必须在加载数据前完成
if (clearCache) {
  console.log('📅 [Calendar] 清除缓存...')
  await dataService.cache.clearAll()
  console.log('📅 [Calendar] 缓存清除完成')
  // 等待一小段时间确保缓存清除生效
  await new Promise(resolve => setTimeout(resolve, 100))
}
```

```typescript
// 在 useFocusEffect 中
await dataService.cache.clearAll()
console.log('🧹 [Calendar] 缓存清除完成')
// 等待一小段时间确保缓存清除生效
await new Promise(resolve => setTimeout(resolve, 100))
console.log('📅 [Calendar] 开始加载数据')

// 再加载数据（不需要再次 clearCache，避免重复）
loadDataFromAPI(false, false).finally(() => {
  isLoadingData.current = false
})
```

## 为什么这样能解决问题？

### 原来的问题流程

```
1. 修改订单成功
2. dataService.update() 调用 cache.clearAll()
3. clearAll() 只清除基础键：cache_rooms, cache_reservations...
4. 返回 calendar.tsx
5. calendar 设置 @force_reload_calendar 标记
6. useFocusEffect 触发
7. 再次调用 cache.clearAll()（仍然无效）
8. 调用 getAll() 获取数据
9. getAll() 查找缓存键 cache_reservations_{"startDate":"2025-11-21"...}
10. 找到了！（因为没有被清除）❌
11. 返回旧缓存数据 ❌
12. 用户看到旧数据，要等缓存过期（2分钟）才能看到新数据 ❌
```

### 修复后的正确流程

```
1. 修改订单成功
2. dataService.update() 调用 cache.clearAll()
3. clearAll() 使用 getAllKeys() 找到所有缓存键
4. 清除所有以 cache_ 开头的键（包括带参数的） ✅
5. 返回 calendar.tsx
6. calendar 设置 @force_reload_calendar 标记
7. useFocusEffect 触发
8. 再次调用 cache.clearAll()（确保彻底清除）✅
9. 等待 100ms 确保清除生效 ✅
10. 调用 getAll() 获取数据
11. getAll() 查找缓存键 cache_reservations_{"startDate":"2025-11-21"...}
12. 没找到！（已被清除）✅
13. 从服务器获取最新数据 ✅
14. 用户立即看到最新数据 ✅
```

## 修改文件清单

1. ✅ `apps/mobile/app/services/dataService.ts`
   - 修复 `cache.clearAll()` 方法
   - 使用 `getAllKeys()` 找出所有缓存键
   - 清除所有以 `cache_` 开头的键

2. ✅ `apps/mobile/app/(tabs)/calendar.tsx`
   - 在 `loadDataFromAPI()` 中添加 100ms 等待
   - 在 `useFocusEffect` 中添加 100ms 等待
   - 确保缓存清除完全生效后再加载数据

## 测试建议

1. **修改订单** → 返回日历 → 应**立即**显示新数据（不是几秒后）
2. **创建订单** → 返回日历 → 应**立即**显示新数据
3. **快速连续修改多个订单** → 数据应实时更新
4. **检查日志**：
   - 应该看到 `已清除所有缓存 (N 个键)`，N 应该大于 4
   - 不应该看到 `⚡️ 使用缓存的预订列表`（紧跟在清除缓存之后）

## 预期效果

修改后，数据更新应该是**实时的**，不需要等待几秒钟。

- **修改前**：等待 2-120 秒（取决于缓存过期时间）
- **修改后**：即时更新（< 1 秒）

