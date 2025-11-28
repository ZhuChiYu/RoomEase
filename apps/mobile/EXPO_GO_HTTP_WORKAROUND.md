# 🎯 Expo Go HTTP 限制完美解决方案

## 📋 问题总结

### 根本原因
**Expo Go 强制要求 HTTPS，不支持自定义原生配置！**

- ❌ Expo Go 默认阻止所有 HTTP 连接
- ❌ `app.json` 中的 `NSAppTransportSecurity` 配置在 Expo Go 中**无效**
- ❌ 需要自定义开发构建才能应用原生配置

### 为什么浏览器可以，但 App 不行？

| 客户端 | HTTP 支持 | 原因 |
|--------|-----------|------|
| 手机浏览器 | ✅ YES | 浏览器允许 HTTP |
| Expo Go | ❌ NO | 强制 HTTPS 安全策略 |
| 自定义构建 | ✅ YES | 可配置原生设置 |

**这就是为什么：**
- ✅ 浏览器能访问 `http://111.230.110.95:8080/health`
- ❌ Expo Go 报错 `ERR_NETWORK`

---

## 🚀 解决方案（3分钟搞定）

### 方案：使用 ngrok 创建 HTTPS 隧道

ngrok 将 HTTP 服务器包装成 HTTPS，绕过 Expo Go 限制。

```
[Expo Go App] --HTTPS✅--> [ngrok.io] --HTTP--> [111.230.110.95:8080]
```

---

## 📝 操作步骤

### 第1步：启动 ngrok 隧道

打开**新的终端窗口**，运行：

```bash
cd apps/mobile
./start-ngrok.sh
```

或者直接：

```bash
ngrok http http://111.230.110.95:8080
```

### 第2步：记下 HTTPS URL

你会看到类似输出：

```
Forwarding    https://abcd-1234-5678.ngrok-free.app -> http://111.230.110.95:8080
              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              ↑ 复制这个 HTTPS 地址！
```

**重要：记下这个 HTTPS URL！**

### 第3步：在 App 中配置

1. 打开 App
2. 进入 **"开发者"** 标签页
3. 确保切换到 **"服务器API模式"**
4. 点击 **"自定义服务器地址"** 按钮（✏️ 图标）
5. 输入 ngrok 生成的 HTTPS URL
   ```
   https://abcd-1234-5678.ngrok-free.app
   ```
6. 点击 **"确定"**

### 第4步：验证连接

App 会自动测试连接，应该看到：

```
✅ 服务器已更新
新地址: https://abcd-1234-5678.ngrok-free.app
✅ 使用 HTTPS 加密连接
```

在"服务器连接状态"卡片中：
- 连接状态: **已连接 ✅**
- 响应时间: **xxx ms**

### 第5步：开始使用！

现在你可以：
- ✅ 正常使用 App 的所有功能
- ✅ 从任何网络访问（不限制 WiFi）
- ✅ 所有 API 请求都会通过 HTTPS

---

## 🎯 完整流程演示

```bash
# 终端1: 启动移动端开发服务器
cd apps/mobile
npm start

# 终端2: 启动 ngrok 隧道
cd apps/mobile
./start-ngrok.sh

# 记下 ngrok 生成的 HTTPS URL
# 例如: https://1234-abcd.ngrok-free.app

# 在手机 App 中:
# 1. 打开"开发者"页面
# 2. 切换到"服务器API模式"
# 3. 点击"自定义服务器地址"
# 4. 输入: https://1234-abcd.ngrok-free.app
# 5. 点击"测试服务器连接"
# 6. ✅ 成功！
```

---

## 💡 控制台日志变化

### 之前（失败）

```
❌ [API ERROR] 网络连接错误 - 无法连接到服务器
   code: "ERR_NETWORK"
   message: "Network Error"
```

### 之后（成功）

```
✅ [API REQUEST] 🚀 GET /health
✅ [API RESPONSE] ✅ GET /health - 200 (123ms)
✅ [API SUCCESS] ✅ 服务器健康检查成功
✅ 服务器连接成功
```

---

## 🔧 高级功能

### 1. 查看请求详情

ngrok 提供 Web 界面查看所有请求：

```
访问: http://127.0.0.1:4040
```

可以看到：
- 所有 HTTP 请求/响应
- 请求耗时
- 请求详情

### 2. 固定域名（付费功能）

免费版每次重启 URL 都会变，付费版可以固定：

```bash
ngrok http http://111.230.110.95:8080 --domain=my-app.ngrok.io
```

### 3. 后台运行 ngrok

```bash
nohup ngrok http http://111.230.110.95:8080 > ngrok.log 2>&1 &

# 查看日志
tail -f ngrok.log

# 查看 ngrok URL
curl http://127.0.0.1:4040/api/tunnels | jq '.tunnels[0].public_url'
```

---

## ⚠️ 注意事项

### ngrok 免费版限制

- ⚠️ 每次重启 URL 都会变
- ⚠️ 有请求数量限制（通常够用）
- ⚠️ 需要保持终端窗口打开

### 如何处理 URL 变化

每次重启 ngrok：
1. 记下新的 HTTPS URL
2. 在 App 中点击"自定义服务器地址"
3. 输入新 URL
4. 完成！

---

## 🎓 其他解决方案对比

| 方案 | 优点 | 缺点 | 耗时 | 推荐度 |
|------|------|------|------|--------|
| **ngrok 隧道** | • 立即可用<br>• 真正 HTTPS<br>• 任何网络 | • URL 会变<br>• 需保持运行 | 3分钟 | ⭐⭐⭐⭐⭐ |
| **服务器 SSL** | • 永久方案<br>• 固定域名 | • 需服务器权限<br>• 配置复杂 | 15-30分钟 | ⭐⭐⭐⭐ |
| **自定义构建** | • 原生支持<br>• 无限制 | • 构建耗时<br>• 需开发环境 | 30-60分钟 | ⭐⭐⭐ |
| **修改 app.json** | • 简单 | • Expo Go 无效❌ | - | ❌ |

---

## 🚀 最佳实践

### 开发阶段
✅ 使用 ngrok（本方案）

### 测试阶段  
✅ 配置服务器 SSL 或自定义构建

### 生产环境
✅ 必须使用服务器 SSL（HTTPS）

---

## 📞 需要帮助？

### 问题1: ngrok 命令未找到

```bash
# macOS
brew install ngrok

# 或下载
# https://ngrok.com/download
```

### 问题2: ngrok 需要认证

```bash
# 注册账号获取 token
# https://dashboard.ngrok.com/signup

ngrok config add-authtoken YOUR_TOKEN
```

### 问题3: 仍然无法连接

1. 检查 ngrok 是否在运行
2. 确认输入的 URL 是 **HTTPS**（不是 HTTP）
3. 测试 ngrok URL 是否可访问：
   ```bash
   curl https://your-url.ngrok-free.app/health
   ```

### 问题4: ngrok 连接慢

免费版可能有延迟，考虑：
- 配置服务器 SSL
- 升级 ngrok 付费版
- 创建自定义开发构建

---

## 🎉 成功标志

完成配置后，你应该看到：

### 在 App 中
- ✅ 连接状态: **已连接**
- ✅ 响应时间显示（如 123ms）
- ✅ 绿色成功提示

### 在控制台中
- ✅ `[API SUCCESS]` 日志
- ✅ `200` 状态码
- ✅ 无 `ERR_NETWORK` 错误

### 在 ngrok Web 界面（http://127.0.0.1:4040）
- ✅ 看到 `/health` 请求
- ✅ 200 响应码

---

**祝你开发顺利！** 🎊

有任何问题随时询问！

