import { Injectable } from '@nestjs/common'
import { DatabaseService } from '../../services/database/database.service'

@Injectable()
export class AnalyticsService {
  constructor(private prisma: DatabaseService) {}

  /**
   * 获取仪表板统计数据
   */
  async getDashboard(tenantId: string, propertyId?: string): Promise<any> {
    const where: any = { tenantId }
    if (propertyId) {
      where.propertyId = propertyId
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 总房间数
    const roomWhere: any = {}
    if (propertyId) {
      roomWhere.propertyId = propertyId
    }
    const totalRooms = await this.prisma.room.count({
      where: roomWhere,
    })

    // 今日入住的房间数
    const occupiedRooms = await this.prisma.reservation.count({
      where: {
        ...where,
        status: 'CHECKED_IN',
        checkInDate: { lte: tomorrow },
        checkOutDate: { gte: today },
      },
    })

    // 今日入住
    const todayCheckIns = await this.prisma.reservation.count({
      where: {
        ...where,
        checkInDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    // 今日退房
    const todayCheckOuts = await this.prisma.reservation.count({
      where: {
        ...where,
        checkOutDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    // 总收入（已支付）
    const revenueData = await this.prisma.reservation.aggregate({
      where: {
        ...where,
        status: {
          not: 'CANCELLED',
        },
      },
      _sum: {
        paidAmount: true,
        totalAmount: true,
      },
    })

    // 本月预订数
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthlyReservations = await this.prisma.reservation.count({
      where: {
        ...where,
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
    })

    return {
      totalRooms,
      occupiedRooms,
      availableRooms: totalRooms - occupiedRooms,
      occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
      todayCheckIns,
      todayCheckOuts,
      totalRevenue: revenueData._sum.totalAmount || 0,
      paidRevenue: revenueData._sum.paidAmount || 0,
      monthlyReservations,
    }
  }

  /**
   * 获取入住率趋势
   */
  async getOccupancyTrend(
    tenantId: string,
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const totalRooms = await this.prisma.room.count({
      where: {
        propertyId,
        property: { tenantId },
      },
    })

    const days = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const nextDay = new Date(currentDate)
      nextDay.setDate(nextDay.getDate() + 1)

      const occupiedRooms = await this.prisma.reservation.count({
        where: {
          tenantId,
          propertyId,
          status: {
            in: ['CONFIRMED', 'CHECKED_IN'],
          },
          checkInDate: { lte: nextDay },
          checkOutDate: { gte: currentDate },
        },
      })

      days.push({
        date: currentDate.toISOString().split('T')[0],
        occupiedRooms,
        totalRooms,
        occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  /**
   * 获取收入统计
   */
  async getRevenue(tenantId: string, propertyId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const reservations = await this.prisma.reservation.findMany({
      where: {
        tenantId,
        propertyId,
        checkInDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELLED',
        },
      },
    })

    const totalRevenue = reservations.reduce((sum, r) => sum + Number(r.totalAmount), 0)
    const paidRevenue = reservations.reduce((sum, r) => sum + Number(r.paidAmount), 0)

    return {
      year,
      month,
      totalRevenue,
      paidRevenue,
      unpaidRevenue: totalRevenue - paidRevenue,
      totalReservations: reservations.length,
      averageRevenue: reservations.length > 0 ? totalRevenue / reservations.length : 0,
    }
  }

  /**
   * 获取渠道统计
   */
  async getChannelPerformance(tenantId: string, propertyId: string, startDate: Date, endDate: Date) {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        tenantId,
        propertyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // 按渠道分组统计
    const channelMap = new Map<string, any>()

    reservations.forEach((reservation) => {
      const channel = reservation.source || '直订'
      if (!channelMap.has(channel)) {
        channelMap.set(channel, {
          channel,
          reservations: 0,
          revenue: 0,
          cancelled: 0,
        })
      }

      const stats = channelMap.get(channel)
      stats.reservations++
      stats.revenue += Number(reservation.totalAmount)
      if (reservation.status === 'CANCELLED') {
        stats.cancelled++
      }
    })

    return Array.from(channelMap.values()).map((stats) => ({
      ...stats,
      cancellationRate:
        stats.reservations > 0 ? (stats.cancelled / stats.reservations) * 100 : 0,
    }))
  }
}

