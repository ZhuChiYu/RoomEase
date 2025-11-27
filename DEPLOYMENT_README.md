# 🚀 RoomEase 后端部署文件总览

## 📦 部署文件清单

### 核心配置文件

| 文件 | 说明 | 用途 |
|------|------|------|
| `docker-compose.production.yml` | 生产环境Docker编排 | 定义所有服务容器 |
| `services/api-gateway/Dockerfile` | API Gateway镜像构建 | 构建后端服务镜像 |
| `nginx/nginx.conf` | Nginx配置 | 反向代理和负载均衡 |
| `.env` | 环境变量配置 | 存储敏感配置（需创建） |
| `ENV_EXAMPLE.txt` | 环境变量示例 | 配置参考模板 |

### 部署脚本

| 脚本 | 说明 | 执行时机 |
|------|------|---------|
| `deploy.sh` | 一键部署脚本 | 首次部署或完整重新部署 |
| `scripts/setup-server.sh` | 服务器初始化脚本 | 首次配置服务器时 |
| `scripts/update-production.sh` | 生产环境更新脚本 | 代码更新时 |

### 文档

| 文档 | 说明 | 目标读者 |
|------|------|---------|
| `DEPLOYMENT_GUIDE.md` | 完整部署指南 | 开发者/运维人员 |
| `SERVER_DEPLOYMENT_INSTRUCTIONS.md` | 服务器部署指令 | 运维人员 |
| `DEPLOYMENT_README.md` | 部署文件总览（本文件） | 所有人 |

---

## 🎯 快速开始

### 方案一：完整手动部署（推荐用于生产环境）

适合：希望完全掌控部署过程的用户

```bash
# 1. 在腾讯云服务器上连接
ssh root@111.230.110.95

# 2. 初始化服务器（首次）
mkdir -p /opt/roomease
cd /opt/roomease
# 上传setup-server.sh并执行
./setup-server.sh

# 3. 上传项目代码
# 从本地执行rsync或scp上传

# 4. 配置环境变量
cp ENV_EXAMPLE.txt .env
vim .env  # 修改配置

# 5. 部署
./deploy.sh
```

**详细步骤请参考：** `SERVER_DEPLOYMENT_INSTRUCTIONS.md`

### 方案二：本地开发环境

适合：本地开发和测试

```bash
# 1. 启动所有基础服务
docker-compose up -d

# 2. 安装依赖
pnpm install

# 3. 运行数据库迁移
cd packages/database
pnpm prisma migrate dev
pnpm prisma generate

# 4. 启动开发服务
cd ../../services/api-gateway
pnpm dev
```

---

## 📋 服务器信息

```
提供商: 腾讯云
公网IP: 111.230.110.95
内网IP: 10.1.24.5
系统: Ubuntu 22.04 LTS (Docker 26预装)
域名: www.englishpartner.cn
     englishpartner.cn
```

### 访问端点

| 服务 | 地址 | 说明 |
|------|------|------|
| API | http://111.230.110.95 | 主API入口 |
| API文档 | http://111.230.110.95/docs | Swagger文档 |
| 健康检查 | http://111.230.110.95/health | 服务状态 |
| Grafana | http://111.230.110.95:3001 | 监控面板 |
| Prometheus | http://111.230.110.95:9090 | 指标监控 |

---

## 🔧 服务架构

### 容器服务

```
┌─────────────────────────────────────────────────┐
│                   Nginx (80/443)                │
│              (反向代理 + 负载均衡)                │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────┐
│            API Gateway (4000)                    │
│         (NestJS + REST API + WebSocket)         │
└────────┬──────────┬──────────┬──────────────────┘
         │          │          │
    ┌────┴────┐ ┌──┴───┐ ┌────┴────┐
    │PostgreSQL Redis   ClickHouse│
    │  (5432)  (6379)   (8123)    │
    └──────────┴────────┴──────────┘

其他服务:
- RabbitMQ (5672, 15672): 消息队列
- MinIO (9001, 9002): 对象存储
- Prometheus (9090): 监控
- Grafana (3001): 可视化
```

### 数据流

```
移动端/Web
    ↓
  Nginx (80/443)
    ↓
API Gateway (4000)
    ↓
 ┌─────────┬──────────┬────────────┐
 PostgreSQL  Redis  ClickHouse RabbitMQ
 (主数据库) (缓存)  (分析)    (队列)
```

---

## ⚙️ 环境变量配置

### 必须配置项

```bash
# 数据库
DATABASE_URL=postgresql://postgres:密码@postgres:5432/roomease
POSTGRES_PASSWORD=强密码

# Redis
REDIS_PASSWORD=强密码

# JWT密钥（使用 openssl rand -base64 32 生成）
JWT_SECRET=随机字符串1
JWT_REFRESH_SECRET=随机字符串2

# CORS（添加您的域名）
CORS_ORIGINS=http://111.230.110.95,http://www.englishpartner.cn
```

### 可选配置项

```bash
# 腾讯云服务（需要时配置）
TENCENT_SMS_SECRET_ID=
TENCENT_SMS_SECRET_KEY=
TENCENT_COS_SECRET_ID=
TENCENT_COS_SECRET_KEY=
TENCENT_OCR_SECRET_ID=
TENCENT_OCR_SECRET_KEY=

# 微信小程序
WECHAT_APP_ID=
WECHAT_APP_SECRET=
```

**完整配置说明请参考：** `ENV_EXAMPLE.txt`

---

## 📱 移动端配置

### 修改API地址

编辑文件：`apps/mobile/app/config/environment.ts`

```typescript
export const API_CONFIG = {
  BASE_URL: isDev 
    ? 'http://192.168.31.221:4000'       // 开发环境（局域网）
    : 'http://111.230.110.95',           // 生产环境（服务器IP）
    // : 'https://www.englishpartner.cn', // 或使用域名（配置SSL后）
  
  TIMEOUT: 30000,
  ENABLE_LOGGING: isDev,
  MAX_RETRIES: 3,
}
```

### 测试连接

在移动设备浏览器访问：
```
http://111.230.110.95/health
```

如果返回以下内容，说明连接成功：
```json
{
  "status": "ok",
  "timestamp": "2024-11-27T...",
  "uptime": 123.45,
  "environment": "production"
}
```

---

## 🔐 安全配置

### 1. 防火墙配置

#### Ubuntu UFW
```bash
ufw enable
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw status
```

#### 腾讯云安全组
在腾讯云控制台配置：
- TCP 22 (SSH) - 限制IP访问
- TCP 80 (HTTP) - 允许所有
- TCP 443 (HTTPS) - 允许所有

### 2. SSL证书（推荐）

```bash
# 使用Let's Encrypt免费证书
apt install certbot
certbot certonly --standalone -d www.englishpartner.cn

# 配置Nginx使用SSL
# 编辑 nginx/nginx.conf，取消HTTPS server块的注释
```

### 3. 密码安全

- ✅ 使用强密码（至少12位，包含大小写字母、数字、特殊字符）
- ✅ 不同服务使用不同密码
- ✅ 定期更换密码
- ✅ 备份密码到安全位置

---

## 📊 监控和维护

### 日志查看

```bash
# 所有服务日志
docker-compose -f docker-compose.production.yml logs -f

# 特定服务日志
docker-compose -f docker-compose.production.yml logs -f api-gateway
docker-compose -f docker-compose.production.yml logs -f postgres
```

### 监控面板

- **Grafana**: http://111.230.110.95:3001
  - 用户: admin
  - 密码: 在.env中配置的GRAFANA_ADMIN_PASSWORD

- **Prometheus**: http://111.230.110.95:9090
  - 查看指标和告警

### 数据库备份

```bash
# 手动备份
docker-compose exec postgres pg_dump -U postgres roomease > backup-$(date +%Y%m%d).sql

# 设置自动备份（crontab）
0 2 * * * cd /opt/roomease && docker-compose exec postgres pg_dump -U postgres roomease > backup-$(date +\%Y\%m\%d).sql
```

### 代码更新

```bash
# 使用更新脚本
cd /opt/roomease
./scripts/update-production.sh

# 或手动更新
git pull
docker-compose build api-gateway
docker-compose up -d api-gateway
```

---

## 🆘 常见问题

### Q1: 部署后无法访问

```bash
# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs api-gateway

# 检查防火墙
ufw status

# 检查端口监听
netstat -tlnp | grep -E '80|4000'
```

### Q2: 数据库连接失败

```bash
# 检查PostgreSQL容器
docker-compose logs postgres

# 测试数据库连接
docker-compose exec postgres psql -U postgres roomease

# 检查DATABASE_URL配置
cat .env | grep DATABASE_URL
```

### Q3: 内存不足

```bash
# 查看内存使用
free -h
docker stats

# 清理Docker资源
docker system prune -a
```

### Q4: 移动端无法连接

1. 检查服务器防火墙：`ufw status`
2. 检查腾讯云安全组规则
3. 测试API连接：`curl http://111.230.110.95/health`
4. 确认移动端API配置正确

**更多问题请参考：** `DEPLOYMENT_GUIDE.md`

---

## 📞 获取帮助

### 文档索引

- **快速开始**: `SERVER_DEPLOYMENT_INSTRUCTIONS.md`
- **完整指南**: `DEPLOYMENT_GUIDE.md`
- **环境配置**: `ENV_EXAMPLE.txt`
- **文件总览**: `DEPLOYMENT_README.md` (本文件)

### 支持方式

1. 查看日志文件
2. 参考文档常见问题部分
3. 联系开发团队

---

## ✅ 部署检查清单

### 首次部署

- [ ] 服务器初始化完成
- [ ] 代码上传到服务器
- [ ] .env文件配置完成
- [ ] JWT密钥已生成并配置
- [ ] 所有密码已修改为强密码
- [ ] 防火墙规则配置完成
- [ ] 腾讯云安全组配置完成
- [ ] 运行deploy.sh成功
- [ ] 健康检查通过
- [ ] 移动端可以连接

### 生产环境

- [ ] SSL证书配置（HTTPS）
- [ ] 域名解析配置
- [ ] 数据库备份策略
- [ ] 监控告警配置
- [ ] 日志轮转配置
- [ ] 定期安全更新

---

**祝您部署顺利！** 🎉

如有问题，请参考详细文档或联系技术支持。

