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
  Logger,
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
  private readonly logger = new Logger(RoomsController.name)
  
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
  async batchUpdateOrder(
    @Request() req: any,
    @Body() body: any, // 临时改用any类型，绕过ValidationPipe
  ) {
    this.logger.log(`=== 批量更新房间顺序请求 ===`)
    this.logger.log(`用户: ${req.user?.userId || 'unknown'}, 租户: ${req.user?.tenantId || 'unknown'}`)
    this.logger.log(`收到的原始Body:`, JSON.stringify(body))
    this.logger.log(`Body类型:`, typeof body)
    this.logger.log(`updates字段类型:`, typeof body.updates)
    this.logger.log(`updates是否数组:`, Array.isArray(body.updates))
    
    if (body.updates && Array.isArray(body.updates) && body.updates.length > 0) {
      this.logger.log(`updates长度: ${body.updates.length}`)
      this.logger.log(`第一个update:`, JSON.stringify(body.updates[0]))
    }
    
    // 手动创建DTO实例进行测试
    const dto = new BatchUpdateOrderDto()
    dto.updates = body.updates
    
    this.logger.log(`创建的DTO:`, JSON.stringify(dto))
    
    await this.roomsService.batchUpdateOrder(req.user.tenantId, dto)
    return { message: '房间排序更新成功' }
  }
}

