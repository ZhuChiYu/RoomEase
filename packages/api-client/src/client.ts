import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { ApiResponse } from '@roomease/shared'

// API 客户端配置
export interface ApiClientConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
}

// 认证令牌管理
class TokenManager {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('access_token')
    }
    return this.accessToken
  }

  getRefreshToken(): string | null {
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem('refresh_token')
    }
    return this.refreshToken
  }

  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

// API 客户端类
export class ApiClient {
  private client: AxiosInstance
  private tokenManager: TokenManager
  private baseURL: string

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL
    this.tokenManager = new TokenManager()
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器 - 添加认证头
    this.client.interceptors.request.use((config) => {
      const token = this.tokenManager.getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // 响应拦截器 - 处理令牌刷新
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = this.tokenManager.getRefreshToken()
            if (refreshToken) {
              const response = await axios.post(`${this.baseURL}/auth/refresh`, {
                refreshToken
              })

              const { accessToken, refreshToken: newRefreshToken } = response.data.data
              this.tokenManager.setTokens(accessToken, newRefreshToken)

              // 重试原始请求
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // 刷新失败，清除令牌并重定向到登录
            this.tokenManager.clearTokens()
            window.location.href = '/login'
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // 通用请求方法
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client(config)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
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
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
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
      this.tokenManager.setTokens(accessToken, refreshToken)
    }
    
    return response
  }

  async logout() {
    try {
      await this.post('/auth/logout')
    } finally {
      this.tokenManager.clearTokens()
    }
  }

  // 获取当前用户信息
  async getCurrentUser() {
    return this.get('/auth/profile')
  }
}

// 默认客户端实例
const defaultConfig: ApiClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
}

export const apiClient = new ApiClient(defaultConfig) 