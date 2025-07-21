import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'

const { width, height } = Dimensions.get('window')

interface IDCardInfo {
  name: string
  idNumber: string
  address: string
  nationality: string
  gender: string
  birthDate: string
  phone: string
}

export default function GuestRegistrationScreen() {
  const router = useRouter()
  const [guestData, setGuestData] = useState<IDCardInfo>({
    name: '',
    idNumber: '',
    address: '',
    nationality: '汉',
    gender: '男',
    birthDate: '',
    phone: ''
  })
  const [showRoomSelection, setShowRoomSelection] = useState(false)

  const handleInputChange = (field: keyof IDCardInfo, value: string) => {
    setGuestData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!guestData.name.trim()) {
      Alert.alert('提示', '请输入客人姓名')
      return false
    }
    if (!guestData.idNumber.trim()) {
      Alert.alert('提示', '请输入身份证号码')
      return false
    }
    if (!guestData.phone.trim()) {
      Alert.alert('提示', '请输入联系电话')
      return false
    }
    if (guestData.idNumber.length !== 18) {
      Alert.alert('提示', '身份证号码格式不正确')
      return false
    }
    return true
  }

  const handleSubmit = () => {
    if (validateForm()) {
      setShowRoomSelection(true)
    }
  }

  const resetForm = () => {
    setGuestData({
      name: '',
      idNumber: '',
      address: '',
      nationality: '汉',
      gender: '男',
      birthDate: '',
      phone: ''
    })
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>‹ 返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>客人信息登记</Text>
          <TouchableOpacity onPress={resetForm}>
            <Text style={styles.resetButton}>重置</Text>
          </TouchableOpacity>
        </View>

        {/* 表单区域 */}
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formContent}>
            <Text style={styles.sectionTitle}>基本信息</Text>
            
            {/* 姓名 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>姓名 *</Text>
              <TextInput
                style={styles.fieldInput}
                value={guestData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="请输入客人姓名"
                maxLength={20}
              />
            </View>

            {/* 身份证号 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>身份证号 *</Text>
              <TextInput
                style={styles.fieldInput}
                value={guestData.idNumber}
                onChangeText={(text) => handleInputChange('idNumber', text)}
                placeholder="请输入18位身份证号码"
                keyboardType="numeric"
                maxLength={18}
              />
            </View>

            {/* 联系电话 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>联系电话 *</Text>
              <TextInput
                style={styles.fieldInput}
                value={guestData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                placeholder="请输入手机号码"
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>

            {/* 性别选择 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>性别</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity 
                  style={[styles.genderButton, guestData.gender === '男' && styles.genderButtonActive]}
                  onPress={() => handleInputChange('gender', '男')}
                >
                  <Text style={[styles.genderText, guestData.gender === '男' && styles.genderTextActive]}>男</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.genderButton, guestData.gender === '女' && styles.genderButtonActive]}
                  onPress={() => handleInputChange('gender', '女')}
                >
                  <Text style={[styles.genderText, guestData.gender === '女' && styles.genderTextActive]}>女</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 民族 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>民族</Text>
              <TextInput
                style={styles.fieldInput}
                value={guestData.nationality}
                onChangeText={(text) => handleInputChange('nationality', text)}
                placeholder="请输入民族"
                maxLength={10}
              />
            </View>

            {/* 出生日期 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>出生日期</Text>
              <TextInput
                style={styles.fieldInput}
                value={guestData.birthDate}
                onChangeText={(text) => handleInputChange('birthDate', text)}
                placeholder="如：1995年8月28日"
                maxLength={15}
              />
            </View>

            {/* 地址 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>地址</Text>
              <TextInput
                style={[styles.fieldInput, { height: 80 }]}
                value={guestData.address}
                onChangeText={(text) => handleInputChange('address', text)}
                placeholder="请输入详细地址"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>

            {/* 说明 */}
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>💡 请确保信息准确无误，带*为必填项</Text>
            </View>
          </View>
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>确认信息并选择房间</Text>
          </TouchableOpacity>
        </View>

        {/* 房间选择模态 */}
        <RoomSelectionModal
          visible={showRoomSelection}
          guestData={guestData}
          onRoomSelected={(roomId) => {
            Alert.alert(
              '入住成功',
              `${guestData.name} 已成功入住 ${roomId}`,
              [
                {
                  text: '确定',
                  onPress: () => {
                    setShowRoomSelection(false)
                    resetForm()
                    router.back()
                  }
                }
              ]
            )
          }}
          onCancel={() => {
            setShowRoomSelection(false)
          }}
        />
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#6366f1',
    paddingTop: 50,
  },
  backButton: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  resetButton: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#1e293b',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  genderButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  genderText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  genderTextActive: {
    color: 'white',
  },
  noteContainer: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginTop: 10,
  },
  noteText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 模态样式
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.7,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  roomList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  roomType: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  roomCancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  roomCancelText: {
    color: '#64748b',
    fontWeight: '600',
  },
}) 