#!/bin/bash

# SSL 自动配置脚本
# 用于在腾讯云服务器上配置 Let's Encrypt SSL 证书

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🔐 RoomEase SSL 自动配置脚本                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 配置变量
DOMAIN="www.englishpartner.cn"
EMAIL="zhu.cy@outlook.com"
PROJECT_DIR="/opt/roomease"

echo -e "${BLUE}配置信息:${NC}"
echo -e "  域名: ${YELLOW}${DOMAIN}${NC}"
echo -e "  邮箱: ${YELLOW}${EMAIL}${NC}"
echo -e "  项目目录: ${YELLOW}${PROJECT_DIR}${NC}"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ 请使用 root 用户运行此脚本${NC}"
  echo "   sudo bash setup-ssl.sh"
  exit 1
fi

echo -e "${GREEN}✓ Root 权限确认${NC}"

# 检查域名解析
echo ""
echo -e "${BLUE}[1/8] 检查域名解析...${NC}"
RESOLVED_IP=$(dig +short ${DOMAIN} | head -n1)
SERVER_IP=$(curl -s https://api.ipify.org)

if [ -z "$RESOLVED_IP" ]; then
    echo -e "${RED}❌ 域名未解析${NC}"
    echo ""
    echo -e "${YELLOW}请先配置 DNS 解析:${NC}"
    echo "  1. 登录腾讯云控制台"
    echo "  2. 进入域名管理 → DNS 解析"
    echo "  3. 添加 A 记录："
    echo "     - 主机记录: www"
    echo "     - 记录类型: A"
    echo "     - 记录值: ${SERVER_IP}"
    echo "     - TTL: 600"
    echo ""
    echo "等待 5-10 分钟后重新运行此脚本"
    exit 1
fi

echo -e "  域名解析到: ${CYAN}${RESOLVED_IP}${NC}"
echo -e "  服务器 IP: ${CYAN}${SERVER_IP}${NC}"

if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}⚠️  域名解析的 IP 与服务器 IP 不匹配${NC}"
    echo -e "${YELLOW}   继续配置可能会失败${NC}"
    read -p "是否继续? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ 域名解析正确${NC}"
fi

# 安装 Certbot
echo ""
echo -e "${BLUE}[2/8] 安装 Certbot...${NC}"
if command -v certbot &> /dev/null; then
    echo -e "${GREEN}✓ Certbot 已安装${NC}"
else
    echo -e "${YELLOW}安装 Certbot...${NC}"
    apt update -qq
    apt install -y certbot > /dev/null 2>&1
    echo -e "${GREEN}✓ Certbot 安装完成${NC}"
fi

# 停止 Nginx
echo ""
echo -e "${BLUE}[3/8] 停止 Nginx 服务...${NC}"
cd ${PROJECT_DIR}
if docker-compose ps nginx | grep -q "Up"; then
    docker-compose stop nginx
    echo -e "${GREEN}✓ Nginx 已停止${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx 未运行${NC}"
fi

# 申请 SSL 证书
echo ""
echo -e "${BLUE}[4/8] 申请 SSL 证书...${NC}"
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    echo -e "${YELLOW}⚠️  证书已存在，跳过申请${NC}"
else
    certbot certonly --standalone \
      -d ${DOMAIN} \
      --email ${EMAIL} \
      --agree-tos \
      --no-eff-email \
      --non-interactive
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ SSL 证书申请成功${NC}"
    else
        echo -e "${RED}❌ SSL 证书申请失败${NC}"
        docker-compose start nginx
        exit 1
    fi
fi

# 创建 SSL 目录
echo ""
echo -e "${BLUE}[5/8] 配置 SSL 证书...${NC}"
mkdir -p ${PROJECT_DIR}/nginx/ssl

# 复制证书
cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ${PROJECT_DIR}/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ${PROJECT_DIR}/nginx/ssl/key.pem

# 设置权限
chmod 644 ${PROJECT_DIR}/nginx/ssl/cert.pem
chmod 600 ${PROJECT_DIR}/nginx/ssl/key.pem

echo -e "${GREEN}✓ 证书文件已复制${NC}"
ls -lh ${PROJECT_DIR}/nginx/ssl/

# 更新 Nginx 配置
echo ""
echo -e "${BLUE}[6/8] 更新 Nginx 配置...${NC}"

# 备份原配置
if [ -f "${PROJECT_DIR}/nginx/nginx.conf" ]; then
    cp ${PROJECT_DIR}/nginx/nginx.conf ${PROJECT_DIR}/nginx/nginx.conf.bak.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓ 原配置已备份${NC}"
fi

# 创建新配置（支持 HTTPS）
cat > ${PROJECT_DIR}/nginx/nginx.conf << 'EOFNGINX'
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    gzip on;

    # HTTP 服务器 - 重定向到 HTTPS
    server {
        listen 80;
        server_name www.englishpartner.cn englishpartner.cn;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS 服务器
    server {
        listen 443 ssl http2;
        server_name www.englishpartner.cn englishpartner.cn;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        add_header Strict-Transport-Security "max-age=31536000" always;

        location / {
            proxy_pass http://api-gateway:4000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /health {
            proxy_pass http://api-gateway:4000/health;
            access_log off;
        }
    }
}
EOFNGINX

echo -e "${GREEN}✓ Nginx 配置已更新${NC}"

# 配置自动续期
echo ""
echo -e "${BLUE}[7/8] 配置证书自动续期...${NC}"

cat > ${PROJECT_DIR}/renew-ssl.sh << 'EOFRENEW'
#!/bin/bash
set -e
echo "开始 SSL 证书续期检查..."
cd /opt/roomease
docker-compose stop nginx
certbot renew --quiet
if [ -f /etc/letsencrypt/live/www.englishpartner.cn/fullchain.pem ]; then
    cp /etc/letsencrypt/live/www.englishpartner.cn/fullchain.pem /opt/roomease/nginx/ssl/cert.pem
    cp /etc/letsencrypt/live/www.englishpartner.cn/privkey.pem /opt/roomease/nginx/ssl/key.pem
    echo "证书已更新"
fi
docker-compose up -d nginx
echo "SSL 证书续期完成"
EOFRENEW

chmod +x ${PROJECT_DIR}/renew-ssl.sh

# 添加到 crontab
(crontab -l 2>/dev/null | grep -v "renew-ssl.sh"; echo "0 3 * * * ${PROJECT_DIR}/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1") | crontab -

echo -e "${GREEN}✓ 自动续期已配置（每天凌晨 3 点）${NC}"

# 启动 Nginx
echo ""
echo -e "${BLUE}[8/8] 启动服务...${NC}"
cd ${PROJECT_DIR}
docker-compose up -d nginx

# 等待服务启动
sleep 3

# 验证服务
if docker-compose ps nginx | grep -q "Up"; then
    echo -e "${GREEN}✓ Nginx 已启动${NC}"
else
    echo -e "${RED}❌ Nginx 启动失败${NC}"
    docker-compose logs nginx
    exit 1
fi

# 测试 HTTPS
echo ""
echo -e "${BLUE}测试 HTTPS 连接...${NC}"
if curl -sk https://${DOMAIN}/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ HTTPS 连接成功${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS 连接测试失败，但服务可能正常${NC}"
fi

# 完成
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🎉 SSL 配置完成！                                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ 配置成功！${NC}"
echo ""
echo -e "${CYAN}访问地址:${NC}"
echo -e "  HTTPS: ${YELLOW}https://${DOMAIN}/health${NC}"
echo -e "  HTTP:  ${YELLOW}http://${DOMAIN}${NC} (自动重定向到 HTTPS)"
echo ""
echo -e "${CYAN}证书信息:${NC}"
certbot certificates
echo ""
echo -e "${CYAN}下一步:${NC}"
echo "  1. 在浏览器中访问: https://${DOMAIN}/health"
echo "  2. 确认浏览器显示 🔒 锁图标"
echo "  3. 更新移动端配置为: https://${DOMAIN}"
echo "  4. 在 App 中测试连接"
echo ""
echo -e "${YELLOW}注意:${NC} 证书有效期 90 天，已配置自动续期"
echo ""

