/**
 * 本地数据服务
 * 模拟API接口，使用本地存储管理所有数据
 * 未来切换到网络API时，只需替换此服务的实现
 */

import { storage, STORAGE_KEYS } from './storage'
import type { Room, Reservation, RoomStatusData, RoomType } from '../store/types'

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

// 生成订单号
const generateOrderId = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD${year}${month}${day}${random}`
}

// 本地数据Key定义
const LOCAL_DATA_KEYS = {
  ROOMS: 'local_rooms_data',
  RESERVATIONS: 'local_reservations_data',
  ROOM_STATUSES: 'local_room_statuses_data',
  USER: 'local_user_data',
  INIT_FLAG: 'local_data_initialized',
}

/**
 * 初始化本地数据（仅在首次启动时）
 */
export const initializeLocalData = async (): Promise<void> => {
  const isInitialized = await storage.getItem(LOCAL_DATA_KEYS.INIT_FLAG)
  
  if (!isInitialized) {
    console.log('📦 初始化本地数据...')
    
    // 初始房间数据
    const initialRooms: Room[] = [
      { id: '1202', name: '1202', type: '大床房' },
      { id: '1203', name: '1203', type: '大床房' },
      { id: '1204', name: '1204', type: '大床房' },
      { id: '12345', name: '12345', type: '双人房' },
      { id: '1301', name: '1301', type: '豪华房' },
      { id: '1302', name: '1302', type: '豪华房' },
      { id: '1401', name: '1401', type: '套房' },
    ]
    
    await storage.setObject(LOCAL_DATA_KEYS.ROOMS, initialRooms)
    await storage.setObject(LOCAL_DATA_KEYS.RESERVATIONS, [])
    await storage.setObject(LOCAL_DATA_KEYS.ROOM_STATUSES, [])
    await storage.setItem(LOCAL_DATA_KEYS.INIT_FLAG, 'true')
    
    console.log('✅ 本地数据初始化完成')
  }
}

/**
 * 获取所有本地数据（用于恢复Redux状态）
 */
export const getAllLocalData = async () => {
  const rooms = await storage.getObject<Room[]>(LOCAL_DATA_KEYS.ROOMS) || []
  const reservations = await storage.getObject<Reservation[]>(LOCAL_DATA_KEYS.RESERVATIONS) || []
  const roomStatuses = await storage.getObject<RoomStatusData[]>(LOCAL_DATA_KEYS.ROOM_STATUSES) || []
  
  return { rooms, reservations, roomStatuses }
}

/**
 * 保存所有数据到本地（用于持久化Redux状态）
 */
export const saveAllLocalData = async (data: {
  rooms: Room[]
  reservations: Reservation[]
  roomStatuses: RoomStatusData[]
}) => {
  await storage.setObject(LOCAL_DATA_KEYS.ROOMS, data.rooms)
  await storage.setObject(LOCAL_DATA_KEYS.RESERVATIONS, data.reservations)
  await storage.setObject(LOCAL_DATA_KEYS.ROOM_STATUSES, data.roomStatuses)
}

// ============= 本地数据服务API =============

/**
 * 认证相关服务
 */
export const localAuthService = {
  login: async (email: string, password: string) => {
    // 模拟登录，返回模拟token
    await new Promise(resolve => setTimeout(resolve, 300))
    const token = 'local_mock_token_' + generateId()
    const user = {
      id: '1',
      email,
      name: '测试用户',
      role: 'admin',
    }
    await storage.setObject(LOCAL_DATA_KEYS.USER, user)
    return { token, user }
  },

  logout: async () => {
    await storage.removeItem(LOCAL_DATA_KEYS.USER)
  },

  getCurrentUser: async () => {
    return await storage.getObject(LOCAL_DATA_KEYS.USER)
  },
}

/**
 * 房间相关服务
 */
export const localRoomsService = {
  getAll: async (): Promise<Room[]> => {
    const rooms = await storage.getObject<Room[]>(LOCAL_DATA_KEYS.ROOMS)
    return rooms || []
  },

  getById: async (id: string): Promise<Room | null> => {
    const rooms = await storage.getObject<Room[]>(LOCAL_DATA_KEYS.ROOMS) || []
    return rooms.find(room => room.id === id) || null
  },

  create: async (roomData: Omit<Room, 'id'>): Promise<Room> => {
    const rooms = await storage.getObject<Room[]>(LOCAL_DATA_KEYS.ROOMS) || []
    const newRoom: Room = {
      id: generateId(),
      ...roomData,
    }
    rooms.push(newRoom)
    await storage.setObject(LOCAL_DATA_KEYS.ROOMS, rooms)
    return newRoom
  },

  update: async (id: string, roomData: Partial<Room>): Promise<Room> => {
    const rooms = await storage.getObject<Room[]>(LOCAL_DATA_KEYS.ROOMS) || []
    const index = rooms.findIndex(room => room.id === id)
    if (index === -1) throw new Error('Room not found')
    
    rooms[index] = { ...rooms[index], ...roomData }
    await storage.setObject(LOCAL_DATA_KEYS.ROOMS, rooms)
    return rooms[index]
  },

  delete: async (id: string): Promise<void> => {
    const rooms = await storage.getObject<Room[]>(LOCAL_DATA_KEYS.ROOMS) || []
    const filtered = rooms.filter(room => room.id !== id)
    await storage.setObject(LOCAL_DATA_KEYS.ROOMS, filtered)
  },
}

/**
 * 预订相关服务
 */
export const localReservationsService = {
  getAll: async (params?: { 
    startDate?: string
    endDate?: string
    status?: string 
  }): Promise<Reservation[]> => {
    let reservations = await storage.getObject<Reservation[]>(LOCAL_DATA_KEYS.RESERVATIONS) || []
    
    // 应用过滤条件
    if (params?.status) {
      reservations = reservations.filter(r => r.status === params.status)
    }
    if (params?.startDate) {
      reservations = reservations.filter(r => r.checkInDate >= params.startDate!)
    }
    if (params?.endDate) {
      reservations = reservations.filter(r => r.checkOutDate <= params.endDate!)
    }
    
    return reservations
  },

  getById: async (id: string): Promise<Reservation | null> => {
    const reservations = await storage.getObject<Reservation[]>(LOCAL_DATA_KEYS.RESERVATIONS) || []
    return reservations.find(r => r.id === id) || null
  },

  create: async (reservationData: Omit<Reservation, 'id' | 'orderId' | 'createdAt'>): Promise<Reservation> => {
    const reservations = await storage.getObject<Reservation[]>(LOCAL_DATA_KEYS.RESERVATIONS) || []
    const newReservation: Reservation = {
      id: generateId(),
      orderId: generateOrderId(),
      createdAt: new Date().toISOString(),
      ...reservationData,
    }
    reservations.push(newReservation)
    await storage.setObject(LOCAL_DATA_KEYS.RESERVATIONS, reservations)
    
    // 自动创建房态记录
    await localRoomStatusService.createForReservation(newReservation)
    
    return newReservation
  },

  update: async (id: string, reservationData: Partial<Reservation>): Promise<Reservation> => {
    const reservations = await storage.getObject<Reservation[]>(LOCAL_DATA_KEYS.RESERVATIONS) || []
    const index = reservations.findIndex(r => r.id === id)
    if (index === -1) throw new Error('Reservation not found')
    
    reservations[index] = { ...reservations[index], ...reservationData }
    await storage.setObject(LOCAL_DATA_KEYS.RESERVATIONS, reservations)
    return reservations[index]
  },

  cancel: async (id: string): Promise<Reservation> => {
    console.log('🗑️ [LocalService] 取消预订, ID:', id)
    const reservations = await storage.getObject<Reservation[]>(LOCAL_DATA_KEYS.RESERVATIONS) || []
    console.log('📋 [LocalService] 所有预订数量:', reservations.length)
    console.log('📋 [LocalService] 所有预订IDs:', reservations.map(r => ({ id: r.id, orderId: r.orderId })))
    
    const index = reservations.findIndex(r => r.id === id)
    console.log('🔍 [LocalService] 查找结果 index:', index)
    
    if (index === -1) {
      console.error('❌ [LocalService] 未找到预订, 查找ID:', id)
      throw new Error('Reservation not found')
    }
    
    reservations[index].status = 'cancelled'
    await storage.setObject(LOCAL_DATA_KEYS.RESERVATIONS, reservations)
    
    // 删除相关房态记录
    const statuses = await storage.getObject<RoomStatusData[]>(LOCAL_DATA_KEYS.ROOM_STATUSES) || []
    const filtered = statuses.filter(s => s.reservationId !== id)
    await storage.setObject(LOCAL_DATA_KEYS.ROOM_STATUSES, filtered)
    
    return reservations[index]
  },

  delete: async (id: string): Promise<void> => {
    console.log('🗑️ [LocalService] 删除预订, ID:', id)
    const reservations = await storage.getObject<Reservation[]>(LOCAL_DATA_KEYS.RESERVATIONS) || []
    const index = reservations.findIndex(r => r.id === id)
    
    if (index === -1) {
      throw new Error('Reservation not found')
    }
    
    // 删除预订
    const filtered = reservations.filter(r => r.id !== id)
    await storage.setObject(LOCAL_DATA_KEYS.RESERVATIONS, filtered)
    
    // 删除相关房态记录
    const statuses = await storage.getObject<RoomStatusData[]>(LOCAL_DATA_KEYS.ROOM_STATUSES) || []
    const filteredStatuses = statuses.filter(s => s.reservationId !== id)
    await storage.setObject(LOCAL_DATA_KEYS.ROOM_STATUSES, filteredStatuses)
    
    console.log('✅ [LocalService] 预订已删除')
  },

  checkIn: async (id: string): Promise<Reservation> => {
    const reservations = await storage.getObject<Reservation[]>(LOCAL_DATA_KEYS.RESERVATIONS) || []
    const index = reservations.findIndex(r => r.id === id)
    if (index === -1) throw new Error('Reservation not found')
    
    reservations[index].status = 'checked-in'
    await storage.setObject(LOCAL_DATA_KEYS.RESERVATIONS, reservations)
    return reservations[index]
  },

  checkOut: async (id: string): Promise<Reservation> => {
    const reservations = await storage.getObject<Reservation[]>(LOCAL_DATA_KEYS.RESERVATIONS) || []
    const index = reservations.findIndex(r => r.id === id)
    if (index === -1) throw new Error('Reservation not found')
    
    reservations[index].status = 'checked-out'
    await storage.setObject(LOCAL_DATA_KEYS.RESERVATIONS, reservations)
    
    // 删除相关房态记录
    const statuses = await storage.getObject<RoomStatusData[]>(LOCAL_DATA_KEYS.ROOM_STATUSES) || []
    const filtered = statuses.filter(s => s.reservationId !== id)
    await storage.setObject(LOCAL_DATA_KEYS.ROOM_STATUSES, filtered)
    
    return reservations[index]
  },
}

/**
 * 房态相关服务
 */
export const localRoomStatusService = {
  getByDateRange: async (startDate: string, endDate: string): Promise<RoomStatusData[]> => {
    const statuses = await storage.getObject<RoomStatusData[]>(LOCAL_DATA_KEYS.ROOM_STATUSES) || []
    return statuses.filter(s => s.date >= startDate && s.date <= endDate)
  },

  setDirty: async (roomId: string, date: string): Promise<RoomStatusData> => {
    const statuses = await storage.getObject<RoomStatusData[]>(LOCAL_DATA_KEYS.ROOM_STATUSES) || []
    const index = statuses.findIndex(s => s.roomId === roomId && s.date === date)
    
    const statusData: RoomStatusData = {
      roomId,
      date,
      status: 'dirty',
    }
    
    if (index >= 0) {
      statuses[index] = statusData
    } else {
      statuses.push(statusData)
    }
    
    await storage.setObject(LOCAL_DATA_KEYS.ROOM_STATUSES, statuses)
    return statusData
  },

  setClean: async (roomId: string, date: string): Promise<void> => {
    const statuses = await storage.getObject<RoomStatusData[]>(LOCAL_DATA_KEYS.ROOM_STATUSES) || []
    const filtered = statuses.filter(s => !(s.roomId === roomId && s.date === date && s.status === 'dirty'))
    await storage.setObject(LOCAL_DATA_KEYS.ROOM_STATUSES, filtered)
  },

  closeRoom: async (roomId: string, startDate: string, endDate: string, note?: string): Promise<void> => {
    const statuses = await storage.getObject<RoomStatusData[]>(LOCAL_DATA_KEYS.ROOM_STATUSES) || []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // 为关房期间的每一天创建房态记录
    for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0]
      const index = statuses.findIndex(s => s.roomId === roomId && s.date === dateStr)
      
      const statusData: RoomStatusData = {
        roomId,
        date: dateStr,
        status: 'closed',
        note,
      }
      
      if (index >= 0) {
        statuses[index] = statusData
      } else {
        statuses.push(statusData)
      }
    }
    
    await storage.setObject(LOCAL_DATA_KEYS.ROOM_STATUSES, statuses)
  },

  // 为预订创建房态记录（内部使用）
  createForReservation: async (reservation: Reservation): Promise<void> => {
    const statuses = await storage.getObject<RoomStatusData[]>(LOCAL_DATA_KEYS.ROOM_STATUSES) || []
    const startDate = new Date(reservation.checkInDate)
    const endDate = new Date(reservation.checkOutDate)
    
    for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0]
      statuses.push({
        roomId: reservation.roomId,
        date: dateStr,
        status: 'occupied',
        reservationId: reservation.id,
      })
    }
    
    await storage.setObject(LOCAL_DATA_KEYS.ROOM_STATUSES, statuses)
  },
}

/**
 * 统计相关服务
 */
export const localStatisticsService = {
  getDashboard: async () => {
    const rooms = await storage.getObject<Room[]>(LOCAL_DATA_KEYS.ROOMS) || []
    const reservations = await storage.getObject<Reservation[]>(LOCAL_DATA_KEYS.RESERVATIONS) || []
    const statuses = await storage.getObject<RoomStatusData[]>(LOCAL_DATA_KEYS.ROOM_STATUSES) || []
    
    const today = new Date().toISOString().split('T')[0]
    const occupiedToday = statuses.filter(s => s.date === today && s.status === 'occupied').length
    
    const totalRevenue = reservations
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.totalAmount, 0)
    
    const todayCheckIns = reservations.filter(r => r.checkInDate === today).length
    const todayCheckOuts = reservations.filter(r => r.checkOutDate === today).length
    
    return {
      totalRooms: rooms.length,
      occupiedRooms: occupiedToday,
      availableRooms: rooms.length - occupiedToday,
      occupancyRate: rooms.length > 0 ? (occupiedToday / rooms.length) * 100 : 0,
      totalRevenue,
      todayCheckIns,
      todayCheckOuts,
      totalReservations: reservations.length,
    }
  },

  getOccupancyRate: async (startDate: string, endDate: string) => {
    const rooms = await storage.getObject<Room[]>(LOCAL_DATA_KEYS.ROOMS) || []
    const statuses = await storage.getObject<RoomStatusData[]>(LOCAL_DATA_KEYS.ROOM_STATUSES) || []
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days: any[] = []
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0]
      const occupied = statuses.filter(s => s.date === dateStr && s.status === 'occupied').length
      const rate = rooms.length > 0 ? (occupied / rooms.length) * 100 : 0
      
      days.push({
        date: dateStr,
        occupiedRooms: occupied,
        totalRooms: rooms.length,
        occupancyRate: rate,
      })
    }
    
    return days
  },

  getRevenue: async (year: number, month: number) => {
    const reservations = await storage.getObject<Reservation[]>(LOCAL_DATA_KEYS.RESERVATIONS) || []
    
    const filtered = reservations.filter(r => {
      const date = new Date(r.checkInDate)
      return date.getFullYear() === year && date.getMonth() + 1 === month && r.status !== 'cancelled'
    })
    
    const totalRevenue = filtered.reduce((sum, r) => sum + r.totalAmount, 0)
    const totalReservations = filtered.length
    
    return {
      year,
      month,
      totalRevenue,
      totalReservations,
      averageRevenue: totalReservations > 0 ? totalRevenue / totalReservations : 0,
    }
  },
}

/**
 * 导出所有本地服务（与api.ts接口一致）
 */
export const localDataService = {
  auth: localAuthService,
  rooms: localRoomsService,
  reservations: localReservationsService,
  roomStatus: localRoomStatusService,
  statistics: localStatisticsService,
}

