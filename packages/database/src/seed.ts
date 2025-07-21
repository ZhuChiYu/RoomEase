import { PrismaClient } from '@prisma/client'
import { passwordUtils, idUtils } from './utils'

const prisma = new PrismaClient()

async function main() {
  console.log('开始数据库种子...')

  // 创建默认租户
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: '演示民宿',
      slug: 'demo',
      domain: 'demo.roomease.com',
      timezone: 'Asia/Shanghai',
      currency: 'CNY',
      language: 'zh-CN'
    }
  })

  // 创建默认用户
  const hashedPassword = await passwordUtils.hash('123456')
  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      phone: '13800138000',
      password: hashedPassword,
      name: '管理员',
      role: 'OWNER',
      permissions: ['*'],
      tenantId: tenant.id,
      emailVerified: true
    }
  })

  // 创建默认物业
  const property = await prisma.property.upsert({
    where: { id: 'demo-property' },
    update: {},
    create: {
      id: 'demo-property',
      name: '阳光民宿',
      description: '位于市中心的温馨民宿，交通便利，设施齐全',
      address: '上海市黄浦区南京东路123号',
      coordinates: {
        lat: 31.2304,
        lng: 121.4737
      },
      phone: '021-12345678',
      email: 'info@sunshine-bnb.com',
      checkInTime: '15:00',
      checkOutTime: '12:00',
      tenantId: tenant.id
    }
  })

  // 创建房间
  const rooms = [
    {
      name: '豪华大床房',
      code: 'A101',
      roomType: '大床房',
      maxGuests: 2,
      bedCount: 1,
      basePrice: 299,
      amenities: ['WiFi', '空调', '电视', '热水器', '冰箱'],
      images: ['https://example.com/room1.jpg']
    },
    {
      name: '标准双人房',
      code: 'A102',
      roomType: '双人房',
      maxGuests: 2,
      bedCount: 2,
      basePrice: 199,
      amenities: ['WiFi', '空调', '电视', '热水器'],
      images: ['https://example.com/room2.jpg']
    },
    {
      name: '家庭套房',
      code: 'B201',
      roomType: '套房',
      maxGuests: 4,
      bedCount: 2,
      basePrice: 399,
      amenities: ['WiFi', '空调', '电视', '热水器', '冰箱', '洗衣机'],
      images: ['https://example.com/room3.jpg']
    }
  ]

  for (const roomData of rooms) {
    await prisma.room.upsert({
      where: { 
        propertyId_code: {
          propertyId: property.id,
          code: roomData.code
        }
      },
      update: {},
      create: {
        ...roomData,
        propertyId: property.id
      }
    })
  }

  // 创建价格规则
  await prisma.priceRule.upsert({
    where: { id: 'weekend-rule' },
    update: {},
    create: {
      id: 'weekend-rule',
      name: '周末价格',
      description: '周末加价20%',
      type: 'WEEKEND',
      priority: 10,
      weekdays: [0, 6], // 周日和周六
      adjustment: 'PERCENTAGE',
      value: 20,
      propertyId: property.id
    }
  })

  // 创建免费订阅
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      plan: 'FREE',
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      amount: 0,
      startDate: new Date(),
      maxProperties: 1,
      maxRooms: 3,
      maxSmsPerMonth: 0,
      features: ['CALENDAR_MANAGEMENT', 'RESERVATION_MANAGEMENT'],
      tenantId: tenant.id
    }
  })

  // 创建示例预订
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 3)

  const room = await prisma.room.findFirst({
    where: { code: 'A101', propertyId: property.id }
  })

  if (room) {
    await prisma.reservation.upsert({
      where: { id: 'demo-reservation' },
      update: {},
      create: {
        id: 'demo-reservation',
        checkInDate: tomorrow,
        checkOutDate: dayAfterTomorrow,
        guestCount: 2,
        roomRate: 299,
        totalAmount: 897, // 3天 * 299
        status: 'CONFIRMED',
        source: 'Direct',
        guestName: '张三',
        guestPhone: '13900139000',
        guestEmail: 'guest@example.com',
        tenantId: tenant.id,
        propertyId: property.id,
        roomId: room.id,
        userId: user.id
      }
    })
  }

  console.log('数据库种子完成!')
  console.log('默认登录信息:')
  console.log('邮箱: admin@demo.com')
  console.log('密码: 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 