# 🔐 认证系统使用指南

## ✅ 已完成的功能

### 1. **认证服务** (`app/services/authService.ts`)
- ✅ 登录功能
- ✅ 注册功能
- ✅ 登出功能
- ✅ Token 管理
- ✅ 用户信息缓存
- ✅ Token 验证和刷新

### 2. **登录页面** (`app/auth/login.tsx`)
- ✅ 邮箱登录
- ✅ 密码输入
- ✅ 表单验证
- ✅ 加载状态
- ✅ 跳转注册页

### 3. **注册页面** (`app/auth/register.tsx`)
- ✅ 用户注册表单
- ✅ 邮箱验证
- ✅ 密码强度验证
- ✅ 密码确认
- ✅ 酒店名称（可选）

### 4. **认证上下文** (`app/contexts/AuthContext.tsx`)
- ✅ 全局认证状态管理
- ✅ 自动路由守卫
- ✅ 登录状态持久化
- ✅ Token 自动验证

### 5. **路由守卫**
- ✅ 未登录自动跳转登录页
- ✅ 已登录自动跳转主页
- ✅ 无需手动导航控制

### 6. **API 接口**
- ✅ 登录接口
- ✅ 注册接口
- ✅ 登出接口
- ✅ 获取当前用户
- ✅ 刷新 Token

---

## 🎯 使用流程

### 用户首次使用

```
打开 App
    ↓
自动检查登录状态
    ↓
未登录 → 显示登录页面
    ↓
用户点击"立即注册"
    ↓
填写注册信息
    ↓
注册成功 → 自动登录
    ↓
进入主页面（Tabs）
```

### 已登录用户

```
打开 App
    ↓
自动检查登录状态
    ↓
已登录 → 验证 Token
    ↓
Token 有效 → 直接进入主页
Token 无效 → 返回登录页
```

### 登出流程

```
在个人页面
    ↓
点击"退出登录"
    ↓
确认退出
    ↓
清除本地认证数据
    ↓
自动返回登录页
```

---

## 🔍 当前问题和解决方案

### 问题：注册响应数据格式不匹配

**现象：**
```
✅ POST /auth/register - 200
❌ 注册响应数据格式错误
```

**原因：**
后端返回的数据格式与前端期望不同。

**解决方案：**

我已经更新了 `authService.ts`，添加了响应数据打印：

```typescript
// 打印完整响应以便调试
logger.log('注册响应数据', response)

// 适配不同的响应格式
const token = response.token || response.accessToken || response.access_token
const userData = response.user || response.data?.user || response
```

**下一步：**
1. 再次尝试注册
2. 查看控制台输出的 "注册响应数据"
3. 根据实际格式调整代码

---

## 🔧 后端接口要求

### 注册接口 (`POST /auth/register`)

**请求：**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户姓名",
  "hotelName": "酒店名称"
}
```

**期望响应格式（任一种都支持）：**

格式1：
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "用户姓名",
    "role": "admin"
  }
}
```

格式2：
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "用户姓名",
    "role": "admin"
  }
}
```

格式3：
```json
{
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户姓名",
      "role": "admin"
    }
  }
}
```

### 登录接口 (`POST /auth/login`)

**请求：**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应：** 同注册接口

### 获取当前用户 (`GET /auth/me`)

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "用户姓名",
  "role": "admin",
  "tenantId": "tenant-id"
}
```

---

## 📝 测试步骤

### 1. 查看实际响应格式

再次尝试注册，查看控制台输出：
```
LOG  [API LOG] 注册响应数据 { ... }
```

把这个输出发给我，我会根据实际格式调整代码。

### 2. 测试登录

如果注册成功，尝试：
1. 退出登录
2. 重新登录
3. 查看是否能进入主页

### 3. 测试路由守卫

- 未登录时，访问任何页面应该跳转到登录页
- 登录后，自动进入主页
- 登出后，自动返回登录页

---

## 🎨 登录页面截图说明

### 登录页面
```
┌─────────────────────────┐
│         🏨              │
│        客满云            │
│    酒店民宿管理系统       │
│                         │
│  邮箱                    │
│  [________________]     │
│                         │
│  密码                    │
│  [________________]     │
│                         │
│         忘记密码？        │
│                         │
│  [    登 录    ]        │
│                         │
│  还没有账号？立即注册     │
└─────────────────────────┘
```

### 注册页面
```
┌─────────────────────────┐
│         🏨              │
│       创建账号           │
│   开始使用客满云管理系统   │
│                         │
│  姓名 *                 │
│  [________________]     │
│                         │
│  邮箱 *                 │
│  [________________]     │
│                         │
│  密码 *                 │
│  [________________]     │
│                         │
│  确认密码 *              │
│  [________________]     │
│                         │
│  酒店名称（可选）         │
│  [________________]     │
│                         │
│  [    注 册    ]        │
│                         │
│  已有账号？立即登录       │
└─────────────────────────┘
```

---

## 🔧 故障排除

### 问题1：注册返回 200 但提示格式错误

**原因：** 后端响应格式与前端不匹配

**解决：**
1. 查看控制台 "注册响应数据" 日志
2. 将日志发给我
3. 我会调整代码适配

### 问题2：登录后仍然显示登录页

**原因：** Token 保存失败或路由守卫未触发

**解决：**
```
1. 检查控制台是否有错误
2. 尝试完全重启 App
3. 清除 App 数据重新登录
```

### 问题3：Token 验证失败

**原因：** 后端 `/auth/me` 接口未实现或需要特定格式

**解决：**
检查后端是否有 GET `/auth/me` 接口

---

## 📚 代码使用示例

### 在任何组件中使用认证

```typescript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return <Text>请先登录</Text>
  }

  return (
    <View>
      <Text>欢迎，{user?.name}！</Text>
      <Button title="登出" onPress={logout} />
    </View>
  )
}
```

### 检查用户权限

```typescript
const { user } = useAuth()

if (user?.role === 'admin') {
  // 管理员功能
}
```

### 获取认证 Token

```typescript
import { authService } from '../services/authService'

const token = await authService.getToken()
```

---

## 🎉 下一步

1. **再次尝试注册**，查看 "注册响应数据" 日志
2. **把日志发给我**，我会调整代码适配后端格式
3. **测试完整流程**：注册 → 登录 → 使用 → 登出

---

**现在请再次注册，然后把控制台的 "注册响应数据" 日志发给我！** 📋

