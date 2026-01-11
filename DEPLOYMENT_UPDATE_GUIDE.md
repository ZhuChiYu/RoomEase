# 服务器部署和重启指南

## 🚀 腾讯云服务器重启后端服务

### 方法一：使用 PM2 重启（推荐）

PM2 是 Node.js 应用的进程管理器，可以实现零停机重启。

```bash
# 1. SSH 登录到腾讯云服务器
ssh root@your-server-ip

# 2. 进入项目目录
cd /root/RoomEase

# 3. 拉取最新代码（如果需要）
git pull origin main

# 4. 进入 API Gateway 目录
cd services/api-gateway

# 5. 安装依赖（如果有新的依赖）
npm install

# 6. 编译 TypeScript
npm run build

# 7. 使用 PM2 重启服务
pm2 restart api-gateway

# 8. 查看服务状态
pm2 status

# 9. 查看日志（确认启动成功）
pm2 logs api-gateway --lines 50
```

### 方法二：使用 Docker 重启

如果使用 Docker 部署：

```bash
# 1. SSH 登录到腾讯云服务器
ssh root@your-server-ip

# 2. 进入项目目录
cd /root/RoomEase

# 3. 拉取最新代码
git pull origin main

# 4. 重新构建并启动 API Gateway 容器
docker-compose build api-gateway
docker-compose up -d api-gateway

# 5. 查看容器状态
docker-compose ps

# 6. 查看日志
docker-compose logs -f api-gateway --tail=50
```

### 方法三：使用 systemd 重启

如果使用 systemd 管理服务：

```bash
# 1. SSH 登录到腾讯云服务器
ssh root@your-server-ip

# 2. 重启服务
sudo systemctl restart roomease-api-gateway

# 3. 查看服务状态
sudo systemctl status roomease-api-gateway

# 4. 查看日志
sudo journalctl -u roomease-api-gateway -f
```

## 📋 快速部署脚本

创建一个快速部署脚本 `quick-deploy.sh`：

```bash
#!/bin/bash

echo "🚀 开始部署 RoomEase API Gateway..."

# 进入项目目录
cd /root/RoomEase

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 进入 API Gateway 目录
cd services/api-gateway

# 安装依赖
echo "📦 安装依赖..."
npm install

# 编译代码
echo "🔨 编译 TypeScript..."
npm run build

# 重启服务
echo "🔄 重启服务..."
pm2 restart api-gateway

# 显示状态
echo "✅ 部署完成！"
pm2 status

# 显示日志
echo "📋 最近日志："
pm2 logs api-gateway --lines 20 --nostream
```

使用方法：

```bash
# 1. 上传脚本到服务器
scp quick-deploy.sh root@your-server-ip:/root/

# 2. 添加执行权限
chmod +x /root/quick-deploy.sh

# 3. 运行部署脚本
/root/quick-deploy.sh
```

## 🔍 验证部署

部署完成后，验证服务是否正常运行：

```bash
# 1. 检查端口是否监听
netstat -tlnp | grep 4000

# 2. 测试 API 健康检查
curl http://localhost:4000/health

# 3. 测试从外网访问（替换为你的服务器 IP）
curl http://your-server-ip:4000/health

# 4. 查看 API 文档
# 在浏览器打开: http://your-server-ip:4000/docs
```

## ⚠️ 常见问题排查

### 1. 端口被占用

```bash
# 查找占用 4000 端口的进程
lsof -i:4000

# 杀死进程
kill -9 <PID>
```

### 2. PM2 服务不存在

```bash
# 首次启动服务
cd /root/RoomEase/services/api-gateway
npm run build
pm2 start dist/main.js --name api-gateway

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 3. 编译失败

```bash
# 清理 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install

# 清理构建产物重新编译
rm -rf dist
npm run build
```

### 4. 数据库连接失败

```bash
# 检查数据库服务状态
systemctl status postgresql
# 或
docker ps | grep postgres

# 检查环境变量
cat /root/RoomEase/services/api-gateway/.env

# 测试数据库连接
psql -h localhost -U roomease -d roomease
```

## 📊 监控和日志

### 查看实时日志

```bash
# PM2 日志
pm2 logs api-gateway -f

# Docker 日志
docker-compose logs -f api-gateway

# systemd 日志
journalctl -u roomease-api-gateway -f
```

### 性能监控

```bash
# PM2 监控面板
pm2 monit

# 查看内存和 CPU 使用
pm2 status
```

## 🔄 回滚到上一个版本

如果新版本有问题，可以快速回滚：

```bash
# 1. 查看 git 提交历史
git log --oneline -10

# 2. 回滚到指定版本
git reset --hard <commit-hash>

# 3. 重新部署
cd services/api-gateway
npm install
npm run build
pm2 restart api-gateway
```

## 📝 本次更新内容

### 2025-11-29 更新

1. **refreshToken 有效期延长**
   - 从 7 天延长到 30 天
   - 用户 30 天内无需重新登录

2. **历史账号功能**
   - 登录页面显示历史登录账号
   - 可以快速选择账号，只需输入密码
   - 支持删除历史记录（长按账号）
   - 最多保存 5 个历史账号

3. **中文错误提示**
   - 所有 HTTP 错误统一返回中文
   - 401 错误自动尝试刷新 token

### 修改的文件

**后端：**
- `services/api-gateway/src/modules/auth/auth.service.ts` - refreshToken 有效期改为 30 天

**前端：**
- `apps/mobile/app/services/accountHistoryService.ts` - 新增账号历史管理服务
- `apps/mobile/app/auth/login.tsx` - 登录页面增加历史账号选择
- `apps/mobile/app/services/authService.ts` - 集成账号历史功能
- `apps/mobile/app/services/index.ts` - 导出账号历史服务

## 🎯 完整部署流程

推荐使用以下完整流程进行部署：

```bash
# 1. 连接服务器
ssh root@your-server-ip

# 2. 备份当前版本（可选但推荐）
cd /root
tar -czf roomease-backup-$(date +%Y%m%d-%H%M%S).tar.gz RoomEase

# 3. 更新代码
cd /root/RoomEase
git fetch origin
git pull origin main

# 4. 编译后端
cd services/api-gateway
npm install
npm run build

# 5. 重启服务
pm2 restart api-gateway

# 6. 验证部署
pm2 status
curl http://localhost:4000/health

# 7. 查看日志
pm2 logs api-gateway --lines 50

# 8. 如果一切正常
echo "✅ 部署成功！"
```

## 📱 移动端更新

移动端代码会自动通过 Expo 热更新推送给用户，无需手动操作。

如果需要强制重新加载：

```bash
# 在开发环境
cd /root/RoomEase/apps/mobile
npm install
npx expo start --clear
```

## 🔐 安全提醒

1. 确保 `.env` 文件中的敏感信息（如 JWT_SECRET）已正确配置
2. 定期更新依赖包：`npm audit fix`
3. 监控日志文件大小，定期清理：`pm2 flush`
4. 设置防火墙规则，只开放必要端口

## 💡 提示

- 使用 `screen` 或 `tmux` 可以在断开 SSH 后继续查看日志
- 建议设置钉钉/企业微信告警，监控服务状态
- 定期备份数据库和代码

---

**如有问题，请联系技术支持或查看详细日志排查。**

