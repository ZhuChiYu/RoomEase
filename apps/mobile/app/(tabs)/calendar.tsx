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
  ActivityIndicator,
  RefreshControl,
  PixelRatio,
  Animated,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { FontSizes, Spacings, ComponentSizes } from '../utils/responsive'
import { useRouter, useFocusEffect } from 'expo-router'
import { DateWheelPicker } from '../components/DateWheelPicker'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { FEATURE_FLAGS } from '../config/environment'
import { dataService } from '../services'
import { setRooms, setReservations, setRoomStatuses } from '../store/calendarSlice'
import { useAuth } from '../contexts/AuthContext'

const { width } = Dimensions.get('window')
// 根据字体缩放动态调整单元格宽度
const fontScale = PixelRatio.getFontScale()
const CELL_WIDTH = Math.max(110, 95 * Math.min(fontScale, 1.3)) // 日期单元格宽度，减小以显示更多
const ROOM_CELL_WIDTH = Math.max(75, 65 + (fontScale - 1) * 25) // 房间列宽度：基础75，更窄
const CELL_HEIGHT = Math.max(65, 60 + (fontScale - 1) * 20) // 单元格高度动态调整

// 为订单生成颜色（基于订单ID生成一致的颜色）
const generateOrderColor = (reservationId: string): string => {
  // 使用订单ID生成哈希值
  let hash = 0
  for (let i = 0; i < reservationId.length; i++) {
    hash = reservationId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // 预定义的柔和颜色方案（加深版）
  const colors = [
    '#FFD1D1', // 红色系
    '#D1E7FF', // 蓝色系
    '#D1FFD1', // 绿色系
    '#FFE8D1', // 橙色系
    '#E8D1FF', // 紫色系
    '#FFD1E8', // 粉色系
    '#D1F5FF', // 青色系
    '#FFF4D1', // 黄色系
    '#E0D1FF', // 淡紫系
    '#D1FFE0', // 淡绿系
  ]
  
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// 为订单生成左侧标记颜色（更鲜艳）
const generateOrderBorderColor = (reservationId: string): string => {
  let hash = 0
  for (let i = 0; i < reservationId.length; i++) {
    hash = reservationId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const colors = [
    '#FF5252', // 红（加深）
    '#26C6DA', // 青（加深）
    '#42A5F5', // 蓝（加深）
    '#FF8A65', // 橙（加深）
    '#BA68C8', // 紫（加深）
    '#66BB6A', // 绿（加深）
    '#FFEE58', // 黄（加深）
    '#AB47BC', // 淡紫（加深）
    '#5C6BC0', // 靛蓝（加深）
    '#FF7043', // 深橙（加深）
  ]
  
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

type RoomType = string

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
      source?: string // 兼容后端source字段
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
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAuth()
  const dateHeaderScrollRef = useRef<ScrollView>(null)
  const contentScrollRef = useRef<ScrollView>(null)
  const isScrollingProgrammatically = useRef(false)
  const lastScrollX = useRef(0)
  const lastSyncTime = useRef(0) // 记录上次同步时间，避免高频触发
  const scrollSyncTimeout = useRef<any>(null)
  const hasMountedRef = useRef(false)
  const isLoadingData = useRef(false)
  const lastDataLoadTime = useRef<number>(0) // 记录上次数据加载时间
  
  // 从Redux获取数据
  const reduxRooms = useAppSelector(state => state.calendar.rooms)
  const reduxReservations = useAppSelector(state => state.calendar.reservations)
  const reduxRoomStatuses = useAppSelector(state => state.calendar.roomStatuses)
  const reduxRoomTypes = useAppSelector(state => state.calendar.roomTypes)
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // 空状态引导动画 - 多层动画效果
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const slideUpAnim = useRef(new Animated.Value(50)).current
  const iconBounceAnim = useRef(new Animated.Value(0)).current
  const buttonScaleAnim = useRef(new Animated.Value(0.8)).current
  
  // 空状态动画效果 - 分层入场动画
  useEffect(() => {
    if (reduxRooms.length === 0 && !isLoading) {
      // 重置动画
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.8)
      slideUpAnim.setValue(50)
      iconBounceAnim.setValue(0)
      buttonScaleAnim.setValue(0.8)
      
      // 启动分层入场动画
      Animated.sequence([
        // 第1步：整体淡入 (0-400ms)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // 第2步：内容上滑和缩放 (400-900ms)
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(slideUpAnim, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // 第3步：图标弹跳 (900-1200ms)
        Animated.spring(iconBounceAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        // 第4步：按钮弹出 (1200-1500ms)
        Animated.spring(buttonScaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [reduxRooms.length, isLoading])
  
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
    
    // 安全处理 Redux 数据（确保它们都是数组）
    const safeRooms = Array.isArray(reduxRooms) ? reduxRooms : []
    const safeReservations = Array.isArray(reduxReservations) ? reduxReservations : []
    const safeRoomStatuses = Array.isArray(reduxRoomStatuses) ? reduxRoomStatuses : []
    
    console.log('📅 [Calendar] Redux数据:', {
      rooms: safeRooms.length,
      reservations: safeReservations.length,
      roomStatuses: safeRoomStatuses.length
    })
    
    if (safeRooms.length > 0) {
      console.log('📅 [Calendar] 房间列表:', safeRooms.map(r => ({ id: r.id, name: r.name, type: r.type })))
    }
    
    if (safeReservations.length > 0) {
      console.log('📅 [Calendar] 预订详情:', safeReservations.map(r => ({ 
        id: r.id, 
        roomId: r.roomId, 
        guestName: r.guestName,
        checkInDate: r.checkInDate,
        checkOutDate: r.checkOutDate
      })))
    }
    
    if (safeRoomStatuses.length > 0) {
      console.log('📅 [Calendar] 房态详情:', safeRoomStatuses.map(rs => ({
        roomId: rs.roomId,
        date: rs.date,
        status: rs.status,
        reservationId: rs.reservationId
      })))
    }
    
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
      
      safeRooms.forEach(room => {
        // 检查是否有房态记录（关房、脏房等）
        const roomStatus = safeRoomStatuses.find(
          rs => rs.roomId === room.id && rs.date === dateStr
        )
        
        if (roomStatus) {
          // 如果有房态记录，使用该状态
          // reserved 或 occupied 都表示有预订
          if ((roomStatus.status === 'occupied' || roomStatus.status === 'reserved') && roomStatus.reservationId) {
            // 查找预订信息
            const reservation = reduxReservations.find(r => r.id === roomStatus.reservationId)
            if (reservation) {
              const channelValue = reservation.channel || (reservation as any).source || '直订'
              console.log(`📝 [Calendar] 预订渠道信息 - reservationId: ${roomStatus.reservationId}, channel: ${reservation.channel}, source: ${(reservation as any).source}, 最终显示: ${channelValue}`)
              
              rooms[room.id] = {
                status: 'occupied', // 统一显示为occupied
                guestName: reservation.guestName,
                guestPhone: reservation.guestPhone,
                channel: channelValue,
                source: (reservation as any).source, // 保存source字段
              }
            } else {
              console.warn(`⚠️ [Calendar] 未找到预订: date=${dateStr}, roomId=${room.id}, reservationId=${roomStatus.reservationId}`)
              console.warn(`⚠️ [Calendar] 可用预订IDs:`, reduxReservations.map(r => r.id))
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
    
    // 统计有预订的房间数
    const occupiedCount = generatedDates.reduce((count, dateData) => {
      return count + Object.values(dateData.rooms).filter(r => r.status === 'occupied').length
    }, 0)
    console.log('📅 [Calendar] 总预订房态数:', occupiedCount)
    
    return generatedDates
  }, [startDate, reduxRooms, reduxReservations, reduxRoomStatuses])
  
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [searchText, setSearchText] = useState('')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<Set<RoomType>>(new Set())
  // 初始滚动位置应该在今日（第7天的位置）
  const initialScrollX = 7 * CELL_WIDTH - (width - ROOM_CELL_WIDTH) / 2 + CELL_WIDTH / 2
  
  const [scrollX, setScrollX] = useState(Math.max(0, initialScrollX))
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  // 搜索过滤房间
  const getFilteredRoomTypes = (): RoomType[] => {
    let types: RoomType[] = selectedRoomTypes.size > 0
      ? Array.from(selectedRoomTypes)
      : Object.keys(roomsByType) as RoomType[]
    
    // 安全检查：只保留有房间的房型
    types = types.filter(roomType => {
      const rooms = roomsByType[roomType]
      return rooms && Array.isArray(rooms) && rooms.length > 0
    })
    
    if (!searchText.trim()) {
      return types
    }
    
    const search = searchText.toLowerCase().trim()
    
    // 过滤房型，只保留包含匹配房间的房型
    return types.filter(roomType => {
      const rooms = roomsByType[roomType]
      if (!rooms || !Array.isArray(rooms)) return false
      
      return rooms.some(room => {
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
    // 安全检查：确保房型存在且有房间
    const rooms = roomsByType[roomType]
    if (!rooms || !Array.isArray(rooms)) {
      return []
    }
    
    if (!searchText.trim()) {
      return rooms
    }
    
    const search = searchText.toLowerCase().trim()
    
    return rooms.filter(room => {
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
      const scrollX = index * CELL_WIDTH - (width - ROOM_CELL_WIDTH) / 2 + CELL_WIDTH / 2
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
    const newStartDate = new Date(startDate)
    newStartDate.setDate(startDate.getDate() + 7)
    setStartDate(newStartDate)
    
    // 保持当前视图位置，滚动到之前的位置-7个单元格
    isScrollingProgrammatically.current = true
    
    setTimeout(() => {
      const newScrollX = Math.max(0, scrollX - 7 * CELL_WIDTH)
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

  // 从API加载数据
  const loadDataFromAPI = React.useCallback(async (showLoading = true, clearCache = false) => {
    // 检查认证状态
    if (!isAuthenticated) {
      console.log('📅 [Calendar] 未登录，跳过数据加载')
      return
    }
    
    try {
      if (showLoading) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      
      // 如果需要清除缓存 - 必须在加载数据前完成
      if (clearCache) {
        console.log('📅 [Calendar] 清除缓存...')
        await dataService.cache.clearAll()
        console.log('📅 [Calendar] 缓存清除完成')
        // 等待一小段时间确保缓存清除生效
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      console.log('📅 [Calendar] 开始从API加载数据...')
      console.log('📅 [Calendar] 当前startDate:', startDate.toISOString().split('T')[0])
      
      // 计算日期范围（从startDate到37天后）
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 37)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      console.log('📅 [Calendar] 加载日期范围:', { startDateStr, endDateStr })
      
      // 并行加载房间、预订和房态数据
      const [rooms, reservations, roomStatuses] = await Promise.all([
        dataService.rooms.getAll(),
        dataService.reservations.getAll({
          startDate: startDateStr,
          endDate: endDateStr,
        }),
        dataService.roomStatus.getByDateRange(startDateStr, endDateStr)
      ])
      
      console.log('📅 [Calendar] ========== API返回数据详情 ==========')
      console.log('📅 [Calendar] 房间数据:', rooms.length, '个')
      rooms.forEach(room => {
        console.log('  - 房间:', { id: room.id, name: room.name, type: room.type })
      })
      
      console.log('📅 [Calendar] 预订数据:', reservations.length, '个')
      reservations.forEach(reservation => {
        console.log('  - 预订:', {
          id: reservation.id,
          roomId: reservation.roomId,
          roomNumber: reservation.roomNumber,
          guestName: reservation.guestName,
          checkIn: reservation.checkInDate,
          checkOut: reservation.checkOutDate,
          status: reservation.status
        })
      })
      
      // 处理房态数据（可能为 undefined 或空数组）
      const safeRoomStatuses = Array.isArray(roomStatuses) ? roomStatuses : []
      console.log('📅 [Calendar] 房态数据:', safeRoomStatuses.length, '条')
      const roomStatusGroups = safeRoomStatuses.reduce((acc, rs) => {
        if (!acc[rs.roomId]) acc[rs.roomId] = []
        acc[rs.roomId].push(rs)
        return acc
      }, {} as Record<string, typeof safeRoomStatuses>)
      
      Object.entries(roomStatusGroups).forEach(([roomId, statuses]) => {
        console.log(`  - 房间${roomId}:`, statuses.length, '天房态')
        statuses.slice(0, 3).forEach(s => {
          console.log(`    ${s.date}: ${s.status}${s.reservationId ? ` (预订:${s.reservationId})` : ''}`)
        })
        if (statuses.length > 3) {
          console.log(`    ...还有${statuses.length - 3}天`)
        }
      })
      console.log('📅 [Calendar] ========================================')
      
      // 更新Redux状态
      dispatch(setRooms(rooms))
      dispatch(setReservations(reservations))
      dispatch(setRoomStatuses(safeRoomStatuses))
      
      console.log('✅ [Calendar] 数据加载完成，已更新到Redux')
    } catch (error: any) {
      console.error('❌ [Calendar] 加载数据失败:', error)
      Alert.alert('错误', error.message || '加载数据失败')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [startDate, dispatch, isAuthenticated])
  
  // 刷新数据（强制清除缓存）
  const handleRefresh = async () => {
    console.log('🔄 [Calendar] 用户触发刷新，强制清除缓存')
    // 先清除缓存并等待完成
    await dataService.cache.clearAll()
    console.log('🔄 [Calendar] 缓存清除完成，开始加载数据')
    // 再加载数据（clearCache=true会再次清除，确保彻底）
    await loadDataFromAPI(false, true)
  }
  
  // 页面获得焦点时刷新数据（简化版 - 直接从服务器获取）
  useFocusEffect(
    React.useCallback(() => {
      console.log('📅 [Calendar] 页面获得焦点')
      
      // 检查是否有强制刷新标记
      AsyncStorage.getItem('@force_reload_calendar').then(async timestamp => {
        if (timestamp) {
          console.log('🔄 [Calendar] 检测到强制刷新标记，立即从服务器加载最新数据')
          
          // 清除标记
          await AsyncStorage.removeItem('@force_reload_calendar')
          
          // 检查是否正在加载
          if (isLoadingData.current) {
            console.log('📅 [Calendar] 数据正在加载中，跳过本次请求')
            return
          }
          
          // 强制从服务器加载最新数据（先清除缓存）
          console.log('📅 [Calendar] 强制清除缓存')
          isLoadingData.current = true
          lastDataLoadTime.current = Date.now()
          
          // 先清除缓存并等待完成
          await dataService.cache.clearAll()
          console.log('🧹 [Calendar] 缓存清除完成')
          // 等待一小段时间确保缓存清除生效
          await new Promise(resolve => setTimeout(resolve, 100))
          console.log('📅 [Calendar] 开始加载数据')
          
          // 再加载数据
          loadDataFromAPI(false, false).finally(() => {
            isLoadingData.current = false
            console.log('📅 [Calendar] 数据加载完成')
          })
          
          return
        }
        
        // 没有强制刷新标记，正常的防重复加载逻辑
        // 检查是否正在加载
        if (isLoadingData.current) {
          console.log('📅 [Calendar] 数据正在加载中，跳过本次请求')
          return
        }
        
        // 检查距离上次加载是否太近（小于2秒）
        const timeSinceLastLoad = Date.now() - lastDataLoadTime.current
        if (timeSinceLastLoad < 2000 && lastDataLoadTime.current > 0) {
          console.log(`📅 [Calendar] 距离上次加载仅${Math.round(timeSinceLastLoad/1000)}秒，跳过本次刷新`)
          return
        }
        
        // 正常加载数据
        console.log('📅 [Calendar] 开始从服务器加载最新数据')
        isLoadingData.current = true
        lastDataLoadTime.current = Date.now()
        
        loadDataFromAPI(false, true).finally(() => {
          isLoadingData.current = false
          console.log('📅 [Calendar] 数据加载完成')
        })
      })
      
    }, [loadDataFromAPI])
  )

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
      const targetScrollX = todayIndex * CELL_WIDTH - (width - ROOM_CELL_WIDTH) / 2 + CELL_WIDTH / 2
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
      const safeRoomStatuses = reduxRoomStatuses || []
      const safeReservations = reduxReservations || []
      
      const roomStatus = safeRoomStatuses.find(
        rs => rs.roomId === roomId && rs.date === dateData.dateStr
      )
      
      const reservation = roomStatus?.reservationId 
        ? safeReservations.find(r => r.id === roomStatus.reservationId)
        : null
      
      console.log('📝 [Calendar] 查找到的预订:', reservation)
      
      if (reservation) {
        // 格式化日期为 YYYY-MM-DD
        const formatDate = (dateStr: string) => {
          try {
            return dateStr.split('T')[0]
          } catch {
            return dateStr
          }
        }
        
        // 计算nights
        const checkIn = new Date(reservation.checkInDate)
        const checkOut = new Date(reservation.checkOutDate)
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        
        router.push({
          pathname: '/order-details',
          params: {
            reservationId: reservation.id, // 传递预订ID
            orderId: reservation.orderId || '',
            guestName: reservation.guestName || '未知',
            guestPhone: reservation.guestPhone || '',
            channel: reservation.source || reservation.channel || '直订',
            checkInDate: formatDate(reservation.checkInDate),
            checkOutDate: formatDate(reservation.checkOutDate),
            roomType: reservation.room?.roomType || reservation.roomType || '未知房型',
            roomPrice: (reservation.roomPrice || reservation.roomRate || 0).toString(),
            guestCount: (reservation.guestCount || 1).toString(),
            nights: (reservation.nights || nights).toString(),
            totalAmount: (Number(reservation.totalAmount) || 0).toString(),
            paidAmount: (Number(reservation.paidAmount) || 0).toString(),
            remainingAmount: ((Number(reservation.totalAmount) || 0) - (Number(reservation.paidAmount) || 0)).toString(),
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

    // 转换为数组并处理日期连续性
    const roomsInfo: Array<{
      roomId: string
      roomName: string
      checkInDate: string
      checkOutDate: string
    }> = []

    Array.from(roomsMap.values()).forEach(room => {
      const sortedDates = room.dates.sort()
      
      // 检测日期是否连续，如果不连续则分成多个预订
      const dateGroups: string[][] = []
      let currentGroup: string[] = []
      
      sortedDates.forEach((dateStr, index) => {
        if (currentGroup.length === 0) {
          currentGroup.push(dateStr)
        } else {
          const lastDate = new Date(currentGroup[currentGroup.length - 1])
          const currentDate = new Date(dateStr)
          const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000))
          
          // 如果日期连续（相差1天），加入当前组；否则开始新组
          if (diffDays === 1) {
            currentGroup.push(dateStr)
          } else {
            dateGroups.push([...currentGroup])
            currentGroup = [dateStr]
          }
        }
        
        // 最后一个日期，保存当前组
        if (index === sortedDates.length - 1) {
          dateGroups.push([...currentGroup])
        }
      })
      
      // 为每个连续的日期组创建一个预订
      dateGroups.forEach(dateGroup => {
        roomsInfo.push({
          roomId: room.roomId,
          roomName: room.roomName,
          checkInDate: dateGroup[0],
          checkOutDate: new Date(new Date(dateGroup[dateGroup.length - 1]).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      })
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
      // 只显示有实际房间的房型
      const availableRoomTypes = Object.keys(roomsByType).filter(roomType => {
        const rooms = roomsByType[roomType]
        return rooms && Array.isArray(rooms) && rooms.length > 0
      })
      
      // 如果没有房间，直接跳转到房型设置
      if (availableRoomTypes.length === 0) {
        Alert.alert(
          '提示',
          '还没有房间，请先添加房型和房间',
          [
            { text: '取消', style: 'cancel' },
            { text: '去添加', onPress: () => router.push('/room-type-settings') }
          ]
        )
        return
      }
      
      // 动态生成选项：取消 + 实际有房间的房型 + 房型设置
      const options = ['取消', ...availableRoomTypes, '房型设置']
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            // 取消
            return
          } else if (buttonIndex === options.length - 1) {
            // 最后一个选项：房型设置
            router.push('/room-type-settings')
          } else {
            // 选择具体房型
            const selectedType = availableRoomTypes[buttonIndex - 1]
            setSelectedRoomTypes(new Set([selectedType]))
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
    const todayCenterX = todayIndex * CELL_WIDTH - (width - ROOM_CELL_WIDTH) / 2 + CELL_WIDTH / 2
    const todayScrollX = Math.max(0, todayCenterX)
    
    // 如果当前滚动位置距离今日位置超过5个单元格宽度，显示按钮
    const distanceFromToday = Math.abs(scrollX - todayScrollX)
    return distanceFromToday > CELL_WIDTH * 5
  }

  // 初始化：滚动到今日位置
  useEffect(() => {
    const timer = setTimeout(() => {
      const todayIndex = 7 // 今日在数组中的索引（从0开始的第7天）
      const targetScrollX = todayIndex * CELL_WIDTH - (width - ROOM_CELL_WIDTH) / 2 + CELL_WIDTH / 2
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
  
  // 检查是否没有房间（新账号空状态）
  const hasNoRooms = reduxRooms.length === 0 && !isLoading

  return (
    <View style={styles.container}>
      {/* 搜索栏 - 只在有房间时显示 */}
      {!hasNoRooms && (
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
        <TouchableOpacity 
          style={styles.refreshBtn}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#4a90e2" />
          ) : (
            <Text style={styles.refreshIcon}>🔄</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={handleFilterPress}>
          <Text style={styles.filterIcon}>☰</Text>
        </TouchableOpacity>
      </View>
      )}

      {/* 空状态时直接显示引导界面，不显示日历表格 */}
      {hasNoRooms ? (
        <View style={styles.emptyStateFullContainer}>
          <Animated.View style={[styles.emptyStateContent, {
            opacity: fadeAnim,
            transform: [
              { translateY: slideUpAnim },
              { scale: scaleAnim }
            ]
          }]}>
            {/* 图标区域 - 带弹跳动画 */}
            <Animated.View style={[styles.emptyStateIconContainer, {
              transform: [
                {
                  scale: iconBounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                },
                {
                  rotate: iconBounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['-5deg', '0deg']
                  })
                }
              ]
            }]}>
              <Text style={styles.emptyStateIcon}>🏨</Text>
            </Animated.View>
            
            <Text style={styles.emptyStateTitle}>欢迎使用客满云！</Text>
            <View style={styles.emptyStateBadge}>
              <Text style={styles.emptyStateBadgeText}>✨ 开始您的数字化管理之旅</Text>
            </View>
            <Text style={styles.emptyStateSubtitle}>
              只需三步，快速设置您的第一个房型
            </Text>
            
            {/* 步骤卡片 */}
            <View style={styles.emptyStateSteps}>
              {[
                { num: '1', text: '点击下方按钮', icon: '👇' },
                { num: '2', text: '添加房型（如：大床房）', icon: '🏠' },
                { num: '3', text: '添加房间号', icon: '🔢' }
              ].map((step, index) => (
                <Animated.View 
                  key={step.num}
                  style={[styles.stepCard, {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateX: slideUpAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, -20 * (index + 1)]
                        })
                      }
                    ]
                  }]}
                >
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{step.num}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepIcon}>{step.icon}</Text>
                    <Text style={styles.stepText}>{step.text}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
            
            {/* 按钮 - 带弹性动画 */}
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => router.push('/room-type-settings')}
                activeOpacity={0.8}
              >
                <View style={styles.buttonGradient}>
                  <Text style={styles.emptyStateButtonText}>开始设置房型</Text>
                  <Text style={styles.emptyStateButtonIcon}>→</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
            
            {/* 提示信息 */}
            <View style={styles.emptyStateHintContainer}>
              <Text style={styles.emptyStateHintIcon}>💡</Text>
              <Text style={styles.emptyStateHint}>
                支持创建多个房型，如大床房、标准间、豪华套房等
              </Text>
            </View>
          </Animated.View>
        </View>
      ) : (
        <>
          {/* 表格容器 - 只在有房间时显示 */}
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
              scrollEventThrottle={1}
              onScroll={(event) => {
                // 如果是程序化滚动，跳过
                if (isScrollingProgrammatically.current) return
                
                const scrollXValue = event.nativeEvent.contentOffset.x
                const now = Date.now()
                
                // 高频节流：10ms内只同步一次（100fps），更流畅
                if (now - lastSyncTime.current < 10) return
                
                // 防止微小抖动
                if (Math.abs(scrollXValue - lastScrollX.current) < 0.2) return
                
                lastSyncTime.current = now
                lastScrollX.current = scrollXValue
                setScrollX(scrollXValue)
                
                // 判断是否在边界
                const maxScrollX = dates.length * CELL_WIDTH - (width - ROOM_CELL_WIDTH)
                setShowLeftArrow(scrollXValue <= 5)
                setShowRightArrow(scrollXValue >= maxScrollX - 5)
                
                // 立即同步到内容区域
                contentScrollRef.current?.scrollTo({ x: scrollXValue, animated: false })
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
        <ScrollView 
          style={styles.mainScrollView}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#4a90e2"
              colors={['#4a90e2']}
            />
          }
        >
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
                        <Text style={styles.roomName} numberOfLines={2} ellipsizeMode="tail">{room.name}</Text>
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
              scrollEventThrottle={1}
              onScroll={(event) => {
                // 如果是程序化滚动，跳过
                if (isScrollingProgrammatically.current) return
                
                const scrollXValue = event.nativeEvent.contentOffset.x
                const now = Date.now()
                
                // 高频节流：10ms内只同步一次（100fps），更流畅
                if (now - lastSyncTime.current < 10) return
                
                // 防止微小抖动
                if (Math.abs(scrollXValue - lastScrollX.current) < 0.2) return
                
                lastSyncTime.current = now
                lastScrollX.current = scrollXValue
                setScrollX(scrollXValue)
                
                // 判断是否在边界
                const maxScrollX = dates.length * CELL_WIDTH - (width - ROOM_CELL_WIDTH)
                setShowLeftArrow(scrollXValue <= 5)
                setShowRightArrow(scrollXValue >= maxScrollX - 5)
                
                // 立即同步到日期头部
                dateHeaderScrollRef.current?.scrollTo({ x: scrollXValue, animated: false })
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
                      {filteredRooms.map(room => {
                        // 检测连续的订单，用于合并单元格显示
                        const reservationGroups: Array<{
                          startIndex: number
                          endIndex: number
                          reservationId: string
                          roomData: any
                        }> = []
                        
                        let currentGroup: any = null
                        
                        dates.forEach((dateData, dateIndex) => {
                          const roomData = dateData.rooms[room.id]
                          const roomStatus = reduxRoomStatuses.find(
                            rs => rs.roomId === room.id && rs.date === dateData.dateStr
                          )
                          
                          if (roomData?.status === 'occupied' && roomStatus?.reservationId) {
                            if (currentGroup && currentGroup.reservationId === roomStatus.reservationId) {
                              // 同一订单，扩展当前组
                              currentGroup.endIndex = dateIndex
                            } else {
                              // 新订单，创建新组
                              if (currentGroup) {
                                reservationGroups.push(currentGroup)
                              }
                              currentGroup = {
                                startIndex: dateIndex,
                                endIndex: dateIndex,
                                reservationId: roomStatus.reservationId,
                                roomData
                              }
                            }
                          } else {
                            // 非预订状态，保存当前组
                            if (currentGroup) {
                              reservationGroups.push(currentGroup)
                              currentGroup = null
                            }
                          }
                        })
                        
                        // 保存最后一个组
                        if (currentGroup) {
                          reservationGroups.push(currentGroup)
                        }
                        
                        return (
                        <View key={room.id} style={styles.roomStatusRow}>
                          {dates.map((dateData, dateIndex) => {
                            const isSelected = isCellSelected(room.id, dateIndex)
                            // 从日期数据中获取房间状态
                            const roomData = dateData.rooms[room.id]
                            const isOccupied = roomData?.status === 'occupied'
                            const isCurrentDay = isToday(dateData.date)
                            
                            // 查找当前单元格所属的订单组
                            const reservationGroup = reservationGroups.find(
                              g => dateIndex >= g.startIndex && dateIndex <= g.endIndex
                            )
                            
                            // 判断是否是订单的第一个单元格
                            const isFirstCell = reservationGroup && dateIndex === reservationGroup.startIndex
                            // 判断是否是订单的最后一个单元格
                            const isLastCell = reservationGroup && dateIndex === reservationGroup.endIndex
                            // 判断是否在订单中间
                            const isMiddleCell = reservationGroup && !isFirstCell && !isLastCell
                            
                            // 获取订单颜色
                            const orderColor = reservationGroup ? generateOrderColor(reservationGroup.reservationId) : undefined
                            const borderColor = reservationGroup ? generateOrderBorderColor(reservationGroup.reservationId) : undefined
                        
                        return (
                          <TouchableOpacity
                                key={dateIndex}
                            style={[
                              styles.statusCell,
                                  isSelected && styles.selectedCell,
                                  isOccupied && styles.occupiedCell,
                                  // 订单样式
                                  reservationGroup && {
                                    backgroundColor: orderColor,
                                    borderRightWidth: isLastCell ? 1 : 0, // 只在最后一个单元格显示右边框
                                    borderLeftWidth: isFirstCell ? 4 : 0, // 第一个单元格显示彩色左边框
                                    borderLeftColor: borderColor,
                                  },
                                  // 今日列样式（放在最后，确保边框显示）
                                  isCurrentDay && {
                                    // 空房保持白色背景，有预订的显示订单颜色
                                    backgroundColor: reservationGroup ? orderColor : 'white',
                                    borderLeftWidth: reservationGroup && !isFirstCell ? 3 : (isFirstCell ? 4 : 3),
                                    borderLeftColor: reservationGroup && isFirstCell ? borderColor : '#2196F3',
                                    borderRightWidth: 3,
                                    borderRightColor: '#2196F3',
                                    // 空房时添加淡淡的蓝色边框内阴影效果
                                    ...(!reservationGroup && {
                                      borderTopWidth: 0.5,
                                      borderTopColor: '#E3F2FD',
                                      borderBottomWidth: 0.5,
                                      borderBottomColor: '#E3F2FD',
                                    }),
                                    // 有预订时的阴影效果
                                    ...(reservationGroup && {
                                      shadowColor: '#2196F3',
                                      shadowOffset: { width: 0, height: 0 },
                                      shadowOpacity: 0.2,
                                      shadowRadius: 0,
                                      elevation: 0,
                                    }),
                                  },
                                ]}
                                onPress={() => handleCellPress(room.id, dateIndex, roomData)}
                              >
                            {/* 只在第一个单元格显示订单信息 */}
                            {isOccupied && roomData && isFirstCell && (
                              <View style={styles.reservationInfo}>
                                <Text style={styles.reservationGuestName} numberOfLines={1} ellipsizeMode="tail">
                                  {roomData.guestName || '未知'}
                                </Text>
                                <Text style={styles.reservationChannel} numberOfLines={1} ellipsizeMode="tail">
                                  {roomData.channel || roomData.source || '直订'}
                                </Text>
                                <Text style={styles.reservationPhone} numberOfLines={1} ellipsizeMode="tail">
                                  {roomData.guestPhone || ''}
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
                  )}
                      )}
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
          animationType="none"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          >
            <View style={styles.filterSheet}>
              <Text style={styles.filterTitle}>筛选</Text>
              
              {/* 只显示有实际房间的房型 */}
              {reduxRoomTypes
                .filter(roomType => {
                  const rooms = roomsByType[roomType.name]
                  return rooms && Array.isArray(rooms) && rooms.length > 0
                })
                .map(roomType => (
                  <TouchableOpacity
                    key={roomType.id}
                    style={styles.filterOption}
                    onPress={() => {
                      setSelectedRoomTypes(new Set([roomType.name]))
                      setFilterModalVisible(false)
                    }}
                  >
                    <Text style={styles.filterOptionText}>{roomType.name}</Text>
                  </TouchableOpacity>
                ))
              }
              
              {/* 如果没有房间，显示提示 */}
              {Object.keys(roomsByType).filter(roomType => {
                const rooms = roomsByType[roomType]
                return rooms && Array.isArray(rooms) && rooms.length > 0
              }).length === 0 && (
                <View style={styles.filterEmptyHint}>
                  <Text style={styles.filterEmptyText}>还没有房间，请先添加房型</Text>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => {
                  setFilterModalVisible(false)
                  router.push('/room-type-settings')
                }}
              >
                <Text style={styles.filterOptionText}>房型设置</Text>
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
        </>
      )}

      {/* 加载遮罩 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.loadingText}>加载中...</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacings.md,
    backgroundColor: 'white',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
  },
  searchIcon: {
    fontSize: FontSizes.medium,
    marginRight: Spacings.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.normal,
    color: '#333',
  },
  clearIcon: {
    fontSize: FontSizes.medium,
    color: '#999',
    paddingHorizontal: Spacings.xs,
  },
  refreshBtn: {
    padding: Spacings.sm,
  },
  refreshIcon: {
    fontSize: FontSizes.xlarge,
  },
  filterBtn: {
    padding: Spacings.sm,
  },
  filterIcon: {
    fontSize: FontSizes.xlarge,
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
    width: ROOM_CELL_WIDTH,
    height: CELL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
    borderBottomWidth: 1,
    borderBottomColor: '#d0d0d0',
  },
  todayLabel: {
    fontSize: FontSizes.tiny, // 使用tiny字体
    fontWeight: 'bold',
    color: 'white',
  },
  fixedDateRow: {
    position: 'absolute',
    top: 0,
    left: ROOM_CELL_WIDTH,
    right: 0,
    height: CELL_HEIGHT,
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
    height: CELL_HEIGHT,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  todayDateCell: {
    backgroundColor: '#E3F2FD', // 淡蓝色背景
    borderBottomWidth: 3,
    borderBottomColor: '#2196F3', // 更鲜艳的蓝色边框
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
    borderRightWidth: 3,
    borderRightColor: '#2196F3',
  },
  dateText: {
    fontSize: FontSizes.tiny, // 使用tiny字体，更紧凑
    color: '#333',
    fontWeight: '500',
    marginBottom: 2, // 减小间距
  },
  todayDateText: {
    color: '#1976D2', // 深蓝色文字
    fontWeight: 'bold',
    fontSize: FontSizes.small * 1.05, // 稍微放大一点
  },
  availableText: {
    fontSize: FontSizes.tiny * 0.9, // 更小的字体
    color: '#666',
  },
  todayAvailableText: {
    color: '#2196F3', // 鲜艳的蓝色
    fontWeight: 'bold',
    fontSize: FontSizes.tiny * 1.05, // 稍微放大
  },
  mainScrollView: {
    flex: 1,
    marginTop: CELL_HEIGHT,
  },
  tableContent: {
    flexDirection: 'row',
  },
  leftColumn: {
    width: ROOM_CELL_WIDTH,
    backgroundColor: 'white',
  },
  roomTypeHeader: {
    height: 32,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    paddingHorizontal: Spacings.sm,
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
    borderBottomWidth: 1,
    borderBottomColor: '#d0d0d0',
  },
  roomTypeLabel: {
    fontSize: FontSizes.small,
    fontWeight: '600',
    color: '#333',
  },
  roomCell: {
    height: CELL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
    paddingHorizontal: 1, // 进一步减小水平内边距
  },
  roomName: {
    fontSize: FontSizes.tiny * 0.9, // 使用更小的字体
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
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
    height: CELL_HEIGHT,
  },
  statusCell: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
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
    backgroundColor: '#ffe0b2', // 默认颜色，会被订单颜色覆盖
  },
  todayStatusCell: {
    backgroundColor: 'white', // 今日空房保持白色，清晰显示
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3', // 使用更亮的蓝色
    borderRightWidth: 3,
    borderRightColor: '#2196F3',
    borderTopWidth: 0.5,
    borderTopColor: '#E3F2FD',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E3F2FD',
  },
  reservationInfo: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 3, // 增加一点padding，因为有左边框
    paddingVertical: 1,
    justifyContent: 'center',
    gap: 0.5,
  },
  reservationGuestName: {
    fontSize: FontSizes.tiny * 0.95,
    fontWeight: '700', // 加粗客人姓名
    color: '#222',
    marginBottom: 0.5,
  },
  reservationChannel: {
    fontSize: FontSizes.tiny * 0.85,
    color: '#555',
    marginBottom: 0.5,
  },
  reservationPhone: {
    fontSize: FontSizes.tiny * 0.8,
    color: '#777',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  checkmark: {
    fontSize: FontSizes.medium,
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  todayButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: Math.max(20, Spacings.xxl), // 动态调整
    paddingVertical: Math.max(10, Spacings.sm * 1.2),
    minHeight: ComponentSizes.buttonHeightSmall, // 添加最小高度
    borderRadius: 20,
    justifyContent: 'center', // 确保文字居中
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  todayButtonText: {
    fontSize: FontSizes.normal,
    color: '#4a90e2',
    fontWeight: '600',
  },
  bottomActions: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.md,
    paddingBottom: Spacings.xxl,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Math.max(12, Spacings.md), // 确保按钮有足够高度
    minHeight: ComponentSizes.buttonHeightSmall, // 添加最小高度
    borderRadius: ComponentSizes.borderRadius,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center', // 确保文字垂直居中
    backgroundColor: 'white',
  },
  actionButtonText: {
    fontSize: FontSizes.small,
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
    minHeight: ComponentSizes.buttonHeightSmall,
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
    minHeight: ComponentSizes.buttonHeightSmall,
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
    fontSize: FontSizes.xxlarge,
    color: 'white',
    fontWeight: 'bold',
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: Math.max(56, 50 + (fontScale - 1) * 20), // 动态调整大小
    height: Math.max(56, 50 + (fontScale - 1) * 20),
    borderRadius: Math.max(28, 25 + (fontScale - 1) * 10),
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
    fontSize: FontSizes.huge * 0.8, // 动态字体大小
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
    paddingBottom: 40,
    minHeight: '60%',
    maxHeight: '75%',
  },
  filterTitle: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingVertical: Spacings.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterOption: {
    paddingVertical: Spacings.lg,
    paddingHorizontal: Spacings.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionText: {
    fontSize: FontSizes.medium,
    color: '#333',
  },
  filterCancelButton: {
    marginTop: Spacings.sm,
    paddingVertical: Spacings.lg,
    paddingHorizontal: Spacings.xl,
  },
  filterCancelText: {
    fontSize: FontSizes.medium,
    color: '#999',
    textAlign: 'center',
  },
  filterEmptyHint: {
    paddingVertical: Spacings.xxl,
    alignItems: 'center',
  },
  filterEmptyText: {
    fontSize: FontSizes.medium,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // 空状态样式 - 全新设计
  emptyStateFullContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: Spacings.xl,
    paddingVertical: Spacings.xxl,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  emptyStateIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacings.xl,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyStateIcon: {
    fontSize: 56,
  },
  emptyStateTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: Spacings.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyStateBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.xs,
    borderRadius: 20,
    marginBottom: Spacings.md,
  },
  emptyStateBadgeText: {
    fontSize: FontSizes.small,
    fontWeight: '600',
    color: '#6366f1',
  },
  emptyStateSubtitle: {
    fontSize: FontSizes.medium,
    color: '#6b7280',
    marginBottom: Spacings.xxl,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateSteps: {
    width: '100%',
    marginBottom: Spacings.xxl,
    paddingHorizontal: Spacings.sm,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: Spacings.lg,
    marginBottom: Spacings.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  stepNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacings.md,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 20,
    marginRight: Spacings.sm,
  },
  stepText: {
    fontSize: FontSizes.medium,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  emptyStateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: Spacings.lg,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    paddingHorizontal: 36,
  },
  emptyStateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginRight: Spacings.sm,
    letterSpacing: 0.5,
  },
  emptyStateButtonIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  emptyStateHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderRadius: 12,
    maxWidth: '90%',
  },
  emptyStateHintIcon: {
    fontSize: 18,
    marginRight: Spacings.sm,
  },
  emptyStateHint: {
    fontSize: FontSizes.small,
    color: '#92400e',
    lineHeight: 20,
    flex: 1,
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
    borderRadius: ComponentSizes.borderRadiusLarge,
    padding: Spacings.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: Spacings.md,
    fontSize: FontSizes.medium,
    color: '#333',
  },
})
