/**
 * 环境配置
 * 
 * 注意：开发者模式（本地存储 vs 服务器API）现在通过 dataService.ts 动态控制
 * 可以在应用内的"开发者设置"页面实时切换
 */

import { Platform } from 'react-native'

// 判断是否为开发环境
export const isDev = __DEV__

// API配置
export const API_CONFIG = {
  // API基础URL
  BASE_URL: isDev 
    ? 'http://192.168.31.221:4000' // 开发环境 - 使用局域网IP（移动设备无法访问localhost）
    : 'http://111.230.110.95', // 生产环境 - 腾讯云服务器
    // : 'https://www.englishpartner.cn', // 生产环境 - 使用域名（配置SSL后）
  
  // 备用API地址（如果主地址连接失败）
  FALLBACK_URL: 'http://localhost:4000',
  
  // 请求超时时间（毫秒）
  TIMEOUT: 30000,
  
  // 是否启用API日志
  ENABLE_LOGGING: isDev,
  
  // 最大重试次数
  MAX_RETRIES: 3,
}

// 功能开关
export const FEATURE_FLAGS = {
  // 是否启用数据备份（导入/导出功能）
  ENABLE_DATA_BACKUP: true,
  
  // 是否启用通知
  ENABLE_NOTIFICATIONS: true,
  
  // 是否启用OCR识别
  ENABLE_OCR: false,
  
  // 是否显示开发者选项卡
  SHOW_DEVELOPER_TAB: true,
  
  // 是否启用数据同步
  ENABLE_DATA_SYNC: false,
}

// 应用配置
export const APP_CONFIG = {
  // 应用名称（中文）
  APP_NAME: '客满云',
  
  // 应用名称（英文）
  APP_NAME_EN: 'KemanCloud',
  
  // 应用全称
  APP_FULL_NAME: 'KemanCloud · Hotel & BnB Manager',
  
  // 版本号
  VERSION: '1.0.0',
  
  // 构建号
  BUILD_NUMBER: '1',
  
  // Bundle标识符
  BUNDLE_ID: 'com.kemancloud.mobile',
  
  // Apple Developer账号
  APPLE_DEVELOPER_EMAIL: 'zhu.cy@outlook.com',
  
  // 默认租户（首次启动时使用）
  DEFAULT_TENANT: 'default-hotel',
  
  // 默认物业ID（用于API调用）
  DEFAULT_PROPERTY_ID: '', // 登录后会自动获取
  
  // 支持的语言
  SUPPORTED_LANGUAGES: ['zh-CN', 'en-US'],
  
  // 默认语言
  DEFAULT_LANGUAGE: 'zh-CN',
}

// 平台特定配置
export const PLATFORM_CONFIG = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',
}

// 开发者模式说明
export const DEVELOPER_MODE_INFO = {
  description: '开发者模式允许在本地存储和服务器API之间切换数据源',
  localStorageMode: {
    name: '本地存储模式',
    description: '所有数据保存在设备本地，支持离线使用',
    features: ['离线可用', '数据导入导出', '快速响应', '无需网络'],
  },
  serverApiMode: {
    name: '服务器API模式',
    description: '数据从服务器获取，支持多设备同步',
    features: ['多设备同步', '数据云端备份', '实时更新', '需要网络连接'],
  },
}

export default {
  isDev,
  API_CONFIG,
  FEATURE_FLAGS,
  APP_CONFIG,
  PLATFORM_CONFIG,
  DEVELOPER_MODE_INFO,
}

