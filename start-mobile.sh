#!/bin/bash

# RoomEase 移动端启动脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📱 RoomEase 移动端启动脚本${NC}\n"

# 检查后端服务
echo -e "${YELLOW}1. 检查后端API服务...${NC}"
if curl -s http://localhost:4000/auth/profile > /dev/null 2>&1 || [ $? -eq 52 ]; then
    echo -e "${GREEN}✅ 后端API运行正常${NC}"
else
    echo -e "${RED}❌ 后端API未运行${NC}"
    echo -e "${YELLOW}💡 请先运行: ./start-backend.sh${NC}"
    exit 1
fi

# 进入移动端目录
cd apps/mobile

echo -e "\n${YELLOW}2. 检查依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    pnpm install
fi
echo -e "${GREEN}✅ 依赖已就绪${NC}"

# 显示配置信息
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📱 移动端配置信息${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "${YELLOW}🔌 后端API:${NC}"
echo -e "   地址: ${GREEN}http://localhost:4000${NC}"
echo -e "   状态: ${GREEN}运行中${NC}"
echo -e ""
echo -e "${YELLOW}👤 测试账号:${NC}"
echo -e "   邮箱: ${GREEN}admin@demo.com${NC}"
echo -e "   密码: ${GREEN}123456${NC}"
echo -e ""
echo -e "${YELLOW}📋 功能开关:${NC}"
echo -e "   后端API: ${GREEN}已启用${NC}"
echo -e "   本地存储: ${YELLOW}备用模式${NC}"
echo -e ""
echo -e "${YELLOW}🛠️  开发工具:${NC}"
echo -e "   日志打印: ${GREEN}已启用${NC}"
echo -e "   API日志: ${GREEN}详细模式${NC}"
echo -e ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "${YELLOW}3. 启动Expo开发服务器...${NC}"
echo -e "${BLUE}💡 提示: 使用Expo Go扫描二维码即可预览${NC}"
echo -e "${BLUE}💡 按 Ctrl+C 停止服务${NC}"
echo -e ""

# 启动Expo
pnpm start

