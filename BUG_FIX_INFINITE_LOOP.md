# 房间排序功能 - Bug修复说明

## 问题描述

在实现房型排序功能时，遇到了一个React无限更新循环的错误：

```
Error: Maximum update depth exceeded. This can happen when a component 
repeatedly calls setState inside componentWillUpdate or componentDidUpdate. 
React limits the number of nested updates to prevent infinite loops.
```

**错误位置**: `apps/mobile/app/room-type-settings.tsx`

## 问题原因

原始实现中使用了 `useFocusEffect` 来在页面失去焦点时自动保存房型顺序：

```typescript
// ❌ 错误的实现
useFocusEffect(
  useCallback(() => {
    return () => {
      // 页面失去焦点时保存顺序
      if (roomTypeOrder.length > 0) {
        const updatedRoomTypes = roomTypes.map(rt => {
          const index = roomTypeOrder.indexOf(rt.id);
          return { ...rt, sortOrder: index >= 0 ? index : 999 };
        });
        dispatch(setRoomTypes(updatedRoomTypes));
      }
    };
  }, [roomTypeOrder, roomTypes, dispatch])  // ⚠️ roomTypes 在依赖项中
);
```

**问题分析**:
1. `useFocusEffect` 的依赖项包含了 `roomTypes`
2. 当 `dispatch(setRoomTypes(...))` 更新 Redux 时
3. `roomTypes` 状态变化
4. 触发 `useFocusEffect` 重新注册
5. 再次触发状态更新
6. 形成无限循环

## 解决方案

改为在用户点击编辑房型时手动保存，而不是自动保存：

```typescript
// ✅ 正确的实现
const handleEditRoomType = (roomType: any) => {
  // 在跳转前保存当前的房型顺序
  if (roomTypeOrder.length > 0 && roomTypeOrder.length === roomTypes.length) {
    const updatedRoomTypes = roomTypes.map(rt => {
      const index = roomTypeOrder.indexOf(rt.id);
      return { ...rt, sortOrder: index >= 0 ? index : 999 };
    });
    
    // 只在顺序真正变化时才更新
    const hasChanged = updatedRoomTypes.some((rt, idx) => 
      rt.sortOrder !== roomTypes[idx].sortOrder
    );
    
    if (hasChanged) {
      dispatch(setRoomTypes(updatedRoomTypes));
      console.log('💾 [房型设置] 房型顺序已保存到Redux');
    }
  }
  
  router.push({ ... });
};
```

**优点**:
1. ✅ 避免了无限循环
2. ✅ 只在真正需要时保存
3. ✅ 减少不必要的Redux更新
4. ✅ 更好的性能

## 修改文件

- `apps/mobile/app/room-type-settings.tsx`

## 测试步骤

1. 打开房型房间设置页面
2. 拖拽调整房型顺序
3. 点击某个房型进入编辑
4. 确认顺序已保存
5. 返回后再次查看，顺序保持不变

## 相关问题

如果在其他地方也遇到类似的无限循环问题，检查以下几点：

1. **避免在 effect 中更新依赖项**
   ```typescript
   // ❌ 错误
   useEffect(() => {
     setState(newValue);
   }, [state]); // state 是依赖项，又在 effect 中更新
   
   // ✅ 正确
   useEffect(() => {
     setState(newValue);
   }, []); // 或使用其他不会循环的依赖
   ```

2. **使用 useCallback 时注意依赖项**
   ```typescript
   // ❌ 错误
   const callback = useCallback(() => {
     dispatch(action(data));
   }, [data]); // 如果 data 是从 Redux 来的，可能循环
   
   // ✅ 正确
   const callback = useCallback(() => {
     dispatch(action(dataRef.current));
   }, []); // 使用 ref 避免依赖
   ```

3. **Redux 持久化中间件**
   - 确保中间件不会触发额外的更新
   - 使用防抖或节流避免频繁保存

## 后续优化建议

1. **添加防抖保存**
   ```typescript
   const debouncedSave = useMemo(
     () => debounce((order) => {
       // 保存逻辑
     }, 500),
     []
   );
   ```

2. **使用 ref 存储临时状态**
   ```typescript
   const orderRef = useRef<string[]>([]);
   
   // 更新 ref 而不是 state
   orderRef.current = newOrder;
   
   // 只在需要时同步到 Redux
   const saveOrder = () => {
     dispatch(setRoomTypes(orderRef.current));
   };
   ```

3. **添加保存按钮**
   - 让用户主动点击保存
   - 更明确的用户体验
   - 避免意外的自动保存

## 更新日期

2026-01-11

## 状态

✅ 已修复并测试

