# 部署修改密码功能到服务器

## 问题
前端调用 `/auth/change-password` 端点时返回 404 错误，说明后端服务器还没有部署包含此端点的最新代码。

## 解决方案
在腾讯云服务器上更新并重新部署后端服务。

## 部署步骤

### 1. 连接到服务器
```bash
ssh root@111.230.110.95
```

### 2. 进入项目目录
```bash
cd /opt/RoomEase
```

### 3. 拉取最新代码
```bash
git pull origin main
```

### 4. 重新构建并启动 API Gateway
```bash
# 停止现有服务
docker-compose stop api-gateway

# 重新构建（确保包含最新代码）
docker-compose build --no-cache api-gateway

# 启动服务
docker-compose up -d api-gateway
```

### 5. 验证服务是否正常启动
```bash
# 查看容器状态
docker-compose ps

# 查看最新日志
docker-compose logs api-gateway --tail=50

# 检查是否有错误
docker-compose logs api-gateway --tail=50 | grep -i error
```

### 6. 测试端点是否可用
```bash
# 在服务器上测试（需要先登录获取 token）
curl -X POST http://localhost:4000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"oldPassword": "test123", "newPassword": "test456"}'
```

## 验证

部署完成后，在移动端App中：
1. 打开个人中心
2. 点击"修改密码"
3. 输入当前密码和新密码
4. 保存

预期结果：
- 不再出现 404 错误
- 密码修改成功后显示成功提示
- 自动登出，需要用新密码重新登录

## 相关文件

### 后端
- `services/api-gateway/src/modules/auth/auth.controller.ts` (第69-83行)
- `services/api-gateway/src/modules/auth/auth.service.ts` (第212-241行)
- `services/api-gateway/src/modules/auth/dto/change-password.dto.ts`

### 前端
- `apps/mobile/app/(tabs)/profile.tsx` (修改密码UI和逻辑)
- `apps/mobile/app/services/api.ts` (API调用)

## 快速部署命令（一键执行）

如果你想一次性执行所有命令，可以使用：

```bash
cd /opt/RoomEase && \
git pull origin main && \
docker-compose stop api-gateway && \
docker-compose build --no-cache api-gateway && \
docker-compose up -d api-gateway && \
echo "等待服务启动..." && \
sleep 5 && \
docker-compose logs api-gateway --tail=30
```

## 注意事项

1. **确保 Git 仓库是最新的**：在本地执行 `git push` 确保所有更改都已推送到远程仓库
2. **重新构建很重要**：必须使用 `--no-cache` 确保 Docker 使用最新代码
3. **检查日志**：部署后务必检查日志，确保没有错误
4. **测试功能**：部署后立即在App中测试修改密码功能

---

**部署日期**: 2025-11-29  
**功能**: 添加用户修改密码功能  
**相关提交**: d0479d1 (fix: 修复修改密码API调用错误)






