# ⚡ RoomEase 快速部署指南

> 5分钟完成后端服务部署到腾讯云服务器

## 📌 服务器信息

```
IP: 111.230.110.95
系统: Ubuntu 22.04 (预装Docker)
域名: www.englishpartner.cn
```

---

## 🚀 快速部署（5步搞定）

### 步骤1️⃣: 连接服务器

```bash
ssh root@111.230.110.95
```

### 步骤2️⃣: 创建工作目录

```bash
mkdir -p /opt/roomease
cd /opt/roomease
```

### 步骤3️⃣: 上传代码

**从您的本地Mac电脑执行：**

```bash
cd /Users/zhuchiyu/Documents/projects/RoomEase

# 使用rsync上传（推荐）
rsync -avz --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'apps/mobile/node_modules' \
  --exclude 'apps/web/node_modules' \
  --exclude 'apps/mobile/ios' \
  ./ root@111.230.110.95:/opt/roomease/
```

### 步骤4️⃣: 配置环境（在服务器上执行）

```bash
cd /opt/roomease

# 生成JWT密钥
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH=$(openssl rand -base64 32)

# 创建.env文件
cat > .env <<EOF
NODE_ENV=production
PORT=4000

DATABASE_URL=postgresql://postgres:RoomEase2024!@postgres:5432/roomease?schema=public
POSTGRES_PASSWORD=RoomEase2024!

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=Redis2024!

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_REFRESH_EXPIRES_IN=30d

CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=roomease_analytics
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=

RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=rabbitmq
RABBITMQ_PASSWORD=RabbitMQ2024!
RABBITMQ_VHOST=roomease

MINIO_ENDPOINT=minio
MINIO_PORT=9002
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=MinIO2024!
MINIO_USE_SSL=false
MINIO_BUCKET=roomease

CORS_ORIGINS=http://111.230.110.95,http://www.englishpartner.cn

GRAFANA_ADMIN_PASSWORD=Grafana2024!

LOG_LEVEL=info
LOG_FORMAT=json
EOF

echo "✅ 环境配置完成"
echo "🔑 JWT密钥已自动生成"
```

### 步骤5️⃣: 一键部署

```bash
# 给脚本添加执行权限
chmod +x deploy.sh

# 运行部署
./deploy.sh
```

**等待5-10分钟，部署完成！** ⏳

---

## ✅ 验证部署

### 测试1: 检查服务状态

```bash
docker-compose -f docker-compose.production.yml ps
```

应该看到所有服务都是 `Up` 状态。

### 测试2: 健康检查

```bash
curl http://localhost/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2024-11-27T...",
  "uptime": 123.45,
  "environment": "production"
}
```

### 测试3: 外部访问

在浏览器访问：
- API文档: http://111.230.110.95/docs
- 健康检查: http://111.230.110.95/health

---

## 📱 配置移动端

修改移动端代码连接到服务器：

**文件：** `apps/mobile/app/config/environment.ts`

已自动配置为生产环境使用服务器IP：
```typescript
BASE_URL: isDev 
  ? 'http://192.168.31.221:4000'  // 开发环境
  : 'http://111.230.110.95',       // 生产环境 ✅
```

---

## 🔍 常用命令

```bash
# 查看所有服务状态
docker-compose ps

# 查看日志
docker-compose logs -f api-gateway

# 重启服务
docker-compose restart

# 停止所有服务
docker-compose down

# 查看系统资源
docker stats
```

---

## 🆘 遇到问题？

### 问题1: 无法访问
```bash
# 检查防火墙
ufw status

# 检查服务
docker-compose ps

# 查看日志
docker-compose logs api-gateway
```

### 问题2: 内存不足
```bash
# 查看内存
free -h

# 清理Docker
docker system prune -a
```

### 问题3: 端口被占用
```bash
# 查看端口占用
netstat -tlnp | grep -E '80|4000'

# 停止占用进程
kill -9 PID
```

---

## 📚 详细文档

- **完整部署指南**: `DEPLOYMENT_GUIDE.md`
- **详细部署指令**: `SERVER_DEPLOYMENT_INSTRUCTIONS.md`
- **环境变量说明**: `ENV_EXAMPLE.txt`
- **文件总览**: `DEPLOYMENT_README.md`

---

## 🎉 部署成功！

访问以下地址：

| 服务 | 地址 | 说明 |
|------|------|------|
| API | http://111.230.110.95 | 主API入口 |
| API文档 | http://111.230.110.95/docs | Swagger文档 |
| 监控 | http://111.230.110.95:3001 | Grafana (admin/Grafana2024!) |

**下一步：**
1. 测试移动端连接
2. 配置SSL证书（可选）
3. 设置数据库备份

---

**部署愉快！** 🚀

