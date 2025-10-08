/**
 * Mobile App API客户端
 * 适配React Native环境，使用AsyncStorage存储令牌
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_CONFIG } from '../config/environment'

// API配置 - 使用environment.ts中的配置
const API_BASE_URL = API_CONFIG.BASE_URL

// 令牌管理
class TokenManager {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  async setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    await AsyncStorage.setItem('access_token', accessToken)
    await AsyncStorage.setItem('refresh_token', refreshToken)
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      this.accessToken = await AsyncStorage.getItem('access_token')
    }
    return this.accessToken
  }

  async getRefreshToken(): Promise<string | null> {
    if (!this.refreshToken) {
      this.refreshToken = await AsyncStorage.getItem('refresh_token')
    }
    return this.refreshToken
  }

  async clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    await AsyncStorage.removeItem('access_token')
    await AsyncStorage.removeItem('refresh_token')
  }
}

// API响应类型
export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

// API客户端类
class ApiClient {
  private client: AxiosInstance
  private tokenManager: TokenManager
  private baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
    this.tokenManager = new TokenManager()
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器 - 添加认证头
    this.client.interceptors.request.use(async (config) => {
      const token = await this.tokenManager.getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      // 开发环境打印请求日志
      if (__DEV__) {
        console.log('📤 API请求:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`,
          data: config.data,
          params: config.params,
          hasToken: !!token
        })
      }
      
      return config
    })

    // 响应拦截器 - 处理令牌刷新
    this.client.interceptors.response.use(
      (response) => {
        // 开发环境打印响应日志
        if (__DEV__) {
          console.log('📥 API响应:', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            data: response.data
          })
        }
        return response
      },
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = await this.tokenManager.getRefreshToken()
            if (refreshToken) {
              const response = await axios.post(`${this.baseURL}/auth/refresh`, {
                refreshToken
              })

              const { accessToken, refreshToken: newRefreshToken } = response.data
              await this.tokenManager.setTokens(accessToken, newRefreshToken)

              // 重试原始请求
              console.log('🔄 Token刷新成功，重试请求')
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // 刷新失败，清除令牌
            console.log('❌ Token刷新失败，清除令牌')
            await this.tokenManager.clearTokens()
            // 可以在这里触发登出事件
          }
        }

        // 打印错误日志
        if (__DEV__) {
          console.error('❌ API错误:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            message: error.message,
            data: error.response?.data
          })
        }

        return Promise.reject(error)
      }
    )
  }

  // 通用请求方法
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client(config)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.message || error.response.data.error || '请求失败',
          ...error.response.data
        }
      }
      
      return {
        success: false,
        error: error.message || '网络错误'
      }
    }
  }

  // GET 请求
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url })
  }

  // POST 请求
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data })
  }

  // PUT 请求
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data })
  }

  // PATCH 请求
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data })
  }

  // DELETE 请求
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url })
  }

  // 文件上传
  async upload<T = any>(url: string, file: any, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
  }

  // 认证方法
  async login(email: string, password: string) {
    const response = await this.post('/auth/login', { email, password })
    
    if (response.success && response.data) {
      const { accessToken, refreshToken } = response.data
      await this.tokenManager.setTokens(accessToken, refreshToken)
    }
    
    return response
  }

  async logout() {
    try {
      await this.post('/auth/logout')
    } finally {
      await this.tokenManager.clearTokens()
    }
  }

  // 获取当前用户信息
  async getCurrentUser() {
    return this.get('/auth/profile')
  }

  // 获取令牌管理器（用于外部访问）
  getTokenManager() {
    return this.tokenManager
  }
}

// 导出单例实例
export const apiClient = new ApiClient()
export default apiClient

