import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123', description: '当前密码' })
  @IsString()
  @MinLength(6, { message: '密码至少需要6位字符' })
  oldPassword: string

  @ApiProperty({ example: 'newPassword123', description: '新密码' })
  @IsString()
  @MinLength(6, { message: '新密码至少需要6位字符' })
  newPassword: string
}


