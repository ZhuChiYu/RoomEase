import React, { useState } from 'react'
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
} from 'react-native'
import { useRouter } from 'expo-router'
import { DateWheelPicker } from '../components/DateWheelPicker'

interface Reservation {
  id: string
  guestName: string
  room: string
  checkIn: string
  checkOut: string
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  totalAmount: number
  guestPhone: string
}

interface ReservationCardProps {
  reservation: Reservation
  onPress: (id: string) => void
}

function ReservationCard({ reservation, onPress }: ReservationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#dcfce7', text: '#166534' }
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e' }
      case 'checked_in':
        return { bg: '#dbeafe', text: '#1e40af' }
      case 'checked_out':
        return { bg: '#f3e8ff', text: '#7c3aed' }
      case 'cancelled':
        return { bg: '#fecaca', text: '#dc2626' }
      default:
        return { bg: '#f1f5f9', text: '#64748b' }
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '已确认'
      case 'pending':
        return '待确认'
      case 'checked_in':
        return '已入住'
      case 'checked_out':
        return '已退房'
      case 'cancelled':
        return '已取消'
      default:
        return status
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
          <Text style={styles.infoValue}>{reservation.room}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>入住:</Text>
          <Text style={styles.infoValue}>{reservation.checkIn}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>退房:</Text>
          <Text style={styles.infoValue}>{reservation.checkOut}</Text>
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
        <Text style={styles.reservationId}>
          #{reservation.id}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export default function ReservationsScreen() {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
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

  // 日期选择器状态
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [datePickerType, setDatePickerType] = useState<'checkIn' | 'checkOut'>('checkIn')

  const filters = [
    { id: 'all', name: '全部' },
    { id: 'pending', name: '待确认' },
    { id: 'confirmed', name: '已确认' },
    { id: 'checked_in', name: '已入住' },
    { id: 'today', name: '今日' },
  ]

  // 模拟预订数据
  const reservations: Reservation[] = [
    {
      id: 'RES001',
      guestName: '张三',
      room: 'A101 - 豪华大床房',
      checkIn: '2024-01-15',
      checkOut: '2024-01-17',
      status: 'confirmed',
      totalAmount: 1200,
      guestPhone: '13812345678'
    },
    {
      id: 'RES002',
      guestName: '李四',
      room: 'A102 - 标准双人房',
      checkIn: '2024-01-15',
      checkOut: '2024-01-16',
      status: 'pending',
      totalAmount: 800,
      guestPhone: '13987654321'
    },
    {
      id: 'RES003',
      guestName: '王五',
      room: 'B201 - 家庭套房',
      checkIn: '2024-01-14',
      checkOut: '2024-01-18',
      status: 'checked_in',
      totalAmount: 2400,
      guestPhone: '13611223344'
    },
    {
      id: 'RES004',
      guestName: '赵六',
      room: 'A103 - 标准双人房',
      checkIn: '2024-01-12',
      checkOut: '2024-01-14',
      status: 'checked_out',
      totalAmount: 600,
      guestPhone: '13755667788'
    }
  ]

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.guestName.toLowerCase().includes(searchText.toLowerCase()) ||
                         reservation.room.toLowerCase().includes(searchText.toLowerCase()) ||
                         reservation.id.toLowerCase().includes(searchText.toLowerCase())
    
    const matchesFilter = selectedFilter === 'all' || 
                         reservation.status === selectedFilter ||
                         (selectedFilter === 'today' && reservation.checkIn === '2024-01-15')
    
    return matchesSearch && matchesFilter
  })

  const handleReservationPress = (id: string) => {
    router.push(`/booking-details?id=${id}`)
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

      {/* 预订列表 */}
      <FlatList
        data={filteredReservations}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
}) 