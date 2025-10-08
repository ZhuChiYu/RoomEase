import { ApiClient } from '../client'
import type { ApiResponse, LoginResponse } from '../types'

export class AuthService {
  constructor(private client: ApiClient) {}

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.client.post('/auth/login', { email, password })
  }

  async register(data: {
    email: string
    password: string
    name: string
    phone?: string
    tenantSlug: string
  }): Promise<ApiResponse<LoginResponse>> {
    return this.client.post('/auth/register', data)
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return this.client.post('/auth/refresh', { refreshToken })
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.client.get('/auth/profile')
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return this.client.post('/auth/logout')
  }
}

