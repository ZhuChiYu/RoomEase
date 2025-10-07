import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'
import { DateWheelPicker } from './components/DateWheelPicker'
import { useAppDispatch } from './store/hooks'
import { addReservation } from './store/calendarSlice'
import type { Reservation } from './store/types'

export default function CreateOrderScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestIdType: '身份证',
    guestIdNumber: '',
    channel: '自来客',
    checkInDate: '2025-10-06',
    checkOutDate: '2025-10-08',
    roomType: '大床房-1202',
    roomPrice: 1000.00,
    dailyPrices: [] as Array<{ date: string; price: number }>,
    guestCount: 0,
  })

  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [datePickerType, setDatePickerType] = useState<'checkIn' | 'checkOut'>('checkIn')
  const [channelModalVisible, setChannelModalVisible] = useState(false)
  const [roomModalVisible, setRoomModalVisible] = useState(false)
  const [guestCountModalVisible, setGuestCountModalVisible] = useState(false)
  const [priceModalVisible, setPriceModalVisible] = useState(false)
  const [editingPrice, setEditingPrice] = useState('')

  // 计算入住时长（天数）
  const calculateNights = () => {
    const checkIn = new Date(formData.checkInDate)
    const checkOut = new Date(formData.checkOutDate)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const nights = calculateNights()
  const totalAmount = formData.roomPrice

  // 渠道选项
  const channels = ['自来客', '携程', '美团', '飞猪', '去哪儿', 'Booking', '电话预订', '其他']
  
  // 房间选项
  const rooms = [
    '大床房-1202',
    '大床房-1203',
    '双人房-12345',
    '豪华房-1301',
    '套房-1401',
  ]

  // 处理日期选择
  const handleDateSelect = (date: string) => {
    if (datePickerType === 'checkIn') {
      setFormData(prev => ({ ...prev, checkInDate: date }))
    } else {
      setFormData(prev => ({ ...prev, checkOutDate: date }))
    }
  }

  // 打开日期选择器
  const openDatePicker = (type: 'checkIn' | 'checkOut') => {
    setDatePickerType(type)
    setDatePickerVisible(true)
  }

  // 打开入住人页面
  const handleGuestInfoPress = () => {
    router.push({
      pathname: '/guest-info',
      params: {
        name: formData.guestName,
        phone: formData.guestPhone,
        idType: formData.guestIdType,
        idNumber: formData.guestIdNumber,
      }
    })
  }

  // 打开房费编辑
  const handlePricePress = () => {
    setPriceModalVisible(true)
    setEditingPrice(formData.roomPrice.toFixed(2))
  }

  // 确认房费修改
  const handlePriceConfirm = () => {
    const newPrice = parseFloat(editingPrice)
    if (!isNaN(newPrice) && newPrice >= 0) {
      setFormData(prev => ({ ...prev, roomPrice: newPrice }))
      setPriceModalVisible(false)
    } else {
      Alert.alert('提示', '请输入有效的价格')
    }
  }

  // 提交订单
  const handleSubmitOrder = () => {
    if (!formData.guestName.trim()) {
      Alert.alert('提示', '请输入客人姓名')
      return
    }
    if (!formData.guestPhone.trim()) {
      Alert.alert('提示', '请输入手机号')
      return
    }
    
    // 生成订单ID
    const orderId = Date.now().toString()
    const reservationId = `RES_${orderId}`
    
    // 从房间类型中提取房间号（如 "大床房-1202" => "1202"）
    const roomIdMatch = formData.roomType.match(/-(\d+)$/)
    const roomId = roomIdMatch ? roomIdMatch[1] : formData.roomType
    
    // 创建预订对象
    const reservation: Reservation = {
      id: reservationId,
      orderId,
      roomId,
      roomNumber: roomId,
      roomType: formData.roomType,
      guestName: formData.guestName,
      guestPhone: formData.guestPhone,
      guestIdType: formData.guestIdType,
      guestIdNumber: formData.guestIdNumber,
      channel: formData.channel,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      roomPrice: formData.roomPrice,
      totalAmount: totalAmount,
      nights,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    }
    
    // 添加到Redux状态
    console.log('📝 [CreateOrder] 创建预订:', reservation)
    dispatch(addReservation(reservation))
    console.log('✅ [CreateOrder] 预订已添加到Redux')
    
    // 使用 replace 替换当前页面为订单详情页
    // 这样返回时会回到房态日历页面，而不是新增订单页面
    router.replace({
      pathname: '/order-details',
      params: {
        orderId,
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        channel: formData.channel,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        roomType: formData.roomType,
        roomPrice: formData.roomPrice.toString(),
        guestCount: formData.guestCount.toString(),
        nights: nights.toString(),
        totalAmount: totalAmount.toString(),
      }
    })
  }

  // 直接入住
  const handleDirectCheckIn = () => {
    if (!formData.guestName.trim()) {
      Alert.alert('提示', '请输入客人姓名')
      return
    }
    if (!formData.guestPhone.trim()) {
      Alert.alert('提示', '请输入手机号')
      return
    }
    
    Alert.alert(
      '入住成功',
      `${formData.guestName} 已成功入住\n房间：${formData.roomType}\n入住时间：${formData.checkInDate}`,
      [
        {
          text: '确定',
          onPress: () => router.back()
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>新增全日房订单</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          
          <View style={styles.formItem}>
            <Text style={styles.label}>姓名</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入姓名"
              value={formData.guestName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, guestName: text }))}
            />
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>手机</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入手机号"
              keyboardType="phone-pad"
              value={formData.guestPhone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, guestPhone: text }))}
            />
          </View>

          <TouchableOpacity 
            style={styles.formItem}
            onPress={() => setChannelModalVisible(true)}
          >
            <Text style={styles.label}>渠道</Text>
            <View style={styles.selectContainer}>
              <Text style={styles.selectText}>{formData.channel}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 住宿信息1 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>住宿信息1</Text>
          
          <TouchableOpacity 
            style={styles.formItem}
            onPress={() => openDatePicker('checkIn')}
          >
            <Text style={styles.label}>入住时间</Text>
            <View style={styles.selectContainer}>
              <Text style={styles.selectText}>{formData.checkInDate}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.formItem}
            onPress={() => openDatePicker('checkOut')}
          >
            <Text style={styles.label}>离店时间</Text>
            <View style={styles.selectContainer}>
              <Text style={styles.selectText}>{formData.checkOutDate}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.formItem}>
            <Text style={styles.label}>入住时长</Text>
            <View style={styles.selectContainer}>
              <Text style={styles.selectText}>{nights}晚</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.formItem}
            onPress={() => setRoomModalVisible(true)}
          >
            <Text style={styles.label}>房间</Text>
            <View style={styles.selectContainer}>
              <Text style={styles.selectText}>{formData.roomType}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.formItem}
            onPress={handlePricePress}
          >
            <Text style={styles.label}>房费</Text>
            <View style={styles.selectContainer}>
              <Text style={styles.selectText}>{formData.roomPrice.toFixed(2)}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.formItem}
            onPress={handleGuestInfoPress}
          >
            <Text style={styles.label}>入住人</Text>
            <View style={styles.selectContainer}>
              <Text style={styles.selectText}>
                {formData.guestName ? `${formData.guestName} ${formData.guestPhone}` : '请添加入住人'}
              </Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 订单金额 */}
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>订单金额：<Text style={styles.priceAmount}>¥{totalAmount.toFixed(2)}</Text></Text>
          <Text style={styles.nightsLabel}>消耗 {nights} 间夜</Text>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={handleDirectCheckIn}
        >
          <Text style={styles.secondaryButtonText}>直接入住</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={handleSubmitOrder}
        >
          <Text style={styles.primaryButtonText}>提交订单</Text>
        </TouchableOpacity>
      </View>

      {/* 日期选择器 */}
      <DateWheelPicker
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={handleDateSelect}
        initialDate={datePickerType === 'checkIn' ? formData.checkInDate : formData.checkOutDate}
        title={datePickerType === 'checkIn' ? '选择入住日期' : '选择离店日期'}
      />

      {/* 渠道选择弹窗 */}
      <Modal
        visible={channelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChannelModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setChannelModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>选择渠道</Text>
            {channels.map(channel => (
              <TouchableOpacity
                key={channel}
                style={styles.modalOption}
                onPress={() => {
                  setFormData(prev => ({ ...prev, channel }))
                  setChannelModalVisible(false)
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  formData.channel === channel && styles.modalOptionSelected
                ]}>
                  {channel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 房间选择弹窗 */}
      <Modal
        visible={roomModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoomModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRoomModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>选择房间</Text>
            {rooms.map(room => (
              <TouchableOpacity
                key={room}
                style={styles.modalOption}
                onPress={() => {
                  setFormData(prev => ({ ...prev, roomType: room }))
                  setRoomModalVisible(false)
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  formData.roomType === room && styles.modalOptionSelected
                ]}>
                  {room}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 房费编辑弹窗 */}
      <Modal
        visible={priceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPriceModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPriceModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.priceModalSheet}>
              <View style={styles.priceModalHeader}>
                <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
                  <Text style={styles.priceModalCancel}>取消</Text>
                </TouchableOpacity>
                <Text style={styles.priceModalTitle}>房价</Text>
                <TouchableOpacity onPress={handlePriceConfirm}>
                  <Text style={styles.priceModalConfirm}>确定</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.priceModalContent}>
                {/* 总价 */}
                <View style={styles.priceRow}>
                  <Text style={styles.priceRowLabel}>总价</Text>
                  <View style={styles.priceInputContainer}>
                    <TextInput
                      style={styles.priceInput}
                      value={editingPrice}
                      onChangeText={setEditingPrice}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                    <Text style={styles.priceUnit}>元</Text>
                    <TouchableOpacity>
                      <Text style={styles.priceEdit}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.priceTip}>以下为每个间夜价格</Text>

                {/* 每日房价列表 */}
                {Array.from({ length: nights }, (_, i) => {
                  const date = new Date(formData.checkInDate)
                  date.setDate(date.getDate() + i)
                  const dateStr = date.toISOString().split('T')[0]
                  const dailyPrice = formData.roomPrice / nights
                  
                  return (
                    <View key={i} style={styles.priceRow}>
                      <Text style={styles.priceRowLabel}>{dateStr}</Text>
                      <View style={styles.priceInputContainer}>
                        <Text style={styles.priceValue}>{dailyPrice.toFixed(2)}</Text>
                        <Text style={styles.priceUnit}>元</Text>
                        <TouchableOpacity>
                          <Text style={styles.priceEdit}>✏️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
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
    backgroundColor: '#4a90e2',
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
    width: 80,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
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
  arrow: {
    fontSize: 20,
    color: '#999',
    marginLeft: 8,
  },
  priceSection: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  priceLabel: {
    fontSize: 15,
    color: '#666',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  nightsLabel: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a90e2',
  },
  primaryButton: {
    backgroundColor: '#4a90e2',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#333',
  },
  modalOptionSelected: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  priceModalSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  priceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: '#4a90e2',
    fontWeight: '600',
  },
  priceModalContent: {
    padding: 16,
    maxHeight: 500,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  priceRowLabel: {
    fontSize: 14,
    color: '#333',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    minWidth: 80,
    paddingHorizontal: 8,
  },
  priceValue: {
    fontSize: 16,
    color: '#333',
    minWidth: 80,
    textAlign: 'right',
  },
  priceUnit: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
    marginRight: 8,
  },
  priceEdit: {
    fontSize: 16,
  },
  priceTip: {
    fontSize: 12,
    color: '#999',
    marginVertical: 12,
  },
})

