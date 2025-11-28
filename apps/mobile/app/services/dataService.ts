/**
 * 统一数据服务层
 * 所有数据操作都通过云服务API，本地仅用作缓存
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from './api'
import { storage } from './storage'
import type { Room, Reservation, RoomStatusData } from '../store/types'

// 获取当前用户的propertyId
const PROPERTY_ID_KEY = '@property_id'
const getPropertyId = async (): Promise<string> => {
  const propertyId = await AsyncStorage.getItem(PROPERTY_ID_KEY)
  return propertyId || 'demo-property' // 降级到默认值
}

// 缓存配置
const CACHE_CONFIG = {
  // 缓存过期时间（毫秒）
  ROOMS_TTL: 5 * 60 * 1000,           // 房间列表：5分钟
  RESERVATIONS_TTL: 2 * 60 * 1000,    // 预订列表：2分钟
  ROOM_STATUS_TTL: 1 * 60 * 1000,     // 房态数据：1分钟
  STATISTICS_TTL: 5 * 60 * 1000,      // 统计数据：5分钟
}

// 缓存键前缀
const CACHE_KEYS = {
  ROOMS: 'cache_rooms',
  RESERVATIONS: 'cache_reservations',
  ROOM_STATUS: 'cache_room_status',
  STATISTICS: 'cache_statistics',
}

// 缓存数据结构
interface CacheData<T> {
  data: T
  timestamp: number
}

/**
 * 缓存工具函数
 */
const cache = {
  // 设置缓存
  set: async <T>(key: string, data: T): Promise<void> => {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
    }
    await storage.setObject(key, cacheData)
    console.log(`📦 [Cache] 已缓存: ${key}`)
  },

  // 获取缓存（检查过期时间）
  get: async <T>(key: string, ttl: number): Promise<T | null> => {
    const cacheData = await storage.getObject<CacheData<T>>(key)
    if (!cacheData) {
      console.log(`📦 [Cache] 缓存未命中: ${key}`)
      return null
    }

    const age = Date.now() - cacheData.timestamp
    if (age > ttl) {
      console.log(`📦 [Cache] 缓存已过期: ${key} (${Math.round(age / 1000)}s)`)
      await storage.removeItem(key)
      return null
    }

    console.log(`📦 [Cache] 缓存命中: ${key} (${Math.round(age / 1000)}s ago)`)
    return cacheData.data
  },

  // 清除缓存
  clear: async (key: string): Promise<void> => {
    await storage.removeItem(key)
    console.log(`📦 [Cache] 已清除: ${key}`)
  },

  // 清除所有缓存
  clearAll: async (): Promise<void> => {
    await Promise.all(
      Object.values(CACHE_KEYS).map(key => storage.removeItem(key))
    )
    console.log('📦 [Cache] 已清除所有缓存')
  },
}

/**
 * 统一数据服务 - 全部使用云服务API，本地仅作缓存
 */
export const dataService = {
  // ============= 认证相关 =============
  auth: {
    login: async (email: string, password: string) => {
      console.log('🌐 使用云服务API认证')
      const result = await api.auth.login(email, password)
      // 登录成功后清除所有缓存
      await cache.clearAll()
      return result
    },

    logout: async () => {
      console.log('🌐 退出登录')
      const result = await api.auth.logout()
      // 退出登录后清除所有缓存
      await cache.clearAll()
      return result
    },

    getCurrentUser: async () => {
      return await api.auth.getCurrentUser()
    },
  },

  // ============= 房间相关 =============
  rooms: {
    getAll: async (propertyId?: string): Promise<Room[]> => {
      console.log('🌐 从云服务API获取房间列表')
      
      // 如果没有传入propertyId，使用保存的propertyId
      const effectivePropertyId = propertyId || await getPropertyId()
      
      // 为不同 propertyId 创建不同的缓存键
      const cacheKey = `${CACHE_KEYS.ROOMS}_${effectivePropertyId}`
      
      // 尝试从缓存获取
      const cached = await cache.get<Room[]>(cacheKey, CACHE_CONFIG.ROOMS_TTL)
      if (cached) {
        console.log('⚡️ 使用缓存的房间列表')
        return cached
      }

      // 从API获取
      const apiRooms = await api.rooms.getAll(effectivePropertyId)
      
      // 转换API数据格式为前端期望的格式
      const rooms: Room[] = apiRooms.map((apiRoom: any) => ({
        id: apiRoom.id,
        name: apiRoom.name || apiRoom.code,
        type: apiRoom.roomType,
        status: 'available', // 默认可用
      }))
      
      console.log(`✅ 转换了 ${rooms.length} 个房间数据`)
      
      // 缓存转换后的数据
      await cache.set(cacheKey, rooms)
      return rooms
    },

    getById: async (id: string): Promise<Room | null> => {
      return await api.rooms.getById(id)
    },

    create: async (roomData: Omit<Room, 'id'>): Promise<Room> => {
      console.log('🌐 在云服务创建房间')
      const room = await api.rooms.create(roomData)
      // 清除房间列表缓存
      await cache.clear(CACHE_KEYS.ROOMS)
      return room
    },

    update: async (id: string, roomData: Partial<Room>): Promise<Room> => {
      const room = await api.rooms.update(id, roomData)
      // 清除房间列表缓存
      await cache.clear(CACHE_KEYS.ROOMS)
      return room
    },

    delete: async (id: string): Promise<void> => {
      await api.rooms.delete(id)
      // 清除房间列表缓存
      await cache.clear(CACHE_KEYS.ROOMS)
    },
  },

  // ============= 预订相关 =============
  reservations: {
    getAll: async (params?: { startDate?: string; endDate?: string; status?: string; propertyId?: string }): Promise<Reservation[]> => {
      console.log('🌐 从云服务API获取预订列表')
      
      // 如果没有传入propertyId，使用保存的propertyId
      const effectivePropertyId = params?.propertyId || await getPropertyId()
      const effectiveParams = {
        ...params,
        propertyId: effectivePropertyId
      }
      
      console.log('📋 [Reservations] 查询参数:', effectiveParams)
      
      // 为不同参数创建不同的缓存键
      const cacheKey = `${CACHE_KEYS.RESERVATIONS}_${JSON.stringify(effectiveParams)}`

      // 尝试从缓存获取
      const cached = await cache.get<Reservation[]>(cacheKey, CACHE_CONFIG.RESERVATIONS_TTL)
      if (cached) {
        console.log('⚡️ 使用缓存的预订列表')
        return cached
      }

      // 从API获取并缓存
      const reservations = await api.reservations.getAll(effectiveParams)
      console.log(`✅ 从API获取到 ${reservations.length} 个预订`)
      await cache.set(cacheKey, reservations)
      return reservations
    },

    getById: async (id: string): Promise<Reservation | null> => {
      return await api.reservations.getById(id)
    },

    create: async (reservationData: any): Promise<Reservation> => {
      console.log('🌐 在云服务创建预订')
      const reservation = await api.reservations.create(reservationData)
      // 清除预订和房态缓存
      await cache.clear(CACHE_KEYS.RESERVATIONS)
      await cache.clear(CACHE_KEYS.ROOM_STATUS)
      return reservation
    },

    update: async (id: string, reservationData: Partial<Reservation>): Promise<Reservation> => {
      const reservation = await api.reservations.update(id, reservationData)
      // 清除预订和房态缓存
      await cache.clear(CACHE_KEYS.RESERVATIONS)
      await cache.clear(CACHE_KEYS.ROOM_STATUS)
      return reservation
    },

    cancel: async (id: string): Promise<Reservation> => {
      const reservation = await api.reservations.cancel(id)
      // 清除预订和房态缓存
      await cache.clear(CACHE_KEYS.RESERVATIONS)
      await cache.clear(CACHE_KEYS.ROOM_STATUS)
      return reservation
    },

    delete: async (id: string): Promise<void> => {
      await api.reservations.delete(id)
      // 清除预订和房态缓存
      await cache.clear(CACHE_KEYS.RESERVATIONS)
      await cache.clear(CACHE_KEYS.ROOM_STATUS)
    },

    checkIn: async (id: string): Promise<Reservation> => {
      const reservation = await api.reservations.checkIn(id)
      // 清除预订和房态缓存
      await cache.clear(CACHE_KEYS.RESERVATIONS)
      await cache.clear(CACHE_KEYS.ROOM_STATUS)
      return reservation
    },

    checkOut: async (id: string): Promise<Reservation> => {
      const reservation = await api.reservations.checkOut(id)
      // 清除预订和房态缓存
      await cache.clear(CACHE_KEYS.RESERVATIONS)
      await cache.clear(CACHE_KEYS.ROOM_STATUS)
      return reservation
    },
  },

  // ============= 房态相关 =============
  roomStatus: {
    getByDateRange: async (startDate: string, endDate: string, propertyId?: string): Promise<RoomStatusData[]> => {
      console.log('🌐 从云服务API获取房态')
      
      // 如果没有传入propertyId，使用保存的propertyId
      const effectivePropertyId = propertyId || await getPropertyId()
      
      console.log('📅 [RoomStatus] 查询参数:', { startDate, endDate, propertyId: effectivePropertyId })
      
      // 为不同日期范围创建不同的缓存键
      const cacheKey = `${CACHE_KEYS.ROOM_STATUS}_${effectivePropertyId}_${startDate}_${endDate}`

      // 尝试从缓存获取
      const cached = await cache.get<RoomStatusData[]>(cacheKey, CACHE_CONFIG.ROOM_STATUS_TTL)
      if (cached) {
        console.log('⚡️ 使用缓存的房态数据')
        return cached
      }

      // 从API获取并缓存
      const roomStatus = await api.roomStatus.getByDateRange(startDate, endDate, effectivePropertyId)
      console.log(`✅ 从API获取到 ${roomStatus.length} 条房态数据`)
      await cache.set(cacheKey, roomStatus)
      return roomStatus
    },

    setDirty: async (roomId: string, date: string) => {
      const result = await api.roomStatus.setDirty(roomId, date)
      // 清除房态缓存
      await cache.clear(CACHE_KEYS.ROOM_STATUS)
      return result
    },

    setClean: async (roomId: string, date: string) => {
      const result = await api.roomStatus.setClean(roomId, date)
      // 清除房态缓存
      await cache.clear(CACHE_KEYS.ROOM_STATUS)
      return result
    },

    closeRoom: async (roomId: string, startDate: string, endDate: string, note?: string) => {
      const result = await api.roomStatus.closeRoom(roomId, startDate, endDate, note)
      // 清除房态缓存
      await cache.clear(CACHE_KEYS.ROOM_STATUS)
      return result
    },
  },

  // ============= 统计相关 =============
  statistics: {
    getDashboard: async () => {
      console.log('🌐 从云服务API获取统计数据')
      
      // 尝试从缓存获取
      const cached = await cache.get(CACHE_KEYS.STATISTICS, CACHE_CONFIG.STATISTICS_TTL)
      if (cached) {
        console.log('⚡️ 使用缓存的统计数据')
        return cached
      }

      // 从API获取并缓存
      const stats = await api.statistics.getDashboard()
      await cache.set(CACHE_KEYS.STATISTICS, stats)
      return stats
    },

    getOccupancyRate: async (startDate: string, endDate: string) => {
      return await api.statistics.getOccupancyRate(startDate, endDate)
    },

    getRevenue: async (year: number, month: number) => {
      return await api.statistics.getRevenue(year, month)
    },
  },

  // ============= 缓存管理 =============
  cache: {
    // 手动清除所有缓存
    clearAll: async () => {
      await cache.clearAll()
    },

    // 清除特定类型的缓存
    clearRooms: async () => {
      await cache.clear(CACHE_KEYS.ROOMS)
    },

    clearReservations: async () => {
      await cache.clear(CACHE_KEYS.RESERVATIONS)
    },

    clearRoomStatus: async () => {
      await cache.clear(CACHE_KEYS.ROOM_STATUS)
    },

    clearStatistics: async () => {
      await cache.clear(CACHE_KEYS.STATISTICS)
    },
  },
}

export default dataService
