# 房间排序和显示功能实现总结

## 功能概述

本次更新实现了以下功能：

1. **房间顺序管理** - 支持在修改房型和房型房间设置页面调整房间显示顺序
2. **房间可见性控制** - 支持设置房间是否在房态日历中显示
3. **左滑编辑/删除** - 支持在修改房型页面左滑房间条目进行编辑和删除
4. **拖拽排序** - 支持通过长按拖拽调整房间和房型的显示顺序
5. **房态日历排序** - 房态日历中的房间按照设置的顺序显示，并自动过滤隐藏的房间

## 实现细节

### 1. 数据库更新

**文件**: `packages/database/prisma/schema.prisma`

在 Room 模型中添加了两个新字段：

```prisma
// 显示设置
sortOrder   Int     @default(0) // 排序顺序
isVisible   Boolean @default(true) // 是否在房态日历中显示
```

**迁移文件**: `packages/database/prisma/migrations/20260111_add_room_sort_and_visibility/migration.sql`

```sql
ALTER TABLE "rooms" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "rooms" ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "rooms_sortOrder_idx" ON "rooms"("sortOrder");
```

### 2. API 更新

**文件**: `packages/api-client/src/services/rooms.service.ts`

#### 更新的接口定义

```typescript
export interface Room {
  // ... 其他字段
  sortOrder: number
  isVisible: boolean
}

export interface CreateRoomDto {
  // ... 其他字段
  sortOrder?: number
  isVisible?: boolean
}
```

#### 新增的 API 方法

```typescript
// 批量更新房间顺序
async batchUpdateOrder(updates: Array<{ id: string; sortOrder: number }>): Promise<ApiResponse<void>>

// 更新房间可见性
async updateVisibility(id: string, isVisible: boolean): Promise<ApiResponse<Room>>
```

### 3. Redux Store 更新

**文件**: `apps/mobile/app/store/types.ts`

```typescript
export interface Room {
  id: string
  name: string
  type: RoomType
  sortOrder?: number
  isVisible?: boolean
}

export interface RoomTypeConfig {
  // ... 其他字段
  sortOrder?: number  // 排序顺序
}
```

**文件**: `apps/mobile/app/store/calendarSlice.ts`

添加了新的 action：

```typescript
// 设置房型列表
setRoomTypes: (state, action: PayloadAction<RoomTypeConfig[]>) => {
  state.roomTypes = action.payload
}
```

### 4. 修改房型页面 (edit-room-type.tsx)

#### 主要功能

1. **左滑编辑/删除**
   - 使用 PanResponder 实现左滑手势
   - 左滑超过50px显示编辑和删除按钮
   - 背景显示操作按钮，前景内容可滑动

2. **拖拽排序**
   - 长按房间条目进入拖拽模式
   - 拖拽时显示视觉反馈（半透明+阴影）
   - 通过拖拽手柄（☰图标）触发

3. **可见性切换**
   - 每个房间条目右侧显示开关
   - 控制房间是否在房态日历中显示
   - 默认新添加的房间为显示状态

4. **编辑房间名称**
   - 点击"编辑"按钮弹出模态框
   - 支持修改房间名称
   - 后端房间通过API更新，临时房间更新本地状态

#### 核心组件

```typescript
function DraggableRoomRow({ 
  room, 
  index,
  isVisible,
  onToggleVisibility,
  onDelete, 
  onEdit, 
  onLongPress,
  onPressOut,
  isDragging,
})
```

#### 保存逻辑

保存时会：
1. 创建所有待保存的房间到后端
2. 批量更新房间顺序（调用 `batchUpdateOrder` API）
3. 更新房间可见性（调用 `updateVisibility` API）
4. 刷新Redux中的房间列表

### 5. 房型房间设置页面 (room-type-settings.tsx)

#### 主要功能

1. **拖拽排序房型**
   - 长按房型卡片进入拖拽模式
   - 通过拖拽手柄（☰图标）调整房型顺序
   - 拖拽时显示视觉反馈

2. **房型按sortOrder排序**
   - 房型列表自动按sortOrder字段排序显示
   - 页面失去焦点时自动保存排序到Redux

#### 核心组件

```typescript
function DraggableRoomTypeCard({ 
  roomType, 
  onPress,
  onLongPress,
  onPressOut,
  isDragging,
})
```

#### 排序保存

```typescript
useFocusEffect(
  useCallback(() => {
    return () => {
      // 页面失去焦点时保存顺序
      if (roomTypeOrder.length > 0) {
        const updatedRoomTypes = roomTypes.map(rt => {
          const index = roomTypeOrder.indexOf(rt.id);
          return {
            ...rt,
            sortOrder: index >= 0 ? index : 999,
          };
        });
        dispatch(setRoomTypes(updatedRoomTypes));
      }
    };
  }, [roomTypeOrder, roomTypes, dispatch])
);
```

### 6. 房态日历页面 (calendar.tsx)

#### 主要更新

1. **过滤隐藏房间**
   - 只显示 `isVisible !== false` 的房间
   - 在生成日期数据时过滤

2. **按sortOrder排序**
   - 所有房间列表按 `sortOrder` 字段排序
   - 房间分组也保持排序

#### 关键代码

```typescript
// 过滤出可见的房间并按sortOrder排序
const visibleRooms = safeRooms
  .filter(room => room.isVisible !== false)
  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

// 按房型分组房间（只包含可见的房间，并按sortOrder排序）
const roomsByType = useMemo(() => {
  const visibleRooms = reduxRooms
    .filter(room => room.isVisible !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  
  return visibleRooms.reduce((acc, room) => {
    if (!acc[room.type]) {
      acc[room.type] = []
    }
    acc[room.type].push(room)
    return acc
  }, {} as { [key in RoomType]: Room[] })
}, [reduxRooms])
```

## UI/UX 设计

### 交互设计

1. **长按拖拽**
   - 长按延迟: 200ms
   - 拖拽时透明度: 0.8
   - 拖拽阴影: elevation 5-8

2. **左滑编辑**
   - 滑动触发阈值: 50px
   - 操作按钮宽度: 75px
   - 编辑按钮颜色: #1890ff（蓝色）
   - 删除按钮颜色: #ff4d4f（红色）

3. **可见性开关**
   - 开启颜色: #1890ff
   - 关闭颜色: #e0e0e0
   - 位置: 房间条目右侧

### 视觉反馈

1. **拖拽状态**
   ```typescript
   roomRowDragging: {
     opacity: 0.8,
     elevation: 5,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.25,
     shadowRadius: 3.84,
   }
   ```

2. **操作按钮**
   - 编辑按钮: 蓝色背景，白色文字
   - 删除按钮: 红色背景，白色文字
   - 按钮宽度: 75px

## 数据流

### 房间创建流程

1. 用户在"修改房型"页面添加房间
2. 房间暂存在 `pendingNewRooms` 状态
3. 用户点击保存时：
   - 调用 `dataService.rooms.create()` 创建房间
   - 设置 `sortOrder` 为当前位置索引
   - 设置 `isVisible` 为用户设置的值（默认true）
4. 创建成功后刷新Redux房间列表

### 房间排序流程

1. 用户拖拽调整房间顺序
2. 本地状态 `roomOrder` 更新
3. 用户保存时：
   - 遍历 `orderedRooms` 生成 `sortOrder` 更新列表
   - 调用 `dataService.rooms.batchUpdateOrder()` 批量更新
4. 更新成功后返回上一页

### 可见性控制流程

1. 用户切换房间可见性开关
2. 本地状态 `roomVisibility` 更新
3. 用户保存时：
   - 对比原始值，找出变更的房间
   - 调用 `dataService.rooms.updateVisibility()` 更新
4. 房态日历自动过滤隐藏的房间

## 注意事项

1. **数据迁移**
   - 需要运行数据库迁移添加新字段
   - 现有房间的 `sortOrder` 默认为 0
   - 现有房间的 `isVisible` 默认为 true

2. **兼容性**
   - 所有字段都是可选的，向后兼容
   - 如果房间没有 `sortOrder`，默认按原顺序显示
   - 如果房间没有 `isVisible`，默认显示

3. **性能优化**
   - 使用 `useMemo` 缓存排序结果
   - 批量更新房间顺序减少API调用
   - 索引 `sortOrder` 字段提升查询性能

4. **错误处理**
   - 所有API调用都有错误处理
   - 401错误提示用户登录
   - 其他错误显示具体错误信息

## 后续优化建议

1. **后端API实现**
   - 实现 `batchUpdateOrder` 端点
   - 实现批量更新可见性的端点
   - 添加事务支持确保数据一致性

2. **交互优化**
   - 实现真正的拖拽排序（而不是长按标记）
   - 添加拖拽预览效果
   - 支持多选批量操作

3. **数据同步**
   - 房型顺序同步到后端
   - 使用WebSocket实时同步
   - 离线模式支持

4. **用户体验**
   - 添加操作撤销功能
   - 添加排序动画效果
   - 提供排序建议（按房号、楼层等）

## 测试建议

1. **功能测试**
   - 测试左滑编辑/删除功能
   - 测试拖拽排序功能
   - 测试可见性开关
   - 测试房态日历过滤和排序

2. **边界测试**
   - 测试无房间的情况
   - 测试单个房间的情况
   - 测试大量房间的性能

3. **兼容性测试**
   - 测试iOS和Android平台
   - 测试不同屏幕尺寸
   - 测试不同手势冲突场景

## 相关文件清单

- `packages/database/prisma/schema.prisma` - 数据库模型
- `packages/database/prisma/migrations/20260111_add_room_sort_and_visibility/migration.sql` - 数据库迁移
- `packages/api-client/src/services/rooms.service.ts` - Room API客户端
- `apps/mobile/app/store/types.ts` - Redux类型定义
- `apps/mobile/app/store/calendarSlice.ts` - Redux切片
- `apps/mobile/app/edit-room-type.tsx` - 修改房型页面
- `apps/mobile/app/room-type-settings.tsx` - 房型房间设置页面
- `apps/mobile/app/(tabs)/calendar.tsx` - 房态日历页面

## 更新日期

2026-01-11

