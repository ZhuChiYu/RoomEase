#!/bin/bash

# RoomEase 后端快速启动脚本
# 用法: ./start-backend.sh

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 RoomEase 后端启动脚本${NC}\n"

# 检查Docker是否运行
echo -e "${YELLOW}1. 检查Docker服务...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker未运行，请先启动Docker${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker已运行${NC}\n"

# 启动Docker服务
echo -e "${YELLOW}2. 启动Docker容器...${NC}"
docker compose up -d
echo -e "${GREEN}✅ Docker容器已启动${NC}\n"

# 等待数据库就绪
echo -e "${YELLOW}3. 等待数据库就绪...${NC}"
sleep 3
echo -e "${GREEN}✅ 数据库已就绪${NC}\n"

# 设置环境变量
export DATABASE_URL="postgresql://postgres:postgres123@localhost:5434/roomease?schema=public"
export JWT_SECRET="your-super-secret-jwt-key-change-in-production"
export JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
export NODE_ENV="development"
export PORT="4000"
export REDIS_HOST="localhost"
export REDIS_PORT="6380"
export REDIS_PASSWORD="redis123"

# 检查是否需要初始化数据库
if [ "$1" = "--init-db" ]; then
    echo -e "${YELLOW}4. 初始化数据库...${NC}"
    cd packages/database
    pnpm prisma generate
    pnpm prisma db push --force-reset --skip-generate --accept-data-loss
    pnpm db:seed
    cd ../..
    echo -e "${GREEN}✅ 数据库初始化完成${NC}\n"
else
    echo -e "${BLUE}💡 跳过数据库初始化 (使用 --init-db 参数来初始化)${NC}\n"
fi

# 构建后端
echo -e "${YELLOW}5. 构建API服务...${NC}"
cd services/api-gateway
pnpm build
echo -e "${GREEN}✅ API服务构建完成${NC}\n"

# 检查是否有旧进程
OLD_PID=$(ps aux | grep "node dist/main" | grep -v grep | awk '{print $2}')
if [ ! -z "$OLD_PID" ]; then
    echo -e "${YELLOW}6. 停止旧进程 (PID: $OLD_PID)...${NC}"
    kill $OLD_PID
    sleep 2
    echo -e "${GREEN}✅ 旧进程已停止${NC}\n"
fi

# 启动API服务
echo -e "${YELLOW}7. 启动API服务...${NC}"
nohup pnpm run start:prod > /tmp/api-gateway.log 2>&1 &
API_PID=$!
echo -e "${GREEN}✅ API服务已启动 (PID: $API_PID)${NC}\n"

# 等待服务启动
echo -e "${YELLOW}8. 等待服务就绪...${NC}"
sleep 5

# 测试API
echo -e "${YELLOW}9. 测试API连接...${NC}"
if curl -s http://localhost:4000/auth/profile > /dev/null 2>&1 || [ $? -eq 52 ]; then
    echo -e "${GREEN}✅ API服务运行正常${NC}\n"
else
    echo -e "${RED}❌ API服务启动失败，查看日志: tail -f /tmp/api-gateway.log${NC}\n"
    exit 1
fi

# 显示服务信息
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 后端服务启动成功！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📋 服务信息:${NC}"
echo -e "   API地址: ${GREEN}http://localhost:4000${NC}"
echo -e "   API文档: ${GREEN}http://localhost:4000/docs${NC}"
echo -e "   日志文件: ${GREEN}/tmp/api-gateway.log${NC}"
echo ""
echo -e "${YELLOW}👤 测试账号:${NC}"
echo -e "   邮箱: ${GREEN}admin@demo.com${NC}"
echo -e "   密码: ${GREEN}123456${NC}"
echo ""
echo -e "${YELLOW}🛠️  常用命令:${NC}"
echo -e "   查看日志: ${GREEN}tail -f /tmp/api-gateway.log${NC}"
echo -e "   停止服务: ${GREEN}docker compose down${NC}"
echo -e "   重启服务: ${GREEN}./start-backend.sh${NC}"
echo -e "   初始化数据库: ${GREEN}./start-backend.sh --init-db${NC}"
echo ""
echo -e "${YELLOW}🧪 测试API:${NC}"
echo -e "   ${GREEN}cd apps/mobile && node test-api.js${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

