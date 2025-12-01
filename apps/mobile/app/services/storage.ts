import AsyncStorage from '@react-native-async-storage/async-storage'

// 存储键定义
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  ROOMS_CACHE: 'rooms_cache',
  RESERVATIONS_CACHE: 'reservations_cache',
  ROOM_STATUS_CACHE: 'room_status_cache',
  LAST_SYNC_TIME: 'last_sync_time',
  APP_SETTINGS: 'app_settings',
}

// 通用存储工具
export const storage = {
  // 保存字符串
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (error) {
      console.error(`Error saving ${key}:`, error)
      throw error
    }
  },

  // 获取字符串
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key)
    } catch (error) {
      console.error(`Error getting ${key}:`, error)
      return null
    }
  },

  // 保存对象
  setObject: async (key: string, value: any): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value)
      await AsyncStorage.setItem(key, jsonValue)
    } catch (error) {
      console.error(`Error saving object ${key}:`, error)
      throw error
    }
  },

  // 获取对象
  getObject: async <T = any>(key: string): Promise<T | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(key)
      return jsonValue != null ? JSON.parse(jsonValue) : null
    } catch (error) {
      console.error(`Error getting object ${key}:`, error)
      return null
    }
  },

  // 删除项
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing ${key}:`, error)
      throw error
    }
  },

  // 清除所有数据
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear()
    } catch (error) {
      console.error('Error clearing storage:', error)
      throw error
    }
  },

  // 获取所有键
  getAllKeys: async (): Promise<string[]> => {
    try {
      return await AsyncStorage.getAllKeys()
    } catch (error) {
      console.error('Error getting all keys:', error)
      return []
    }
  },

  // 批量获取
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    try {
      return await AsyncStorage.multiGet(keys)
    } catch (error) {
      console.error('Error in multiGet:', error)
      return []
    }
  },

  // 批量设置
  multiSet: async (keyValuePairs: [string, string][]): Promise<void> => {
    try {
      await AsyncStorage.multiSet(keyValuePairs)
    } catch (error) {
      console.error('Error in multiSet:', error)
      throw error
    }
  },
}

// 特定业务的存储工具
export const authStorage = {
  saveToken: async (token: string) => {
    await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
  },

  getToken: async (): Promise<string | null> => {
    return await storage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  },

  removeToken: async () => {
    await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  },

  saveUserInfo: async (userInfo: any) => {
    await storage.setObject(STORAGE_KEYS.USER_INFO, userInfo)
  },

  getUserInfo: async (): Promise<any | null> => {
    return await storage.getObject(STORAGE_KEYS.USER_INFO)
  },

  getSettings: async (): Promise<any | null> => {
    return await storage.getObject('@user_settings')
  },

  saveSettings: async (settings: any) => {
    await storage.setObject('@user_settings', settings)
  },

  clearAuth: async () => {
    await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    await storage.removeItem(STORAGE_KEYS.USER_INFO)
  },

  clearAll: async () => {
    await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    await storage.removeItem(STORAGE_KEYS.USER_INFO)
    await storage.removeItem('@user_settings')
  },
}

// 缓存管理
export const cacheStorage = {
  saveRooms: async (rooms: any[]) => {
    await storage.setObject(STORAGE_KEYS.ROOMS_CACHE, rooms)
    await storage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, new Date().toISOString())
  },

  getRooms: async (): Promise<any[] | null> => {
    return await storage.getObject(STORAGE_KEYS.ROOMS_CACHE)
  },

  saveReservations: async (reservations: any[]) => {
    await storage.setObject(STORAGE_KEYS.RESERVATIONS_CACHE, reservations)
  },

  getReservations: async (): Promise<any[] | null> => {
    return await storage.getObject(STORAGE_KEYS.RESERVATIONS_CACHE)
  },

  saveRoomStatuses: async (statuses: any[]) => {
    await storage.setObject(STORAGE_KEYS.ROOM_STATUS_CACHE, statuses)
  },

  getRoomStatuses: async (): Promise<any[] | null> => {
    return await storage.getObject(STORAGE_KEYS.ROOM_STATUS_CACHE)
  },

  getLastSyncTime: async (): Promise<string | null> => {
    return await storage.getItem(STORAGE_KEYS.LAST_SYNC_TIME)
  },

  clearCache: async () => {
    await storage.removeItem(STORAGE_KEYS.ROOMS_CACHE)
    await storage.removeItem(STORAGE_KEYS.RESERVATIONS_CACHE)
    await storage.removeItem(STORAGE_KEYS.ROOM_STATUS_CACHE)
    await storage.removeItem(STORAGE_KEYS.LAST_SYNC_TIME)
  },
}

// 应用设置
export const settingsStorage = {
  saveSettings: async (settings: any) => {
    await storage.setObject(STORAGE_KEYS.APP_SETTINGS, settings)
  },

  getSettings: async (): Promise<any | null> => {
    return await storage.getObject(STORAGE_KEYS.APP_SETTINGS)
  },
}

// Redux状态持久化
export const persistedStorage = {
  // 保存完整的Redux状态
  saveState: async (state: any) => {
    try {
      await storage.setObject('redux_persisted_state', state)
      await storage.setItem('last_persist_time', new Date().toISOString())
    } catch (error) {
      console.error('Error persisting state:', error)
    }
  },

  // 获取持久化的Redux状态
  getState: async (): Promise<any | null> => {
    try {
      return await storage.getObject('redux_persisted_state')
    } catch (error) {
      console.error('Error loading persisted state:', error)
      return null
    }
  },

  // 清除持久化状态
  clearState: async () => {
    await storage.removeItem('redux_persisted_state')
    await storage.removeItem('last_persist_time')
  },

  // 获取最后持久化时间
  getLastPersistTime: async (): Promise<string | null> => {
    return await storage.getItem('last_persist_time')
  },
}

export default storage

