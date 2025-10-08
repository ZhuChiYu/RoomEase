import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'admin@roomease.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string

  @ApiProperty({ example: '张三' })
  @IsString()
  name: string

  @ApiProperty({ example: '13800138000', required: false })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiProperty({ example: 'my-hotel', description: '租户标识符' })
  @IsString()
  tenantSlug: string
}

