import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { DatabaseService } from '../../services/database/database.service'
import { LoginDto, LoginResponseDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: DatabaseService,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto

    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    })

    if (!user || !user.password) {
      throw new UnauthorizedException('邮箱或密码错误')
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误')
    }

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // 生成令牌
    const tokens = await this.generateTokens(user.id, user.tenantId)

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  }

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    const { email, password, name, phone, tenantSlug } = registerDto

    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册')
    }

    // 查找或创建租户
    let tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    })

    if (!tenant) {
      // 创建新租户
      tenant = await this.prisma.tenant.create({
        data: {
          name: tenantSlug,
          slug: tenantSlug,
          subscription: {
            create: {
              plan: 'FREE',
              status: 'TRIAL',
              billingCycle: 'MONTHLY',
              amount: 0,
              startDate: new Date(),
              trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天试用
              maxProperties: 1,
              maxRooms: 10,
              maxSmsPerMonth: 0,
              features: ['CALENDAR_MANAGEMENT', 'RESERVATION_MANAGEMENT'],
            },
          },
        },
      })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        tenantId: tenant.id,
        role: 'OWNER', // 第一个用户为业主
      },
    })

    // 生成令牌
    const tokens = await this.generateTokens(user.id, tenant.id)

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      })

      return this.generateTokens(payload.sub, payload.tenantId)
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效或已过期')
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private async generateTokens(userId: string, tenantId: string) {
    const payload = { sub: userId, tenantId }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'secret-key',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
        expiresIn: '7d',
      }),
    ])

    return { accessToken, refreshToken }
  }

  /**
   * 验证用户
   */
  async validateUser(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, tenantId },
      include: { tenant: true },
    })

    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    return user
  }
}
