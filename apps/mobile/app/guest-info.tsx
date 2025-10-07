import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface GuestInfo {
  id: string;
  name: string;
  phone: string;
  idType: string;
  idNumber: string;
}

export default function GuestInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // 入住人列表
  const [guestList, setGuestList] = useState<GuestInfo[]>([]);
  
  // 当前编辑的入住人
  const [currentGuest, setCurrentGuest] = useState<GuestInfo | null>(null);
  
  // 编辑模式
  const [isEditing, setIsEditing] = useState(false);

  // 从路由参数初始化入住人信息
  useEffect(() => {
    if (params.name && params.phone) {
      const initialGuest: GuestInfo = {
        id: Date.now().toString(),
        name: params.name as string,
        phone: params.phone as string,
        idType: (params.idType as string) || '身份证',
        idNumber: (params.idNumber as string) || '',
      };
      setGuestList([initialGuest]);
    }
  }, []);

  const idTypes = ['身份证', '护照', '其他'];

  const handleIdTypeSelect = () => {
    if (!currentGuest) return;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['取消', ...idTypes],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            setCurrentGuest({ ...currentGuest, idType: idTypes[buttonIndex - 1] });
          }
        }
      );
    }
  };

  const handleAddGuest = () => {
    const newGuest: GuestInfo = {
      id: Date.now().toString(),
      name: '',
      phone: '',
      idType: '身份证',
      idNumber: '',
    };
    setCurrentGuest(newGuest);
    setIsEditing(true);
  };

  const handlePhotoUpload = () => {
    Alert.alert('提示', '拍照/上传功能开发中');
  };

  const handleEditGuest = (guest: GuestInfo) => {
    setCurrentGuest(guest);
    setIsEditing(true);
  };

  const handleDeleteGuest = (guestId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这位入住人吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setGuestList(prev => prev.filter(g => g.id !== guestId));
          },
        },
      ]
    );
  };

  const handleSaveGuest = () => {
    if (!currentGuest) return;
    
    if (!currentGuest.name.trim()) {
      Alert.alert('提示', '请输入姓名');
      return;
    }
    if (!currentGuest.phone.trim()) {
      Alert.alert('提示', '请输入手机号');
      return;
    }

    // 检查是否已存在
    const existingIndex = guestList.findIndex(g => g.id === currentGuest.id);
    if (existingIndex >= 0) {
      // 更新
      setGuestList(prev => prev.map(g => g.id === currentGuest.id ? currentGuest : g));
    } else {
      // 新增
      setGuestList(prev => [...prev, currentGuest]);
    }
    
    setCurrentGuest(null);
    setIsEditing(false);
  };

  const handleComplete = () => {
    if (guestList.length === 0) {
      Alert.alert('提示', '请至少添加一位入住人');
      return;
    }
    
    // 返回上一页并传递入住人信息
    if (router.canGoBack()) {
      // 传递入住人列表数据
      const mainGuest = guestList[0];
      (router as any).setParams?.({
        guestName: mainGuest.name,
        guestPhone: mainGuest.phone,
        guestIdType: mainGuest.idType,
        guestIdNumber: mainGuest.idNumber,
        guestListData: JSON.stringify(guestList),
      });
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* 自定义顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>入住人</Text>
        <TouchableOpacity onPress={handleComplete} style={styles.doneButton}>
          <Text style={styles.doneText}>完成</Text>
        </TouchableOpacity>
      </View>

      {isEditing && currentGuest ? (
        /* 编辑表单 */
        <ScrollView style={styles.content}>
          <View style={styles.form}>
            {/* 姓名 */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>姓名</Text>
              <TextInput
                style={styles.formInput}
                placeholder="请输入姓名(必填)"
                placeholderTextColor="#ccc"
                value={currentGuest.name}
                onChangeText={(text) => setCurrentGuest({ ...currentGuest, name: text })}
              />
            </View>

            {/* 手机 */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>手机</Text>
              <TextInput
                style={styles.formInput}
                placeholder="请输入手机号"
                placeholderTextColor="#ccc"
                keyboardType="phone-pad"
                value={currentGuest.phone}
                onChangeText={(text) => setCurrentGuest({ ...currentGuest, phone: text })}
              />
            </View>

            {/* 证件类型 */}
            <TouchableOpacity style={styles.formRow} onPress={handleIdTypeSelect}>
              <Text style={styles.formLabel}>证件类型</Text>
              <View style={styles.formRight}>
                <Text style={styles.formValue}>{currentGuest.idType}</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>

            {/* 证件号 */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>证件号</Text>
              <TextInput
                style={styles.formInput}
                placeholder="请输入证件号"
                placeholderTextColor="#ccc"
                value={currentGuest.idNumber}
                onChangeText={(text) => setCurrentGuest({ ...currentGuest, idNumber: text })}
              />
            </View>
          </View>

          {/* 保存和取消按钮 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelActionButton]} 
              onPress={() => {
                setCurrentGuest(null);
                setIsEditing(false);
              }}
            >
              <Text style={styles.cancelActionButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveActionButton]} 
              onPress={handleSaveGuest}
            >
              <Text style={styles.saveActionButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* 入住人列表 */
        <ScrollView style={styles.content}>
          {guestList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>📁</Text>
              </View>
              <Text style={styles.emptyText}>暂无入住人</Text>
            </View>
          ) : (
            guestList.map((guest, index) => (
              <View key={guest.id} style={styles.guestCard}>
                <View style={styles.guestHeader}>
                  <Text style={styles.guestTitle}>入住人 {index + 1}</Text>
                  <View style={styles.guestActions}>
                    <TouchableOpacity onPress={() => handleEditGuest(guest)}>
                      <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteGuest(guest.id)}>
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.guestInfo}>
                  <Text style={styles.guestInfoText}>姓名：{guest.name}</Text>
                  <Text style={styles.guestInfoText}>手机：{guest.phone}</Text>
                  <Text style={styles.guestInfoText}>证件类型：{guest.idType}</Text>
                  {guest.idNumber && (
                    <Text style={styles.guestInfoText}>证件号：{guest.idNumber}</Text>
                  )}
                </View>
              </View>
            ))
          )}
          
          {/* 添加入住人按钮 */}
          <TouchableOpacity style={styles.addGuestButton} onPress={handleAddGuest}>
            <Text style={styles.addGuestIcon}>➕</Text>
            <Text style={styles.addGuestText}>添加入住人</Text>
          </TouchableOpacity>
        </ScrollView>
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
    color: '#999',
    marginBottom: 40,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1890ff',
    minWidth: 140,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  actionButtonText: {
    fontSize: 15,
    color: '#1890ff',
  },
  content: {
    flex: 1,
  },
  form: {
    backgroundColor: '#fff',
    marginTop: 10,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  formLabel: {
    fontSize: 16,
    color: '#333',
    width: 80,
  },
  formInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  formRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  formValue: {
    fontSize: 16,
    color: '#333',
    marginRight: 5,
  },
  arrow: {
    fontSize: 20,
    color: '#999',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 30,
    marginHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 8,
  },
  deleteIcon: {
    fontSize: 18,
    marginRight: 5,
  },
  deleteText: {
    fontSize: 16,
    color: '#ff4d4f',
  },
  guestCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  guestActions: {
    flexDirection: 'row',
    gap: 15,
  },
  editIcon: {
    fontSize: 18,
  },
  guestInfo: {
    gap: 8,
  },
  guestInfoText: {
    fontSize: 14,
    color: '#666',
  },
  addGuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1890ff',
    borderStyle: 'dashed',
  },
  addGuestIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#1890ff',
  },
  addGuestText: {
    fontSize: 16,
    color: '#1890ff',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    marginHorizontal: 15,
    marginTop: 20,
  },
  cancelActionButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  saveActionButton: {
    flex: 1,
    backgroundColor: '#1890ff',
  },
  cancelActionButtonText: {
    color: '#666',
  },
  saveActionButtonText: {
    color: '#fff',
  },
});

