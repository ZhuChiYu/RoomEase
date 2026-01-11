#!/bin/bash

# 部署房间排序和可见性功能的数据库迁移
# 日期: 2026-01-11

set -e

echo "🚀 开始部署房间排序和可见性数据库迁移..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 服务器配置
SERVER="root@47.236.101.143"
REMOTE_DIR="/opt/RoomEase"

echo -e "${YELLOW}📦 Step 1: 准备文件...${NC}"

# 确保我们在项目根目录
cd "$(dirname "$0")"

echo -e "${YELLOW}📤 Step 2: 上传 Prisma 相关文件到服务器...${NC}"

# 上传 schema 和迁移文件
scp packages/database/prisma/schema.prisma ${SERVER}:${REMOTE_DIR}/packages/database/prisma/
scp -r packages/database/prisma/migrations/20260111_add_room_sort_and_visibility ${SERVER}:${REMOTE_DIR}/packages/database/prisma/migrations/

echo -e "${YELLOW}🗄️  Step 3: 在服务器上执行数据库迁移...${NC}"

ssh ${SERVER} << 'ENDSSH'
cd /opt/RoomEase

echo "停止 API Gateway 容器（避免并发问题）..."
docker compose -f docker-compose.production.yml stop roomease-api-gateway

echo "执行数据库迁移..."
cd packages/database

# 生成 Prisma Client
npx prisma generate

# 执行迁移
npx prisma migrate deploy

echo "迁移完成，查看数据库状态..."
npx prisma migrate status

cd ../..

echo "重新启动所有服务..."
docker compose -f docker-compose.production.yml up -d

echo "等待服务启动..."
sleep 10

echo "检查服务状态..."
docker compose -f docker-compose.production.yml ps

echo "查看 API Gateway 日志..."
docker compose -f docker-compose.production.yml logs --tail=30 roomease-api-gateway

ENDSSH

echo -e "${GREEN}✅ 数据库迁移部署完成！${NC}"
echo ""
echo "迁移内容："
echo "  - 添加了 rooms.sortOrder 字段（整数，默认 0）"
echo "  - 添加了 rooms.isVisible 字段（布尔值，默认 true）"
echo "  - 创建了 sortOrder 索引以提升排序性能"
echo ""
echo "现在可以在移动端使用房间排序和可见性功能了！"
echo ""

