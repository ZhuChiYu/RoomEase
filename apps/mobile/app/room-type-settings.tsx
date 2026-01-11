import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Animated,
  PanResponder,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { setRooms, setRoomTypes } from './store/calendarSlice';
import { dataService } from './services/dataService';
import type { RoomTypeConfig } from './store/types';

// 可拖拽的房型卡片组件
function DraggableRoomTypeCard({ 
  roomType, 
  onPress,
  onLongPress,
  onPressOut,
  isDragging,
}: { 
  roomType: any; 
  onPress: () => void;
  onLongPress: () => void;
  onPressOut: () => void;
  isDragging: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.roomTypeCard, isDragging && styles.roomTypeCardDragging]}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressOut={onPressOut}
      delayLongPress={300}
      activeOpacity={0.7}
    >
      <View style={styles.roomTypeContent}>
        <TouchableOpacity 
          style={styles.dragHandle}
          onLongPress={onLongPress}
          onPressOut={onPressOut}
          delayLongPress={200}
        >
          <Text style={styles.dragIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.roomTypeInfo}>
          <Text style={styles.roomTypeName}>{roomType.name}</Text>
          <Text style={styles.roomTypeSubName}>{roomType.shortName} · ¥{roomType.defaultPrice}</Text>
        </View>
        <View style={styles.roomTypeRight}>
          <Text style={styles.roomCount}>{roomType.roomCount}间</Text>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RoomTypeSettingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // 从Redux获取房型和房间数据
  const roomTypes = useAppSelector(state => state.calendar.roomTypes);
  const rooms = useAppSelector(state => state.calendar.rooms);
  
  // 房型顺序状态
  const [roomTypeOrder, setRoomTypeOrder] = useState<string[]>([]);
  
  // 拖拽状态
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  console.log('🏠 [房型设置] 当前房型数据:', roomTypes);
  console.log('🚪 [房型设置] 当前房间数据:', rooms);

  // 计算每个房型的房间数量
  const roomTypesWithRoomCount = useMemo(() => {
    console.log('🔄 [房型设置] 重新计算房型房间数量...');
    console.log('📊 [房型设置] roomTypes数量:', roomTypes.length);
    console.log('📊 [房型设置] rooms总数:', rooms.length);
    
    const typesWithCount = roomTypes.map(roomType => {
      const typeRooms = rooms.filter(room => room.type === roomType.name);
      const roomCount = typeRooms.length;
      const roomIds = typeRooms.map(room => room.id);
      
      console.log(`📊 [房型设置] ${roomType.name}: ${roomCount}间房`, typeRooms.map(r => r.name));
      
      return {
        ...roomType,
        roomCount,
        roomIds,
      };
    });
    
    // 按sortOrder排序
    typesWithCount.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    return typesWithCount;
  }, [roomTypes, rooms]);
  
  // 按顺序排列的房型列表
  const orderedRoomTypes = useMemo(() => {
    if (roomTypeOrder.length === 0) return roomTypesWithRoomCount;
    
    const ordered: any[] = [];
    const typeMap = new Map(roomTypesWithRoomCount.map(t => [t.id, t]));
    
    roomTypeOrder.forEach(id => {
      const type = typeMap.get(id);
      if (type) ordered.push(type);
    });
    
    // 添加新房型（不在roomTypeOrder中的）
    roomTypesWithRoomCount.forEach(type => {
      if (!roomTypeOrder.includes(type.id)) {
        ordered.push(type);
      }
    });
    
    return ordered;
  }, [roomTypesWithRoomCount, roomTypeOrder]);
  
  // 初始化房型顺序
  useEffect(() => {
    if (roomTypesWithRoomCount.length > 0 && roomTypeOrder.length === 0) {
      const newOrder = roomTypesWithRoomCount.map(t => t.id);
      setRoomTypeOrder(newOrder);
    }
  }, [roomTypesWithRoomCount.length]);

  // 页面获得焦点时强制从API重新加载房间数据
  useFocusEffect(
    useCallback(() => {
      console.log('📱 [房型设置] 页面获得焦点，准备刷新房间数据');
      
      const loadRooms = async () => {
        try {
          console.log('🌐 [房型设置] 从API重新加载房间列表...');
          const updatedRooms = await dataService.rooms.getAll();
          dispatch(setRooms(updatedRooms));
          console.log('✅ [房型设置] 房间数据已刷新，共', updatedRooms.length, '个房间');
          console.log('📋 [房型设置] 房间详情:', updatedRooms.map(r => ({ id: r.id, name: r.name, type: r.type })));
        } catch (error) {
          console.error('❌ [房型设置] 加载房间失败:', error);
        }
      };
      
      loadRooms();
    }, [dispatch])
  );

  const handleAddRoomType = () => {
    router.push('/edit-room-type');
  };

  const handleEditRoomType = (roomType: any) => {
    // 在跳转前保存当前的房型顺序
    if (roomTypeOrder.length > 0 && roomTypeOrder.length === roomTypes.length) {
      const updatedRoomTypes = roomTypes.map(rt => {
        const index = roomTypeOrder.indexOf(rt.id);
        return {
          ...rt,
          sortOrder: index >= 0 ? index : 999,
        };
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
    
    router.push({
      pathname: '/edit-room-type',
      params: {
        id: roomType.id,
        name: roomType.name,
        shortName: roomType.shortName,
        defaultPrice: roomType.defaultPrice.toString(),
        differentiateWeekend: roomType.differentiateWeekend ? 'true' : 'false',
        rooms: JSON.stringify(roomType.roomIds || []),
      },
    });
  };
  
  // 处理房型顺序调整
  const handleReorderRoomTypes = (fromIndex: number, toIndex: number) => {
    const newOrder = [...roomTypeOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setRoomTypeOrder(newOrder);
  };

  // 处理拖拽
  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  return (
    <View style={styles.container}>
      {/* 自定义顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>房型房间设置</Text>
        <View style={{ width: 40 }} />
      </View>

      {orderedRoomTypes.length === 0 ? (
        /* 空状态 */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📁</Text>
          </View>
          <Text style={styles.emptyText}>暂无房型房间</Text>
          <Text style={styles.emptySubText}>点击新增按钮即可创建房型房间</Text>
        </View>
      ) : (
        /* 房型列表 */
        <ScrollView style={styles.content}>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>共 {orderedRoomTypes.length} 个房型</Text>
          </View>

          {orderedRoomTypes.map((roomType, index) => (
            <DraggableRoomTypeCard
              key={roomType.id}
              roomType={roomType}
              onPress={() => handleEditRoomType(roomType)}
              onLongPress={() => handleDragStart(index)}
              onPressOut={handleDragEnd}
              isDragging={draggingIndex === index}
            />
          ))}
        </ScrollView>
      )}

      {/* 底部新增按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddRoomType}>
          <Text style={styles.addButtonText}>新增</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
  },
  backText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: {
    width: 120,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  content: {
    flex: 1,
  },
  summary: {
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  summaryText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  roomTypeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  roomTypeCardDragging: {
    opacity: 0.8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  roomTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  dragHandle: {
    marginRight: 12,
    padding: 4,
  },
  dragIcon: {
    fontSize: 18,
    color: '#999',
  },
  roomTypeInfo: {
    flex: 1,
  },
  roomTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roomTypeSubName: {
    fontSize: 14,
    color: '#999',
  },
  roomTypeRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomCount: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  arrow: {
    fontSize: 20,
    color: '#999',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#1890ff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
