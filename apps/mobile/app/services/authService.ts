/**
 * 认证服务
 * 处理用户登录、注册、登出等认证相关功能
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { api, logger } from './api'
import accountHistoryService from './accountHistoryService'

const TOKEN_KEY = '@auth_token'
const USER_KEY = '@auth_user'
const PROPERTY_ID_KEY = '@property_id'

export interface User {
  id: string
  email: string
  name: string
  role: string
  tenantId?: string
  propertyId?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  hotelName?: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    token: string
  }
  error?: string
}

class AuthService {
  /**
   * 登录
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      logger.log('🔐 开始登录...', { email: credentials.email })
      
      const response = await api.auth.login(credentials.email, credentials.password)
      
      // 打印完整响应以便调试
      logger.log('登录响应数据', response)
      
      // 适配不同的响应格式
      const token = response.token || response.accessToken || response.access_token
      const userData = response.user || response.data?.user || response
      
      if (token && userData) {
        // 保存token和用户信息
        await this.saveAuthData(token, userData)
        
        // 保存propertyId（如果有）
        if (userData.propertyId) {
          await AsyncStorage.setItem(PROPERTY_ID_KEY, userData.propertyId)
          logger.log('✅ 已保存propertyId:', userData.propertyId)
        }
        
        logger.success('登录成功', { user: userData })
        
        return {
          success: true,
          data: {
            token,
            user: userData,
          },
        }
      } else {
        logger.error('登录响应数据格式错误', response)
        throw new Error('登录响应数据格式错误')
      }
    } catch (error: any) {
      logger.error('登录失败', error)
      
      // 从error.message中获取中文错误消息（已被api.ts转换过）
      let errorMessage = error.message || '登录失败，请检查用户名和密码'
      
      // 如果error.message还是英文，尝试从response中获取
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * 注册
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      logger.log('📝 开始注册...', { email: data.email })
      
      const response = await api.auth.register(data)
      
      // 打印完整响应以便调试
      logger.log('注册响应数据', response)
      
      // 适配不同的响应格式
      const token = response.token || response.accessToken || response.access_token
      const userData = response.user || response.data?.user || response
      
      if (token && userData) {
        // 自动登录
        await this.saveAuthData(token, userData)
        
        // 保存propertyId（如果有）
        if (userData.propertyId) {
          await AsyncStorage.setItem(PROPERTY_ID_KEY, userData.propertyId)
          logger.log('✅ 已保存propertyId:', userData.propertyId)
        }
        
        logger.success('注册成功', { user: userData })
        
        return {
          success: true,
          data: {
            token,
            user: userData,
          },
        }
      } else {
        logger.error('注册响应数据格式错误', response)
        throw new Error('注册响应数据格式错误，请检查服务器返回')
      }
    } catch (error: any) {
      logger.error('注册失败', error)
      
      // 从error.message中获取中文错误消息（已被api.ts转换过）
      let errorMessage = error.message || '注册失败，请稍后重试'
      
      // 如果error.message还是英文，尝试从response中获取
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      logger.log('👋 登出中...')
      
      // 调用后端登出接口（可选）
      try {
        await api.auth.logout()
      } catch (error) {
        // 忽略后端登出错误
        logger.error('后端登出失败，继续本地登出', error)
      }
      
      // 清除本地存储
      await this.clearAuthData()
      
      logger.success('登出成功')
    } catch (error) {
      logger.error('登出失败', error)
      throw error
    }
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY)
      if (userJson) {
        return JSON.parse(userJson)
      }
      return null
    } catch (error) {
      logger.error('获取当前用户失败', error)
      return null
    }
  }

  /**
   * 获取认证token
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY)
    } catch (error) {
      logger.error('获取token失败', error)
      return null
    }
  }

  /**
   * 检查是否已登录
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken()
    return !!token
  }

  /**
   * 验证token是否有效
   */
  async validateToken(): Promise<boolean> {
    try {
      const token = await this.getToken()
      if (!token) {
        return false
      }

      // 调用后端验证token
      const response = await api.auth.getCurrentUser()
      
      if (response && response.id) {
        // 更新用户信息
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response))
        return true
      }
      
      return false
    } catch (error) {
      logger.error('Token验证失败', error)
      // 如果验证失败，清除认证数据
      await this.clearAuthData()
      return false
    }
  }

  /**
   * 保存认证数据
   */
  private async saveAuthData(token: string, user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token)
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
      
      logger.log('认证数据已保存')
    } catch (error) {
      logger.error('保存认证数据失败', error)
      throw error
    }
  }

  /**
   * 清除认证数据
   */
  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY)
      await AsyncStorage.removeItem(USER_KEY)
      await AsyncStorage.removeItem(PROPERTY_ID_KEY)
      await AsyncStorage.removeItem('@refresh_token') // 也清除refresh token
      
      logger.log('认证数据已清除')
    } catch (error) {
      logger.error('清除认证数据失败', error)
      throw error
    }
  }

  /**
   * 获取propertyId
   */
  async getPropertyId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PROPERTY_ID_KEY)
    } catch (error) {
      logger.error('获取propertyId失败', error)
      return null
    }
  }

  /**
   * 刷新token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const response = await api.auth.refreshToken()
      
      if (response && response.token) {
        await AsyncStorage.setItem(TOKEN_KEY, response.token)
        logger.success('Token刷新成功')
        return true
      }
      
      return false
    } catch (error) {
      logger.error('Token刷新失败', error)
      return false
    }
  }
}

// 导出单例
export const authService = new AuthService()

// 默认导出
export default authService

