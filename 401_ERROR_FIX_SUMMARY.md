# 401错误修复总结

## 问题描述

多个手机登录账号后，app会出现"错误"弹窗，显示"Request failed with status code 401"。

## 问题分析

### 根本原因

1. **Token过期时间过短**：后端生成的accessToken有效期只有15分钟
2. **缺少自动刷新机制**：移动端没有完善的token自动刷新逻辑
3. **Token存储不一致**：有的地方用`@auth_token`，有的地方用`access_token`
4. **错误提示全是英文**：所有的axios错误信息都是英文的，用户体验不好
5. **后端错误消息未国际化**：后端返回的错误消息也是英文

## 解决方案

### 1. 移动端 - 完善Token刷新机制 (api.ts)

**修改内容：**
- 在401错误响应拦截器中增加自动刷新token逻辑
- 使用refreshToken调用后端刷新接口
- 刷新成功后自动重试原请求
- 刷新失败后清除所有认证信息

**关键代码：**
```typescript
// 处理401错误 - Token过期或无效
if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
  // 标记该请求已重试，避免无限循环
  (originalRequest as any)._retry = true
  
  try {
    // 尝试使用refreshToken获取新的accessToken
    const refreshToken = await AsyncStorage.getItem('@refresh_token')
    
    if (refreshToken) {
      // 调用刷新接口
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken }
      )
      
      const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data
      
      if (accessToken) {
        // 保存新的tokens
        await AsyncStorage.setItem('@auth_token', accessToken)
        if (newRefreshToken) {
          await AsyncStorage.setItem('@refresh_token', newRefreshToken)
        }
        
        // 更新原请求的Authorization header并重试
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      }
    }
  } catch (refreshError) {
    // 刷新失败，清除所有认证信息
    await AsyncStorage.removeItem('@auth_token')
    await AsyncStorage.removeItem('@refresh_token')
  }
}
```

### 2. 移动端 - 中文错误消息转换 (api.ts)

**修改内容：**
- 根据HTTP状态码提供中文错误提示
- 处理网络错误的中文提示
- 自动保存认证接口返回的新token和refreshToken

**错误消息映射：**
- 400 → "请求参数错误"
- 401 → "登录已过期，请重新登录"
- 403 → "没有权限执行此操作"
- 404 → "请求的资源不存在"
- 409 → "数据冲突，请刷新后重试"
- 422 → "数据验证失败"
- 500 → "服务器内部错误，请稍后重试"
- 502/503/504 → "服务暂时不可用，请稍后重试"
- 网络错误 → "网络连接失败，请检查网络后重试"

### 3. 移动端 - 认证服务改进 (authService.ts)

**修改内容：**
- 登录和注册时同时保存refreshToken
- 登出时清除refreshToken
- 错误消息使用中文

### 4. 后端 - JWT策略中文错误 (jwt.strategy.ts)

**修改内容：**
```typescript
async validate(payload: any) {
  const user = await this.authService.validateUser(payload.sub, payload.tenantId)
  if (!user) {
    throw new UnauthorizedException('登录已过期，请重新登录')
  }
  return user
}
```

### 5. 后端 - 本地策略中文错误 (local.strategy.ts)

**修改内容：**
```typescript
async validate(email: string, password: string): Promise<any> {
  const user = await this.authService.validateUser(email, password)
  if (!user) {
    throw new UnauthorizedException('邮箱或密码错误')
  }
  return user
}
```

### 6. 后端 - 全局HTTP异常过滤器 (http-exception.filter.ts)

**新增文件：**
创建了一个全局的HTTP异常过滤器，统一处理所有HTTP异常并返回中文错误消息。

**功能：**
- 自动检测错误消息语言（中文直接返回，英文自动翻译）
- 根据HTTP状态码返回对应的中文错误消息
- 统一的错误响应格式

**主要翻译映射：**
- "Unauthorized" → "未授权，请登录"
- "Forbidden" → "没有权限访问该资源"
- "Not Found" → "请求的资源不存在"
- "Token expired" → "Token已过期，请重新登录"
- "Invalid token" → "Token无效，请重新登录"
- "Invalid credentials" → "邮箱或密码错误"
- "Email already exists" → "该邮箱已被注册"

### 7. 后端 - 应用全局过滤器 (main.ts)

**修改内容：**
```typescript
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

// 全局异常过滤器 - 统一返回中文错误消息
app.useGlobalFilters(new HttpExceptionFilter())
```

## 技术要点

### Token刷新流程

1. **请求发送**：携带accessToken
2. **401响应**：服务器返回401，表示token过期
3. **自动刷新**：
   - 从本地存储获取refreshToken
   - 调用`/auth/refresh`接口
   - 获取新的accessToken和refreshToken
   - 保存到本地存储
4. **重试请求**：使用新的accessToken重试原请求
5. **刷新失败**：清除所有认证信息，用户需要重新登录

### 多设备登录支持

- **每个设备独立的token**：每次登录都会生成新的accessToken和refreshToken
- **refreshToken有7天有效期**：即使accessToken过期，用户可以在7天内自动刷新
- **自动续期**：每次刷新token时，会生成新的refreshToken，实现滚动刷新

## 测试场景

### 1. Token过期测试
- ✅ 15分钟后自动刷新token
- ✅ 刷新成功后请求继续执行
- ✅ 用户无感知

### 2. 多设备登录测试
- ✅ 设备A登录后，设备B也能登录
- ✅ 两个设备的token互不干扰
- ✅ 每个设备独立刷新token

### 3. 错误提示测试
- ✅ 所有401错误显示"登录已过期，请重新登录"
- ✅ 网络错误显示"网络连接失败，请检查网络后重试"
- ✅ 其他错误显示对应的中文提示

### 4. RefreshToken过期测试
- ✅ RefreshToken过期后自动清除认证信息
- ✅ 用户需要重新登录
- ✅ 显示友好的中文错误提示

## 部署说明

### 前端（移动端）

修改的文件：
- `apps/mobile/app/services/api.ts`
- `apps/mobile/app/services/authService.ts`

重启移动端应用即可生效，无需重新打包。

### 后端

修改的文件：
- `services/api-gateway/src/modules/auth/strategies/jwt.strategy.ts`
- `services/api-gateway/src/modules/auth/strategies/local.strategy.ts`
- `services/api-gateway/src/common/filters/http-exception.filter.ts` (新增)
- `services/api-gateway/src/main.ts`

重启后端服务：
```bash
cd services/api-gateway
npm run build
npm run start:prod
```

或使用Docker：
```bash
docker-compose restart api-gateway
```

## 注意事项

1. **Token有效期**：
   - accessToken：15分钟
   - refreshToken：7天
   
2. **安全性**：
   - refreshToken存储在本地，不会在常规请求中发送
   - 只在刷新token时使用refreshToken
   - 登出时会清除所有token
   
3. **用户体验**：
   - 用户在7天内不需要重新登录
   - Token自动刷新，用户无感知
   - 所有错误提示都是中文
   
4. **多设备支持**：
   - 每个设备有独立的token
   - 不会因为其他设备登录而导致当前设备退出
   
5. **错误处理**：
   - 所有HTTP错误都有中文提示
   - 网络错误有友好的提示
   - 避免显示技术性的英文错误消息

## 后续优化建议

1. **Token黑名单**：实现token黑名单机制，支持强制登出
2. **设备管理**：用户可以查看和管理已登录的设备
3. **最大设备数限制**：限制同一账号最多登录设备数
4. **异常登录检测**：检测异常登录行为并发送通知
5. **Token续期策略**：根据用户活跃度动态调整token有效期

## 修复日期

2025年11月29日

## 修复人员

AI Assistant (Cursor)

