#!/bin/bash

# RoomEase 后端部署脚本
# 用于在腾讯云服务器上部署 RoomEase 后端服务

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印信息
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查 Docker 是否安装
check_docker() {
    info "检查 Docker 环境..."
    if ! command_exists docker; then
        error "Docker 未安装！"
        error "请先安装 Docker: https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        error "Docker Compose 未安装！"
        error "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    info "✓ Docker 环境检查通过"
}

# 检查环境变量配置
check_env() {
    info "检查环境变量配置..."
    if [ ! -f .env ]; then
        warning ".env 文件不存在，从模板创建..."
        if [ -f .env.production ]; then
            cp .env.production .env
            info "✓ 已创建 .env 文件，请编辑配置"
            warning "请修改 .env 文件中的配置，特别是："
            warning "  - JWT_SECRET"
            warning "  - JWT_REFRESH_SECRET"
            warning "  - 数据库密码"
            warning "  - 腾讯云相关配置"
            read -p "配置完成后按回车继续..."
        else
            error ".env.production 模板文件不存在！"
            exit 1
        fi
    fi
    info "✓ 环境变量配置检查通过"
}

# 创建必要的目录
create_directories() {
    info "创建必要的目录..."
    mkdir -p nginx/ssl
    mkdir -p monitoring
    info "✓ 目录创建完成"
}

# 停止旧容器
stop_old_containers() {
    info "停止旧容器..."
    docker-compose -f docker-compose.production.yml down || true
    info "✓ 旧容器已停止"
}

# 构建镜像
build_images() {
    info "构建 Docker 镜像..."
    info "这可能需要几分钟时间..."
    docker-compose -f docker-compose.production.yml build --no-cache
    info "✓ 镜像构建完成"
}

# 启动数据库服务
start_database() {
    info "启动数据库服务..."
    docker-compose -f docker-compose.production.yml up -d postgres redis clickhouse rabbitmq minio
    info "等待数据库服务启动..."
    sleep 15
    info "✓ 数据库服务启动完成"
}

# 运行数据库迁移
run_migrations() {
    info "运行数据库迁移..."
    
    # 检查是否需要初始化数据库
    if docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres -d roomease -c "SELECT 1 FROM pg_tables WHERE tablename='User'" >/dev/null 2>&1; then
        info "数据库已存在，跳过初始化"
    else
        info "初始化数据库..."
        # 这里需要在容器外运行 prisma migrate，因为 api-gateway 还没启动
        warning "请确保已安装 pnpm 和相关依赖"
        cd packages/database
        pnpm prisma migrate deploy
        cd ../..
        info "✓ 数据库迁移完成"
    fi
}

# 启动所有服务
start_all_services() {
    info "启动所有服务..."
    docker-compose -f docker-compose.production.yml up -d
    info "✓ 所有服务启动完成"
}

# 检查服务健康状态
check_health() {
    info "检查服务健康状态..."
    sleep 10
    
    # 检查 API Gateway
    if curl -f http://localhost:4000/health >/dev/null 2>&1; then
        info "✓ API Gateway 健康检查通过"
    else
        warning "API Gateway 健康检查失败，请查看日志"
    fi
    
    # 检查 Nginx
    if curl -f http://localhost/health >/dev/null 2>&1; then
        info "✓ Nginx 健康检查通过"
    else
        warning "Nginx 健康检查失败，请查看日志"
    fi
}

# 显示服务状态
show_status() {
    info "服务状态："
    docker-compose -f docker-compose.production.yml ps
}

# 显示访问信息
show_access_info() {
    echo ""
    info "=========================================="
    info "🎉 部署完成！"
    info "=========================================="
    echo ""
    info "📝 API 文档: http://localhost/docs"
    info "📊 Grafana: http://localhost:3001 (admin/admin123)"
    info "📈 Prometheus: http://localhost:9090"
    info "📦 MinIO: http://localhost:9001 (minioadmin/minioadmin123)"
    info "🐰 RabbitMQ: http://localhost:15672 (rabbitmq/rabbitmq123)"
    echo ""
    info "查看日志："
    info "  docker-compose -f docker-compose.production.yml logs -f"
    echo ""
    info "停止服务："
    info "  docker-compose -f docker-compose.production.yml down"
    echo ""
    info "重启服务："
    info "  docker-compose -f docker-compose.production.yml restart"
    echo ""
}

# 主流程
main() {
    info "=========================================="
    info "RoomEase 后端部署脚本"
    info "=========================================="
    echo ""
    
    check_docker
    check_env
    create_directories
    stop_old_containers
    build_images
    start_database
    # run_migrations  # 根据实际情况决定是否需要
    start_all_services
    check_health
    show_status
    show_access_info
}

# 运行主流程
main

