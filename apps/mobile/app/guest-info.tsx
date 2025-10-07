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
  name: string;
  phone: string;
  idType: string;
  idNumber: string;
}

export default function GuestInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // 判断是否是编辑模式
  const isEdit = params.name || params.phone || params.idType || params.idNumber;

  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    name: (params.name as string) || '',
    phone: (params.phone as string) || '',
    idType: (params.idType as string) || '身份证',
    idNumber: (params.idNumber as string) || '',
  });

  const [showEmpty, setShowEmpty] = useState(!isEdit);

  const idTypes = ['身份证', '护照', '其他'];

  const handleIdTypeSelect = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['取消', ...idTypes],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            setGuestInfo({ ...guestInfo, idType: idTypes[buttonIndex - 1] });
          }
        }
      );
    }
  };

  const handleManualAdd = () => {
    setShowEmpty(false);
  };

  const handlePhotoUpload = () => {
    Alert.alert('提示', '拍照/上传功能开发中');
  };

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      '确定要删除这位入住人吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            // 返回上一页并清空入住人信息
            router.back();
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    if (!guestInfo.name.trim()) {
      Alert.alert('提示', '请输入姓名');
      return;
    }
    if (!guestInfo.phone.trim()) {
      Alert.alert('提示', '请输入手机号');
      return;
    }

    // 返回上一页并传递入住人信息
    router.back();
    // 使用全局状态或事件来传递数据
    // 这里简化处理，实际应用中可以使用 Context 或状态管理库
    if (router.canGoBack()) {
      // 数据会通过导航参数传递
      (router as any).setParams?.({
        guestName: guestInfo.name,
        guestPhone: guestInfo.phone,
        guestIdType: guestInfo.idType,
        guestIdNumber: guestInfo.idNumber,
      });
    }
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

      {showEmpty ? (
        /* 空状态 */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📁</Text>
          </View>
          <Text style={styles.emptyText}>暂无入住人</Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.actionButton} onPress={handlePhotoUpload}>
              <Text style={styles.actionButtonIcon}>📷</Text>
              <Text style={styles.actionButtonText}>拍照/上传</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleManualAdd}>
              <Text style={styles.actionButtonIcon}>➕</Text>
              <Text style={styles.actionButtonText}>手动添加</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* 表单 */
        <ScrollView style={styles.content}>
          <View style={styles.form}>
            {/* 姓名 */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>姓名</Text>
              <TextInput
                style={styles.formInput}
                placeholder="请输入姓名(必填)"
                placeholderTextColor="#ccc"
                value={guestInfo.name}
                onChangeText={(text) => setGuestInfo({ ...guestInfo, name: text })}
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
                value={guestInfo.phone}
                onChangeText={(text) => setGuestInfo({ ...guestInfo, phone: text })}
              />
            </View>

            {/* 证件类型 */}
            <TouchableOpacity style={styles.formRow} onPress={handleIdTypeSelect}>
              <Text style={styles.formLabel}>证件类型</Text>
              <View style={styles.formRight}>
                <Text style={styles.formValue}>{guestInfo.idType}</Text>
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
                value={guestInfo.idNumber}
                onChangeText={(text) => setGuestInfo({ ...guestInfo, idNumber: text })}
              />
            </View>
          </View>

          {/* 删除按钮 */}
          {isEdit && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteIcon}>🗑</Text>
              <Text style={styles.deleteText}>删除</Text>
            </TouchableOpacity>
          )}
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
});

