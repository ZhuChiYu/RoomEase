import axios, { AxiosInstance, AxiosError } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { API_CONFIG } from '../config/environment'
import { getApiServerUrl } from './apiConfigService'

// 日志工具类
class APILogger {
  private enabled: boolean = API_CONFIG.ENABLE_LOGGING

  log(message: string, data?: any): void {
    if (!this.enabled) return
    const timestamp = new Date().toISOString()
    console.log(`[API LOG ${timestamp}] ${message}`, data || '')
  }

  error(message: string, error?: any): void {
    if (!this.enabled) return
    const timestamp = new Date().toISOString()
    console.error(`[API ERROR ${timestamp}] ${message}`, error || '')
  }

  success(message: string, data?: any): void {
    if (!this.enabled) return
    const timestamp = new Date().toISOString()
    console.log(`[API SUCCESS ${timestamp}] ✅ ${message}`, data || '')
  }

  request(method: string, url: string, data?: any): void {
    if (!this.enabled) return
    const timestamp = new Date().toISOString()
    console.log(`[API REQUEST ${timestamp}] 🚀 ${method.toUpperCase()} ${url}`, data || '')
  }

  response(method: string, url: string, status: number, duration: number): void {
    if (!this.enabled) return
    const timestamp = new Date().toISOString()
    console.log(`[API RESPONSE ${timestamp}] ✅ ${method.toUpperCase()} ${url} - ${status} (${duration}ms)`)
  }
}

const logger = new APILogger()

// API Base URL - 从环境配置读取（初始值，会在运行时更新）
let API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || API_CONFIG.BASE_URL

// 记录API基础信息
logger.log('API服务初始化', {
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  enableLogging: API_CONFIG.ENABLE_LOGGING,
})

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 异步加载保存的服务器地址
getApiServerUrl().then(url => {
  API_BASE_URL = url
  apiClient.defaults.baseURL = url
  logger.log('API服务器地址已更新', { baseURL: url })
}).catch(err => {
  logger.error('加载API服务器地址失败', err)
})

// 请求拦截器 - 添加认证token和日志
apiClient.interceptors.request.use(
  async (config) => {
    // 记录请求开始时间
    config.metadata = { startTime: new Date().getTime() }
    
    try {
      // 使用与authService相同的key: @auth_token
      const token = await AsyncStorage.getItem('@auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        logger.log('已添加认证Token')
      } else {
        logger.log('未找到认证Token')
      }
    } catch (error) {
      logger.error('获取认证Token失败', error)
    }

    // 记录请求详情
    logger.request(
      config.method || 'GET',
      config.url || '',
      config.data
    )

    return config
  },
  (error) => {
    logger.error('请求拦截器错误', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误和日志
apiClient.interceptors.response.use(
  (response) => {
    // 计算请求耗时
    const duration = new Date().getTime() - (response.config.metadata?.startTime || 0)
    
    logger.response(
      response.config.method || 'GET',
      response.config.url || '',
      response.status,
      duration
    )
    
    logger.success('请求成功', {
      url: response.config.url,
      status: response.status,
      dataSize: JSON.stringify(response.data).length,
    })
    
    // 对于认证相关的请求，打印完整响应数据以便调试
    if (response.config.url?.includes('/auth/')) {
      logger.log('🔍 认证接口响应数据', {
        url: response.config.url,
        data: response.data,
      })
      
      // 如果响应中包含新的token，自动保存
      if (response.data?.token || response.data?.accessToken) {
        const newToken = response.data.token || response.data.accessToken
        AsyncStorage.setItem('@auth_token', newToken).then(() => {
          logger.log('✅ 已更新Token')
        }).catch(err => {
          logger.error('保存Token失败', err)
        })
      }
      
      // 如果有refreshToken，也保存起来
      if (response.data?.refreshToken) {
        AsyncStorage.setItem('@refresh_token', response.data.refreshToken).catch(err => {
          logger.error('保存RefreshToken失败', err)
        })
      }
    }
    
    return response
  },
  async (error: AxiosError) => {
    const duration = new Date().getTime() - (error.config?.metadata?.startTime || 0)
    const originalRequest = error.config
    
    // 记录错误详情
    if (error.response) {
      // 服务器返回错误响应
      logger.error('服务器响应错误', {
        url: error.config?.url,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        duration: `${duration}ms`,
      })
    } else if (error.request) {
      // 请求已发送但没有收到响应
      logger.error('网络连接错误 - 无法连接到服务器', {
        url: error.config?.url,
        message: error.message,
        baseURL: API_BASE_URL,
        duration: `${duration}ms`,
      })
    } else {
      // 请求配置出错
      logger.error('请求配置错误', {
        message: error.message,
      })
    }

    // 处理401错误 - Token过期或无效
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      logger.log('🔄 检测到401错误，尝试刷新Token...')
      
      // 标记该请求已重试，避免无限循环
      (originalRequest as any)._retry = true
      
      try {
        // 尝试使用refreshToken获取新的accessToken
        const refreshToken = await AsyncStorage.getItem('@refresh_token')
        
        if (refreshToken) {
          logger.log('📤 正在使用RefreshToken刷新...')
          
          // 调用刷新接口
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            {
              headers: { 'Content-Type': 'application/json' }
            }
          )
          
          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data
          
          if (accessToken) {
            // 保存新的tokens
            await AsyncStorage.setItem('@auth_token', accessToken)
            if (newRefreshToken) {
              await AsyncStorage.setItem('@refresh_token', newRefreshToken)
            }
            
            logger.success('✅ Token刷新成功，重试原请求')
            
            // 更新原请求的Authorization header
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
            }
            
            // 重试原请求
            return apiClient(originalRequest)
          }
        } else {
          logger.log('⚠️ 未找到RefreshToken')
        }
      } catch (refreshError: any) {
        logger.error('❌ Token刷新失败', refreshError)
        
        // 刷新失败，清除所有认证信息
        await AsyncStorage.removeItem('@auth_token')
        await AsyncStorage.removeItem('@refresh_token')
        
        // 转换为中文错误消息
        error.message = '登录已过期，请重新登录'
        return Promise.reject(error)
      }
    }
    
    // 转换错误消息为中文
    if (error.response) {
      const status = error.response.status
      const serverMessage = (error.response.data as any)?.message || (error.response.data as any)?.error
      
      // 根据状态码提供中文错误提示
      switch (status) {
        case 400:
          error.message = serverMessage || '请求参数错误'
          break
        case 401:
          error.message = serverMessage || '登录已过期，请重新登录'
          break
        case 403:
          error.message = serverMessage || '没有权限执行此操作'
          break
        case 404:
          error.message = serverMessage || '请求的资源不存在'
          break
        case 409:
          error.message = serverMessage || '数据冲突，请刷新后重试'
          break
        case 422:
          error.message = serverMessage || '数据验证失败'
          break
        case 500:
          error.message = serverMessage || '服务器内部错误，请稍后重试'
          break
        case 502:
        case 503:
        case 504:
          error.message = serverMessage || '服务暂时不可用，请稍后重试'
          break
        default:
          error.message = serverMessage || `请求失败 (${status})`
      }
    } else if (error.request) {
      // 网络错误
      if (error.code === 'ECONNABORTED') {
        error.message = '请求超时，请检查网络连接'
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        error.message = '无法连接到服务器，请检查网络设置'
      } else {
        error.message = '网络连接失败，请检查网络后重试'
      }
    } else {
      error.message = error.message || '未知错误，请重试'
    }
    
    logger.error('最终错误消息', error.message)
    
    return Promise.reject(error)
  }
)

// 扩展AxiosRequestConfig类型以支持metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number
    }
  }
}

// 健康检查和连接测试
export const healthCheck = async () => {
  logger.log('🏥 开始服务器健康检查...')
  logger.log('目标服务器', { baseURL: apiClient.defaults.baseURL || API_BASE_URL })
  
  try {
    const startTime = Date.now()
    const response = await apiClient.get('/health', {
      timeout: 5000, // 5秒超时
    })
    const duration = Date.now() - startTime
    
    logger.success('服务器健康检查成功', {
      status: response.status,
      data: response.data,
      duration: `${duration}ms`,
      server: apiClient.defaults.baseURL || API_BASE_URL,
    })
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      duration,
      server: apiClient.defaults.baseURL || API_BASE_URL,
    }
  } catch (error: any) {
    logger.error('服务器健康检查失败', {
      message: error.message,
      code: error.code,
      server: apiClient.defaults.baseURL || API_BASE_URL,
    })
    
    return {
      success: false,
      error: error.message,
      code: error.code,
      server: apiClient.defaults.baseURL || API_BASE_URL,
    }
  }
}

// 测试API连接
export const testConnection = async () => {
  logger.log('🔌 测试API连接...')
  
  const results = {
    health: await healthCheck(),
    timestamp: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
  }
  
  logger.log('连接测试完成', results)
  return results
}

// 更新API服务器地址
export const updateApiBaseUrl = async (newUrl: string) => {
  logger.log('更新API服务器地址', { oldUrl: API_BASE_URL, newUrl })
  
  API_BASE_URL = newUrl
  apiClient.defaults.baseURL = newUrl
  
  logger.success('API服务器地址已更新', { baseURL: newUrl })
}

// 获取当前API服务器地址
export const getCurrentApiUrl = () => {
  return apiClient.defaults.baseURL || API_BASE_URL
}

// API接口定义
export const api = {
  // 健康检查
  health: {
    check: healthCheck,
    test: testConnection,
  },

  // 认证相关
  auth: {
    login: async (email: string, password: string) => {
      const response = await apiClient.post('/auth/login', { email, password })
      
      // 打印完整响应，方便调试
      logger.log('📦 登录接口原始响应', {
        data: response.data,
        status: response.status,
      })
      
      // 尝试从不同位置获取 token
      const token = response.data?.token || 
                   response.data?.accessToken || 
                   response.data?.access_token ||
                   response.data?.data?.token
      
      const refreshToken = response.data?.refreshToken || 
                          response.data?.refresh_token
      
      if (token) {
        logger.log('✅ 找到Token，准备保存', { tokenLength: token.length })
        await AsyncStorage.setItem('@auth_token', token)
        
        // 保存refreshToken用于自动刷新
        if (refreshToken) {
          logger.log('✅ 找到RefreshToken，准备保存')
          await AsyncStorage.setItem('@refresh_token', refreshToken)
        }
      } else {
        logger.log('⚠️ 响应中未找到Token', response.data)
      }
      
      return response.data
    },
    register: async (data: { email: string; password: string; name: string; hotelName?: string }) => {
      const response = await apiClient.post('/auth/register', data)
      
      // 打印完整响应，方便调试
      logger.log('📦 注册接口原始响应', {
        data: response.data,
        status: response.status,
        headers: response.headers,
      })
      
      // 尝试从不同位置获取 token
      const token = response.data?.token || 
                   response.data?.accessToken || 
                   response.data?.access_token ||
                   response.data?.data?.token
      
      const refreshToken = response.data?.refreshToken || 
                          response.data?.refresh_token
      
      if (token) {
        logger.log('✅ 找到Token，准备保存', { tokenLength: token.length })
        await AsyncStorage.setItem('@auth_token', token)
        
        // 保存refreshToken用于自动刷新
        if (refreshToken) {
          logger.log('✅ 找到RefreshToken，准备保存')
          await AsyncStorage.setItem('@refresh_token', refreshToken)
        }
      } else {
        logger.log('⚠️ 响应中未找到Token', response.data)
      }
      
      return response.data
    },
    logout: async () => {
      try {
        await apiClient.post('/auth/logout')
      } catch (error) {
        // 忽略后端登出错误
      }
      await AsyncStorage.removeItem('@auth_token')
      await AsyncStorage.removeItem('@refresh_token')
    },
    getCurrentUser: async () => {
      const response = await apiClient.get('/auth/me')
      return response.data
    },
    refreshToken: async () => {
      const refreshToken = await AsyncStorage.getItem('@refresh_token')
      if (!refreshToken) {
        throw new Error('未找到刷新令牌')
      }
      const response = await apiClient.post('/auth/refresh', { refreshToken })
      return response.data
    },
  },

  // 房间相关
  rooms: {
    getAll: async (propertyId?: string) => {
      const response = await apiClient.get('/rooms', {
        params: propertyId ? { propertyId } : undefined
      })
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
      const response = await apiClient.patch(`/reservations/${id}`, reservationData)
      return response.data
    },
    cancel: async (id: string) => {
      const response = await apiClient.post(`/reservations/${id}/cancel`)
      return response.data
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/reservations/${id}`)
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

  // 房态相关（使用calendar端点）
  roomStatus: {
    getByDateRange: async (startDate: string, endDate: string, propertyId: string = 'demo-property') => {
      const response = await apiClient.get('/calendar', {
        params: { propertyId, startDate, endDate },
      })
      
      // 后端返回 { rooms, reservations, overrides }
      // 需要转换为前端期望的 roomStatuses 数组格式
      const { reservations = [], overrides = [] } = response.data || {}
      
      // 根据预订和覆盖数据生成房态数组
      const roomStatuses: any[] = []
      
      // 从预订生成房态
      reservations.forEach((reservation: any) => {
        const checkIn = new Date(reservation.checkInDate)
        const checkOut = new Date(reservation.checkOutDate)
        const currentDate = new Date(checkIn)
        
        while (currentDate < checkOut) {
          roomStatuses.push({
            roomId: reservation.roomId,
            date: currentDate.toISOString().split('T')[0],
            status: reservation.status === 'CHECKED_IN' ? 'occupied' : 'reserved',
            reservationId: reservation.id
          })
          currentDate.setDate(currentDate.getDate() + 1)
        }
      })
      
      // 从覆盖数据添加关房状态
      overrides.forEach((override: any) => {
        if (override.isBlocked) {
          roomStatuses.push({
            roomId: override.roomId,
            date: new Date(override.date).toISOString().split('T')[0],
            status: 'blocked',
            reason: override.reason
          })
        }
      })
      
      return roomStatuses
    },
    setDirty: async (roomId: string, date: string) => {
      // 后端暂未实现，返回成功
      return { success: true, roomId, date, status: 'dirty' }
    },
    setClean: async (roomId: string, date: string) => {
      // 后端暂未实现，返回成功
      return { success: true, roomId, date, status: 'clean' }
    },
    closeRoom: async (roomId: string, startDate: string, endDate: string, note?: string) => {
      const response = await apiClient.post('/calendar/block', {
        roomId,
        startDate,
        endDate,
        reason: note,
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

// 导出日志工具
export { logger }

export default apiClient


