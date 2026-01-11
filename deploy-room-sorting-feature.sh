#!/bin/bash

# 房间排序和可见性功能 - Docker环境部署脚本
# 服务器: 腾讯云 111.230.110.95
# 部署方式: Docker Compose
# 使用方法: ./deploy-room-sorting-feature.sh

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "======================================"
echo "   房间排序和可见性功能部署脚本"
echo "   服务器: 腾讯云"
echo "   部署方式: Docker Compose"
echo "======================================"
echo -e "${NC}"

# 检查是否在项目根目录
if [ ! -f "docker-compose.production.yml" ]; then
    echo -e "${RED}❌ 错误: 未找到 docker-compose.production.yml${NC}"
    echo "请在项目根目录执行此脚本"
    exit 1
fi

# 步骤1: 备份数据库
echo -e "${YELLOW}步骤 1/8: 备份数据库...${NC}"
BACKUP_FILE="backup-room-sorting-$(date +%Y%m%d-%H%M%S).sql"
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres roomease > "$BACKUP_FILE" || {
    echo -e "${RED}❌ 数据库备份失败${NC}"
    exit 1
}
echo -e "${GREEN}✅ 数据库已备份到: $BACKUP_FILE${NC}"
echo ""

# 步骤2: 检查Docker服务
echo -e "${YELLOW}步骤 2/8: 检查Docker服务状态...${NC}"
if ! docker-compose -f docker-compose.production.yml ps | grep -q "postgres"; then
    echo -e "${RED}❌ PostgreSQL服务未运行${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker服务正常运行${NC}"
echo ""

# 步骤3: 安装依赖并生成Prisma Client
echo -e "${YELLOW}步骤 3/8: 准备数据库迁移...${NC}"
cd packages/database

# 检查pnpm是否安装
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm未安装，尝试使用npm...${NC}"
    npm install
else
    pnpm install
fi

# 生成Prisma Client
npx prisma generate
echo -e "${GREEN}✅ Prisma Client已生成${NC}"
cd ../..
echo ""

# 步骤4: 执行数据库迁移
echo -e "${YELLOW}步骤 4/8: 执行数据库迁移...${NC}"

# 尝试使用Prisma迁移
cd packages/database
if npx prisma migrate deploy 2>/dev/null; then
    echo -e "${GREEN}✅ Prisma迁移执行成功${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma迁移失败，尝试手动执行SQL...${NC}"
    
    # 手动执行SQL
    docker-compose -f ../../docker-compose.production.yml exec -T postgres \
      psql -U postgres -d roomease <<'EOF'
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "rooms_sortOrder_idx" ON "rooms"("sortOrder");
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ SQL迁移执行成功${NC}"
    else
        echo -e "${RED}❌ 数据库迁移失败${NC}"
        exit 1
    fi
fi
cd ../..
echo ""

# 步骤5: 验证数据库更改
echo -e "${YELLOW}步骤 5/8: 验证数据库更改...${NC}"
if docker-compose -f docker-compose.production.yml exec -T postgres \
    psql -U postgres -d roomease -c "\d rooms" | grep -q "sortOrder"; then
    echo -e "${GREEN}✅ sortOrder 字段已添加${NC}"
else
    echo -e "${RED}❌ sortOrder 字段未找到${NC}"
    exit 1
fi

if docker-compose -f docker-compose.production.yml exec -T postgres \
    psql -U postgres -d roomease -c "\d rooms" | grep -q "isVisible"; then
    echo -e "${GREEN}✅ isVisible 字段已添加${NC}"
else
    echo -e "${RED}❌ isVisible 字段未找到${NC}"
    exit 1
fi
echo ""

# 步骤6: 构建新的API Gateway镜像
echo -e "${YELLOW}步骤 6/8: 构建API Gateway镜像...${NC}"
docker-compose -f docker-compose.production.yml build api-gateway
echo -e "${GREEN}✅ API Gateway镜像构建完成${NC}"
echo ""

# 步骤7: 重启API Gateway服务
echo -e "${YELLOW}步骤 7/8: 重启API Gateway服务...${NC}"
docker-compose -f docker-compose.production.yml stop api-gateway
docker-compose -f docker-compose.production.yml up -d api-gateway

# 等待服务启动
echo "等待服务启动..."
for i in {1..10}; do
    if docker-compose -f docker-compose.production.yml exec -T api-gateway curl -s http://localhost:4000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API Gateway服务已启动${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ 服务启动超时${NC}"
        echo "请检查日志: docker-compose -f docker-compose.production.yml logs api-gateway"
        exit 1
    fi
    sleep 2
done
echo ""

# 步骤8: 验证部署
echo -e "${YELLOW}步骤 8/8: 验证部署...${NC}"

# 检查服务健康状态
if curl -s http://localhost:4000/health > /dev/null; then
    echo -e "${GREEN}✅ API健康检查通过${NC}"
else
    echo -e "${RED}❌ API健康检查失败${NC}"
fi

# 查看服务状态
echo ""
echo "服务状态:"
docker-compose -f docker-compose.production.yml ps api-gateway

# 查看最近的日志
echo ""
echo "最近的日志（最后10行）:"
docker-compose -f docker-compose.production.yml logs --tail=10 api-gateway

echo ""
echo -e "${GREEN}======================================"
echo "✅ 部署完成！"
echo "======================================${NC}"
echo ""
echo "部署信息:"
echo "- 数据库备份: $BACKUP_FILE"
echo "- 服务器: 111.230.110.95"
echo "- API端口: 4000"
echo ""
echo "后续步骤:"
echo "1. 查看完整日志: docker-compose -f docker-compose.production.yml logs -f api-gateway"
echo "2. 测试API: curl http://localhost:4000/health"
echo "3. 访问监控面板: http://111.230.110.95:3001"
echo "4. 在移动端测试新功能"
echo ""
echo "如果遇到问题:"
echo "- 查看日志: docker-compose -f docker-compose.production.yml logs api-gateway"
echo "- 回滚数据库: psql < $BACKUP_FILE"
echo "- 回滚代码: git reset --hard HEAD~1"
echo ""
echo -e "${BLUE}提示: 建议在移动端进行完整的功能测试${NC}"
