/**
 * 环境配置
 */

// 判断是否为开发环境
export const isDev = __DEV__

// API配置
export const API_CONFIG = {
  // API基础URL
  BASE_URL: isDev 
    ? 'http://192.168.31.221:4000' // 开发环境 - 使用局域网IP（移动设备无法访问localhost）
    : 'https://api.roomease.com', // 生产环境
  
  // 请求超时时间（毫秒）
  TIMEOUT: 30000,
  
  // 是否启用API日志
  ENABLE_LOGGING: isDev,
}

// 功能开关
export const FEATURE_FLAGS = {
  // 是否使用后端API（false则使用本地存储）
  USE_BACKEND_API: true, // 已启用后端API
  
  // 是否启用数据备份
  ENABLE_DATA_BACKUP: true,
  
  // 是否启用通知
  ENABLE_NOTIFICATIONS: true,
  
  // 是否启用OCR识别
  ENABLE_OCR: false,
}

// 应用配置
export const APP_CONFIG = {
  // 应用名称
  APP_NAME: 'RoomEase',
  
  // 版本号
  VERSION: '1.0.0',
  
  // 默认租户（首次启动时使用）
  DEFAULT_TENANT: 'default-hotel',
  
  // 默认物业ID（用于API调用）
  DEFAULT_PROPERTY_ID: '', // 登录后会自动获取
}

export default {
  isDev,
  API_CONFIG,
  FEATURE_FLAGS,
  APP_CONFIG,
}

