/**
 * 服务层统一导出文件
 * 所有数据操作使用云服务API，本地仅作缓存
 */

import { dataService } from './dataService'

// 导出其他服务
export { storage, authStorage, cacheStorage, persistedStorage } from './storage'
export { api, healthCheck, testConnection, updateApiBaseUrl, getCurrentApiUrl } from './api'
export { 
  notificationService,
  addNotificationReceivedListener,
  addNotificationResponseListener
} from './notifications'

console.log('📊 [Services] 使用云服务API（带智能缓存）')

export { dataService }
export default dataService
