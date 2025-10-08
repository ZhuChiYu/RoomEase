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

export type UserRole = 'OWNER' | 'MANAGER' | 'FRONTDESK' | 'CLEANING' | 'FINANCE'

// 用户类型
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatar?: string
  role: UserRole
  tenantId: string
  createdAt: string
  updatedAt: string
}

// 租户类型
export interface Tenant {
  id: string
  name: string
  slug: string
  domain?: string
  logo?: string
  timezone: string
  currency: string
  language: string
  createdAt: string
  updatedAt: string
}

// 物业类型
export interface Property {
  id: string
  name: string
  description?: string
  address: string
  phone?: string
  email?: string
  timezone: string
  currency: string
  checkInTime: string
  checkOutTime: string
  tenantId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 房间类型
export interface Room {
  id: string
  name: string
  code: string
  description?: string
  roomType: string
  maxGuests: number
  bedCount: number
  bathroomCount: number
  area?: number
  floor?: number
  amenities?: string[]
  images?: string[]
  basePrice: number
  propertyId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 预订状态
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW'

// 预订类型
export interface Reservation {
  id: string
  checkInDate: string
  checkOutDate: string
  guestCount: number
  childCount: number
  roomRate: number
  totalAmount: number
  paidAmount: number
  currency: string
  status: ReservationStatus
  source?: string
  sourceRef?: string
  guestName: string
  guestPhone?: string
  guestEmail?: string
  guestIdNumber?: string
  guestAddress?: string
  specialRequests?: string
  notes?: string
  tenantId: string
  propertyId: string
  roomId: string
  userId?: string
  createdAt: string
  updatedAt: string
}

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
  status: ReservationStatus
}

// 日历覆盖（关房、特殊价格等）
export interface CalendarOverride {
  id: string
  roomId: string
  date: string
  price?: number
  minStay?: number
  maxStay?: number
  isBlocked: boolean
  reason?: string
  createdAt: string
  updatedAt: string
}

// 价格规则类型
export type PriceRuleType = 'SEASONAL' | 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY' | 'SPECIAL'
export type PriceAdjustment = 'FIXED' | 'PERCENTAGE' | 'AMOUNT'

// 价格规则
export interface PriceRule {
  id: string
  name: string
  description?: string
  type: PriceRuleType
  priority: number
  adjustment: PriceAdjustment
  value: number
  startDate?: string
  endDate?: string
  weekdays?: number[]
  minStay?: number
  maxStay?: number
  propertyId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
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

// 客人身份信息
export interface GuestIdentity {
  id: string
  name: string
  idType: string
  idNumber: string
  address?: string
  nationality?: string
  ocrConfidence?: number
  ocrRawData?: any
  reservationId: string
  createdAt: string
  updatedAt: string
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

export interface DashboardStats {
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  occupancyRate: number
  todayCheckIns: number
  todayCheckOuts: number
  totalRevenue: number
  paidRevenue: number
  monthlyReservations: number
}

export interface OccupancyTrend {
  date: string
  occupiedRooms: number
  totalRooms: number
  occupancyRate: number
}

export interface RevenueStats {
  year: number
  month: number
  totalRevenue: number
  paidRevenue: number
  unpaidRevenue: number
  totalReservations: number
  averageRevenue: number
}

export interface ChannelPerformance {
  channel: string
  reservations: number
  revenue: number
  cancelled: number
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

// 订阅计划
export type SubscriptionPlan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
export type BillingCycle = 'MONTHLY' | 'YEARLY'
export type SubscriptionFeature = 
  | 'CALENDAR_MANAGEMENT'
  | 'RESERVATION_MANAGEMENT'
  | 'CHANNEL_SYNC'
  | 'PRICE_RULES'
  | 'OCR_RECOGNITION'
  | 'ANALYTICS'
  | 'API_ACCESS'
  | 'WHITE_LABEL'
  | 'PRIORITY_SUPPORT'

// 订阅信息
export interface Subscription {
  id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  billingCycle: BillingCycle
  amount: number
  currency: string
  startDate: string
  endDate?: string
  trialEndDate?: string
  maxProperties: number
  maxRooms: number
  maxSmsPerMonth: number
  features: SubscriptionFeature[]
  tenantId: string
  createdAt: string
  updatedAt: string
}

// 审计日志
export interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId: string
  oldValues?: any
  newValues?: any
  userId?: string
  userIp?: string
  userAgent?: string
  tenantId: string
  createdAt: string
}
