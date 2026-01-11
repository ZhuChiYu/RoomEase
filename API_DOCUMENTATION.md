# RoomEase API 文档

## 概述

RoomEase 提供完整的 RESTful API，用于酒店和民宿管理系统的所有功能。

**Base URL**: `http://localhost:4000` (开发环境) / `https://api.roomease.com` (生产环境)

**API 文档**: `http://localhost:4000/docs` (Swagger UI)

## 认证

所有API请求（除了登录和注册）都需要在请求头中包含JWT令牌：

```
Authorization: Bearer <access_token>
```

### 获取令牌

**POST /auth/login**

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

响应：
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "user-id",
    "email": "admin@example.com",
    "name": "管理员",
    "role": "OWNER"
  }
}
```

### 刷新令牌

**POST /auth/refresh**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

## API 端点

### 1. 认证模块 (Auth)

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | /auth/login | 用户登录 |
| POST | /auth/register | 用户注册 |
| POST | /auth/refresh | 刷新访问令牌 |
| GET | /auth/profile | 获取当前用户信息 |
| POST | /auth/logout | 用户登出 |

### 2. 房间管理 (Rooms)

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | /rooms | 获取所有房间 |
| GET | /rooms/:id | 获取单个房间详情 |
| POST | /rooms | 创建房间 |
| PATCH | /rooms/:id | 更新房间信息 |
| DELETE | /rooms/:id | 删除房间 |
| GET | /rooms/:id/availability | 查询房间可用性 |

**创建房间示例**:

```json
{
  "name": "1202",
  "code": "R1202",
  "roomType": "大床房",
  "maxGuests": 2,
  "bedCount": 1,
  "bathroomCount": 1,
  "basePrice": 299.00,
  "propertyId": "property-id-123",
  "amenities": ["WiFi", "空调", "电视"],
  "isActive": true
}
```

### 3. 预订管理 (Reservations)

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | /reservations | 获取所有预订 |
| GET | /reservations/:id | 获取单个预订详情 |
| POST | /reservations | 创建预订 |
| PATCH | /reservations/:id | 更新预订信息 |
| POST | /reservations/:id/cancel | 取消预订 |
| POST | /reservations/:id/check-in | 办理入住 |
| POST | /reservations/:id/check-out | 办理退房 |
| DELETE | /reservations/:id | 删除预订 |

**查询参数**:
- `propertyId`: 物业ID
- `roomId`: 房间ID
- `status`: 预订状态 (PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED)
- `startDate`: 开始日期
- `endDate`: 结束日期

**创建预订示例**:

```json
{
  "propertyId": "property-id-123",
  "roomId": "room-id-456",
  "checkInDate": "2024-12-01",
  "checkOutDate": "2024-12-05",
  "guestCount": 2,
  "childCount": 0,
  "roomRate": 299.00,
  "totalAmount": 1196.00,
  "guestName": "张三",
  "guestPhone": "13800138000",
  "guestEmail": "zhangsan@example.com",
  "source": "Booking.com"
}
```

### 4. 房态日历 (Calendar)

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | /calendar | 获取房态日历 |
| POST | /calendar/block | 关房 |
| DELETE | /calendar/block | 取消关房 |
| POST | /calendar/price | 设置特殊价格 |

**获取日历示例**:

```
GET /calendar?propertyId=property-id&startDate=2024-12-01&endDate=2024-12-31
```

**关房示例**:

```json
{
  "roomId": "room-id-456",
  "startDate": "2024-12-10",
  "endDate": "2024-12-15",
  "reason": "维修"
}
```

### 5. 统计分析 (Analytics)

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | /analytics/dashboard | 获取仪表板数据 |
| GET | /analytics/occupancy-trend | 获取入住率趋势 |
| GET | /analytics/revenue | 获取收入统计 |
| GET | /analytics/channel-performance | 获取渠道统计 |

**仪表板数据响应**:

```json
{
  "totalRooms": 50,
  "occupiedRooms": 35,
  "availableRooms": 15,
  "occupancyRate": 70.0,
  "todayCheckIns": 5,
  "todayCheckOuts": 3,
  "totalRevenue": 125000.00,
  "paidRevenue": 120000.00,
  "monthlyReservations": 150
}
```

## 错误处理

API使用标准HTTP状态码：

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权或令牌无效
- `403 Forbidden`: 无权访问
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突
- `500 Internal Server Error`: 服务器错误

**错误响应格式**:

```json
{
  "statusCode": 400,
  "message": "验证失败",
  "error": "Bad Request"
}
```

## 数据类型

### 预订状态 (ReservationStatus)

- `PENDING`: 待确认
- `CONFIRMED`: 已确认
- `CHECKED_IN`: 已入住
- `CHECKED_OUT`: 已退房
- `CANCELLED`: 已取消
- `NO_SHOW`: 未到店

### 用户角色 (UserRole)

- `OWNER`: 业主
- `MANAGER`: 经理
- `FRONTDESK`: 前台
- `CLEANING`: 清洁
- `FINANCE`: 财务

## 速率限制

为防止滥用，API实施了速率限制：

- 短期: 每秒10个请求
- 中期: 每10秒100个请求
- 长期: 每分钟1000个请求

超出限制将返回 `429 Too Many Requests`。

## WebSocket

实时更新通过WebSocket提供：

```javascript
const socket = io('ws://localhost:4000', {
  auth: {
    token: 'your-access-token'
  }
})

socket.on('RESERVATION_CREATED', (data) => {
  console.log('新预订:', data)
})

socket.on('CALENDAR_UPDATED', (data) => {
  console.log('日历更新:', data)
})
```

## 示例代码

### JavaScript/TypeScript

```typescript
import { createApiClient } from '@roomease/api-client'

const api = createApiClient({
  baseURL: 'http://localhost:4000'
})

// 登录
const { data } = await api.auth.login('admin@example.com', 'password123')

// 获取房间列表
const rooms = await api.rooms.getAll()

// 创建预订
const reservation = await api.reservations.create({
  propertyId: 'property-id',
  roomId: 'room-id',
  checkInDate: '2024-12-01',
  checkOutDate: '2024-12-05',
  guestName: '张三',
  guestPhone: '13800138000',
  roomRate: 299,
  totalAmount: 1196
})
```

### React Native (Mobile App)

```typescript
import { apiService } from './services/apiService'

// 登录
await apiService.auth.login('admin@example.com', 'password123')

// 获取房间
const rooms = await apiService.rooms.getAll()

// 创建预订
const reservation = await apiService.reservations.create({
  propertyId: 'property-id',
  roomId: 'room-id',
  checkInDate: '2024-12-01',
  checkOutDate: '2024-12-05',
  guestName: '张三',
  guestPhone: '13800138000',
  roomRate: 299,
  totalAmount: 1196
})
```

## 最佳实践

1. **令牌管理**: 妥善保存访问令牌和刷新令牌
2. **错误处理**: 始终处理API错误响应
3. **重试机制**: 对网络错误实施重试
4. **数据验证**: 在发送前验证请求数据
5. **缓存**: 适当缓存不经常变化的数据
6. **日期格式**: 统一使用ISO 8601格式 (YYYY-MM-DD)
7. **金额**: 使用数字类型，保留两位小数

## 技术支持

如有问题，请联系：
- 邮箱: support@roomease.com
- 文档: https://docs.roomease.com
- GitHub: https://github.com/roomease/roomease

