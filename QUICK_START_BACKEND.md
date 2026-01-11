# RoomEase 后端快速启动指南

## 🚀 快速启动（推荐）

```bash
# 一键启动后端服务
./start-backend.sh

# 首次运行或需要重置数据库
./start-backend.sh --init-db
```

## 📋 前置要求

- ✅ Docker Desktop 已安装并运行
- ✅ Node.js >= 18.0.0
- ✅ pnpm >= 8.0.0

## 🔧 手动启动步骤

### 1. 启动Docker服务

```bash
docker compose up -d
```

这将启动：
- PostgreSQL (5434端口)
- Redis (6380端口)  
- ClickHouse、RabbitMQ、MinIO等

### 2. 初始化数据库（首次运行）

```bash
cd packages/database
export DATABASE_URL="postgresql://postgres:postgres123@localhost:5434/roomease?schema=public"
pnpm prisma db push --force-reset --accept-data-loss
pnpm db:seed
cd ../..
```

### 3. 启动API服务

```bash
cd services/api-gateway
export DATABASE_URL="postgresql://postgres:postgres123@localhost:5434/roomease?schema=public"
export JWT_SECRET="your-super-secret-jwt-key"
export JWT_REFRESH_SECRET="your-super-secret-refresh-key"
export NODE_ENV="development"
export PORT="4000"
pnpm build
pnpm start:prod
```

## 🧪 测试API

### 方法1: 使用测试脚本

```bash
cd apps/mobile
node test-api.js
```

### 方法2: 使用curl

```bash
# 登录
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"123456"}'

# 获取房间列表（需要token）
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/rooms?propertyId=demo-property
```

### 方法3: 访问Swagger文档

打开浏览器访问: http://localhost:4000/docs

## 👤 测试账号

```
邮箱: admin@demo.com
密码: 123456
角色: OWNER (业主)
物业ID: demo-property
```

## 📊 服务端口

| 服务 | 端口 | 访问地址 |
|-----|------|---------|
| API服务 | 4000 | http://localhost:4000 |
| API文档 | 4000 | http://localhost:4000/docs |
| PostgreSQL | 5434 | localhost:5434 |
| Redis | 6380 | localhost:6380 |
| RabbitMQ管理 | 15672 | http://localhost:15672 |
| Grafana | 3001 | http://localhost:3001 |

## 🛠️ 常用命令

```bash
# 查看Docker容器状态
docker compose ps

# 查看API日志
tail -f /tmp/api-gateway.log

# 停止所有服务
docker compose down

# 重启API服务
pkill -f "node dist/main"
cd services/api-gateway && pnpm start:prod
```

## 📱 移动端配置

编辑 `apps/mobile/app/config/environment.ts`:

```typescript
export const FEATURE_FLAGS = {
  USE_BACKEND_API: true,  // 使用后端API
}

export const API_CONFIG = {
  BASE_URL: 'http://localhost:4000'  // API地址
}
```

然后在代码中使用:

```typescript
import { apiService } from './services/apiService'

// 登录
await apiService.auth.login('admin@demo.com', '123456')

// 获取房间
const rooms = await apiService.rooms.getAll('demo-property')
```

## ⚠️ 常见问题

### 问题1: Docker容器启动失败

```bash
# 查看日志
docker compose logs

# 重新启动
docker compose down
docker compose up -d
```

### 问题2: 端口已被占用

检查端口是否被占用：
```bash
lsof -i :4000  # 检查API端口
lsof -i :5434  # 检查PostgreSQL端口
```

### 问题3: API连接失败

1. 检查API服务是否运行: `curl http://localhost:4000/auth/profile`
2. 查看日志: `tail -f /tmp/api-gateway.log`
3. 检查Docker服务: `docker compose ps`

### 问题4: 数据库连接失败

```bash
# 测试数据库连接
psql -h localhost -p 5434 -U postgres -d roomease

# 密码: postgres123
```

## 📚 相关文档

- [部署测试总结](./DEPLOYMENT_TEST_SUMMARY.md) - 详细的部署和测试记录
- [API文档](./API_DOCUMENTATION.md) - 完整的API接口文档
- [移动端集成](./MOBILE_API_INTEGRATION.md) - Mobile App API集成指南
- [架构设计](./ARCHITECTURE.md) - 系统架构文档

## 🎯 下一步

1. ✅ 后端服务已部署并运行
2. ✅ 移动端已配置使用API
3. ⏭️ 开始开发移动端功能
4. ⏭️ 实现更多业务逻辑
5. ⏭️ 完善错误处理和测试

## 💡 提示

- 开发时使用 `./start-backend.sh` 快速启动
- API日志保存在 `/tmp/api-gateway.log`
- Swagger文档方便测试API
- 测试脚本可以验证所有核心功能

---

**祝开发顺利！** 🚀

