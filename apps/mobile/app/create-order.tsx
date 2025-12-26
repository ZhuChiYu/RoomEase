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
  ActivityIndicator,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { DateWheelPicker } from './components/DateWheelPicker'
import { NightsWheelPicker } from './components/NightsWheelPicker'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { setReservations, setRoomStatuses } from './store/calendarSlice'
import type { Reservation } from './store/types'
import { dataService } from './services'
import { FEATURE_FLAGS } from './config/environment'

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
  const [expandedRoomTypes, setExpandedRoomTypes] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false) // 添加loading状态
  const [nightsModalVisible, setNightsModalVisible] = useState(false) // 入住时长选择弹窗
  
  // 当打开房间选择时，默认展开所有房型
  useEffect(() => {
    if (roomSelectModalVisible) {
      const allTypes = new Set(allRooms.map(room => room.type))
      setExpandedRoomTypes(allTypes)
    }
  }, [roomSelectModalVisible, allRooms])

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
  const channels = ['自来客', '携程', '美团', '飞猪', '去哪儿', 'Booking', '小猪', '途家', '蚂蚁短租', '同城旅行', '电话预订', '其他']

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

  // 切换房型展开/折叠
  const toggleRoomType = (roomType: string) => {
    const newExpanded = new Set(expandedRoomTypes)
    if (newExpanded.has(roomType)) {
      newExpanded.delete(roomType)
    } else {
      newExpanded.add(roomType)
    }
    setExpandedRoomTypes(newExpanded)
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

  // 打开房费编辑
  const handlePricePress = (roomIndex: number) => {
    setEditingRoomIndex(roomIndex)
    setEditingPrice(rooms[roomIndex].price.toFixed(2))
    setPriceModalVisible(true)
  }

  // 打开入住时长选择
  const handleNightsPress = (roomIndex: number) => {
    setEditingRoomIndex(roomIndex)
    setNightsModalVisible(true)
  }

  // 选择入住时长
  const handleSelectNights = (nights: number) => {
    if (editingRoomIndex === null) return
    
    const updatedRooms = [...rooms]
    const checkInDate = new Date(updatedRooms[editingRoomIndex].checkInDate)
    const checkOutDate = new Date(checkInDate)
    checkOutDate.setDate(checkInDate.getDate() + nights)
    
    updatedRooms[editingRoomIndex].checkOutDate = getLocalDateString(checkOutDate)
    setRooms(updatedRooms)
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
  const handleSubmitOrder = async () => {
    if (!formData.guestName.trim()) {
      Alert.alert('提示', '请输入客人姓名')
      return
    }
    // 手机号和身份证号改为非必填，不验证格式
    if (rooms.length === 0) {
      Alert.alert('提示', '请选择房间')
      return
    }

    // 显示loading
    setIsSubmitting(true)
    
    // 为每个房间创建预订
    const orderId = Date.now().toString()
    
    try {
      for (const [index, room] of rooms.entries()) {
        const reservationId = `RES_${orderId}_${index}`
        const nights = calculateNights(room.checkInDate, room.checkOutDate)
        
        console.log('📝 [CreateOrder] 创建预订:', {
          roomId: room.roomId,
          roomName: room.roomName,
          checkInDate: room.checkInDate,
          checkOutDate: room.checkOutDate,
          nights,
          usingAPI: FEATURE_FLAGS.USE_BACKEND_API
        })
        
        // 获取propertyId
        const { authService } = await import('./services/authService')
        const propertyId = await authService.getPropertyId()
        
        // 构造符合后端API的预订对象
        const apiReservationData = {
          checkInDate: room.checkInDate,
          checkOutDate: room.checkOutDate,
          guestCount: 1, // 默认1人，后续可以从表单获取
          childCount: 0, // 默认0个儿童
          roomRate: room.price, // 注意：后端用 roomRate 而不是 roomPrice
          totalAmount: room.price * nights,
          guestName: formData.guestName,
          guestPhone: formData.guestPhone,
          guestIdNumber: formData.guestIdNumber || '',
          notes: `渠道: ${formData.channel}`,
          propertyId: propertyId || 'demo-property',
          roomId: room.roomId,
          source: formData.channel,
        }
        
        console.log('📝 [CreateOrder] 提交的预订数据:', apiReservationData)
        
        // 使用dataService创建预订
        console.log('💾 [CreateOrder] 通过dataService创建预订...')
        const createdReservation = await dataService.reservations.create(apiReservationData)
        
        // 构造本地Redux使用的完整 Reservation 对象
        const reservation: Reservation = {
          id: createdReservation.id || reservationId,
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
          totalAmount: room.price * nights,
          nights,
          status: 'confirmed',
          createdAt: createdReservation.createdAt || new Date().toISOString(),
          propertyId: propertyId || 'demo-property',
        }
        console.log('✅ [CreateOrder] 预订创建成功:', reservation.id)
        
        // 不再使用手动构造的对象，而是在所有预订创建完成后统一从服务器获取最新数据
      }
      
      console.log('✅ [CreateOrder] 所有预订创建完成')
      
      // 不再在这里更新Redux，让 calendar 页面自己从服务器获取最新数据
      console.log('💡 [CreateOrder] 不更新Redux，让Calendar页面从服务器获取最新数据')
      
      // 设置标记告诉calendar页面需要强制刷新
      await AsyncStorage.setItem('@force_reload_calendar', Date.now().toString())
      console.log('🔄 [CreateOrder] 已设置强制刷新标记')
      
    } catch (error: any) {
      console.error('❌ [CreateOrder] 创建预订失败:', error)
      setIsSubmitting(false) // 隐藏loading
      Alert.alert('错误', error.message || '创建预订失败')
      return
    }

    // 成功后隐藏loading
    setIsSubmitting(false)
    
    // 跳转到订单详情页（显示第一个房间的信息）
    const firstRoom = rooms[0]
    const firstReservationId = `RES_${orderId}_0` // 第一个房间的预订ID
    router.replace({
      pathname: '/order-details',
      params: {
        reservationId: firstReservationId, // 传递预订ID
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
    // 手机号改为非必填，不验证格式
    
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
              placeholder="请输入手机号（选填）"
              keyboardType="phone-pad"
              value={formData.guestPhone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, guestPhone: text }))}
            />
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>身份证号</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入身份证号（选填）"
              keyboardType="default"
              value={formData.guestIdNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, guestIdNumber: text }))}
              maxLength={18}
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

            <TouchableOpacity 
              style={styles.formItem}
              onPress={() => handleNightsPress(index)}
            >
              <Text style={styles.label}>入住时长</Text>
              <View style={styles.selectContainer}>
                <Text style={styles.selectText}>{calculateNights(room.checkInDate, room.checkOutDate)}晚</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>

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
          style={[styles.button, styles.primaryButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmitOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>提交订单</Text>
          )}
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
        animationType="none"
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
        animationType="none"
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
              {/* 标题栏 */}
              <View style={styles.roomSelectHeader}>
                <Text style={styles.roomSelectTitle}>选择房间</Text>
                <TouchableOpacity 
                  style={styles.roomSelectClose}
                  onPress={() => setRoomSelectModalVisible(false)}
                >
                  <Text style={styles.roomSelectCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* 房间列表 */}
              <ScrollView 
                style={styles.roomSelectContent}
                contentContainerStyle={styles.roomSelectContentContainer}
              >
                {Array.from(getRoomsByType().entries()).map(([roomType, roomsOfType]) => (
                  <View key={roomType}>
                    {/* 房型标题（可折叠） */}
                    <TouchableOpacity
                      style={styles.roomTypeHeader}
                      onPress={() => toggleRoomType(roomType)}
                    >
                      <Text style={styles.roomTypeTitle}>{roomType}</Text>
                      <Text style={styles.roomTypeArrow}>
                        {expandedRoomTypes.has(roomType) ? '∧' : '∨'}
                      </Text>
                    </TouchableOpacity>

                    {/* 该房型下的房间列表 */}
                    {expandedRoomTypes.has(roomType) && roomsOfType.map(room => {
                      // TODO: 从Redux状态判断房间是否被占用
                      const isOccupied = false // 暂时设为false，后续可以从Redux状态中获取
                      const isSelected = editingRoomIndex !== null && rooms[editingRoomIndex]?.roomId === room.id
                      
                      return (
                        <TouchableOpacity
                          key={room.id}
                          style={[
                            styles.roomOption,
                            isOccupied && styles.roomOptionDisabled
                          ]}
                          onPress={() => !isOccupied && handleSelectRoom(room.id, `${room.type}-${room.name}`)}
                          disabled={isOccupied}
                        >
                          <Text style={[
                            styles.roomOptionText,
                            isOccupied && styles.roomOptionTextDisabled
                          ]}>
                            {room.name}
                          </Text>
                          
                          <View style={styles.roomOptionRight}>
                            {isOccupied && (
                              <Text style={styles.roomOccupiedTag}>被占用</Text>
                            )}
                            <View style={[
                              styles.roomRadio,
                              isSelected && styles.roomRadioSelected,
                              isOccupied && styles.roomRadioDisabled
                            ]}>
                              {isSelected && <View style={styles.roomRadioInner} />}
                            </View>
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 入住时长选择弹窗 */}
      <NightsWheelPicker
        visible={nightsModalVisible}
        onClose={() => setNightsModalVisible(false)}
        onSelect={handleSelectNights}
        initialNights={editingRoomIndex !== null ? calculateNights(rooms[editingRoomIndex].checkInDate, rooms[editingRoomIndex].checkOutDate) : 1}
        title="选择入住时长"
      />

      {/* 房费编辑弹窗 */}
      <Modal
        visible={priceModalVisible}
        transparent
        animationType="none"
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
                  {/* 总价输入 */}
                  <View style={styles.priceRow}>
                    <Text style={styles.priceRowLabel}>总价</Text>
                    <View style={styles.priceInputContainer}>
                      <TextInput
                        style={styles.priceInput}
                        value={editingPrice}
                        onChangeText={setEditingPrice}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        autoFocus
                      />
                      <Text style={styles.priceUnit}>元</Text>
                    </View>
                  </View>

                  {/* 每日价格提示 */}
                  {editingRoomIndex !== null && (
                    <>
                      <Text style={styles.priceDailyTip}>以下为每个间夜价格</Text>
                      {Array.from({ 
                        length: calculateNights(
                          rooms[editingRoomIndex].checkInDate, 
                          rooms[editingRoomIndex].checkOutDate
                        ) 
                      }, (_, i) => {
                        const date = new Date(rooms[editingRoomIndex].checkInDate)
                        date.setDate(date.getDate() + i)
                        const dateStr = date.toISOString().split('T')[0]
                        const totalPrice = parseFloat(editingPrice) || 0
                        const nights = calculateNights(
                          rooms[editingRoomIndex].checkInDate, 
                          rooms[editingRoomIndex].checkOutDate
                        )
                        const dailyPrice = nights > 0 ? totalPrice / nights : 0
                        
                        return (
                          <View key={i} style={styles.priceDailyRow}>
                            <Text style={styles.priceDailyDate}>{dateStr}</Text>
                            <Text style={styles.priceDailyValue}>
                              {dailyPrice.toFixed(2)} 元
                            </Text>
                          </View>
                        )
                      })}
                    </>
                  )}
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
  buttonDisabled: {
    opacity: 0.6,
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
    paddingBottom: 0,
    minHeight: '70%',
    maxHeight: '85%',
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
    paddingBottom: 0,
    minHeight: '65%',
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
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'white',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceRowLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    fontSize: 17,
    color: '#333',
    textAlign: 'right',
    minWidth: 100,
    paddingHorizontal: 0,
    borderWidth: 0,
    fontWeight: '500',
  },
  priceUnit: {
    fontSize: 15,
    color: '#666',
    marginLeft: 4,
  },
  priceDailyTip: {
    fontSize: 13,
    color: '#999',
    marginTop: 20,
    marginBottom: 12,
  },
  priceDailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  priceDailyDate: {
    fontSize: 14,
    color: '#666',
  },
  priceDailyValue: {
    fontSize: 14,
    color: '#333',
  },
  // 房间选择样式
  roomSelectSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 0,
    minHeight: '80%',
    maxHeight: '90%',
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
    fontWeight: '300',
  },
  roomSelectContent: {
    flex: 1,
  },
  roomSelectContentContainer: {
    paddingBottom: 40,
    backgroundColor: 'white',
  },
  roomTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    backgroundColor: 'white',
  },
  roomOptionDisabled: {
    backgroundColor: '#fafafa',
  },
  roomOptionText: {
    fontSize: 15,
    color: '#333',
  },
  roomOptionTextDisabled: {
    color: '#ccc',
  },
  roomOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roomOccupiedTag: {
    fontSize: 13,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
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
    borderColor: '#4a90e2',
  },
  roomRadioDisabled: {
    borderColor: '#e0e0e0',
  },
  roomRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4a90e2',
  },
})

