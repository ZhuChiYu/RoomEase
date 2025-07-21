import { z } from 'zod'

// 用户相关验证
export const userSchemas = {
  login: z.object({
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(6, '密码至少6位')
  }),

  register: z.object({
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(8, '密码至少8位').regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '密码必须包含大小写字母和数字'
    ),
    name: z.string().min(2, '姓名至少2位'),
    phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号')
  }),

  updateProfile: z.object({
    name: z.string().min(2, '姓名至少2位'),
    phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号').optional(),
    avatar: z.string().url('请输入有效的头像URL').optional()
  })
}

// 房间相关验证
export const roomSchemas = {
  create: z.object({
    name: z.string().min(1, '房间名称不能为空'),
    code: z.string().min(1, '房间编号不能为空'),
    roomType: z.string().min(1, '房间类型不能为空'),
    maxGuests: z.number().min(1, '最大客人数不能少于1'),
    bedCount: z.number().min(1, '床位数不能少于1'),
    bathroomCount: z.number().min(1, '卫生间数不能少于1'),
    basePrice: z.number().min(0, '基础价格不能为负数'),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string().url('请输入有效的图片URL')).optional(),
    description: z.string().optional(),
    area: z.number().positive('面积必须为正数').optional(),
    floor: z.number().int('楼层必须为整数').optional()
  }),

  update: z.object({
    name: z.string().min(1, '房间名称不能为空').optional(),
    code: z.string().min(1, '房间编号不能为空').optional(),
    roomType: z.string().min(1, '房间类型不能为空').optional(),
    maxGuests: z.number().min(1, '最大客人数不能少于1').optional(),
    bedCount: z.number().min(1, '床位数不能少于1').optional(),
    bathroomCount: z.number().min(1, '卫生间数不能少于1').optional(),
    basePrice: z.number().min(0, '基础价格不能为负数').optional(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string().url('请输入有效的图片URL')).optional(),
    description: z.string().optional(),
    area: z.number().positive('面积必须为正数').optional(),
    floor: z.number().int('楼层必须为整数').optional(),
    isActive: z.boolean().optional()
  })
}

// 预订相关验证
export const reservationSchemas = {
  create: z.object({
    roomId: z.string().min(1, '请选择房间'),
    checkInDate: z.date().refine(date => date >= new Date(), '入住日期不能早于今天'),
    checkOutDate: z.date(),
    guestCount: z.number().min(1, '客人数不能少于1'),
    childCount: z.number().min(0, '儿童数不能为负数').optional().default(0),
    guestName: z.string().min(2, '客人姓名至少2位'),
    guestPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号').optional(),
    guestEmail: z.string().email('请输入有效的邮箱地址').optional(),
    specialRequests: z.string().optional(),
    notes: z.string().optional()
  }).refine(data => data.checkOutDate > data.checkInDate, {
    message: '退房日期必须晚于入住日期',
    path: ['checkOutDate']
  }),

  update: z.object({
    checkInDate: z.date().optional(),
    checkOutDate: z.date().optional(),
    guestCount: z.number().min(1, '客人数不能少于1').optional(),
    childCount: z.number().min(0, '儿童数不能为负数').optional(),
    guestName: z.string().min(2, '客人姓名至少2位').optional(),
    guestPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号').optional(),
    guestEmail: z.string().email('请输入有效的邮箱地址').optional(),
    specialRequests: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']).optional()
  })
}

// 价格规则验证
export const priceRuleSchemas = {
  create: z.object({
    name: z.string().min(1, '规则名称不能为空'),
    description: z.string().optional(),
    type: z.enum(['SEASONAL', 'WEEKDAY', 'WEEKEND', 'HOLIDAY', 'SPECIAL']),
    priority: z.number().int('优先级必须为整数').default(0),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    weekdays: z.array(z.number().min(0).max(6)).optional(),
    adjustment: z.enum(['FIXED', 'PERCENTAGE', 'AMOUNT']),
    value: z.number().min(0, '价格值不能为负数'),
    minStay: z.number().int('最短住期必须为整数').optional(),
    maxStay: z.number().int('最长住期必须为整数').optional()
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate
    }
    return true
  }, {
    message: '结束日期必须晚于或等于开始日期',
    path: ['endDate']
  }),

  update: z.object({
    name: z.string().min(1, '规则名称不能为空').optional(),
    description: z.string().optional(),
    type: z.enum(['SEASONAL', 'WEEKDAY', 'WEEKEND', 'HOLIDAY', 'SPECIAL']).optional(),
    priority: z.number().int('优先级必须为整数').optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    weekdays: z.array(z.number().min(0).max(6)).optional(),
    adjustment: z.enum(['FIXED', 'PERCENTAGE', 'AMOUNT']).optional(),
    value: z.number().min(0, '价格值不能为负数').optional(),
    minStay: z.number().int('最短住期必须为整数').optional(),
    maxStay: z.number().int('最长住期必须为整数').optional(),
    isActive: z.boolean().optional()
  })
}

// 房态日历验证
export const calendarSchemas = {
  update: z.object({
    roomId: z.string().min(1, '请选择房间'),
    date: z.date(),
    price: z.number().min(0, '价格不能为负数').optional(),
    minStay: z.number().int('最短住期必须为整数').optional(),
    maxStay: z.number().int('最长住期必须为整数').optional(),
    isBlocked: z.boolean().optional(),
    reason: z.string().optional()
  }),

  batchUpdate: z.object({
    roomId: z.string().min(1, '请选择房间'),
    startDate: z.date(),
    endDate: z.date(),
    updates: z.object({
      price: z.number().min(0, '价格不能为负数').optional(),
      minStay: z.number().int('最短住期必须为整数').optional(),
      maxStay: z.number().int('最长住期必须为整数').optional(),
      isBlocked: z.boolean().optional(),
      reason: z.string().optional()
    })
  }).refine(data => data.endDate >= data.startDate, {
    message: '结束日期必须晚于或等于开始日期',
    path: ['endDate']
  })
}

// 身份识别验证
export const guestIdentitySchemas = {
  create: z.object({
    reservationId: z.string().min(1, '预订ID不能为空'),
    name: z.string().min(2, '姓名至少2位'),
    idType: z.enum(['ID_CARD', 'PASSPORT', 'DRIVER_LICENSE']),
    idNumber: z.string().min(1, '证件号不能为空'),
    address: z.string().optional(),
    nationality: z.string().optional()
  })
}

// 查询参数验证
export const querySchemas = {
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
  }),

  dateRange: z.object({
    startDate: z.date(),
    endDate: z.date()
  }).refine(data => data.endDate >= data.startDate, {
    message: '结束日期必须晚于或等于开始日期',
    path: ['endDate']
  }),

  reservationList: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']).optional(),
    roomId: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    search: z.string().optional()
  })
} 