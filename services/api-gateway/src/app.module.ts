import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
// import { GraphQLModule } from '@nestjs/graphql'
// import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
// import { join } from 'path'

// 导入子模块
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { PropertiesModule } from './modules/properties/properties.module'
import { RoomsModule } from './modules/rooms/rooms.module'
import { ReservationsModule } from './modules/reservations/reservations.module'
import { CalendarModule } from './modules/calendar/calendar.module'
import { PricingModule } from './modules/pricing/pricing.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { WebSocketModule } from './modules/websocket/websocket.module'

// 全局服务
import { RedisModule } from './services/redis/redis.module'
import { DatabaseModule } from './services/database/database.module'

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 限流模块
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 1000,
      },
    ]),

    // GraphQL 模块 (暂时禁用)
    // GraphQLModule.forRoot<ApolloDriverConfig>({
    //   driver: ApolloDriver,
    //   autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    //   sortSchema: true,
    //   playground: process.env.NODE_ENV !== 'production',
    //   introspection: true,
    //   context: ({ req, res, connection }) => {
    //     if (connection) {
    //       return { req: connection.context, res }
    //     }
    //     return { req, res }
    //   },
    //   subscriptions: {
    //     'graphql-ws': true,
    //     'subscriptions-transport-ws': true,
    //   },
    // }),

    // 基础服务
    DatabaseModule,
    RedisModule,

    // 业务模块
    AuthModule,
    UsersModule,
    PropertiesModule,
    RoomsModule,
    ReservationsModule,
    CalendarModule,
    PricingModule,
    AnalyticsModule,
    WebSocketModule,
  ],
})
export class AppModule {} 