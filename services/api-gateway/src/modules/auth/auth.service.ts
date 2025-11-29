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

    // 确保用户有默认property（自动创建）
    let defaultProperty = await this.prisma.property.findFirst({
      where: { tenantId: user.tenantId },
    })

    if (!defaultProperty) {
      // 自动创建默认property
      defaultProperty = await this.prisma.property.create({
        data: {
          name: user.tenant.name || '默认物业',
          address: '待补充',
          tenantId: user.tenantId,
          timezone: user.tenant.timezone || 'Asia/Shanghai',
          currency: user.tenant.currency || 'CNY',
          checkInTime: '15:00',
          checkOutTime: '12:00',
          isActive: true,
        },
      })
    }

    // 生成令牌
    const tokens = await this.generateTokens(user.id, user.tenantId)

    return {
      ...tokens,
      token: tokens.accessToken, // 兼容前端
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        propertyId: defaultProperty.id, // 返回默认propertyId
      },
    }
  }

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    const { email, password, name, phone, hotelName, tenantSlug } = registerDto

    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册')
    }

    // 生成租户标识符（如果未提供）
    const slug = tenantSlug || this.generateSlug(hotelName || email)

    // 查找或创建租户
    let tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    })

    if (!tenant) {
      // 创建新租户
      tenant = await this.prisma.tenant.create({
        data: {
          name: hotelName || name + '的酒店',
          slug,
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

    // 创建默认property
    const defaultProperty = await this.prisma.property.create({
      data: {
        name: hotelName || name + '的酒店',
        address: '待补充',
        tenantId: tenant.id,
        timezone: tenant.timezone || 'Asia/Shanghai',
        currency: tenant.currency || 'CNY',
        checkInTime: '15:00',
        checkOutTime: '12:00',
        isActive: true,
      },
    })

    // 生成令牌
    const tokens = await this.generateTokens(user.id, tenant.id)

    return {
      ...tokens,
      token: tokens.accessToken, // 兼容前端
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenant.id,
        propertyId: defaultProperty.id, // 返回默认propertyId
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
        expiresIn: '15m', // 访问令牌15分钟
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
        expiresIn: '30d', // 刷新令牌30天
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

  /**
   * 生成租户标识符
   */
  private generateSlug(input: string): string {
    // 移除特殊字符，转换为小写，用连字符连接
    const slug = input
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-')      // 空格转连字符
      .replace(/-+/g, '-')       // 多个连字符转单个
      .trim()
    
    // 添加随机后缀以确保唯一性
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    return `${slug}-${randomSuffix}`
  }
}
