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

export default function AddRoomsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const existingRooms = params.existingRooms 
    ? JSON.parse(params.existingRooms as string) 
    : [];
  
  const [newRooms, setNewRooms] = useState<string[]>(['']);
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
      ? [...newRooms.filter(r => r), currentInput.trim()]
      : newRooms.filter(r => r);
    
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
    
    // 返回上一页并传递新房间列表
    // 实际应用中应该使用全局状态管理
    router.back();
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
        {newRooms.filter(r => r).length > 0 && (
          <View style={styles.roomsList}>
            <Text style={styles.roomsListTitle}>已添加的房间：</Text>
            {newRooms.filter(r => r).map((room, index) => (
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

