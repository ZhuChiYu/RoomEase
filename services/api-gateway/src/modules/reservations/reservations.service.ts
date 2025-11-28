import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { DatabaseService } from '../../services/database/database.service'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { UpdateReservationDto } from './dto/update-reservation.dto'
import { ReservationStatus } from '@prisma/client'

@Injectable()
export class ReservationsService {
  constructor(private prisma: DatabaseService) {}

  /**
   * 创建预订
   */
  async create(tenantId: string, userId: string, createReservationDto: CreateReservationDto) {
    const { propertyId, roomId, checkInDate, checkOutDate, ...rest } = createReservationDto

    // 验证日期
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)

    if (checkOut <= checkIn) {
      throw new BadRequestException('退房日期必须晚于入住日期')
    }

    // 验证房间是否存在且属于该租户
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        propertyId,
        property: { tenantId },
      },
    })

    if (!room) {
      throw new NotFoundException('房间不存在或无权访问')
    }

    // 检查房间是否可用（是否有冲突的预订）
    const conflictingReservations = await this.prisma.reservation.findMany({
      where: {
        roomId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
        },
        OR: [
          {
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
          },
        ],
      },
    })

    if (conflictingReservations.length > 0) {
      throw new ConflictException('该时间段房间已被预订')
    }

    // 创建预订
    return this.prisma.reservation.create({
      data: {
        tenantId,
        propertyId,
        roomId,
        userId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        status: 'PENDING',
        ...rest,
      },
      include: {
        room: true,
        property: true,
      },
    })
  }

  /**
   * 获取所有预订
   */
  async findAll(
    tenantId: string,
    filters?: {
      propertyId?: string
      roomId?: string
      status?: ReservationStatus
      startDate?: string
      endDate?: string
    },
  ) {
    const where: any = { tenantId }

    if (filters?.propertyId) {
      where.propertyId = filters.propertyId
    }

    if (filters?.roomId) {
      where.roomId = filters.roomId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    // 查询与日期范围有重叠的预订
    if (filters?.startDate && filters?.endDate) {
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)
      
      // 查询条件：预订的入住日期 < 查询结束日期 AND 预订的退房日期 > 查询开始日期
      where.checkInDate = { lt: endDate }
      where.checkOutDate = { gt: startDate }
    } else if (filters?.startDate) {
      // 只有开始日期：查询退房日期 > 开始日期
      where.checkOutDate = { gt: new Date(filters.startDate) }
    } else if (filters?.endDate) {
      // 只有结束日期：查询入住日期 < 结束日期
      where.checkInDate = { lt: new Date(filters.endDate) }
    }

    return this.prisma.reservation.findMany({
      where,
      include: {
        room: true,
        property: true,
      },
      orderBy: { checkInDate: 'desc' },
    })
  }

  /**
   * 获取单个预订
   */
  async findOne(tenantId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, tenantId },
      include: {
        room: true,
        property: true,
        guestIdentities: true,
      },
    })

    if (!reservation) {
      throw new NotFoundException('预订不存在')
    }

    return reservation
  }

  /**
   * 更新预订
   */
  async update(tenantId: string, id: string, updateReservationDto: UpdateReservationDto) {
    // 验证预订是否存在
    await this.findOne(tenantId, id)

    // 如果更新日期，需要验证
    if (updateReservationDto.checkInDate || updateReservationDto.checkOutDate) {
      const reservation = await this.prisma.reservation.findUnique({ where: { id } })
      const checkIn = updateReservationDto.checkInDate
        ? new Date(updateReservationDto.checkInDate)
        : reservation!.checkInDate
      const checkOut = updateReservationDto.checkOutDate
        ? new Date(updateReservationDto.checkOutDate)
        : reservation!.checkOutDate

      if (checkOut <= checkIn) {
        throw new BadRequestException('退房日期必须晚于入住日期')
      }

      // 检查房间冲突
      const conflictingReservations = await this.prisma.reservation.findMany({
        where: {
          roomId: reservation!.roomId,
          status: {
            in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
          },
          NOT: { id },
          OR: [
            {
              checkInDate: { lt: checkOut },
              checkOutDate: { gt: checkIn },
            },
          ],
        },
      })

      if (conflictingReservations.length > 0) {
        throw new ConflictException('该时间段房间已被预订')
      }
    }

    return this.prisma.reservation.update({
      where: { id },
      data: {
        ...updateReservationDto,
        checkInDate: updateReservationDto.checkInDate
          ? new Date(updateReservationDto.checkInDate)
          : undefined,
        checkOutDate: updateReservationDto.checkOutDate
          ? new Date(updateReservationDto.checkOutDate)
          : undefined,
      },
      include: {
        room: true,
        property: true,
      },
    })
  }

  /**
   * 取消预订
   */
  async cancel(tenantId: string, id: string) {
    const reservation = await this.findOne(tenantId, id)

    if (reservation.status === 'CANCELLED') {
      throw new BadRequestException('预订已被取消')
    }

    if (reservation.status === 'CHECKED_OUT') {
      throw new BadRequestException('已退房的预订无法取消')
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        room: true,
        property: true,
      },
    })
  }

  /**
   * 入住
   */
  async checkIn(tenantId: string, id: string) {
    const reservation = await this.findOne(tenantId, id)

    if (reservation.status !== 'CONFIRMED' && reservation.status !== 'PENDING') {
      throw new BadRequestException(`无法办理入住，当前状态: ${reservation.status}`)
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'CHECKED_IN' },
      include: {
        room: true,
        property: true,
      },
    })
  }

  /**
   * 退房
   */
  async checkOut(tenantId: string, id: string) {
    const reservation = await this.findOne(tenantId, id)

    if (reservation.status !== 'CHECKED_IN') {
      throw new BadRequestException('只有已入住的预订才能退房')
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'CHECKED_OUT' },
      include: {
        room: true,
        property: true,
      },
    })
  }

  /**
   * 删除预订
   */
  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id)

    return this.prisma.reservation.delete({
      where: { id },
    })
  }
}

