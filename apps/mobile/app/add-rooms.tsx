import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppDispatch } from './store/hooks';
import { addRoomsToType } from './store/calendarSlice';

export default function AddRoomsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams();
  
  const roomTypeName = params.roomTypeName as string;
  const existingRooms = params.existingRooms 
    ? JSON.parse(params.existingRooms as string) 
    : [];
  
  const [newRooms, setNewRooms] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');

  const handleAddAnother = () => {
    if (!currentInput.trim()) {
      Alert.alert('提示', '请输入房间名');
      return;
    }
    
    // 检查是否重复
    if ([...existingRooms, ...newRooms].includes(currentInput.trim())) {
      Alert.alert('提示', '房间名已存在');
      return;
    }
    
    setNewRooms([...newRooms, currentInput.trim()]);
    setCurrentInput('');
  };

  const handleComplete = () => {
    const allNewRooms = currentInput.trim() 
      ? [...newRooms, currentInput.trim()]
      : newRooms;
    
    if (allNewRooms.length === 0) {
      Alert.alert('提示', '请至少添加一个房间');
      return;
    }
    
    // 检查是否有重复
    const duplicates = allNewRooms.filter(room => existingRooms.includes(room));
    if (duplicates.length > 0) {
      Alert.alert('提示', `以下房间名已存在：${duplicates.join(', ')}`);
      return;
    }
    
    // 注意：这里只是将房间名传回上一页，不直接保存到Redux
    // 真正的保存会在上一页点击"完成"时进行
    console.log('📝 [AddRooms] 返回房间列表:', allNewRooms);
    
    // 保存数据到全局状态（使用sessionStorage的替代方案）
    const sessionId = params.sessionId || 'default-session';
    const pendingData = {
      rooms: allNewRooms,
      timestamp: Date.now(),
      sessionId: sessionId
    };
    
    if (typeof global !== 'undefined') {
      (global as any).pendingNewRooms = pendingData;
      console.log('✅ [AddRooms] 保存到全局状态:', {
        rooms: allNewRooms,
        roomsCount: allNewRooms.length,
        sessionId: sessionId,
        globalState: (global as any).pendingNewRooms
      });
    } else {
      console.error('❌ [AddRooms] global 不可用！');
    }
    
    Alert.alert('成功', `已添加 ${allNewRooms.length} 个房间`, [
      {
        text: '确定',
        onPress: () => {
          console.log('🔙 [AddRooms] 准备返回，当前全局状态:', (global as any).pendingNewRooms);
          // 直接返回，不使用replace，避免重置页面state
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 自定义顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>添加房间</Text>
        <TouchableOpacity onPress={handleComplete} style={styles.doneButton}>
          <Text style={styles.doneText}>完成</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 房型提示 */}
        {roomTypeName && (
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>正在为「{roomTypeName}」添加房间</Text>
          </View>
        )}

        {/* 输入框 */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="请输入房间名"
            placeholderTextColor="#ccc"
            value={currentInput}
            onChangeText={setCurrentInput}
            autoFocus
          />
        </View>

        {/* 继续添加按钮 */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddAnother}>
          <Text style={styles.addButtonIcon}>⊕</Text>
          <Text style={styles.addButtonText}>继续添加</Text>
        </TouchableOpacity>

        {/* 已添加的房间列表 */}
        {newRooms.length > 0 && (
          <View style={styles.roomsList}>
            <Text style={styles.roomsListTitle}>已添加的房间：</Text>
            {newRooms.map((room, index) => (
              <View key={index} style={styles.roomItem}>
                <Text style={styles.roomItemText}>{room}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const updated = [...newRooms];
                    updated.splice(index, 1);
                    setNewRooms(updated);
                  }}
                >
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  doneButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  doneText: {
    fontSize: 16,
    color: '#1890ff',
  },
  content: {
    flex: 1,
  },
  tipContainer: {
    backgroundColor: '#e6f7ff',
    marginTop: 10,
    marginHorizontal: 15,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1890ff',
  },
  tipText: {
    fontSize: 14,
    color: '#1890ff',
  },
  inputSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 15,
  },
  input: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1890ff',
  },
  addButtonIcon: {
    fontSize: 18,
    color: '#1890ff',
    marginRight: 5,
  },
  addButtonText: {
    fontSize: 15,
    color: '#1890ff',
  },
  roomsList: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
  },
  roomsListTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roomItemText: {
    fontSize: 15,
    color: '#333',
  },
  removeIcon: {
    fontSize: 18,
    color: '#ff4d4f',
  },
});
