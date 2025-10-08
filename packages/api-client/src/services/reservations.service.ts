import { ApiClient } from '../client'
import type { ApiResponse } from '../types'

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW'

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

export interface CreateReservationDto {
  checkInDate: string
  checkOutDate: string
  guestCount: number
  childCount: number
  roomRate: number
  totalAmount: number
  guestName: string
  guestPhone?: string
  guestEmail?: string
  guestIdNumber?: string
  guestAddress?: string
  specialRequests?: string
  notes?: string
  propertyId: string
  roomId: string
  source?: string
  sourceRef?: string
}

export class ReservationsService {
  constructor(private client: ApiClient) {}

  async getAll(filters?: {
    propertyId?: string
    roomId?: string
    status?: ReservationStatus
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<Reservation[]>> {
    return this.client.get('/reservations', { params: filters })
  }

  async getById(id: string): Promise<ApiResponse<Reservation>> {
    return this.client.get(`/reservations/${id}`)
  }

  async create(data: CreateReservationDto): Promise<ApiResponse<Reservation>> {
    return this.client.post('/reservations', data)
  }

  async update(id: string, data: Partial<CreateReservationDto>): Promise<ApiResponse<Reservation>> {
    return this.client.patch(`/reservations/${id}`, data)
  }

  async cancel(id: string): Promise<ApiResponse<Reservation>> {
    return this.client.post(`/reservations/${id}/cancel`)
  }

  async checkIn(id: string): Promise<ApiResponse<Reservation>> {
    return this.client.post(`/reservations/${id}/check-in`)
  }

  async checkOut(id: string): Promise<ApiResponse<Reservation>> {
    return this.client.post(`/reservations/${id}/check-out`)
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.client.delete(`/reservations/${id}`)
  }
}

