# 🚀 RoomEase 服务器部署指令

## 📋 服务器信息

```
公网IP: 111.230.110.95
内网IP: 10.1.24.5
系统: Ubuntu 22.04 (预装Docker 26)
域名: @.englishpartner.cn, www.englishpartner.cn
```

---

## 🎯 快速部署（推荐）

### 第一步：连接服务器

```bash
ssh root@111.230.110.95
```

### 第二步：服务器初始化（仅首次需要）

```bash
# 创建工作目录
mkdir -p /opt/roomease
cd /opt/roomease

# 上传初始化脚本（从本地电脑执行）
scp scripts/setup-server.sh root@111.230.110.95:/opt/roomease/

# 在服务器上运行初始化脚本
chmod +x setup-server.sh
./setup-server.sh
```

### 第三步：上传代码

**从本地电脑执行：**

```bash
# 方法1: 使用 rsync（推荐，更快）
rsync -avz --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'apps/mobile/node_modules' \
  --exclude 'apps/web/node_modules' \
  /Users/zhuchiyu/Documents/projects/RoomEase/ \
  root@111.230.110.95:/opt/roomease/

# 方法2: 使用 scp（备选）
cd /Users/zhuchiyu/Documents/projects/RoomEase
tar --exclude='node_modules' --exclude='.git' -czf roomease.tar.gz .
scp roomease.tar.gz root@111.230.110.95:/opt/roomease/
# 然后在服务器上解压
ssh root@111.230.110.95 "cd /opt/roomease && tar -xzf roomease.tar.gz && rm roomease.tar.gz"
```

### 第四步：配置环境变量

**在服务器上执行：**

```bash
cd /opt/roomease

# 复制环境配置模板
cp docker-compose.production.yml docker-compose.yml

# 创建.env文件（直接复制以下内容）
cat > .env <<'EOF'
# RoomEase Production Environment

NODE_ENV=production
PORT=4000

# 数据库配置
DATABASE_URL=postgresql://postgres:RoomEase2024!@postgres:5432/roomease?schema=public
POSTGRES_PASSWORD=RoomEase2024!

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=Redis2024!

# JWT配置（请修改为随机字符串）
JWT_SECRET=CHANGE_ME_TO_RANDOM_STRING_1
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=CHANGE_ME_TO_RANDOM_STRING_2
JWT_REFRESH_EXPIRES_IN=30d

# ClickHouse配置
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=roomease_analytics
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=

# RabbitMQ配置
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=rabbitmq
RABBITMQ_PASSWORD=RabbitMQ2024!
RABBITMQ_VHOST=roomease

# MinIO配置
MINIO_ENDPOINT=minio
MINIO_PORT=9002
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=MinIO2024!
MINIO_USE_SSL=false
MINIO_BUCKET=roomease

# CORS配置（添加您的域名）
CORS_ORIGINS=http://111.230.110.95,http://www.englishpartner.cn,http://englishpartner.cn

# 监控配置
GRAFANA_ADMIN_PASSWORD=Grafana2024!

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json
EOF

# ⚠️ 重要：生成随机JWT密钥
JWT_SECRET1=$(openssl rand -base64 32)
JWT_SECRET2=$(openssl rand -base64 32)

# 替换JWT密钥
sed -i "s|JWT_SECRET=CHANGE_ME_TO_RANDOM_STRING_1|JWT_SECRET=${JWT_SECRET1}|g" .env
sed -i "s|JWT_REFRESH_SECRET=CHANGE_ME_TO_RANDOM_STRING_2|JWT_REFRESH_SECRET=${JWT_SECRET2}|g" .env

# 显示生成的密钥（请保存）
echo "生成的JWT密钥："
echo "JWT_SECRET=${JWT_SECRET1}"
echo "JWT_REFRESH_SECRET=${JWT_SECRET2}"
```

### 第五步：部署服务

```bash
cd /opt/roomease

# 给部署脚本添加执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

部署脚本会自动：
- ✅ 检查Docker环境
- ✅ 构建Docker镜像
- ✅ 启动所有服务
- ✅ 运行健康检查

---

## 📊 验证部署

### 检查服务状态

```bash
cd /opt/roomease

# 查看所有容器状态
docker-compose ps

# 查看API Gateway日志
docker-compose logs -f api-gateway

# 查看所有服务日志
docker-compose logs -f
```

### 测试API端点

```bash
# 健康检查
curl http://localhost/health

# 或直接访问API Gateway
curl http://localhost:4000/health

# 查看API文档
curl http://localhost/docs
```

### 从外部访问

在您的浏览器或移动设备上访问：

```
API文档: http://111.230.110.95/docs
健康检查: http://111.230.110.95/health
Grafana监控: http://111.230.110.95:3001
```

---

## 🔧 常用管理命令

### 查看服务状态

```bash
cd /opt/roomease
docker-compose ps
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f api-gateway
docker-compose logs -f postgres
docker-compose logs -f redis

# 查看最近100行日志
docker-compose logs --tail=100 api-gateway
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart api-gateway
docker-compose restart nginx
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（⚠️ 慎用，会删除数据）
docker-compose down -v
```

### 更新代码

```bash
# 方法1: 使用更新脚本
cd /opt/roomease
./scripts/update-production.sh

# 方法2: 手动更新
cd /opt/roomease
git pull  # 如果使用Git
# 或重新上传代码文件

# 重新构建并启动
docker-compose build api-gateway
docker-compose up -d api-gateway
```

### 数据库管理

```bash
# 进入PostgreSQL
docker-compose exec postgres psql -U postgres roomease

# 备份数据库
docker-compose exec postgres pg_dump -U postgres roomease > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres roomease < backup.sql

# 查看数据库大小
docker-compose exec postgres psql -U postgres -c "\l+ roomease"
```

### 清理Docker资源

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的网络
docker network prune

# 清理所有未使用的资源
docker system prune -a
```

---

## 🔐 安全配置

### 1. 配置防火墙

```bash
# 启用UFW
ufw enable

# 允许必要端口
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# 查看防火墙状态
ufw status
```

### 2. 配置腾讯云安全组

在腾讯云控制台 > 安全组规则中添加：

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 22 | 您的IP | SSH访问 |
| TCP | 80 | 0.0.0.0/0 | HTTP访问 |
| TCP | 443 | 0.0.0.0/0 | HTTPS访问 |

### 3. 配置SSL证书（推荐）

```bash
# 安装certbot
apt install -y certbot python3-certbot-nginx

# 申请SSL证书
certbot certonly --standalone -d www.englishpartner.cn

# 证书路径
# /etc/letsencrypt/live/www.englishpartner.cn/fullchain.pem
# /etc/letsencrypt/live/www.englishpartner.cn/privkey.pem

# 复制证书到nginx目录
mkdir -p /opt/roomease/nginx/ssl
cp /etc/letsencrypt/live/www.englishpartner.cn/fullchain.pem /opt/roomease/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/www.englishpartner.cn/privkey.pem /opt/roomease/nginx/ssl/key.pem

# 修改nginx配置启用HTTPS
vim /opt/roomease/nginx/nginx.conf
# 取消HTTPS server块的注释

# 重启nginx
docker-compose restart nginx

# 设置自动续期
certbot renew --dry-run
```

---

## 📱 移动端配置

修改移动端配置以连接到服务器：

**文件：** `apps/mobile/app/config/environment.ts`

```typescript
export const API_CONFIG = {
  BASE_URL: isDev 
    ? 'http://192.168.31.221:4000'  // 开发环境
    : 'http://111.230.110.95',      // 修改为服务器IP
    // : 'https://www.englishpartner.cn',  // 或使用域名（配置SSL后）
  
  TIMEOUT: 30000,
  ENABLE_LOGGING: isDev,
  MAX_RETRIES: 3,
}
```

---

## 🆘 故障排除

### 问题1: 无法访问API

```bash
# 检查容器是否运行
docker-compose ps

# 检查API Gateway日志
docker-compose logs api-gateway

# 检查端口监听
netstat -tlnp | grep 4000
netstat -tlnp | grep 80

# 测试容器内部访问
docker-compose exec api-gateway curl localhost:4000/health
```

### 问题2: 数据库连接失败

```bash
# 检查PostgreSQL日志
docker-compose logs postgres

# 测试数据库连接
docker-compose exec postgres psql -U postgres -c "SELECT version();"

# 检查数据库是否创建
docker-compose exec postgres psql -U postgres -l
```

### 问题3: 内存不足

```bash
# 查看内存使用
free -h

# 查看Docker资源使用
docker stats

# 创建交换空间
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### 问题4: 磁盘空间不足

```bash
# 查看磁盘使用
df -h

# 查看Docker磁盘使用
docker system df

# 清理Docker资源
docker system prune -a --volumes
```

---

## 📞 支持信息

如遇到问题，请：
1. 查看服务日志：`docker-compose logs -f`
2. 参考完整文档：`DEPLOYMENT_GUIDE.md`
3. 联系开发团队

---

**祝部署成功！** 🎉

