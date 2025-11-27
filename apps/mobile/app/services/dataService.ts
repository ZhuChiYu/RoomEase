/**
 * 统一数据服务层
 * 根据开发者模式开关，自动切换本地存储或服务器API
 */

import { storage } from './storage'
import { api } from './api'
import { localDataService } from './localDataService'
import type { Room, Reservation, RoomStatusData } from '../store/types'

// 开发者模式配置Key
const DEV_MODE_KEY = 'developer_mode_config'

// 开发者模式配置类型
export interface DeveloperModeConfig {
  useLocalStorage: boolean // true=本地存储，false=服务器API
  lastUpdated: string
}

// 获取开发者模式配置
export const getDeveloperModeConfig = async (): Promise<DeveloperModeConfig> => {
  const config = await storage.getObject<DeveloperModeConfig>(DEV_MODE_KEY)
  return config || {
    useLocalStorage: true, // 默认使用本地存储（适合开发和演示）
    lastUpdated: new Date().toISOString(),
  }
}

// 设置开发者模式
export const setDeveloperMode = async (useLocalStorage: boolean): Promise<void> => {
  const config: DeveloperModeConfig = {
    useLocalStorage,
    lastUpdated: new Date().toISOString(),
  }
  await storage.setObject(DEV_MODE_KEY, config)
  console.log(`🔧 开发者模式已${useLocalStorage ? '开启' : '关闭'}: ${useLocalStorage ? '使用本地存储' : '使用服务器API'}`)
}

// 检查是否使用本地存储
const shouldUseLocalStorage = async (): Promise<boolean> => {
  const config = await getDeveloperModeConfig()
  return config.useLocalStorage
}

/**
 * 统一数据服务 - 自动根据配置选择数据源
 */
export const dataService = {
  // ============= 认证相关 =============
  auth: {
    login: async (email: string, password: string) => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        console.log('🏠 使用本地认证')
        return await localDataService.auth.login(email, password)
      } else {
        console.log('🌐 使用服务器API认证')
        return await api.auth.login(email, password)
      }
    },

    logout: async () => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.auth.logout()
      } else {
        return await api.auth.logout()
      }
    },

    getCurrentUser: async () => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.auth.getCurrentUser()
      } else {
        return await api.auth.getCurrentUser()
      }
    },
  },

  // ============= 房间相关 =============
  rooms: {
    getAll: async (): Promise<Room[]> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        console.log('🏠 从本地存储获取房间列表')
        return await localDataService.rooms.getAll()
      } else {
        console.log('🌐 从服务器API获取房间列表')
        return await api.rooms.getAll()
      }
    },

    getById: async (id: string): Promise<Room | null> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.rooms.getById(id)
      } else {
        return await api.rooms.getById(id)
      }
    },

    create: async (roomData: Omit<Room, 'id'>): Promise<Room> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        console.log('🏠 在本地存储创建房间')
        return await localDataService.rooms.create(roomData)
      } else {
        console.log('🌐 在服务器创建房间')
        return await api.rooms.create(roomData)
      }
    },

    update: async (id: string, roomData: Partial<Room>): Promise<Room> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.rooms.update(id, roomData)
      } else {
        return await api.rooms.update(id, roomData)
      }
    },

    delete: async (id: string): Promise<void> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.rooms.delete(id)
      } else {
        return await api.rooms.delete(id)
      }
    },
  },

  // ============= 预订相关 =============
  reservations: {
    getAll: async (params?: { startDate?: string; endDate?: string; status?: string }): Promise<Reservation[]> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        console.log('🏠 从本地存储获取预订列表')
        return await localDataService.reservations.getAll(params)
      } else {
        console.log('🌐 从服务器API获取预订列表')
        return await api.reservations.getAll(params)
      }
    },

    getById: async (id: string): Promise<Reservation | null> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.reservations.getById(id)
      } else {
        return await api.reservations.getById(id)
      }
    },

    create: async (reservationData: any): Promise<Reservation> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        console.log('🏠 在本地存储创建预订')
        return await localDataService.reservations.create(reservationData)
      } else {
        console.log('🌐 在服务器创建预订')
        return await api.reservations.create(reservationData)
      }
    },

    update: async (id: string, reservationData: Partial<Reservation>): Promise<Reservation> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.reservations.update(id, reservationData)
      } else {
        return await api.reservations.update(id, reservationData)
      }
    },

    cancel: async (id: string): Promise<Reservation> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.reservations.cancel(id)
      } else {
        return await api.reservations.cancel(id)
      }
    },

    delete: async (id: string): Promise<void> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.reservations.delete(id)
      } else {
        // API暂不支持删除，可以后续添加
        throw new Error('API模式暂不支持删除预订')
      }
    },

    checkIn: async (id: string): Promise<Reservation> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.reservations.checkIn(id)
      } else {
        return await api.reservations.checkIn(id)
      }
    },

    checkOut: async (id: string): Promise<Reservation> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.reservations.checkOut(id)
      } else {
        return await api.reservations.checkOut(id)
      }
    },
  },

  // ============= 房态相关 =============
  roomStatus: {
    getByDateRange: async (startDate: string, endDate: string): Promise<RoomStatusData[]> => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        console.log('🏠 从本地存储获取房态')
        return await localDataService.roomStatus.getByDateRange(startDate, endDate)
      } else {
        console.log('🌐 从服务器API获取房态')
        return await api.roomStatus.getByDateRange(startDate, endDate)
      }
    },

    setDirty: async (roomId: string, date: string) => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.roomStatus.setDirty(roomId, date)
      } else {
        return await api.roomStatus.setDirty(roomId, date)
      }
    },

    setClean: async (roomId: string, date: string) => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.roomStatus.setClean(roomId, date)
      } else {
        return await api.roomStatus.setClean(roomId, date)
      }
    },

    closeRoom: async (roomId: string, startDate: string, endDate: string, note?: string) => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.roomStatus.closeRoom(roomId, startDate, endDate, note)
      } else {
        return await api.roomStatus.closeRoom(roomId, startDate, endDate, note)
      }
    },
  },

  // ============= 统计相关 =============
  statistics: {
    getDashboard: async () => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        console.log('🏠 从本地存储获取统计数据')
        return await localDataService.statistics.getDashboard()
      } else {
        console.log('🌐 从服务器API获取统计数据')
        return await api.statistics.getDashboard()
      }
    },

    getOccupancyRate: async (startDate: string, endDate: string) => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.statistics.getOccupancyRate(startDate, endDate)
      } else {
        return await api.statistics.getOccupancyRate(startDate, endDate)
      }
    },

    getRevenue: async (year: number, month: number) => {
      const useLocal = await shouldUseLocalStorage()
      if (useLocal) {
        return await localDataService.statistics.getRevenue(year, month)
      } else {
        return await api.statistics.getRevenue(year, month)
      }
    },
  },
}

// 导出开发者模式相关函数
export { getDeveloperModeConfig as getDevMode, setDeveloperMode as setDevMode }

export default dataService

