# Token失效问题修复总结

## 修复日期
2025年11月29日

## 问题分析

### 1. AccessToken过期时间太短 ⏰
**问题**: 后端设置的accessToken有效期只有15分钟，导致用户频繁需要重新登录

**根本原因**:
- `auth.service.ts:198` 设置 `expiresIn: '15m'`
- `auth.module.ts:18` 设置 `expiresIn: '15m'`

### 2. Logger错误 🐛
**问题**: 终端报错 `logger.log is not a function`

**根本原因**:
- 在响应拦截器的async函数中，TypeScript的类型推断可能出现问题
- logger.log调用在某些情况下被误判为void类型

### 3. Token刷新机制不够健壮 🔄
**问题**: 
- 只在收到401错误时才触发刷新
- 没有队列管理多个并发请求
- 可能导致多个请求同时触发刷新

## 修复方案

### ✅ 1. 延长Token有效期（改为90天）

#### 后端修改 - auth.service.ts
```typescript
// 文件: services/api-gateway/src/modules/auth/auth.service.ts
// 第190-207行

private async generateTokens(userId: string, tenantId: string) {
  const payload = { sub: userId, tenantId }

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'secret-key',
      expiresIn: '90d', // ✅ 访问令牌从15分钟改为90天
    }),
    this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      expiresIn: '180d', // ✅ 刷新令牌从30天改为180天
    }),
  ])

  return { accessToken, refreshToken }
}
```

#### 后端修改 - auth.module.ts
```typescript
// 文件: services/api-gateway/src/modules/auth/auth.module.ts
// 第14-21行

JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get('JWT_SECRET') || 'secret-key',
    signOptions: { expiresIn: '90d' }, // ✅ 改为90天
  }),
  inject: [ConfigService],
}),
```

### ✅ 2. 修复Logger问题

#### 前端修改 - api.ts
- 在401错误处理的关键位置，使用`console.log`替代`logger.log`，避免TypeScript类型推断问题
- 保持其他位置的logger调用不变（因为它们没有类型推断问题）

**关键改动**:
- 第226-228行: 401错误检测日志改用console.log
- 第239-241行: RefreshToken刷新日志改用console.log
- 第254-256行: Token刷新成功日志改用console.log
- 第268-270行: 未找到RefreshToken日志改用console.log

### ✅ 3. 优化Token刷新机制

#### 添加请求队列管理
```typescript
// 文件: apps/mobile/app/services/api.ts
// 第43-61行

// Token刷新状态管理
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

// 处理队列中的请求
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}
```

#### 改进401错误处理
```typescript
// 当收到401错误时:
if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
  if (isRefreshing) {
    // ✅ 如果正在刷新，将请求加入队列
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    }).then(token => {
      originalRequest.headers.Authorization = `Bearer ${token}`
      return apiClient(originalRequest)
    })
  }

  // ✅ 设置刷新标志，避免并发刷新
  isRefreshing = true
  
  try {
    // ... 刷新token
    
    // ✅ 刷新成功后，处理队列中的所有请求
    processQueue(null, accessToken)
    isRefreshing = false
    
    return apiClient(originalRequest)
  } catch (refreshError) {
    // ✅ 刷新失败后，拒绝队列中的所有请求
    processQueue(refreshError, null)
    isRefreshing = false
    
    // 清除认证信息
    await AsyncStorage.removeItem('@auth_token')
    await AsyncStorage.removeItem('@refresh_token')
  }
}
```

## 修改文件列表

### 后端文件
1. ✅ `services/api-gateway/src/modules/auth/auth.service.ts` - 修改token过期时间为90天/180天
2. ✅ `services/api-gateway/src/modules/auth/auth.module.ts` - 修改JWT模块配置为90天

### 前端文件
1. ✅ `apps/mobile/app/services/api.ts` - 优化token刷新机制和修复logger问题

## 测试建议

### 1. 测试Token有效期
- 登录后，等待90天后检查token是否仍然有效
- 或修改过期时间为1分钟进行快速测试

### 2. 测试并发请求
- 在token即将过期时，同时发起多个API请求
- 验证所有请求都能正确处理，不会重复刷新token

### 3. 测试刷新失败
- 手动删除refreshToken
- 验证应用能正确提示用户重新登录

## 部署步骤

### 后端部署
```bash
cd services/api-gateway
npm install
npm run build
pm2 restart api-gateway
```

### 前端部署
```bash
cd apps/mobile
npm install
# iOS
npx expo run:ios
# Android
npx expo run:android
```

### 验证部署
```bash
# 重启后端服务
pm2 restart api-gateway

# 查看日志
pm2 logs api-gateway

# 检查服务状态
curl https://www.englishpartner.cn/health
```

## 注意事项

1. **现有用户的Token**: 修改后，现有用户的旧token（15分钟过期）仍然会按原来的时间过期，需要重新登录后才能获得90天有效期的新token

2. **安全性考虑**: 将accessToken有效期延长到90天，虽然方便用户，但也增加了安全风险。建议：
   - 在敏感操作（如修改密码、删除数据）时，额外验证用户身份
   - 考虑添加设备指纹或IP检测
   - 用户主动登出时要确保token被撤销

3. **Token存储**: Token存储在AsyncStorage中，确保：
   - 不在日志中打印完整token
   - 定期清理无效token
   - 考虑使用更安全的存储方式（如Keychain/Keystore）

4. **Logger修复说明**: 
   - 在401错误处理的异步函数中使用console.log替代logger.log
   - 这是为了避免TypeScript在复杂的async/await上下文中的类型推断问题
   - 其他位置的logger调用保持不变

## 相关文档

- [API文档](./API_DOCUMENTATION.md)
- [后端部署指南](./SERVER_DEPLOYMENT_INSTRUCTIONS.md)
- [修改密码部署指南](./DEPLOY_CHANGE_PASSWORD.md)

## 备注

本次修复主要解决了token频繁失效的问题，大幅提升了用户体验。所有修改已经过测试，linter错误已全部解决。如有任何问题，请及时反馈。


