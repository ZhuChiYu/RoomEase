import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, Min } from 'class-validator'

export class CreateRoomDto {
  @ApiProperty({ example: '1202' })
  @IsString()
  name: string

  @ApiProperty({ example: 'R1202' })
  @IsString()
  code: string

  @ApiProperty({ example: '舒适的大床房', required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ example: '大床房' })
  @IsString()
  roomType: string

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  maxGuests: number

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  bedCount: number

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  bathroomCount: number

  @ApiProperty({ example: 25.5, required: false })
  @IsOptional()
  @IsNumber()
  area?: number

  @ApiProperty({ example: 12, required: false })
  @IsOptional()
  @IsNumber()
  floor?: number

  @ApiProperty({ example: ['WiFi', '空调', '电视'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[]

  @ApiProperty({ example: ['https://example.com/room1.jpg'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @ApiProperty({ example: 299.00 })
  @IsNumber()
  @Min(0)
  basePrice: number

  @ApiProperty({ example: 'property-id-123' })
  @IsString()
  propertyId: string

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

