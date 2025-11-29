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
import { useAppDispatch, useAppSelector } from './store/hooks'
import { dataService } from './services/dataService'
import { setReservations, setRoomStatuses, addOperationLog } from './store/calendarSlice'

export default function EditOrderScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const params = useLocalSearchParams()
  
  // 从Redux获取真实房间数据和预订数据
  const reduxRooms = useAppSelector(state => state.calendar.rooms)
  const reduxReservations = useAppSelector(state => state.calendar.reservations)
  
  // 格式化日期为 YYYY-MM-DD
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      return dateStr
    }
  }
  
  const [formData, setFormData] = useState({
    guestName: (params.guestName as string) || '',
    guestPhone: (params.guestPhone as string) || '',
    channel: (params.channel as string) || '自来客',
    checkInDate: formatDate((params.checkInDate as string) || ''),
    checkOutDate: formatDate((params.checkOutDate as string) || ''),
    roomType: (params.roomType as string) || '',
    roomPrice: parseFloat(params.roomPrice as string) || 0,
    guestCount: parseInt(params.guestCount as string) || 0,
  })

  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [datePickerType, setDatePickerType] = useState<'checkIn' | 'checkOut'>('checkIn')
  const [channelModalVisible, setChannelModalVisible] = useState(false)
  const [roomModalVisible, setRoomModalVisible] = useState(false)
  const [priceModalVisible, setPriceModalVisible] = useState(false)
  const [editingPrice, setEditingPrice] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
  const channels = ['自来客', '携程', '美团', '飞猪', '去哪儿', 'Booking', '小猪', '途家', '蚂蚁短租', '同程旅行', '电话预订', '其他']
  
  // 从Redux获取真实房间列表，按房型分组显示
  const roomsByType = reduxRooms.reduce((acc, room) => {
    if (!acc[room.type]) {
      acc[room.type] = []
    }
    acc[room.type].push(room)
    return acc
  }, {} as Record<string, typeof reduxRooms>)
  
  // 生成房间显示文本（房型 - 房间号）
  const getRoomDisplayText = (room: typeof reduxRooms[0]) => {
    return `${room.type} - ${room.name}号房间`
  }
  
  // 根据formData.roomType查找对应的房间
  const getCurrentRoom = () => {
    if (!formData.roomType) return null
    // formData.roomType 格式可能是 "房型-房间名" 或 "房型 - 房间号房间"
    const parts = formData.roomType.includes(' - ') 
      ? formData.roomType.split(' - ')
      : formData.roomType.split('-')
    
    const type = parts[0]
    const name = parts[1]?.replace('号房间', '')
    
    return reduxRooms.find(r => r.type === type && r.name === name)
  }
  
  // 初始化完整的房间显示文本
  useEffect(() => {
    const roomId = params.roomId as string
    if (roomId && reduxRooms.length > 0) {
      const room = reduxRooms.find(r => r.id === roomId)
      if (room) {
        const displayText = getRoomDisplayText(room)
        // 如果当前显示的不完整（没有房号），就更新
        if (!formData.roomType.includes('号房间')) {
          setFormData(prev => ({ ...prev, roomType: displayText }))
          console.log('🏠 [修改订单] 初始化房间显示:', displayText)
        }
      }
    }
  }, [params.roomId, reduxRooms.length])

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

  // 保存修改
  const handleSaveOrder = async () => {
    console.log('🔵 [修改订单] ========== 开始保存订单 ==========')
    
    if (!formData.guestName.trim()) {
      Alert.alert('提示', '请输入客人姓名')
      return
    }
    if (!formData.guestPhone.trim()) {
      Alert.alert('提示', '请输入手机号')
      return
    }
    
    // 显示loading
    setIsLoading(true)
    
    try {
      const reservationId = params.reservationId as string
      
      if (!reservationId) {
        Alert.alert('错误', '无法获取预订ID')
        setIsLoading(false)
        return
      }
      
      console.log('📋 [修改订单] 预订ID:', reservationId)
      console.log('📋 [修改订单] 当前表单数据:', JSON.stringify(formData, null, 2))
      
      // 从 roomType 提取房间ID
      let roomId = params.roomId as string
      
      // 如果选择了新房间，从房间列表查找
      if (formData.roomType) {
        const currentRoom = getCurrentRoom()
        if (currentRoom) {
          roomId = currentRoom.id
          console.log('✅ [修改订单] 找到新房间:', { 
            roomId, 
            name: currentRoom.name, 
            type: currentRoom.type,
            displayText: getRoomDisplayText(currentRoom)
          })
        }
      }
      
      // 构造更新数据 - 使用后端期望的字段名
      const updateData: any = {
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        source: formData.channel,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        roomRate: formData.roomPrice,
        totalAmount: formData.roomPrice * nights,
        guestCount: formData.guestCount,
        roomId: roomId, // 总是包含 roomId
      }
      
      console.log('📤 [修改订单] 准备发送到服务器的数据:', JSON.stringify(updateData, null, 2))
      console.log('🌐 [修改订单] ========== 开始发送请求到服务器 ==========')
      
      // 直接向服务器发送更新请求
      console.log('🌐 [修改订单] 调用 dataService.reservations.update...')
      console.log('🌐 [修改订单] 参数 - ID:', reservationId)
      console.log('🌐 [修改订单] 参数 - 数据:', updateData)
      
      const updatedReservation = await dataService.reservations.update(reservationId, updateData)
      
      console.log('✅ [修改订单] ========== 服务器返回成功 ==========')
      console.log('✅ [修改订单] 返回的完整预订数据:', JSON.stringify(updatedReservation, null, 2))
      console.log('✅ [修改订单] 验证关键字段:')
      console.log('  - ID:', updatedReservation.id)
      console.log('  - 客人姓名:', updatedReservation.guestName)
      console.log('  - 入住日期:', updatedReservation.checkInDate)
      console.log('  - 退房日期:', updatedReservation.checkOutDate)
      console.log('  - 房间ID:', updatedReservation.roomId)
      console.log('🧹 [修改订单] 缓存已自动清除')
      
      // 立即从服务器获取最新数据并更新Redux
      console.log('🔄 [修改订单] ========== 开始重新加载所有数据 ==========')
      
      // 计算日期范围（当前月份前后各30天）
      const today = new Date()
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - 30)
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 30)
      
      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      // 强制从服务器获取最新数据（不使用缓存）
      // dataService 内部的 update 方法已经清除了所有缓存
      console.log('🌐 [修改订单] 正在请求最新的预订列表...')
      console.log('🌐 [修改订单] 正在请求最新的房态数据...')
      
      const [updatedReservations, updatedRoomStatuses] = await Promise.all([
        dataService.reservations.getAll(),
        dataService.roomStatus.getByDateRange(formatDate(startDate), formatDate(endDate))
      ])
      
      console.log('📦 [修改订单] ========== 从服务器获取到的最新数据 ==========')
      console.log('📦 [修改订单] 总预订数:', updatedReservations.length)
      console.log('📦 [修改订单] 总房态数:', updatedRoomStatuses.length)
      
      // 查找刚才修改的预订
      const thisReservation = updatedReservations.find((r: any) => r.id === reservationId)
      if (thisReservation) {
        console.log('✅ [修改订单] 找到刚修改的预订，验证数据:')
        console.log('  - ID:', thisReservation.id)
        console.log('  - 客人姓名:', thisReservation.guestName)
        console.log('  - 入住日期:', thisReservation.checkInDate)
        console.log('  - 退房日期:', thisReservation.checkOutDate)
        console.log('  - 房间ID:', thisReservation.roomId)
        console.log('  - 渠道:', thisReservation.source)
      } else {
        console.error('❌ [修改订单] 警告：在新数据中找不到刚修改的预订！ID:', reservationId)
      }
      
      // 更新Redux，确保返回日历页面时数据是最新的
      console.log('🔄 [修改订单] 正在更新Redux...')
      dispatch(setReservations(updatedReservations))
      dispatch(setRoomStatuses(updatedRoomStatuses))
      
      // 添加操作日志
      const operationLog = {
        id: `log_${Date.now()}`,
        orderId: reservationId,
        action: '修改订单',
        operator: '用户',
        time: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        details: `修改了订单信息：${formData.guestName} / ${formData.roomType} / ${formData.checkInDate}至${formData.checkOutDate}`,
      }
      dispatch(addOperationLog(operationLog))
      console.log('📝 [修改订单] 已添加操作日志:', operationLog)
      
      console.log('✅ [修改订单] ========== Redux已更新完成 ==========')
      console.log('✅ [修改订单] Redux中的预订数量:', updatedReservations.length)
      console.log('⏰ [修改订单] 数据更新时间戳:', Date.now())
      
      // 设置一个标记到localStorage，告诉calendar页面数据刚刚更新过
      await AsyncStorage.setItem('@data_just_updated', Date.now().toString())
      console.log('💡 [修改订单] 已设置数据更新标记，Calendar页面将跳过加载')
      
      // 关闭loading
      setIsLoading(false)
      console.log('⏹️ [修改订单] Loading已关闭')
      
      // 延迟一点显示Alert，确保loading完全消失
      setTimeout(() => {
        Alert.alert(
          '保存成功',
          '订单已更新',
          [
            {
              text: '确定',
              onPress: () => {
                console.log('🔙 [修改订单] ========== 用户点击确定，准备返回 ==========')
                console.log('🔙 [修改订单] 此时Redux中的数据应该已经是最新的')
                router.back()
              }
            }
          ]
        )
      }, 100)
    } catch (error) {
      console.error('❌ [修改订单] ========== 修改失败 ==========')
      console.error('❌ [修改订单] 错误详情:', error)
      console.error('❌ [修改订单] 错误消息:', (error as Error).message)
      console.error('❌ [修改订单] 错误堆栈:', (error as Error).stack)
      
      // 隐藏loading并显示错误
      setIsLoading(false)
      Alert.alert('错误', '保存失败：' + (error as Error).message)
    }
    
    console.log('🔵 [修改订单] ========== 保存流程结束 ==========')
  }

  return (
    <View style={styles.container}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>修改订单</Text>
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

        {/* 住宿信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>住宿信息</Text>
          
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
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={handleSaveOrder}
        >
          <Text style={styles.primaryButtonText}>保存修改</Text>
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
        visible={roomModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setRoomModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRoomModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>选择房间</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {Object.entries(roomsByType).map(([roomType, roomsInType]) => (
                <View key={roomType}>
                  <Text style={styles.roomTypeHeader}>{roomType}</Text>
                  {roomsInType.map(room => {
                    const displayText = getRoomDisplayText(room)
                    return (
                      <TouchableOpacity
                        key={room.id}
                        style={styles.modalOption}
                        onPress={() => {
                          setFormData(prev => ({ ...prev, roomType: displayText }))
                          setRoomModalVisible(false)
                        }}
                      >
                        <Text style={[
                          styles.modalOptionText,
                          formData.roomType === displayText && styles.modalOptionSelected
                        ]}>
                          {displayText}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 房费编辑弹窗 */}
      <Modal
        visible={priceModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setPriceModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.priceModalContainer}>
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
                      autoFocus
                    />
                    <Text style={styles.priceUnit}>元</Text>
                  </View>
                </View>

                <Text style={styles.priceTip}>以下为每个间夜价格</Text>

                {/* 每日房价列表 */}
                {Array.from({ length: nights }, (_, i) => {
                  const date = new Date(formData.checkInDate)
                  date.setDate(date.getDate() + i)
                  const dateStr = date.toISOString().split('T')[0]
                  const totalPrice = parseFloat(editingPrice) || 0
                  const dailyPrice = nights > 0 ? totalPrice / nights : 0
                  
                  return (
                    <View key={i} style={styles.priceRow}>
                      <Text style={styles.priceRowLabel}>{dateStr}</Text>
                      <Text style={styles.priceValue}>{dailyPrice.toFixed(2)} 元</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Loading 遮罩层 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.loadingText}>正在保存...</Text>
          </View>
        </View>
      )}
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
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#999',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
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
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  roomTypeHeader: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
    minHeight: '65%',
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 0,
  },
  priceModalSheet: {
    flex: 1,
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
    flex: 1,
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
  },
  priceTip: {
    fontSize: 12,
    color: '#999',
    marginVertical: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
})
