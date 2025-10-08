/**
 * 服务层统一入口
 * 可以在这里切换使用本地存储或后端API
 */

import { localDataService } from './localDataService'
import { apiService } from './apiService'
import { FEATURE_FLAGS } from '../config/environment'

// 配置：是否使用API服务
// 从环境配置中读取
const USE_API_SERVICE = FEATURE_FLAGS.USE_BACKEND_API

// 打印当前使用的服务
console.log('🔌 [服务配置] USE_BACKEND_API:', FEATURE_FLAGS.USE_BACKEND_API)
console.log('🔌 [服务配置] 当前使用:', USE_API_SERVICE ? 'API服务' : '本地存储')

/**
 * 数据服务
 * 根据配置自动选择本地存储或API服务
 */
export const dataService = USE_API_SERVICE ? apiService : localDataService

export default dataService

// 也可以直接导出两个服务，让使用者自己选择
export { localDataService, apiService }

