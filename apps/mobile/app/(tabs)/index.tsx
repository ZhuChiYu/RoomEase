import React, { useState, useMemo } from 'react'
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
} from 'react-native'
import { useRouter } from 'expo-router'
import { DateWheelPicker } from '../components/DateWheelPicker'
import { useAppSelector } from '../store/hooks'

const { width } = Dimensions.get('window')

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
  
  // 计算今日数据
  const todayData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    
    // 今日入住
    const todayCheckIn = reservations.filter(r => r.checkInDate === today && r.status !== 'cancelled').length
    
    // 今日退房
    const todayCheckOut = reservations.filter(r => r.checkOutDate === today && r.status !== 'cancelled').length
    
    // 当前在住
    const currentOccupied = reservations.filter(r => {
      return r.checkInDate <= today && r.checkOutDate > today && r.status !== 'cancelled'
    }).length
    
    // 入住率
    const occupancyRate = rooms.length > 0 ? ((currentOccupied / rooms.length) * 100).toFixed(0) : 0
    
    // 本月收入
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const monthlyRevenue = reservations.filter(r => {
      const checkInDate = new Date(r.checkInDate)
      return checkInDate.getMonth() + 1 === currentMonth && checkInDate.getFullYear() === currentYear
    }).reduce((sum, r) => sum + (r.totalAmount || 0), 0)
    
    return {
      todayCheckIn,
      todayCheckOut,
      currentOccupied,
      occupancyRate,
      monthlyRevenue,
    }
  }, [reservations, rooms])
  
  // 今日及最近的预订（显示今日的预订）
  const recentReservations = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return reservations
      .filter(r => r.checkInDate === today && r.status !== 'cancelled')
      .slice(0, 3)
      .map(r => ({
        id: r.id,
        guestName: r.guestName,
        room: r.roomNumber,
        checkIn: r.checkInDate,
        status: r.status === 'confirmed' ? 'confirmed' as const : 'pending' as const,
      }))
  }, [reservations])
  
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
      value: todayData.todayCheckIn,
      description: `共${todayData.todayCheckIn}间`,
      color: '#3b82f6'
    },
    {
      title: '今日退房',
      value: todayData.todayCheckOut,
      description: `共${todayData.todayCheckOut}间`,
      color: '#ef4444'
    },
    {
      title: '当前在住',
      value: todayData.currentOccupied,
      description: `入住率 ${todayData.occupancyRate}%`,
      color: '#10b981'
    },
    {
      title: '本月收入',
      value: `¥${todayData.monthlyRevenue.toFixed(2)}`,
      description: `共${rooms.length}间房`,
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
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* 页面头部 */}
        <View style={styles.header}>
          <Text style={styles.greeting}>早上好</Text>
          <Text style={styles.subtitle}>阳光民宿管理系统</Text>
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
          <View style={styles.reservationList}>
            {recentReservations.map((reservation, index) => (
              <ReservationItem 
                key={index} 
                {...reservation} 
                onPress={() => {
                  Alert.alert(
                    '预订详情',
                    `客人：${reservation.guestName}\n房间：${reservation.room}\n入住：${reservation.checkIn}\n状态：${reservation.status === 'confirmed' ? '已确认' : '待确认'}`,
                    [
                      { text: '查看详情', onPress: () => router.push(`/booking-details?id=RES${String(index + 1).padStart(3, '0')}`) },
                      { text: '取消', style: 'cancel' }
                    ]
                  )
                }}
              />
            ))}
          </View>
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
    padding: 20,
    backgroundColor: '#6366f1',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  kpiContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  kpiWrapper: {
    marginBottom: 12,
  },
  kpiCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 8,
  },
  kpiTitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  trend: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  kpiDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 14,
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
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  reservationList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  reservationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  reservationInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  roomInfo: {
    fontSize: 14,
    color: '#64748b',
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