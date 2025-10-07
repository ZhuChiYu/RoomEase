import axios, { AxiosInstance, AxiosError } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

// API Base URL - 可以根据环境变量配置
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000'

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Failed to get auth token:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地token
      await AsyncStorage.removeItem('auth_token')
      // 可以在这里触发导航到登录页面
    }
    return Promise.reject(error)
  }
)

// API接口定义
export const api = {
  // 认证相关
  auth: {
    login: async (email: string, password: string) => {
      const response = await apiClient.post('/auth/login', { email, password })
      if (response.data.token) {
        await AsyncStorage.setItem('auth_token', response.data.token)
      }
      return response.data
    },
    logout: async () => {
      await AsyncStorage.removeItem('auth_token')
    },
    getCurrentUser: async () => {
      const response = await apiClient.get('/auth/me')
      return response.data
    },
  },

  // 房间相关
  rooms: {
    getAll: async () => {
      const response = await apiClient.get('/rooms')
      return response.data
    },
    getById: async (id: string) => {
      const response = await apiClient.get(`/rooms/${id}`)
      return response.data
    },
    create: async (roomData: any) => {
      const response = await apiClient.post('/rooms', roomData)
      return response.data
    },
    update: async (id: string, roomData: any) => {
      const response = await apiClient.put(`/rooms/${id}`, roomData)
      return response.data
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/rooms/${id}`)
      return response.data
    },
  },

  // 预订相关
  reservations: {
    getAll: async (params?: { startDate?: string; endDate?: string; status?: string }) => {
      const response = await apiClient.get('/reservations', { params })
      return response.data
    },
    getById: async (id: string) => {
      const response = await apiClient.get(`/reservations/${id}`)
      return response.data
    },
    create: async (reservationData: any) => {
      const response = await apiClient.post('/reservations', reservationData)
      return response.data
    },
    update: async (id: string, reservationData: any) => {
      const response = await apiClient.put(`/reservations/${id}`, reservationData)
      return response.data
    },
    cancel: async (id: string) => {
      const response = await apiClient.post(`/reservations/${id}/cancel`)
      return response.data
    },
    checkIn: async (id: string) => {
      const response = await apiClient.post(`/reservations/${id}/check-in`)
      return response.data
    },
    checkOut: async (id: string) => {
      const response = await apiClient.post(`/reservations/${id}/check-out`)
      return response.data
    },
  },

  // 房态相关
  roomStatus: {
    getByDateRange: async (startDate: string, endDate: string) => {
      const response = await apiClient.get('/room-status', {
        params: { startDate, endDate },
      })
      return response.data
    },
    setDirty: async (roomId: string, date: string) => {
      const response = await apiClient.post('/room-status/dirty', { roomId, date })
      return response.data
    },
    setClean: async (roomId: string, date: string) => {
      const response = await apiClient.post('/room-status/clean', { roomId, date })
      return response.data
    },
    closeRoom: async (roomId: string, startDate: string, endDate: string, note?: string) => {
      const response = await apiClient.post('/room-status/close', {
        roomId,
        startDate,
        endDate,
        note,
      })
      return response.data
    },
  },

  // 统计相关
  statistics: {
    getDashboard: async () => {
      const response = await apiClient.get('/statistics/dashboard')
      return response.data
    },
    getOccupancyRate: async (startDate: string, endDate: string) => {
      const response = await apiClient.get('/statistics/occupancy-rate', {
        params: { startDate, endDate },
      })
      return response.data
    },
    getRevenue: async (year: number, month: number) => {
      const response = await apiClient.get('/statistics/revenue', {
        params: { year, month },
      })
      return response.data
    },
  },
}

export default apiClient

