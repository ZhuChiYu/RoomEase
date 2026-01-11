#!/bin/bash

# 部署调试版本以诊断 batch-order 问题
# 日期: 2026-01-11

set -e

echo "🚀 开始部署调试版本..."

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

echo -e "${YELLOW}🔨 Step 2: 编译后端代码...${NC}"
cd services/api-gateway
npm run build
cd ../..

echo -e "${YELLOW}📤 Step 3: 上传修改的文件到服务器...${NC}"

# 上传修改的文件
scp services/api-gateway/src/main.ts ${SERVER}:${REMOTE_DIR}/services/api-gateway/src/
scp services/api-gateway/src/modules/rooms/rooms.controller.ts ${SERVER}:${REMOTE_DIR}/services/api-gateway/src/modules/rooms/
scp -r services/api-gateway/dist ${SERVER}:${REMOTE_DIR}/services/api-gateway/

echo -e "${YELLOW}🔄 Step 4: 重启后端服务...${NC}"

ssh ${SERVER} << 'ENDSSH'
cd /opt/RoomEase

echo "重启 API Gateway 容器..."
docker compose -f docker-compose.production.yml restart roomease-api-gateway

echo "等待服务启动..."
sleep 5

echo "检查服务状态..."
docker compose -f docker-compose.production.yml ps

echo "查看最新日志..."
docker compose -f docker-compose.production.yml logs --tail=20 roomease-api-gateway

ENDSSH

echo -e "${GREEN}✅ 调试版本部署完成！${NC}"
echo ""
echo "现在请在移动端重试操作，然后运行以下命令查看详细日志："
echo "ssh root@47.236.101.143 'cd /opt/RoomEase && docker compose -f docker-compose.production.yml logs -f roomease-api-gateway'"
echo ""

