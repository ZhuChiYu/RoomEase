# 🔐 服务器 SSL 配置指南

## 📋 配置概览

| 配置项 | 值 |
|--------|-----|
| 服务器 IP | 111.230.110.95 |
| 域名 | www.englishpartner.cn |
| SSL 提供商 | Let's Encrypt（免费） |
| 有效期 | 90天（自动续期） |
| 协议 | HTTPS (443端口) |

---

## 🚀 快速配置（30分钟完成）

### 第1步：SSH 连接到服务器

```bash
ssh root@111.230.110.95
```

### 第2步：安装 Certbot

```bash
# 更新包列表
apt update

# 安装 Certbot
apt install -y certbot

# 验证安装
certbot --version
```

### 第3步：停止当前服务（避免端口冲突）

```bash
cd /opt/roomease

# 查看当前运行的服务
docker-compose ps

# 临时停止 Nginx（需要使用 80 端口申请证书）
docker-compose stop nginx
```

### 第4步：申请 SSL 证书

```bash
# 使用 standalone 模式申请证书
certbot certonly --standalone \
  -d www.englishpartner.cn \
  --email zhu.cy@outlook.com \
  --agree-tos \
  --no-eff-email

# 如果域名还没有解析，会失败
# 需要先在腾讯云域名管理中添加 A 记录：
# www.englishpartner.cn -> 111.230.110.95
```

**重要：如果域名未解析，执行以下操作：**

1. 登录腾讯云控制台
2. 进入域名管理 → DNS 解析
3. 添加 A 记录：
   - 主机记录：`www`
   - 记录类型：`A`
   - 记录值：`111.230.110.95`
   - TTL：`600`

等待 5-10 分钟后重新执行申请命令。

### 第5步：创建 SSL 目录并复制证书

```bash
cd /opt/roomease

# 创建 SSL 目录
mkdir -p nginx/ssl

# 复制证书文件
cp /etc/letsencrypt/live/www.englishpartner.cn/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/www.englishpartner.cn/privkey.pem nginx/ssl/key.pem

# 设置权限
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem

# 验证证书文件
ls -lh nginx/ssl/
```

### 第6步：更新 Nginx 配置

创建新的 Nginx 配置文件支持 HTTPS：

```bash
cd /opt/roomease

# 备份原配置
cp nginx/nginx.conf nginx/nginx.conf.bak

# 创建新配置
cat > nginx/nginx.conf << 'EOF'
# Nginx 配置 - 支持 HTTP 和 HTTPS

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
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    gzip on;

    # HTTP 服务器 - 重定向到 HTTPS
    server {
        listen 80;
        server_name www.englishpartner.cn englishpartner.cn;

        # Let's Encrypt 验证
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # 重定向到 HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS 服务器
    server {
        listen 443 ssl http2;
        server_name www.englishpartner.cn englishpartner.cn;

        # SSL 证书配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # SSL 安全配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # 安全头
        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # 代理到 API Gateway
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
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 健康检查
        location /health {
            proxy_pass http://api-gateway:4000/health;
            access_log off;
        }
    }
}
EOF

# 验证配置文件语法
docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t
```

### 第7步：更新 Docker Compose 配置

```bash
cd /opt/roomease

# 编辑 docker-compose.yml
vim docker-compose.yml

# 找到 nginx 服务配置，确保端口映射正确：
```

修改 `nginx` 服务部分：

```yaml
  nginx:
    image: nginx:alpine
    container_name: roomease-nginx
    restart: unless-stopped
    ports:
      - "80:80"      # HTTP
      - "443:443"    # HTTPS
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro    # 添加 SSL 证书挂载
    depends_on:
      - api-gateway
    networks:
      - roomease-network
```

### 第8步：重启服务

```bash
cd /opt/roomease

# 重启 Nginx
docker-compose up -d nginx

# 查看日志
docker-compose logs -f nginx

# 验证服务状态
docker-compose ps
```

### 第9步：配置防火墙

```bash
# 开放 HTTPS 端口
ufw allow 443/tcp

# 查看防火墙状态
ufw status
```

**腾讯云安全组配置：**

登录腾讯云控制台 → 安全组 → 添加入站规则：

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 443 | 0.0.0.0/0 | HTTPS |
| TCP | 80 | 0.0.0.0/0 | HTTP (重定向) |

### 第10步：测试 HTTPS

```bash
# 测试 HTTPS 连接
curl -I https://www.englishpartner.cn/health

# 应该看到类似输出：
# HTTP/2 200
# server: nginx/...
# content-type: application/json
```

在浏览器中访问：
- https://www.englishpartner.cn/health

应该看到 JSON 响应，并且浏览器地址栏显示 🔒 锁图标。

---

## 🔄 配置自动续期

Let's Encrypt 证书有效期 90 天，需要配置自动续期：

### 方法1：使用 Cron（推荐）

```bash
# 创建续期脚本
cat > /opt/roomease/renew-ssl.sh << 'EOF'
#!/bin/bash

# SSL 证书自动续期脚本

set -e

echo "开始 SSL 证书续期检查..."

# 停止 Nginx（certbot 需要 80 端口）
cd /opt/roomease
docker-compose stop nginx

# 续期证书
certbot renew --quiet

# 复制新证书
if [ -f /etc/letsencrypt/live/www.englishpartner.cn/fullchain.pem ]; then
    cp /etc/letsencrypt/live/www.englishpartner.cn/fullchain.pem /opt/roomease/nginx/ssl/cert.pem
    cp /etc/letsencrypt/live/www.englishpartner.cn/privkey.pem /opt/roomease/nginx/ssl/key.pem
    echo "证书已更新"
fi

# 重启 Nginx
docker-compose up -d nginx

echo "SSL 证书续期完成"
EOF

# 添加执行权限
chmod +x /opt/roomease/renew-ssl.sh

# 添加到 crontab（每天凌晨 3 点检查）
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/roomease/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1") | crontab -

# 查看 crontab
crontab -l
```

### 方法2：测试续期

```bash
# 测试续期（不会真正续期，只是测试）
certbot renew --dry-run
```

---

## 📱 更新移动端配置

### 步骤1：更新环境配置

编辑 `apps/mobile/app/config/environment.ts`：

```typescript
export const API_SERVERS = {
  LOCAL_DEV: 'http://192.168.31.221:4000',
  REMOTE_NGINX: 'https://www.englishpartner.cn',  // ✅ 改为 HTTPS
  REMOTE_DIRECT: 'http://111.230.110.95:4000',
  DOMAIN: 'https://www.englishpartner.cn',         // ✅ 改为 HTTPS
}

export const API_CONFIG = {
  BASE_URL: isDev 
    ? API_SERVERS.REMOTE_NGINX       // ✅ 默认使用 HTTPS
    : API_SERVERS.REMOTE_NGINX,
  
  FALLBACK_URL: API_SERVERS.DOMAIN,
  TIMEOUT: 30000,
  ENABLE_LOGGING: isDev,
  MAX_RETRIES: 3,
}
```

### 步骤2：在 App 中切换服务器

1. 打开 App
2. 进入 **"开发者"** 页面
3. 点击 **"切换服务器"**
4. 选择 **"远程服务器（推荐）"** 或 **"域名（SSL）"**
5. 测试连接 ✅

### 步骤3：验证

应该看到：
```
✅ 连接状态: 已连接
✅ 使用 HTTPS 加密连接
响应时间: xxx ms
```

---

## 🔧 故障排除

### 问题1：证书申请失败

**错误：** `Failed to verify domain`

**原因：** 域名未解析或解析未生效

**解决：**
```bash
# 检查域名解析
nslookup www.englishpartner.cn

# 应该返回 111.230.110.95
```

如果不正确，去腾讯云配置 DNS 解析，等待 5-10 分钟后重试。

---

### 问题2：Nginx 启动失败

**错误：** `nginx: [emerg] cannot load certificate`

**原因：** 证书文件路径或权限问题

**解决：**
```bash
# 检查证书文件
ls -lh /opt/roomease/nginx/ssl/

# 应该看到：
# -rw-r--r-- cert.pem
# -rw------- key.pem

# 如果文件不存在，重新复制
cp /etc/letsencrypt/live/www.englishpartner.cn/fullchain.pem /opt/roomease/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/www.englishpartner.cn/privkey.pem /opt/roomease/nginx/ssl/key.pem
```

---

### 问题3：HTTPS 无法访问

**检查清单：**

```bash
# 1. 检查 Nginx 是否运行
docker-compose ps nginx

# 2. 检查端口监听
netstat -tlnp | grep :443

# 3. 检查防火墙
ufw status

# 4. 检查安全组（腾讯云控制台）
# 确保 443 端口已开放

# 5. 查看 Nginx 日志
docker-compose logs nginx

# 6. 测试本地连接
curl -k https://localhost/health
```

---

### 问题4：浏览器显示证书错误

**原因：** 可能是证书链不完整

**解决：**
```bash
# 使用完整证书链
cp /etc/letsencrypt/live/www.englishpartner.cn/fullchain.pem /opt/roomease/nginx/ssl/cert.pem

# 而不是
# cp /etc/letsencrypt/live/www.englishpartner.cn/cert.pem ...
```

---

## ✅ 验证清单

完成配置后，验证以下项目：

### 服务器端

- [ ] Certbot 已安装
- [ ] SSL 证书已申请
- [ ] 证书文件在 `/opt/roomease/nginx/ssl/`
- [ ] Nginx 配置已更新
- [ ] Nginx 容器正常运行
- [ ] 端口 443 已开放（防火墙+安全组）
- [ ] 自动续期已配置

### 测试

- [ ] `curl https://www.englishpartner.cn/health` 返回 200
- [ ] 浏览器访问显示 🔒 锁图标
- [ ] HTTP 自动重定向到 HTTPS
- [ ] 移动端 App 连接成功

---

## 📊 配置完成后的架构

```
┌─────────────┐
│  移动端 App  │
└──────┬──────┘
       │ HTTPS ✅
       ↓
┌─────────────────────────┐
│  www.englishpartner.cn  │
│  (111.230.110.95:443)   │
└──────┬──────────────────┘
       │
       ↓
┌─────────────┐
│   Nginx     │ (Docker)
│  SSL 终止   │
└──────┬──────┘
       │ HTTP (内网)
       ↓
┌─────────────┐
│ API Gateway │ (Docker)
│   :4000     │
└─────────────┘
```

---

## 🎉 完成

配置完成后：

1. ✅ 移动端可以使用 HTTPS 连接
2. ✅ 数据传输加密
3. ✅ 浏览器显示安全
4. ✅ 符合 App Store 要求
5. ✅ 证书自动续期

---

## 📞 需要帮助？

如果遇到问题：

1. 查看 Nginx 日志：`docker-compose logs nginx`
2. 查看证书状态：`certbot certificates`
3. 测试 SSL：https://www.ssllabs.com/ssltest/

---

**恭喜！SSL 配置完成！** 🎊🔐

