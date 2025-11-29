import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActionSheetIOS,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { cancelReservation, setReservations, setRoomStatuses } from './store/calendarSlice'
import { dataService } from './services/dataService'

export default function OrderDetailsScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const params = useLocalSearchParams()
  
  // 格式化日期为 YYYY-MM-DD
  const formatDate = (dateStr: string | string[]) => {
    if (!dateStr) return ''
    const str = Array.isArray(dateStr) ? dateStr[0] : dateStr
    try {
      const date = new Date(str)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      return str
    }
  }
  
  const {
    orderId,
    reservationId, // 新增：预订ID（优先使用）
    guestName,
    guestPhone,
    channel,
    checkInDate: rawCheckInDate,
    checkOutDate: rawCheckOutDate,
    roomType,
    roomPrice,
    guestCount,
    nights,
    totalAmount,
  } = params
  
  // 格式化日期
  const checkInDate = formatDate(rawCheckInDate as string)
  const checkOutDate = formatDate(rawCheckOutDate as string)

  // 从Redux获取预订、支付和房间数据
  const reservations = useAppSelector(state => state.calendar.reservations)
  const payments = useAppSelector(state => state.calendar.payments)
  const rooms = useAppSelector(state => state.calendar.rooms)
  
  // 查找当前订单（优先使用 reservationId，兼容旧代码使用 orderId）
  const currentReservation = useMemo(() => {
    if (reservationId) {
      // 如果有 reservationId，精确查找
      return reservations.find(r => r.id === reservationId)
    } else {
      // 兼容旧代码：使用 orderId（可能返回错误的预订）
      return reservations.find(r => r.orderId === orderId)
    }
  }, [reservations, orderId, reservationId])
  
  // 计算支付金额和其他费用
  const { paidAmount, otherFees } = useMemo(() => {
    if (!currentReservation) {
      return { paidAmount: 0, otherFees: 0 }
    }
    
    // 从payments数组中筛选当前订单的支付记录（确保payments存在且为数组）
    const orderPayments = (payments || []).filter(p => p.orderId === orderId)
    
    // 计算已支付金额（payment类型）
    const paid = orderPayments
      .filter(p => p.type === 'payment')
      .reduce((sum: number, p) => sum + p.amount, 0)
    
    // 计算退款金额（refund类型）
    const refunded = orderPayments
      .filter(p => p.type === 'refund')
      .reduce((sum: number, p) => sum + p.amount, 0)
    
    // 计算其他费用（otherFee类型）
    const other = orderPayments
      .filter(p => p.type === 'otherFee')
      .reduce((sum: number, p) => sum + p.amount, 0)
    
    return {
      paidAmount: paid - refunded,
      otherFees: other
    }
  }, [currentReservation, payments, orderId])

  // 状态翻译函数
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': '待确认',
      'CONFIRMED': '已确认',
      'CHECKED_IN': '已入住',
      'CHECKED_OUT': '已退房',
      'CANCELLED': '已取消',
      'pending': '待确认',
      'confirmed': '已确认',
      'checked_in': '已入住',
      'checked-in': '已入住',
      'checked_out': '已退房',
      'checked-out': '已退房',
      'cancelled': '已取消',
    }
    return statusMap[status] || '进行中'
  }
  
  const [orderStatus, setOrderStatus] = useState(getStatusText(currentReservation?.status || ''))
  const [menuVisible, setMenuVisible] = useState(false)
  const [reminders, setReminders] = useState<Array<{id: string, content: string, time: string}>>([])
  const [reminderModalVisible, setReminderModalVisible] = useState(false)
  const [editingReminder, setEditingReminder] = useState<{id: string, content: string, time: string} | null>(null)
  const [reminderContent, setReminderContent] = useState('')
  const [reminderTime, setReminderTime] = useState('')

  const remainingAmount = Number(totalAmount) - paidAmount
  const totalReceivable = Number(totalAmount) + otherFees
  
  // 获取完整的房间信息
  const getRoomDisplayName = () => {
    if (currentReservation?.roomId) {
      const room = rooms.find(r => r.id === currentReservation.roomId)
      if (room) {
        return `${room.type} - ${room.name}`
      }
    }
    // 如果找不到房间，使用传入的roomType
    return roomType as string || '未知房间'
  }
  
  const displayRoomName = getRoomDisplayName()

  // 拨打电话
  const handleCall = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: `呼叫 ${guestPhone} 的方式`,
          options: ['取消', '主号', '数据流量'],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            makeCall('primary')
          } else if (buttonIndex === 2) {
            makeCall('data')
          }
        }
      )
    } else {
      makeCall('primary')
    }
  }

  const makeCall = async (type: 'primary' | 'data') => {
    try {
      const phoneUrl = `tel:${guestPhone}`
      const supported = await Linking.canOpenURL(phoneUrl)
      
      if (supported) {
        await Linking.openURL(phoneUrl)
      } else {
        Alert.alert('错误', '设备不支持拨打电话功能')
      }
    } catch (error) {
      Alert.alert('错误', '拨打电话失败')
    }
  }

  // 发送短信
  const handleSendSMS = () => {
    router.push({
      pathname: '/send-sms',
      params: {
        orderId,
        guestName,
        guestPhone,
      }
    })
  }

  // 添加收款/退款
  const handlePayment = () => {
    router.push({
      pathname: '/payment',
      params: {
        orderId,
        guestName,
        totalAmount,
        paidAmount: paidAmount.toString(),
        remainingAmount: remainingAmount.toString(),
      }
    })
  }

  // 办理退房
  const handleCheckout = () => {
    router.push({
      pathname: '/checkout',
      params: {
        orderId,
        guestName,
        roomType,
        checkInDate,
        totalAmount,
        paidAmount: paidAmount.toString(),
        remainingAmount: remainingAmount.toString(),
      }
    })
  }

  // 查看操作日志
  const handleViewLogs = () => {
    router.push({
      pathname: '/operation-logs',
      params: {
        orderId: currentReservation?.orderId || currentReservation?.id || orderId, // 优先使用实际的orderId
        reservationId: reservationId || orderId, // 也传递reservationId
      }
    })
  }

  // 添加提醒
  const handleAddReminder = () => {
    setEditingReminder(null)
    setReminderContent('')
    setReminderTime('')
    setReminderModalVisible(true)
  }

  // 编辑提醒
  const handleEditReminder = (reminder: {id: string, content: string, time: string}) => {
    setEditingReminder(reminder)
    setReminderContent(reminder.content)
    setReminderTime(reminder.time)
    setReminderModalVisible(true)
  }

  // 保存提醒
  const handleSaveReminder = () => {
    if (!reminderContent.trim()) {
      Alert.alert('提示', '请输入提醒内容')
      return
    }

    if (editingReminder) {
      // 编辑现有提醒
      setReminders(prev => prev.map(r => 
        r.id === editingReminder.id 
          ? { ...r, content: reminderContent, time: reminderTime || new Date().toLocaleString() }
          : r
      ))
    } else {
      // 添加新提醒
      const newReminder = {
        id: Date.now().toString(),
        content: reminderContent,
        time: reminderTime || new Date().toLocaleString(),
      }
      setReminders(prev => [...prev, newReminder])
    }

    setReminderModalVisible(false)
    setEditingReminder(null)
    setReminderContent('')
    setReminderTime('')
  }

  // 删除提醒
  const handleDeleteReminder = (reminderId: string) => {
    Alert.alert(
      '删除提醒',
      '确定要删除这条提醒吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setReminders(prev => prev.filter(r => r.id !== reminderId))
          }
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* 自定义顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>订单</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Text style={styles.menuText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* 菜单弹出层 */}
      {menuVisible && (
        <>
          <TouchableOpacity 
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.menuPopup}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false)
                router.push({
                  pathname: '/edit-order',
                  params: {
                    reservationId: reservationId || orderId, // 优先使用reservationId
                    roomId: currentReservation?.roomId || '', // 传递房间ID
                    orderId,
                    guestName,
                    guestPhone,
                    channel,
                    checkInDate,
                    checkOutDate,
                    roomType,
                    roomPrice,
                    guestCount,
                    nights,
                    totalAmount,
                  }
                })
              }}
            >
              <Text style={styles.menuItemText}>修改订单</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false)
                Alert.alert(
                  '取消预订',
                  '确定要取消此订单吗？',
                  [
                    { text: '取消', style: 'cancel' },
                    { 
                      text: '确定', 
                      onPress: async () => {
                        try {
                          console.log('🔍 开始取消预订...')
                          console.log('📋 orderId:', orderId)
                          console.log('📋 所有预订数量:', reservations.length)
                          console.log('📋 currentReservation:', currentReservation)
                          
                          // 获取正确的reservation ID
                          if (!currentReservation) {
                            console.error('❌ 未找到预订信息')
                            Alert.alert('错误', '未找到预订信息，可能预订尚未创建或已被删除')
                            return
                          }
                          
                          const reservationId = currentReservation.id
                          console.log('✅ 找到预订ID:', reservationId)
                          
                          // 调用 dataService 取消预订（会自动清除缓存）
                          console.log('💾 调用API取消预订...')
                          await dataService.reservations.cancel(reservationId)
                          
                          console.log('✅ 取消成功，立即刷新数据...')
                          
                          // 立即重新加载最新数据
                          const today = new Date()
                          const startDate = new Date(today)
                          startDate.setDate(today.getDate() - 30)
                          const endDate = new Date(today)
                          endDate.setDate(today.getDate() + 30)
                          
                          const startDateStr = startDate.toISOString().split('T')[0]
                          const endDateStr = endDate.toISOString().split('T')[0]
                          
                          // 并行加载所有数据
                          const [updatedReservations, updatedRoomStatuses] = await Promise.all([
                            dataService.reservations.getAll({
                              startDate: startDateStr,
                              endDate: endDateStr,
                            }),
                            dataService.roomStatus.getByDateRange(startDateStr, endDateStr)
                          ])
                          
                          // 立即更新Redux
                          dispatch(setReservations(updatedReservations))
                          dispatch(setRoomStatuses(Array.isArray(updatedRoomStatuses) ? updatedRoomStatuses : []))
                          
                          console.log('🔄 Redux数据已更新:', {
                            预订数: updatedReservations.length,
                            房态数: Array.isArray(updatedRoomStatuses) ? updatedRoomStatuses.length : 0
                          })
                          
                          console.log('✅ 取消成功！')
                          
                          Alert.alert('已取消', '订单已取消', [
                            {
                              text: '确定',
                              onPress: () => {
                                // 跳转回房态日历页
                                router.replace('/(tabs)/calendar')
                              }
                            }
                          ])
                        } catch (error: any) {
                          console.error('取消预订失败:', error)
                          Alert.alert('取消失败', error.message || '未知错误')
                        }
                      }
                    }
                  ]
                )
              }}
            >
              <Text style={styles.menuItemText}>取消预订</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false)
                Alert.alert(
                  '取消排房',
                  '确定要取消排房吗？',
                  [
                    { text: '取消', style: 'cancel' },
                    { text: '确定', onPress: () => Alert.alert('已取消', '排房已取消') }
                  ]
                )
              }}
            >
              <Text style={styles.menuItemText}>取消排房</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Tab 切换 */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>订单详情</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={handleViewLogs}>
          <Text style={styles.tabText}>操作日志</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 客人信息卡片 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.guestName}>{guestName} {guestPhone}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{orderStatus}</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={handleSendSMS}>
              <Text style={styles.iconButtonIcon}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleCall}>
              <Text style={styles.iconButtonIcon}>📞</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{channel}</Text>
            </View>
          </View>
        </View>

        {/* 房间总额 */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>房间总额：</Text>
          <Text style={styles.amountValue}>¥{Number(totalAmount).toFixed(2)}</Text>
          <Text style={styles.amountDetail}>共{nights}晚，消耗{nights}间夜</Text>
        </View>

        {/* 房间信息 */}
        <View style={styles.card}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomTitle}>{displayRoomName}</Text>
            <View style={styles.roomStatusBadge}>
              <Text style={styles.roomStatusText}>{orderStatus}</Text>
            </View>
          </View>
          
          <View style={styles.roomInfo}>
            <Text style={styles.roomInfoText}>{checkInDate} 入住，共 {nights} 晚</Text>
            <Text style={styles.roomPrice}>¥{Number(roomPrice).toFixed(2)}</Text>
          </View>

          <TouchableOpacity 
            style={styles.guestCountRow}
            onPress={() => {
              router.push({
                pathname: '/guest-info',
                params: {
                  name: guestName as string,
                  phone: guestPhone as string,
                  idType: '身份证',
                  idNumber: '',
                }
              })
            }}
          >
            <Text style={styles.guestCountLabel}>入住人</Text>
            <Text style={styles.guestCountValue}>{guestName || '未添加'} ›</Text>
          </TouchableOpacity>
        </View>

        {/* 其他消费 */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>其他消费：¥{otherFees.toFixed(2)}</Text>
            <TouchableOpacity onPress={() => router.push({
              pathname: '/add-consumption',
              params: { orderId }
            })}>
              <Text style={styles.addButton}>⊕ 添加消费</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 收款总额 */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>收款总额：¥{paidAmount.toFixed(2)}</Text>
            <TouchableOpacity onPress={handlePayment}>
              <Text style={styles.addButton}>⊕ 收款/退款</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 还需收款 */}
        <View style={styles.remainingCard}>
          <Text style={styles.remainingLabel}>还需收款：</Text>
          <Text style={styles.remainingAmount}>¥{remainingAmount.toFixed(2)}</Text>
        </View>

        {/* 订单提醒 */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>订单提醒</Text>
            <TouchableOpacity onPress={handleAddReminder}>
              <Text style={styles.addButton}>⊕ 添加提醒</Text>
            </TouchableOpacity>
          </View>
          
          {reminders.length > 0 && (
            <View style={styles.reminderList}>
              {reminders.map(reminder => (
                <View key={reminder.id} style={styles.reminderItem}>
                  <View style={styles.reminderContent}>
                    <Text style={styles.reminderText}>{reminder.content}</Text>
                    <Text style={styles.reminderTime}>{reminder.time}</Text>
                  </View>
                  <View style={styles.reminderActions}>
                    <TouchableOpacity onPress={() => handleEditReminder(reminder)}>
                      <Text style={styles.reminderEditIcon}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteReminder(reminder.id)}>
                      <Text style={styles.reminderDeleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>办理退房</Text>
        </TouchableOpacity>
      </View>

      {/* 提醒编辑弹窗 */}
      <Modal
        visible={reminderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setReminderModalVisible(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingReminder ? '编辑提醒' : '添加提醒'}
                </Text>
                
                <TextInput
                  style={[styles.modalInput, styles.reminderTextArea]}
                  value={reminderContent}
                  onChangeText={setReminderContent}
                  placeholder="请输入提醒内容"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <TextInput
                  style={styles.modalInput}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  placeholder="提醒时间（可选，如：2025-10-08 14:00）"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setReminderModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleSaveReminder}
                  >
                    <Text style={styles.confirmButtonText}>保存</Text>
                  </TouchableOpacity>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  menuButton: {
    padding: 4,
  },
  menuText: {
    fontSize: 24,
    color: '#333',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  menuPopup: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 150,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4a90e2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonIcon: {
    fontSize: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#1976d2',
  },
  amountCard: {
    backgroundColor: '#f8f9fa',
    marginTop: 12,
    padding: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 4,
  },
  amountDetail: {
    fontSize: 12,
    color: '#999',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  roomStatusBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roomStatusText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
  },
  roomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomInfoText: {
    fontSize: 13,
    color: '#666',
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  guestCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  guestCountLabel: {
    fontSize: 14,
    color: '#666',
  },
  guestCountValue: {
    fontSize: 14,
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    fontSize: 14,
    color: '#4a90e2',
  },
  remainingCard: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
    alignItems: 'flex-end',
  },
  remainingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  remainingAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  checkoutButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  reminderTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#4a90e2',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 15,
    color: 'white',
    fontWeight: '600',
  },
  reminderList: {
    marginTop: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reminderContent: {
    flex: 1,
  },
  reminderText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 12,
    color: '#999',
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 12,
  },
  reminderEditIcon: {
    fontSize: 18,
  },
  reminderDeleteIcon: {
    fontSize: 18,
  },
})

