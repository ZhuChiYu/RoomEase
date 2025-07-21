// 订阅套餐配置
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    maxProperties: 1,
    maxRooms: 3,
    maxSmsPerMonth: 0,
    features: ['CALENDAR_MANAGEMENT', 'RESERVATION_MANAGEMENT']
  },
  STARTER: {
    name: 'Starter',
    price: 99,
    maxProperties: 1,
    maxRooms: 10,
    maxSmsPerMonth: 200,
    features: ['CALENDAR_MANAGEMENT', 'RESERVATION_MANAGEMENT', 'PRICE_RULES']
  },
  PRO: {
    name: 'Pro',
    price: 199,
    maxProperties: 10,
    maxRooms: 100,
    maxSmsPerMonth: 1000,
    features: [
      'CALENDAR_MANAGEMENT',
      'RESERVATION_MANAGEMENT', 
      'CHANNEL_SYNC',
      'PRICE_RULES',
      'OCR_RECOGNITION',
      'ANALYTICS',
      'API_ACCESS'
    ]
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: null,
    maxProperties: -1, // 无限制
    maxRooms: -1,
    maxSmsPerMonth: -1,
    features: [
      'CALENDAR_MANAGEMENT',
      'RESERVATION_MANAGEMENT',
      'CHANNEL_SYNC', 
      'PRICE_RULES',
      'OCR_RECOGNITION',
      'ANALYTICS',
      'API_ACCESS',
      'WHITE_LABEL',
      'PRIORITY_SUPPORT'
    ]
  }
} as const

// 预订状态配置
export const RESERVATION_STATUS = {
  PENDING: { label: '待确认', color: 'orange' },
  CONFIRMED: { label: '已确认', color: 'blue' },
  CHECKED_IN: { label: '已入住', color: 'green' },
  CHECKED_OUT: { label: '已退房', color: 'gray' },
  CANCELLED: { label: '已取消', color: 'red' },
  NO_SHOW: { label: '未到店', color: 'purple' }
} as const

// 用户角色配置
export const USER_ROLES = {
  OWNER: { label: '业主', permissions: ['*'] },
  MANAGER: { 
    label: '经理',
    permissions: [
      'calendar.read', 'calendar.write',
      'reservation.read', 'reservation.write',
      'pricing.read', 'pricing.write',
      'analytics.read',
      'user.read'
    ]
  },
  FRONTDESK: {
    label: '前台',
    permissions: [
      'calendar.read',
      'reservation.read', 'reservation.write'
    ]
  },
  CLEANING: {
    label: '清洁',
    permissions: [
      'calendar.read',
      'reservation.read'
    ]
  },
  FINANCE: {
    label: '财务',
    permissions: [
      'analytics.read',
      'billing.read'
    ]
  }
} as const

// API 端点
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile'
  },
  CALENDAR: {
    LIST: '/calendar',
    UPDATE: '/calendar/update',
    BATCH_UPDATE: '/calendar/batch-update'
  },
  RESERVATIONS: {
    LIST: '/reservations',
    CREATE: '/reservations',
    UPDATE: (id: string) => `/reservations/${id}`,
    DELETE: (id: string) => `/reservations/${id}`,
    CHECK_IN: (id: string) => `/reservations/${id}/check-in`,
    CHECK_OUT: (id: string) => `/reservations/${id}/check-out`
  },
  ROOMS: {
    LIST: '/rooms',
    CREATE: '/rooms',
    UPDATE: (id: string) => `/rooms/${id}`,
    DELETE: (id: string) => `/rooms/${id}`
  },
  PRICING: {
    RULES: '/pricing/rules',
    CALCULATE: '/pricing/calculate'
  },
  OCR: {
    RECOGNIZE: '/ocr/recognize'
  },
  ANALYTICS: {
    KPI: '/analytics/kpi',
    REVENUE: '/analytics/revenue',
    OCCUPANCY: '/analytics/occupancy'
  },
  BILLING: {
    SUBSCRIPTIONS: '/billing/subscriptions',
    INVOICES: '/billing/invoices',
    PAYMENT_METHODS: '/billing/payment-methods'
  }
} as const

// 错误代码
export const ERROR_CODES = {
  // 认证错误
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // 业务错误
  RESERVATION_CONFLICT: 'RESERVATION_CONFLICT',
  ROOM_NOT_AVAILABLE: 'ROOM_NOT_AVAILABLE',
  PRICE_RULE_CONFLICT: 'PRICE_RULE_CONFLICT',
  
  // 订阅错误
  SUBSCRIPTION_LIMIT_EXCEEDED: 'SUBSCRIPTION_LIMIT_EXCEEDED',
  SUBSCRIPTION_FEATURE_NOT_AVAILABLE: 'SUBSCRIPTION_FEATURE_NOT_AVAILABLE',
  
  // 系统错误
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const

// 文件类型限制
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp']
} as const

// 时区
export const TIMEZONES = [
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Tokyo',
  'UTC'
] as const

// 货币
export const CURRENCIES = [
  { code: 'CNY', symbol: '¥', name: '人民币' },
  { code: 'USD', symbol: '$', name: '美元' },
  { code: 'EUR', symbol: '€', name: '欧元' },
  { code: 'JPY', symbol: '¥', name: '日元' },
  { code: 'HKD', symbol: 'HK$', name: '港币' }
] as const 