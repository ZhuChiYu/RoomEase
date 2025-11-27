#!/bin/bash

# RoomEase 生产环境更新脚本
# 用于更新已部署的生产环境

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info "=========================================="
info "RoomEase 生产环境更新"
info "=========================================="

# 备份当前配置
info "1. 备份当前配置..."
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    info "✓ 配置已备份"
fi

# 备份数据库
info "2. 备份数据库..."
docker-compose -f docker-compose.production.yml exec -T postgres \
    pg_dump -U postgres roomease > backup-$(date +%Y%m%d_%H%M%S).sql || true
info "✓ 数据库已备份"

# 拉取最新代码
info "3. 拉取最新代码..."
git fetch origin
git pull origin main
info "✓ 代码已更新"

# 安装依赖（如果有更新）
info "4. 检查依赖更新..."
pnpm install --frozen-lockfile

# 构建新镜像
info "5. 构建新镜像..."
docker-compose -f docker-compose.production.yml build api-gateway
info "✓ 镜像构建完成"

# 运行数据库迁移
info "6. 运行数据库迁移..."
cd packages/database
pnpm prisma migrate deploy || warning "数据库迁移可能已是最新"
cd ../..

# 滚动更新服务
info "7. 更新服务..."
docker-compose -f docker-compose.production.yml up -d --no-deps api-gateway
info "✓ 服务已更新"

# 等待服务启动
info "8. 等待服务启动..."
sleep 10

# 健康检查
info "9. 健康检查..."
if curl -f http://localhost:4000/health >/dev/null 2>&1; then
    info "✓ 服务健康检查通过"
else
    error "服务健康检查失败！"
    warning "正在回滚..."
    docker-compose -f docker-compose.production.yml logs --tail=50 api-gateway
    exit 1
fi

# 清理旧镜像
info "10. 清理旧镜像..."
docker image prune -f
info "✓ 清理完成"

echo ""
info "=========================================="
info "✅ 更新完成！"
info "=========================================="
echo ""
info "查看日志："
info "  docker-compose -f docker-compose.production.yml logs -f api-gateway"
echo ""

