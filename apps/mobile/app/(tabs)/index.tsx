import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { DateWheelPicker } from '../components/DateWheelPicker'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { authStorage } from '../services/storage'
import { dataService } from '../services/dataService'
import { setRooms, setReservations, setRoomStatuses } from '../store/calendarSlice'
import { FontSizes, Spacings, ComponentSizes } from '../utils/responsive'

const { width } = Dimensions.get('window')

// 获取本地日期字符串（YYYY-MM-DD），避免时区问题
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color: string
}

function KPICard({ title, value, description, trend, color, onPress }: KPICardProps & { onPress?: () => void }) {
  const CardComponent = onPress ? TouchableOpacity : View
  
  return (
    <CardComponent 
      style={[styles.kpiCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.kpiHeader}>
        <Text style={styles.kpiTitle}>{title}</Text>
        {trend && (
          <Text style={[styles.trend, { color: trend.isPositive ? '#10b981' : '#ef4444' }]}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Text>
        )}
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      {description && (
        <Text style={styles.kpiDescription}>{description}</Text>
      )}
    </CardComponent>
  )
}

interface ReservationItemProps {
  guestName: string
  room: string
  checkIn: string
  status: 'confirmed' | 'pending'
}

function ReservationItem({ guestName, room, checkIn, status, onPress }: ReservationItemProps & { onPress?: () => void }) {
  return (
    <TouchableOpacity 
      style={styles.reservationItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.reservationInfo}>
        <Text style={styles.guestName}>{guestName}</Text>
        <Text style={styles.roomInfo}>{room} • {checkIn}</Text>
      </View>
      <View style={[
        styles.statusBadge,
        { backgroundColor: status === 'confirmed' ? '#dcfce7' : '#fef3c7' }
      ]}>
        <Text style={[
          styles.statusText,
          { color: status === 'confirmed' ? '#166534' : '#92400e' }
        ]}>
          {status === 'confirmed' ? '已确认' : '待确认'}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export default function HomeScreen() {
  const router = useRouter()
  
  // 从Redux获取数据
  const reservations = useAppSelector(state => state.calendar.reservations)
  const rooms = useAppSelector(state => state.calendar.rooms)
  const roomStatuses = useAppSelector(state => state.calendar.roomStatuses)

  // 用户信息状态
  const [userInfo, setUserInfo] = useState({
    name: '',
    hotelName: '',
  })

  // 下拉刷新状态
  const [refreshing, setRefreshing] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const dispatch = useAppDispatch()

  // 加载用户信息
  useEffect(() => {
    loadUserInfo()
  }, [])
  
  // 加载数据（当页面获得焦点且数据为空时）
  const loadData = useCallback(async () => {
    // 如果已经有数据，且不是初次加载，则跳过
    if (!isInitialLoad && reservations.length > 0) {
      console.log('🏠 [首页] 数据已存在，跳过加载')
      return
    }
    
    try {
      console.log('🏠 [首页] 开始加载数据...')
      
      // 计算日期范围（今天往前7天，往后30天）
      const today = new Date()
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - 7)
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 30)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      console.log('🏠 [首页] 加载日期范围:', { startDateStr, endDateStr })
      
      // 并行加载数据
      const [roomsData, reservationsData, roomStatusesData] = await Promise.all([
        dataService.rooms.getAll(),
        dataService.reservations.getAll({
          startDate: startDateStr,
          endDate: endDateStr,
        }),
        dataService.roomStatus.getByDateRange(startDateStr, endDateStr)
      ])
      
      console.log('🏠 [首页] 数据加载完成:', {
        rooms: roomsData.length,
        reservations: reservationsData.length,
        roomStatuses: Array.isArray(roomStatusesData) ? roomStatusesData.length : 0
      })
      
      // 更新Redux
      dispatch(setRooms(roomsData))
      dispatch(setReservations(reservationsData))
      dispatch(setRoomStatuses(Array.isArray(roomStatusesData) ? roomStatusesData : []))
      
      setIsInitialLoad(false)
    } catch (error) {
      console.error('❌ [首页] 数据加载失败:', error)
    }
  }, [isInitialLoad, reservations.length, dispatch])
  
  // 页面获得焦点时加载数据
  useFocusEffect(
    useCallback(() => {
      console.log('🏠 [首页] 页面获得焦点')
      loadData()
    }, [loadData])
  )

  const loadUserInfo = async () => {
    const savedUserInfo = await authStorage.getUserInfo()
    if (savedUserInfo) {
      setUserInfo({
        name: savedUserInfo.name || '',
        hotelName: savedUserInfo.hotelName || '',
      })
    }
  }

  // 下拉刷新处理
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      console.log('🔄 [首页] 下拉刷新，清除缓存...')
      // 清除所有缓存
      await dataService.cache.clearAll()
      console.log('✅ [首页] 缓存已清除，重新加载数据...')
      
      // 强制重新加载数据
      setIsInitialLoad(true)
      await loadData()
    } catch (error) {
      console.error('❌ [首页] 刷新失败:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // 根据时间返回问候语
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      return '早上好'
    } else if (hour >= 12 && hour < 14) {
      return '中午好'
    } else if (hour >= 14 && hour < 18) {
      return '下午好'
    } else {
      return '晚上好'
    }
  }
  
  // 计算今日数据
  const todayData = useMemo(() => {
    const today = getLocalDateString()
    
    console.log('🏠 [首页统计] 今天:', today)
    console.log('🏠 [首页统计] 预订总数:', reservations.length)
    
    // 格式化日期为 YYYY-MM-DD（处理后端返回的ISO格式）
    const formatDate = (dateStr: string) => {
      try {
        return dateStr.split('T')[0] // 提取日期部分
      } catch {
        return dateStr
      }
    }
    
    // 今日入住：今天是入住日期的房间
    const todayCheckIns = reservations.filter((r: any) => {
      const checkInDate = formatDate(r.checkInDate)
      const isCancelled = r.status === 'cancelled' || r.status === 'CANCELLED'
      const isToday = checkInDate === today
      return isToday && !isCancelled
    })
    const todayCheckInCount = todayCheckIns.length
    
    console.log('🏠 [首页统计] 今日入住:', todayCheckInCount, '间')
    
    // 今日入住费用：今天入住的所有房间费用总和
    const todayCheckInRevenue = todayCheckIns.reduce((sum, r: any) => sum + (Number(r.totalAmount) || 0), 0)
    
    // 今日退房：今天是退房日期的房间（排除连续入住的情况）
    const todayCheckOuts = reservations.filter((r: any) => {
      const checkOutDate = formatDate(r.checkOutDate)
      const isCancelled = r.status === 'cancelled' || r.status === 'CANCELLED'
      if (checkOutDate !== today || isCancelled) return false
      
      // 检查是否有同一客人的连续订单（同一个客人、同一个房间、退房日期=入住日期）
      const hasContinuousBooking = reservations.some((nextR: any) => 
        nextR.id !== r.id &&
        nextR.guestPhone === r.guestPhone &&
        nextR.roomId === r.roomId &&
        formatDate(nextR.checkInDate) === checkOutDate &&
        nextR.status !== 'cancelled' &&
        nextR.status !== 'CANCELLED'
      )
      
      return !hasContinuousBooking
    })
    const todayCheckOutCount = todayCheckOuts.length
    
    console.log('🏠 [首页统计] 今日退房:', todayCheckOutCount, '间')
    
    // 当前在住：入住日期<=今天 且 退房日期>今天
    const currentOccupied = reservations.filter((r: any) => {
      const checkInDate = formatDate(r.checkInDate)
      const checkOutDate = formatDate(r.checkOutDate)
      const isCancelled = r.status === 'cancelled' || r.status === 'CANCELLED'
      return checkInDate <= today && checkOutDate > today && !isCancelled
    }).length
    
    console.log('🏠 [首页统计] 当前在住:', currentOccupied, '间')
    
    // 入住率
    const occupancyRate = rooms.length > 0 ? ((currentOccupied / rooms.length) * 100).toFixed(0) : 0
    
    console.log('🏠 [首页统计] 入住率:', occupancyRate, '%')
    
    // 本月收入
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const monthlyRevenue = reservations.filter((r: any) => {
      if (!r.checkInDate) return false
      const checkInDate = new Date(r.checkInDate)
      return checkInDate.getMonth() + 1 === currentMonth && checkInDate.getFullYear() === currentYear
    }).reduce((sum, r: any) => sum + (Number(r.totalAmount) || 0), 0) || 0
    
    console.log('🏠 [首页统计] 本月收入:', monthlyRevenue)
    
    return {
      todayCheckInCount: todayCheckInCount || 0,
      todayCheckInRevenue: todayCheckInRevenue || 0,
      todayCheckOutCount: todayCheckOutCount || 0,
      currentOccupied: currentOccupied || 0,
      occupancyRate: occupancyRate || 0,
      monthlyRevenue: monthlyRevenue || 0,
    }
  }, [reservations, rooms])
  
  // 最近的预订（显示最近创建的或今日及近期入住的订单）
  const recentReservations = useMemo(() => {
    const today = getLocalDateString()
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const threeDaysAgoStr = getLocalDateString(threeDaysAgo)
    
    // 格式化日期为 YYYY-MM-DD
    const formatDate = (dateStr: string) => {
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
    
    return reservations
      .filter((r: any) => {
        // 显示：未取消的订单 且 (入住日期在最近3天到未来 或 最近创建的)
        if (r.status === 'cancelled' || r.status === 'CANCELLED') return false
        const checkInDate = formatDate(r.checkInDate)
        const isRecentCheckIn = checkInDate >= threeDaysAgoStr
        const createdAt = r.createdAt ? new Date(r.createdAt) : new Date()
        const isRecentCreated = createdAt >= threeDaysAgo
        return isRecentCheckIn || isRecentCreated
      })
      .sort((a: any, b: any) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })
      .slice(0, 5)
      .map((r: any) => {
        // 从房间列表查找房间信息
        const room = rooms.find(room => room.id === r.roomId)
        const roomName = room?.name || r.roomNumber || r.room?.name || '未知'
        const roomType = room?.type || r.room?.roomType || r.roomType || '未知房型'
        
        return {
        id: r.id,
          orderId: r.orderId || '',
          guestName: r.guestName || '未知',
          guestPhone: r.guestPhone || '',
          room: `${roomName} - ${roomType}`,
          checkIn: formatDate(r.checkInDate),
          checkOutDate: formatDate(r.checkOutDate),
          channel: r.source || r.channel || '直订',
          roomPrice: (r.roomPrice || r.roomRate || 0).toString(),
          nights: (r.nights || 1).toString(),
          totalAmount: (r.totalAmount || 0).toString(),
          status: (r.status === 'CONFIRMED' || r.status === 'confirmed') ? 'confirmed' as const : 'pending' as const,
        }
      })
  }, [reservations, rooms])
  
  // 新建预订弹窗状态
  const [bookingModalVisible, setBookingModalVisible] = useState(false)
  const [bookingFormData, setBookingFormData] = useState({
    guestName: '',
    phone: '',
    idNumber: '',
    roomType: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
  })

  // 客人入住弹窗状态
  const [checkinModalVisible, setCheckinModalVisible] = useState(false)
  const [checkinFormData, setCheckinFormData] = useState({
    guestName: '',
    idNumber: '',
    phone: '',
    roomNumber: '',
    checkInDate: new Date().toISOString().split('T')[0],
    emergencyContact: '',
  })

  // 退房弹窗状态
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false)
  const [checkoutType, setCheckoutType] = useState<'quick' | 'billing'>('quick')
  const [checkoutFormData, setCheckoutFormData] = useState({
    roomNumber: '',
    guestName: '',
    extraCharges: 0,
    damageCharges: 0,
    notes: '',
  })

  // 日期选择器状态
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [datePickerType, setDatePickerType] = useState<'checkIn' | 'checkOut' | 'checkinDate'>('checkIn')
  const [currentFormType, setCurrentFormType] = useState<'booking' | 'checkin'>('booking')

  const kpiData = [
    {
      title: '今日入住',
      value: todayData.todayCheckInCount,
      description: `共${todayData.todayCheckInCount}间`,
      color: '#3b82f6'
    },
    {
      title: '今日退房',
      value: todayData.todayCheckOutCount,
      description: `共${todayData.todayCheckOutCount}间`,
      color: '#ef4444'
    },
    {
      title: '今日入住费用',
      value: `¥${todayData.todayCheckInRevenue.toFixed(0)}`,
      description: `入住率 ${todayData.occupancyRate}%`,
      color: '#10b981'
    },
    {
      title: '本月收入',
      value: `¥${(todayData.monthlyRevenue || 0).toFixed(0)}`,
      description: `共${todayData.currentOccupied || 0}间在住`,
      color: '#8b5cf6'
    }
  ]

  const handleNewBooking = (type: 'manual' | 'quick') => {
    setBookingModalVisible(true)
  }

  const handleGuestCheckin = (type: 'scan' | 'manual') => {
    if (type === 'scan') {
      router.push('/camera/id-scan')
    } else {
      setCheckinModalVisible(true)
    }
  }

  const handleQuickCheckout = () => {
    setCheckoutType('quick')
    setCheckoutModalVisible(true)
  }

  const handleBillingCheckout = () => {
    setCheckoutType('billing')
    setCheckoutModalVisible(true)
  }

  const saveBooking = () => {
    if (!bookingFormData.guestName.trim() || !bookingFormData.phone.trim() || !bookingFormData.checkIn) {
      Alert.alert('错误', '请填写必要的预订信息')
      return
    }

    setBookingModalVisible(false)
    setBookingFormData({
      guestName: '',
      phone: '',
      idNumber: '',
      roomType: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
    })
    Alert.alert('预订成功', `已为 ${bookingFormData.guestName} 创建预订`)
  }

  const saveCheckin = () => {
    if (!checkinFormData.guestName.trim() || !checkinFormData.idNumber.trim() || !checkinFormData.roomNumber.trim()) {
      Alert.alert('错误', '请填写完整的入住信息')
      return
    }

    setCheckinModalVisible(false)
    setCheckinFormData({
      guestName: '',
      idNumber: '',
      phone: '',
      roomNumber: '',
      checkInDate: new Date().toISOString().split('T')[0],
      emergencyContact: '',
    })
    Alert.alert('入住成功', `${checkinFormData.guestName} 已成功入住 ${checkinFormData.roomNumber}`)
  }

  const saveCheckout = () => {
    if (!checkoutFormData.roomNumber.trim()) {
      Alert.alert('错误', '请输入房间号')
      return
    }

    const totalCharges = checkoutFormData.extraCharges + checkoutFormData.damageCharges
    const message = checkoutType === 'quick' 
      ? `房间 ${checkoutFormData.roomNumber} 快速退房完成`
      : `房间 ${checkoutFormData.roomNumber} 退房完成\n额外费用：¥${totalCharges}`

    setCheckoutModalVisible(false)
    setCheckoutFormData({
      roomNumber: '',
      guestName: '',
      extraCharges: 0,
      damageCharges: 0,
      notes: '',
    })
    Alert.alert('退房成功', message)
  }

  const handleDateSelect = (date: string) => {
    if (currentFormType === 'booking') {
      setBookingFormData(prev => ({
        ...prev,
        [datePickerType]: date
      }))
    } else {
      setCheckinFormData(prev => ({
        ...prev,
        checkInDate: date
      }))
    }
  }

  const openDatePicker = (type: 'checkIn' | 'checkOut' | 'checkinDate', formType: 'booking' | 'checkin') => {
    setDatePickerType(type)
    setCurrentFormType(formType)
    setDatePickerVisible(true)
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4a90e2"
            colors={['#4a90e2']}
          />
        }
      >
        {/* 页面头部 */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}
            {userInfo.name ? ` ${userInfo.name}` : ''}
          </Text>
          <Text style={styles.subtitle}>
            {userInfo.hotelName || '客满云酒店民宿管理系统'}
          </Text>
        </View>

        {/* KPI 卡片 */}
        <View style={styles.kpiContainer}>
          {kpiData.map((kpi, index) => (
            <View key={index} style={styles.kpiWrapper}>
              <KPICard 
                {...kpi} 
                onPress={() => {
                  if (kpi.title.includes('入住') || kpi.title.includes('退房')) {
                    router.push('/reservations')
                  } else if (kpi.title.includes('在住')) {
                    router.push('/calendar')
                  } else if (kpi.title.includes('收入')) {
                    router.push('/revenue-details')
                  }
                }}
              />
            </View>
          ))}
        </View>

        {/* 快捷操作 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快捷操作</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  '新建预订',
                  '请选择预订方式',
                  [
                    { text: '手动预订', onPress: () => handleNewBooking('manual') },
                    { text: '快速预订', onPress: () => handleNewBooking('quick') },
                    { text: '取消', style: 'cancel' }
                  ]
                )
              }}
            >
              <Text style={styles.actionText}>新建预订</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/calendar')}
            >
              <Text style={styles.actionText}>房态管理</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  '客人入住',
                  '选择入住方式',
                  [
                    { text: '扫描身份证', onPress: () => handleGuestCheckin('scan') },
                    { text: '手动录入', onPress: () => handleGuestCheckin('manual') },
                    { text: '取消', style: 'cancel' }
                  ]
                )
              }}
            >
              <Text style={styles.actionText}>客人入住</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  '客人退房',
                  '选择退房处理方式',
                  [
                    { text: '快速退房', onPress: () => handleQuickCheckout() },
                    { text: '结算退房', onPress: () => handleBillingCheckout() },
                    { text: '取消', style: 'cancel' }
                  ]
                )
              }}
            >
              <Text style={styles.actionText}>客人退房</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/room-type-settings')}
            >
              <Text style={styles.actionText}>房型设置</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 最近预订 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近预订</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/reservations')}>
              <Text style={styles.seeAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>
          {recentReservations.length === 0 ? (
            <View style={styles.emptyReservations}>
              <Text style={styles.emptyText}>暂无预订</Text>
            </View>
          ) : (
            <View style={styles.reservationList}>
              {recentReservations.map((reservation, index) => (
                <ReservationItem 
                  key={index} 
                  guestName={reservation.guestName}
                  room={reservation.room}
                  checkIn={reservation.checkIn}
                  status={reservation.status}
                  onPress={() => {
                    router.push({
                      pathname: '/order-details',
                      params: {
                        reservationId: reservation.id, // 传递预订ID
                        orderId: reservation.orderId,
                        guestName: reservation.guestName,
                        guestPhone: reservation.guestPhone,
                        channel: reservation.channel,
                        checkInDate: reservation.checkIn,
                        checkOutDate: reservation.checkOutDate,
                        roomType: reservation.room,
                        roomPrice: reservation.roomPrice,
                        guestCount: '1',
                        nights: reservation.nights,
                        totalAmount: reservation.totalAmount,
                      }
                    })
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 新建预订弹窗 */}
      <Modal
        visible={bookingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新建预订</Text>
            
            <TextInput
              style={styles.modalInput}
              value={bookingFormData.guestName}
              onChangeText={(text) => setBookingFormData(prev => ({ ...prev, guestName: text }))}
              placeholder="客人姓名 *"
            />
            
            <TextInput
              style={styles.modalInput}
              value={bookingFormData.phone}
              onChangeText={(text) => setBookingFormData(prev => ({ ...prev, phone: text }))}
              placeholder="联系电话 *"
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.modalInput}
              value={bookingFormData.idNumber}
              onChangeText={(text) => setBookingFormData(prev => ({ ...prev, idNumber: text }))}
              placeholder="身份证号"
            />
            
            <TextInput
              style={styles.modalInput}
              value={bookingFormData.roomType}
              onChangeText={(text) => setBookingFormData(prev => ({ ...prev, roomType: text }))}
              placeholder="房间类型（如：标准间）"
            />
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('checkIn', 'booking')}
            >
              <Text style={styles.dateButtonText}>
                {bookingFormData.checkIn || '选择入住日期 *'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('checkOut', 'booking')}
            >
              <Text style={styles.dateButtonText}>
                {bookingFormData.checkOut || '选择退房日期'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setBookingModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveBooking}
              >
                <Text style={styles.confirmButtonText}>确认预订</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 客人入住弹窗 */}
      <Modal
        visible={checkinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCheckinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>客人入住</Text>
            
            <TextInput
              style={styles.modalInput}
              value={checkinFormData.guestName}
              onChangeText={(text) => setCheckinFormData(prev => ({ ...prev, guestName: text }))}
              placeholder="客人姓名 *"
            />
            
            <TextInput
              style={styles.modalInput}
              value={checkinFormData.idNumber}
              onChangeText={(text) => setCheckinFormData(prev => ({ ...prev, idNumber: text }))}
              placeholder="身份证号 *"
            />
            
            <TextInput
              style={styles.modalInput}
              value={checkinFormData.phone}
              onChangeText={(text) => setCheckinFormData(prev => ({ ...prev, phone: text }))}
              placeholder="联系电话"
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.modalInput}
              value={checkinFormData.roomNumber}
              onChangeText={(text) => setCheckinFormData(prev => ({ ...prev, roomNumber: text }))}
              placeholder="房间号 * (如：A101)"
            />
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('checkinDate', 'checkin')}
            >
              <Text style={styles.dateButtonText}>
                {checkinFormData.checkInDate || '选择入住日期'}
              </Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.modalInput}
              value={checkinFormData.emergencyContact}
              onChangeText={(text) => setCheckinFormData(prev => ({ ...prev, emergencyContact: text }))}
              placeholder="紧急联系人"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCheckinModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveCheckin}
              >
                <Text style={styles.confirmButtonText}>确认入住</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
       {/* 客人退房弹窗 */}
       <Modal
         visible={checkoutModalVisible}
         transparent
         animationType="fade"
         onRequestClose={() => setCheckoutModalVisible(false)}
       >
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <Text style={styles.modalTitle}>
               {checkoutType === 'quick' ? '快速退房' : '结算退房'}
             </Text>
             
             <TextInput
               style={styles.modalInput}
               value={checkoutFormData.roomNumber}
               onChangeText={(text) => setCheckoutFormData(prev => ({ ...prev, roomNumber: text }))}
               placeholder="房间号 * (如：A101)"
             />
             
             {checkoutType === 'billing' && (
               <>
                 <TextInput
                   style={styles.modalInput}
                   value={checkoutFormData.guestName}
                   onChangeText={(text) => setCheckoutFormData(prev => ({ ...prev, guestName: text }))}
                   placeholder="客人姓名"
                 />
                 
                 <TextInput
                   style={styles.modalInput}
                   value={checkoutFormData.extraCharges.toString()}
                   onChangeText={(text) => setCheckoutFormData(prev => ({ ...prev, extraCharges: parseInt(text) || 0 }))}
                   placeholder="额外费用 (如：小食、服务费)"
                   keyboardType="numeric"
                 />
                 
                 <TextInput
                   style={styles.modalInput}
                   value={checkoutFormData.damageCharges.toString()}
                   onChangeText={(text) => setCheckoutFormData(prev => ({ ...prev, damageCharges: parseInt(text) || 0 }))}
                   placeholder="损坏赔偿费用"
                   keyboardType="numeric"
                 />
                 
                 <TextInput
                   style={[styles.modalInput, { height: 80 }]}
                   value={checkoutFormData.notes}
                   onChangeText={(text) => setCheckoutFormData(prev => ({ ...prev, notes: text }))}
                   placeholder="退房备注"
                   multiline
                   numberOfLines={3}
                   textAlignVertical="top"
                 />
               </>
             )}

             <View style={styles.modalButtons}>
               <TouchableOpacity
                 style={[styles.modalButton, styles.cancelButton]}
                 onPress={() => setCheckoutModalVisible(false)}
               >
                 <Text style={styles.cancelButtonText}>取消</Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={[styles.modalButton, styles.confirmButton]}
                 onPress={saveCheckout}
               >
                 <Text style={styles.confirmButtonText}>确认退房</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* 日期选择器 */}
       <DateWheelPicker
         visible={datePickerVisible}
         onClose={() => setDatePickerVisible(false)}
         onSelect={handleDateSelect}
         initialDate={
           currentFormType === 'booking'
             ? (datePickerType === 'checkIn' ? bookingFormData.checkIn : bookingFormData.checkOut)
             : checkinFormData.checkInDate
         }
         title={
           datePickerType === 'checkIn' ? '选择入住日期' :
           datePickerType === 'checkOut' ? '选择退房日期' : '选择入住日期'
         }
       />
     </View>
   )
 }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: Spacings.lg,
    backgroundColor: '#6366f1',
  },
  greeting: {
    fontSize: FontSizes.xlarge,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  kpiContainer: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
  },
  kpiWrapper: {
    marginBottom: Spacings.md,
  },
  kpiCard: {
    backgroundColor: 'white',
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.lg,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.sm,
  },
  kpiTitle: {
    fontSize: FontSizes.normal,
    color: '#64748b',
    fontWeight: '500',
  },
  trend: {
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: FontSizes.xlarge,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  kpiDescription: {
    fontSize: FontSizes.small,
    color: '#64748b',
  },
  section: {
    padding: Spacings.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: FontSizes.normal,
    color: '#6366f1',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    marginBottom: Spacings.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#6366f1',
    textAlign: 'center',
  },
  reservationList: {
    backgroundColor: 'white',
    borderRadius: ComponentSizes.borderRadiusLarge,
    overflow: 'hidden',
  },
  emptyReservations: {
    padding: Spacings.xxxl,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: ComponentSizes.borderRadiusLarge,
  },
  emptyText: {
    fontSize: FontSizes.normal,
    color: '#999',
  },
  reservationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacings.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  reservationInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  roomInfo: {
    fontSize: FontSizes.normal,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: Spacings.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: Spacings.lg,
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.xl,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: Spacings.lg,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: ComponentSizes.borderRadius,
    padding: Spacings.md,
    fontSize: FontSizes.medium,
    marginBottom: Spacings.md,
    minHeight: ComponentSizes.inputHeightSmall,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacings.lg,
    gap: Spacings.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacings.md,
    borderRadius: ComponentSizes.borderRadius,
    alignItems: 'center',
    minHeight: ComponentSizes.buttonHeightSmall,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  confirmButton: {
    backgroundColor: '#6366f1',
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: FontSizes.normal,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: FontSizes.normal,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: ComponentSizes.borderRadius,
    padding: Spacings.md,
    marginBottom: Spacings.md,
    backgroundColor: '#f8fafc',
    alignItems: 'flex-start',
    minHeight: ComponentSizes.inputHeightSmall,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: FontSizes.medium,
    color: '#374151',
  },
}) 