# RoomEase 后端服务部署指南

## 目录
1. [服务器要求](#服务器要求)
2. [部署前准备](#部署前准备)
3. [快速部署](#快速部署)
4. [手动部署步骤](#手动部署步骤)
5. [配置说明](#配置说明)
6. [常见问题](#常见问题)
7. [维护和监控](#维护和监控)

---

## 服务器要求

### 硬件要求
- **CPU**: 2核心以上（推荐4核心）
- **内存**: 4GB以上（推荐8GB）
- **磁盘**: 40GB以上（推荐SSD）
- **网络**: 公网IP，带宽5Mbps以上

### 软件要求
- **操作系统**: Ubuntu 22.04 LTS（已预装Docker）
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### 腾讯云服务器信息
```
公网IP: 111.230.110.95
内网IP: 10.1.24.5
系统: Ubuntu 22.04-Docker26
域名: @.englishpartner.cn, www.englishpartner.cn
```

---

## 部署前准备

### 1. 连接到服务器

```bash
# 使用SSH连接到腾讯云服务器
ssh root@111.230.110.95

# 或使用腾讯云提供的密钥
ssh -i /path/to/your/key.pem ubuntu@111.230.110.95
```

### 2. 验证Docker环境

```bash
# 检查Docker版本
docker --version
# 输出: Docker version 26.x.x

# 检查Docker Compose版本
docker-compose --version
# 输出: Docker Compose version v2.x.x

# 测试Docker是否正常运行
docker run hello-world
```

### 3. 安装必要工具

```bash
# 更新系统包
sudo apt update

# 安装必要工具
sudo apt install -y git curl wget vim

# 安装 Node.js (用于运行数据库迁移)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm
npm install -g pnpm@8.15.0
```

---

## 快速部署

### 一键部署脚本

```bash
# 1. 克隆代码仓库
git clone https://github.com/your-org/RoomEase.git
cd RoomEase

# 2. 复制环境配置文件
cp .env.production .env

# 3. 编辑环境配置（重要！）
vim .env
# 至少修改以下配置：
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - POSTGRES_PASSWORD
# - REDIS_PASSWORD

# 4. 给部署脚本添加执行权限
chmod +x deploy.sh

# 5. 运行部署脚本
./deploy.sh
```

部署脚本会自动完成：
- ✅ 检查Docker环境
- ✅ 构建Docker镜像
- ✅ 启动所有服务
- ✅ 检查服务健康状态

---

## 手动部署步骤

如果您想手动控制部署过程，可以按以下步骤操作：

### 1. 上传代码到服务器

```bash
# 方法1: 使用Git克隆
git clone https://github.com/your-org/RoomEase.git
cd RoomEase

# 方法2: 使用rsync同步本地代码
rsync -avz --exclude 'node_modules' --exclude '.git' \
  /path/to/local/RoomEase/ root@111.230.110.95:/root/RoomEase/
```

### 2. 配置环境变量

```bash
# 复制环境配置文件
cp .env.production .env

# 编辑配置文件
vim .env
```

**必须修改的配置项：**

```bash
# JWT密钥（使用以下命令生成）
openssl rand -base64 32
# 将生成的密钥填入：
JWT_SECRET=生成的随机字符串
JWT_REFRESH_SECRET=另一个随机字符串

# 数据库密码（强密码）
POSTGRES_PASSWORD=your_strong_password

# Redis密码
REDIS_PASSWORD=your_redis_password
```

### 3. 构建Docker镜像

```bash
# 构建所有服务的镜像
docker-compose -f docker-compose.production.yml build

# 或者只构建API Gateway
docker-compose -f docker-compose.production.yml build api-gateway
```

### 4. 启动数据库服务

```bash
# 先启动基础服务
docker-compose -f docker-compose.production.yml up -d postgres redis clickhouse rabbitmq minio

# 等待服务启动（约30秒）
sleep 30

# 检查服务状态
docker-compose -f docker-compose.production.yml ps
```

### 5. 运行数据库迁移

```bash
# 进入数据库包目录
cd packages/database

# 安装依赖
pnpm install

# 生成Prisma客户端
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate deploy

# 返回项目根目录
cd ../..
```

### 6. 启动应用服务

```bash
# 启动所有服务
docker-compose -f docker-compose.production.yml up -d

# 查看启动日志
docker-compose -f docker-compose.production.yml logs -f api-gateway
```

### 7. 验证部署

```bash
# 检查API健康状态
curl http://localhost:4000/health

# 检查Nginx反向代理
curl http://localhost/health

# 查看所有服务状态
docker-compose -f docker-compose.production.yml ps
```

---

## 配置说明

### 服务端口映射

| 服务 | 容器端口 | 宿主机端口 | 说明 |
|------|---------|-----------|------|
| Nginx | 80 | 80 | HTTP访问入口 |
| Nginx | 443 | 443 | HTTPS访问入口 |
| API Gateway | 4000 | 4000 | API服务 |
| PostgreSQL | 5432 | 5432 | 主数据库 |
| Redis | 6379 | 6379 | 缓存 |
| ClickHouse | 8123, 9000 | 8123, 9000 | 分析数据库 |
| RabbitMQ | 5672, 15672 | 5672, 15672 | 消息队列 |
| MinIO | 9001, 9002 | 9001, 9002 | 对象存储 |
| Grafana | 3000 | 3001 | 监控面板 |
| Prometheus | 9090 | 9090 | 监控服务 |

### 防火墙配置

**腾讯云安全组规则：**

```
入站规则：
- HTTP: TCP 80 (0.0.0.0/0)
- HTTPS: TCP 443 (0.0.0.0/0)
- API: TCP 4000 (可选，建议通过Nginx访问)
- SSH: TCP 22 (建议限制IP)
```

**Ubuntu防火墙配置：**

```bash
# 启用UFW防火墙
sudo ufw enable

# 允许SSH
sudo ufw allow 22/tcp

# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允许API端口（可选）
sudo ufw allow 4000/tcp

# 查看防火墙状态
sudo ufw status
```

### 域名配置

#### 1. DNS解析配置

在腾讯云DNS或您的域名提供商处添加A记录：

```
类型: A
主机记录: @ 或 api
记录值: 111.230.110.95
TTL: 600
```

#### 2. Nginx配置修改

编辑 `nginx/nginx.conf`，将 `server_name` 修改为您的域名：

```nginx
server {
    listen 80;
    server_name api.englishpartner.cn;  # 修改为您的域名
    # ... 其他配置
}
```

#### 3. SSL证书配置（HTTPS）

```bash
# 创建SSL证书目录
mkdir -p nginx/ssl

# 上传SSL证书文件
# cert.pem - 证书文件
# key.pem - 私钥文件

# 修改nginx.conf启用HTTPS配置
vim nginx/nginx.conf
# 取消HTTPS server块的注释

# 重启Nginx
docker-compose -f docker-compose.production.yml restart nginx
```

### 移动端配置修改

修改移动端API地址以连接到后端服务器：

**文件：** `apps/mobile/app/config/api.config.ts`

```typescript
export const API_CONFIG = {
  production: {
    baseURL: 'http://111.230.110.95',  // 或使用域名
    // baseURL: 'https://api.englishpartner.cn',
    timeout: 30000,
  }
}
```

---

## 常见问题

### Q1: 部署后API无法访问

**检查步骤：**

```bash
# 1. 检查容器是否运行
docker-compose -f docker-compose.production.yml ps

# 2. 查看API Gateway日志
docker-compose -f docker-compose.production.yml logs api-gateway

# 3. 检查端口是否监听
netstat -tlnp | grep 4000

# 4. 测试容器内部访问
docker-compose -f docker-compose.production.yml exec api-gateway curl localhost:4000/health
```

**常见原因：**
- 数据库连接失败
- 环境变量配置错误
- 端口被占用

### Q2: 数据库连接失败

```bash
# 检查PostgreSQL容器状态
docker-compose -f docker-compose.production.yml logs postgres

# 进入PostgreSQL容器
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres

# 检查数据库是否创建
\l

# 检查表是否存在
\c roomease
\dt
```

### Q3: 内存不足

```bash
# 查看系统内存使用
free -h

# 查看Docker容器资源使用
docker stats

# 清理Docker资源
docker system prune -a
```

### Q4: 磁盘空间不足

```bash
# 查看磁盘使用
df -h

# 清理Docker镜像和容器
docker system prune -a --volumes

# 清理日志文件
sudo journalctl --vacuum-time=3d
```

### Q5: 服务启动慢

如果服务启动较慢，可能是因为：
- 镜像拉取慢：使用国内镜像源
- 构建慢：使用缓存或预构建镜像
- 数据库初始化慢：正常现象，首次启动需要更多时间

---

## 维护和监控

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.production.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.production.yml logs -f api-gateway

# 查看最近100行日志
docker-compose -f docker-compose.production.yml logs --tail=100 api-gateway
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.production.yml restart

# 重启特定服务
docker-compose -f docker-compose.production.yml restart api-gateway

# 重新构建并启动
docker-compose -f docker-compose.production.yml up -d --build
```

### 更新代码

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建镜像
docker-compose -f docker-compose.production.yml build api-gateway

# 3. 重启服务
docker-compose -f docker-compose.production.yml up -d api-gateway

# 4. 查看日志确认
docker-compose -f docker-compose.production.yml logs -f api-gateway
```

### 数据库备份

```bash
# 备份PostgreSQL数据库
docker-compose -f docker-compose.production.yml exec postgres \
  pg_dump -U postgres roomease > backup-$(date +%Y%m%d).sql

# 恢复数据库
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres roomease < backup-20240101.sql
```

### 监控面板

访问以下地址查看系统状态：

- **Grafana**: http://111.230.110.95:3001
  - 用户名: admin
  - 密码: admin123（在.env中配置）

- **Prometheus**: http://111.230.110.95:9090
  - 查看各项指标和告警

- **RabbitMQ**: http://111.230.110.95:15672
  - 用户名: rabbitmq
  - 密码: rabbitmq123

### 性能优化

#### 1. 数据库优化

```bash
# 进入PostgreSQL容器
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres roomease

# 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# 创建索引
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
```

#### 2. Redis缓存配置

编辑 `.env` 文件：

```bash
# Redis缓存配置
REDIS_MAX_MEMORY=512mb
REDIS_MAXMEMORY_POLICY=allkeys-lru
```

#### 3. Nginx缓存

编辑 `nginx/nginx.conf` 添加缓存配置：

```nginx
# 添加到http块
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;
```

---

## 安全建议

### 1. 修改默认密码

确保修改所有服务的默认密码：
- PostgreSQL: POSTGRES_PASSWORD
- Redis: REDIS_PASSWORD
- RabbitMQ: RABBITMQ_PASSWORD
- MinIO: MINIO_ROOT_PASSWORD
- Grafana: GF_SECURITY_ADMIN_PASSWORD

### 2. 启用HTTPS

生产环境必须启用HTTPS：
- 申请SSL证书（推荐Let's Encrypt免费证书）
- 配置Nginx HTTPS
- 强制HTTP重定向到HTTPS

### 3. 限制访问

- 使用防火墙限制不必要的端口
- 配置Nginx访问控制
- 启用API限流

### 4. 定期更新

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 更新Docker镜像
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

---

## 快速命令参考

```bash
# 启动所有服务
docker-compose -f docker-compose.production.yml up -d

# 停止所有服务
docker-compose -f docker-compose.production.yml down

# 查看服务状态
docker-compose -f docker-compose.production.yml ps

# 查看日志
docker-compose -f docker-compose.production.yml logs -f

# 重启服务
docker-compose -f docker-compose.production.yml restart

# 进入容器
docker-compose -f docker-compose.production.yml exec api-gateway sh

# 清理资源
docker system prune -a
```

---

## 联系支持

如果遇到问题，请：
1. 查看日志文件
2. 检查本文档的常见问题部分
3. 联系开发团队

---

**祝您部署顺利！** 🚀

