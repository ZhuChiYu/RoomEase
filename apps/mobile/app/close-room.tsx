import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActionSheetIOS,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppDispatch } from './store/hooks';
import { closeRoom } from './store/calendarSlice';

export default function CloseRoomScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams();
  const { roomId, roomNumber } = params;

  const [roomType, setRoomType] = useState('停用房');
  const [note, setNote] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const roomTypes = ['维修房', '保留房', '停用房'];

  const handleTypeSelect = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['取消', ...roomTypes],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            setRoomType(roomTypes[buttonIndex - 1]);
          }
        }
      );
    } else {
      setShowTypePicker(true);
    }
  };

  const handleSubmit = () => {
    if (!note.trim()) {
      Alert.alert('提示', '请输入关房理由');
      return;
    }

    // 关房30天
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // 更新Redux状态
    dispatch(closeRoom({
      roomId: roomId as string,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      note: `${roomType}: ${note}`,
    }));

    Alert.alert('成功', '关房设置成功', [
      {
        text: '确定',
        onPress: () => {
          // 返回房态日历并刷新
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
        <Text style={styles.headerTitle}>关房</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.doneButton}>
          <Text style={styles.doneText}>完成</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 提示信息 */}
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            原间转"停用房"或"维修房"后，将会影响入住 ⓘ
          </Text>
        </View>

        {/* 选择关房类型 */}
        <TouchableOpacity style={styles.row} onPress={handleTypeSelect}>
          <Text style={styles.label}>选择关房类型</Text>
          <View style={styles.rowRight}>
            <Text style={styles.value}>{roomType}</Text>
            <Text style={styles.arrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* 备注 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>备注</Text>
          <TextInput
            style={styles.textArea}
            placeholder="请输入关房理由"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            maxLength={200}
            value={note}
            onChangeText={setNote}
          />
          <Text style={styles.counter}>{note.length}/200</Text>
        </View>
      </ScrollView>

      {/* Android 类型选择器 */}
      {Platform.OS === 'android' && showTypePicker && (
        <View style={styles.pickerModal}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>选择关房类型</Text>
            {roomTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.pickerOption}
                onPress={() => {
                  setRoomType(type);
                  setShowTypePicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.pickerOption, styles.pickerCancel]}
              onPress={() => setShowTypePicker(false)}
            >
              <Text style={styles.pickerCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  tip: {
    backgroundColor: '#fff9e6',
    padding: 12,
    margin: 15,
    borderRadius: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#ff9800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    color: '#666',
    marginRight: 5,
  },
  arrow: {
    fontSize: 20,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  pickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  pickerOption: {
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  pickerCancel: {
    marginTop: 10,
    borderBottomWidth: 0,
  },
  pickerCancelText: {
    fontSize: 16,
    color: '#999',
  },
});

