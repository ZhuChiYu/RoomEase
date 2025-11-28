# 🔧 HTTP连接问题修复指南

## 问题描述

移动端报错：`ERR_NETWORK - Network Error`，无法连接到服务器 `http://111.230.110.95:8080`

## 根本原因

**iOS 和 Android 默认不允许 HTTP（明文）连接**，只允许 HTTPS 连接。这是为了安全考虑。

## 已完成的修复

我已经修改了 `app.json` 配置文件，允许 HTTP 连接：

### iOS 配置（已添加）
```json
"NSAppTransportSecurity": {
  "NSAllowsArbitraryLoads": true,
  "NSExceptionDomains": {
    "111.230.110.95": {
      "NSExceptionAllowsInsecureHTTPLoads": true
    }
  }
}
```

### Android 配置（已添加）
```json
"usesCleartextTraffic": true
```

## ⚠️ 重要：需要重启应用

**配置修改后必须完全重启应用才能生效！**

### 方法1: 完全重启（推荐）

```bash
cd /Users/zhuchiyu/Documents/projects/RoomEase/apps/mobile

# 1. 停止当前运行的服务器（按 Ctrl+C）

# 2. 清除缓存并重启
npm start -- --clear

# 3. 在真机上：
#    - iOS: 完全关闭 Expo Go，从后台清除
#    - Android: 完全关闭 Expo Go，从后台清除
#    - 重新扫描二维码或重新打开应用
```

### 方法2: 重新加载

在 Expo Go 中：
- **iOS**: 摇动设备 → 点击 "Reload"
- **Android**: 摇动设备 → 点击 "Reload" 或按 `r` 键

### 方法3: 重新构建（如果上述方法无效）

```bash
cd /Users/zhuchiyu/Documents/projects/RoomEase/apps/mobile

# 清除所有缓存
rm -rf node_modules/.cache
rm -rf .expo

# 重启开发服务器
npm start -- --clear
```

## 验证步骤

重启后，在应用中：

1. **打开 "开发者" 标签页**
2. **切换到 "服务器API模式"**（关闭本地存储开关）
3. **查看 "服务器连接状态" 卡片**：
   - 应该显示：`连接状态: 已连接 ✅`
   - 响应时间应该显示（如：`123ms`）

4. **查看控制台日志**，应该看到：
```
LOG  [API RESPONSE ...] ✅ GET /health - 200 (123ms)
LOG  [API SUCCESS ...] ✅ 服务器健康检查成功
LOG  ✅ 服务器连接成功
```

## 当前配置

| 配置项 | 值 |
|--------|-----|
| 默认服务器 | `http://111.230.110.95:8080` |
| 协议 | HTTP（明文，开发环境） |
| 端口 | 8080（Nginx代理） |
| 已验证 | ✅ 从电脑 curl 测试通过 |

## 如果还是不行

### 1. 检查网络连接

```bash
# 在终端测试（应该返回 200 OK）
curl -v http://111.230.110.95:8080/health
```

### 2. 检查真机是否有网络

- 确保手机连接到互联网（WiFi 或移动数据）
- 关闭 VPN
- 尝试在手机浏览器中访问：`http://111.230.110.95:8080/health`

### 3. 切换到本地开发服务器测试

如果你的电脑和手机在同一 WiFi：

1. 在 "开发者" 页面点击 "切换服务器"
2. 选择 "本地开发服务器"
3. 测试连接

### 4. 检查服务器状态

```bash
# SSH 到服务器
ssh root@111.230.110.95

# 检查服务状态
cd /opt/roomease
docker-compose ps

# 查看 Nginx 日志
docker-compose logs -f nginx

# 查看 API Gateway 日志
docker-compose logs -f api-gateway
```

## 生产环境建议

在生产环境中，应该：

1. **配置 SSL 证书**
2. **使用 HTTPS**
3. **移除 `NSAllowsArbitraryLoads` 配置**

```typescript
// 生产配置示例
BASE_URL: 'https://www.englishpartner.cn'
```

## 快速测试命令

```bash
# 测试远程服务器（Nginx）
curl http://111.230.110.95:8080/health

# 测试远程服务器（直连）
curl http://111.230.110.95:4000/health

# 查看完整响应
curl -v http://111.230.110.95:8080/health
```

## 常见错误

| 错误 | 原因 | 解决方法 |
|------|------|---------|
| ERR_NETWORK | HTTP被阻止 | 修改app.json并重启 ✅ |
| Timeout | 服务器未响应 | 检查服务器状态 |
| Connection refused | 端口未开放 | 检查防火墙/安全组 |
| DNS error | 域名解析失败 | 使用IP地址 |

---

**记住：修改 app.json 后必须完全重启应用！** 🔄

