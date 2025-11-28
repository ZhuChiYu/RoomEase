/**
 * API配置服务
 * 用于动态管理API服务器地址
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_SERVERS, API_CONFIG } from '../config/environment'

const API_SERVER_KEY = '@api_server_url'

/**
 * 获取当前API服务器地址
 */
export async function getApiServerUrl(): Promise<string> {
  try {
    const savedUrl = await AsyncStorage.getItem(API_SERVER_KEY)
    return savedUrl || API_CONFIG.BASE_URL
  } catch (error) {
    console.error('获取API服务器地址失败:', error)
    return API_CONFIG.BASE_URL
  }
}

/**
 * 设置API服务器地址
 */
export async function setApiServerUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(API_SERVER_KEY, url)
    console.log('API服务器地址已更新:', url)
  } catch (error) {
    console.error('设置API服务器地址失败:', error)
    throw error
  }
}

/**
 * 重置为默认API服务器地址
 */
export async function resetApiServerUrl(): Promise<void> {
  try {
    await AsyncStorage.removeItem(API_SERVER_KEY)
    console.log('API服务器地址已重置为默认值')
  } catch (error) {
    console.error('重置API服务器地址失败:', error)
    throw error
  }
}

/**
 * 获取所有可用的服务器选项
 */
export function getAvailableServers() {
  return [
    {
      id: 'DOMAIN',
      name: '正式服务器（推荐）',
      url: API_SERVERS.DOMAIN,
      description: 'HTTPS 加密连接 - www.englishpartner.cn ✅',
      recommended: true,
    },
    {
      id: 'REMOTE_NGINX',
      name: '备用服务器',
      url: API_SERVERS.REMOTE_NGINX,
      description: 'HTTPS 加密连接（备用）',
      recommended: false,
    },
    {
      id: 'LOCAL_DEV',
      name: '本地开发服务器',
      url: API_SERVERS.LOCAL_DEV,
      description: '局域网开发环境（仅限同一WiFi）',
      recommended: false,
    },
    {
      id: 'REMOTE_DIRECT',
      name: '远程服务器（直连）',
      url: API_SERVERS.REMOTE_DIRECT,
      description: '腾讯云服务器 - HTTP 直接连接',
      recommended: false,
    },
  ]
}

/**
 * 验证URL格式
 */
export function validateServerUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

