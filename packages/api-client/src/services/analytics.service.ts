import { ApiClient } from '../client'
import type { ApiResponse } from '../types'

export interface DashboardData {
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  occupancyRate: number
  todayCheckIns: number
  todayCheckOuts: number
  totalRevenue: number
  paidRevenue: number
  monthlyReservations: number
}

export interface OccupancyTrendData {
  date: string
  occupiedRooms: number
  totalRooms: number
  occupancyRate: number
}

export interface RevenueData {
  year: number
  month: number
  totalRevenue: number
  paidRevenue: number
  unpaidRevenue: number
  totalReservations: number
  averageRevenue: number
}

export interface ChannelPerformanceData {
  channel: string
  reservations: number
  revenue: number
  cancelled: number
  cancellationRate: number
}

export class AnalyticsService {
  constructor(private client: ApiClient) {}

  async getDashboard(propertyId?: string): Promise<ApiResponse<DashboardData>> {
    return this.client.get('/analytics/dashboard', {
      params: propertyId ? { propertyId } : {},
    })
  }

  async getOccupancyTrend(
    propertyId: string,
    startDate: string,
    endDate: string,
  ): Promise<ApiResponse<OccupancyTrendData[]>> {
    return this.client.get('/analytics/occupancy-trend', {
      params: { propertyId, startDate, endDate },
    })
  }

  async getRevenue(
    propertyId: string,
    year: number,
    month: number,
  ): Promise<ApiResponse<RevenueData>> {
    return this.client.get('/analytics/revenue', {
      params: { propertyId, year, month },
    })
  }

  async getChannelPerformance(
    propertyId: string,
    startDate: string,
    endDate: string,
  ): Promise<ApiResponse<ChannelPerformanceData[]>> {
    return this.client.get('/analytics/channel-performance', {
      params: { propertyId, startDate, endDate },
    })
  }
}

