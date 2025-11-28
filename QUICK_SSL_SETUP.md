# 🚀 SSL 快速配置（5分钟）

## 📋 前提条件

- [ ] 服务器 IP: `111.230.110.95`
- [ ] 域名: `www.englishpartner.cn`
- [ ] 域名已解析到服务器 IP
- [ ] 服务器已部署 RoomEase

---

## 🎯 方法1：自动配置（推荐）⭐

### 步骤1：上传脚本到服务器

从本地电脑执行：

```bash
# 上传 SSL 配置脚本
scp scripts/setup-ssl.sh root@111.230.110.95:/tmp/

# SSH 到服务器
ssh root@111.230.110.95
```

### 步骤2：运行自动配置脚本

在服务器上执行：

```bash
# 进入临时目录
cd /tmp

# 添加执行权限
chmod +x setup-ssl.sh

# 运行脚本
bash setup-ssl.sh
```

脚本会自动：
- ✅ 检查域名解析
- ✅ 安装 Certbot
- ✅ 申请 SSL 证书
- ✅ 配置 Nginx HTTPS
- ✅ 设置自动续期
- ✅ 启动服务

### 步骤3：验证

浏览器访问：
```
https://www.englishpartner.cn/health
```

应该看到 JSON 响应和 🔒 锁图标。

---

## 🎯 方法2：手动配置

如果自动脚本失败，按照详细指南操作：

查看完整文档：`SSL_SETUP_GUIDE.md`

---

## 📱 更新移动端配置

### 在本地电脑上：

编辑 `apps/mobile/app/config/environment.ts`：

```typescript
export const API_SERVERS = {
  REMOTE_NGINX: 'https://www.englishpartner.cn',  // ✅ 改为 HTTPS
  DOMAIN: 'https://www.englishpartner.cn',         // ✅ 改为 HTTPS
  // ...其他配置
}
```

### 在移动端 App 中：

1. 打开 "开发者" 页面
2. 点击 "切换服务器"
3. 选择 "域名（SSL）"
4. 或点击 "自定义服务器地址"
5. 输入：`https://www.englishpartner.cn`
6. 测试连接 ✅

---

## ✅ 验证清单

完成后验证：

- [ ] `curl https://www.englishpartner.cn/health` 返回 200
- [ ] 浏览器显示 🔒 锁图标
- [ ] HTTP 自动重定向到 HTTPS
- [ ] 移动端 App 连接成功（不再需要 ngrok）

---

## 🔧 如果遇到问题

### 问题1：域名未解析

```bash
# 检查域名解析
nslookup www.englishpartner.cn

# 应该返回：111.230.110.95
```

如果不正确，登录腾讯云配置 DNS，等待 5-10 分钟。

### 问题2：证书申请失败

```bash
# 查看详细错误
certbot certonly --standalone -d www.englishpartner.cn \
  --email zhu.cy@outlook.com --dry-run

# 常见原因：
# 1. 域名未解析
# 2. 端口 80 被占用
# 3. 防火墙阻止
```

### 问题3：Nginx 无法启动

```bash
# 查看日志
cd /opt/roomease
docker-compose logs nginx

# 常见原因：
# 1. 证书文件路径错误
# 2. 配置文件语法错误
```

---

## 📞 完整文档

- **详细指南**: `SSL_SETUP_GUIDE.md`
- **自动脚本**: `scripts/setup-ssl.sh`

---

## 🎉 完成后的好处

- ✅ 不再需要 ngrok
- ✅ 固定的 HTTPS 地址
- ✅ 数据加密传输
- ✅ 浏览器信任
- ✅ 符合 App Store 要求
- ✅ 专业可靠

---

**立即开始配置吧！** 🚀

