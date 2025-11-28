# 📱 移动端API连接验证指南

## 🎯 概述

本指南帮助你验证移动端app是否成功连接到API服务器。我已经为你添加了完整的日志功能和连接测试工具。

## ✅ 已添加的功能

### 1. **API服务日志增强** (`app/services/api.ts`)
- ✅ 详细的请求/响应日志
- ✅ 错误详情记录
- ✅ 请求耗时统计
- ✅ 连接状态追踪

### 2. **健康检查功能**
- ✅ 服务器健康检查 API
- ✅ 连接测试工具
- ✅ 响应时间监控

### 3. **开发者页面增强** (`app/(tabs)/developer.tsx`)
- ✅ 实时服务器连接状态显示
- ✅ 一键测试连接功能
- ✅ 详细的错误信息提示
- ✅ 自动连接测试

### 4. **命令行测试工具** (`test-connection.js`)
- ✅ 独立的连接测试脚本
- ✅ 网络诊断功能
- ✅ 详细的故障排除建议

---

## 🔍 验证方法

### 方法1: 在移动App内验证（推荐）

#### 步骤1: 切换到服务器模式

1. 打开App
2. 进入 **"开发者"** 标签页
3. 找到 **"数据源配置"** 卡片
4. 将开关切换到 **"服务器API模式"** （关闭状态）

#### 步骤2: 查看连接状态

切换后会自动显示 **"服务器连接状态"** 卡片：

```
服务器地址: http://111.230.110.95:4000
连接状态: [已连接 ✅ | 未连接 ❌ | 测试中 ⏳]
响应时间: XXXms
最后测试: HH:MM:SS
```

#### 步骤3: 手动测试连接

点击 **"测试服务器连接"** 按钮，会：
1. 发送健康检查请求到服务器
2. 显示连接测试结果
3. 如果失败，显示详细错误信息

#### 步骤4: 查看控制台日志

在 Metro/Expo 开发服务器的控制台中，你会看到详细的日志：

```
[API LOG 2025-11-28T...] API服务初始化 { baseURL: "http://111.230.110.95:4000", ... }
[API LOG 2025-11-28T...] 🏥 开始服务器健康检查...
[API LOG 2025-11-28T...] 目标服务器 { baseURL: "http://111.230.110.95:4000" }
[API REQUEST 2025-11-28T...] 🚀 GET /health
[API RESPONSE 2025-11-28T...] ✅ GET /health - 200 (123ms)
[API SUCCESS 2025-11-28T...] ✅ 服务器健康检查成功
```

---

### 方法2: 使用命令行测试工具

在移动端项目目录下运行：

```bash
cd apps/mobile

# 测试生产服务器（默认）
node test-connection.js

# 测试开发服务器
API_URL=http://192.168.31.221:4000 node test-connection.js

# 测试其他地址
API_URL=http://111.230.110.95:8080 node test-connection.js
```

**输出示例（成功）：**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔌 移动端API连接测试
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 测试服务器: http://111.230.110.95:4000

[1/3] 测试 /health 端点...
  ✓ 健康检查成功 (123ms)
  响应: { "status": "ok", "timestamp": "..." }

[2/3] 测试根路径 /...
  ✓ 服务器响应正常 (45ms, 状态码: 200)

[3/3] 网络诊断...
  本地网络接口:
    en0: 192.168.31.100
  目标服务器:
    主机: 111.230.110.95
    端口: 4000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 测试结果总结
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 服务器连接正常
   移动端应该能够正常连接到API服务器
```

---

### 方法3: 在浏览器中验证

直接在浏览器访问：

```
健康检查: http://111.230.110.95:4000/health
API文档: http://111.230.110.95:4000/docs
或通过Nginx: http://111.230.110.95:8080/health
```

如果能看到JSON响应，说明服务器正常运行。

---

## 📊 日志说明

### API请求日志格式

```
[API REQUEST timestamp] 🚀 METHOD /path { request data }
[API RESPONSE timestamp] ✅ METHOD /path - STATUS (duration ms)
[API SUCCESS timestamp] ✅ 请求成功 { response details }
```

### API错误日志格式

```
[API ERROR timestamp] 错误类型 { error details }
```

常见错误类型：
- **服务器响应错误**: 服务器返回非2xx状态码
- **网络连接错误**: 无法连接到服务器
- **请求配置错误**: 请求参数有误

---

## 🔧 故障排除

### ❌ 问题1: 显示"未连接"

**可能原因：**
1. 服务器未启动
2. 网络不通
3. API地址配置错误
4. 防火墙阻止

**解决方法：**

```bash
# 1. 检查服务器是否运行
ssh root@111.230.110.95
cd /opt/roomease
docker-compose ps

# 2. 检查API Gateway日志
docker-compose logs -f api-gateway

# 3. 测试服务器连接
curl http://111.230.110.95:4000/health

# 4. 重启服务（如需要）
docker-compose restart api-gateway
```

---

### ❌ 问题2: 请求超时

**可能原因：**
1. 网络延迟过高
2. 服务器负载过大
3. 超时时间设置过短

**解决方法：**

修改 `app/config/environment.ts`：
```typescript
export const API_CONFIG = {
  TIMEOUT: 30000, // 增加到30秒
}
```

---

### ❌ 问题3: CORS错误

**错误信息：**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**解决方法：**

在服务器上修改 `.env` 文件：
```bash
cd /opt/roomease
vim .env

# 添加移动端访问来源
CORS_ORIGINS=http://111.230.110.95,http://localhost:8081,exp://192.168.31.221:8081
```

重启服务：
```bash
docker-compose restart api-gateway
```

---

### ❌ 问题4: 开发环境无法连接

**解决方法：**

1. **获取本机局域网IP：**
   ```bash
   # macOS
   ipconfig getifaddr en0
   
   # Linux
   hostname -I | awk '{print $1}'
   ```

2. **更新配置文件：**
   
   修改 `app/config/environment.ts`：
   ```typescript
   BASE_URL: isDev 
     ? 'http://YOUR_LOCAL_IP:4000'  // 替换为你的实际IP
     : 'http://111.230.110.95:4000',
   ```

3. **确保设备在同一网络：**
   - 手机和电脑连接同一WiFi
   - 关闭VPN
   - 检查防火墙设置

---

## 📝 环境配置说明

### 当前配置 (`app/config/environment.ts`)

```typescript
export const API_CONFIG = {
  // 开发环境：使用局域网IP
  // 生产环境：使用腾讯云服务器
  BASE_URL: isDev 
    ? 'http://192.168.31.221:4000'        // 开发环境
    : 'http://111.230.110.95:4000',       // 生产环境
  
  // 备用地址（通过Nginx）
  FALLBACK_URL: 'http://111.230.110.95:8080',
  
  // 超时时间
  TIMEOUT: 30000,
  
  // 开发环境自动启用日志
  ENABLE_LOGGING: isDev,
}
```

### 可选配置

如果使用域名（配置SSL后）：
```typescript
BASE_URL: 'https://www.englishpartner.cn'
```

如果通过Nginx访问（端口8080）：
```typescript
BASE_URL: 'http://111.230.110.95:8080'
```

---

## 🎯 快速验证清单

运行以下命令来快速验证所有环节：

```bash
# 1. 测试服务器健康（从本地电脑）
curl http://111.230.110.95:4000/health

# 2. 测试移动端连接（在移动端项目目录）
cd apps/mobile
node test-connection.js

# 3. 启动移动端app
npm start

# 4. 在App内验证
# - 打开"开发者"标签页
# - 切换到"服务器API模式"
# - 查看连接状态
# - 点击"测试服务器连接"
```

---

## 📖 相关文件

| 文件 | 说明 |
|------|------|
| `app/services/api.ts` | API服务，包含日志和健康检查 |
| `app/config/environment.ts` | 环境配置，API地址设置 |
| `app/(tabs)/developer.tsx` | 开发者页面，连接状态显示 |
| `test-connection.js` | 命令行测试工具 |
| `SERVER_DEPLOYMENT_INSTRUCTIONS.md` | 服务器部署指南 |

---

## 💡 最佳实践

1. **开发阶段**：
   - 使用本地服务器 (`http://192.168.31.221:4000`)
   - 启用日志 (`ENABLE_LOGGING: true`)
   - 定期测试连接

2. **测试阶段**：
   - 切换到生产服务器测试
   - 验证所有API端点
   - 检查错误处理

3. **生产发布**：
   - 使用域名（配置SSL）
   - 关闭详细日志（仅保留错误日志）
   - 配置合理的超时时间

---

## 🆘 获取帮助

如果以上方法都无法解决问题：

1. **查看完整日志：**
   ```bash
   # 服务器端
   docker-compose logs -f api-gateway
   
   # 移动端
   # 查看Metro控制台输出
   ```

2. **检查网络连通性：**
   ```bash
   # 从本地电脑ping服务器
   ping 111.230.110.95
   
   # 测试端口是否开放
   telnet 111.230.110.95 4000
   ```

3. **联系开发团队**并提供：
   - 错误日志
   - 网络环境信息
   - 测试工具输出

---

**祝测试顺利！** 🎉

