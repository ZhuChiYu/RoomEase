# Mobile App API 集成指南

本指南介绍如何将RoomEase Mobile App从本地存储迁移到后端API。

## 架构概览

### 当前架构（本地存储）

```
Mobile App
  ├── Redux Store
  ├── Local Data Service (AsyncStorage)
  └── Components
```

### 新架构（API服务）

```
Mobile App
  ├── Redux Store
  ├── API Client (axios + token管理)
  ├── API Service (数据适配层)
  └── Components
```

## 集成步骤

### 步骤1: 配置环境

编辑 `apps/mobile/app/config/environment.ts`:

```typescript
export const FEATURE_FLAGS = {
  // 切换到API服务
  USE_BACKEND_API: true,  // 改为true启用API
  
  // 其他配置...
}

export const API_CONFIG = {
  BASE_URL: isDev 
    ? 'http://localhost:4000'  // 开发环境
    : 'https://api.roomease.com',  // 生产环境
}
```

### 步骤2: 服务切换

编辑 `apps/mobile/app/services/index.ts`:

```typescript
// 切换服务
const USE_API_SERVICE = true  // 设为true使用API

export const dataService = USE_API_SERVICE ? apiService : localDataService
```

### 步骤3: 初始化应用

在 `apps/mobile/app/_layout.tsx` 中：

```typescript
import { apiClient } from './services/apiClient'
import { FEATURE_FLAGS } from './config/environment'

useEffect(() => {
  const initApp = async () => {
    if (FEATURE_FLAGS.USE_BACKEND_API) {
      // 检查是否已登录
      const token = await apiClient.getTokenManager().getAccessToken()
      if (token) {
        // 验证令牌并获取用户信息
        const user = await apiClient.getCurrentUser()
        if (user.success) {
          // 用户已登录，加载数据
          loadDataFromApi()
        } else {
          // 令牌无效，跳转到登录
          router.push('/login')
        }
      } else {
        // 未登录，跳转到登录
        router.push('/login')
      }
    } else {
      // 使用本地存储
      await initializeLocalData()
    }
  }
  
  initApp()
}, [])
```

### 步骤4: 实现登录功能

创建 `apps/mobile/app/login.tsx`:

```typescript
import { useState } from 'react'
import { View, TextInput, Button, Alert } from 'react-native'
import { apiService } from './services/apiService'
import { router } from 'expo-router'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      const response = await apiService.auth.login(email, password)
      
      if (response.success) {
        // 登录成功，跳转到主页
        router.replace('/')
      } else {
        Alert.alert('登录失败', response.error || '请检查邮箱和密码')
      }
    } catch (error) {
      Alert.alert('错误', '登录时发生错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="邮箱"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="密码"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button 
        title={loading ? '登录中...' : '登录'} 
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  )
}
```

### 步骤5: 更新Redux Actions

修改Redux的异步操作以使用API服务：

```typescript
// apps/mobile/app/store/calendarSlice.ts

import { createAsyncThunk } from '@reduxjs/toolkit'
import { dataService } from '../services'

// 加载房间数据
export const loadRooms = createAsyncThunk(
  'calendar/loadRooms',
  async (propertyId: string | undefined) => {
    return await dataService.rooms.getAll(propertyId)
  }
)

// 创建预订
export const createReservation = createAsyncThunk(
  'calendar/createReservation',
  async (reservationData: any) => {
    return await dataService.reservations.create(reservationData)
  }
)

// 更新预订
export const updateReservation = createAsyncThunk(
  'calendar/updateReservation',
  async ({ id, data }: { id: string; data: any }) => {
    return await dataService.reservations.update(id, data)
  }
)
```

### 步骤6: 处理错误

在组件中处理API错误：

```typescript
import { Alert } from 'react-native'

const handleCreateOrder = async () => {
  try {
    const result = await dispatch(createReservation(orderData)).unwrap()
    Alert.alert('成功', '预订创建成功')
  } catch (error: any) {
    if (error.message === '该时间段房间已被预订') {
      Alert.alert('冲突', '该时间段房间已被预订，请选择其他时间')
    } else if (error.message?.includes('网络')) {
      Alert.alert('网络错误', '请检查网络连接')
    } else {
      Alert.alert('错误', error.message || '创建预订失败')
    }
  }
}
```

### 步骤7: 实现数据同步

如果需要离线功能，可以实现本地缓存：

```typescript
// apps/mobile/app/services/syncService.ts

import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiService } from './apiService'
import NetInfo from '@react-native-community/netinfo'

export class SyncService {
  // 检查网络状态
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch()
    return state.isConnected ?? false
  }

  // 同步数据
  async syncData() {
    const isOnline = await this.isOnline()
    
    if (isOnline) {
      try {
        // 从API获取最新数据
        const rooms = await apiService.rooms.getAll()
        const reservations = await apiService.reservations.getAll()
        
        // 保存到本地缓存
        await AsyncStorage.setItem('cached_rooms', JSON.stringify(rooms))
        await AsyncStorage.setItem('cached_reservations', JSON.stringify(reservations))
        
        return { success: true, data: { rooms, reservations } }
      } catch (error) {
        // API失败，从缓存读取
        return this.loadFromCache()
      }
    } else {
      // 离线，从缓存读取
      return this.loadFromCache()
    }
  }

  // 从缓存加载
  async loadFromCache() {
    const rooms = await AsyncStorage.getItem('cached_rooms')
    const reservations = await AsyncStorage.getItem('cached_reservations')
    
    return {
      success: true,
      data: {
        rooms: rooms ? JSON.parse(rooms) : [],
        reservations: reservations ? JSON.parse(reservations) : []
      }
    }
  }
}

export const syncService = new SyncService()
```

## 数据格式转换

### 后端 → 前端

API服务层 (`apiService.ts`) 已经实现了数据转换：

```typescript
// 后端预订格式
{
  id: "reservation-id",
  checkInDate: "2024-12-01T00:00:00.000Z",
  checkOutDate: "2024-12-05T00:00:00.000Z",
  status: "CHECKED_IN",
  roomRate: 299,
  totalAmount: 1196,
  // ...
}

// 转换为前端格式
{
  id: "reservation-id",
  orderId: "RESERVAT",
  checkInDate: "2024-12-01",
  checkOutDate: "2024-12-05",
  status: "checked-in",
  roomPrice: 299,
  totalAmount: 1196,
  nights: 4,
  // ...
}
```

### 状态映射

```typescript
const statusMap = {
  'PENDING': 'pending',
  'CONFIRMED': 'confirmed',
  'CHECKED_IN': 'checked-in',
  'CHECKED_OUT': 'checked-out',
  'CANCELLED': 'cancelled',
}
```

## 测试API集成

### 1. 单元测试

```typescript
// __tests__/apiService.test.ts

import { apiService } from '../services/apiService'

describe('API Service', () => {
  it('should login successfully', async () => {
    const result = await apiService.auth.login('test@example.com', 'password')
    expect(result.success).toBe(true)
    expect(result.data.accessToken).toBeDefined()
  })

  it('should fetch rooms', async () => {
    const rooms = await apiService.rooms.getAll()
    expect(Array.isArray(rooms)).toBe(true)
  })
})
```

### 2. 手动测试

```typescript
// 测试脚本
import { apiClient } from './services/apiClient'
import { apiService } from './services/apiService'

async function testApi() {
  console.log('🧪 Testing API...')
  
  // 1. 测试登录
  const loginResult = await apiService.auth.login('admin@example.com', 'password123')
  console.log('✅ Login:', loginResult.success)
  
  // 2. 测试获取房间
  const rooms = await apiService.rooms.getAll()
  console.log('✅ Rooms:', rooms.length)
  
  // 3. 测试创建预订
  const reservation = await apiService.reservations.create({
    propertyId: 'property-id',
    roomId: rooms[0].id,
    checkInDate: '2024-12-01',
    checkOutDate: '2024-12-05',
    guestName: '测试客人',
    guestPhone: '13800138000',
    roomRate: 299,
    totalAmount: 1196
  })
  console.log('✅ Reservation:', reservation)
}
```

## 调试技巧

### 1. 启用API日志

```typescript
// apps/mobile/app/services/apiClient.ts

this.client.interceptors.request.use((config) => {
  if (__DEV__) {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url)
    console.log('📦 Data:', config.data)
  }
  return config
})

this.client.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('📥 API Response:', response.status, response.config.url)
      console.log('📦 Data:', response.data)
    }
    return response
  },
  (error) => {
    if (__DEV__) {
      console.error('❌ API Error:', error.response?.status, error.config?.url)
      console.error('📦 Error Data:', error.response?.data)
    }
    return Promise.reject(error)
  }
)
```

### 2. 使用React Native Debugger

```bash
# 安装
brew install react-native-debugger

# 启动
open "rndebugger://set-debugger-loc?host=localhost&port=19000"
```

### 3. 网络检查

```typescript
import { useNetInfo } from '@react-native-community/netinfo'

function App() {
  const netInfo = useNetInfo()
  
  if (!netInfo.isConnected) {
    return <OfflineNotice />
  }
  
  return <MainApp />
}
```

## 性能优化

### 1. 请求去重

```typescript
const requestCache = new Map()

async function cachedRequest(key: string, fn: () => Promise<any>) {
  if (requestCache.has(key)) {
    return requestCache.get(key)
  }
  
  const promise = fn()
  requestCache.set(key, promise)
  
  try {
    const result = await promise
    return result
  } finally {
    requestCache.delete(key)
  }
}
```

### 2. 数据分页

```typescript
// 获取预订（分页）
const getReservations = async (page = 1, limit = 20) => {
  return apiClient.get('/reservations', {
    params: { page, limit }
  })
}
```

### 3. 图片优化

```typescript
// 使用图片CDN
const getImageUrl = (path: string, width?: number) => {
  const cdnUrl = 'https://cdn.roomease.com'
  if (width) {
    return `${cdnUrl}/${path}?w=${width}&q=80`
  }
  return `${cdnUrl}/${path}`
}
```

## 常见问题

### Q: 如何处理令牌过期？

A: API客户端已经实现了自动刷新机制。如果刷新失败，会清除令牌并要求重新登录。

### Q: 离线时如何使用？

A: 实现SyncService，在有网络时同步数据到本地缓存，离线时从缓存读取。

### Q: 如何测试本地API？

A: 
1. 确保后端在 `http://localhost:4000` 运行
2. 对于真机测试，需要使用电脑的局域网IP
3. 修改 `API_CONFIG.BASE_URL` 为 `http://192.168.x.x:4000`

### Q: 如何切换回本地存储？

A: 在 `environment.ts` 中设置 `USE_BACKEND_API: false`

## 迁移检查清单

- [ ] 后端API已部署并可访问
- [ ] 数据库已迁移并填充数据
- [ ] 环境变量已配置
- [ ] 已实现登录功能
- [ ] 已实现错误处理
- [ ] 已实现数据同步（可选）
- [ ] 已测试所有主要功能
- [ ] 已处理离线场景（可选）
- [ ] 已优化性能
- [ ] 已添加日志和监控

## 下一步

1. ✅ 部署后端API到生产环境
2. ✅ 实现用户认证和权限管理
3. ✅ 添加数据同步和离线支持
4. ✅ 实现推送通知
5. ✅ 添加性能监控
6. ✅ 实现数据备份和恢复
7. ✅ 完善错误处理和日志
8. ✅ 编写测试用例
9. ✅ 优化用户体验
10. ✅ 发布到应用商店

## 支持

如有问题，请参考：
- [API文档](./API_DOCUMENTATION.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)
- [GitHub Issues](https://github.com/roomease/roomease/issues)

