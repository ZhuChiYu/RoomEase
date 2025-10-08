import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, Min } from 'class-validator'

export class CreateReservationDto {
  @ApiProperty({ example: '2024-12-01' })
  @IsDateString()
  checkInDate: string

  @ApiProperty({ example: '2024-12-05' })
  @IsDateString()
  checkOutDate: string

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  guestCount: number

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  childCount: number

  @ApiProperty({ example: 299.00 })
  @IsNumber()
  @Min(0)
  roomRate: number

  @ApiProperty({ example: 1196.00 })
  @IsNumber()
  @Min(0)
  totalAmount: number

  @ApiProperty({ example: '张三' })
  @IsString()
  guestName: string

  @ApiProperty({ example: '13800138000', required: false })
  @IsOptional()
  @IsString()
  guestPhone?: string

  @ApiProperty({ example: 'zhangsan@example.com', required: false })
  @IsOptional()
  @IsString()
  guestEmail?: string

  @ApiProperty({ example: '110101199001011234', required: false })
  @IsOptional()
  @IsString()
  guestIdNumber?: string

  @ApiProperty({ example: '北京市朝阳区', required: false })
  @IsOptional()
  @IsString()
  guestAddress?: string

  @ApiProperty({ example: '需要无烟房间', required: false })
  @IsOptional()
  @IsString()
  specialRequests?: string

  @ApiProperty({ example: '客人要求延迟退房', required: false })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiProperty({ example: 'property-id-123' })
  @IsString()
  propertyId: string

  @ApiProperty({ example: 'room-id-456' })
  @IsString()
  roomId: string

  @ApiProperty({ example: 'Booking.com', required: false })
  @IsOptional()
  @IsString()
  source?: string

  @ApiProperty({ example: 'BK123456', required: false })
  @IsOptional()
  @IsString()
  sourceRef?: string
}

