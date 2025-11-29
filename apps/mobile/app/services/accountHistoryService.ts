/**
 * 历史账号管理服务
 * 用于保存和管理用户登录过的账号历史
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { logger } from './api'

const ACCOUNT_HISTORY_KEY = '@account_history'
const MAX_HISTORY_COUNT = 5 // 最多保存5个历史账号

export interface AccountHistory {
  email: string
  name?: string
  lastLoginTime: string
  avatar?: string // 预留头像字段
}

class AccountHistoryService {
  /**
   * 获取所有历史账号
   */
  async getAccountHistory(): Promise<AccountHistory[]> {
    try {
      const historyJson = await AsyncStorage.getItem(ACCOUNT_HISTORY_KEY)
      if (historyJson) {
        const history: AccountHistory[] = JSON.parse(historyJson)
        // 按最后登录时间倒序排序
        return history.sort((a, b) => 
          new Date(b.lastLoginTime).getTime() - new Date(a.lastLoginTime).getTime()
        )
      }
      return []
    } catch (error) {
      logger.error('获取账号历史失败', error)
      return []
    }
  }

  /**
   * 添加或更新账号到历史记录
   */
  async addOrUpdateAccount(email: string, name?: string): Promise<void> {
    try {
      const history = await this.getAccountHistory()
      
      // 查找是否已存在该账号
      const existingIndex = history.findIndex(item => item.email === email)
      
      const accountItem: AccountHistory = {
        email,
        name: name || email.split('@')[0], // 如果没有名字，使用邮箱前缀
        lastLoginTime: new Date().toISOString(),
      }
      
      if (existingIndex >= 0) {
        // 更新已存在的账号
        history[existingIndex] = accountItem
      } else {
        // 添加新账号
        history.unshift(accountItem)
        
        // 限制历史记录数量
        if (history.length > MAX_HISTORY_COUNT) {
          history.splice(MAX_HISTORY_COUNT)
        }
      }
      
      await AsyncStorage.setItem(ACCOUNT_HISTORY_KEY, JSON.stringify(history))
      logger.log('账号历史已更新', { email, count: history.length })
    } catch (error) {
      logger.error('保存账号历史失败', error)
      throw error
    }
  }

  /**
   * 删除指定账号的历史记录
   */
  async removeAccount(email: string): Promise<void> {
    try {
      const history = await this.getAccountHistory()
      const filteredHistory = history.filter(item => item.email !== email)
      await AsyncStorage.setItem(ACCOUNT_HISTORY_KEY, JSON.stringify(filteredHistory))
      logger.log('账号历史已删除', { email })
    } catch (error) {
      logger.error('删除账号历史失败', error)
      throw error
    }
  }

  /**
   * 清除所有历史记录
   */
  async clearAllHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACCOUNT_HISTORY_KEY)
      logger.log('所有账号历史已清除')
    } catch (error) {
      logger.error('清除账号历史失败', error)
      throw error
    }
  }

  /**
   * 获取最近登录的账号
   */
  async getLastAccount(): Promise<AccountHistory | null> {
    try {
      const history = await this.getAccountHistory()
      return history.length > 0 ? history[0] : null
    } catch (error) {
      logger.error('获取最近账号失败', error)
      return null
    }
  }
}

// 导出单例
export const accountHistoryService = new AccountHistoryService()

// 默认导出
export default accountHistoryService

