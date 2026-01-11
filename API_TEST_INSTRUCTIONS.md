# 🧪 API测试说明

## 📊 当前问题分析

从你的日志看，App当前使用的是**本地存储模式**，没有调用后端API。

### 原因
虽然配置文件已经设置了 `USE_BACKEND_API: true`，但是**代码更改后需要重新加载App**才能生效。

## ✅ 解决步骤

### 步骤1: 重新加载App

在Expo的终端窗口，按以下任意键：

**方式A: 快速重载**
```
按 R 键 (或 r)
```

**方式B: 清除缓存重载**
```
按 Shift + R
```

**方式C: 完全重启**
```bash
# 按 Ctrl+C 停止
cd apps/mobile
pnpm start --clear
```

### 步骤2: 查看启动日志

重新加载后，你应该在控制台**最前面**看到：

```
🔌 [服务配置] USE_BACKEND_API: true
🔌 [服务配置] 当前使用: API服务
```

如果看到这个，说明配置成功！✅

### 步骤3: 测试API调用

现在有两种方式测试：

#### 方式A: 使用测试页面（推荐）

1. 在App中访问 `/api-test` 路由
2. 点击"🚀 运行所有测试"按钮
3. 查看测试结果

#### 方式B: 正常使用App

在App中进行任何操作（如查看房间、创建预订），你都会看到详细的API日志：

```
📤 API请求: {
  method: 'GET',
  url: '/rooms',
  fullURL: 'http://localhost:4000/rooms',
  params: { propertyId: 'demo-property' },
  hasToken: true
}

📥 API响应: {
  status: 200,
  data: [
    { name: '豪华大床房', code: 'A101', basePrice: '299' },
    ...
  ]
}
```

## 🔍 预期的日志变化

### 之前（本地存储模式）
```
LOG  📦 初始化本地数据存储...
LOG  🔄 [Redux] 恢复持久化状态
LOG  🔄 [Redux] addReservation: {...}
LOG  ✅ [Redux] 预订添加完成
```

### 之后（API服务模式）
```
LOG  🔌 [服务配置] USE_BACKEND_API: true
LOG  🔌 [服务配置] 当前使用: API服务

LOG  📤 API请求: { method: 'POST', url: '/auth/login', ... }
LOG  📥 API响应: { status: 200, data: { accessToken: '...' } }

LOG  📤 API请求: { method: 'GET', url: '/rooms', ... }
LOG  📥 API响应: { status: 200, data: [...] }

LOG  📤 API请求: { method: 'POST', url: '/reservations', ... }
LOG  📥 API响应: { status: 201, data: {...} }
```

## 🎯 关键区别

| 特征 | 本地存储模式 | API服务模式 |
|------|------------|------------|
| 日志特征 | `[Redux]` 前缀 | `📤 API请求` / `📥 API响应` |
| 数据存储 | AsyncStorage | 后端数据库 |
| 网络请求 | ❌ 无 | ✅ 有 |
| 登录 | ❌ 不需要 | ✅ 需要 |
| 数据同步 | ❌ 仅本地 | ✅ 实时同步 |

## 🧪 测试清单

重新加载后，检查以下内容：

- [ ] 启动时看到 `🔌 [服务配置] 当前使用: API服务`
- [ ] 看到 `📤 API请求` 日志
- [ ] 看到 `📥 API响应` 日志
- [ ] 需要登录才能使用（邮箱: admin@demo.com，密码: 123456）
- [ ] 可以看到后端的3个房间数据
- [ ] 创建预订后数据保存到后端

## 🐛 常见问题

### 问题1: 重载后还是本地存储

**解决**:
```bash
# 完全停止并清除缓存
cd apps/mobile
rm -rf .expo
pnpm start --clear
```

### 问题2: 看到API请求但是失败

**检查**:
```bash
# 确认后端服务运行
curl http://localhost:4000/auth/profile

# 查看后端日志
tail -f /tmp/api-gateway.log
```

### 问题3: 401错误

**原因**: 需要先登录

**解决**: 在App中使用测试账号登录
- 邮箱: `admin@demo.com`
- 密码: `123456`

## 📱 使用测试页面

我已经为你创建了一个专门的API测试页面：`app/api-test.tsx`

### 如何访问

在Expo中，可以通过路由访问（如果配置了路由的话），或者你可以在现有页面添加一个按钮跳转到测试页面。

### 测试页面功能

- ✅ 显示当前配置状态
- ✅ 一键测试所有API
- ✅ 单独测试每个API
- ✅ 显示测试结果
- ✅ 显示成功/失败状态

## 📝 快速命令

```bash
# 1. 确认后端运行
ps aux | grep "node dist/main"

# 2. 测试后端API
curl http://localhost:4000/auth/profile

# 3. 重启App（清除缓存）
cd apps/mobile
pnpm start --clear

# 4. 查看后端日志
tail -f /tmp/api-gateway.log
```

## ✨ 下一步

1. **重新加载App**（按 R 键）
2. **查看启动日志**（确认使用API服务）
3. **登录App**（admin@demo.com / 123456）
4. **测试功能**（创建房间、预订等）
5. **观察日志**（应该看到API请求和响应）

---

**需要帮助？**

如果重载后还有问题，请：
1. 截图启动日志（前50行）
2. 告诉我是否看到 `🔌 [服务配置]` 日志
3. 告诉我是否看到 `📤 API请求` 日志


