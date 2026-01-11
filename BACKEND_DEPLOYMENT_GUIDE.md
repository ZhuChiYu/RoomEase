# 房间排序和可见性功能 - 生产环境部署指南

## 概述

本文档说明如何在腾讯云服务器（111.230.110.95）上部署房间排序和可见性控制功能。

## 部署前检查

### 1. 功能变更说明

本次更新包含：
- ✅ 数据库新增字段：`sortOrder` 和 `isVisible`
- ✅ API新增端点：`PATCH /api/rooms/batch-order`
- ✅ 移动端新增功能：拖拽排序、左滑编辑、可见性控制
- ✅ 房态日历支持排序和过滤

### 2. 影响评估

- **数据库变更**：添加2个新字段（向后兼容）
- **API变更**：新增1个端点，更新现有端点支持新字段
- **服务重启**：需要重启API Gateway服务
- **预计停机时间**：< 1分钟

---

## 快速部署（推荐）

### 方式一：使用一键部署脚本

```bash
# 1. SSH连接到服务器
ssh root@111.230.110.95

# 2. 进入项目目录
cd /root/RoomEase

# 3. 拉取最新代码
git pull origin main

# 4. 给脚本添加执行权限
chmod +x deploy-room-sorting-feature.sh

# 5. 运行部署脚本
./deploy-room-sorting-feature.sh
```

---

## 详细部署步骤

### 步骤1: 连接服务器并拉取代码

```bash
# SSH连接到腾讯云服务器
ssh root@111.230.110.95

# 进入项目目录
cd /root/RoomEase

# 查看当前分支和状态
git status

# 拉取最新代码
git pull origin main

# 验证代码已更新
git log -1 --oneline
# 应该看到最新的commit包含 "房间排序和可见性功能"
```

### 步骤2: 备份数据库（重要！）

```bash
# 备份当前数据库
docker-compose -f docker-compose.production.yml exec postgres \
  pg_dump -U postgres roomease > backup-room-sorting-$(date +%Y%m%d-%H%M%S).sql

# 验证备份文件
ls -lh backup-room-sorting-*.sql
```

### 步骤3: 执行数据库迁移

```bash
# 方式1: 使用Prisma迁移（推荐）
cd packages/database

# 确保依赖已安装
pnpm install

# 生成Prisma Client
npx prisma generate

# 查看待执行的迁移
npx prisma migrate status

# 执行迁移
npx prisma migrate deploy

cd ../..

# 方式2: 手动执行SQL（如果方式1失败）
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres -d roomease <<'EOF'
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "rooms_sortOrder_idx" ON "rooms"("sortOrder");
EOF
```

### 步骤4: 验证数据库更改

```bash
# 连接到数据库
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d roomease

# 在psql中执行：
\d rooms

# 应该看到新增的字段：
# sortOrder    | integer | not null default 0
# isVisible    | boolean | not null default true

# 退出psql
\q
```

### 步骤5: 重新构建API Gateway镜像

```bash
# 构建新镜像
docker-compose -f docker-compose.production.yml build api-gateway

# 查看构建的镜像
docker images | grep api-gateway
```

### 步骤6: 重启API Gateway服务

```bash
# 停止API Gateway
docker-compose -f docker-compose.production.yml stop api-gateway

# 启动API Gateway（使用新镜像）
docker-compose -f docker-compose.production.yml up -d api-gateway

# 等待服务启动（约10秒）
sleep 10

# 查看服务状态
docker-compose -f docker-compose.production.yml ps api-gateway
```

### 步骤7: 验证部署

```bash
# 1. 检查服务健康状态
curl http://localhost:4000/health

# 2. 检查新API端点是否存在
docker-compose -f docker-compose.production.yml logs api-gateway | grep "batch-order"

# 3. 查看最近的日志
docker-compose -f docker-compose.production.yml logs --tail=50 api-gateway

# 4. 测试数据库表结构
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d roomease -c "\d rooms" | grep -E "sortOrder|isVisible"

# 应该看到：
# sortOrder    | integer | not null default 0
# isVisible    | boolean | not null default true
```

### 步骤8: 测试API功能

```bash
# 获取token（使用实际的用户凭据）
TOKEN=$(curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"your_password"}' \
  | jq -r '.token')

# 测试获取房间列表（应该包含sortOrder和isVisible字段）
curl -X GET http://localhost:4000/rooms \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.[] | {id, name, sortOrder, isVisible}'

# 测试批量更新房间顺序
curl -X PATCH http://localhost:4000/rooms/batch-order \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {"id": "room_id_1", "sortOrder": 0},
      {"id": "room_id_2", "sortOrder": 1}
    ]
  }'
```

---

## 回滚方案

如果部署出现问题，可以快速回滚：

### 方式1: 代码回滚

```bash
# 查看提交历史
git log --oneline -10

# 回滚到上一个稳定版本
git reset --hard <previous_commit_hash>

# 重新构建和重启
docker-compose -f docker-compose.production.yml build api-gateway
docker-compose -f docker-compose.production.yml up -d api-gateway
```

### 方式2: 数据库回滚

```bash
# 连接到数据库
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d roomease

# 删除新增的字段（会丢失这些字段的数据）
ALTER TABLE "rooms" DROP COLUMN IF EXISTS "sortOrder";
ALTER TABLE "rooms" DROP COLUMN IF EXISTS "isVisible";
DROP INDEX IF EXISTS "rooms_sortOrder_idx";

# 退出
\q
```

### 方式3: 从备份恢复

```bash
# 恢复之前的备份
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres roomease < backup-room-sorting-20260111-*.sql
```

---

## 监控和日志

### 实时查看日志

```bash
# 查看API Gateway实时日志
docker-compose -f docker-compose.production.yml logs -f api-gateway

# 查看最近100行日志
docker-compose -f docker-compose.production.yml logs --tail=100 api-gateway

# 查看错误日志
docker-compose -f docker-compose.production.yml logs api-gateway | grep -i error
```

### 查看资源使用情况

```bash
# 查看所有容器资源使用
docker stats

# 查看特定容器
docker stats $(docker-compose -f docker-compose.production.yml ps -q api-gateway)
```

### 访问监控面板

- **Grafana**: http://111.230.110.95:3001
- **Prometheus**: http://111.230.110.95:9090

---

## 移动端配置

部署完成后，移动端无需修改配置，但建议测试以下功能：

### 功能测试清单

- [ ] 修改房型页面 - 左滑编辑/删除房间
- [ ] 修改房型页面 - 拖拽调整房间顺序
- [ ] 修改房型页面 - 编辑房间名称
- [ ] 修改房型页面 - 切换房间可见性
- [ ] 房型房间设置页面 - 拖拽调整房型顺序
- [ ] 房态日历 - 确认房间按顺序显示
- [ ] 房态日历 - 确认隐藏的房间不显示

---

## 常见问题

### Q1: 迁移执行失败

**错误信息**: `Migration failed: relation "rooms" does not exist`

**解决方案**:
```bash
# 检查数据库连接
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -l

# 确认roomease数据库存在
# 如果不存在，先运行初始迁移
cd packages/database
npx prisma migrate deploy
cd ../..
```

### Q2: API启动失败

**错误信息**: `Cannot find module '@prisma/client'`

**解决方案**:
```bash
# 重新生成Prisma Client
cd packages/database
npx prisma generate
pnpm build
cd ../..

# 重新构建镜像
docker-compose -f docker-compose.production.yml build api-gateway
docker-compose -f docker-compose.production.yml up -d api-gateway
```

### Q3: API返回500错误

**解决方案**:
```bash
# 查看详细错误日志
docker-compose -f docker-compose.production.yml logs api-gateway

# 进入容器检查
docker-compose -f docker-compose.production.yml exec api-gateway sh

# 在容器内检查环境变量
env | grep DATABASE_URL
```

### Q4: 移动端连接失败

**检查步骤**:
```bash
# 1. 确认API Gateway正在运行
docker-compose -f docker-compose.production.yml ps api-gateway

# 2. 测试内部访问
docker-compose -f docker-compose.production.yml exec api-gateway curl localhost:4000/health

# 3. 测试外部访问
curl http://111.230.110.95:4000/health

# 4. 检查防火墙
sudo ufw status
```

---

## 性能优化建议

### 数据库索引

```sql
-- sortOrder字段已自动创建索引
-- 如需查看索引状态：
SELECT * FROM pg_indexes WHERE tablename = 'rooms';
```

### 缓存策略

由于添加了排序功能，建议清除相关缓存：

```bash
# 清除Redis缓存
docker-compose -f docker-compose.production.yml exec redis redis-cli FLUSHDB
```

---

## 完成检查清单

部署完成后，请确认以下项目：

- [ ] 数据库迁移成功执行
- [ ] rooms表包含sortOrder和isVisible字段
- [ ] API Gateway服务正常运行
- [ ] API健康检查返回正常
- [ ] 新API端点可以访问
- [ ] 移动端可以连接到后端
- [ ] 房间排序功能正常
- [ ] 房间可见性控制正常
- [ ] 房态日历显示正确
- [ ] 备份文件已保存

---

## 联系信息

如遇到问题：
1. 查看服务日志：`docker-compose -f docker-compose.production.yml logs -f api-gateway`
2. 查看数据库日志：`docker-compose -f docker-compose.production.yml logs postgres`
3. 检查监控面板：Grafana (http://111.230.110.95:3001)

---

## 预计时间

- 备份数据库: 1分钟
- 拉取代码: 30秒
- 数据库迁移: 10秒
- 构建镜像: 3-5分钟
- 重启服务: 30秒
- 验证测试: 2分钟

**总计: 约10分钟**

---

**部署日期**: 2026-01-11
**服务器**: 111.230.110.95
**项目路径**: /root/RoomEase
