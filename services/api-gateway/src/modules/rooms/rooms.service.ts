import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { DatabaseService } from '../../services/database/database.service'
import { CreateRoomDto } from './dto/create-room.dto'
import { UpdateRoomDto } from './dto/update-room.dto'
import { BatchUpdateOrderDto } from './dto/batch-update-order.dto'

@Injectable()
export class RoomsService {
  constructor(private prisma: DatabaseService) {}

  /**
   * 创建房间
   */
  async create(tenantId: string, createRoomDto: CreateRoomDto) {
    const { propertyId, code, ...rest } = createRoomDto

    // 检查房间编号是否已存在
    const existing = await this.prisma.room.findFirst({
      where: {
        propertyId,
        code,
      },
    })

    if (existing) {
      throw new ConflictException('该房间编号已存在')
    }

    // 验证物业是否属于该租户
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    })

    if (!property) {
      throw new NotFoundException('物业不存在或无权访问')
    }

    return this.prisma.room.create({
      data: {
        propertyId,
        code,
        ...rest,
      },
      include: {
        property: true,
      },
    })
  }

  /**
   * 获取所有房间
   */
  async findAll(tenantId: string, propertyId?: string) {
    const where: any = {
      property: { tenantId },
    }

    if (propertyId) {
      where.propertyId = propertyId
    }

    return this.prisma.room.findMany({
      where,
      include: {
        property: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { code: 'asc' }
      ],
    })
  }

  /**
   * 获取单个房间
   */
  async findOne(tenantId: string, id: string) {
    const room = await this.prisma.room.findFirst({
      where: {
        id,
        property: { tenantId },
      },
      include: {
        property: true,
        reservations: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
            },
          },
          orderBy: { checkInDate: 'asc' },
        },
      },
    })

    if (!room) {
      throw new NotFoundException('房间不存在')
    }

    return room
  }

  /**
   * 更新房间
   */
  async update(tenantId: string, id: string, updateRoomDto: UpdateRoomDto) {
    // 验证房间是否存在且属于该租户
    await this.findOne(tenantId, id)

    // 如果更新房间编号，检查是否冲突
    if (updateRoomDto.code) {
      const room = await this.prisma.room.findUnique({ where: { id } })
      const existing = await this.prisma.room.findFirst({
        where: {
          propertyId: room!.propertyId,
          code: updateRoomDto.code,
          NOT: { id },
        },
      })

      if (existing) {
        throw new ConflictException('该房间编号已存在')
      }
    }

    return this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
      include: {
        property: true,
      },
    })
  }

  /**
   * 删除房间
   */
  async remove(tenantId: string, id: string) {
    // 验证房间是否存在且属于该租户
    await this.findOne(tenantId, id)

    // 检查是否有活跃的预订
    const activeReservations = await this.prisma.reservation.count({
      where: {
        roomId: id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
        },
      },
    })

    if (activeReservations > 0) {
      throw new ConflictException('该房间有活跃的预订，无法删除')
    }

    return this.prisma.room.delete({
      where: { id },
    })
  }

  /**
   * 获取房间可用性
   */
  async getAvailability(tenantId: string, id: string, startDate: Date, endDate: Date) {
    const room = await this.findOne(tenantId, id)

    // 查询该时间段的预订
    const reservations = await this.prisma.reservation.findMany({
      where: {
        roomId: id,
        status: {
          in: ['CONFIRMED', 'CHECKED_IN'],
        },
        OR: [
          {
            checkInDate: { lte: endDate },
            checkOutDate: { gte: startDate },
          },
        ],
      },
    })

    // 查询日历覆盖（关房等）
    const overrides = await this.prisma.calendarOverride.findMany({
      where: {
        roomId: id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    return {
      room,
      isAvailable: reservations.length === 0 && overrides.filter(o => o.isBlocked).length === 0,
      reservations,
      blockedDates: overrides.filter(o => o.isBlocked),
    }
  }

  /**
   * 批量更新房间顺序
   */
  async batchUpdateOrder(tenantId: string, batchUpdateOrderDto: BatchUpdateOrderDto) {
    const { updates } = batchUpdateOrderDto

    // 验证所有房间都属于该租户
    const roomIds = updates.map(u => u.id)
    const rooms = await this.prisma.room.findMany({
      where: {
        id: { in: roomIds },
        property: { tenantId }
      }
    })

    if (rooms.length !== roomIds.length) {
      throw new NotFoundException('部分房间不存在或无权访问')
    }

    // 使用事务批量更新
    await this.prisma.$transaction(
      updates.map(update =>
        this.prisma.room.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder }
        })
      )
    )

    return { success: true, updated: updates.length }
  }
}

