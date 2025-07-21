import { format, parseISO, isValid, addDays, differenceInDays } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

/**
 * 日期工具函数
 */
export const dateUtils = {
  /**
   * 格式化日期
   */
  format(date: Date | string, pattern: string = 'yyyy-MM-dd'): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return isValid(d) ? format(d, pattern) : ''
  },

  /**
   * 转换为时区时间
   */
  toZonedTime(date: Date | string, timeZone: string): Date {
    const d = typeof date === 'string' ? parseISO(date) : date
    return utcToZonedTime(d, timeZone)
  },

  /**
   * 转换为UTC时间
   */
  toUtc(date: Date | string, timeZone: string): Date {
    const d = typeof date === 'string' ? parseISO(date) : date
    return zonedTimeToUtc(d, timeZone)
  },

  /**
   * 获取日期范围
   */
  getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = []
    let current = new Date(start)
    
    while (current <= end) {
      dates.push(new Date(current))
      current = addDays(current, 1)
    }
    
    return dates
  },

  /**
   * 计算住宿天数
   */
  getNights(checkIn: Date, checkOut: Date): number {
    return differenceInDays(checkOut, checkIn)
  },

  /**
   * 检查日期是否为工作日
   */
  isWeekday(date: Date): boolean {
    const day = date.getDay()
    return day >= 1 && day <= 5
  },

  /**
   * 检查日期是否为周末
   */
  isWeekend(date: Date): boolean {
    const day = date.getDay()
    return day === 0 || day === 6
  }
}

/**
 * 价格工具函数
 */
export const priceUtils = {
  /**
   * 格式化价格
   */
  format(amount: number, currency: string = 'CNY'): string {
    const formatters: Record<string, Intl.NumberFormat> = {
      CNY: new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }),
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
      HKD: new Intl.NumberFormat('zh-HK', { style: 'currency', currency: 'HKD' })
    }
    
    const formatter = formatters[currency] || formatters.CNY
    return formatter.format(amount)
  },

  /**
   * 计算百分比折扣
   */
  applyPercentageDiscount(price: number, percentage: number): number {
    return Math.round(price * (1 - percentage / 100) * 100) / 100
  },

  /**
   * 计算固定金额折扣
   */
  applyAmountDiscount(price: number, amount: number): number {
    return Math.max(0, price - amount)
  }
}

/**
 * 字符串工具函数
 */
export const stringUtils = {
  /**
   * 生成随机字符串
   */
  random(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  /**
   * 截断字符串
   */
  truncate(str: string, length: number): string {
    return str.length > length ? str.slice(0, length) + '...' : str
  },

  /**
   * 首字母大写
   */
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  /**
   * 转换为 slug
   */
  slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}

/**
 * 数组工具函数
 */
export const arrayUtils = {
  /**
   * 数组去重
   */
  unique<T>(array: T[]): T[] {
    return [...new Set(array)]
  },

  /**
   * 数组分组
   */
  groupBy<T, K extends keyof any>(array: T[], key: (item: T) => K): Record<K, T[]> {
    return array.reduce((groups, item) => {
      const group = key(item)
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(item)
      return groups
    }, {} as Record<K, T[]>)
  },

  /**
   * 数组分块
   */
  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

/**
 * 对象工具函数
 */
export const objectUtils = {
  /**
   * 深度合并对象
   */
  deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target }
    
    for (const key in source) {
      const sourceValue = source[key]
      const targetValue = result[key]
      
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        if (targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
          result[key] = objectUtils.deepMerge(targetValue, sourceValue)
        } else {
          result[key] = sourceValue
        }
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>]
      }
    }
    
    return result
  },

  /**
   * 选择对象的指定属性
   */
  pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key]
      }
    }
    return result
  },

  /**
   * 排除对象的指定属性
   */
  omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj }
    for (const key of keys) {
      delete result[key]
    }
    return result
  }
}

/**
 * 验证工具函数
 */
export const validationUtils = {
  /**
   * 验证邮箱
   */
  isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  /**
   * 验证手机号（中国）
   */
  isPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  },

  /**
   * 验证身份证号（中国）
   */
  isIdCard(idCard: string): boolean {
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
    return idCardRegex.test(idCard)
  },

  /**
   * 验证密码强度
   */
  isStrongPassword(password: string): boolean {
    // 至少8位，包含大小写字母、数字
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    return strongPasswordRegex.test(password)
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= wait) {
      lastTime = now
      func(...args)
    }
  }
} 