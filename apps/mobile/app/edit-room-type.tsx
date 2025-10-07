import React, { useState } from 'react';
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

export default function EditRoomTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // 判断是否是编辑模式
  const isEditMode = !!params.id;
  
  const [formData, setFormData] = useState({
    name: (params.name as string) || '',
    shortName: (params.shortName as string) || '',
    differentiateWeekend: false,
    defaultPrice: (params.defaultPrice as string) || '',
  });
  
  const [rooms, setRooms] = useState<string[]>(
    params.rooms ? JSON.parse(params.rooms as string) : []
  );

  const handleAddRooms = () => {
    router.push({
      pathname: '/add-rooms',
      params: {
        existingRooms: JSON.stringify(rooms),
      },
    });
  };

  const handleRemoveRoom = (index: number) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个房间吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            const newRooms = rooms.filter((_, i) => i !== index);
            setRooms(newRooms);
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
            // TODO: 调用API删除房型
            Alert.alert('成功', '房型已删除', [
              {
                text: '确定',
                onPress: () => router.back(),
              },
            ]);
          },
        },
      ]
    );
  };

  const handleSave = () => {
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

    // TODO: 调用API保存房型
    Alert.alert('成功', isEditMode ? '房型已保存' : '房型已创建', [
      {
        text: '确定',
        onPress: () => router.back(),
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
            <Text style={styles.sectionTitle}>房间 ({rooms.length})</Text>
            <TouchableOpacity onPress={handleAddRooms}>
              <Text style={styles.addRoomsButton}>⊕ 添加房间</Text>
            </TouchableOpacity>
          </View>

          {rooms.length === 0 ? (
            <View style={styles.noRooms}>
              <Text style={styles.noRoomsText}>暂无房间</Text>
            </View>
          ) : (
            rooms.map((room, index) => (
              <View key={index} style={styles.roomRow}>
                <Text style={styles.roomName}>{room}</Text>
                <TouchableOpacity onPress={() => handleRemoveRoom(index)}>
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

