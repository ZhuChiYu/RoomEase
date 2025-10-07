import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { saveRoomType, deleteRoomType as deleteRoomTypeAction, addRoomsToType, deleteRoom } from './store/calendarSlice';
import type { RoomType } from './store/types';

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

  // 从Redux获取当前房型的房间列表（已保存的）
  const savedRooms = useMemo(() => {
    return allRooms.filter(room => 
      existingRoomIds.includes(room.id) || 
      (isEditMode && room.type === formData.name)
    );
  }, [allRooms, existingRoomIds, isEditMode, formData.name]);
  
  // 组合显示：已保存的房间 + 待保存的新房间
  const currentRooms = useMemo(() => {
    const rooms = [...savedRooms];
    // 添加待保存的新房间（临时对象，仅用于显示）
    pendingNewRooms.forEach(roomName => {
      rooms.push({
        id: roomName,
        name: roomName,
        type: formData.name as RoomType,
      });
    });
    console.log('🔄 [EditRoomType] currentRooms重新计算:', {
      savedRoomsCount: savedRooms.length,
      pendingNewRoomsCount: pendingNewRooms.length,
      totalCount: rooms.length,
      rooms: rooms.map(r => r.name)
    });
    return rooms;
  }, [savedRooms, pendingNewRooms, formData.name]);

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
    // 使用时间戳作为唯一标识，用于跟踪返回的数据
    const sessionId = Date.now().toString();
    
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
            // 检查是否是待保存的房间
            if (pendingNewRooms.includes(roomId)) {
              // 从待保存列表中移除
              setPendingNewRooms(prev => prev.filter(id => id !== roomId));
              console.log('🗑️ [EditRoomType] 从待保存列表删除房间:', roomId);
            } else {
              // 从Redux删除已保存的房间
              dispatch(deleteRoom(roomId));
              console.log('🗑️ [EditRoomType] 从Redux删除房间:', roomId);
            }
          },
        },
      ]
    );
  };

  const handleDeleteRoomType = () => {
    Alert.alert(
      '确认删除',
      '删除后将不能恢复，确定要删除此房型吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            if (params.id) {
              dispatch(deleteRoomTypeAction(params.id as string));
              Alert.alert('成功', '房型已删除', [
                {
                  text: '确定',
                  onPress: () => router.back(),
                },
              ]);
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

    // 保存房型到Redux
    const roomTypeData = {
      id: params.id as string || Date.now().toString(),
      name: formData.name,
      shortName: formData.shortName,
      defaultPrice: price,
      differentiateWeekend: formData.differentiateWeekend,
    };

    // 1. 保存房型配置
    dispatch(saveRoomType(roomTypeData));
    console.log('💾 房型已保存到Redux:', roomTypeData);
    
    // 2. 如果有待保存的新房间，一起保存
    if (pendingNewRooms.length > 0) {
      dispatch(addRoomsToType({
        roomTypeName: formData.name,
        roomNames: pendingNewRooms
      }));
      console.log('🚪 房间已保存到Redux:', pendingNewRooms);
    }
    
    // 等待Redux持久化完成（防抖延迟是500ms）
    await new Promise(resolve => setTimeout(resolve, 600));

    const message = isEditMode 
      ? '房型已保存' 
      : `房型已创建${pendingNewRooms.length > 0 ? `，包含${pendingNewRooms.length}个房间` : ''}`;
    
    Alert.alert('成功', message, [
      {
        text: '确定',
        onPress: () => router.back(),
      },
    ]);
  };

  // 监听从add-rooms页面返回的数据
  useEffect(() => {
    console.log('🔍 [EditRoomType] params变化:', {
      hasNewRooms: !!params.newRooms,
      newRoomsValue: params.newRooms,
      timestamp: params._timestamp,
      allParams: params
    });
    
    if (params.newRooms) {
      try {
        const newRoomNames = JSON.parse(params.newRooms as string);
        console.log('📝 [EditRoomType] 解析到的新房间:', newRoomNames);
        
        if (newRoomNames && newRoomNames.length > 0) {
          // 暂存到待保存列表，不立即添加到Redux
          setPendingNewRooms(prev => {
            const combined = [...prev, ...newRoomNames];
            // 去重
            const uniqueRooms = Array.from(new Set(combined));
            console.log('✅ [EditRoomType] 更新pendingNewRooms:', {
              previous: prev,
              new: newRoomNames,
              result: uniqueRooms
            });
            return uniqueRooms;
          });
        }
      } catch (error) {
        console.error('❌ [EditRoomType] 解析新增房间失败:', error);
      }
    }
  }, [params.newRooms, params._timestamp]); // 监听时间戳确保每次都触发

  return (
    <View style={styles.container}>
      {/* 自定义顶部栏 */}
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
        {/* 房型信息 */}
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

        {/* 价格信息 */}
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

        {/* 房间列表 */}
        <View style={styles.section}>
          <View style={styles.roomsHeader}>
            <Text style={styles.sectionTitle}>房间 ({currentRooms.length})</Text>
            <TouchableOpacity onPress={handleAddRooms} disabled={!formData.name.trim()}>
              <Text style={[styles.addRoomsButton, !formData.name.trim() && styles.disabled]}>⊕ 添加房间</Text>
            </TouchableOpacity>
          </View>

          {currentRooms.length === 0 ? (
            <View style={styles.noRooms}>
              <Text style={styles.noRoomsText}>暂无房间</Text>
            </View>
          ) : (
            currentRooms.map((room) => (
              <View key={room.id} style={styles.roomRow}>
                <Text style={styles.roomName}>{room.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveRoom(room.id)}>
                  <Text style={styles.deleteIcon}>🗑</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* 删除房型按钮 */}
        {isEditMode && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteRoomType}
          >
            <Text style={styles.deleteButtonText}>删除房型</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roomName: {
    fontSize: 16,
    color: '#333',
  },
  deleteIcon: {
    fontSize: 18,
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
});
