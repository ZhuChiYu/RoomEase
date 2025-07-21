import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { AuthService } from './auth.service'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() loginDto: any) {
    // TODO: 实现登录逻辑
    return { message: 'Login endpoint - coming soon' }
  }

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() registerDto: any) {
    // TODO: 实现注册逻辑
    return { message: 'Register endpoint - coming soon' }
  }
} 