# RoomEase - 酒店民宿管理系统

> 现代化的多平台酒店民宿管理解决方案，支持 Web、移动端和微信小程序

**作者**: 朱驰宇 (zhu.cy@outlook.com)  
**版本**: 1.0.0  
**许可证**: MIT

## 🏗️ 技术架构

### 前端技术栈
- **Web端**: Next.js 14 + React 18 + TypeScript + Tailwind CSS + Recharts
- **移动端**: Expo SDK 54 + React Native 0.81 + TypeScript + Redux Toolkit
- **微信小程序**: Taro 4 + React 18 + TypeScript + Sass

### 后端技术栈
- **API网关**: NestJS 10 + GraphQL + REST + WebSocket + JWT认证
- **数据库**: PostgreSQL + Prisma 5.7 ORM
- **缓存**: Redis 4.6
- **消息队列**: RabbitMQ
- **分析数据**: ClickHouse
- **对象存储**: MinIO (S3兼容)

### 项目管理
- **Monorepo**: pnpm 8.15.0 workspaces + Turborepo 1.10.0
- **容器化**: Docker + Docker Compose
- **部署**: Kubernetes + Helm
- **CI/CD**: GitHub Actions
- **监控**: Prometheus + Grafana
- **包管理**: pnpm overrides (React 19.1.0)

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- pnpm 8.15.0
- Docker Desktop (可选)
- Expo CLI (移动端开发)
- Taro CLI (小程序开发)

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd RoomEase
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 环境配置
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等
```

### 4. 启动开发环境

#### 方式一：使用启动脚本（推荐）
```bash
./start-dev.sh
```

#### 方式二：手动启动
```bash
# 生成 Prisma 客户端
cd packages/database && pnpm prisma generate && cd ../..

# 启动 Web 端
cd apps/web && pnpm dev &

# 启动移动端
cd apps/mobile && pnpm start &

# 启动后端 API
cd services/api-gateway && pnpm dev &
```

### 5. 启动 Docker 服务（可选）
```bash
docker compose up -d
```

## 📊 访问地址

### 应用服务
- 🌐 **Web端**: http://localhost:3000
- 📱 **移动端**: http://localhost:8081 (Expo DevTools)
- 📱 **小程序**: 微信开发者工具
- ⚡ **API文档**: http://localhost:3001/api

### 基础服务
- 💾 **MinIO**: http://localhost:9001 (minioadmin/minioadmin123)
- 🐰 **RabbitMQ**: http://localhost:15672 (rabbitmq/rabbitmq123)
- 📊 **Prometheus**: http://localhost:9090
- 📈 **Grafana**: http://localhost:3001 (admin/admin123)

## 🗄️ 数据库

### 初始化数据库
```bash
cd packages/database

# 运行迁移
pnpm prisma migrate dev

# 种子数据
pnpm prisma db seed
```

### 数据库管理
```bash
# 查看数据库
pnpm prisma studio

# 重置数据库
pnpm prisma migrate reset

# 生成客户端
pnpm prisma generate
```

## 📦 项目结构

```
RoomEase/
├── apps/                    # 应用
│   ├── web/                # Next.js Web端
│   ├── mobile/             # Expo 移动端
│   └── miniprogram/        # Taro 微信小程序
├── packages/               # 共享包
│   ├── shared/             # 共享类型和工具
│   ├── database/           # 数据库层 (Prisma)
│   ├── ui/                 # UI组件库
│   └── api-client/         # API客户端
├── services/               # 后端服务
│   └── api-gateway/        # NestJS API网关
├── helm/                   # Kubernetes部署
├── monitoring/             # 监控配置
├── scripts/                # 数据库初始化脚本
├── docker-compose.yml      # 本地开发环境
└── start-dev.sh           # 开发环境启动脚本
```

## 🛠️ 开发指南

### 添加新功能
1. 在 `packages/shared` 中定义类型
2. 在 `packages/database` 中更新数据模型
3. 在 `services/api-gateway` 中实现 API
4. 在各端应用中实现 UI

### 代码规范
```bash
# 检查代码风格
pnpm lint

# 类型检查
pnpm type-check

# 构建项目
pnpm build
```

### 测试
```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm --filter @roomease/web test
```

## 🚢 部署

### Docker 部署
```bash
# 构建镜像
docker compose build

# 生产环境启动
docker compose -f docker-compose.prod.yml up -d
```

### Kubernetes 部署
```bash
# 安装 Helm Chart
helm install roomease ./helm/roomease

# 更新部署
helm upgrade roomease ./helm/roomease
```

## 📱 平台特色

### Web 端
- 📊 实时数据仪表盘
- 📅 可视化房态日历
- 📋 预订管理系统
- 💰 收入分析报表

### 移动端
- 📱 原生移动体验 (Expo SDK 54)
- 🔔 推送通知 (Expo Notifications)
- 📷 拍照功能 (Expo Camera)
- 📍 离线支持 (AsyncStorage)
- 📊 数据可视化 (React Native Chart Kit)
- 🔄 状态管理 (Redux Toolkit)

### 微信小程序
- 🔐 微信授权登录
- 💰 微信支付集成
- 🔔 消息订阅
- 📤 分享功能
- 🎨 现代化UI (Taro 4 + Sass)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持

如果遇到问题或需要帮助：

1. 查看 [Issues](../../issues)
2. 创建新的 Issue
3. 联系开发团队

---

**作者**: 朱驰宇 (zhu.cy@outlook.com)  
**RoomEase Team** - 让酒店管理更简单！ 🏨✨ 