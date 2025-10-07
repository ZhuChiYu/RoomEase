# 🐛 调试日志说明

## 已添加的调试日志

### 1. Redux Store (calendarSlice.ts)
```typescript
🔄 [Redux] addReservation: {...}          // 接收到的预订数据
🔄 [Redux] 添加房态记录: {...}           // 开始添加房态
  ✅ [Redux] 添加房态: 2025-10-06 - 房间1202  // 每天的房态
✅ [Redux] 预订添加完成，共添加 2 天房态记录
📊 [Redux] 当前状态: {...}               // 当前Redux状态统计
```

### 2. 创建订单页面 (create-order.tsx)
```typescript
📝 [CreateOrder] 创建预订: {...}         // 创建的预订对象
✅ [CreateOrder] 预订已添加到Redux      // 确认已dispatch
```

### 3. 房态日历 (calendar.tsx)
```typescript
📅 [Calendar] 生成日期数据...           // 开始生成日期数据
📅 [Calendar] Redux数据: {...}          // Redux中的数据统计
📅 [Calendar] 预订详情: [...]          // 所有预订
📅 [Calendar] 房态详情: [...]          // 所有房态
✅ [Calendar] 找到预订: 2025-10-06 - 房间1202 - 张三  // 找到的预订
⚠️ [Calendar] 未找到预订信息: reservationId=xxx      // 找不到预订
📅 [Calendar] 生成完成，共 37 天        // 生成完成
👆 [Calendar] 点击单元格: {...}         // 点击单元格
📝 [Calendar] 查找到的预订: {...}       // 查找到的完整预订
```

### 4. 预订管理页面 (reservations.tsx)
```typescript
📋 [Reservations] Redux预订数据: [...]  // Redux中的预订数据
```

## 修复的问题

### 问题1: 房态日历不显示新增预订
**原因**: 
- 日历渲染时使用了错误的逻辑查找预订
- 之前：`reservations.find(r => r.roomId === room.id && r.dateIndex === dateIndex)`
- 问题：Reservation 没有 `dateIndex` 字段！

**解决方案**:
- 改为从 `dateData.rooms[room.id]` 直接获取房间状态
- 房间状态已经在 `useMemo` 中根据 `roomStatuses` 生成

### 问题2: 预订管理页面使用假数据
**原因**:
- 硬编码了示例预订数据

**解决方案**:
- 使用 `useAppSelector(state => state.calendar.reservations)` 获取真实数据
- 转换数据格式以适配页面组件

### 问题3: 点击已预订单元格跳转错误
**原因**:
- `handleCellPress` 接收的参数变更

**解决方案**:
- 修改函数以接收 `roomData` 并从中查找完整预订信息
- 添加日志追踪点击事件

## 如何查看日志

### 1. 启动应用
```bash
cd apps/mobile
pnpm start
```

### 2. 查看控制台
在 Metro bundler 控制台或浏览器控制台中查看日志输出

### 3. 关键时机的日志
- **创建订单时**: 看到 `📝 [CreateOrder]` 和 `🔄 [Redux]` 日志
- **进入日历页面**: 看到 `📅 [Calendar]` 日志
- **点击单元格**: 看到 `👆 [Calendar]` 日志
- **查看预订列表**: 看到 `📋 [Reservations]` 日志

## 完整数据流

```
1. 用户创建订单
   ↓
2. dispatch(addReservation(reservation))
   ↓
3. Redux: 添加到 reservations[]
   ↓
4. Redux: 为每天创建 roomStatuses[]
   ↓
5. Calendar: useMemo 重新生成 dates[]
   ↓
6. Calendar: 根据 roomStatuses 查找 reservations
   ↓
7. Calendar: 渲染单元格显示预订信息
   ↓
8. 用户点击单元格 → 查找预订 → 跳转详情页
```

## 验证步骤

1. **创建订单**
   - 填写表单
   - 点击"保存"
   - 查看日志：应该看到 Redux 添加了预订和房态

2. **返回日历**
   - 查看日志：应该看到生成日期数据
   - 应该看到"找到预订"的日志
   - 在日历上应该能看到预订信息（橙色背景）

3. **点击预订单元格**
   - 查看日志：应该看到点击事件和查找到的预订
   - 应该跳转到订单详情页

4. **查看预订列表**
   - 打开"预订"标签
   - 查看日志：应该看到 Redux 预订数据
   - 列表中应该显示所有预订

## 预期日志示例

```
📝 [CreateOrder] 创建预订: {
  id: "RES_1696752000000",
  roomId: "1202",
  guestName: "张三",
  checkInDate: "2025-10-06",
  checkOutDate: "2025-10-08",
  ...
}
✅ [CreateOrder] 预订已添加到Redux

🔄 [Redux] addReservation: {...}
🔄 [Redux] 添加房态记录: { roomId: '1202', checkInDate: '2025-10-06', checkOutDate: '2025-10-08' }
  ✅ [Redux] 添加房态: 2025-10-06 - 房间1202
  ✅ [Redux] 添加房态: 2025-10-07 - 房间1202
✅ [Redux] 预订添加完成，共添加 2 天房态记录
📊 [Redux] 当前状态: { reservations: 1, roomStatuses: 2 }

📅 [Calendar] 生成日期数据...
📅 [Calendar] Redux数据: { rooms: 7, reservations: 1, roomStatuses: 2 }
📅 [Calendar] 预订详情: [{ id: "RES_...", guestName: "张三", ... }]
📅 [Calendar] 房态详情: [{ roomId: "1202", date: "2025-10-06", status: "occupied", ... }, ...]
✅ [Calendar] 找到预订: 2025-10-06 - 房间1202 - 张三
✅ [Calendar] 找到预订: 2025-10-07 - 房间1202 - 张三
📅 [Calendar] 生成完成，共 37 天
```

## 故障排查

### 如果日历没有显示预订

1. **检查日志**：
   - 是否有 "Redux数据" 日志？
   - reservations 和 roomStatuses 数量是否 > 0？
   
2. **检查日期范围**：
   - 日历显示的日期是否包含预订日期？
   - 默认显示 7天前到30天后

3. **检查房间ID**：
   - 创建订单时的 roomId 是否与 Redux rooms 中的 id 匹配？
   - 如"大床房-1202" → roomId 应该是 "1202"

### 如果预订列表为空

1. **检查日志**：
   - `📋 [Reservations] Redux预订数据` 是否为空数组？
   
2. **检查 Redux store**：
   - 使用 React DevTools 查看 Redux state
   - state.calendar.reservations 是否有数据？

## 后续优化

完成调试后，可以：
1. 保留关键日志（Redux actions）
2. 移除详细的调试日志
3. 添加错误处理日志
4. 集成日志收集服务（如 Sentry）

