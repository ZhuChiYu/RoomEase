import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsPhoneNumber } from 'class-validator'

export class UpdateProfileDto {
  @ApiProperty({ description: '姓名', required: false })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiProperty({ description: '民宿/酒店名称', required: false })
  @IsOptional()
  @IsString()
  hotelName?: string

  @ApiProperty({ description: '职位', required: false })
  @IsOptional()
  @IsString()
  position?: string
}

