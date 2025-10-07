// Redux 状态类型定义

export type RoomType = '大床房' | '双人房' | '豪华房' | '套房'

export interface Room {
  id: string
  name: string
  type: RoomType
}

export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'closed'

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
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'
  paidAmount?: number
  createdAt: string
}

export interface RoomStatusData {
  roomId: string
  date: string
  status: RoomStatus
  reservationId?: string
  note?: string
}

export interface CalendarState {
  rooms: Room[]
  reservations: Reservation[]
  roomStatuses: RoomStatusData[]
}

export interface RootState {
  calendar: CalendarState
}

