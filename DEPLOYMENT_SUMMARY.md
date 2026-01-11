# 房间排序和可见性功能 - 部署总结

## 📦 功能概述

本次更新实现了房间排序和可见性控制功能，包括：

✅ **数据库更新**
- 新增 `sortOrder` 字段（房间排序）
- 新增 `isVisible` 字段（房间可见性控制）

✅ **后端API更新**  
- 新增批量更新房间顺序端点
- 现有端点支持新字段

✅ **移动端功能**
- 拖拽排序房间和房型
- 左滑编辑/删除房间
- 房间可见性开关控制
- 房态日历自动排序和过滤

---

## 🚀 部署方法

### 方法一：一键部署（推荐）

```bash
# 1. SSH连接到腾讯云服务器
ssh root@111.230.110.95

# 2. 进入项目目录
cd /root/RoomEase

# 3. 拉取最新代码
git pull origin main

# 4. 运行一键部署脚本
chmod +x deploy-room-sorting-feature.sh
./deploy-room-sorting-feature.sh
```

### 方法二：手动部署

参考文档：`BACKEND_DEPLOYMENT_GUIDE.md`

---

## 📄 部署文档

已创建以下文档帮助您完成部署：

### 1. **BACKEND_DEPLOYMENT_GUIDE.md**
完整的后端部署指南，包括：
- 详细部署步骤
- 数据库迁移说明
- Docker操作命令
- 故障排查方案
- 回滚方案

### 2. **deploy-room-sorting-feature.sh**
一键部署脚本，自动完成：
- ✅ 数据库备份
- ✅ 数据库迁移
- ✅ Prisma Client生成
- ✅ Docker镜像构建
- ✅ 服务重启
- ✅ 部署验证

### 3. **DEPLOYMENT_CHECKLIST.md**
部署清单，包括：
- 详细检查点
- 测试清单
- 故障排查
- 回滚方案
- 监控指标

### 4. **ROOM_SORTING_AND_VISIBILITY_FEATURE.md**
功能详细说明，包括：
- 功能列表
- 实现细节
- 代码结构
- UI/UX设计
- 数据流说明

---

## 🔧 代码更新清单

### 数据库层面

**文件**: `packages/database/prisma/schema.prisma`
```prisma
model Room {
  // ... 其他字段
  sortOrder   Int     @default(0)
  isVisible   Boolean @default(true)
}
```

**迁移文件**: `packages/database/prisma/migrations/20260111_add_room_sort_and_visibility/migration.sql`

### 后端API层面

**更新的文件**:
- `services/api-gateway/src/modules/rooms/dto/create-room.dto.ts`
- `services/api-gateway/src/modules/rooms/dto/batch-update-order.dto.ts` (新增)
- `services/api-gateway/src/modules/rooms/rooms.controller.ts`
- `services/api-gateway/src/modules/rooms/rooms.service.ts`

**新增API端点**:
- `PATCH /api/rooms/batch-order` - 批量更新房间顺序

### 移动端层面

**主要更新的文件**:
- `apps/mobile/app/store/types.ts`
- `apps/mobile/app/store/calendarSlice.ts`
- `apps/mobile/app/edit-room-type.tsx` (完全重写)
- `apps/mobile/app/room-type-settings.tsx` (完全重写)
- `apps/mobile/app/(tabs)/calendar.tsx`

### API Client层面

**更新的文件**:
- `packages/api-client/src/services/rooms.service.ts`

---

## ⚠️ 重要注意事项

### 1. 数据库迁移

- ✅ 向后兼容：新字段有默认值
- ✅ 现有数据不受影响
- ✅ 自动创建索引提升性能

### 2. 服务重启

- ⏱️ 预计停机时间：< 1分钟
- 📊 建议在低峰期部署
- 💾 部署前自动备份数据库

### 3. 移动端兼容性

- ✅ 旧版本移动端仍可正常使用
- ✅ 新功能向后兼容
- 🔄 建议用户更新到最新版本

---

## 📋 部署前检查

在开始部署前，请确认：

- [ ] 已阅读 `BACKEND_DEPLOYMENT_GUIDE.md`
- [ ] 已备份重要数据
- [ ] 已在测试环境验证
- [ ] 已准备回滚方案
- [ ] 已通知相关人员
- [ ] 选择合适的部署时间（建议非高峰期）

---

## 🧪 部署后测试

部署完成后，请进行以下测试：

### 后端测试

```bash
# 1. 健康检查
curl http://111.230.110.95:4000/health

# 2. 获取房间列表（需要token）
curl -H "Authorization: Bearer $TOKEN" \
  http://111.230.110.95:4000/rooms

# 3. 测试批量更新
curl -X PATCH http://111.230.110.95:4000/rooms/batch-order \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"updates":[...]}'
```

### 移动端测试

- [ ] 修改房型页面 - 拖拽排序
- [ ] 修改房型页面 - 左滑编辑
- [ ] 修改房型页面 - 可见性控制
- [ ] 房型设置页面 - 拖拽排序
- [ ] 房态日历 - 排序和过滤

---

## 🆘 遇到问题？

### 查看日志

```bash
# API日志
docker-compose -f docker-compose.production.yml logs -f api-gateway

# 数据库日志
docker-compose -f docker-compose.production.yml logs postgres
```

### 回滚

```bash
# 方法1: 回滚代码
git reset --hard <previous_commit>
docker-compose -f docker-compose.production.yml build api-gateway
docker-compose -f docker-compose.production.yml up -d api-gateway

# 方法2: 恢复数据库
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U postgres roomease < backup-room-sorting-*.sql
```

### 联系支持

1. 查看 `DEPLOYMENT_CHECKLIST.md` 中的故障排查部分
2. 检查监控面板：http://111.230.110.95:3001
3. 保存日志文件以供分析

---

## 📊 部署统计

- **代码变更**: 
  - 新增文件: 2个
  - 修改文件: 8个
  - 数据库迁移: 1个

- **预计时间**: 10-15分钟

- **停机时间**: < 1分钟

- **回滚时间**: < 5分钟

---

## 🎯 下一步

部署完成后：

1. ✅ 在移动端进行完整测试
2. ✅ 监控系统运行状况（24小时）
3. ✅ 收集用户反馈
4. ✅ 考虑后续优化

---

## 📝 版本信息

- **功能版本**: v1.0
- **部署日期**: 2026-01-11
- **服务器**: 腾讯云 111.230.110.95
- **部署方式**: Docker Compose

---

## ✅ 快速命令参考

```bash
# 连接服务器
ssh root@111.230.110.95

# 进入项目
cd /root/RoomEase

# 拉取代码
git pull origin main

# 一键部署
./deploy-room-sorting-feature.sh

# 查看日志
docker-compose -f docker-compose.production.yml logs -f api-gateway

# 查看状态
docker-compose -f docker-compose.production.yml ps

# 重启服务
docker-compose -f docker-compose.production.yml restart api-gateway
```

---

**祝您部署顺利！** 🚀

如有任何问题，请参考相关文档或查看日志文件。

