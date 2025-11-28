/**
 * 认证上下文
 * 管理全局认证状态
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { authService, User } from '../services/authService'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: { email: string; password: string; name: string; hotelName?: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

  // 检查认证状态
  const checkAuth = async () => {
    try {
      console.log('🔐 检查认证状态...')
      
      // 只检查本地是否有 token 和用户信息，不调用后端验证
      const token = await authService.getToken()
      const currentUser = await authService.getCurrentUser()
      
      if (token && currentUser) {
        setUser(currentUser)
        console.log('✅ 用户已登录:', currentUser?.email)
      } else {
        console.log('ℹ️ 用户未登录')
        setUser(null)
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // 初始化检查认证
  useEffect(() => {
    checkAuth()
  }, [])

  // 路由守卫：根据认证状态自动导航
  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === 'auth'

    if (!user && !inAuthGroup) {
      // 未登录且不在登录页，跳转到登录页
      console.log('🚫 未登录，跳转到登录页')
      router.replace('/auth/login')
    } else if (user && inAuthGroup) {
      // 已登录且在登录页，跳转到主页
      console.log('✅ 已登录，跳转到主页')
      router.replace('/(tabs)')
    }
  }, [user, segments, isLoading])

  // 登录
  const login = async (email: string, password: string) => {
    try {
      const result = await authService.login({ email, password })
      
      if (result.success && result.data) {
        setUser(result.data.user)
        console.log('✅ 登录成功:', result.data.user.email)
        // 登录成功后直接跳转，不再等待路由守卫
        setTimeout(() => {
          router.replace('/(tabs)')
        }, 100)
      }
      
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '登录失败',
      }
    }
  }

  // 注册
  const register = async (data: { email: string; password: string; name: string; hotelName?: string }) => {
    try {
      const result = await authService.register(data)
      
      if (result.success && result.data) {
        setUser(result.data.user)
        console.log('✅ 注册成功:', result.data.user.email)
        // 注册成功后直接跳转
        setTimeout(() => {
          router.replace('/(tabs)')
        }, 100)
      }
      
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '注册失败',
      }
    }
  }

  // 登出
  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      console.log('👋 已登出')
      router.replace('/auth/login')
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      console.log('🔄 用户信息已刷新')
    } catch (error) {
      console.error('刷新用户信息失败:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// 自定义 Hook
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth 必须在 AuthProvider 内使用')
  }
  
  return context
}

export default AuthContext

