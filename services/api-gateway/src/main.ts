import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // 安全配置
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      }
    },
    crossOriginEmbedderPolicy: false
  }))

  // CORS 配置
  app.enableCors({
    origin: [
      'http://localhost:3000', // Web 开发环境
      'http://localhost:19006', // Expo 开发环境
      'https://app.roomease.com', // 生产环境
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false, // 改为false，允许额外属性通过，避免嵌套DTO验证问题
    transform: true,
    transformOptions: {
      enableImplicitConversion: true
    },
    // 添加详细的错误消息
    disableErrorMessages: false,
    exceptionFactory: (errors) => {
      // 打印详细的验证错误
      console.error('🔴 验证失败:', JSON.stringify(errors, null, 2))
      return new (require('@nestjs/common').BadRequestException)(errors)
    }
  }))

  // 全局异常过滤器 - 统一返回中文错误消息
  app.useGlobalFilters(new HttpExceptionFilter())

  // Swagger API 文档
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('RoomEase API')
      .setDescription('酒店民宿管理系统 API 文档')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', '认证相关')
      .addTag('users', '用户管理')
      .addTag('properties', '物业管理')
      .addTag('rooms', '房间管理')
      .addTag('reservations', '预订管理')
      .addTag('calendar', '房态日历')
      .addTag('pricing', '价格管理')
      .addTag('analytics', '数据分析')
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  }

  // 启动服务
  const port = configService.get('PORT') || 4000
  await app.listen(port, '0.0.0.0') // 监听所有网络接口，允许局域网访问

  console.log(`🚀 API Gateway 启动成功！`)
  console.log(`📖 本地访问: http://localhost:${port}/docs`)
  console.log(`📱 移动端访问: http://192.168.31.221:${port}/docs`)
  console.log(`🔗 GraphQL: http://localhost:${port}/graphql`)
  console.log(`💬 WebSocket: ws://localhost:${port}`)
}

bootstrap() 