import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  Platform,
  StatusBar,
  Animated,
  PanResponder,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { saveRoomType, deleteRoomType as deleteRoomTypeAction, addRoomsToType, deleteRoom, setRooms } from './store/calendarSlice';
import type { RoomType, Room } from './store/types';
import { dataService } from './services/dataService';
import { authService } from './services/authService';

// 可拖拽的房间行组件
function DraggableRoomRow({ 
  room, 
  index,
  isVisible = true,
  onToggleVisibility,
  onDelete, 
  onEdit, 
  onLongPress,
  onPressOut,
  isDragging,
}: { 
  room: Room; 
  index: number;
  isVisible?: boolean;
  onToggleVisibility: (roomId: string, visible: boolean) => void;
  onDelete: (roomId: string) => void; 
  onEdit: (roomId: string) => void; 
  onLongPress: () => void;
  onPressOut: () => void;
  isDragging: boolean;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [showActions, setShowActions] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 只有横向滑动超过10px才开始响应
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        // 只允许向左滑动，最多滑动150px
        const newValue = Math.min(0, Math.max(-150, gestureState.dx));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          // 滑动超过50px，展开操作按钮
          Animated.spring(translateX, {
            toValue: -150,
            useNativeDriver: true,
          }).start();
          setShowActions(true);
        } else {
          // 否则回弹
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          setShowActions(false);
        }
      },
    })
  ).current;

  // 关闭操作按钮
  const closeActions = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setShowActions(false);
  };

  return (
    <View style={styles.roomRowContainer}>
      {/* 背景操作按钮 */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            closeActions();
            onEdit(room.id);
          }}
        >
          <Text style={styles.actionButtonText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            closeActions();
            onDelete(room.id);
          }}
        >
          <Text style={styles.actionButtonText}>删除</Text>
        </TouchableOpacity>
      </View>

      {/* 可滑动的内容 */}
      <Animated.View
        style={[
          styles.roomRowContent,
          { transform: [{ translateX }] },
          isDragging && styles.roomRowDragging,
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.roomRowLeft}>
          <TouchableOpacity 
            onLongPress={onLongPress}
            onPressOut={onPressOut}
            style={styles.dragHandle}
            delayLongPress={200}
          >
            <Text style={styles.dragIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.roomName}>{room.name}</Text>
        </View>
        <View style={styles.roomRowRight}>
          <Switch
            value={isVisible}
            onValueChange={(value) => onToggleVisibility(room.id, value)}
            trackColor={{ false: '#e0e0e0', true: '#1890ff' }}
            thumbColor="#fff"
            style={styles.visibilitySwitch}
          />
        </View>
      </Animated.View>
    </View>
  );
}

export default function EditRoomTypeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams();
  const allRooms = useAppSelector(state => state.calendar.rooms);
  
  // 判断是否是编辑模式
  const isEditMode = !!params.id;
  
  const [formData, setFormData] = useState({
    name: (params.name as string) || '',
    shortName: (params.shortName as string) || '',
    differentiateWeekend: params.differentiateWeekend === 'true',
    defaultPrice: (params.defaultPrice as string) || '',
  });
  
  const [existingRoomIds, setExistingRoomIds] = useState<string[]>(
    params.rooms ? JSON.parse(params.rooms as string) : []
  );
  
  // 保存从add-rooms页面返回的新房间名称（还未保存到Redux）
  const [pendingNewRooms, setPendingNewRooms] = useState<string[]>([]);
  
  // 房间顺序状态
  const [roomOrder, setRoomOrder] = useState<string[]>([]);
  
  // 房间可见性状态
  const [roomVisibility, setRoomVisibility] = useState<Record<string, boolean>>({});
  
  // 拖拽状态
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  
  // 编辑房间名称的弹窗
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');

  // 从Redux获取当前房型的房间列表（已保存的）
  const savedRooms = useMemo(() => {
    return allRooms.filter(room => 
      existingRoomIds.includes(room.id) || 
      (isEditMode && room.type === formData.name)
    );
  }, [allRooms, existingRoomIds, isEditMode, formData.name]);
  
  // 判断房间是否已在后端创建（UUID格式的ID）
  const isBackendRoom = (roomId: string): boolean => {
    return roomId.length > 20 && !roomId.startsWith('pending_')
  }

  // 组合显示：已保存的房间 + 待保存的新房间
  const currentRooms = useMemo(() => {
    const rooms = [...savedRooms];
    const existingNames = new Set(rooms.map(r => r.name));
    
    // 添加待保存的新房间（临时对象，仅用于显示）
    pendingNewRooms.forEach((roomName, index) => {
      if (existingNames.has(roomName)) {
        console.log('⚠️ [EditRoomType] 房间名已存在，跳过:', roomName);
        return;
      }
      
      rooms.push({
        id: `pending_${roomName}_${index}`,
        name: roomName,
        type: formData.name as RoomType,
        sortOrder: rooms.length,
        isVisible: true,
      });
    });
    
    // 按sortOrder排序
    rooms.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    console.log('🔄 [EditRoomType] currentRooms重新计算:', {
      savedRoomsCount: savedRooms.length,
      pendingNewRoomsCount: pendingNewRooms.length,
      totalCount: rooms.length,
      rooms: rooms.map(r => ({ id: r.id, name: r.name, isBackend: isBackendRoom(r.id) }))
    });
    return rooms;
  }, [savedRooms, pendingNewRooms, formData.name]);
  
  // 按顺序排列的房间列表
  const orderedRooms = useMemo(() => {
    if (roomOrder.length === 0) return currentRooms;
    
    const ordered: Room[] = [];
    const roomMap = new Map(currentRooms.map(r => [r.id, r]));
    
    roomOrder.forEach(id => {
      const room = roomMap.get(id);
      if (room) ordered.push(room);
    });
    
    // 添加新房间（不在roomOrder中的）
    currentRooms.forEach(room => {
      if (!roomOrder.includes(room.id)) {
        ordered.push(room);
      }
    });
    
    return ordered;
  }, [currentRooms, roomOrder]);

  // 初始化房间顺序和可见性
  useEffect(() => {
    if (currentRooms.length > 0) {
      const newOrder = currentRooms.map(r => r.id);
      setRoomOrder(newOrder);
      
      const newVisibility: Record<string, boolean> = {};
      currentRooms.forEach(room => {
        newVisibility[room.id] = room.isVisible !== undefined ? room.isVisible : true;
      });
      setRoomVisibility(newVisibility);
    }
  }, [currentRooms.length]); // 只在房间数量变化时重新初始化

  useEffect(() => {
    console.log('🏠 [EditRoomType] 当前房型的房间:', {
      existingRoomIds,
      pendingNewRooms,
      allRoomsCount: allRooms.length,
      currentRoomsCount: currentRooms.length,
      currentRooms: currentRooms.map(r => ({ id: r.id, name: r.name, type: r.type }))
    });
  }, [existingRoomIds, pendingNewRooms, allRooms.length, currentRooms.length]);

  useEffect(() => {
    if (isEditMode) {
      const roomsForType = allRooms.filter(room => room.type === formData.name);
      setExistingRoomIds(roomsForType.map(room => room.id));
    }
  }, [isEditMode, formData.name, allRooms]);

  const handleAddRooms = () => {
    const sessionId = Date.now().toString();
    
    console.log('➡️ [EditRoomType] 准备跳转到add-rooms:', {
      sessionId,
      roomTypeName: formData.name,
      currentRoomsCount: currentRooms.length
    });
    
    router.push({
      pathname: '/add-rooms',
      params: {
        roomTypeName: formData.name,
        existingRooms: JSON.stringify(currentRooms.map(r => r.id)),
        returnTo: 'edit-room-type',
        sessionId,
      },
    });
  };

  // 处理房间顺序调整
  const handleReorderRooms = (fromIndex: number, toIndex: number) => {
    const newOrder = [...roomOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setRoomOrder(newOrder);
  };

  // 处理拖拽
  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  // 切换房间可见性
  const handleToggleVisibility = (roomId: string, visible: boolean) => {
    setRoomVisibility(prev => ({
      ...prev,
      [roomId]: visible,
    }));
  };

  // 编辑房间名称
  const handleEditRoom = (roomId: string) => {
    const room = orderedRooms.find(r => r.id === roomId);
    if (room) {
      setEditingRoomId(roomId);
      setEditingRoomName(room.name);
      setEditModalVisible(true);
    }
  };

  // 保存房间名称编辑
  const handleSaveRoomName = async () => {
    if (!editingRoomId || !editingRoomName.trim()) {
      Alert.alert('提示', '请输入房间名称');
      return;
    }

    try {
      if (isBackendRoom(editingRoomId)) {
        // 更新后端房间
        await dataService.rooms.update(editingRoomId, { name: editingRoomName });
        // 重新加载房间列表
        const propertyId = await authService.getPropertyId();
        if (propertyId) {
          const updatedRooms = await dataService.rooms.getAll(propertyId);
          dispatch(setRooms(updatedRooms));
        }
      } else {
        // 更新临时房间（在pendingNewRooms中）
        const oldName = orderedRooms.find(r => r.id === editingRoomId)?.name;
        if (oldName) {
          setPendingNewRooms(prev => 
            prev.map(name => name === oldName ? editingRoomName : name)
          );
        }
      }
      setEditModalVisible(false);
      setEditingRoomId(null);
      setEditingRoomName('');
    } catch (error: any) {
      Alert.alert('保存失败', error.message || '无法保存房间名称');
      console.error('❌ [EditRoomType] 保存房间名称失败:', error);
    }
  };

  const handleRemoveRoom = (roomId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个房间吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            if (roomId.startsWith('pending_')) {
              const roomName = roomId.split('_')[1];
              setPendingNewRooms(prev => prev.filter(name => name !== roomName));
              console.log('🗑️ [EditRoomType] 从待保存列表删除房间:', roomName);
            } else {
              (async () => {
                try {
                  await dataService.rooms.delete(roomId);
                  dispatch(deleteRoom(roomId));
                  console.log('✅ [EditRoomType] 房间已从云服务删除:', roomId);
                  Alert.alert('成功', '房间已删除');
                } catch (error: any) {
                  if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
                    Alert.alert('需要登录', '请先登录后再操作');
                  } else {
                    Alert.alert('删除失败', error.message || '无法删除房间');
                  }
                  console.error('❌ [EditRoomType] 删除房间失败:', error);
                }
              })();
            }
          },
        },
      ]
    );
  };

  const handleDeleteRoomType = () => {
    Alert.alert(
      '确认删除',
      `删除后将不能恢复，确定要删除此房型吗？\n\n该房型下有 ${currentRooms.length} 个房间将被删除。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            if (params.id) {
              try {
                console.log('🌐 开始删除房型下的所有房间...');
                for (const room of savedRooms) {
                  try {
                    await dataService.rooms.delete(room.id);
                    console.log('✅ [EditRoomType] 房间已从云服务删除:', room.id);
                  } catch (error: any) {
                    console.error('❌ [EditRoomType] 删除房间失败:', room.id, error);
                    if (!error.message?.includes('401') && !error.message?.includes('Unauthorized')) {
                      // 非认证错误，继续
                    } else {
                      throw new Error('需要登录后才能删除房间，请先登录');
                    }
                  }
                }
                
                dispatch(deleteRoomTypeAction(params.id as string));
                console.log('✅ [EditRoomType] 房型已从Redux删除');
                
                Alert.alert('成功', '房型及其所有房间已删除', [
                  {
                    text: '确定',
                    onPress: () => router.back(),
                  },
                ]);
              } catch (error: any) {
                Alert.alert('删除失败', error.message || '无法删除房型');
                console.error('❌ [EditRoomType] 删除房型失败:', error);
              }
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('提示', '请输入房型名称');
      return;
    }
    if (!formData.shortName.trim()) {
      Alert.alert('提示', '请输入简称');
      return;
    }
    if (!formData.defaultPrice.trim()) {
      Alert.alert('提示', '请输入默认价');
      return;
    }

    const price = parseFloat(formData.defaultPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('提示', '请输入有效的价格');
      return;
    }

    try {
      const roomTypeData = {
        id: params.id as string || Date.now().toString(),
        name: formData.name,
        shortName: formData.shortName,
        defaultPrice: price,
        differentiateWeekend: formData.differentiateWeekend,
      };

      dispatch(saveRoomType(roomTypeData));
      console.log('💾 房型已保存到Redux:', roomTypeData);
      
      const roomsToCreate: string[] = []
      
      currentRooms.forEach(room => {
        if (!isBackendRoom(room.id)) {
          if (!roomsToCreate.includes(room.name)) {
            roomsToCreate.push(room.name)
          }
        }
      })
      
      pendingNewRooms.forEach(name => {
        if (!roomsToCreate.includes(name)) {
          roomsToCreate.push(name)
        }
      })
      
      console.log('🔍 [EditRoomType] 需要创建到后端的房间:', roomsToCreate)
      
      if (roomsToCreate.length > 0) {
        console.log('🌐 开始创建房间到云服务...');
        
        const propertyId = await authService.getPropertyId();
        if (!propertyId) {
          throw new Error('未找到propertyId，请先登录');
        }
        
        console.log('📋 [EditRoomType] 使用propertyId:', propertyId);
        
        for (let i = 0; i < roomsToCreate.length; i++) {
          const roomName = roomsToCreate[i];
          const roomData = {
            name: roomName,
            code: roomName,
            roomType: formData.name,
            maxGuests: 2,
            bedCount: 1,
            bathroomCount: 1,
            basePrice: price,
            propertyId: propertyId,
            isActive: true,
            sortOrder: i,
            isVisible: roomVisibility[`pending_${roomName}_${i}`] !== undefined 
              ? roomVisibility[`pending_${roomName}_${i}`] 
              : true,
          };
          
          try {
            const createdRoom = await dataService.rooms.create(roomData);
            console.log('✅ [EditRoomType] 房间已创建到云服务:', createdRoom.id, roomName);
          } catch (error: any) {
            console.error('❌ [EditRoomType] 创建房间失败:', roomName, error);
            if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
              throw new Error('需要登录后才能创建房间，请先登录');
            }
            throw new Error(`创建房间 ${roomName} 失败: ${error.message}`);
          }
        }
        
        console.log('✅ 所有房间已创建到云服务');
        
        const updatedRooms = await dataService.rooms.getAll(propertyId)
        dispatch(setRooms(updatedRooms))
        console.log('✅ 房间列表已更新到Redux，共', updatedRooms.length, '个房间')
      }
      
      // 保存房间顺序和可见性
      const propertyId = await authService.getPropertyId();
      if (propertyId) {
        const updates = orderedRooms
          .filter(room => isBackendRoom(room.id))
          .map((room, index) => ({
            id: room.id,
            sortOrder: index,
          }));
        
        if (updates.length > 0) {
          try {
            await dataService.rooms.batchUpdateOrder(updates);
            console.log('✅ 房间顺序已保存');
          } catch (error) {
            console.error('❌ 保存房间顺序失败:', error);
          }
        }
        
        // 保存可见性
        for (const room of orderedRooms) {
          if (isBackendRoom(room.id)) {
            const visibility = roomVisibility[room.id];
            if (visibility !== undefined && visibility !== room.isVisible) {
              try {
                await dataService.rooms.updateVisibility(room.id, visibility);
                console.log('✅ 房间可见性已保存:', room.id, visibility);
              } catch (error) {
                console.error('❌ 保存房间可见性失败:', room.id, error);
              }
            }
          }
        }
      }
      
      const message = isEditMode 
        ? '房型已保存' 
        : `房型已创建${pendingNewRooms.length > 0 ? `，包含${pendingNewRooms.length}个房间` : ''}`;
      
      Alert.alert('成功', message, [
        {
          text: '确定',
          onPress: () => {
            console.log('🔙 [EditRoomType] 返回上一页');
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('❌ [EditRoomType] 保存失败:', error);
      Alert.alert('保存失败', error.message || '无法保存房型');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('👀 [EditRoomType] 页面获得焦点');
      
      if (typeof global !== 'undefined' && (global as any).pendingNewRooms) {
        const pending = (global as any).pendingNewRooms;
        
        console.log('🔍 [EditRoomType] 检查全局状态:', {
          hasPending: true,
          pendingSessionId: pending.sessionId,
          rooms: pending.rooms,
          roomsCount: pending.rooms?.length
        });
        
        if (pending.rooms && pending.rooms.length > 0) {
          console.log('📝 [EditRoomType] 从全局状态获取新房间:', pending.rooms);
          
          setPendingNewRooms(prev => {
            const combined = [...prev, ...pending.rooms];
            const uniqueRooms = Array.from(new Set(combined));
            console.log('✅ [EditRoomType] 更新pendingNewRooms:', {
              previous: prev,
              new: pending.rooms,
              result: uniqueRooms
            });
            return uniqueRooms;
          });
          
          delete (global as any).pendingNewRooms;
          console.log('🧹 [EditRoomType] 已清除全局状态');
        } else {
          console.log('⏭️ [EditRoomType] 没有房间数据，跳过');
        }
      } else {
        console.log('📭 [EditRoomType] 全局状态为空');
      }
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? '修改房型' : '新增房型'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>{isEditMode ? '保存' : '完成'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>房型信息</Text>

          <View style={styles.formRow}>
            <Text style={styles.label}>房型名称</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入房型名称"
              placeholderTextColor="#ccc"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={!isEditMode}
            />
          </View>

          <View style={styles.formRow}>
            <Text style={styles.label}>简称</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入房型简称"
              placeholderTextColor="#ccc"
              value={formData.shortName}
              onChangeText={(text) => setFormData({ ...formData, shortName: text })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>价格信息</Text>

          <View style={styles.formRow}>
            <Text style={styles.label}>区分平日、周末</Text>
            <Switch
              value={formData.differentiateWeekend}
              onValueChange={(value) =>
                setFormData({ ...formData, differentiateWeekend: value })
              }
              trackColor={{ false: '#e0e0e0', true: '#1890ff' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.formRow}>
            <Text style={styles.label}>默认价</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>¥</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="请输入价格"
                placeholderTextColor="#ccc"
                keyboardType="decimal-pad"
                value={formData.defaultPrice}
                onChangeText={(text) =>
                  setFormData({ ...formData, defaultPrice: text })
                }
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.roomsHeader}>
            <Text style={styles.sectionTitle}>房间 ({orderedRooms.length})</Text>
            <TouchableOpacity onPress={handleAddRooms} disabled={!formData.name.trim()}>
              <Text style={[styles.addRoomsButton, !formData.name.trim() && styles.disabled]}>⊕ 添加房间</Text>
            </TouchableOpacity>
          </View>

          {orderedRooms.length === 0 ? (
            <View style={styles.noRooms}>
              <Text style={styles.noRoomsText}>暂无房间</Text>
            </View>
          ) : (
            orderedRooms.map((room, index) => (
              <DraggableRoomRow
                key={room.id}
                room={room}
                index={index}
                isVisible={roomVisibility[room.id] !== undefined ? roomVisibility[room.id] : true}
                onToggleVisibility={handleToggleVisibility}
                onDelete={handleRemoveRoom}
                onEdit={handleEditRoom}
                onLongPress={() => handleDragStart(index)}
                onPressOut={handleDragEnd}
                isDragging={draggingIndex === index}
              />
            ))
          )}
        </View>

        {isEditMode && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteRoomType}
          >
            <Text style={styles.deleteButtonText}>删除房型</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* 编辑房间名称弹窗 */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>编辑房间名称</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="请输入房间名称"
              placeholderTextColor="#ccc"
              value={editingRoomName}
              onChangeText={setEditingRoomName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleSaveRoomName}
              >
                <Text style={styles.modalConfirmText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  saveButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  saveText: {
    fontSize: 16,
    color: '#1890ff',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#999',
    paddingVertical: 12,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    marginLeft: 15,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  currencySymbol: {
    fontSize: 16,
    color: '#333',
    marginRight: 5,
  },
  priceInput: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    minWidth: 100,
  },
  roomsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  addRoomsButton: {
    fontSize: 14,
    color: '#1890ff',
  },
  disabled: {
    color: '#ccc',
  },
  noRooms: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  noRoomsText: {
    fontSize: 14,
    color: '#999',
  },
  roomRowContainer: {
    position: 'relative',
    height: 50,
    marginVertical: 1,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 75,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#1890ff',
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  roomRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roomRowDragging: {
    opacity: 0.8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  roomRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roomRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    marginRight: 12,
    padding: 4,
  },
  dragIcon: {
    fontSize: 18,
    color: '#999',
  },
  roomName: {
    fontSize: 16,
    color: '#333',
  },
  visibilitySwitch: {
    marginLeft: 12,
  },
  deleteButton: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 30,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#ff4d4f',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  modalConfirmButton: {
    backgroundColor: '#1890ff',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#fff',
  },
});
