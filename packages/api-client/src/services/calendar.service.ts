import { ApiClient } from '../client'
import type { ApiResponse } from '../types'

export interface CalendarData {
  rooms: any[]
  reservations: any[]
  overrides: any[]
}

export class CalendarService {
  constructor(private client: ApiClient) {}

  async getCalendar(
    propertyId: string,
    startDate: string,
    endDate: string,
  ): Promise<ApiResponse<CalendarData>> {
    return this.client.get('/calendar', {
      params: { propertyId, startDate, endDate },
    })
  }

  async blockRoom(
    roomId: string,
    startDate: string,
    endDate: string,
    reason?: string,
  ): Promise<ApiResponse<{ message: string; count: number }>> {
    return this.client.post('/calendar/block', {
      roomId,
      startDate,
      endDate,
      reason,
    })
  }

  async unblockRoom(
    roomId: string,
    startDate: string,
    endDate: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.client.delete('/calendar/block', {
      data: { roomId, startDate, endDate },
    })
  }

  async setSpecialPrice(
    roomId: string,
    date: string,
    price: number,
  ): Promise<ApiResponse<any>> {
    return this.client.post('/calendar/price', {
      roomId,
      date,
      price,
    })
  }
}

