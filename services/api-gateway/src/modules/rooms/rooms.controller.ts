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
import { RoomsService } from './rooms.service'
import { CreateRoomDto } from './dto/create-room.dto'
import { UpdateRoomDto } from './dto/update-room.dto'
import { BatchUpdateOrderDto } from './dto/batch-update-order.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('rooms')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: '创建房间' })
  @ApiResponse({ status: 201, description: '房间创建成功' })
  @ApiResponse({ status: 409, description: '房间编号已存在' })
  create(@Request() req: any, @Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(req.user.tenantId, createRoomDto)
  }

  @Get()
  @ApiOperation({ summary: '获取所有房间' })
  @ApiQuery({ name: 'propertyId', required: false, description: '物业ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Request() req: any, @Query('propertyId') propertyId?: string) {
    return this.roomsService.findAll(req.user.tenantId, propertyId)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个房间详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '房间不存在' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.roomsService.findOne(req.user.tenantId, id)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新房间信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '房间不存在' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(req.user.tenantId, id, updateRoomDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除房间' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '房间不存在' })
  @ApiResponse({ status: 409, description: '房间有活跃预订，无法删除' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.roomsService.remove(req.user.tenantId, id)
  }

  @Get(':id/availability')
  @ApiOperation({ summary: '查询房间可用性' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  @ApiResponse({ status: 200, description: '查询成功' })
  getAvailability(
    @Request() req: any,
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.roomsService.getAvailability(
      req.user.tenantId,
      id,
      new Date(startDate),
      new Date(endDate),
    )
  }

  @Patch('batch-order')
  @ApiOperation({ summary: '批量更新房间顺序' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '部分房间不存在' })
  batchUpdateOrder(
    @Request() req: any,
    @Body() batchUpdateOrderDto: BatchUpdateOrderDto,
  ) {
    return this.roomsService.batchUpdateOrder(req.user.tenantId, batchUpdateOrderDto)
  }
}

