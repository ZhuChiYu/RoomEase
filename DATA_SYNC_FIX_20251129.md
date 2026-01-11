# 数据同步问题修复 - 2025-11-29

## 问题描述

用户反馈：新增订单或者修改订单后，在房态日历上显示一下就又变回去了，然后要等一会儿才又变成正确状态。这是一个数据同步的实时性和一致性问题。

## 问题分析

### 根本原因

1. **create-order.tsx**（新增订单）：
   - ❌ 创建订单后立即 `dispatch(addReservation(...))`，这是**乐观更新**
   - ❌ 但没有设置 `@data_just_updated` 标记
   - ❌ 返回 calendar 页面时，useFocusEffect 会在 500ms 后从服务器重新获取数据
   - ❌ 如果服务器返回的数据与手动构造的对象有差异，就会导致"显示一下又变回去"

2. **edit-order.tsx**（修改订单）：
   - ✅ 已经正确实现：修改后从服务器获取最新数据 → 更新 Redux → 设置标记
   - ❌ 但调用 `dataService.reservations.getAll()` 时没有传入日期参数，与其他页面不一致

3. **calendar.tsx**（房态日历）：
   - ❌ useFocusEffect 有 500ms 防抖，在此期间显示 Redux 中的数据
   - ❌ 500ms后从服务器获取数据，可能会覆盖之前的乐观更新
   - ❌ 复杂的防抖和判断逻辑容易导致时序问题

### 问题流程图

**原始流程（有问题）**：

```
用户创建订单
  ↓
调用 API (dataService.reservations.create)
  ↓
dataService 自动清除缓存
  ↓
dispatch(addReservation(...)) ← 手动构造对象，乐观更新
  ↓
返回 calendar.tsx
  ↓
useFocusEffect 触发
  ↓
【此时显示手动构造的数据，可能与服务器数据有差异】
  ↓
500ms 防抖等待...
  ↓
从服务器获取最新数据
  ↓
【服务器数据覆盖了手动构造的数据，导致"变回去"】
  ↓
更新 Redux
  ↓
页面重新渲染（终于显示正确数据）
```

## 解决方案

### 修改内容

#### 1. create-order.tsx - 统一数据同步策略

**修改位置**：第 347-393 行

**修改前**：
```typescript
// 更新Redux状态（使用本地格式的完整对象）
dispatch(addReservation(reservation))
```

**修改后**：
```typescript
// 所有预订创建完成后，从服务器获取最新数据并更新Redux
const [updatedReservations, updatedRoomStatuses] = await Promise.all([
  dataService.reservations.getAll({
    startDate: startDateStr,
    endDate: endDateStr,
  }),
  dataService.roomStatus.getByDateRange(startDateStr, endDateStr)
])

// 更新Redux状态
dispatch(setReservations(updatedReservations))
dispatch(setRoomStatuses(updatedRoomStatuses))

// 设置标记告诉calendar页面数据刚刚更新过，避免重复加载
await AsyncStorage.setItem('@data_just_updated', Date.now().toString())
```

**关键改进**：
- ✅ 不再使用手动构造的 Reservation 对象
- ✅ 从服务器获取最新数据，确保数据一致性
- ✅ 设置 `@data_just_updated` 标记，避免 calendar 页面重复加载
- ✅ 导入必要的依赖：`AsyncStorage`、`setReservations`、`setRoomStatuses`

#### 2. edit-order.tsx - 统一 API 调用参数

**修改位置**：第 253-259 行

**修改前**：
```typescript
const [updatedReservations, updatedRoomStatuses] = await Promise.all([
  dataService.reservations.getAll(), // ❌ 没有日期参数
  dataService.roomStatus.getByDateRange(formatDate(startDate), formatDate(endDate))
])
```

**修改后**：
```typescript
const [updatedReservations, updatedRoomStatuses] = await Promise.all([
  dataService.reservations.getAll({
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }), // ✅ 传入日期参数，与 calendar.tsx 保持一致
  dataService.roomStatus.getByDateRange(formatDate(startDate), formatDate(endDate))
])
```

**关键改进**：
- ✅ 统一 API 调用参数，避免获取不必要的数据
- ✅ 提升性能和数据一致性

**同时修复**：第 274 行的类型错误
```typescript
// 修改前：thisReservation.source
// 修改后：thisReservation.channel
console.log('  - 渠道:', thisReservation.channel)
```

#### 3. calendar.tsx - 简化 useFocusEffect 逻辑

**修改位置**：第 485-549 行

**修改前**：
- 复杂的防抖逻辑（500ms timeout）
- 多重条件判断
- 清理函数处理 timer

**修改后**：
```typescript
// 页面获得焦点时刷新数据（优化后的逻辑）
useFocusEffect(
  React.useCallback(() => {
    // 检查是否刚刚从编辑/创建页面返回
    AsyncStorage.getItem('@data_just_updated').then(timestamp => {
      if (timestamp && timeSinceUpdate < 3000) {
        // 数据刚更新过，直接使用 Redux 数据，不加载
        return
      }
      
      // 立即从服务器加载最新数据（移除 500ms 防抖）
      isLoadingData.current = true
      lastDataLoadTime.current = Date.now()
      
      loadDataFromAPI(false, true).finally(() => {
        isLoadingData.current = false
      })
    })
  }, [loadDataFromAPI, reduxReservations.length, reduxRoomStatuses.length])
)
```

**关键改进**：
- ✅ 移除 500ms 防抖定时器，立即加载数据
- ✅ 简化逻辑，减少时序问题
- ✅ 移除不再使用的 `loadDataDebounceTimer` ref

## 新的数据流

**优化后的流程（正确）**：

```
用户创建订单
  ↓
调用 API (dataService.reservations.create)
  ↓
dataService 自动清除缓存
  ↓
立即从服务器并行获取最新数据
  ├─ reservations
  └─ roomStatuses
  ↓
更新 Redux（使用服务器返回的真实数据）
  ↓
设置 @data_just_updated 标记
  ↓
返回 calendar.tsx
  ↓
useFocusEffect 触发
  ↓
检测到 @data_just_updated 标记（3秒内）
  ↓
【直接使用 Redux 中的最新数据，跳过加载】
  ↓
页面立即显示正确数据 ✅
```

## 修改文件清单

1. **apps/mobile/app/create-order.tsx**
   - 修改订单创建后的数据同步逻辑
   - 添加 AsyncStorage 导入
   - 修改 Redux actions 导入（setReservations, setRoomStatuses 替代 addReservation）

2. **apps/mobile/app/edit-order.tsx**
   - 统一 API 调用参数（添加日期范围）
   - 修复类型错误（source → channel）

3. **apps/mobile/app/(tabs)/calendar.tsx**
   - 简化 useFocusEffect 逻辑
   - 移除 500ms 防抖
   - 移除 loadDataDebounceTimer ref

## 优势

1. **实时性** ✅
   - 创建/修改订单后，立即从服务器获取最新数据
   - 返回页面时立即显示正确状态，无需等待

2. **一致性** ✅
   - 所有数据都来自服务器，不依赖手动构造的对象
   - 避免客户端和服务器数据不一致

3. **可维护性** ✅
   - create-order.tsx 和 edit-order.tsx 使用相同的数据同步策略
   - calendar.tsx 逻辑更简单，减少边界情况

4. **用户体验** ✅
   - 不会出现"显示一下又变回去"的问题
   - 数据更新更流畅，无明显延迟

## 测试建议

1. **新增订单测试**：
   - 创建订单 → 返回日历 → 验证订单立即显示
   - 创建多个订单 → 验证房态正确更新

2. **修改订单测试**：
   - 修改订单信息 → 返回日历 → 验证修改立即生效
   - 修改房间 → 验证房态正确转移

3. **边界情况测试**：
   - 网络较慢时的表现
   - 快速切换页面时的表现
   - 并发创建多个订单

## 注意事项

1. **性能考虑**：
   - 每次创建/修改订单都会从服务器获取最新数据
   - 日期范围限制为前后 30 天，避免获取过多数据
   - 使用 Promise.all 并行请求，减少总耗时

2. **缓存策略**：
   - dataService 在修改数据后自动清除所有缓存
   - calendar 页面的 useFocusEffect 会清除缓存并重新加载
   - `@data_just_updated` 标记有效期为 3 秒

3. **错误处理**：
   - 如果服务器请求失败，会显示错误提示
   - 不会影响已有的 Redux 数据

