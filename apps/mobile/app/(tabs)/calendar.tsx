import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { DateWheelPicker } from '../components/DateWheelPicker'
import { useAppSelector } from '../store/hooks'

const { width } = Dimensions.get('window')
const CELL_WIDTH = 100
const TODAY_CELL_WIDTH = 80

type RoomType = '大床房' | '双人房' | '豪华房' | '套房'

interface Room {
  id: string
  name: string
  type: RoomType
}

interface DateData {
  date: Date
  dateStr: string
  rooms: {
    [roomId: string]: {
      status: 'available' | 'occupied' | 'dirty' | 'closed'
      guestName?: string
      guestPhone?: string
      channel?: string
    }
  }
}

// 生成日期数据（从指定日期开始）
const generateDates = (startDate: Date, days: number = 30): DateData[] => {
  const dates: DateData[] = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    // 生成示例预订数据
    const rooms: DateData['rooms'] = {}
    
    dates.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      rooms
    })
  }
  
  return dates
}

// 格式化日期为 MM-DD
const formatDate = (date: Date): string => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}-${String(day).padStart(2, '0')}`
}

// 获取星期几
const getWeekDay = (date: Date): string => {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekDays[date.getDay()]
}

// 计算剩余房间数
const getAvailableRooms = (dateData: DateData, rooms: Room[]): number => {
  let available = 0
  rooms.forEach(room => {
    const roomStatus = dateData.rooms[room.id]
    if (!roomStatus || roomStatus.status === 'available') {
      available++
    }
  })
  return available
}

export default function CalendarScreen() {
  const router = useRouter()
  const dateHeaderScrollRef = useRef<ScrollView>(null)
  const contentScrollRef = useRef<ScrollView>(null)
  const isScrollingProgrammatically = useRef(false)
  const lastScrollX = useRef(0)
  const scrollSyncTimeout = useRef<any>(null)
  
  // 从Redux获取数据
  const reduxRooms = useAppSelector(state => state.calendar.rooms)
  const reduxReservations = useAppSelector(state => state.calendar.reservations)
  const reduxRoomStatuses = useAppSelector(state => state.calendar.roomStatuses)
  
  // 按房型分组房间
  const roomsByType = useMemo(() => {
    return reduxRooms.reduce((acc, room) => {
      if (!acc[room.type]) {
        acc[room.type] = []
      }
      acc[room.type].push(room)
      return acc
    }, {} as { [key in RoomType]: Room[] })
  }, [reduxRooms])
  
  // 所有房间列表
  const allRooms = reduxRooms
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 从7天前开始，显示37天（过去7天+今天+未来29天）
  const initialStartDate = new Date(today)
  initialStartDate.setDate(today.getDate() - 7)
  
  const [startDate, setStartDate] = useState<Date>(initialStartDate)
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  
  // 根据Redux数据生成日期数据
  const dates = useMemo(() => {
    console.log('📅 [Calendar] 生成日期数据...')
    console.log('📅 [Calendar] Redux数据:', {
      rooms: reduxRooms.length,
      reservations: reduxReservations.length,
      roomStatuses: reduxRoomStatuses.length
    })
    console.log('📅 [Calendar] 预订详情:', reduxReservations)
    console.log('📅 [Calendar] 房态详情:', reduxRoomStatuses)
    
    const generatedDates: DateData[] = []
    
    for (let i = 0; i < 37; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      // 使用本地时间格式化日期，避免时区问题
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      // 为每个房间检查房态
      const rooms: DateData['rooms'] = {}
      
      reduxRooms.forEach(room => {
        // 检查是否有房态记录（关房、脏房等）
        const roomStatus = reduxRoomStatuses.find(
          rs => rs.roomId === room.id && rs.date === dateStr
        )
        
        if (roomStatus) {
          // 如果有房态记录，使用该状态
          if (roomStatus.status === 'occupied' && roomStatus.reservationId) {
            // 查找预订信息
            const reservation = reduxReservations.find(r => r.id === roomStatus.reservationId)
            if (reservation) {
              console.log(`✅ [Calendar] 找到预订: ${dateStr} - 房间${room.id} - ${reservation.guestName}`)
              rooms[room.id] = {
                status: 'occupied',
                guestName: reservation.guestName,
                guestPhone: reservation.guestPhone,
                channel: reservation.channel,
              }
            } else {
              console.log(`⚠️ [Calendar] 未找到预订信息: reservationId=${roomStatus.reservationId}`)
            }
          } else {
            rooms[room.id] = {
              status: roomStatus.status,
            }
          }
        } else {
          // 默认为空房
          rooms[room.id] = {
            status: 'available',
          }
        }
      })
      
      generatedDates.push({
        date,
        dateStr,
        rooms,
      })
    }
    
    console.log('📅 [Calendar] 生成完成，共', generatedDates.length, '天')
    return generatedDates
  }, [startDate, reduxRooms, reduxReservations, reduxRoomStatuses])
  
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [searchText, setSearchText] = useState('')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<Set<RoomType>>(new Set())
  // 初始滚动位置应该在今日（第7天的位置）
  const initialScrollX = 7 * CELL_WIDTH - (width - TODAY_CELL_WIDTH) / 2 + CELL_WIDTH / 2
  
  const [scrollX, setScrollX] = useState(Math.max(0, initialScrollX))
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  // 搜索过滤房间
  const getFilteredRoomTypes = (): RoomType[] => {
    let types: RoomType[] = selectedRoomTypes.size > 0
      ? Array.from(selectedRoomTypes)
      : Object.keys(roomsByType) as RoomType[]
    
    if (!searchText.trim()) {
      return types
    }
    
    const search = searchText.toLowerCase().trim()
    
    // 过滤房型，只保留包含匹配房间的房型
    return types.filter(roomType => {
      return roomsByType[roomType].some(room => {
        // 匹配房间号
        if (room.name.toLowerCase().includes(search)) return true
        if (room.id.toLowerCase().includes(search)) return true
        
        // 匹配预订信息（客人姓名、手机号）
        const hasMatchingReservation = reduxReservations.some(reservation => {
          if (reservation.roomId !== room.id) return false
          return reservation.guestName.includes(search) || 
                 reservation.guestPhone.includes(search)
        })
        
        return hasMatchingReservation
      })
    })
  }

  // 获取过滤后的房间
  const getFilteredRooms = (roomType: RoomType): Room[] => {
    if (!searchText.trim()) {
      return roomsByType[roomType]
    }
    
    const search = searchText.toLowerCase().trim()
    
    return roomsByType[roomType].filter(room => {
      // 匹配房间号
      if (room.name.toLowerCase().includes(search)) return true
      if (room.id.toLowerCase().includes(search)) return true
      
      // 匹配预订信息
      const hasMatchingReservation = reduxReservations.some(reservation => {
        if (reservation.roomId !== room.id) return false
        return reservation.guestName.includes(search) || 
               reservation.guestPhone.includes(search)
      })
      
      return hasMatchingReservation
    })
  }

  // 滚动到居中位置
  const scrollToCenter = (index: number) => {
    if (dateHeaderScrollRef.current && contentScrollRef.current) {
      const scrollX = index * CELL_WIDTH - (width - TODAY_CELL_WIDTH) / 2 + CELL_WIDTH / 2
      const targetScrollX = Math.max(0, scrollX)
      
      isScrollingProgrammatically.current = true
      
      setTimeout(() => {
        dateHeaderScrollRef.current?.scrollTo({ x: targetScrollX, animated: true })
        contentScrollRef.current?.scrollTo({ x: targetScrollX, animated: true })
        lastScrollX.current = targetScrollX
        
        // 重置标志
        setTimeout(() => {
          isScrollingProgrammatically.current = false
        }, 500)
      }, 100)
    }
  }

  // 加载前7天数据
  const loadPreviousDays = () => {
    const newStartDate = new Date(startDate)
    newStartDate.setDate(startDate.getDate() - 7)
    setStartDate(newStartDate)
    
    // 保持当前视图位置，滚动到之前的位置+7个单元格
    isScrollingProgrammatically.current = true
    
    setTimeout(() => {
      const newScrollX = scrollX + 7 * CELL_WIDTH
      dateHeaderScrollRef.current?.scrollTo({ x: newScrollX, animated: false })
      contentScrollRef.current?.scrollTo({ x: newScrollX, animated: false })
      lastScrollX.current = newScrollX
      setScrollX(newScrollX)
      
      // 重置标志
      setTimeout(() => {
        isScrollingProgrammatically.current = false
      }, 100)
    }, 50)
  }

  // 加载后7天数据
  const loadNextDays = () => {
    // startDate不变，只是显示更多天数（这里保持37天）
    // 如果需要真的加载更多，可以增加天数参数
  }

  // 处理日期选择
  const handleDateSelect = (dateStr: string) => {
    const newDate = new Date(dateStr)
    newDate.setHours(0, 0, 0, 0)
    setSelectedDate(newDate)
    
    // 从选中日期的7天前开始生成37天数据
    const newStartDate = new Date(newDate)
    newStartDate.setDate(newDate.getDate() - 7)
    setStartDate(newStartDate)
    
    // 滚动到选中的日期（第7天位置）
    setTimeout(() => {
      scrollToCenter(7)
    }, 100)
  }

  // 回到今日
  const handleBackToToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setSelectedDate(today)
    
    // 重置为从7天前开始的37天
    const newStartDate = new Date(today)
    newStartDate.setDate(today.getDate() - 7)
    setStartDate(newStartDate)
    
    // 滚动到今日位置（第7天）
    isScrollingProgrammatically.current = true
    
    setTimeout(() => {
      const todayIndex = 7
      const targetScrollX = todayIndex * CELL_WIDTH - (width - TODAY_CELL_WIDTH) / 2 + CELL_WIDTH / 2
      const scrollToX = Math.max(0, targetScrollX)
      
      dateHeaderScrollRef.current?.scrollTo({ x: scrollToX, animated: true })
      contentScrollRef.current?.scrollTo({ x: scrollToX, animated: true })
      lastScrollX.current = scrollToX
      setScrollX(scrollToX)
      
      // 重置标志
      setTimeout(() => {
        isScrollingProgrammatically.current = false
      }, 500)
    }, 100)
  }

  // 处理单元格点击
  const handleCellPress = (roomId: string, dateIndex: number, roomData?: any) => {
    console.log('👆 [Calendar] 点击单元格:', { roomId, dateIndex, roomData })
    
    // 如果有预订，直接跳转到订单详情页
    if (roomData && roomData.status === 'occupied') {
      const dateData = dates[dateIndex]
      
      // 查找完整的预订信息
      const roomStatus = reduxRoomStatuses.find(
        rs => rs.roomId === roomId && rs.date === dateData.dateStr
      )
      
      const reservation = roomStatus?.reservationId 
        ? reduxReservations.find(r => r.id === roomStatus.reservationId)
        : null
      
      console.log('📝 [Calendar] 查找到的预订:', reservation)
      
      if (reservation) {
        router.push({
          pathname: '/order-details',
          params: {
            orderId: reservation.orderId,
            guestName: reservation.guestName,
            guestPhone: reservation.guestPhone,
            channel: reservation.channel,
            checkInDate: reservation.checkInDate,
            checkOutDate: reservation.checkOutDate,
            roomType: reservation.roomType,
            roomPrice: reservation.roomPrice.toString(),
            guestCount: '1',
            nights: reservation.nights.toString(),
            totalAmount: reservation.totalAmount.toString(),
            paidAmount: (reservation.paidAmount || 0).toString(),
            remainingAmount: (reservation.totalAmount - (reservation.paidAmount || 0)).toString(),
          }
        })
        return
      }
    }
    
    // 没有预订，进入选择状态
    const cellKey = `${roomId}|${dateIndex}`  // 使用 | 分隔符避免与房间ID中的 - 冲突
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

  // 处理创建订单
  const handleCreateOrder = () => {
    if (selectedCells.size === 0) {
      router.push('/create-order')
      return
    }

    // 解析选中的房间和日期
    const selectedRoomsData: Array<{
      roomId: string
      roomName: string
      dateIndex: number
      dateStr: string
    }> = []

    selectedCells.forEach(cellKey => {
      const [roomId, dateIndexStr] = cellKey.split('|')  // 使用 | 分隔符
      const dateIndex = parseInt(dateIndexStr)
      const room = allRooms.find(r => r.id === roomId)
      const dateData = dates[dateIndex]
      
      console.log('🔍 [Calendar] 解析cellKey:', { 
        cellKey, 
        roomId, 
        dateIndex, 
        dateStr: dateData?.dateStr,
        foundRoom: !!room, 
        foundDate: !!dateData,
        startDate: startDate.toISOString().split('T')[0]
      })
      
      if (room && dateData) {
        selectedRoomsData.push({
          roomId: room.id,
          roomName: `${room.type}-${room.name}`,
          dateIndex,
          dateStr: dateData.dateStr
        })
      }
    })

    // 按房间分组，找出每个房间的入住和离店日期
    const roomsMap = new Map<string, {
      roomId: string
      roomName: string
      dates: string[]
    }>()

    selectedRoomsData.forEach(item => {
      if (!roomsMap.has(item.roomId)) {
        roomsMap.set(item.roomId, {
          roomId: item.roomId,
          roomName: item.roomName,
          dates: []
        })
      }
      roomsMap.get(item.roomId)!.dates.push(item.dateStr)
    })

    // 转换为数组并排序日期
    const roomsInfo = Array.from(roomsMap.values()).map(room => {
      const sortedDates = room.dates.sort()
      return {
        roomId: room.roomId,
        roomName: room.roomName,
        checkInDate: sortedDates[0],
        checkOutDate: new Date(new Date(sortedDates[sortedDates.length - 1]).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    })

    console.log('📝 [Calendar] 选中的房间信息:', roomsInfo)

    // 跳转到创建订单页面，传递多房间信息
    router.push({
      pathname: '/create-order',
      params: {
        roomsData: JSON.stringify(roomsInfo)
      }
    })
    
    setSelectedCells(new Set())
  }

  // 处理筛选按钮
  const handleFilterPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['取消', '大床房', '双人房', '豪华房', '套房', '全部房型'],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            setSelectedRoomTypes(new Set(['大床房']))
          } else if (buttonIndex === 2) {
            setSelectedRoomTypes(new Set(['双人房']))
          } else if (buttonIndex === 3) {
            setSelectedRoomTypes(new Set(['豪华房']))
          } else if (buttonIndex === 4) {
            setSelectedRoomTypes(new Set(['套房']))
          } else if (buttonIndex === 5) {
            setSelectedRoomTypes(new Set())
          }
        }
        )
      } else {
      setFilterModalVisible(true)
    }
  }

  // 清除选择
  const handleClearSelection = () => {
    setSelectedCells(new Set())
  }

  // 判断单元格是否被选中
  const isCellSelected = (roomId: string, dateIndex: number) => {
    return selectedCells.has(`${roomId}|${dateIndex}`)  // 使用 | 分隔符
  }

  // 判断是否是今天
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  // 格式化选中的日期显示
  const formatSelectedDate = (date: Date): string => {
    return `${date.getMonth() + 1}月${String(date.getDate()).padStart(2, '0')}日`
  }

  // 判断是否应该显示"回到今日"按钮
  // 根据滚动距离判断：滚动超过5个单元格宽度就显示
  const shouldShowTodayButton = (): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 找到今日在dates数组中的索引
    const todayIndex = dates.findIndex(d => {
      const date = new Date(d.date)
      date.setHours(0, 0, 0, 0)
      return date.getTime() === today.getTime()
    })
    
    if (todayIndex === -1) {
      // 如果dates中没有今日，说明滚动很远了，显示按钮
      return true
    }
    
    // 计算今日应该在的位置
    const todayCenterX = todayIndex * CELL_WIDTH - (width - TODAY_CELL_WIDTH) / 2 + CELL_WIDTH / 2
    const todayScrollX = Math.max(0, todayCenterX)
    
    // 如果当前滚动位置距离今日位置超过5个单元格宽度，显示按钮
    const distanceFromToday = Math.abs(scrollX - todayScrollX)
    return distanceFromToday > CELL_WIDTH * 5
  }

  // 初始化：滚动到今日位置
  useEffect(() => {
    const timer = setTimeout(() => {
      const todayIndex = 7 // 今日在数组中的索引（从0开始的第7天）
      const targetScrollX = todayIndex * CELL_WIDTH - (width - TODAY_CELL_WIDTH) / 2 + CELL_WIDTH / 2
      const scrollToX = Math.max(0, targetScrollX)
      
      isScrollingProgrammatically.current = true
      dateHeaderScrollRef.current?.scrollTo({ x: scrollToX, animated: false })
      contentScrollRef.current?.scrollTo({ x: scrollToX, animated: false })
      lastScrollX.current = scrollToX
      
        setTimeout(() => {
        isScrollingProgrammatically.current = false
      }, 100)
    }, 100)
    
    return () => {
      clearTimeout(timer)
      if (scrollSyncTimeout.current) {
        clearTimeout(scrollSyncTimeout.current)
      }
    }
  }, [])

  const displayRoomTypes = getFilteredRoomTypes()

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="房间号/姓名/手机号/订单号"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearIcon}>✕</Text>
               </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.refreshBtn}>
          <Text style={styles.refreshIcon}>🔄</Text>
               </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={handleFilterPress}>
          <Text style={styles.filterIcon}>☰</Text>
             </TouchableOpacity>
      </View>

      {/* 表格容器 */}
      <View style={styles.tableContainer}>
        {/* 固定的左上角日期选择器 */}
        <View style={styles.fixedTopLeft}>
        <TouchableOpacity 
            style={styles.todayCell}
          onPress={() => setDatePickerVisible(true)}
        >
            <Text style={styles.todayLabel}>{formatSelectedDate(selectedDate)}</Text>
        </TouchableOpacity>
      </View>

        {/* 固定的日期行（横向可滚动） */}
        <View style={styles.fixedDateRow}>
            <ScrollView
            ref={dateHeaderScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(event) => {
                if (isScrollingProgrammatically.current) return
                
                const scrollXValue = event.nativeEvent.contentOffset.x
                
                // 防止重复同步：只有当滚动距离超过1px才同步
                if (Math.abs(scrollXValue - lastScrollX.current) < 1) return
                
                lastScrollX.current = scrollXValue
                setScrollX(scrollXValue)
                
                // 判断是否在边界（真正到达尽头时才显示）
                const maxScrollX = dates.length * CELL_WIDTH - (width - TODAY_CELL_WIDTH)
                setShowLeftArrow(scrollXValue <= 5)
                setShowRightArrow(scrollXValue >= maxScrollX - 5)
                
                // 同步到内容区域
                isScrollingProgrammatically.current = true
                contentScrollRef.current?.scrollTo({ x: scrollXValue, animated: false })
                
                // 清除之前的定时器
                if (scrollSyncTimeout.current) {
                  clearTimeout(scrollSyncTimeout.current)
                }
                
                // 短暂延迟后重置标志
                scrollSyncTimeout.current = setTimeout(() => {
                  isScrollingProgrammatically.current = false
                }, 50)
              }}
            >
            <View style={styles.dateRowContent}>
              {dates.map((dateData, index) => {
                const isCurrentDay = isToday(dateData.date)
                const availableCount = getAvailableRooms(dateData, allRooms)
                  
                  return (
                    <View 
                    key={index} 
                      style={[
                        styles.dateCell, 
                      isCurrentDay && styles.todayDateCell
                      ]}
                    >
                    <Text style={[styles.dateText, isCurrentDay && styles.todayDateText]}>
                      {formatDate(dateData.date)} {getWeekDay(dateData.date)}
                      </Text>
                    <Text style={[styles.availableText, isCurrentDay && styles.todayAvailableText]}>
                      剩{availableCount}间
                      </Text>
                    </View>
                  )
                })}
              </View>
            </ScrollView>
        </View>

        {/* 整体可滚动区域（上下滚动） */}
        <ScrollView style={styles.mainScrollView}>
          <View style={styles.tableContent}>
            {/* 左侧房间列 */}
            <View style={styles.leftColumn}>
              {displayRoomTypes.map(roomType => {
                const filteredRooms = getFilteredRooms(roomType)
                if (filteredRooms.length === 0) return null
                
                return (
                  <View key={roomType}>
                    {/* 房型标签 */}
                    <View style={styles.roomTypeHeader}>
                      <Text style={styles.roomTypeLabel}>{roomType}</Text>
                    </View>
                    
                    {/* 该房型下的所有房间 */}
                    {filteredRooms.map(room => (
                      <View key={room.id} style={styles.roomCell}>
                        <Text style={styles.roomName}>{room.name}</Text>
                      </View>
                ))}
              </View>
                )
              })}
          </View>
          
            {/* 右侧房态网格（横向可滚动） */}
            <ScrollView
              ref={contentScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(event) => {
                if (isScrollingProgrammatically.current) return
                
                const scrollXValue = event.nativeEvent.contentOffset.x
                
                // 防止重复同步：只有当滚动距离超过1px才同步
                if (Math.abs(scrollXValue - lastScrollX.current) < 1) return
                
                lastScrollX.current = scrollXValue
                setScrollX(scrollXValue)
                
                // 判断是否在边界（真正到达尽头时才显示）
                const maxScrollX = dates.length * CELL_WIDTH - (width - TODAY_CELL_WIDTH)
                setShowLeftArrow(scrollXValue <= 5)
                setShowRightArrow(scrollXValue >= maxScrollX - 5)
                
                // 同步到日期头部
                isScrollingProgrammatically.current = true
                dateHeaderScrollRef.current?.scrollTo({ x: scrollXValue, animated: false })
                
                // 清除之前的定时器
                if (scrollSyncTimeout.current) {
                  clearTimeout(scrollSyncTimeout.current)
                }
                
                // 短暂延迟后重置标志
                scrollSyncTimeout.current = setTimeout(() => {
                  isScrollingProgrammatically.current = false
                  }, 50)
                }}
              >
              <View style={styles.rightColumn}>
                {displayRoomTypes.map(roomType => {
                  const filteredRooms = getFilteredRooms(roomType)
                  if (filteredRooms.length === 0) return null
                  
                  return (
                    <View key={roomType}>
                      {/* 房型标签行（占位） */}
                      <View style={styles.roomTypePlaceholder} />
                      
                      {/* 该房型下的所有房间状态 */}
                      {filteredRooms.map(room => (
                        <View key={room.id} style={styles.roomStatusRow}>
                          {dates.map((dateData, dateIndex) => {
                            const isSelected = isCellSelected(room.id, dateIndex)
                            // 从日期数据中获取房间状态
                            const roomData = dateData.rooms[room.id]
                            const isOccupied = roomData?.status === 'occupied'
                            const isCurrentDay = isToday(dateData.date)
                        
                        return (
                          <TouchableOpacity
                                key={dateIndex}
                            style={[
                              styles.statusCell,
                                  isSelected && styles.selectedCell,
                                  isOccupied && styles.occupiedCell,
                                  isCurrentDay && styles.todayStatusCell,
                                ]}
                                onPress={() => handleCellPress(room.id, dateIndex, roomData)}
                              >
                            {isOccupied && roomData && (
                              <View style={styles.reservationInfo}>
                                <Text style={styles.reservationGuestName} numberOfLines={1}>
                                  {roomData.guestName}
                                </Text>
                                <Text style={styles.reservationChannel} numberOfLines={1}>
                                  {roomData.channel}
                                </Text>
                              </View>
                            )}
                            {isSelected && (
                                  <View style={styles.checkmarkContainer}>
                                    <Text style={styles.checkmark}>✓</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  ))}
                    </View>
                  )
                })}
                </View>
              </ScrollView>
          </View>
            </ScrollView>
      </View>

      {/* 左侧加载更多按钮 */}
      {showLeftArrow && (
        <TouchableOpacity 
          style={styles.leftArrow}
          onPress={loadPreviousDays}
        >
          <Text style={styles.arrowText}>←</Text>
        </TouchableOpacity>
      )}

      {/* 右侧加载更多按钮 */}
      {showRightArrow && (
        <TouchableOpacity 
          style={styles.rightArrow}
          onPress={loadNextDays}
        >
          <Text style={styles.arrowText}>→</Text>
        </TouchableOpacity>
      )}

      {/* 回到今日按钮 */}
      {selectedCells.size === 0 && shouldShowTodayButton() && (
                 <TouchableOpacity
          style={styles.todayButton}
          onPress={handleBackToToday}
                 >
          <Text style={styles.todayButtonText}>回到今日</Text>
                 </TouchableOpacity>
               )}

      {/* 底部操作栏 */}
      {selectedCells.size > 0 && (
        <View style={styles.bottomActions}>
          <View style={styles.actionButtonsRow}>
               <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClearSelection}
            >
              <Text style={styles.actionButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              Alert.alert('转脏房', '转脏房功能开发中')
            }}>
              <Text style={styles.actionButtonText}>转脏房</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              // 获取第一个选中的房间
              const firstCell = Array.from(selectedCells)[0]
              if (firstCell) {
                const [roomId] = firstCell.split('-')
                router.push({
                  pathname: '/close-room',
                  params: { roomId, roomNumber: roomId }
                })
                setSelectedCells(new Set())
              }
            }}>
              <Text style={styles.actionButtonText}>关房</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              handleCreateOrder()
            }}>
              <Text style={styles.actionButtonText}>入住</Text>
               </TouchableOpacity>
               <TouchableOpacity
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={() => handleCreateOrder()}
               >
              <Text style={[styles.actionButtonText, styles.primaryActionText]}>新增</Text>
               </TouchableOpacity>
             </View>
           </View>
      )}

      {/* 悬浮操作按钮 */}
      {selectedCells.size === 0 && (
        <TouchableOpacity 
          style={styles.fabButton}
          onPress={() => router.push('/create-order')}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* 日期选择器 */}
      <DateWheelPicker
         visible={datePickerVisible}
         onClose={() => setDatePickerVisible(false)}
        onSelect={handleDateSelect}
        initialDate={selectedDate.toISOString().split('T')[0]}
        title="请选择日期"
      />

      {/* Android 筛选弹窗 */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.filterSheet}>
            <Text style={styles.filterTitle}>筛选</Text>
            
            {['大床房', '双人房', '豪华房', '套房'].map(type => (
                 <TouchableOpacity
                key={type}
                style={styles.filterOption}
                onPress={() => {
                  setSelectedRoomTypes(new Set([type as RoomType]))
                  setFilterModalVisible(false)
                }}
              >
                <Text style={styles.filterOptionText}>{type}</Text>
                 </TouchableOpacity>
            ))}
            
               <TouchableOpacity
              style={styles.filterOption}
              onPress={() => {
                setSelectedRoomTypes(new Set())
                setFilterModalVisible(false)
              }}
            >
              <Text style={styles.filterOptionText}>全部房型</Text>
               </TouchableOpacity>
            
               <TouchableOpacity
              style={styles.filterCancelButton}
              onPress={() => setFilterModalVisible(false)}
               >
              <Text style={styles.filterCancelText}>取消</Text>
               </TouchableOpacity>
             </View>
        </TouchableOpacity>
       </Modal>
     </View>
   )
 }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  clearIcon: {
    fontSize: 16,
    color: '#999',
    paddingHorizontal: 4,
  },
  refreshBtn: {
    padding: 8,
  },
  refreshIcon: {
    fontSize: 20,
  },
  filterBtn: {
    padding: 8,
  },
  filterIcon: {
    fontSize: 20,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  fixedTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 3,
    backgroundColor: 'white',
  },
  todayCell: {
    width: TODAY_CELL_WIDTH,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
    borderBottomWidth: 1,
    borderBottomColor: '#d0d0d0',
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  fixedDateRow: {
    position: 'absolute',
    top: 0,
    left: TODAY_CELL_WIDTH,
    right: 0,
    height: 60,
    zIndex: 2,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#d0d0d0',
  },
  dateRowContent: {
    flexDirection: 'row',
  },
  dateCell: {
    width: CELL_WIDTH,
    height: 60,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  todayDateCell: {
    backgroundColor: '#e3f2fd',
  },
  dateText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  todayDateText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  availableText: {
    fontSize: 11,
    color: '#666',
  },
  todayAvailableText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  mainScrollView: {
    flex: 1,
    marginTop: 60,
  },
  tableContent: {
    flexDirection: 'row',
  },
  leftColumn: {
    width: TODAY_CELL_WIDTH,
    backgroundColor: 'white',
  },
  roomTypeHeader: {
    height: 32,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
    borderBottomWidth: 1,
    borderBottomColor: '#d0d0d0',
  },
  roomTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  roomCell: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  roomName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  rightColumn: {
    backgroundColor: 'white',
  },
  roomTypePlaceholder: {
    height: 32,
    backgroundColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#d0d0d0',
  },
  roomStatusRow: {
    flexDirection: 'row',
    height: 60,
  },
  statusCell: {
    width: CELL_WIDTH,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  selectedCell: {
    backgroundColor: '#c8e3ff',
  },
  occupiedCell: {
    backgroundColor: '#ffe0b2',
  },
  todayStatusCell: {
    borderLeftWidth: 2,
    borderLeftColor: '#1976d2',
  },
  reservationInfo: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  reservationGuestName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  reservationChannel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  checkmark: {
    fontSize: 16,
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  todayButton: {
    position: 'absolute',
    bottom: 30, // 降低位置，更靠近底部
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  todayButtonText: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '600',
  },
  bottomActions: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  primaryActionButton: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  primaryActionText: {
    color: 'white',
  },
  leftArrow: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rightArrow: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  arrowText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 30, // 降低位置，更靠近底部
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 32,
    color: 'white',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  filterCancelButton: {
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  filterCancelText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
})
