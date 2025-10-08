import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger'
import { CalendarService } from './calendar.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: '获取房态日历' })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  @ApiResponse({ status: 200, description: '获取成功' })
  getCalendar(
    @Request() req: any,
    @Query('propertyId') propertyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.calendarService.getCalendar(
      req.user.tenantId,
      propertyId,
      new Date(startDate),
      new Date(endDate),
    )
  }

  @Post('block')
  @ApiOperation({ summary: '关房' })
  @ApiResponse({ status: 200, description: '关房成功' })
  blockRoom(
    @Request() req: any,
    @Body()
    body: {
      roomId: string
      startDate: string
      endDate: string
      reason?: string
    },
  ) {
    return this.calendarService.blockRoom(
      req.user.tenantId,
      body.roomId,
      new Date(body.startDate),
      new Date(body.endDate),
      body.reason,
    )
  }

  @Delete('block')
  @ApiOperation({ summary: '取消关房' })
  @ApiResponse({ status: 200, description: '取消成功' })
  unblockRoom(
    @Request() req: any,
    @Body() body: { roomId: string; startDate: string; endDate: string },
  ) {
    return this.calendarService.unblockRoom(
      req.user.tenantId,
      body.roomId,
      new Date(body.startDate),
      new Date(body.endDate),
    )
  }

  @Post('price')
  @ApiOperation({ summary: '设置特殊价格' })
  @ApiResponse({ status: 200, description: '设置成功' })
  setSpecialPrice(
    @Request() req: any,
    @Body() body: { roomId: string; date: string; price: number },
  ) {
    return this.calendarService.setSpecialPrice(
      req.user.tenantId,
      body.roomId,
      new Date(body.date),
      body.price,
    )
  }
}

