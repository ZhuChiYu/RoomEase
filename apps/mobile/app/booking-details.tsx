import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { DateWheelPicker } from './components/DateWheelPicker'
import * as Linking from 'expo-linking'

interface BookingInfo {
  id: string
  guestName: string
  phone: string
  idNumber: string
  roomNumber: string
  roomType: string
  checkIn: string
  checkOut: string
  nights: number
  adults: number
  children: number
  price: number
  totalAmount: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out'
  notes?: string
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  createdAt: string
}

export default function BookingDetailsScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  
  // 编辑模式状态
  const [isEditing, setIsEditing] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editFormData, setEditFormData] = useState({
    guestName: '',
    phone: '',
    idNumber: '',
    roomNumber: '',
    roomType: '',
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    notes: '',
  })
  
  // 日期选择器状态
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [datePickerType, setDatePickerType] = useState<'checkIn' | 'checkOut'>('checkIn')
  
  // 模拟预订数据
  const [bookingInfo, setBookingInfo] = useState<BookingInfo>({
    id: params.id as string || 'BK001',
    guestName: '张三',
    phone: '13812345678',
    idNumber: '310101199001011234',
    roomNumber: 'A101',
    roomType: '豪华大床房',
    checkIn: '2024-01-15',
    checkOut: '2024-01-17',
    nights: 2,
    adults: 2,
    children: 0,
    price: 399,
    totalAmount: 798,
    status: 'confirmed',
    notes: '客人要求高层房间，靠近电梯',
    paymentStatus: 'paid',
    createdAt: '2024-01-10 14:30:00'
  })

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: '待确认',
      confirmed: '已确认',
      cancelled: '已取消',
      checked_in: '已入住',
      checked_out: '已退房'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      cancelled: '#ef4444',
      checked_in: '#3b82f6',
      checked_out: '#64748b'
    }
    return colorMap[status as keyof typeof colorMap] || '#64748b'
  }

  const getPaymentStatusText = (status: string) => {
    const statusMap = {
      unpaid: '未支付',
      partial: '部分支付',
      paid: '已支付'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const handleConfirmBooking = () => {
    Alert.alert('确认预订', '确定要确认这个预订吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确认', onPress: () => Alert.alert('成功', '预订已确认') }
    ])
  }

  const handleCancelBooking = () => {
    Alert.alert('取消预订', '确定要取消这个预订吗？此操作不可撤销。', [
      { text: '取消', style: 'cancel' },
      { text: '确认取消', style: 'destructive', onPress: () => Alert.alert('已取消', '预订已取消') }
    ])
  }

  const handleCheckin = () => {
    Alert.alert('办理入住', '确定要为客人办理入住吗？', [
      { text: '取消', style: 'cancel' },
      { text: '办理入住', onPress: () => Alert.alert('成功', '客人已成功入住') }
    ])
  }

  const handleCheckout = () => {
    Alert.alert('办理退房', '确定要为客人办理退房吗？', [
      { text: '取消', style: 'cancel' },
      { text: '办理退房', onPress: () => Alert.alert('成功', '客人已成功退房') }
    ])
  }

  const handleEditBooking = () => {
    setEditFormData({
      guestName: bookingInfo.guestName,
      phone: bookingInfo.phone,
      idNumber: bookingInfo.idNumber,
      roomNumber: bookingInfo.roomNumber,
      roomType: bookingInfo.roomType,
      checkIn: bookingInfo.checkIn,
      checkOut: bookingInfo.checkOut,
      adults: bookingInfo.adults,
      children: bookingInfo.children,
      notes: bookingInfo.notes || '',
    })
    setEditModalVisible(true)
  }

  const saveEdit = () => {
    if (!editFormData.guestName.trim() || !editFormData.phone.trim()) {
      Alert.alert('错误', '请填写完整的客人信息')
      return
    }

    // 更新预订信息
    setBookingInfo(prev => ({
      ...prev,
      guestName: editFormData.guestName,
      phone: editFormData.phone,
      idNumber: editFormData.idNumber,
      roomNumber: editFormData.roomNumber,
      roomType: editFormData.roomType,
      checkIn: editFormData.checkIn,
      checkOut: editFormData.checkOut,
      adults: editFormData.adults,
      children: editFormData.children,
      notes: editFormData.notes,
    }))

    setEditModalVisible(false)
    Alert.alert('修改成功', '预订信息已更新')
  }

  const handleCallGuest = async () => {
    const phoneNumber = bookingInfo.phone.replace(/[^\d]/g, '')
    if (phoneNumber.length < 8) {
      Alert.alert('提示', '电话号码不完整')
      return
    }
    
    Alert.alert(
      '拨打电话',
      `确定要拨打 ${bookingInfo.guestName} 的电话吗？\n${bookingInfo.phone}`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '拨打', 
          onPress: async () => {
            try {
              const url = `tel:${phoneNumber}`
              const supported = await Linking.canOpenURL(url)
              if (supported) {
                await Linking.openURL(url)
              } else {
                Alert.alert('错误', '设备不支持拨打电话功能')
              }
            } catch (error) {
              Alert.alert('错误', '拨打电话失败')
            }
          }
        }
      ]
    )
  }

  const handleDateSelect = (date: string) => {
    setEditFormData(prev => ({
      ...prev,
      [datePickerType]: date
    }))
  }

  const openDatePicker = (type: 'checkIn' | 'checkOut') => {
    setDatePickerType(type)
    setDatePickerVisible(true)
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>预订详情</Text>
        <TouchableOpacity onPress={handleEditBooking}>
          <Text style={styles.editButton}>编辑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 状态卡片 */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.bookingId}>预订号: {bookingInfo.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bookingInfo.status) }]}>
              <Text style={styles.statusText}>{getStatusText(bookingInfo.status)}</Text>
            </View>
          </View>
          <Text style={styles.createTime}>创建时间: {bookingInfo.createdAt}</Text>
        </View>

        {/* 客人信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>客人信息</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>姓名</Text>
              <Text style={styles.infoValue}>{bookingInfo.guestName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>联系电话</Text>
              <TouchableOpacity onPress={handleCallGuest}>
                <Text style={[styles.infoValue, { color: '#3b82f6', textDecorationLine: 'underline' }]}>
                  {bookingInfo.phone}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>身份证号</Text>
              <Text style={styles.infoValue}>{bookingInfo.idNumber}</Text>
            </View>
          </View>
        </View>

        {/* 房间信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>房间信息</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>房间号</Text>
              <Text style={styles.infoValue}>{bookingInfo.roomNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>房间类型</Text>
              <Text style={styles.infoValue}>{bookingInfo.roomType}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>入住日期</Text>
              <Text style={styles.infoValue}>{bookingInfo.checkIn}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>退房日期</Text>
              <Text style={styles.infoValue}>{bookingInfo.checkOut}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>入住天数</Text>
              <Text style={styles.infoValue}>{bookingInfo.nights} 晚</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>入住人数</Text>
              <Text style={styles.infoValue}>{bookingInfo.adults} 成人 {bookingInfo.children} 儿童</Text>
            </View>
          </View>
        </View>

        {/* 费用信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>费用信息</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>房费单价</Text>
              <Text style={styles.infoValue}>¥{bookingInfo.price}/晚</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>入住天数</Text>
              <Text style={styles.infoValue}>{bookingInfo.nights} 晚</Text>
            </View>
            <View style={[styles.infoRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>总金额</Text>
              <Text style={styles.totalValue}>¥{bookingInfo.totalAmount}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>支付状态</Text>
              <Text style={[styles.infoValue, { color: bookingInfo.paymentStatus === 'paid' ? '#10b981' : '#f59e0b' }]}>
                {getPaymentStatusText(bookingInfo.paymentStatus)}
              </Text>
            </View>
          </View>
        </View>

        {/* 备注信息 */}
        {bookingInfo.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>备注信息</Text>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{bookingInfo.notes}</Text>
            </View>
          </View>
        )}

        {/* 操作按钮 */}
        <View style={styles.actionSection}>
          {bookingInfo.status === 'pending' && (
            <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirmBooking}>
              <Text style={styles.actionButtonText}>确认预订</Text>
            </TouchableOpacity>
          )}
          
          {bookingInfo.status === 'confirmed' && (
            <TouchableOpacity style={[styles.actionButton, styles.checkinButton]} onPress={handleCheckin}>
              <Text style={styles.actionButtonText}>办理入住</Text>
            </TouchableOpacity>
          )}
          
          {bookingInfo.status === 'checked_in' && (
            <TouchableOpacity style={[styles.actionButton, styles.checkoutButton]} onPress={handleCheckout}>
              <Text style={styles.actionButtonText}>办理退房</Text>
            </TouchableOpacity>
          )}
          
          {bookingInfo.status !== 'cancelled' && bookingInfo.status !== 'checked_out' && (
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelBooking}>
              <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>取消预订</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* 编辑预订弹窗 */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>编辑预订信息</Text>
            
            <TextInput
              style={styles.modalInput}
              value={editFormData.guestName}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, guestName: text }))}
              placeholder="客人姓名 *"
            />
            
            <TextInput
              style={styles.modalInput}
              value={editFormData.phone}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, phone: text }))}
              placeholder="联系电话 *"
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.modalInput}
              value={editFormData.idNumber}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, idNumber: text }))}
              placeholder="身份证号"
            />
            
            <TextInput
              style={styles.modalInput}
              value={editFormData.roomNumber}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, roomNumber: text }))}
              placeholder="房间号"
            />
            
            <TextInput
              style={styles.modalInput}
              value={editFormData.roomType}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, roomType: text }))}
              placeholder="房间类型"
            />
            
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => openDatePicker('checkIn')}
                >
                  <Text style={styles.dateButtonText}>
                    {editFormData.checkIn || '选择入住日期'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.halfInput}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => openDatePicker('checkOut')}
                >
                  <Text style={styles.dateButtonText}>
                    {editFormData.checkOut || '选择退房日期'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.modalInput}
                  value={editFormData.adults.toString()}
                  onChangeText={(text) => setEditFormData(prev => ({ ...prev, adults: parseInt(text) || 1 }))}
                  placeholder="成人数量"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  style={styles.modalInput}
                  value={editFormData.children.toString()}
                  onChangeText={(text) => setEditFormData(prev => ({ ...prev, children: parseInt(text) || 0 }))}
                  placeholder="儿童数量"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              value={editFormData.notes}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, notes: text }))}
              placeholder="备注信息"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={saveEdit}
              >
                <Text style={styles.modalConfirmButtonText}>保存修改</Text>
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
        initialDate={datePickerType === 'checkIn' ? editFormData.checkIn : editFormData.checkOut}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#6366f1',
    paddingTop: 50,
  },
  backButton: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  editButton: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  createTime: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  notesText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  actionSection: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkinButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkoutButton: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderColor: '#ef4444',
  },
  actionButtonText: {
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
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f1f5f9',
  },
  modalConfirmButton: {
    backgroundColor: '#6366f1',
  },
  modalCancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  modalConfirmButtonText: {
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
  },
  dateButtonText: {
    fontSize: 16,
    color: '#374151',
  },
}) 