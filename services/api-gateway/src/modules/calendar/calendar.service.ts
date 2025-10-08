import { Injectable } from '@nestjs/common'
import { DatabaseService } from '../../services/database/database.service'

@Injectable()
export class CalendarService {
  constructor(private prisma: DatabaseService) {}

  /**
   * 获取房态日历数据
   */
  async getCalendar(
    tenantId: string,
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    // 获取该物业下的所有房间
    const rooms = await this.prisma.room.findMany({
      where: {
        propertyId,
        property: { tenantId },
      },
      orderBy: { code: 'asc' },
    })

    // 获取该时间段内的所有预订（包括待确认、已确认、已入住的预订）
    const reservations = await this.prisma.reservation.findMany({
      where: {
        propertyId,
        tenantId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
        },
        OR: [
          {
            checkInDate: { lte: endDate },
            checkOutDate: { gte: startDate },
          },
        ],
      },
      include: {
        room: true,
      },
    })

    // 获取日历覆盖（关房、特殊价格等）
    const overrides = await this.prisma.calendarOverride.findMany({
      where: {
        room: {
          propertyId,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        room: true,
      },
    })

    return {
      rooms,
      reservations,
      overrides,
    }
  }

  /**
   * 设置房间关房
   */
  async blockRoom(
    tenantId: string,
    roomId: string,
    startDate: Date,
    endDate: Date,
    reason?: string,
  ) {
    // 验证房间属于该租户
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        property: { tenantId },
      },
    })

    if (!room) {
      throw new Error('房间不存在或无权访问')
    }

    // 为每一天创建覆盖记录
    const overrides = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      overrides.push({
        roomId,
        date: new Date(currentDate),
        isBlocked: true,
        reason,
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // 批量创建或更新
    await this.prisma.$transaction(
      overrides.map((override) =>
        this.prisma.calendarOverride.upsert({
          where: {
            roomId_date: {
              roomId: override.roomId,
              date: override.date,
            },
          },
          create: override,
          update: override,
        }),
      ),
    )

    return { message: '关房成功', count: overrides.length }
  }

  /**
   * 取消房间关房
   */
  async unblockRoom(tenantId: string, roomId: string, startDate: Date, endDate: Date) {
    // 验证房间属于该租户
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        property: { tenantId },
      },
    })

    if (!room) {
      throw new Error('房间不存在或无权访问')
    }

    await this.prisma.calendarOverride.deleteMany({
      where: {
        roomId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        isBlocked: true,
      },
    })

    return { message: '取消关房成功' }
  }

  /**
   * 设置特殊价格
   */
  async setSpecialPrice(
    tenantId: string,
    roomId: string,
    date: Date,
    price: number,
  ): Promise<any> {
    // 验证房间属于该租户
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        property: { tenantId },
      },
    })

    if (!room) {
      throw new Error('房间不存在或无权访问')
    }

    return this.prisma.calendarOverride.upsert({
      where: {
        roomId_date: {
          roomId,
          date,
        },
      },
      create: {
        roomId,
        date,
        price,
      },
      update: {
        price,
      },
    })
  }
}

