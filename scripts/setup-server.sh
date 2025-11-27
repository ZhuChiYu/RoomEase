#!/bin/bash

# RoomEase 服务器初始化脚本
# 用于在全新的Ubuntu服务器上配置环境

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

info "=========================================="
info "RoomEase 服务器初始化脚本"
info "=========================================="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    error "请使用root用户运行此脚本"
    exit 1
fi

# 更新系统
step "1. 更新系统包..."
apt update
apt upgrade -y

# 安装基础工具
step "2. 安装基础工具..."
apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    net-tools \
    ca-certificates \
    gnupg \
    lsb-release

# 检查Docker是否已安装
if command -v docker &> /dev/null; then
    info "Docker 已安装，跳过安装步骤"
else
    step "3. 安装 Docker..."
    
    # 添加Docker官方GPG密钥
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # 设置Docker仓库
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # 安装Docker Engine
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # 启动Docker服务
    systemctl start docker
    systemctl enable docker
    
    info "✓ Docker 安装完成"
fi

# 验证Docker Compose
step "4. 验证 Docker Compose..."
if docker compose version &> /dev/null; then
    info "✓ Docker Compose 已安装"
else
    error "Docker Compose 未找到，请检查安装"
    exit 1
fi

# 安装Node.js
step "5. 安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装pnpm
npm install -g pnpm@8.15.0
info "✓ Node.js 和 pnpm 安装完成"

# 配置防火墙
step "6. 配置防火墙..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 4000/tcp  # API (可选)
info "✓ 防火墙配置完成"

# 创建应用目录
step "7. 创建应用目录..."
mkdir -p /opt/roomease
cd /opt/roomease
info "✓ 应用目录已创建: /opt/roomease"

# 配置Docker日志轮转
step "8. 配置 Docker 日志轮转..."
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker
info "✓ Docker 日志轮转配置完成"

# 优化系统参数
step "9. 优化系统参数..."
cat >> /etc/sysctl.conf <<EOF

# RoomEase优化
fs.file-max = 65535
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 2048
vm.swappiness = 10
EOF
sysctl -p
info "✓ 系统参数优化完成"

# 创建交换空间（如果内存较小）
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_MEM" -lt 4096 ]; then
    step "10. 创建交换空间..."
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        info "✓ 2GB 交换空间创建完成"
    else
        info "交换空间已存在"
    fi
fi

# 显示完成信息
echo ""
info "=========================================="
info "✅ 服务器初始化完成！"
info "=========================================="
echo ""
info "系统信息："
info "  OS: $(lsb_release -d | cut -f2)"
info "  Docker: $(docker --version)"
info "  Docker Compose: $(docker compose version)"
info "  Node.js: $(node --version)"
info "  pnpm: $(pnpm --version)"
echo ""
info "下一步："
info "  1. 上传代码到 /opt/roomease"
info "  2. 配置 .env 文件"
info "  3. 运行 ./deploy.sh 部署应用"
echo ""

