import React, { useState, useEffect } from 'react'
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
  KeyboardAvoidingView,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { DateWheelPicker } from './components/DateWheelPicker'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { addReservation } from './store/calendarSlice'
import type { Reservation } from './store/types'

// 获取本地日期字符串（YYYY-MM-DD），避免时区问题
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface RoomInfo {
  roomId: string
  roomName: string
  checkInDate: string
  checkOutDate: string
  price: number
}

export default function CreateOrderScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const params = useLocalSearchParams()
  
  // 从Redux获取所有可用房间
  const allRooms = useAppSelector(state => state.calendar.rooms)
  
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestIdType: '身份证',
    guestIdNumber: '',
    channel: '自来客',
    guestCount: 0,
  })

  // 初始化默认房间信息
  const getDefaultRoom = (): RoomInfo => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return {
      roomId: '1203',
      roomName: '1203',
      checkInDate: getLocalDateString(),
      checkOutDate: getLocalDateString(tomorrow),
      price: 1000.00
    }
  }

  const [rooms, setRooms] = useState<RoomInfo[]>([getDefaultRoom()])
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [datePickerType, setDatePickerType] = useState<'checkIn' | 'checkOut'>('checkIn')
  const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null)
  const [channelModalVisible, setChannelModalVisible] = useState(false)
  const [roomSelectModalVisible, setRoomSelectModalVisible] = useState(false)
  const [priceModalVisible, setPriceModalVisible] = useState(false)
  const [editingPrice, setEditingPrice] = useState('')

  // 从路由参数初始化房间信息
  useEffect(() => {
    console.log('📝 [CreateOrder] useEffect触发，params:', params)
    console.log('📝 [CreateOrder] 今天日期:', getLocalDateString())
    
    if (params.roomsData && typeof params.roomsData === 'string') {
      try {
        const roomsData = JSON.parse(params.roomsData)
        console.log('📝 [CreateOrder] 接收到的房间数据:', roomsData)
        console.log('📝 [CreateOrder] 房间数量:', roomsData.length)
        
        roomsData.forEach((room: any, index: number) => {
          console.log(`📝 [CreateOrder] 房间${index + 1}:`, {
            roomId: room.roomId,
            roomName: room.roomName,
            checkInDate: room.checkInDate,
            checkOutDate: room.checkOutDate
          })
        })
        
        const mappedRooms = roomsData.map((room: any) => ({
          ...room,
          price: 1000.00
        }))
        console.log('📝 [CreateOrder] 设置到state的rooms:', mappedRooms)
        setRooms(mappedRooms)
      } catch (error) {
        console.error('解析房间数据失败:', error)
      }
    } else if (params.roomId && params.roomName) {
      // 兼容单房间模式
      console.log('📝 [CreateOrder] 单房间模式，params:', {
        roomId: params.roomId,
        roomName: params.roomName,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate
      })
      setRooms([{
        roomId: params.roomId as string,
        roomName: params.roomName as string,
        checkInDate: (params.checkInDate as string) || new Date().toISOString().split('T')[0],
        checkOutDate: (params.checkOutDate as string) || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: 1000.00
      }])
    }
    // 如果没有从参数传入数据，保持默认房间（已在useState中初始化）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.roomsData, params.roomId, params.roomName])

  // 计算总金额
  const totalAmount = rooms.reduce((sum, room) => sum + room.price, 0)
  const totalNights = rooms.reduce((sum, room) => {
    const checkIn = new Date(room.checkInDate)
    const checkOut = new Date(room.checkOutDate)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return sum + nights
  }, 0)

  // 渠道选项
  const channels = ['自来客', '携程', '美团', '飞猪', '去哪儿', 'Booking', '电话预订', '其他']

  // 处理日期选择
  const handleDateSelect = (date: string) => {
    if (editingRoomIndex === null) return
    
    console.log('📝 [CreateOrder] 用户选择日期:', {
      type: datePickerType,
      date,
      roomIndex: editingRoomIndex
    })
    
    const updatedRooms = [...rooms]
    if (datePickerType === 'checkIn') {
      updatedRooms[editingRoomIndex].checkInDate = date
    } else {
      updatedRooms[editingRoomIndex].checkOutDate = date
    }
    console.log('📝 [CreateOrder] 更新后的rooms:', updatedRooms)
    setRooms(updatedRooms)
  }

  // 打开日期选择器
  const openDatePicker = (roomIndex: number, type: 'checkIn' | 'checkOut') => {
    setEditingRoomIndex(roomIndex)
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

  // 打开房间选择
  const handleRoomSelect = (roomIndex: number) => {
    setEditingRoomIndex(roomIndex)
    setRoomSelectModalVisible(true)
  }

  // 选择房间
  const handleSelectRoom = (roomId: string, roomName: string) => {
    if (editingRoomIndex === null) return
    
    const updatedRooms = [...rooms]
    updatedRooms[editingRoomIndex].roomId = roomId
    updatedRooms[editingRoomIndex].roomName = roomName
    setRooms(updatedRooms)
    setRoomSelectModalVisible(false)
  }

  // 打开房费编辑
  const handlePricePress = (roomIndex: number) => {
    setEditingRoomIndex(roomIndex)
    setEditingPrice(rooms[roomIndex].price.toFixed(2))
    setPriceModalVisible(true)
  }

  // 确认房费修改
  const handlePriceConfirm = () => {
    if (editingRoomIndex === null) return
    
    const newPrice = parseFloat(editingPrice)
    if (!isNaN(newPrice) && newPrice >= 0) {
      const updatedRooms = [...rooms]
      updatedRooms[editingRoomIndex].price = newPrice
      setRooms(updatedRooms)
      setPriceModalVisible(false)
    } else {
      Alert.alert('提示', '请输入有效的价格')
    }
  }

  // 计算入住时长（天数）
  const calculateNights = (checkInDate: string, checkOutDate: string) => {
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
    if (rooms.length === 0) {
      Alert.alert('提示', '请选择房间')
      return
    }

    // 为每个房间创建预订
    const orderId = Date.now().toString()
    
    rooms.forEach((room, index) => {
      const reservationId = `RES_${orderId}_${index}`
      const nights = calculateNights(room.checkInDate, room.checkOutDate)
      
      console.log('📝 [CreateOrder] 创建预订:', {
        roomId: room.roomId,
        roomName: room.roomName,
        checkInDate: room.checkInDate,
        checkOutDate: room.checkOutDate,
        nights,
      })
      
      const reservation: Reservation = {
        id: reservationId,
        orderId,
        roomId: room.roomId,
        roomNumber: room.roomId,
        roomType: room.roomName,
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        guestIdType: formData.guestIdType,
        guestIdNumber: formData.guestIdNumber,
        channel: formData.channel,
        checkInDate: room.checkInDate,
        checkOutDate: room.checkOutDate,
        roomPrice: room.price,
        totalAmount: room.price,
        nights,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      }
      
      console.log('📝 [CreateOrder] 提交的预订对象:', reservation)
      dispatch(addReservation(reservation))
    })

    // 跳转到订单详情页（显示第一个房间的信息）
    const firstRoom = rooms[0]
    router.replace({
      pathname: '/order-details',
      params: {
        orderId,
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        channel: formData.channel,
        checkInDate: firstRoom.checkInDate,
        checkOutDate: firstRoom.checkOutDate,
        roomType: firstRoom.roomName,
        roomPrice: firstRoom.price.toString(),
        guestCount: formData.guestCount.toString(),
        nights: calculateNights(firstRoom.checkInDate, firstRoom.checkOutDate).toString(),
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
      `${formData.guestName} 已成功入住\n房间：${rooms.map(r => r.roomName).join(', ')}`,
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

        {/* 住宿信息 - 多房间 */}
        {rooms.map((room, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>住宿信息 {rooms.length > 1 ? index + 1 : ''}</Text>
            
            <TouchableOpacity 
              style={styles.formItem}
              onPress={() => openDatePicker(index, 'checkIn')}
            >
              <Text style={styles.label}>入住时间</Text>
              <View style={styles.selectContainer}>
                <Text style={styles.selectText}>{room.checkInDate}</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.formItem}
              onPress={() => openDatePicker(index, 'checkOut')}
            >
              <Text style={styles.label}>离店时间</Text>
              <View style={styles.selectContainer}>
                <Text style={styles.selectText}>{room.checkOutDate}</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.formItem}>
              <Text style={styles.label}>入住时长</Text>
              <View style={styles.selectContainer}>
                <Text style={styles.selectText}>{calculateNights(room.checkInDate, room.checkOutDate)}晚</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.formItem}
              onPress={() => handleRoomSelect(index)}
            >
              <Text style={styles.label}>房间</Text>
              <View style={styles.selectContainer}>
                <Text style={styles.selectText}>{room.roomName}</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.formItem}
              onPress={() => handlePricePress(index)}
            >
              <Text style={styles.label}>房费</Text>
              <View style={styles.selectContainer}>
                <Text style={styles.selectText}>{room.price.toFixed(2)}</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>

            {index === 0 && (
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
            )}
          </View>
        ))}

        {/* 订单金额 */}
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>订单金额：<Text style={styles.priceAmount}>¥{totalAmount.toFixed(2)}</Text></Text>
          <Text style={styles.nightsLabel}>消耗 {totalNights} 间夜</Text>
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
        initialDate={editingRoomIndex !== null && rooms[editingRoomIndex] 
          ? (datePickerType === 'checkIn' ? rooms[editingRoomIndex].checkInDate : rooms[editingRoomIndex].checkOutDate)
          : new Date().toISOString().split('T')[0]
        }
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
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>选择房间</Text>
            <ScrollView style={styles.modalScrollView}>
              {allRooms.map(room => (
                <TouchableOpacity
                  key={room.id}
                  style={styles.modalOption}
                  onPress={() => handleSelectRoom(room.id, room.name)}
                >
                  <Text style={styles.modalOptionText}>
                    {room.name} ({room.type})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidView}
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
              <View style={styles.priceModalContainer}>
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
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
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
  keyboardAvoidView: {
    flex: 1,
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
  modalScrollView: {
    maxHeight: 400,
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
  priceModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 300,
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
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingVertical: 4,
  },
  priceUnit: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
})
