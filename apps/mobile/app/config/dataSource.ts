/**
 * 数据源配置文件
 * 用于在本地存储和网络API之间切换
 */

// 数据源类型
export type DataSourceType = 'local' | 'remote'

// 数据源配置
export interface DataSourceConfig {
  type: DataSourceType
  apiUrl?: string
  timeout?: number
  enableCache?: boolean
  enableOfflineMode?: boolean
}

// 当前数据源配置
// ⚠️ 切换数据源：将 type 从 'local' 改为 'remote' 即可切换到网络API
export const dataSourceConfig: DataSourceConfig = {
  type: 'local',  // 当前使用本地存储
  // type: 'remote',  // 取消注释此行并注释上一行以切换到网络API
  
  // 网络API配置（当type为'remote'时生效）
  apiUrl: (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) || 'http://localhost:3000',
  timeout: 10000,
  
  // 缓存配置
  enableCache: true,  // 启用本地缓存
  enableOfflineMode: true,  // 启用离线模式（在网络不可用时使用缓存）
}

/**
 * 获取当前数据源类型
 */
export const getDataSourceType = (): DataSourceType => {
  return dataSourceConfig.type
}

/**
 * 是否使用本地存储
 */
export const isLocalDataSource = (): boolean => {
  return dataSourceConfig.type === 'local'
}

/**
 * 是否使用远程API
 */
export const isRemoteDataSource = (): boolean => {
  return dataSourceConfig.type === 'remote'
}

/**
 * 获取API基础URL
 */
export const getApiBaseUrl = (): string => {
  return dataSourceConfig.apiUrl || 'http://localhost:3000'
}

/**
 * 数据源说明
 */
export const DATA_SOURCE_INFO = {
  local: {
    name: '本地存储',
    description: '数据存储在设备本地，离线可用',
    features: [
      '✅ 完全离线工作',
      '✅ 快速响应',
      '✅ 数据隐私保护',
      '⚠️ 数据仅在本设备',
      '⚠️ 不支持多设备同步',
    ],
  },
  remote: {
    name: '云端存储',
    description: '数据存储在服务器，支持多设备同步',
    features: [
      '✅ 多设备数据同步',
      '✅ 数据云端备份',
      '✅ 团队协作',
      '✅ 数据统计分析',
      '⚠️ 需要网络连接',
    ],
  },
}

export default dataSourceConfig

