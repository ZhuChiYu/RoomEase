import { ApiClient } from '../client'
import type { ApiResponse } from '../types'

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
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateRoomDto {
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
  isActive?: boolean
  sortOrder?: number
  isVisible?: boolean
}

export class RoomsService {
  constructor(private client: ApiClient) {}

  async getAll(propertyId?: string): Promise<ApiResponse<Room[]>> {
    const params = propertyId ? { propertyId } : {}
    return this.client.get('/rooms', { params })
  }

  async getById(id: string): Promise<ApiResponse<Room>> {
    return this.client.get(`/rooms/${id}`)
  }

  async create(data: CreateRoomDto): Promise<ApiResponse<Room>> {
    return this.client.post('/rooms', data)
  }

  async update(id: string, data: Partial<CreateRoomDto>): Promise<ApiResponse<Room>> {
    return this.client.patch(`/rooms/${id}`, data)
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.client.delete(`/rooms/${id}`)
  }

  async getAvailability(
    id: string,
    startDate: string,
    endDate: string,
  ): Promise<ApiResponse<any>> {
    return this.client.get(`/rooms/${id}/availability`, {
      params: { startDate, endDate },
    })
  }

  async batchUpdateOrder(updates: Array<{ id: string; sortOrder: number }>): Promise<ApiResponse<void>> {
    return this.client.patch('/rooms/batch-order', { updates })
  }

  async updateVisibility(id: string, isVisible: boolean): Promise<ApiResponse<Room>> {
    return this.client.patch(`/rooms/${id}`, { isVisible })
  }
}

