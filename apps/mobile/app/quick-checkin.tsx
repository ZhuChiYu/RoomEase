import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Stack } from 'expo-router'
import { DateWheelPicker } from './components/DateWheelPicker'
import { useAppSelector } from './store/hooks'
import { dataService } from './services'
import { ocrService } from './services/ocrService'
import AsyncStorage from '@react-native-async-storage/async-storage'

// 获取本地日期字符串
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function QuickCheckinScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const allRooms = useAppSelector(state => state.calendar.rooms)

  // 表单数据
  const [formData, setFormData] = useState({
    name: (params.name as string) || '',
    idNumber: (params.idNumber as string) || '',
    gender: (params.gender as string) || '男',
    nationality: (params.nationality as string) || '汉',
    birthDate: (params.birthDate as string) || '',
    address: (params.address as string) || '',
    phone: '',
  })

  // 预订信息
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const [bookingData, setBookingData] = useState({
    checkInDate: getLocalDateString(),
    checkOutDate: getLocalDateString(tomorrow),
    roomId: '',
    roomName: '请选择房间',
    roomType: '',
    price: 0,
  })

  // UI状态
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [datePickerType, setDatePickerType] = useState<'checkIn' | 'checkOut'>('checkIn')
  const [roomSelectModalVisible, setRoomSelectModalVisible] = useState(false)
  const [priceModalVisible, setPriceModalVisible] = useState(false)
  const [editingPrice, setEditingPrice] = useState('')
  const [expandedRoomTypes, setExpandedRoomTypes] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 验证身份证号
  useEffect(() => {
    if (formData.idNumber && ocrService.validateIDNumber(formData.idNumber)) {
      // 从身份证号提取信息
      const extracted = ocrService.extractInfoFromIDNumber(formData.idNumber)
      if (extracted.birthDate && !formData.birthDate) {
        setFormData(prev => ({
          ...prev,
          birthDate: extracted.birthDate || prev.birthDate,
          gender: extracted.gender || prev.gender,
        }))
      }
    }
  }, [formData.idNumber])

  // 展开所有房型
  useEffect(() => {
    if (roomSelectModalVisible) {
      const allTypes = new Set(allRooms.map(room => room.type))
      setExpandedRoomTypes(allTypes)
    }
  }, [roomSelectModalVisible, allRooms])

  // 计算入住天数
  const calculateNights = () => {
    const checkIn = new Date(bookingData.checkInDate)
    const checkOut = new Date(bookingData.checkOutDate)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // 计算总金额
  const totalAmount = bookingData.price * calculateNights()

  // 处理日期选择
  const handleDateSelect = (date: string) => {
    setBookingData(prev => ({
      ...prev,
      [datePickerType === 'checkIn' ? 'checkInDate' : 'checkOutDate']: date,
    }))
  }

  // 打开日期选择器
  const openDatePicker = (type: 'checkIn' | 'checkOut') => {
    setDatePickerType(type)
    setDatePickerVisible(true)
  }

  // 按房型分组房间
  const getRoomsByType = () => {
    const grouped = new Map<string, typeof allRooms>()
    allRooms.forEach(room => {
      const type = room.type
      if (!grouped.has(type)) {
        grouped.set(type, [])
      }
      grouped.get(type)!.push(room)
    })
    return grouped
  }

  // 切换房型展开
  const toggleRoomType = (roomType: string) => {
    const newExpanded = new Set(expandedRoomTypes)
    if (newExpanded.has(roomType)) {
      newExpanded.delete(roomType)
    } else {
      newExpanded.add(roomType)
    }
    setExpandedRoomTypes(newExpanded)
  }

  // 选择房间
  const handleSelectRoom = (room: any) => {
    setBookingData(prev => ({
      ...prev,
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      price: room.basePrice || 200,
    }))
    setRoomSelectModalVisible(false)
  }

  // 打开价格编辑
  const handlePricePress = () => {
    setEditingPrice(bookingData.price.toString())
    setPriceModalVisible(true)
  }

  // 确认价格
  const handlePriceConfirm = () => {
    const newPrice = parseFloat(editingPrice)
    if (!isNaN(newPrice) && newPrice >= 0) {
      setBookingData(prev => ({ ...prev, price: newPrice }))
      setPriceModalVisible(false)
    } else {
      Alert.alert('提示', '请输入有效的价格')
    }
  }

  // 重新扫描身份证
  const handleRescan = () => {
    router.replace('/camera/id-card-scan')
  }

  // 提交订单
  const handleSubmit = async () => {
    // 验证必填项
    if (!formData.name.trim()) {
      Alert.alert('提示', '请输入客人姓名')
      return
    }
    if (!formData.phone.trim()) {
      Alert.alert('提示', '请输入手机号')
      return
    }
    if (formData.phone.length !== 11) {
      Alert.alert('提示', '请输入正确的手机号')
      return
    }
    if (!formData.idNumber.trim()) {
      Alert.alert('提示', '请输入身份证号')
      return
    }
    if (!ocrService.validateIDNumber(formData.idNumber)) {
      Alert.alert('提示', '身份证号格式不正确')
      return
    }
    if (!bookingData.roomId) {
      Alert.alert('提示', '请选择房间')
      return
    }
    if (bookingData.price <= 0) {
      Alert.alert('提示', '请设置房费')
      return
    }

    setIsSubmitting(true)

    try {
      // 获取propertyId
      const { authService } = await import('./services/authService')
      const propertyId = await authService.getPropertyId()

      const nights = calculateNights()
      const orderId = Date.now().toString()

      // 构造预订数据
      const reservationData = {
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        guestCount: 1,
        childCount: 0,
        roomRate: bookingData.price,
        totalAmount: totalAmount,
        guestName: formData.name,
        guestPhone: formData.phone,
        guestIdNumber: formData.idNumber,
        notes: `快速录入 | 性别: ${formData.gender} | 民族: ${formData.nationality}${formData.address ? ' | 地址: ' + formData.address : ''}`,
        propertyId: propertyId || 'demo-property',
        roomId: bookingData.roomId,
        source: '快速录入',
      }

      console.log('📝 [QuickCheckin] 创建预订:', reservationData)

      // 创建预订
      const createdReservation = await dataService.reservations.create(reservationData)

      console.log('✅ [QuickCheckin] 预订创建成功:', createdReservation.id)

      // 设置强制刷新标记
      await AsyncStorage.setItem('@force_reload_calendar', Date.now().toString())

      setIsSubmitting(false)

      // 显示成功提示
      Alert.alert(
        '入住成功',
        `${formData.name} 已成功入住 ${bookingData.roomName}\n\n入住日期: ${bookingData.checkInDate}\n退房日期: ${bookingData.checkOutDate}\n房费: ¥${totalAmount.toFixed(2)}`,
        [
          {
            text: '返回首页',
            onPress: () => router.replace('/(tabs)'),
          },
          {
            text: '查看详情',
            onPress: () => {
              router.replace({
                pathname: '/order-details',
                params: {
                  reservationId: createdReservation.id,
                  orderId,
                  guestName: formData.name,
                  guestPhone: formData.phone,
                  channel: '快速录入',
                  checkInDate: bookingData.checkInDate,
                  checkOutDate: bookingData.checkOutDate,
                  roomType: `${bookingData.roomType} - ${bookingData.roomName}`,
                  roomPrice: bookingData.price.toString(),
                  guestCount: '1',
                  nights: nights.toString(),
                  totalAmount: totalAmount.toString(),
                },
              })
            },
          },
        ]
      )
    } catch (error: any) {
      console.error('❌ [QuickCheckin] 创建预订失败:', error)
      setIsSubmitting(false)
      Alert.alert('错误', error.message || '创建预订失败，请重试')
    }
  }

  return (
    <>
      {/* 隐藏导航栏 */}
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      
      <View style={styles.container}>
        {/* 顶部标题栏 */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>快速录入</Text>
        <TouchableOpacity onPress={handleRescan}>
          <Text style={styles.rescanButton}>重新扫描</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 客人信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>客人信息</Text>

          <View style={styles.formItem}>
            <Text style={styles.label}>姓名 *</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入姓名"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>身份证号 *</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入身份证号"
              value={formData.idNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, idNumber: text }))}
              maxLength={18}
            />
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>手机号 *</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入手机号"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              maxLength={11}
            />
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>性别</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[styles.genderButton, formData.gender === '男' && styles.genderButtonActive]}
                onPress={() => setFormData(prev => ({ ...prev, gender: '男' }))}
              >
                <Text style={[styles.genderText, formData.gender === '男' && styles.genderTextActive]}>男</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderButton, formData.gender === '女' && styles.genderButtonActive]}
                onPress={() => setFormData(prev => ({ ...prev, gender: '女' }))}
              >
                <Text style={[styles.genderText, formData.gender === '女' && styles.genderTextActive]}>女</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>民族</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入民族"
              value={formData.nationality}
              onChangeText={(text) => setFormData(prev => ({ ...prev, nationality: text }))}
            />
          </View>

          {formData.birthDate && (
            <View style={styles.formItem}>
              <Text style={styles.label}>出生日期</Text>
              <Text style={styles.displayText}>{formData.birthDate}</Text>
            </View>
          )}

          {formData.address && (
            <View style={styles.formItem}>
              <Text style={styles.label}>地址</Text>
              <Text style={[styles.displayText, styles.addressText]} numberOfLines={2}>
                {formData.address}
              </Text>
            </View>
          )}
        </View>

        {/* 预订信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>预订信息</Text>

          <TouchableOpacity
            style={styles.formItem}
            onPress={() => openDatePicker('checkIn')}
          >
            <Text style={styles.label}>入住日期 *</Text>
            <View style={styles.selectContainer}>
              <Text style={styles.selectText}>{bookingData.checkInDate}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.formItem}
            onPress={() => openDatePicker('checkOut')}
          >
            <Text style={styles.label}>退房日期 *</Text>
            <View style={styles.selectContainer}>
              <Text style={styles.selectText}>{bookingData.checkOutDate}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.formItem}>
            <Text style={styles.label}>入住时长</Text>
            <Text style={styles.displayText}>{calculateNights()}晚</Text>
          </View>

          <TouchableOpacity
            style={styles.formItem}
            onPress={() => setRoomSelectModalVisible(true)}
          >
            <Text style={styles.label}>房间 *</Text>
            <View style={styles.selectContainer}>
              <Text style={[styles.selectText, !bookingData.roomId && styles.placeholderText]}>
                {bookingData.roomId ? `${bookingData.roomType} - ${bookingData.roomName}` : bookingData.roomName}
              </Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.formItem}
            onPress={handlePricePress}
          >
            <Text style={styles.label}>房费 *</Text>
            <View style={styles.selectContainer}>
              <Text style={styles.selectText}>¥{bookingData.price.toFixed(2)}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>总金额</Text>
            <Text style={styles.totalAmount}>¥{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* 提示信息 */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>💡 请确认信息准确无误后提交</Text>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>确认入住</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 日期选择器 */}
      <DateWheelPicker
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={handleDateSelect}
        initialDate={datePickerType === 'checkIn' ? bookingData.checkInDate : bookingData.checkOutDate}
        title={datePickerType === 'checkIn' ? '选择入住日期' : '选择退房日期'}
      />

      {/* 房间选择弹窗 */}
      <Modal
        visible={roomSelectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoomSelectModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRoomSelectModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.roomSelectSheet}>
              <View style={styles.roomSelectHeader}>
                <Text style={styles.roomSelectTitle}>选择房间</Text>
                <TouchableOpacity
                  style={styles.roomSelectClose}
                  onPress={() => setRoomSelectModalVisible(false)}
                >
                  <Text style={styles.roomSelectCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.roomSelectContent}
                contentContainerStyle={styles.roomSelectContentContainer}
              >
              {Array.from(getRoomsByType().entries()).map(([roomType, roomsOfType]) => (
                <View key={roomType}>
                  <TouchableOpacity
                    style={styles.roomTypeHeader}
                    onPress={() => toggleRoomType(roomType)}
                  >
                    <Text style={styles.roomTypeTitle}>{roomType}</Text>
                    <Text style={styles.roomTypeArrow}>
                      {expandedRoomTypes.has(roomType) ? '∧' : '∨'}
                    </Text>
                  </TouchableOpacity>

                  {expandedRoomTypes.has(roomType) && roomsOfType.map(room => (
                    <TouchableOpacity
                      key={room.id}
                      style={styles.roomOption}
                      onPress={() => handleSelectRoom(room)}
                    >
                      <View>
                        <Text style={styles.roomOptionText}>{room.name}</Text>
                        <Text style={styles.roomOptionPrice}>¥{room.basePrice || 200}/晚</Text>
                      </View>
                      <View style={[
                        styles.roomRadio,
                        bookingData.roomId === room.id && styles.roomRadioSelected,
                      ]}>
                        {bookingData.roomId === room.id && <View style={styles.roomRadioInner} />}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 价格编辑弹窗 */}
      <Modal
        visible={priceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPriceModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.priceModalContainer}>
                  <View style={styles.priceModalHeader}>
                    <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
                      <Text style={styles.priceModalCancel}>取消</Text>
                    </TouchableOpacity>
                    <Text style={styles.priceModalTitle}>设置房费</Text>
                    <TouchableOpacity onPress={handlePriceConfirm}>
                      <Text style={styles.priceModalConfirm}>确定</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.priceModalContent}>
                    <View style={styles.priceInputRow}>
                      <Text style={styles.priceLabel}>每晚房费</Text>
                      <View style={styles.priceInputContainer}>
                        <Text style={styles.priceSymbol}>¥</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={editingPrice}
                          onChangeText={setEditingPrice}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          autoFocus
                        />
                      </View>
                    </View>

                    <View style={styles.priceSummary}>
                      <Text style={styles.priceSummaryText}>
                        {calculateNights()}晚 × ¥{parseFloat(editingPrice) || 0} = ¥{((parseFloat(editingPrice) || 0) * calculateNights()).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
      </View>
    </>
  )
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 12,
    backgroundColor: '#6366f1',
  },
  backButton: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  rescanButton: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 16,
  },
  formItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 90,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  displayText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  addressText: {
    fontSize: 12,
    lineHeight: 18,
  },
  selectContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  selectText: {
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  arrow: {
    fontSize: 20,
    color: '#999',
    marginLeft: 8,
  },
  genderContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  genderButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  genderButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  genderText: {
    fontSize: 14,
    color: '#666',
  },
  genderTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  tipContainer: {
    backgroundColor: '#f0f9ff',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  tipText: {
    fontSize: 13,
    color: '#1e40af',
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  roomSelectSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: '60%',
    maxHeight: '80%',
  },
  roomSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  roomSelectTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  roomSelectClose: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 8,
  },
  roomSelectCloseText: {
    fontSize: 24,
    color: '#999',
  },
  roomSelectContent: {
    maxHeight: '70%',
  },
  roomSelectContentContainer: {
    paddingBottom: 20,
  },
  roomTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  roomTypeTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  roomTypeArrow: {
    fontSize: 16,
    color: '#999',
  },
  roomOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
    minHeight: 60,
  },
  roomOptionText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  roomOptionPrice: {
    fontSize: 13,
    color: '#666',
  },
  roomRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomRadioSelected: {
    borderColor: '#6366f1',
  },
  roomRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  priceModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  priceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceModalCancel: {
    fontSize: 15,
    color: '#666',
  },
  priceModalConfirm: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
  },
  priceModalContent: {
    padding: 20,
  },
  priceInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceSymbol: {
    fontSize: 17,
    color: '#333',
    marginRight: 4,
  },
  priceInput: {
    fontSize: 17,
    color: '#333',
    textAlign: 'right',
    minWidth: 100,
    fontWeight: '500',
  },
  priceSummary: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  priceSummaryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})

