import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Alert,
  Modal,
  TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'

const { width, height } = Dimensions.get('window')

// 日历选择器组件
interface CalendarPickerProps {
  visible: boolean
  onClose: () => void
  onSelectDate: (date: Date) => void
  selectedDate: Date
}

function CalendarPicker({ visible, onClose, onSelectDate, selectedDate }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate))
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startWeekDay = firstDay.getDay()
    
    const days = []
    
    // 添加上个月的日期
    for (let i = startWeekDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }
    
    // 添加当前月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      days.push({ date, isCurrentMonth: true })
    }
    
    // 添加下个月的日期（补齐6行）
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i)
      days.push({ date: nextDate, isCurrentMonth: false })
    }
    
    return days
  }

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleSelectDate = (date: Date) => {
    onSelectDate(date)
    onClose()
  }

  const days = getDaysInMonth(currentMonth)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.calendarModalOverlay}>
        <View style={styles.calendarModalContent}>
          {/* 头部 */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth}>
              <Text style={styles.calendarNavButton}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>{formatMonth(currentMonth)}</Text>
            <TouchableOpacity onPress={handleNextMonth}>
              <Text style={styles.calendarNavButton}>›</Text>
            </TouchableOpacity>
          </View>

          {/* 星期标题 */}
          <View style={styles.weekHeader}>
            {weekDays.map(day => (
              <Text key={day} style={styles.weekDay}>{day}</Text>
            ))}
          </View>

          {/* 日期网格 */}
          <View style={styles.daysGrid}>
            {days.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isSelected(item.date) && styles.selectedDay,
                  isToday(item.date) && styles.todayDay,
                ]}
                onPress={() => handleSelectDate(item.date)}
              >
                <Text style={[
                  styles.dayText,
                  !item.isCurrentMonth && styles.otherMonthDay,
                  isSelected(item.date) && styles.selectedDayText,
                  isToday(item.date) && styles.todayDayText,
                ]}>
                  {item.date.getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 按钮 */}
          <View style={styles.calendarButtons}>
            <TouchableOpacity style={styles.calendarButton} onPress={onClose}>
              <Text style={styles.calendarButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.calendarButton, styles.calendarConfirmButton]} 
              onPress={() => handleSelectDate(selectedDate)}
            >
              <Text style={[styles.calendarButtonText, styles.calendarConfirmText]}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// 房间状态枚举
type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'selected'

interface Room {
  id: string
  name: string
  type: string
  floor: number
}

interface DateCell {
  date: string
  status: RoomStatus
  price?: number
  guestName?: string
  guestPhone?: string
}

interface RoomCalendarData {
  room: Room
  dates: DateCell[]
}

// 生成日期数组
const generateDates = (startDate: Date, days: number): string[] => {
  const dates: string[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

// 生成示例房间数据
const generateRoomData = (): RoomCalendarData[] => {
  const today = new Date()
  const rooms: Room[] = [
    { id: 'A101', name: 'A101', type: '标准间', floor: 1 },
    { id: 'A102', name: 'A102', type: '标准间', floor: 1 },
    { id: 'A103', name: 'A103', type: '豪华间', floor: 1 },
    { id: 'B201', name: 'B201', type: '标准间', floor: 2 },
    { id: 'B202', name: 'B202', type: '豪华间', floor: 2 },
    { id: 'B203', name: 'B203', type: '套房', floor: 2 },
    { id: 'C301', name: 'C301', type: '标准间', floor: 3 },
    { id: 'C302', name: 'C302', type: '豪华间', floor: 3 },
    { id: 'C303', name: 'C303', type: '套房', floor: 3 },
    { id: 'C304', name: 'C304', type: '总统套房', floor: 3 },
  ]

  const statuses: RoomStatus[] = ['available', 'occupied', 'cleaning', 'maintenance']
  const guestNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
  const guestPhones = ['13812345678', '13987654321', '13611223344', '13755667788', '13898765432', '13577889900', '13466778899', '13699887766']

  return rooms.map(room => {
    const dates: DateCell[] = []
    
    // 生成30天的数据（今天前后15天）
    for (let i = -15; i < 15; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      
      // 随机生成状态，增加occupied的概率
      const randomNum = Math.random()
      let status: RoomStatus
      if (randomNum < 0.4) {
        status = 'available'
      } else if (randomNum < 0.7) {
        status = 'occupied'
      } else if (randomNum < 0.9) {
        status = 'cleaning'
      } else {
        status = 'maintenance'
      }
      
      const dateCell: DateCell = {
        date: dateStr,
        status,
        price: status === 'available' ? Math.floor(Math.random() * 200) + 200 : undefined,
        guestName: status === 'occupied' ? guestNames[Math.floor(Math.random() * guestNames.length)] : undefined,
        guestPhone: status === 'occupied' ? guestPhones[Math.floor(Math.random() * guestPhones.length)] : undefined,
      }
      
      dates.push(dateCell)
    }
    
    return { room, dates }
  })
}

const CELL_WIDTH = 60
const CELL_HEIGHT = 50
const ROOM_HEADER_WIDTH = 100

export default function CalendarScreen() {
  const router = useRouter()
  const [roomData, setRoomData] = useState<RoomCalendarData[]>(generateRoomData())
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [isInSelectionMode, setIsInSelectionMode] = useState(false) // 新增选择模式状态
  const [currentWeekStart, setCurrentWeekStart] = useState(0)
  const [roomEditModalVisible, setRoomEditModalVisible] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [roomFormData, setRoomFormData] = useState({
    name: '',
    type: '',
    floor: 1,
  })
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [selectedStartDate, setSelectedStartDate] = useState(new Date())
  const [calendarRange, setCalendarRange] = useState(30) // 改为30天（前后15天）
  const [pageOffset, setPageOffset] = useState(0) // 分页偏移量
  
  // 长按开始多选
  const [longPressStarted, setLongPressStarted] = useState(false)
  
  // 滚动引用
  const dateScrollViewRef = useRef<ScrollView>(null) 
  const statusScrollViewRef = useRef<ScrollView>(null)
  const roomsScrollViewRef = useRef<ScrollView>(null)
  const horizontalScrollViewRef = useRef<ScrollView>(null) // 新增用于水平滚动的引用
  
  // 滚动同步控制
  const isScrollingSyncing = useRef(false)
  
  // 滑动手势支持
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => longPressStarted,
      onMoveShouldSetPanResponder: () => longPressStarted,
      onPanResponderGrant: (evt) => {
        if (longPressStarted) {
          setIsSelecting(true)
          handleCellTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY)
        }
      },
      onPanResponderMove: (evt) => {
        if (isSelecting && longPressStarted) {
          handleCellTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY)
        }
      },
      onPanResponderRelease: () => {
        setIsSelecting(false)
        setLongPressStarted(false)
      },
    })
  ).current

  const handleCellTouch = (x: number, y: number) => {
    const roomIndex = Math.floor((y - 80) / CELL_HEIGHT) // 减去标题行高度
    const dateIndex = Math.floor((x - ROOM_HEADER_WIDTH) / CELL_WIDTH)
    
    if (roomIndex >= 0 && roomIndex < roomData.length && 
        dateIndex >= 0 && dateIndex < roomData[0].dates.length) {
      const cellKey = `${roomData[roomIndex].room.id}-${roomData[roomIndex].dates[dateIndex].date}`
      
      setSelectedCells(prev => {
        const newSet = new Set(prev)
        if (newSet.has(cellKey)) {
          newSet.delete(cellKey)
        } else {
          newSet.add(cellKey)
        }
        return newSet
      })
    }
  }

  const getStatusColor = (status: RoomStatus, isSelected: boolean): string => {
    if (isSelected) return '#3b82f6'
    
    switch (status) {
      case 'available': return '#10b981'
      case 'occupied': return '#ef4444'
      case 'cleaning': return '#f59e0b'
      case 'maintenance': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: RoomStatus): string => {
    switch (status) {
      case 'available': return '可预订'
      case 'occupied': return '已入住'
      case 'cleaning': return '清洁中'
      case 'maintenance': return '维修中'
      default: return ''
    }
  }

  const handleBatchOperation = () => {
    if (selectedCells.size === 0) {
      Alert.alert('提示', '请先选择房间和日期')
      return
    }

    Alert.alert(
      '批量操作',
      `已选择 ${selectedCells.size} 个房间日期`,
      [
        { text: '批量入住', onPress: () => handleBatchCheckIn() },
        { text: '设为维修', onPress: () => batchUpdateStatus('maintenance') },
        { text: '设为清洁', onPress: () => batchUpdateStatus('cleaning') },
        { text: '设为可订', onPress: () => batchUpdateStatus('available') },
        { text: '批量定价', onPress: () => Alert.alert('功能开发中', '批量定价功能即将上线') },
        { text: '取消', style: 'cancel' }
      ]
    )
  }

  const handleBatchCheckIn = () => {
    const availableCells = Array.from(selectedCells).filter(cellKey => {
      const [roomId, date] = cellKey.split('-')
      const roomItem = roomData.find(r => r.room.id === roomId)
      const dateCell = roomItem?.dates.find(d => d.date === date)
      return dateCell?.status === 'available'
    })

    if (availableCells.length === 0) {
      Alert.alert('提示', '选择的房间中没有可入住的房间')
      return
    }

    Alert.alert(
      '批量入住确认',
      `将为 ${availableCells.length} 个可用房间办理入住手续`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认入住',
          onPress: () => {
            // 模拟批量入住，随机分配客人信息
            const guestNames = ['李明', '王芳', '张伟', '刘敏', '陈强', '赵丽', '孙涛', '周静']
            const guestPhones = ['13811112222', '13822223333', '13833334444', '13844445555', '13855556666', '13866667777', '13877778888', '13888889999']
            
            setRoomData(prev => 
              prev.map(roomItem => ({
                ...roomItem,
                dates: roomItem.dates.map(dateCell => {
                  const cellKey = `${roomItem.room.id}-${dateCell.date}`
                  if (availableCells.includes(cellKey)) {
                    return {
                      ...dateCell,
                      status: 'occupied' as RoomStatus,
                      guestName: guestNames[Math.floor(Math.random() * guestNames.length)],
                      guestPhone: guestPhones[Math.floor(Math.random() * guestPhones.length)]
                    }
                  }
                  return dateCell
                })
              }))
            )
            
            clearSelection()
            Alert.alert('入住成功', `已为 ${availableCells.length} 个房间办理入住手续`)
          }
        }
      ]
    )
  }

  const batchUpdateStatus = (newStatus: RoomStatus) => {
    setRoomData(prev => 
      prev.map(roomItem => ({
        ...roomItem,
        dates: roomItem.dates.map(dateCell => {
          const cellKey = `${roomItem.room.id}-${dateCell.date}`
          if (selectedCells.has(cellKey)) {
            return { ...dateCell, status: newStatus }
          }
          return dateCell
        })
      }))
    )
    
    const selectedCount = selectedCells.size
    clearSelection() // 操作完成后清除选择
    Alert.alert('成功', `已更新 ${selectedCount} 个房间状态`)
  }

  const clearSelection = () => {
    setSelectedCells(new Set())
    setIsInSelectionMode(false) // 退出选择模式
  }

  const handleCellPress = (roomItem: RoomCalendarData, dateCell: DateCell) => {
    const cellKey = `${roomItem.room.id}-${dateCell.date}`
    
    if (isInSelectionMode) {
      // 在选择模式下，点击切换选中状态
      setSelectedCells(prev => {
        const newSet = new Set(prev)
        if (newSet.has(cellKey)) {
          newSet.delete(cellKey)
        } else {
          newSet.add(cellKey)
        }
        return newSet
      })
    } else {
      // 正常模式下的点击处理
      if (dateCell.status === 'available') {
        showRoomDetailModal(roomItem, dateCell)
      } else if (dateCell.status === 'occupied') {
        showGuestDetailModal(roomItem, dateCell)
      }
    }
  }

  const showRoomDetailModal = (roomItem: RoomCalendarData, dateCell: DateCell) => {
    Alert.alert(
      '房间详情',
      `房间：${roomItem.room.name} (${roomItem.room.type})\n楼层：${roomItem.room.floor}楼\n日期：${dateCell.date}\n价格：¥${dateCell.price}\n状态：可预订`,
      [
        {
          text: '快速预订',
          onPress: () => {
            Alert.alert(
              '预订确认',
              `确认预订 ${roomItem.room.name} 房间？\n日期：${dateCell.date}\n价格：¥${dateCell.price}`,
              [
                {
                  text: '确认预订',
                  onPress: () => {
                    // 模拟预订成功
                    setRoomData(prev => 
                      prev.map(item => 
                        item.room.id === roomItem.room.id
                          ? {
                              ...item,
                              dates: item.dates.map(cell => 
                                cell.date === dateCell.date
                                  ? { ...cell, status: 'occupied' as RoomStatus, guestName: '新客人' }
                                  : cell
                              )
                            }
                          : item
                      )
                    )
                    Alert.alert('预订成功', '房间预订已确认！')
                  }
                },
                { text: '取消', style: 'cancel' }
              ]
            )
          }
        },
        { text: '设置价格', onPress: () => Alert.alert('功能开发中', '价格设置功能即将上线') },
        { text: '取消', style: 'cancel' }
      ]
    )
  }

  const showGuestDetailModal = (roomItem: RoomCalendarData, dateCell: DateCell) => {
    if (dateCell.guestName && dateCell.guestPhone) {
      Alert.alert(
        '客人信息',
        `房间：${roomItem.room.name}\n客人：${dateCell.guestName}\n入住日期：${dateCell.date}`,
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '联系客人', 
            onPress: () => handleContactGuest(dateCell.guestPhone!, dateCell.guestName!)
          },
          { 
            text: '查看详情', 
            onPress: () => router.push(`/booking-details?id=${roomItem.room.id}-${dateCell.date}`)
          }
        ]
      )
    }
  }

  const handleContactGuest = async (phoneNumber: string, guestName: string) => {
    try {
      const { Linking } = require('expo-linking')
      const phoneUrl = `tel:${phoneNumber}`
      const supported = await Linking.canOpenURL(phoneUrl)
      
      if (supported) {
        Alert.alert(
          '拨打电话',
          `确定要联系客人 ${guestName} 吗？\n${phoneNumber}`,
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '拨打', 
              onPress: async () => {
                await Linking.openURL(phoneUrl)
              }
            }
          ]
        )
      } else {
        Alert.alert('错误', '设备不支持拨打电话功能')
      }
    } catch (error) {
      Alert.alert('错误', '拨打电话失败')
    }
  }

  const handleRoomEdit = (room: Room) => {
    setEditingRoom(room)
    setRoomFormData({
      name: room.name,
      type: room.type,
      floor: room.floor,
    })
    setRoomEditModalVisible(true)
  }

  const saveRoomEdit = () => {
    if (!roomFormData.name.trim() || !roomFormData.type.trim()) {
      Alert.alert('错误', '请填写完整的房间信息')
      return
    }

    if (editingRoom) {
      // 编辑现有房间
      setRoomData(prev => 
        prev.map(item => 
          item.room.id === editingRoom.id
            ? {
                ...item,
                room: {
                  ...editingRoom,
                  name: roomFormData.name,
                  type: roomFormData.type,
                  floor: roomFormData.floor,
                }
              }
            : item
        )
      )
    }

    setRoomEditModalVisible(false)
    setEditingRoom(null)
    Alert.alert('成功', '房间信息已更新')
  }

  const deleteRoom = () => {
    if (!editingRoom) return

    Alert.alert(
      '删除房间',
      `确定要删除房间 ${editingRoom.name} 吗？此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setRoomData(prev => prev.filter(item => item.room.id !== editingRoom.id))
            setRoomEditModalVisible(false)
            setEditingRoom(null)
            Alert.alert('已删除', '房间已成功删除')
          }
        }
      ]
    )
  }

  // 生成显示日期（当前日期前后15天）
  const generateDisplayDates = (centerDate: Date, offset: number = 0) => {
    const dates = []
    const startDate = new Date(centerDate)
    startDate.setDate(startDate.getDate() - 15 + (offset * 30)) // 前15天，加上分页偏移
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const displayDates = generateDisplayDates(selectedStartDate, pageOffset)

  const handleDateSelect = (date: Date) => {
    setSelectedStartDate(date)
    setPageOffset(0) // 重置分页
    
    // 重新生成房间数据
    const newDates = generateDisplayDates(date, 0)
    setRoomData(prev => 
      prev.map(roomItem => ({
        ...roomItem,
        dates: newDates.map(dateStr => {
          const existingDate = roomItem.dates.find(d => d.date === dateStr)
          return existingDate || {
            date: dateStr,
            status: 'available' as RoomStatus,
            price: Math.floor(Math.random() * 200) + 200,
          }
        })
      }))
    )
  }

  const handlePrevPage = () => {
    setPageOffset(prev => prev - 1)
    const newDates = generateDisplayDates(selectedStartDate, pageOffset - 1)
    setRoomData(prev => 
      prev.map(roomItem => ({
        ...roomItem,
        dates: newDates.map(dateStr => {
          const existingDate = roomItem.dates.find(d => d.date === dateStr)
          return existingDate || {
            date: dateStr,
            status: 'available' as RoomStatus,
            price: Math.floor(Math.random() * 200) + 200,
          }
        })
      }))
    )
  }

  const handleNextPage = () => {
    setPageOffset(prev => prev + 1)
    const newDates = generateDisplayDates(selectedStartDate, pageOffset + 1)
    setRoomData(prev => 
      prev.map(roomItem => ({
        ...roomItem,
        dates: newDates.map(dateStr => {
          const existingDate = roomItem.dates.find(d => d.date === dateStr)
          return existingDate || {
            date: dateStr,
            status: 'available' as RoomStatus,
            price: Math.floor(Math.random() * 200) + 200,
          }
        })
      }))
    )
  }

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr === today
  }

  const handleTodayPress = () => {
    const today = new Date()
    setSelectedStartDate(today)
    setPageOffset(0)
    handleDateSelect(today)
    
    // 滚动到今日列居中
    setTimeout(() => {
      const todayIndex = displayDates.findIndex(date => isToday(date))
      if (todayIndex !== -1) {
        const scrollX = todayIndex * CELL_WIDTH - (width - ROOM_HEADER_WIDTH) / 2 + CELL_WIDTH / 2
        const targetScrollX = Math.max(0, scrollX)
        
        // 防止滚动冲突
        isScrollingSyncing.current = true
        
        // 同步所有水平滚动视图
        if (dateScrollViewRef.current) {
          dateScrollViewRef.current.scrollTo({
            x: targetScrollX,
            animated: true
          })
        }
        if (horizontalScrollViewRef.current) {
          horizontalScrollViewRef.current.scrollTo({
            x: targetScrollX,
            animated: true
          })
        }
        
        // 延迟重置同步标志
        setTimeout(() => {
          isScrollingSyncing.current = false
        }, 800)
      }
    }, 300)
  }

  const handleCellLongPress = (roomItem: RoomCalendarData, dateCell: DateCell) => {
    if (!isInSelectionMode) {
      // 进入选择模式
      setIsInSelectionMode(true)
      const cellKey = `${roomItem.room.id}-${dateCell.date}`
      setSelectedCells(new Set([cellKey]))
    }
  }

  return (
    <View style={styles.container}>
      {/* 顶部操作栏 */}
      <View style={styles.header}>
        <Text style={styles.title}>房态日历</Text>
        <View style={styles.headerActions}>
                     {selectedCells.size > 0 ? (
             <>
               <TouchableOpacity 
                 style={styles.actionBtn}
                 onPress={clearSelection}
               >
                 <Text style={styles.actionBtnText}>清除选择</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.actionBtn, styles.primaryBtn]}
                 onPress={handleBatchOperation}
               >
                 <Text style={[styles.actionBtnText, { color: 'white' }]}>
                   批量操作({selectedCells.size})
                 </Text>
               </TouchableOpacity>
             </>
           ) : (
             <TouchableOpacity 
               style={[styles.actionBtn, styles.primaryBtn]}
               onPress={() => router.push('/rooms')}
             >
               <Text style={[styles.actionBtnText, { color: 'white' }]}>
                 房间管理
               </Text>
             </TouchableOpacity>
           )}
        </View>
      </View>

      {/* 状态说明 */}
      <View style={styles.legend}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendScrollView}>
          <View style={styles.legendContent}>
            {[
              { status: 'available', label: '可预订', color: '#10b981' },
              { status: 'occupied', label: '已入住', color: '#ef4444' },
              { status: 'cleaning', label: '清洁中', color: '#f59e0b' },
              { status: 'maintenance', label: '维修中', color: '#8b5cf6' },
              { status: 'selected', label: '已选择', color: '#3b82f6' },
            ].map(item => (
              <View key={item.status} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        
        {/* 日期选择器 */}
        <TouchableOpacity 
          style={styles.dateSelector}
          onPress={() => setDatePickerVisible(true)}
        >
          <Text style={styles.dateSelectorText}>📅</Text>
        </TouchableOpacity>
      </View>

      {/* 分页控制 */}
      <View style={styles.paginationContainer}>
        <TouchableOpacity style={styles.paginationButton} onPress={handlePrevPage}>
          <Text style={styles.paginationText}>‹ 前30天</Text>
        </TouchableOpacity>
        
        <View style={styles.centerControls}>
          <TouchableOpacity 
            style={styles.todayButton} 
            onPress={handleTodayPress}
          >
            <Text style={styles.todayButtonText}>今日</Text>
          </TouchableOpacity>
          <Text style={styles.currentPeriod}>
            {displayDates[0]} 至 {displayDates[displayDates.length - 1]}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.paginationButton} onPress={handleNextPage}>
          <Text style={styles.paginationText}>后30天 ›</Text>
        </TouchableOpacity>
      </View>

      {/* 日历网格 - 固定行列头布局 */}
      <View style={styles.calendarContainer}>
        {/* 顶部固定区域 */}
        <View style={styles.fixedHeader}>
          {/* 左上角固定单元格 */}
          <View style={styles.cornerCell}>
            <TouchableOpacity onPress={() => router.push('/rooms')}>
              <Text style={styles.cornerText}>房间管理</Text>
            </TouchableOpacity>
          </View>
          
          {/* 日期头部滚动区域 */}
          <View style={styles.dateHeaderContainer}>
            <ScrollView
              ref={dateScrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(event) => {
                // 防止循环滚动
                if (isScrollingSyncing.current) return
                
                // 同步主体表格的水平滚动
                const scrollX = event.nativeEvent.contentOffset.x
                isScrollingSyncing.current = true
                
                if (statusScrollViewRef.current) {
                  statusScrollViewRef.current.scrollTo({ x: scrollX, animated: false })
                }
                
                // 短暂延迟后重置同步标志
                setTimeout(() => {
                  isScrollingSyncing.current = false
                }, 50)
              }}
            >
              <View style={styles.dateHeaderContent}>
                {displayDates.map((date, index) => {
                  const dateObj = new Date(date)
                  const month = dateObj.getMonth() + 1
                  const day = dateObj.getDate()
                  const weekDay = ['日', '一', '二', '三', '四', '五', '六'][dateObj.getDay()]
                  const isTodayDate = isToday(date)
                  
                  return (
                    <View 
                      key={date} 
                      style={[
                        styles.dateCell, 
                        { width: CELL_WIDTH },
                        isTodayDate && styles.todayDateCell
                      ]}
                    >
                      <Text style={[styles.dateText, isTodayDate && styles.todayDateText]}>
                        {month}/{day}
                      </Text>
                      <Text style={[styles.weekDayText, isTodayDate && styles.todayDateText]}>
                        {weekDay}
                      </Text>
                      {isTodayDate && <Text style={styles.todayLabel}>今日</Text>}
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* 主体区域 */}
        <View style={styles.mainContent}>
          {/* 左侧房间列固定区域 */}
          <View style={styles.roomsColumnContainer}>
            <ScrollView
              ref={roomsScrollViewRef}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(event) => {
                // 防止循环滚动
                if (isScrollingSyncing.current) return
                
                // 同步主体表格的垂直滚动
                const scrollY = event.nativeEvent.contentOffset.y
                isScrollingSyncing.current = true
                
                if (statusScrollViewRef.current) {
                  statusScrollViewRef.current.scrollTo({ y: scrollY, animated: false })
                }
                
                // 短暂延迟后重置同步标志
                setTimeout(() => {
                  isScrollingSyncing.current = false
                }, 50)
              }}
            >
              <View style={styles.roomsColumnContent}>
                {roomData.map((roomItem, roomIndex) => (
                  <TouchableOpacity 
                    key={roomItem.room.id}
                    style={styles.roomHeaderFixed}
                    onPress={() => handleRoomEdit(roomItem.room)}
                  >
                    <Text style={styles.roomName}>{roomItem.room.name}</Text>
                    <Text style={styles.roomType}>{roomItem.room.type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          
          {/* 右侧状态表格滚动区域 */}
          <View style={styles.statusTableContainer}>
            {/* 外层垂直滚动 */}
            <ScrollView
              ref={statusScrollViewRef}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(event) => {
                // 防止循环滚动
                if (isScrollingSyncing.current) return
                
                // 同步房间列的垂直滚动
                const scrollY = event.nativeEvent.contentOffset.y
                isScrollingSyncing.current = true
                
                if (roomsScrollViewRef.current) {
                  roomsScrollViewRef.current.scrollTo({ y: scrollY, animated: false })
                }
                
                // 短暂延迟后重置同步标志
                setTimeout(() => {
                  isScrollingSyncing.current = false
                }, 50)
              }}
            >
              {/* 内层水平滚动 */}
              <ScrollView
                ref={horizontalScrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(event) => {
                  // 防止循环滚动
                  if (isScrollingSyncing.current) return
                  
                  // 同步日期头部的水平滚动
                  const scrollX = event.nativeEvent.contentOffset.x
                  isScrollingSyncing.current = true
                  
                  if (dateScrollViewRef.current) {
                    dateScrollViewRef.current.scrollTo({ x: scrollX, animated: false })
                  }
                  
                  // 短暂延迟后重置同步标志
                  setTimeout(() => {
                    isScrollingSyncing.current = false
                  }, 50)
                }}
              >
                <View style={styles.statusTableContent}>
                  {roomData.map((roomItem, roomIndex) => (
                    <View key={roomItem.room.id} style={styles.statusRow}>
                      {roomItem.dates.map((dateCell, dateIndex) => {
                        const cellKey = `${roomItem.room.id}-${dateCell.date}`
                        const isSelected = selectedCells.has(cellKey)
                        const isTodayCell = isToday(dateCell.date)
                        
                        return (
                          <TouchableOpacity
                            key={dateCell.date}
                            style={[
                              styles.statusCell,
                              { 
                                width: CELL_WIDTH,
                                backgroundColor: getStatusColor(dateCell.status, isSelected),
                                opacity: isSelected ? 0.8 : 1,
                              },
                              isTodayCell && styles.todayStatusCell,
                              isInSelectionMode && styles.selectionModeCell
                            ]}
                            onPress={() => handleCellPress(roomItem, dateCell)}
                            onLongPress={() => handleCellLongPress(roomItem, dateCell)}
                          >
                            {dateCell.status === 'available' && dateCell.price && (
                              <Text style={styles.priceText}>¥{dateCell.price}</Text>
                            )}
                            {dateCell.status === 'occupied' && dateCell.guestName && (
                              <Text style={styles.guestText}>{dateCell.guestName}</Text>
                            )}
                            {isSelected && (
                              <View style={styles.selectedOverlay}>
                                <Text style={styles.selectedText}>✓</Text>
                              </View>
                            )}
                            {isTodayCell && (
                              <View style={styles.todayIndicator} />
                            )}
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </ScrollView>
          </View>
        </View>
      </View>

       {/* 房间编辑弹窗 */}
       <Modal
         visible={roomEditModalVisible}
         transparent
         animationType="fade"
         onRequestClose={() => setRoomEditModalVisible(false)}
       >
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <Text style={styles.modalTitle}>
               {editingRoom ? '编辑房间' : '新增房间'}
             </Text>
             
             <TextInput
               style={styles.modalInput}
               value={roomFormData.name}
               onChangeText={(text) => setRoomFormData(prev => ({ ...prev, name: text }))}
               placeholder="房间号码（如：A101）"
             />
             
             <TextInput
               style={styles.modalInput}
               value={roomFormData.type}
               onChangeText={(text) => setRoomFormData(prev => ({ ...prev, type: text }))}
               placeholder="房间类型（如：标准间、豪华间）"
             />
             
             <TextInput
               style={styles.modalInput}
               value={roomFormData.floor.toString()}
               onChangeText={(text) => setRoomFormData(prev => ({ ...prev, floor: parseInt(text) || 1 }))}
               placeholder="楼层"
               keyboardType="numeric"
             />

             <View style={styles.modalButtons}>
               {editingRoom && (
                 <TouchableOpacity
                   style={[styles.modalButton, styles.deleteButton]}
                   onPress={deleteRoom}
                 >
                   <Text style={styles.deleteButtonText}>删除</Text>
                 </TouchableOpacity>
               )}
               <TouchableOpacity
                 style={[styles.modalButton, styles.cancelButton]}
                 onPress={() => setRoomEditModalVisible(false)}
               >
                 <Text style={styles.cancelButtonText}>取消</Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={[styles.modalButton, styles.confirmButton]}
                 onPress={saveRoomEdit}
               >
                 <Text style={styles.confirmButtonText}>保存</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* 日历选择器 */}
       <CalendarPicker
         visible={datePickerVisible}
         onClose={() => setDatePickerVisible(false)}
         onSelectDate={handleDateSelect}
         selectedDate={selectedStartDate}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  legend: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendScrollView: {
    flex: 1,
  },
  legendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  dateSelector: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  dateSelectorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 20,
    paddingVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  calendarContainer: {
    flex: 1,
    marginTop: -10,
  },
  calendarScrollView: {
    flex: 1,
  },
  calendarTable: {
    flexDirection: 'column',
  },
  dateHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  roomDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  fixedHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dateHeaderContainer: {
    flex: 1,
  },
  dateHeaderContent: {
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  roomsColumnContainer: {
    width: ROOM_HEADER_WIDTH,
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  roomsColumnContent: {
    flexDirection: 'column',
  },
  roomHeaderFixed: {
    width: ROOM_HEADER_WIDTH,
    height: CELL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statusTableContainer: {
    flex: 1,
  },
  statusTableContent: {
    flexDirection: 'column',
  },
  dateHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cornerCell: {
    width: ROOM_HEADER_WIDTH,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    backgroundColor: '#e2e8f0',
  },
  cornerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  dateScrollView: {
    flex: 1,
  },
  dateCell: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  weekDayText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  roomsContainer: {
    flex: 1,
  },
  roomsScrollView: {
    flex: 1,
  },
  roomRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  roomHeader: {
    width: ROOM_HEADER_WIDTH,
    height: CELL_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  roomName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  roomType: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  statusCell: {
    height: CELL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    position: 'relative',
  },
  priceText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  guestText: {
    fontSize: 9,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: 'white',
    fontSize: 16,
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
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  confirmButton: {
    backgroundColor: '#6366f1',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  // 日历选择器样式
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.7,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarNavButton: {
    fontSize: 24,
    color: '#6366f1',
    fontWeight: 'bold',
    padding: 8,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 5,
  },
  selectedDay: {
    backgroundColor: '#6366f1',
  },
  todayDay: {
    backgroundColor: '#fbbf24',
  },
  dayText: {
    fontSize: 16,
    color: '#1e293b',
  },
  otherMonthDay: {
    color: '#cbd5e1',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  todayDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  calendarButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 12,
  },
  calendarButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  calendarConfirmButton: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  calendarButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  calendarConfirmText: {
    color: 'white',
  },
  // 分页控制样式
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  centerControls: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#6366f1',
  },
  todayButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  paginationText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  currentPeriod: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  // 重新设计的日历容器
  calendarContent: {
    flexDirection: 'row',
    flex: 1,
  },
  fixedRoomColumn: {
    width: ROOM_HEADER_WIDTH,
    backgroundColor: '#f8fafc',
    borderRightWidth: 2,
    borderRightColor: '#e2e8f0',
  },
  roomListScrollView: {
    flex: 1,
  },
  roomListContent: {
    flexGrow: 1,
  },
  scrollableArea: {
    flex: 1,
  },
  dateHeaderScrollable: {
    flexDirection: 'row',
    height: 60,
  },
  dateCellScrollable: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    position: 'relative',
  },
  todayDateCell: {
    backgroundColor: '#fef3c7',
  },
  todayDateText: {
    color: '#d97706',
    fontWeight: 'bold',
  },
  todayLabel: {
    fontSize: 8,
    color: '#d97706',
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 2,
  },
  roomRowScrollable: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  todayStatusCell: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  todayIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  statusScrollContainer: {
    flex: 1,
  },
  statusScrollContent: {
    flexGrow: 1,
  },
  statusGridContainer: {
    // 确保状态网格没有额外空白
  },
  statusRow: {
    flexDirection: 'row',
  },
  selectionModeCell: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
  },
}) 