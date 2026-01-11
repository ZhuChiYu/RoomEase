# 📱 移动App网络连接修复指南

## 🔍 问题原因

移动设备无法访问 `localhost`，因为localhost指向**设备本身**，而不是开发机器。

## ✅ 已完成的修改

1. ✅ **后端配置** - 修改为监听所有网络接口 (`0.0.0.0:4000`)
2. ✅ **移动App配置** - API地址改为 `http://192.168.31.221:4000`
3. ✅ **自动登录** - 使用正确的测试账号 `admin@demo.com` / `123456`

## 📋 操作步骤

### 步骤1: 启动后端服务

**打开一个新的终端窗口**，运行：

```bash
cd /Users/zhuchiyu/Project/RoomEasy/RoomEase
./start-backend-debug.sh
```

**预期输出**：
```
🚀 API Gateway 启动成功！
📖 本地访问: http://localhost:4000/docs
📱 移动端访问: http://192.168.31.221:4000/docs
```

### 步骤2: 重启移动App

找到运行 `pnpm start` 的Expo终端，按键：

```
r    # 按 r 键重新加载
```

或者清除缓存重启：

```
Shift + r    # 同时按 Shift+r
```

### 步骤3: 观察日志

重启后，App应该显示：

#### ✅ 启动时的自动登录日志
```
🔐 使用后端API，自动登录中...
📤 API请求: { 
  method: 'POST',
  baseURL: 'http://192.168.31.221:4000',  ← 注意：不再是localhost
  url: '/auth/login',
  ...
}
📥 API响应: { status: 200, ... }
✅ 自动登录成功
```

#### ✅ 创建预订时的API日志
```
📝 [CreateOrder] 创建预订: {...}
🌐 [CreateOrder] 通过API创建预订...
📤 API请求: { method: 'POST', url: '/reservations', ... }
📥 API响应: { status: 201, ... }
✅ [CreateOrder] API返回: {...}
```

## 🧪 测试步骤

1. **重启App** - 按 `r` 键
2. **查看启动日志** - 应该看到 `✅ 自动登录成功`
3. **创建预订** - 在日历页面点击日期，填写并提交
4. **查看API日志** - 应该看到完整的请求和响应日志

## ❌ 如果还是报错

### 问题1: 仍显示 "Network Error"

**原因**：App配置未更新
**解决**：
1. 完全停止Expo（Ctrl+C）
2. 清除缓存重启：
   ```bash
   cd apps/mobile
   pnpm start --clear
   ```

### 问题2: 后端无法启动

**原因**：端口被占用
**解决**：
```bash
# 杀掉占用端口的进程
lsof -ti:4000 | xargs kill -9
# 然后重新运行 start-backend-debug.sh
```

### 问题3: 后端报数据库错误

**原因**：Docker数据库未运行
**解决**：
```bash
cd /Users/zhuchiyu/Project/RoomEasy/RoomEase
docker compose up -d
```

## 🌐 网络配置说明

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 开发机IP | `192.168.31.221` | 您当前的局域网IP |
| 后端端口 | `4000` | API Gateway端口 |
| 移动App配置 | `apps/mobile/app/config/environment.ts` | API_CONFIG.BASE_URL |
| 后端监听配置 | `services/api-gateway/src/main.ts` | app.listen(port, '0.0.0.0') |

## 💡 提示

- 确保手机/模拟器和开发机在**同一个WiFi网络**
- 如果开发机IP变化（切换网络），需要更新 `environment.ts` 中的IP地址
- 浏览器可访问：http://192.168.31.221:4000/docs 查看API文档

## 📞 快速诊断命令

```bash
# 检查后端是否运行
curl http://192.168.31.221:4000

# 测试登录API
curl -X POST http://192.168.31.221:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"123456"}'

# 检查端口占用
lsof -i:4000

# 查看后端进程
ps aux | grep nest
```


