// 重新导出共享类型
export * from '@roomease/shared'

// API 特定类型
export interface ApiError {
  code: string
  message: string
  field?: string
  details?: any
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export interface UploadResponse {
  url: string
  filename: string
  mimeType: string
  size: number
} 