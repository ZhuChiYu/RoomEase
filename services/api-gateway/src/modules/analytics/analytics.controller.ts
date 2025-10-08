import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger'
import { AnalyticsService } from './analytics.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取仪表板数据' })
  @ApiQuery({ name: 'propertyId', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  getDashboard(@Request() req: any, @Query('propertyId') propertyId?: string) {
    return this.analyticsService.getDashboard(req.user.tenantId, propertyId)
  }

  @Get('occupancy-trend')
  @ApiOperation({ summary: '获取入住率趋势' })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  @ApiResponse({ status: 200, description: '获取成功' })
  getOccupancyTrend(
    @Request() req: any,
    @Query('propertyId') propertyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getOccupancyTrend(
      req.user.tenantId,
      propertyId,
      new Date(startDate),
      new Date(endDate),
    )
  }

  @Get('revenue')
  @ApiOperation({ summary: '获取收入统计' })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiResponse({ status: 200, description: '获取成功' })
  getRevenue(
    @Request() req: any,
    @Query('propertyId') propertyId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.analyticsService.getRevenue(
      req.user.tenantId,
      propertyId,
      parseInt(year),
      parseInt(month),
    )
  }

  @Get('channel-performance')
  @ApiOperation({ summary: '获取渠道统计' })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  @ApiResponse({ status: 200, description: '获取成功' })
  getChannelPerformance(
    @Request() req: any,
    @Query('propertyId') propertyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getChannelPerformance(
      req.user.tenantId,
      propertyId,
      new Date(startDate),
      new Date(endDate),
    )
  }
}

