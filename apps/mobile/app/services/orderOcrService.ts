import { NativeModules, Platform } from 'react-native'

interface OrderOCRModule {
  recognizeOrderScreenshot(imageUri: string): Promise<OrderInfo>
}

export interface OrderInfo {
  platform?: string // 平台：美团、途家、小猪
  guestName?: string // 客人姓名
  guestPhone?: string // 联系电话
  guestIdNumber?: string // 身份证号
  checkInDate?: string // 入住日期
  checkOutDate?: string // 离店日期
  totalPrice?: number // 总价
  roomType?: string // 房型
  guestCount?: number // 入住人数
  address?: string // 地址
  rawText?: string // 原始识别文本
}

const OrderOCR = NativeModules.OrderOCRModule as OrderOCRModule

export const orderOcrService = {
  /**
   * 识别订单截图
   */
  async recognizeOrderScreenshot(imageUri: string): Promise<OrderInfo> {
    if (Platform.OS !== 'ios') {
      throw new Error('订单识别功能目前仅支持iOS')
    }

    if (!OrderOCR) {
      throw new Error('OrderOCRModule 未正确加载')
    }

    try {
      const result = await OrderOCR.recognizeOrderScreenshot(imageUri)
      console.log('📱 订单识别结果:', result)
      return result
    } catch (error) {
      console.error('❌ 订单识别失败:', error)
      throw error
    }
  },

  /**
   * 格式化日期显示
   */
  formatDate(dateStr?: string): string {
    if (!dateStr) return ''
    
    // 如果已经是标准格式（包含年月日），直接返回
    if (dateStr.includes('年') && dateStr.includes('月') && dateStr.includes('日')) {
      return dateStr
    }
    
    // 否则进行格式转换
    const normalized = dateStr
      .replace(/[./-]/g, '年')
      .replace(/年(\d{1,2})/, '年$1月')
      .replace(/月(\d{1,2})$/, '月$1日')
    
    return normalized
  },

  /**
   * 格式化订单信息用于显示
   */
  formatOrderInfo(info: OrderInfo): string {
    const lines: string[] = []
    
    if (info.platform) {
      lines.push(`📱 平台：${info.platform}`)
    }
    
    if (info.guestName) {
      lines.push(`👤 姓名：${info.guestName}`)
    }
    
    if (info.guestPhone) {
      lines.push(`📞 电话：${info.guestPhone}`)
    }
    
    if (info.guestIdNumber) {
      lines.push(`🆔 身份证：${info.guestIdNumber}`)
    }
    
    if (info.checkInDate) {
      lines.push(`📅 入住：${this.formatDate(info.checkInDate)}`)
    }
    
    if (info.checkOutDate) {
      lines.push(`📅 离店：${this.formatDate(info.checkOutDate)}`)
    }
    
    if (info.totalPrice) {
      lines.push(`💰 房费：¥${info.totalPrice.toFixed(2)}`)
    }
    
    if (info.roomType) {
      lines.push(`🏠 房型：${info.roomType}`)
    }
    
    if (info.guestCount) {
      lines.push(`👥 人数：${info.guestCount}人`)
    }
    
    return lines.join('\n')
  },

  /**
   * 解析日期字符串为Date对象
   */
  parseDate(dateStr?: string): Date | null {
    if (!dateStr) return null
    
    try {
      // 提取年月日
      const yearMatch = dateStr.match(/(\d{4})年/)
      const monthMatch = dateStr.match(/(\d{1,2})月/)
      const dayMatch = dateStr.match(/(\d{1,2})日/)
      
      if (monthMatch && dayMatch) {
        const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()
        const month = parseInt(monthMatch[1]) - 1 // JS月份从0开始
        const day = parseInt(dayMatch[1])
        
        return new Date(year, month, day)
      }
    } catch (error) {
      console.error('日期解析失败:', error)
    }
    
    return null
  },

  /**
   * 计算入住天数
   */
  calculateNights(checkInDate?: string, checkOutDate?: string): number {
    const checkIn = this.parseDate(checkInDate)
    const checkOut = this.parseDate(checkOutDate)
    
    if (!checkIn || !checkOut) return 0
    
    const diffTime = checkOut.getTime() - checkIn.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  },

  /**
   * 验证订单信息完整性
   */
  validateOrderInfo(info: OrderInfo): { valid: boolean; missingFields: string[] } {
    const missingFields: string[] = []
    
    if (!info.guestName) missingFields.push('客人姓名')
    if (!info.guestPhone) missingFields.push('联系电话')
    if (!info.checkInDate) missingFields.push('入住日期')
    if (!info.checkOutDate) missingFields.push('离店日期')
    
    return {
      valid: missingFields.length === 0,
      missingFields
    }
  }
}

