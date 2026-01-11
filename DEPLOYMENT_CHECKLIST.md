# 房间排序和可见性功能 - 完整部署清单

## 📋 准备工作

### 本地准备（开发机器）

- [x] 代码已提交到Git仓库
- [x] 所有功能已测试通过
- [x] 移动端编译无错误
- [x] 后端代码编译无错误

### 服务器信息

- **服务器IP**: 111.230.110.95
- **SSH用户**: root
- **项目路径**: /root/RoomEase
- **部署方式**: Docker Compose
- **数据库**: PostgreSQL (容器内)

---

## 🚀 部署步骤（按顺序执行）

### 1. 连接到服务器

```bash
ssh root@111.230.110.95
```

**检查点**: 能够成功连接到服务器
- [ ] SSH连接成功

### 2. 进入项目目录并拉取代码

```bash
cd /root/RoomEase
git status
git pull origin main
```

**检查点**: 代码已更新到最新版本
- [ ] 代码拉取成功
- [ ] 最新commit包含房间排序功能

### 3. 运行一键部署脚本

```bash
# 添加执行权限
chmod +x deploy-room-sorting-feature.sh

# 执行部署
./deploy-room-sorting-feature.sh
```

**检查点**: 脚本执行成功
- [ ] 数据库备份成功
- [ ] 数据库迁移成功
- [ ] API Gateway重启成功
- [ ] 健康检查通过

### 4. 手动验证（如果自动脚本失败）

#### 4.1 验证数据库

```bash
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d roomease -c "\d rooms"
```

**检查点**: 确认字段存在
- [ ] sortOrder字段存在 (integer, default 0)
- [ ] isVisible字段存在 (boolean, default true)
- [ ] rooms_sortOrder_idx索引存在

#### 4.2 验证API服务

```bash
# 检查容器状态
docker-compose -f docker-compose.production.yml ps api-gateway

# 检查健康状态
curl http://localhost:4000/health

# 查看日志
docker-compose -f docker-compose.production.yml logs --tail=50 api-gateway
```

**检查点**: 服务正常运行
- [ ] 容器状态为 Up
- [ ] 健康检查返回200
- [ ] 日志无ERROR

#### 4.3 测试API端点

```bash
# 测试获取房间（需要先登录获取token）
# 1. 获取token
TOKEN=$(curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"your_password"}' \
  | jq -r '.accessToken')

# 2. 获取房间列表
curl -X GET http://localhost:4000/rooms \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. 测试批量更新（使用实际的房间ID）
curl -X PATCH http://localhost:4000/rooms/batch-order \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"updates":[{"id":"room_id","sortOrder":0}]}'
```

**检查点**: API正常响应
- [ ] 房间列表包含sortOrder和isVisible字段
- [ ] 批量更新接口返回成功

---

## 📱 移动端测试

部署完成后，在移动端进行以下测试：

### 测试清单

#### 修改房型页面

- [ ] 房间列表正常显示
- [ ] 可以左滑房间条目
- [ ] 左滑后显示编辑和删除按钮
- [ ] 点击编辑可以修改房间名称
- [ ] 点击删除可以删除房间
- [ ] 长按拖拽手柄可以调整顺序
- [ ] 可见性开关正常工作
- [ ] 保存后顺序和可见性正确保存

#### 房型房间设置页面

- [ ] 房型列表正常显示
- [ ] 可以拖拽调整房型顺序
- [ ] 顺序在页面刷新后保持

#### 房态日历页面

- [ ] 房间按照设置的顺序显示
- [ ] 隐藏的房间不显示
- [ ] 房型分组按照设置的顺序显示
- [ ] 滚动和交互正常

---

## 🔧 故障排查

### 问题1: 数据库迁移失败

**症状**: 
```
Error: relation "rooms" does not exist
```

**解决方案**:
```bash
# 检查数据库连接
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -l

# 手动执行SQL
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d roomease <<'EOF'
ALTER TABLE "rooms" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "rooms" ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "rooms_sortOrder_idx" ON "rooms"("sortOrder");
EOF
```

### 问题2: API启动失败

**症状**:
```
Cannot find module '@prisma/client'
```

**解决方案**:
```bash
# 重新生成Prisma Client
cd packages/database
npx prisma generate
cd ../..

# 重新构建镜像
docker-compose -f docker-compose.production.yml build api-gateway
docker-compose -f docker-compose.production.yml up -d api-gateway
```

### 问题3: 移动端连接失败

**症状**: 移动端无法获取房间数据

**解决方案**:
```bash
# 1. 检查API是否正常
curl http://111.230.110.95:4000/health

# 2. 检查防火墙
sudo ufw status

# 3. 检查Nginx配置
docker-compose -f docker-compose.production.yml logs nginx

# 4. 确认移动端API配置正确
# apps/mobile/config/prod.ts 中的 baseURL
```

---

## ⏪ 回滚方案

如果部署后发现严重问题，可以快速回滚：

### 方案1: 回滚代码

```bash
# 查看提交历史
git log --oneline -5

# 回滚到上一个版本
git reset --hard <previous_commit>

# 重新构建和部署
docker-compose -f docker-compose.production.yml build api-gateway
docker-compose -f docker-compose.production.yml up -d api-gateway
```

### 方案2: 回滚数据库

```bash
# 使用之前的备份文件
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres roomease < backup-room-sorting-YYYYMMDD-HHMMSS.sql
```

### 方案3: 只删除新字段（保留数据）

```bash
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U postgres -d roomease <<'EOF'
ALTER TABLE "rooms" DROP COLUMN "sortOrder";
ALTER TABLE "rooms" DROP COLUMN "isVisible";
EOF
```

---

## 📊 监控

### 部署后监控（24小时内）

- [ ] 检查CPU使用率（正常应<50%）
- [ ] 检查内存使用（正常应<70%）
- [ ] 检查磁盘空间（应>20%可用）
- [ ] 检查API响应时间（应<500ms）
- [ ] 检查错误日志（应无critical错误）

### 监控命令

```bash
# 查看容器资源使用
docker stats

# 查看API日志
docker-compose -f docker-compose.production.yml logs -f api-gateway

# 查看Grafana监控
# 访问 http://111.230.110.95:3001
```

---

## ✅ 部署完成确认

完成以下所有检查后，部署视为成功：

### 服务器端

- [ ] 数据库迁移成功
- [ ] 新字段已添加（sortOrder, isVisible）
- [ ] API Gateway正常运行
- [ ] 健康检查通过
- [ ] 新API端点可访问
- [ ] 日志无ERROR
- [ ] 备份文件已保存

### 移动端

- [ ] 可以正常连接后端
- [ ] 房间列表正常显示
- [ ] 拖拽排序功能正常
- [ ] 左滑编辑功能正常
- [ ] 可见性控制正常
- [ ] 房态日历显示正确

### 数据验证

- [ ] 现有房间数据未丢失
- [ ] 现有预订数据未丢失
- [ ] 新字段默认值正确

---

## 📞 支持联系

如果遇到无法解决的问题：

1. **查看日志**
   ```bash
   docker-compose -f docker-compose.production.yml logs api-gateway
   docker-compose -f docker-compose.production.yml logs postgres
   ```

2. **查看监控面板**
   - Grafana: http://111.230.110.95:3001

3. **保存现场**
   ```bash
   # 导出日志
   docker-compose -f docker-compose.production.yml logs > deployment-error-$(date +%Y%m%d).log
   
   # 导出数据库状态
   docker-compose -f docker-compose.production.yml exec postgres \
     psql -U postgres -d roomease -c "\d rooms" > db-status.txt
   ```

---

## 📝 部署记录

**部署人员**: ___________________

**部署日期**: 2026-01-11

**部署时间**: ___________________

**服务器**: 111.230.110.95

**代码版本**: ___________________

**备份文件**: ___________________

**部署结果**: 
- [ ] 成功
- [ ] 失败（原因：_________________）
- [ ] 已回滚

**备注**: 
___________________________________________
___________________________________________
___________________________________________

---

**预计部署时间**: 10-15分钟
**建议部署时间**: 非业务高峰期（凌晨2-5点）

