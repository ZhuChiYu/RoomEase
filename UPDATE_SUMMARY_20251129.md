# 功能更新总结 - 2025-11-29

## 📋 更新内容

### 1. ✅ RefreshToken 有效期延长至 30 天

**修改文件：**
- `services/api-gateway/src/modules/auth/auth.service.ts`

**改动：**
```typescript
// 之前：7天
expiresIn: '7d'

// 现在：30天
expiresIn: '30d'
```

**效果：**
- 用户登录后 30 天内无需重新输入密码
- Token 会在 15 分钟过期时自动刷新
- 提升用户体验，减少重复登录

### 2. ✅ 登录页面历史账号功能

**新增文件：**
- `apps/mobile/app/services/accountHistoryService.ts` - 历史账号管理服务

**修改文件：**
- `apps/mobile/app/auth/login.tsx` - 登录页面
- `apps/mobile/app/services/authService.ts` - 认证服务
- `apps/mobile/app/services/index.ts` - 服务导出

**功能特点：**

#### 📱 用户界面
- 登录页面顶部显示历史登录账号（横向滚动）
- 每个账号显示：头像（首字母）、昵称、邮箱、最后登录时间
- 选中账号后自动填充邮箱，只需输入密码
- 支持"使用其他账号"切换回手动输入模式

#### 🗂️ 账号管理
- 自动记录最近 5 个登录账号
- 按最后登录时间倒序排列
- 长按账号可删除历史记录
- 登录成功后自动更新历史记录

#### 🎨 界面设计
- 精美的卡片式设计
- 选中账号高亮显示（紫色边框）
- 圆形头像，显示首字母
- 时间友好显示（今天、昨天、X天前）

### 3. ✅ 服务器部署文档和脚本

**新增文件：**
- `DEPLOYMENT_UPDATE_GUIDE.md` - 完整部署指南
- `quick-deploy-backend.sh` - 快速部署脚本

## 🚀 腾讯云服务器部署命令

### 方法一：使用快速部署脚本（最简单）

```bash
# 1. SSH 登录服务器
ssh root@your-server-ip

# 2. 进入项目目录
cd /root/RoomEase

# 3. 如果是第一次，先上传脚本
# 在本地运行：
scp quick-deploy-backend.sh root@your-server-ip:/root/RoomEase/

# 4. 运行部署脚本
./quick-deploy-backend.sh
```

### 方法二：手动部署（推荐理解流程）

```bash
# 1. SSH 登录服务器
ssh root@your-server-ip

# 2. 进入项目目录
cd /root/RoomEase

# 3. 拉取最新代码
git pull origin main

# 4. 进入 API Gateway 目录
cd services/api-gateway

# 5. 安装依赖
npm install

# 6. 编译 TypeScript
npm run build

# 7. 重启服务（使用 PM2）
pm2 restart api-gateway

# 8. 查看服务状态
pm2 status

# 9. 查看日志（确认启动成功）
pm2 logs api-gateway --lines 50
```

### 方法三：Docker 部署

```bash
# 1. SSH 登录服务器
ssh root@your-server-ip

# 2. 进入项目目录
cd /root/RoomEase

# 3. 拉取最新代码
git pull origin main

# 4. 重新构建并启动
docker-compose build api-gateway
docker-compose up -d api-gateway

# 5. 查看日志
docker-compose logs -f api-gateway --tail=50
```

## 📊 验证部署

部署完成后，运行以下命令验证：

```bash
# 1. 检查服务状态
pm2 status

# 2. 测试健康检查
curl http://localhost:4000/health

# 3. 查看最近日志
pm2 logs api-gateway --lines 30
```

预期结果：
- PM2 状态显示为 `online`
- 健康检查返回 `{"status":"ok"}`
- 日志中没有错误信息

## 🎯 功能测试

### 测试 RefreshToken 30 天有效期

1. 使用移动端 App 登录
2. 检查后端日志，确认生成了 refreshToken
3. 等待 15 分钟后继续使用 App
4. Token 应该自动刷新，用户无感知

### 测试历史账号功能

1. **首次登录**
   - 打开登录页面
   - 输入邮箱和密码登录
   - 登录成功

2. **退出后再次登录**
   - 退出账号
   - 重新打开登录页面
   - 应该看到刚才登录的账号出现在历史列表中

3. **快速登录**
   - 点击历史账号
   - 邮箱自动填充
   - 只需输入密码即可登录

4. **多账号管理**
   - 登录 2-3 个不同账号
   - 历史列表应该显示所有账号
   - 按最后登录时间排序

5. **删除历史**
   - 长按某个历史账号
   - 选择"删除"
   - 该账号从历史列表中移除

## 📁 修改的文件清单

### 后端（需要重新部署）

```
services/api-gateway/src/modules/auth/
├── auth.service.ts                    # 修改：refreshToken 有效期改为 30天
├── strategies/
│   ├── jwt.strategy.ts               # 修改：中文错误提示
│   └── local.strategy.ts             # 修改：中文错误提示
└── common/filters/
    └── http-exception.filter.ts      # 新增：全局中文错误过滤器

services/api-gateway/src/
└── main.ts                            # 修改：应用全局过滤器
```

### 前端（自动热更新）

```
apps/mobile/app/services/
├── accountHistoryService.ts           # 新增：历史账号管理
├── authService.ts                     # 修改：集成历史账号
├── api.ts                            # 修改：完善token刷新
└── index.ts                          # 修改：导出历史服务

apps/mobile/app/auth/
└── login.tsx                          # 修改：历史账号UI
```

### 文档和脚本

```
├── DEPLOYMENT_UPDATE_GUIDE.md         # 新增：部署指南
├── quick-deploy-backend.sh            # 新增：快速部署脚本
└── 401_ERROR_FIX_SUMMARY.md          # 之前的修复总结
```

## ⚠️ 注意事项

1. **后端必须重启**：refreshToken 有效期的修改在后端，必须重启服务才能生效

2. **前端自动更新**：移动端代码会通过 Expo 自动推送更新，用户重启 App 即可

3. **历史账号数据**：保存在用户设备本地，卸载 App 会清除

4. **Token 刷新**：确保后端 `/auth/refresh` 接口正常工作

5. **时区问题**：历史账号时间显示使用设备时区

## 🔄 回滚方案

如果新版本有问题，可以快速回滚：

```bash
# 1. 查看提交历史
git log --oneline -10

# 2. 回滚到上一个版本
git reset --hard HEAD~1

# 3. 重新部署
cd services/api-gateway
npm install
npm run build
pm2 restart api-gateway
```

## 💡 后续优化建议

1. **云端同步历史账号**：将历史账号保存到云端，支持多设备同步
2. **生物识别登录**：Face ID / Touch ID 快速登录
3. **Token 黑名单**：支持强制登出某个设备
4. **设备管理**：查看和管理所有已登录设备
5. **异常登录提醒**：检测异地登录并发送通知

## 📞 技术支持

如遇到问题，请查看：
- 后端日志：`pm2 logs api-gateway`
- 前端日志：App 中的错误提示
- 文档：`DEPLOYMENT_UPDATE_GUIDE.md`

---

**更新日期：** 2025-11-29  
**版本号：** v1.2.0  
**更新人：** AI Assistant (Cursor)

