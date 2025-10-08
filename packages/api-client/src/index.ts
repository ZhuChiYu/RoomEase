// Core exports
export * from './client'
export { ApiClient, type ApiClientConfig } from './client'

// Service exports
export * from './services/auth.service'
export * from './services/rooms.service'
export * from './services/reservations.service'
export * from './services/calendar.service'
export * from './services/analytics.service'

// Type exports (avoiding conflicts)
export type { ApiResponse, LoginResponse, UploadResponse, ApiError } from './types'

import { ApiClient, ApiClientConfig } from './client'
import { AuthService } from './services/auth.service'
import { RoomsService } from './services/rooms.service'
import { ReservationsService } from './services/reservations.service'
import { CalendarService } from './services/calendar.service'
import { AnalyticsService } from './services/analytics.service'

/**
 * 创建完整的API客户端实例
 */
export function createApiClient(config: ApiClientConfig) {
  const client = new ApiClient(config)

  return {
    client,
    auth: new AuthService(client),
    rooms: new RoomsService(client),
    reservations: new ReservationsService(client),
    calendar: new CalendarService(client),
    analytics: new AnalyticsService(client),
  }
}

/**
 * 默认API客户端实例（用于浏览器环境）
 */
const isBrowser = typeof window !== 'undefined'
export const api = createApiClient({
  baseURL: isBrowser 
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
    : 'http://localhost:4000'
})

// React Query hooks (optional, for Web only)
// export * from './hooks'
