# RoomEase 开发指南

## 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0  
- **Docker**: >= 20.0.0
- **Docker Compose**: >= 2.0.0

### 本地开发环境设置

1. **克隆项目**
```bash
git clone https://github.com/roomease/roomease.git
cd roomease
```

2. **安装依赖**
```bash
pnpm install
```

3. **启动基础设施服务**
```bash
pnpm docker:up
```

4. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，设置必要的环境变量
```

5. **数据库初始化**
```bash
pnpm db:migrate
pnpm db:seed
```

6. **启动开发服务**
```bash
# 启动所有服务
pnpm dev

# 或者单独启动服务
pnpm --filter @roomease/web dev
pnpm --filter @roomease/api-gateway dev
```

### 项目结构

```
RoomEase/
├── apps/                    # 前端应用
│   ├── web/                # Web 应用 (Next.js)
│   ├── mobile/             # 移动端应用 (Expo)
│   └── miniprogram/        # 微信小程序 (Taro)
├── services/               # 后端微服务
│   ├── api-gateway/        # API 网关 (NestJS)
│   ├── reservation/        # 预订服务
│   ├── room/              # 房间服务
│   ├── pricing/           # 价格服务
│   ├── id-recognition/    # OCR 服务
│   ├── notification/      # 通知服务
│   ├── billing/           # 计费服务
│   ├── analytics/         # 分析服务
│   └── channel-sync/      # 渠道同步服务
├── packages/              # 共享包
│   ├── database/          # 数据库 Schema
│   ├── shared/            # 共享工具库
│   ├── api-client/        # API 客户端
│   └── ui/                # UI 组件库
├── docs/                  # 文档
├── helm/                  # Kubernetes 部署配置
└── scripts/               # 构建和部署脚本
```

## 开发工作流

### 分支策略

- `main`: 生产环境分支
- `develop`: 开发环境分支
- `feature/*`: 功能开发分支
- `hotfix/*`: 紧急修复分支

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 新功能
fix: 修复
docs: 文档更新
style: 代码格式化
refactor: 重构
test: 测试
chore: 构建工具相关
```

示例：
```bash
git commit -m "feat: 添加房态日历拖拽功能"
git commit -m "fix: 修复预订状态更新问题"
```

### 代码规范

项目使用以下工具确保代码质量：

- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查
- **Husky**: Git hooks

在提交前自动运行：
```bash
pnpm lint      # 代码检查
pnpm format    # 代码格式化
pnpm type-check # 类型检查
pnpm test      # 运行测试
```

## 开发指南

### 添加新功能

1. **创建功能分支**
```bash
git checkout -b feature/new-feature
```

2. **前端开发** (以 Web 为例)
```bash
cd apps/web
# 添加新页面
mkdir src/app/new-feature
touch src/app/new-feature/page.tsx

# 添加新组件
mkdir src/components/NewFeature
touch src/components/NewFeature/index.tsx
```

3. **后端开发** (以新微服务为例)
```bash
cd services
mkdir new-service
cd new-service
# 初始化 NestJS 项目
nest new . --package-manager pnpm
```

4. **数据库变更**
```bash
cd packages/database
# 修改 schema.prisma
# 生成新的迁移
pnpm prisma migrate dev --name add-new-feature
```

### API 开发

1. **定义 API 接口**
```typescript
// services/api-gateway/src/modules/new-feature/new-feature.controller.ts
@Controller('new-feature')
@ApiTags('new-feature')
export class NewFeatureController {
  @Get()
  @ApiOperation({ summary: '获取新功能列表' })
  async getList() {
    // 实现逻辑
  }
}
```

2. **添加验证**
```typescript
// 使用 class-validator
@IsString()
@IsNotEmpty()
name: string
```

3. **更新 API 客户端**
```typescript
// packages/api-client/src/hooks/useNewFeature.ts
export function useNewFeature() {
  return useQuery('new-feature', () => 
    apiClient.get('/new-feature')
  )
}
```

### 测试

#### 单元测试
```bash
# 运行所有测试
pnpm test

# 运行特定服务测试
pnpm --filter @roomease/api-gateway test

# 监听模式
pnpm --filter @roomease/api-gateway test:watch
```

#### 集成测试
```bash
# 启动测试环境
docker-compose -f docker-compose.test.yml up -d

# 运行 E2E 测试
pnpm test:e2e
```

### 调试

#### 前端调试
```bash
# Web 应用
cd apps/web
pnpm dev
# 打开 http://localhost:3000

# 移动端应用
cd apps/mobile
pnpm start
# 使用 Expo Go 扫码调试
```

#### 后端调试
```bash
# 启动调试模式
pnpm --filter @roomease/api-gateway start:debug
# 在 VS Code 中附加调试器
```

#### 数据库调试
```bash
# 打开 Prisma Studio
pnpm db:studio
# 访问 http://localhost:5555
```

## 性能优化

### 前端优化

1. **代码分割**
```typescript
// 使用动态导入
const LazyComponent = lazy(() => import('./LazyComponent'))
```

2. **图片优化**
```typescript
// 使用 Next.js Image 组件
import Image from 'next/image'
```

3. **缓存策略**
```typescript
// 使用 React Query 缓存
useQuery('key', fetchFn, {
  staleTime: 5 * 60 * 1000, // 5分钟
  cacheTime: 10 * 60 * 1000, // 10分钟
})
```

### 后端优化

1. **数据库优化**
```typescript
// 使用数据库索引
@@index([tenantId, createdAt])

// 查询优化
include: {
  rooms: {
    select: {
      id: true,
      name: true
    }
  }
}
```

2. **缓存策略**
```typescript
// Redis 缓存
@CacheKey('user-profile')
@CacheTTL(300) // 5分钟
async getUserProfile() {}
```

3. **API 限流**
```typescript
@Throttle(10, 60) // 每分钟10次
async sensitiveOperation() {}
```

## 部署

### 开发环境部署
```bash
# 构建所有项目
pnpm build

# 部署到开发环境
pnpm deploy:dev
```

### 生产环境部署
```bash
# 创建发布标签
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions 自动部署
```

## 故障排除

### 常见问题

1. **依赖安装失败**
```bash
# 清理缓存
pnpm store prune
rm -rf node_modules
pnpm install
```

2. **数据库连接失败**
```bash
# 检查 Docker 服务状态
docker-compose ps
# 重启数据库服务
docker-compose restart postgres
```

3. **端口冲突**
```bash
# 查看端口占用
lsof -i :4000
# 修改配置文件中的端口
```

4. **类型错误**
```bash
# 重新生成 Prisma 客户端
pnpm --filter @roomease/database db:generate
```

### 日志查看

```bash
# 查看服务日志
docker-compose logs -f api-gateway

# 查看应用日志
pnpm --filter @roomease/api-gateway start:dev
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request
5. 等待代码审查

详细贡献指南请参考 [CONTRIBUTING.md](./CONTRIBUTING.md) 