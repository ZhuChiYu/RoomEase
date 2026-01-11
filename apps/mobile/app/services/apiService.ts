/**
 * API服务层
 * 将后端API适配为Mobile App需要的数据格式
 */

import apiClient, { ApiResponse } from './apiClient'
import type { Room, Reservation, RoomStatusData, RoomType } from '../store/types'

// ============= 认证服务 =============
export const authService = {
  login: async (email: string, password: string) => {
    return apiClient.login(email, password)
  },

  logout: async () => {
    return apiClient.logout()
  },

  getCurrentUser: async () => {
    return apiClient.getCurrentUser()
  },
}

// ============= 房间服务 =============
export const roomsService = {
  getAll: async (propertyId?: string): Promise<Room[]> => {
    console.log('🏠 [API-Rooms] 请求房间列表, propertyId:', propertyId)
    const response = await apiClient.get('/rooms', {
      params: propertyId ? { propertyId } : {}
    })
    
    if (response.success && response.data) {
      console.log('🏠 [API-Rooms] 原始响应:', response.data.length, '个房间')
      console.log('🏠 [API-Rooms] 前3个房间:', response.data.slice(0, 3).map((r: any) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        roomType: r.roomType
      })))
      
      // 将后端数据转换为App需要的格式
      const rooms = response.data.map((room: any) => ({
        id: room.id,
        name: room.name,
        type: room.roomType as RoomType,
      }))
      
      console.log('🏠 [API-Rooms] 转换后:', rooms.length, '个房间')
      return rooms
    }
    
    console.log('🏠 [API-Rooms] 返回空数组')
    return []
  },

  getById: async (id: string): Promise<Room | null> => {
    const response = await apiClient.get(`/rooms/${id}`)
    
    if (response.success && response.data) {
      const room = response.data
      return {
        id: room.id,
        name: room.name,
        type: room.roomType as RoomType,
      }
    }
    
    return null
  },

  create: async (roomData: Omit<Room, 'id'> & { propertyId: string; basePrice: number }): Promise<Room> => {
    const response = await apiClient.post('/rooms', {
      name: roomData.name,
      code: roomData.name, // 使用name作为code
      roomType: roomData.type,
      maxGuests: 2,
      bedCount: 1,
      bathroomCount: 1,
      basePrice: roomData.basePrice,
      propertyId: roomData.propertyId,
    })
    
    if (response.success && response.data) {
      const room = response.data
      return {
        id: room.id,
        name: room.name,
        type: room.roomType as RoomType,
      }
    }
    
    throw new Error(response.error || '创建房间失败')
  },

  update: async (id: string, roomData: Partial<Room>): Promise<Room> => {
    const updateData: any = {}
    if (roomData.name) updateData.name = roomData.name
    if (roomData.type) updateData.roomType = roomData.type
    
    const response = await apiClient.patch(`/rooms/${id}`, updateData)
    
    if (response.success && response.data) {
      const room = response.data
      return {
        id: room.id,
        name: room.name,
        type: room.roomType as RoomType,
      }
    }
    
    throw new Error(response.error || '更新房间失败')
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/rooms/${id}`)
    if (!response.success) {
      throw new Error(response.error || '删除房间失败')
    }
  },

  batchUpdateOrder: async (updates: Array<{ id: string; sortOrder: number }>): Promise<void> => {
    console.log('🏠 [API-Rooms] 批量更新房间顺序:', updates.length)
    const response = await apiClient.patch('/rooms/batch-order', { updates })
    if (!response.success) {
      throw new Error(response.error || '批量更新房间顺序失败')
    }
  },

  updateVisibility: async (id: string, isVisible: boolean): Promise<void> => {
    console.log('🏠 [API-Rooms] 更新房间可见性:', id, isVisible)
    const response = await apiClient.patch(`/rooms/${id}`, { isVisible })
    if (!response.success) {
      throw new Error(response.error || '更新房间可见性失败')
    }
  },
}

// ============= 预订服务 =============
export const reservationsService = {
  getAll: async (params?: { 
    startDate?: string
    endDate?: string
    status?: string
    propertyId?: string
  }): Promise<Reservation[]> => {
    console.log('📋 [API-Reservations] 请求预订列表, params:', params)
    const response = await apiClient.get('/reservations', { params })
    
    if (response.success && response.data) {
      console.log('📋 [API-Reservations] 原始响应:', response.data.length, '个预订')
      response.data.forEach((r: any, index: number) => {
        console.log(`📋 [API-Reservations] 预订${index + 1}:`, {
          id: r.id,
          roomId: r.roomId,
          roomName: r.room?.name,
          roomType: r.room?.roomType,
          guestName: r.guestName,
          checkIn: r.checkInDate?.split('T')[0],
          checkOut: r.checkOutDate?.split('T')[0],
          status: r.status
        })
      })
      
      const reservations = response.data.map((r: any) => ({
        id: r.id,
        orderId: r.id.substring(0, 8).toUpperCase(),
        roomId: r.roomId,
        roomNumber: r.room?.name || '',
        roomType: r.room?.roomType || '',
        guestName: r.guestName,
        guestPhone: r.guestPhone || '',
        guestIdType: 'ID_CARD',
        guestIdNumber: r.guestIdNumber,
        channel: r.source || '直订',
        checkInDate: r.checkInDate.split('T')[0],
        checkOutDate: r.checkOutDate.split('T')[0],
        roomPrice: Number(r.roomRate),
        totalAmount: Number(r.totalAmount),
        nights: Math.ceil((new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / (1000 * 60 * 60 * 24)),
        status: mapReservationStatus(r.status),
        paidAmount: Number(r.paidAmount || 0),
        otherFees: 0,
        payments: [],
        createdAt: r.createdAt,
      }))
      
      console.log('📋 [API-Reservations] 转换后:', reservations.length, '个预订')
      return reservations
    }
    
    console.log('📋 [API-Reservations] 返回空数组')
    return []
  },

  getById: async (id: string): Promise<Reservation | null> => {
    const response = await apiClient.get(`/reservations/${id}`)
    
    if (response.success && response.data) {
      const r = response.data
      return {
        id: r.id,
        orderId: r.id.substring(0, 8).toUpperCase(),
        roomId: r.roomId,
        roomNumber: r.room?.name || '',
        roomType: r.room?.roomType || '',
        guestName: r.guestName,
        guestPhone: r.guestPhone || '',
        guestIdType: 'ID_CARD',
        guestIdNumber: r.guestIdNumber,
        channel: r.source || '直订',
        checkInDate: r.checkInDate.split('T')[0],
        checkOutDate: r.checkOutDate.split('T')[0],
        roomPrice: Number(r.roomRate),
        totalAmount: Number(r.totalAmount),
        nights: Math.ceil((new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / (1000 * 60 * 60 * 24)),
        status: mapReservationStatus(r.status),
        paidAmount: Number(r.paidAmount || 0),
        otherFees: 0,
        payments: [],
        createdAt: r.createdAt,
      }
    }
    
    return null
  },

  create: async (reservationData: any): Promise<Reservation> => {
    // roomId可能是数据库ID或房间编号(code)
    const roomIdOrCode = reservationData.roomId
    const roomTypeName = reservationData.roomType?.split('-')[0] || '大床房'
    let actualRoomId: string | null = null
    
    console.log('🔍 [API] 查询房间:', { roomIdOrCode, propertyId: reservationData.propertyId })
    
    // 首先尝试查询现有房间
    try {
      const roomsResponse = await apiClient.get('/rooms', {
        params: {
          propertyId: reservationData.propertyId || 'demo-property'
        }
      })
      
      if (roomsResponse.success && roomsResponse.data) {
        console.log('📋 [API] 查询到房间列表:', roomsResponse.data.length, '个房间')
        
        // 查找匹配id、code或name的房间
        const room = roomsResponse.data.find((r: any) => {
          const match = r.id === roomIdOrCode || r.code === roomIdOrCode || r.name === roomIdOrCode
          if (match) {
            console.log('✅ [API] 找到匹配的房间:', { id: r.id, code: r.code, name: r.name })
          }
          return match
        })
        
        if (room?.id) {
          actualRoomId = room.id
          console.log('✅ [API] 使用现有房间ID:', actualRoomId)
        }
      }
    } catch (queryError) {
      console.warn('⚠️ [API] 查询房间列表失败:', queryError)
    }
    
    // 如果没有找到房间，说明roomIdOrCode不是有效的房间标识
    if (!actualRoomId) {
      console.error('❌ [API] 无法找到房间，roomIdOrCode:', roomIdOrCode)
      throw new Error(`房间不存在: ${roomIdOrCode}。请确保从房间列表中选择房间。`)
    }
    
    console.log('📝 [API] 创建预订，使用房间ID:', actualRoomId)
    
    // 创建预订，使用真实的房间ID
    const response = await apiClient.post('/reservations', {
      propertyId: reservationData.propertyId || 'demo-property',
      roomId: actualRoomId, // 使用真实的房间ID
      checkInDate: reservationData.checkInDate,
      checkOutDate: reservationData.checkOutDate,
      guestCount: 1,
      childCount: 0,
      roomRate: reservationData.roomPrice,
      totalAmount: reservationData.totalAmount,
      guestName: reservationData.guestName,
      guestPhone: reservationData.guestPhone,
      guestIdNumber: reservationData.guestIdNumber,
      source: reservationData.channel,
    })
    
    if (response.success && response.data) {
      const r = response.data
      console.log('✅ [API] 预订创建成功:', r.id)
      
      return {
        id: r.id,
        orderId: r.id.substring(0, 8).toUpperCase(),
        roomId: r.roomId,
        roomNumber: r.room?.name || '',
        roomType: r.room?.roomType || '',
        guestName: r.guestName,
        guestPhone: r.guestPhone || '',
        guestIdType: 'ID_CARD',
        guestIdNumber: r.guestIdNumber,
        channel: r.source || '直订',
        checkInDate: r.checkInDate.split('T')[0],
        checkOutDate: r.checkOutDate.split('T')[0],
        roomPrice: Number(r.roomRate),
        totalAmount: Number(r.totalAmount),
        nights: Math.ceil((new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / (1000 * 60 * 60 * 24)),
        status: 'pending',
        paidAmount: 0,
        otherFees: 0,
        payments: [],
        createdAt: r.createdAt,
      }
    }
    
    throw new Error(response.error || '创建预订失败')
  },

  update: async (id: string, reservationData: Partial<Reservation>): Promise<Reservation> => {
    const updateData: any = {}
    
    if (reservationData.guestName) updateData.guestName = reservationData.guestName
    if (reservationData.guestPhone) updateData.guestPhone = reservationData.guestPhone
    if (reservationData.checkInDate) updateData.checkInDate = reservationData.checkInDate
    if (reservationData.checkOutDate) updateData.checkOutDate = reservationData.checkOutDate
    if (reservationData.totalAmount) updateData.totalAmount = reservationData.totalAmount
    
    const response = await apiClient.patch(`/reservations/${id}`, updateData)
    
    if (!response.success) {
      throw new Error(response.error || '更新预订失败')
    }
    
    // 返回更新后的数据
    const updated = await reservationsService.getById(id)
    if (!updated) throw new Error('获取更新后的预订失败')
    return updated
  },

  cancel: async (id: string): Promise<Reservation> => {
    const response = await apiClient.post(`/reservations/${id}/cancel`)
    
    if (!response.success) {
      throw new Error(response.error || '取消预订失败')
    }
    
    const updated = await reservationsService.getById(id)
    if (!updated) throw new Error('获取更新后的预订失败')
    return updated
  },

  checkIn: async (id: string): Promise<Reservation> => {
    const response = await apiClient.post(`/reservations/${id}/check-in`)
    
    if (!response.success) {
      throw new Error(response.error || '入住失败')
    }
    
    const updated = await reservationsService.getById(id)
    if (!updated) throw new Error('获取更新后的预订失败')
    return updated
  },

  checkOut: async (id: string): Promise<Reservation> => {
    const response = await apiClient.post(`/reservations/${id}/check-out`)
    
    if (!response.success) {
      throw new Error(response.error || '退房失败')
    }
    
    const updated = await reservationsService.getById(id)
    if (!updated) throw new Error('获取更新后的预订失败')
    return updated
  },
}

// ============= 房态服务 =============
export const roomStatusService = {
  getByDateRange: async (startDate: string, endDate: string, propertyId: string): Promise<RoomStatusData[]> => {
    console.log('📆 [API-RoomStatus] 请求房态数据:', { startDate, endDate, propertyId })
    const response = await apiClient.get('/calendar', {
      params: { propertyId, startDate, endDate }
    })
    
    if (response.success && response.data) {
      console.log('📆 [API-RoomStatus] 原始响应:', {
        reservations: response.data.reservations?.length || 0,
        overrides: response.data.overrides?.length || 0
      })
      
      const statuses: RoomStatusData[] = []
      
      // 从预订数据生成房态
      response.data.reservations?.forEach((reservation: any) => {
        console.log('📆 [API-RoomStatus] 处理预订:', {
          id: reservation.id,
          roomId: reservation.roomId,
          checkIn: reservation.checkInDate?.split('T')[0],
          checkOut: reservation.checkOutDate?.split('T')[0]
        })
        
        const start = new Date(reservation.checkInDate)
        const end = new Date(reservation.checkOutDate)
        
        let addedDays = 0
        for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
          const dateStr = date.toISOString().split('T')[0]
          statuses.push({
            roomId: reservation.roomId,
            date: dateStr,
            status: 'occupied',
            reservationId: reservation.id,
          })
          addedDays++
        }
        console.log('📆 [API-RoomStatus] 为预订', reservation.id, '生成了', addedDays, '天房态')
      })
      
      // 从关房数据生成房态
      response.data.overrides?.forEach((override: any) => {
        if (override.isBlocked) {
          console.log('📆 [API-RoomStatus] 处理关房:', {
            roomId: override.roomId,
            date: override.date?.split('T')[0]
          })
          statuses.push({
            roomId: override.roomId,
            date: override.date.split('T')[0],
            status: 'closed',
            note: override.reason,
          })
        }
      })
      
      console.log('📆 [API-RoomStatus] 共生成', statuses.length, '条房态记录')
      return statuses
    }
    
    console.log('📆 [API-RoomStatus] 返回空数组')
    return []
  },

  setDirty: async (roomId: string, date: string): Promise<RoomStatusData> => {
    // TODO: 实现脏房标记API
    return {
      roomId,
      date,
      status: 'dirty',
    }
  },

  setClean: async (roomId: string, date: string): Promise<void> => {
    // TODO: 实现清洁标记API
  },

  closeRoom: async (roomId: string, startDate: string, endDate: string, note?: string): Promise<void> => {
    const response = await apiClient.post('/calendar/block', {
      roomId,
      startDate,
      endDate,
      reason: note,
    })
    
    if (!response.success) {
      throw new Error(response.error || '关房失败')
    }
  },
}

// ============= 统计服务 =============
export const statisticsService = {
  getDashboard: async (propertyId?: string) => {
    const response = await apiClient.get('/analytics/dashboard', {
      params: propertyId ? { propertyId } : {}
    })
    
    if (response.success && response.data) {
      return response.data
    }
    
    return {
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      occupancyRate: 0,
      totalRevenue: 0,
      todayCheckIns: 0,
      todayCheckOuts: 0,
      totalReservations: 0,
    }
  },

  getOccupancyRate: async (startDate: string, endDate: string, propertyId: string) => {
    const response = await apiClient.get('/analytics/occupancy-trend', {
      params: { propertyId, startDate, endDate }
    })
    
    if (response.success && response.data) {
      return response.data
    }
    
    return []
  },

  getRevenue: async (year: number, month: number, propertyId: string) => {
    const response = await apiClient.get('/analytics/revenue', {
      params: { propertyId, year, month }
    })
    
    if (response.success && response.data) {
      return response.data
    }
    
    return {
      year,
      month,
      totalRevenue: 0,
      totalReservations: 0,
      averageRevenue: 0,
    }
  },
}

// ============= 辅助函数 =============
function mapReservationStatus(backendStatus: string): Reservation['status'] {
  const statusMap: Record<string, Reservation['status']> = {
    'PENDING': 'pending',
    'CONFIRMED': 'confirmed',
    'CHECKED_IN': 'checked-in',
    'CHECKED_OUT': 'checked-out',
    'CANCELLED': 'cancelled',
  }
  return statusMap[backendStatus] || 'pending'
}

// ============= 导出统一服务 =============
export const apiService = {
  auth: authService,
  rooms: roomsService,
  reservations: reservationsService,
  roomStatus: roomStatusService,
  statistics: statisticsService,
}

export default apiService

