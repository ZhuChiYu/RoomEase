# 🔧 RoomEase 部署命令速查表

## 📋 快速索引

- [服务器连接](#服务器连接)
- [代码上传](#代码上传)
- [服务管理](#服务管理)
- [日志查看](#日志查看)
- [数据库操作](#数据库操作)
- [监控检查](#监控检查)
- [故障排查](#故障排查)

---

## 服务器连接

```bash
# SSH连接
ssh root@111.230.110.95

# 进入工作目录
cd /opt/roomease
```

---

## 代码上传

### 从本地上传代码

```bash
# 使用rsync (推荐)
rsync -avz --exclude 'node_modules' --exclude '.git' \
  --exclude 'apps/mobile/ios' \
  /Users/zhuchiyu/Documents/projects/RoomEase/ \
  root@111.230.110.95:/opt/roomease/

# 使用tar压缩上传
cd /Users/zhuchiyu/Documents/projects/RoomEase
tar --exclude='node_modules' --exclude='.git' -czf roomease.tar.gz .
scp roomease.tar.gz root@111.230.110.95:/opt/roomease/

# 在服务器上解压
ssh root@111.230.110.95 "cd /opt/roomease && tar -xzf roomease.tar.gz && rm roomease.tar.gz"
```

---

## 服务管理

### 启动服务

```bash
# 首次部署
./deploy.sh

# 启动所有服务
docker-compose up -d

# 启动特定服务
docker-compose up -d api-gateway
docker-compose up -d postgres redis
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止特定服务
docker-compose stop api-gateway

# 停止并删除所有数据 (⚠️ 慎用)
docker-compose down -v
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart api-gateway
docker-compose restart nginx
```

### 查看服务状态

```bash
# 查看所有容器状态
docker-compose ps

# 查看详细信息
docker-compose ps -a

# 查看资源使用
docker stats
```

### 重新构建

```bash
# 重新构建并启动
docker-compose up -d --build

# 只构建不启动
docker-compose build api-gateway

# 强制重新构建 (不使用缓存)
docker-compose build --no-cache api-gateway
```

---

## 日志查看

### 实时日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f api-gateway
docker-compose logs -f postgres
docker-compose logs -f nginx

# 查看多个服务日志
docker-compose logs -f api-gateway postgres redis
```

### 历史日志

```bash
# 查看最近100行
docker-compose logs --tail=100 api-gateway

# 查看最近10分钟
docker-compose logs --since 10m api-gateway

# 查看特定时间段
docker-compose logs --since "2024-11-27T10:00:00" api-gateway
```

### 搜索日志

```bash
# 搜索错误
docker-compose logs api-gateway | grep -i error

# 搜索特定关键词
docker-compose logs api-gateway | grep "database"

# 统计错误次数
docker-compose logs api-gateway | grep -i error | wc -l
```

---

## 数据库操作

### 连接数据库

```bash
# 进入PostgreSQL
docker-compose exec postgres psql -U postgres roomease

# 直接执行SQL
docker-compose exec postgres psql -U postgres roomease -c "SELECT COUNT(*) FROM users;"
```

### 常用SQL命令

```sql
-- 列出所有数据库
\l

-- 连接到数据库
\c roomease

-- 列出所有表
\dt

-- 查看表结构
\d users

-- 查看表记录数
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM reservations;

-- 退出
\q
```

### 数据库备份

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U postgres roomease > backup-$(date +%Y%m%d_%H%M%S).sql

# 备份到指定位置
docker-compose exec postgres pg_dump -U postgres roomease > /root/backups/roomease-$(date +%Y%m%d).sql

# 压缩备份
docker-compose exec postgres pg_dump -U postgres roomease | gzip > backup-$(date +%Y%m%d).sql.gz
```

### 数据库恢复

```bash
# 从备份恢复
docker-compose exec -T postgres psql -U postgres roomease < backup-20241127.sql

# 从压缩备份恢复
gunzip < backup-20241127.sql.gz | docker-compose exec -T postgres psql -U postgres roomease
```

### 数据库迁移

```bash
# 生成迁移
cd packages/database
pnpm prisma migrate dev --name migration_name

# 应用迁移
pnpm prisma migrate deploy

# 查看迁移状态
pnpm prisma migrate status
```

---

## 监控检查

### 健康检查

```bash
# 本地健康检查
curl http://localhost/health
curl http://localhost:4000/health

# 外部健康检查
curl http://111.230.110.95/health

# 详细输出
curl -i http://localhost/health
```

### 系统资源

```bash
# 查看内存使用
free -h

# 查看磁盘使用
df -h

# 查看CPU使用
top
htop

# 查看Docker资源使用
docker stats

# 查看Docker磁盘使用
docker system df
```

### 端口检查

```bash
# 查看监听端口
netstat -tlnp

# 查看特定端口
netstat -tlnp | grep 4000
netstat -tlnp | grep 80

# 测试端口连接
telnet localhost 4000
nc -zv localhost 4000
```

### 访问测试

```bash
# 测试API
curl http://localhost/health
curl http://localhost/docs

# 测试数据库
docker-compose exec postgres pg_isready -U postgres

# 测试Redis
docker-compose exec redis redis-cli -a Redis2024! ping
```

---

## 故障排查

### 容器问题

```bash
# 查看容器状态
docker-compose ps

# 查看失败的容器
docker-compose ps -a | grep Exit

# 重启失败的容器
docker-compose restart <service-name>

# 查看容器详细信息
docker inspect roomease-api-gateway

# 进入容器
docker-compose exec api-gateway sh
docker-compose exec postgres bash
```

### 网络问题

```bash
# 测试容器间网络
docker-compose exec api-gateway ping postgres
docker-compose exec api-gateway ping redis

# 查看网络配置
docker network ls
docker network inspect roomease-network

# 测试外部网络
docker-compose exec api-gateway curl https://www.baidu.com
```

### 清理资源

```bash
# 清理停止的容器
docker container prune

# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a

# 查看空间占用
docker system df
```

### 防火墙检查

```bash
# 查看防火墙状态
ufw status

# 允许端口
ufw allow 80/tcp
ufw allow 443/tcp

# 禁用端口
ufw deny 4000/tcp

# 重置防火墙
ufw reset
```

---

## 环境变量

### 查看环境变量

```bash
# 查看.env文件
cat .env

# 查看特定配置
grep DATABASE_URL .env
grep JWT_SECRET .env

# 在容器中查看环境变量
docker-compose exec api-gateway env
docker-compose exec api-gateway env | grep DATABASE
```

### 修改环境变量

```bash
# 编辑.env
vim .env

# 修改后重启服务
docker-compose restart api-gateway

# 或重新创建容器
docker-compose up -d --force-recreate api-gateway
```

---

## 更新部署

### 更新代码

```bash
# 方法1: 使用更新脚本
cd /opt/roomease
./scripts/update-production.sh

# 方法2: 手动更新
cd /opt/roomease
git pull  # 如果使用Git
# 或重新上传代码

# 重新构建并部署
docker-compose build api-gateway
docker-compose up -d api-gateway

# 查看更新后的日志
docker-compose logs -f api-gateway
```

### 回滚部署

```bash
# 停止当前版本
docker-compose down

# 恢复旧代码
# (从备份或Git)

# 重新部署
docker-compose up -d

# 恢复数据库 (如需要)
docker-compose exec -T postgres psql -U postgres roomease < backup.sql
```

---

## 性能优化

### 查看慢查询

```bash
# PostgreSQL慢查询
docker-compose exec postgres psql -U postgres roomease -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"
```

### 清理日志

```bash
# 清理Docker日志
truncate -s 0 $(docker inspect --format='{{.LogPath}}' roomease-api-gateway)

# 清理系统日志
journalctl --vacuum-time=3d
```

---

## 快速命令组合

### 完整重启

```bash
docker-compose down && docker-compose up -d && docker-compose logs -f
```

### 重建并启动

```bash
docker-compose build --no-cache && docker-compose up -d && docker-compose logs -f api-gateway
```

### 查看所有错误

```bash
docker-compose logs --tail=1000 | grep -i error
```

### 备份并清理

```bash
docker-compose exec postgres pg_dump -U postgres roomease > backup.sql && docker system prune -a
```

---

## 🔗 相关文档

- **快速部署**: `QUICK_DEPLOY.md`
- **完整指南**: `DEPLOYMENT_GUIDE.md`
- **环境配置**: `ENV_EXAMPLE.txt`

---

**提示**: 将此文件加入书签，随时查阅！📌

