import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { DateWheelPicker } from '../components/DateWheelPicker'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { deleteReservation, setRooms, setReservations, setRoomStatuses } from '../store/calendarSlice'
import { dataService } from '../services/dataService'
import { Reservation } from '../store/types'

interface ReservationCardProps {
  reservation: Reservation
  onPress: (id: string) => void
  onDelete: (id: string) => void
}

function ReservationCard({ reservation, onPress, onDelete }: ReservationCardProps) {
  // 从 Redux 获取房间列表来补充房间信息
  const rooms = useAppSelector(state => state.calendar.rooms)
  
  // 根据 roomId 查找房间信息
  const room = rooms.find(r => r.id === reservation.roomId)
  const displayRoomType = reservation.roomType || room?.type || ''
  const displayRoomNumber = reservation.roomNumber || room?.name || ''
  const getStatusColor = (status: string) => {
    // 转换为小写进行匹配
    const statusLower = status?.toLowerCase() || ''
    switch (statusLower) {
      case 'confirmed':
        return { bg: '#dcfce7', text: '#166534' }
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e' }
      case 'checked-in':
      case 'checked_in':
        return { bg: '#dbeafe', text: '#1e40af' }
      case 'checked-out':
      case 'checked_out':
        return { bg: '#f3e8ff', text: '#7c3aed' }
      case 'cancelled':
        return { bg: '#fecaca', text: '#dc2626' }
      default:
        console.warn('⚠️ [状态] 未知状态:', status)
        return { bg: '#f1f5f9', text: '#64748b' }
    }
  }

  const getStatusText = (status: string) => {
    // 转换为小写进行匹配
    const statusLower = status?.toLowerCase() || ''
    switch (statusLower) {
      case 'confirmed':
        return '已确认'
      case 'pending':
        return '待确认'
      case 'checked-in':
      case 'checked_in':
        return '已入住'
      case 'checked-out':
      case 'checked_out':
        return '已退房'
      case 'cancelled':
        return '已取消'
      default:
        // 如果遇到未知状态，打印日志并返回
        console.warn('⚠️ [状态] 未知状态:', status)
        return `未知(${status})`
    }
  }

  const statusColor = getStatusColor(reservation.status)

  return (
    <TouchableOpacity
      style={styles.reservationCard}
      onPress={() => onPress(reservation.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.guestName}>{reservation.guestName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {getStatusText(reservation.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>房间:</Text>
          <Text style={styles.infoValue}>
            {displayRoomType && displayRoomNumber 
              ? `${displayRoomType} - ${displayRoomNumber}` 
              : displayRoomType || displayRoomNumber || '未分配'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>入住:</Text>
          <Text style={styles.infoValue}>{reservation.checkInDate?.split('T')[0] || reservation.checkInDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>退房:</Text>
          <Text style={styles.infoValue}>{reservation.checkOutDate?.split('T')[0] || reservation.checkOutDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>手机:</Text>
          <Text style={styles.infoValue}>{reservation.guestPhone}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.totalAmount}>
          总金额: ¥{reservation.totalAmount.toLocaleString()}
        </Text>
        <View style={styles.cardActions}>
          <Text style={styles.reservationId}>
            {reservation.createdAt ? new Date(reservation.createdAt).toLocaleString('zh-CN', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '未知时间'}
          </Text>
          {(reservation.status === 'cancelled' || reservation.status === 'checked-out') && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation()
                onDelete(reservation.id)
              }}
            >
              <Text style={styles.deleteButtonText}>删除</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function ReservationsScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const params = useLocalSearchParams()
  const [searchText, setSearchText] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [newBookingData, setNewBookingData] = useState({
    guestName: '',
    phone: '',
    idNumber: '',
    roomType: '',
    checkIn: '',
    checkOut: '',
    specialRequests: '',
  })
  
  // 防抖相关
  const loadDataDebounceTimer = React.useRef<any>(null)
  const isLoadingData = React.useRef(false)

  // 日期选择器状态
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [datePickerType, setDatePickerType] = useState<'checkIn' | 'checkOut'>('checkIn')

  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [sortBy, setSortBy] = useState<'checkInDate' | 'createdAt' | 'amount'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filters = [
    { id: 'all', name: '全部' },
    { id: 'checkin-today', name: '今日入住' },
    { id: 'checkout-today', name: '今日退房' },
    { id: 'pending', name: '待确认' },
    { id: 'confirmed', name: '已确认' },
    { id: 'checked-in', name: '已入住' },
    { id: 'checked-out', name: '已退房' },
    { id: 'cancelled', name: '已取消' },
  ]

  // 处理从首页传递过来的筛选参数
  useEffect(() => {
    if (params.filter && typeof params.filter === 'string') {
      console.log('📋 [预订管理] 接收到筛选参数:', params.filter)
      setSelectedFilter(params.filter)
    }
  }, [params.filter])

  // 从Redux获取真实预订数据和房间数据
  const reduxReservations = useAppSelector(state => state.calendar.reservations)
  const rooms = useAppSelector(state => state.calendar.rooms)
  
  // 加载数据（总是从服务器获取最新数据，不使用缓存）
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      console.log('📋 [预订管理] 开始从服务器加载最新数据...')
      
      // 计算日期范围（今天往前30天，往后30天）
      const today = new Date()
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - 30)
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 30)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      // 如果需要强制刷新，先清除缓存
      if (forceRefresh) {
        await dataService.cache.clearAll()
        console.log('📋 [预订管理] 已清除所有缓存')
      }
      
      // 并行加载数据（从服务器获取）
      const [roomsData, reservationsData, roomStatusesData] = await Promise.all([
        dataService.rooms.getAll(),
        dataService.reservations.getAll({
          startDate: startDateStr,
          endDate: endDateStr,
        }),
        dataService.roomStatus.getByDateRange(startDateStr, endDateStr)
      ])
      
      console.log('📋 [预订管理] 服务器数据加载完成:', {
        rooms: roomsData.length,
        reservations: reservationsData.length,
      })
      
      // 更新Redux
      dispatch(setRooms(roomsData))
      dispatch(setReservations(reservationsData))
      dispatch(setRoomStatuses(Array.isArray(roomStatusesData) ? roomStatusesData : []))
    } catch (error) {
      console.error('❌ [预订管理] 数据加载失败:', error)
    }
  }, [dispatch])
  
  // 页面获得焦点时加载数据（总是从服务器获取最新数据，添加防抖）
  useFocusEffect(
    useCallback(() => {
      console.log('📋 [预订管理] 页面获得焦点')
      
      // 清除之前的防抖定时器
      if (loadDataDebounceTimer.current) {
        clearTimeout(loadDataDebounceTimer.current)
      }
      
      // 如果正在加载，跳过本次请求
      if (isLoadingData.current) {
        console.log('📋 [预订管理] 数据正在加载中，跳过本次请求')
        return
      }
      
      // 防抖：300ms后才执行加载
      loadDataDebounceTimer.current = setTimeout(() => {
        console.log('📋 [预订管理] 防抖结束，开始从服务器加载最新数据')
        isLoadingData.current = true
        
        // 总是清除缓存并从服务器获取最新数据
        loadData(true).finally(() => {
          isLoadingData.current = false
          console.log('📋 [预订管理] 数据加载完成')
        })
      }, 300)
      
      // 清理函数
      return () => {
        if (loadDataDebounceTimer.current) {
          clearTimeout(loadDataDebounceTimer.current)
        }
      }
    }, [loadData])
  )
  
  // 下拉刷新处理
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      console.log('🔄 [预订管理] 用户下拉刷新，从服务器获取最新数据...')
      await loadData(true) // 强制刷新
    } catch (error) {
      console.error('❌ [预订管理] 刷新失败:', error)
    } finally {
      setRefreshing(false)
    }
  }
  
  console.log('📋 [Reservations] Redux预订数据:', reduxReservations.length, '条')
  console.log('📋 [Reservations] Redux房间数据:', rooms.length, '个')
  
  // 调试：打印第一条预订的详细信息
  if (reduxReservations.length > 0) {
    const first = reduxReservations[0]
    const firstRoom = rooms.find(r => r.id === first.roomId)
    console.log('📋 [预订详情] 第一条预订:', {
      status: first.status,
      roomType: first.roomType,
      roomNumber: first.roomNumber,
      roomId: first.roomId,
      '查找到的房间': firstRoom ? { type: firstRoom.type, name: firstRoom.name } : '未找到'
    })
  }
  
  // 直接使用 Redux 数据，不需要转换（Redux 数据已经是正确的 Reservation 类型）
  const reservations: Reservation[] = reduxReservations

  const filteredReservations = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    
    let filtered = reservations.filter(reservation => {
      // 搜索过滤
      const matchesSearch = searchText === '' || 
        reservation.guestName.toLowerCase().includes(searchText.toLowerCase()) ||
        reservation.roomNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        reservation.roomType.toLowerCase().includes(searchText.toLowerCase()) ||
        reservation.id.toLowerCase().includes(searchText.toLowerCase()) ||
        reservation.guestPhone.includes(searchText)
      
      // 状态过滤
      let matchesFilter = false
      if (selectedFilter === 'all') {
        matchesFilter = true
      } else if (selectedFilter === 'checkin-today') {
        // 今日入住：入住日期是今天，且未取消
        const checkInDate = reservation.checkInDate.split('T')[0]
        matchesFilter = checkInDate === today && reservation.status !== 'cancelled'
      } else if (selectedFilter === 'checkout-today') {
        // 今日退房：退房日期是今天，且未取消
        const checkOutDate = reservation.checkOutDate.split('T')[0]
        matchesFilter = checkOutDate === today && reservation.status !== 'cancelled'
      } else if (selectedFilter === 'today') {
        // 今日：入住或退房日期是今天
        const checkInDate = reservation.checkInDate.split('T')[0]
        const checkOutDate = reservation.checkOutDate.split('T')[0]
        matchesFilter = (checkInDate === today || checkOutDate === today) && reservation.status !== 'cancelled'
      } else {
        // 按状态筛选
        matchesFilter = reservation.status === selectedFilter
      }
      
      // 日期范围过滤
      let matchesDateRange = true
      if (startDateFilter) {
        const checkInDate = reservation.checkInDate.split('T')[0]
        matchesDateRange = matchesDateRange && checkInDate >= startDateFilter
      }
      if (endDateFilter) {
        const checkOutDate = reservation.checkOutDate.split('T')[0]
        matchesDateRange = matchesDateRange && checkOutDate <= endDateFilter
      }
      
      return matchesSearch && matchesFilter && matchesDateRange
    })

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0
      
      if (sortBy === 'checkInDate') {
        // 按入住日期排序
        comparison = a.checkInDate.localeCompare(b.checkInDate)
      } else if (sortBy === 'createdAt') {
        // 按创建日期排序
        const aTime = a.createdAt || ''
        const bTime = b.createdAt || ''
        comparison = aTime.localeCompare(bTime)
      } else if (sortBy === 'amount') {
        // 按金额排序
        comparison = a.totalAmount - b.totalAmount
      }
      
      // desc（降序）= 最新的/最大的在前，asc（升序）= 最旧的/最小的在前
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [reservations, searchText, selectedFilter, startDateFilter, endDateFilter, sortBy, sortOrder])

  const handleReservationPress = (id: string) => {
    // 查找预订详情
    const reservation = reduxReservations.find(r => r.id === id)
    if (!reservation) {
      Alert.alert('错误', '找不到预订信息')
      return
    }

    // 查找房间信息
    const room = rooms.find(r => r.id === reservation.roomId)
    
    // 跳转到订单详情页面
    router.push({
      pathname: '/order-details',
      params: {
        orderId: reservation.orderId || reservation.id,
        reservationId: reservation.id,
        guestName: reservation.guestName,
        guestPhone: reservation.guestPhone,
        channel: reservation.channel,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        roomType: reservation.roomType,
        roomPrice: (reservation.roomPrice || 0).toString(),
        nights: (reservation.nights || 0).toString(),
        totalAmount: (reservation.totalAmount || 0).toString(),
      }
    })
  }

  const handleDeleteReservation = async (id: string) => {
    Alert.alert(
      '删除预订',
      '确定要删除这个预订吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ 删除预订:', id)
              
              // 调用 dataService 删除预订（会自动清除缓存）
              await dataService.reservations.delete(id)
              
              console.log('✅ 删除成功')
              Alert.alert('成功', '预订已删除')
            } catch (error: any) {
              console.error('❌ 删除预订失败:', error)
              Alert.alert('删除失败', error.message || '未知错误')
            }
          }
        }
      ]
    )
  }

  const handleAddReservation = () => {
    setAddModalVisible(true)
  }

  const saveNewReservation = () => {
    if (!newBookingData.guestName.trim() || !newBookingData.phone.trim() || !newBookingData.checkIn) {
      Alert.alert('错误', '请填写必要的预订信息')
      return
    }

    setAddModalVisible(false)
    setNewBookingData({
      guestName: '',
      phone: '',
      idNumber: '',
      roomType: '',
      checkIn: '',
      checkOut: '',
      specialRequests: '',
    })
    Alert.alert('预订成功', `已为 ${newBookingData.guestName} 创建预订`)
  }

  const handleDateSelect = (date: string) => {
    setNewBookingData(prev => ({
      ...prev,
      [datePickerType]: date
    }))
  }

  const openDatePicker = (type: 'checkIn' | 'checkOut') => {
    setDatePickerType(type)
    setDatePickerVisible(true)
  }

  const renderReservation = ({ item }: { item: Reservation }) => (
    <ReservationCard
      reservation={item}
      onPress={handleReservationPress}
      onDelete={handleDeleteReservation}
    />
  )

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索客人姓名、房间或预订号"
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* 筛选器 */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter.id && styles.filterChipTextActive
              ]}>
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 高级筛选和排序 */}
      <View style={styles.advancedFilters}>
        <View style={styles.advancedFiltersRow}>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'createdAt' && styles.sortButtonActive]}
            onPress={() => setSortBy('createdAt')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'createdAt' && styles.sortButtonTextActive]}>
              创建时间
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'checkInDate' && styles.sortButtonActive]}
            onPress={() => setSortBy('checkInDate')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'checkInDate' && styles.sortButtonTextActive]}>
              入住日期
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'amount' && styles.sortButtonActive]}
            onPress={() => setSortBy('amount')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'amount' && styles.sortButtonTextActive]}>
              金额
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOrderButton, sortOrder === 'desc' && styles.sortOrderButtonActive]}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Text style={[styles.sortOrderButtonText, sortOrder === 'desc' && styles.sortOrderButtonTextActive]}>
              {sortOrder === 'desc' ? '↓' : '↑'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.resultCount}>
          共 {filteredReservations.length} 条结果 · {sortOrder === 'desc' ? '降序（新→旧/大→小）' : '升序（旧→新/小→大）'}
        </Text>
      </View>

      {/* 预订列表 */}
      <FlatList
        data={filteredReservations}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4a90e2"
            colors={['#4a90e2']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无预订记录</Text>
          </View>
        }
      />

      {/* 快捷操作按钮 */}
      <TouchableOpacity style={styles.fab} onPress={handleAddReservation}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* 新建预订弹窗 */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新建预订</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newBookingData.guestName}
              onChangeText={(text) => setNewBookingData(prev => ({ ...prev, guestName: text }))}
              placeholder="客人姓名 *"
            />
            
            <TextInput
              style={styles.modalInput}
              value={newBookingData.phone}
              onChangeText={(text) => setNewBookingData(prev => ({ ...prev, phone: text }))}
              placeholder="联系电话 *"
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.modalInput}
              value={newBookingData.idNumber}
              onChangeText={(text) => setNewBookingData(prev => ({ ...prev, idNumber: text }))}
              placeholder="身份证号"
            />
            
            <TextInput
              style={styles.modalInput}
              value={newBookingData.roomType}
              onChangeText={(text) => setNewBookingData(prev => ({ ...prev, roomType: text }))}
              placeholder="房间类型（如：标准间）"
            />
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('checkIn')}
            >
              <Text style={styles.dateButtonText}>
                {newBookingData.checkIn || '选择入住日期 *'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('checkOut')}
            >
              <Text style={styles.dateButtonText}>
                {newBookingData.checkOut || '选择退房日期'}
              </Text>
            </TouchableOpacity>
            
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              value={newBookingData.specialRequests}
              onChangeText={(text) => setNewBookingData(prev => ({ ...prev, specialRequests: text }))}
              placeholder="特殊要求（可选）"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveNewReservation}
              >
                <Text style={styles.confirmButtonText}>确认预订</Text>
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
        initialDate={datePickerType === 'checkIn' ? newBookingData.checkIn : newBookingData.checkOut}
        title={datePickerType === 'checkIn' ? '选择入住日期' : '选择退房日期'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchInput: {
    height: 44,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  filterContainer: {
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    marginLeft: 16,
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
  },
  filterChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
  },
  reservationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    paddingTop: 12,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  reservationId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
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
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'flex-start',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  advancedFilters: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  advancedFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#6366f1',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  sortOrderButton: {
    width: 36,
    height: 36,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortOrderButtonActive: {
    backgroundColor: '#6366f1',
  },
  sortOrderButtonText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold',
  },
  sortOrderButtonTextActive: {
    color: 'white',
  },
  resultCount: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
}) 