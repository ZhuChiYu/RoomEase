// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 用户权限
export type Permission = 
  | 'calendar.read'
  | 'calendar.write'
  | 'reservation.read'
  | 'reservation.write'
  | 'pricing.read'
  | 'pricing.write'
  | 'analytics.read'
  | 'user.read'
  | 'user.write'
  | 'billing.read'
  | 'billing.write'
  | '*'

// 房态日历
export interface CalendarDay {
  date: Date
  price: number
  isAvailable: boolean
  isBlocked: boolean
  minStay?: number
  maxStay?: number
  reservations: CalendarReservation[]
}

export interface CalendarReservation {
  id: string
  checkIn: Date
  checkOut: Date
  guestName: string
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
}

// 价格规则
export interface PriceRule {
  id: string
  name: string
  type: 'SEASONAL' | 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY' | 'SPECIAL'
  adjustment: 'FIXED' | 'PERCENTAGE' | 'AMOUNT'
  value: number
  startDate?: Date
  endDate?: Date
  weekdays?: number[]
  minStay?: number
  maxStay?: number
  isActive: boolean
}

// OCR 识别结果
export interface OcrResult {
  confidence: number
  fields: {
    name?: string
    idNumber?: string
    address?: string
    nationality?: string
    idType?: string
  }
  rawData?: any
}

// WebSocket 消息类型
export interface WebSocketMessage {
  type: 'RESERVATION_CREATED' | 'RESERVATION_UPDATED' | 'CALENDAR_UPDATED' | 'NOTIFICATION'
  data: any
  timestamp: number
}

// 分析数据类型
export interface AnalyticsKPI {
  totalReservations: number
  confirmedReservations: number
  cancelledReservations: number
  totalRevenue: number
  paidRevenue: number
  avgBookingValue: number
  occupancyRate: number
  uniqueRoomsBooked: number
}

export interface ChannelPerformance {
  channel: string
  reservations: number
  revenue: number
  cancellationRate: number
}

// 错误类型
export interface AppError {
  code: string
  message: string
  field?: string
  details?: any
}

// 文件上传
export interface FileUpload {
  url: string
  filename: string
  mimeType: string
  size: number
} 