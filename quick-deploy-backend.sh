#!/bin/bash
#
# RoomEase API Gateway 快速部署脚本
# 使用方法: ./quick-deploy-backend.sh
#

set -e  # 遇到错误立即退出

echo "🚀 开始部署 RoomEase API Gateway..."
echo "=================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -d "services/api-gateway" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 1. 拉取最新代码
echo -e "${YELLOW}📥 拉取最新代码...${NC}"
git pull origin main || {
    echo -e "${RED}❌ Git pull 失败${NC}"
    exit 1
}

# 2. 进入 API Gateway 目录
cd services/api-gateway

# 3. 安装依赖
echo -e "${YELLOW}📦 安装依赖...${NC}"
npm install || {
    echo -e "${RED}❌ npm install 失败${NC}"
    exit 1
}

# 4. 编译 TypeScript
echo -e "${YELLOW}🔨 编译 TypeScript...${NC}"
npm run build || {
    echo -e "${RED}❌ 编译失败${NC}"
    exit 1
}

# 5. 重启服务
echo -e "${YELLOW}🔄 重启服务...${NC}"
pm2 restart api-gateway || {
    echo -e "${YELLOW}⚠️  服务不存在，尝试首次启动...${NC}"
    pm2 start dist/main.js --name api-gateway
    pm2 save
}

# 6. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 3

# 7. 检查服务状态
echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "服务状态："
pm2 status

# 8. 测试健康检查
echo ""
echo -e "${YELLOW}🏥 测试健康检查...${NC}"
if curl -s http://localhost:4000/health > /dev/null; then
    echo -e "${GREEN}✅ 健康检查通过${NC}"
else
    echo -e "${RED}❌ 健康检查失败，请查看日志${NC}"
fi

# 9. 显示最近日志
echo ""
echo "最近 30 行日志："
echo "=================================="
pm2 logs api-gateway --lines 30 --nostream

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "常用命令："
echo "  查看日志: pm2 logs api-gateway"
echo "  查看状态: pm2 status"
echo "  重启服务: pm2 restart api-gateway"
echo "  停止服务: pm2 stop api-gateway"
echo ""

