export * from '@prisma/client'
export { default as prisma } from './client'
// 只导出不冲突的类型
export type {
  UserWithTenant,
  ReservationWithDetails,
  RoomWithProperty,
  CalendarDate,
  PaginatedResponse,
  CreateUserInput,
  CreateReservationInput,
  CreateRoomInput,
  UpdateUserInput,
  UpdateReservationInput,
  UpdateRoomInput
} from './types'
export * from './utils' 