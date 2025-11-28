# 🚀 HTTPS隧道解决方案（立即可用）

## 问题根源

**Expo Go 不支持自定义原生配置！**

- ❌ `app.json` 中的 `NSAppTransportSecurity` 在 Expo Go 中无效
- ❌ `usesCleartextTraffic` 在 Expo Go 中无效
- ✅ Expo Go 默认只允许 HTTPS 连接

## 解决方案：使用 ngrok 创建 HTTPS 隧道

ngrok 可以将 HTTP 服务器暴露为 HTTPS，绕过 Expo Go 的限制。

---

## 🎯 快速开始（3分钟内解决）

### 步骤1: 启动 ngrok 隧道

在**新的终端窗口**中运行：

```bash
# 创建指向远程服务器的 HTTPS 隧道
ngrok http http://111.230.110.95:8080
```

你会看到类似这样的输出：

```
ngrok                                                                    

Session Status                online
Account                       your-account
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abcd-1234-5678.ngrok-free.app -> http://111.230.110.95:8080

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**重要：记下 `Forwarding` 中的 HTTPS 地址！**
例如：`https://abcd-1234-5678.ngrok-free.app`

### 步骤2: 在App中切换服务器

1. 打开 App 的 **"开发者"** 页面
2. 切换到 **"服务器API模式"**
3. 点击 **"切换服务器"** 按钮
4. 选择 **"域名（SSL）"**

### 步骤3: 手动更新地址

由于 ngrok URL 是临时的，需要在代码中临时更新：

打开 `apps/mobile/app/config/environment.ts`，修改：

```typescript
export const API_SERVERS = {
  // ... 其他配置 ...
  DOMAIN: 'https://YOUR-NGROK-URL.ngrok-free.app',  // 替换为你的 ngrok URL
}
```

或者直接在开发者页面测试时使用。

### 步骤4: 测试连接

在 App 中：
- 点击 **"测试服务器连接"**
- 应该显示 **"已连接 ✅"**

---

## 🔧 方法2：直接在 apiConfigService 添加自定义 URL 功能

让我帮你添加一个输入自定义 URL 的功能。

---

## 📊 ngrok 使用说明

### ngrok 的工作原理

```
[手机 App] --HTTPS--> [ngrok.io] --HTTP--> [你的服务器:8080]
     ✅ 安全连接         🌐 公网             🔓 本地HTTP
```

### ngrok 优点

- ✅ 立即可用，无需重新构建 App
- ✅ 提供真正的 HTTPS 连接
- ✅ 可以从任何地方访问（不限制网络）
- ✅ 自动处理证书

### ngrok 缺点

- ⚠️ 免费版 URL 每次重启都会变化
- ⚠️ 免费版有请求限制
- ⚠️ 需要保持 ngrok 进程运行

### ngrok 高级用法

#### 固定域名（需要付费账户）

```bash
ngrok http http://111.230.110.95:8080 --domain=your-domain.ngrok.io
```

#### 查看请求日志

访问：http://127.0.0.1:4040

在浏览器中可以看到所有通过 ngrok 的请求。

#### 后台运行

```bash
ngrok http http://111.230.110.95:8080 > ngrok.log 2>&1 &
```

---

## 🎯 更好的解决方案：服务器配置 SSL（推荐）

### 在服务器上配置真正的 HTTPS

```bash
# SSH 到服务器
ssh root@111.230.110.95

# 安装 certbot
apt install -y certbot

# 申请免费 SSL 证书
certbot certonly --standalone -d www.englishpartner.cn

# 证书会保存在
# /etc/letsencrypt/live/www.englishpartner.cn/
```

然后修改 nginx 配置启用 HTTPS，App 就可以直接使用：
```typescript
BASE_URL: 'https://www.englishpartner.cn'
```

---

## 🔄 方法3：创建自定义开发构建（最佳但耗时）

如果你需要长期开发，建议创建自定义开发构建：

```bash
cd apps/mobile

# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号
eas login

# 配置项目
eas build:configure

# 创建开发构建
eas build --profile development --platform ios

# 或者本地构建（需要 Xcode）
npx expo run:ios
```

构建完成后，安装到手机，`app.json` 的配置就会生效。

---

## 📝 当前状态总结

| 方法 | 可行性 | 耗时 | 推荐度 |
|------|--------|------|--------|
| ✅ ngrok HTTPS 隧道 | 立即可用 | 3分钟 | ⭐⭐⭐⭐⭐ |
| ✅ 服务器配置 SSL | 需要服务器访问 | 15分钟 | ⭐⭐⭐⭐ |
| ✅ 自定义开发构建 | 需要构建 | 30-60分钟 | ⭐⭐⭐ |
| ❌ 修改 app.json | 在 Expo Go 无效 | - | ❌ |

---

## 🚀 立即执行（推荐）

打开新终端窗口，运行：

```bash
ngrok http http://111.230.110.95:8080
```

然后告诉我生成的 HTTPS URL，我帮你配置到 App 中！

---

## 💡 补充：为什么浏览器可以但 App 不行？

| 客户端 | HTTP 支持 | 原因 |
|--------|-----------|------|
| 手机浏览器 | ✅ | 浏览器允许访问 HTTP |
| Expo Go | ❌ | Expo Go 强制 HTTPS（安全策略）|
| 自定义构建 | ✅ | 可以配置允许 HTTP |

这就是为什么：
- ✅ 浏览器能访问 `http://111.230.110.95:8080/health`
- ❌ Expo Go 不能访问（报 ERR_NETWORK）
- ✅ 使用 ngrok 的 HTTPS 就可以

