import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

/**
 * 密码哈希工具
 */
export const passwordUtils = {
  /**
   * 哈希密码
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  },

  /**
   * 验证密码
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}

/**
 * ID生成工具
 */
export const idUtils = {
  /**
   * 生成短ID (用于房间编号等)
   */
  generateShortId(length: number = 8): string {
    return nanoid(length)
  },

  /**
   * 生成预订号
   */
  generateReservationId(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const random = nanoid(6).toUpperCase()
    return `RE${date}${random}`
  }
}

/**
 * 分页工具
 */
export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function createPaginationQuery(options: PaginationOptions = {}) {
  const page = Math.max(1, options.page || 1)
  const limit = Math.min(100, Math.max(1, options.limit || 20))
  const skip = (page - 1) * limit

  return {
    skip,
    take: limit,
    page,
    limit
  }
}

export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * 日期工具
 */
export const dateUtils = {
  /**
   * 获取日期范围内的所有日期
   */
  getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = []
    const current = new Date(start)
    
    while (current <= end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return dates
  },

  /**
   * 计算两个日期之间的天数
   */
  getDaysBetween(start: Date, end: Date): number {
    const timeDiff = end.getTime() - start.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  },

  /**
   * 检查日期是否重叠
   */
  isDateRangeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1
  }
}

/**
 * 错误处理工具
 */
export const errorUtils = {
  /**
   * 处理 Prisma 错误
   */
  handlePrismaError(error: any): string {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return '该记录已存在'
        case 'P2025':
          return '记录不存在'
        case 'P2003':
          return '外键约束失败'
        default:
          return '数据库操作失败'
      }
    }
    
    return error.message || '未知错误'
  }
}

/**
 * 数据加密工具 (简化版，生产环境需要使用更安全的加密方法)
 */
export const encryptionUtils = {
  /**
   * 加密敏感数据 (身份证号等)
   * 注意：这是简化版，生产环境应使用 AES-256 等强加密算法
   */
  encrypt(data: string): string {
    // 这里应该实现真正的加密逻辑
    return Buffer.from(data, 'utf8').toString('base64')
  },

  /**
   * 解密敏感数据
   */
  decrypt(encryptedData: string): string {
    // 这里应该实现真正的解密逻辑
    return Buffer.from(encryptedData, 'base64').toString('utf8')
  }
} 