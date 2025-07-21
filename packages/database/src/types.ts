import type { Prisma } from '@prisma/client'

// 用户相关类型
export type UserWithTenant = Prisma.UserGetPayload<{
  include: {
    tenant: true
  }
}>

// UserRole 已在 Prisma schema 中定义，这里不再重复导出

// 预订相关类型
export type ReservationWithDetails = Prisma.ReservationGetPayload<{
  include: {
    room: {
      include: {
        property: true
      }
    }
    guestIdentities: true
    user: true
  }
}>

// ReservationStatus 已在 Prisma schema 中定义，这里不再重复导出

// 房间相关类型
export type RoomWithProperty = Prisma.RoomGetPayload<{
  include: {
    property: true
  }
}>

// 价格规则、订阅等类型已在 Prisma schema 中定义，这里不再重复导出

// 房态日历类型
export interface CalendarDate {
  date: Date
  price: number
  isBlocked: boolean
  isBooked: boolean
  minStay?: number
  maxStay?: number
  reason?: string
}

// API 响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 创建输入类型
export type CreateUserInput = Omit<Prisma.UserCreateInput, 'id' | 'createdAt' | 'updatedAt'>
export type CreateReservationInput = Omit<Prisma.ReservationCreateInput, 'id' | 'createdAt' | 'updatedAt'>
export type CreateRoomInput = Omit<Prisma.RoomCreateInput, 'id' | 'createdAt' | 'updatedAt'>

// 更新输入类型
export type UpdateUserInput = Prisma.UserUpdateInput
export type UpdateReservationInput = Prisma.ReservationUpdateInput
export type UpdateRoomInput = Prisma.RoomUpdateInput 