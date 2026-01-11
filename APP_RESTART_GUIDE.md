# 📱 App 重启指南

## ✅ 代码已修改

已完成以下修改：
1. ✅ `create-order.tsx` - 创建预订时调用后端API
2. ✅ `_layout.tsx` - App启动时自动登录

## 🔄 如何重启App

### 方法1: 快速重载（推荐）
在 **Expo 终端** 中按键：
```
r  (然后回车)
```

### 方法2: 清除缓存重启
在 **Expo 终端** 中按键：
```
Shift + r  (同时按)
```

### 方法3: 完全重启
```bash
# 1. 停止当前Expo (Ctrl+C)
# 2. 清除缓存并重新启动
cd apps/mobile
pnpm start --clear
```

## 📊 预期看到的日志

重启后，你应该看到：

### 1. 启动日志（自动登录）
```
🔐 使用后端API，自动登录中...
📤 API请求: POST http://localhost:4000/api/auth/login
📥 API响应: 200 OK
✅ 自动登录成功
```

### 2. 创建预订时的API日志
```
📝 [CreateOrder] 创建预订: {...}
🌐 [CreateOrder] 通过API创建预订...
📤 API请求: POST http://localhost:4000/api/reservations
📥 API响应: 201 Created
✅ [CreateOrder] API返回: {...}
```

## 🎯 测试步骤

1. **重启App** (按 `r` 键)
2. **观察启动日志** - 应该看到自动登录成功
3. **创建一个预订** - 在日历页面点击日期，填写预订信息
4. **观察API请求日志** - 应该看到 `📤 API请求` 和 `📥 API响应`

## 🐛 如果没有看到API日志

检查：
1. ✅ 后端服务是否正在运行？(`http://localhost:4000`)
2. ✅ 是否看到自动登录成功？
3. ✅ 网络配置是否正确？（检查 `config/environment.ts`）

## 📞 后端API状态检查

可以在浏览器访问：
- http://localhost:4000 - API网关
- http://localhost:4000/api/health - 健康检查
- http://localhost:4000/api-docs - API文档


