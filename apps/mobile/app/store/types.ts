// Redux 状态类型定义

export type RoomType = '大床房' | '双人房' | '豪华房' | '套房'

export interface RoomTypeConfig {
  id: string
  name: string  // 房型名称
  shortName: string  // 简称
  defaultPrice: number  // 默认价格
  differentiateWeekend?: boolean  // 是否区分周末
}

export interface Room {
  id: string
  name: string
  type: RoomType
}

export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'closed'

export interface Payment {
  id: string
  orderId: string
  amount: number
  type: 'payment' | 'refund' | 'otherFee'
  method: string  // 支付方式：现金、支付宝、微信等
  note?: string
  createdAt: string
  operator?: string
}

export interface Reservation {
  id: string
  orderId: string
  roomId: string
  roomNumber: string
  roomType: string
  guestName: string
  guestPhone: string
  guestIdType?: string
  guestIdNumber?: string
  channel: string
  checkInDate: string
  checkOutDate: string
  roomPrice: number
  totalAmount: number
  nights: number
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'
  paidAmount?: number
  otherFees?: number
  payments?: Payment[]
  createdAt: string
}

export interface RoomStatusData {
  roomId: string
  date: string
  status: RoomStatus
  reservationId?: string
  note?: string
}

export interface OperationLog {
  id: string
  orderId: string
  action: string
  operator: string
  time: string
  details: string
}

export interface CalendarState {
  rooms: Room[]
  roomTypes: RoomTypeConfig[]  // 房型配置
  reservations: Reservation[]
  roomStatuses: RoomStatusData[]
  operationLogs: OperationLog[]
  payments: Payment[]  // 所有支付记录
}

export interface RootState {
  calendar: CalendarState
}

