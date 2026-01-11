# 数据库迁移：添加用户信息字段

## 修改时间
2025-11-30

## 修改内容
在 `User` 表中添加两个新字段：
- `hotelName` (String, 可选) - 民宿/酒店名称
- `position` (String, 可选) - 职位

## 本地执行步骤

```bash
# 1. 进入 database 包目录
cd /Users/zhuchiyu/Project/RoomEasy/RoomEase/packages/database

# 2. 创建迁移文件
npx prisma migrate dev --name add_user_hotel_and_position

# 3. 提交代码
cd ../..
git add .
git commit -m "feat: 添加用户hotelName和position字段"
git push origin main
```

## 服务器执行步骤

```bash
# SSH 登录服务器后执行：

# 1. 进入项目目录
cd /opt/RoomEase

# 2. 停止所有服务
docker-compose down

# 3. 拉取最新代码
git pull origin main

# 4. 进入 database 目录，运行迁移
cd packages/database
npm install
npx prisma migrate deploy

# 5. 返回项目根目录
cd ../..

# 6. 重新构建并启动
docker-compose build --no-cache
docker-compose up -d

# 7. 查看日志
docker-compose logs -f api-gateway --tail=50
```

## 快速执行脚本（服务器上）

```bash
#!/bin/bash
set -e

echo "=== 开始更新数据库 ==="

cd /opt/RoomEase

# 停止服务
echo "⏸️  停止服务..."
docker-compose down

# 拉取代码
echo "📥 拉取最新代码..."
git stash
git pull origin main
git stash pop || true

# 运行迁移（直接在容器中）
echo "🗄️  运行数据库迁移..."
docker-compose run --rm api-gateway sh -c "cd /app/packages/database && npx prisma migrate deploy"

# 重新构建
echo "🔨 重新构建服务..."
docker-compose build --no-cache api-gateway

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待启动
sleep 5

# 查看日志
echo "📋 查看日志..."
docker-compose logs api-gateway --tail=50

echo "✅ 更新完成！"
```

## 验证迁移

```bash
# 进入数据库查看表结构
docker-compose exec postgres psql -U roomease -d roomease -c "\d users"

# 应该能看到新增的字段：
# hotelName | text
# position  | text
```

## SQL 迁移文件内容

如果需要手动执行 SQL：

```sql
-- 添加 hotelName 字段
ALTER TABLE "users" ADD COLUMN "hotelName" TEXT;

-- 添加 position 字段
ALTER TABLE "users" ADD COLUMN "position" TEXT;
```





