import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger'
import { ReservationsService } from './reservations.service'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { UpdateReservationDto } from './dto/update-reservation.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ReservationStatus } from '@prisma/client'

@ApiTags('reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: '创建预订' })
  @ApiResponse({ status: 201, description: '预订创建成功' })
  @ApiResponse({ status: 409, description: '房间已被预订' })
  create(@Request() req: any, @Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(
      req.user.tenantId,
      req.user.id,
      createReservationDto,
    )
  }

  @Get()
  @ApiOperation({ summary: '获取所有预订' })
  @ApiQuery({ name: 'propertyId', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ReservationStatus })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(
    @Request() req: any,
    @Query('propertyId') propertyId?: string,
    @Query('roomId') roomId?: string,
    @Query('status') status?: ReservationStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reservationsService.findAll(req.user.tenantId, {
      propertyId,
      roomId,
      status,
      startDate,
      endDate,
    })
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个预订详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '预订不存在' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.findOne(req.user.tenantId, id)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新预订信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '预订不存在' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(req.user.tenantId, id, updateReservationDto)
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消预订' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 400, description: '无法取消该预订' })
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.cancel(req.user.tenantId, id)
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: '办理入住' })
  @ApiResponse({ status: 200, description: '入住成功' })
  @ApiResponse({ status: 400, description: '无法办理入住' })
  checkIn(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.checkIn(req.user.tenantId, id)
  }

  @Post(':id/check-out')
  @ApiOperation({ summary: '办理退房' })
  @ApiResponse({ status: 200, description: '退房成功' })
  @ApiResponse({ status: 400, description: '无法办理退房' })
  checkOut(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.checkOut(req.user.tenantId, id)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除预订' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '预订不存在' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.reservationsService.remove(req.user.tenantId, id)
  }
}

