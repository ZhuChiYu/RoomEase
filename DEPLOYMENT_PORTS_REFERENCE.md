# RoomEase 项目端口占用情况总结

## 📌 目的
本文档整理 RoomEase 项目在腾讯云服务器上 Docker 部署时占用的所有端口，方便在同一服务器上部署其他项目时避免端口冲突。

---

## 🌐 服务器信息
```
公网IP: 111.230.110.95
内网IP: 10.1.24.5
操作系统: Ubuntu 22.04 (预装 Docker 26)
域名: @.englishpartner.cn, www.englishpartner.cn
Docker Network: roomease-network (bridge)
```

---

## 🔌 端口占用详情

### 生产环境端口映射 (docker-compose.production.yml)

| 服务名称 | 容器名称 | 容器内部端口 | 宿主机映射端口 | 用途说明 | 访问方式 |
|---------|---------|------------|--------------|---------|---------|
| **API Gateway** | roomease-api-gateway | 4000 | **4000** | REST API 服务 | http://111.230.110.95:4000 |
| **Nginx** | roomease-nginx | 80 | **8080** | HTTP 反向代理 | http://111.230.110.95:8080 |
| **Nginx** | roomease-nginx | 443 | **8443** | HTTPS 反向代理 | https://111.230.110.95:8443 |
| **PostgreSQL** | roomease-postgres | 5432 | **5433** | 主数据库 | 内部访问 |
| **Redis** | roomease-redis | 6379 | **6380** | 缓存服务 | 内部访问 |
| **ClickHouse HTTP** | roomease-clickhouse | 8123 | **8124** | 分析数据库 HTTP | 内部访问 |
| **ClickHouse Native** | roomease-clickhouse | 9000 | **9003** | 分析数据库原生协议 | 内部访问 |
| **RabbitMQ AMQP** | roomease-rabbitmq | 5672 | **5673** | 消息队列 | 内部访问 |
| **RabbitMQ 管理界面** | roomease-rabbitmq | 15672 | **15673** | 管理控制台 | http://111.230.110.95:15673 |
| **MinIO 控制台** | roomease-minio | 9001 | **9004** | 对象存储控制台 | http://111.230.110.95:9004 |
| **MinIO API** | roomease-minio | 9002 | **9005** | S3 兼容 API | 内部访问 |
| **Prometheus** | roomease-prometheus | 9090 | **9090** | 监控指标收集 | http://111.230.110.95:9090 |
| **Grafana** | roomease-grafana | 3000 | **3001** | 监控可视化面板 | http://111.230.110.95:3001 |

### 开发环境端口映射 (docker-compose.yml)

开发环境使用不同的端口映射，避免与生产环境冲突：

| 服务名称 | 宿主机端口 | 与生产环境的区别 |
|---------|-----------|---------------|
| PostgreSQL | **5434** | 生产环境用 5433 |
| Redis | **6380** | 与生产环境相同 |
| ClickHouse HTTP | **8123** | 生产环境用 8124 |
| ClickHouse Native | **9000** | 生产环境用 9003 |
| RabbitMQ AMQP | **5672** | 生产环境用 5673 |
| RabbitMQ 管理 | **15672** | 生产环境用 15673 |
| MinIO 控制台 | **9001** | 生产环境用 9004 |
| MinIO API | **9002** | 生产环境用 9005 |
| Prometheus | **9090** | 与生产环境相同 |
| Grafana | **3001** | 与生产环境相同 |

---

## 🚨 已占用端口汇总

### 生产环境 (Production) 占用的宿主机端口：
```
3001   - Grafana 监控面板
4000   - API Gateway (主要对外 API)
5433   - PostgreSQL 数据库
5673   - RabbitMQ AMQP
6380   - Redis 缓存
8080   - Nginx HTTP
8124   - ClickHouse HTTP
8443   - Nginx HTTPS
9003   - ClickHouse Native
9004   - MinIO 控制台
9005   - MinIO API
9090   - Prometheus
15673  - RabbitMQ 管理界面
```

### 开发环境 (Development) 占用的宿主机端口：
```
5434   - PostgreSQL
6380   - Redis (与生产重复)
5672   - RabbitMQ AMQP
8123   - ClickHouse HTTP
9000   - ClickHouse Native
9001   - MinIO 控制台
9002   - MinIO API
9090   - Prometheus (与生产重复)
3001   - Grafana (与生产重复)
15672  - RabbitMQ 管理
```

---

## 💡 部署其他项目时的建议

### 1. 推荐的可用端口范围

为避免冲突，建议其他项目使用以下端口段：

```
应用服务端口: 4100-4199, 5000-5099, 7000-7999
数据库端口: 5500-5599, 5700-5799
缓存服务端口: 6400-6499
Web 服务端口: 8000-8079, 8500-8999
管理界面端口: 16000-16999
监控服务端口: 9100-9199, 9500-9999
```

### 2. 具体端口建议

假设您要部署 **第二个项目 (ProjectX)**，建议使用以下端口：

| 服务类型 | RoomEase 端口 | ProjectX 建议端口 | 备注 |
|---------|--------------|-----------------|-----|
| API Gateway | 4000 | **4100** | 应用主服务 |
| Nginx HTTP | 8080 | **8100** | Web 入口 |
| Nginx HTTPS | 8443 | **8500** | SSL 入口 |
| PostgreSQL | 5433 | **5500** | 数据库 |
| Redis | 6380 | **6400** | 缓存 |
| RabbitMQ AMQP | 5673 | **5700** | 消息队列 |
| RabbitMQ 管理 | 15673 | **16000** | 管理界面 |
| Grafana | 3001 | **3100** | 监控面板 |
| Prometheus | 9090 | **9100** | 指标收集 |

### 3. Docker Compose 配置示例

```yaml
# 第二个项目的 docker-compose.yml 示例
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: projectx-postgres
    ports:
      - "5500:5432"  # 使用 5500 避免与 RoomEase 的 5433 冲突
    networks:
      - projectx-network

  redis:
    image: redis:7-alpine
    container_name: projectx-redis
    ports:
      - "6400:6379"  # 使用 6400 避免与 RoomEase 的 6380 冲突
    networks:
      - projectx-network

  api:
    build: .
    container_name: projectx-api
    ports:
      - "4100:4000"  # 使用 4100 避免与 RoomEase 的 4000 冲突
    networks:
      - projectx-network

  nginx:
    image: nginx:alpine
    container_name: projectx-nginx
    ports:
      - "8100:80"    # 使用 8100 避免与 RoomEase 的 8080 冲突
      - "8500:443"   # 使用 8500 避免与 RoomEase 的 8443 冲突
    networks:
      - projectx-network

networks:
  projectx-network:
    driver: bridge
    name: projectx-network  # 使用独立的网络名称
```

### 4. 网络隔离建议

每个项目应使用独立的 Docker 网络：

```yaml
networks:
  roomease-network:    # RoomEase 项目
    driver: bridge
  
  projectx-network:    # 新项目
    driver: bridge
```

这样可以：
- ✅ 避免容器名称冲突
- ✅ 实现网络隔离
- ✅ 提高安全性
- ✅ 便于管理和维护

---

## 🔍 检查端口占用情况

### 查看所有正在监听的端口

```bash
# 查看所有 TCP 监听端口
sudo netstat -tlnp

# 或使用 ss 命令
sudo ss -tlnp

# 查看特定端口是否被占用 (例如检查 4100)
sudo lsof -i :4100
```

### 查看 Docker 容器端口映射

```bash
# 查看所有容器的端口映射
docker ps --format "table {{.Names}}\t{{.Ports}}"

# 查看特定项目的容器端口
docker-compose -f docker-compose.production.yml ps
```

### 端口冲突检查脚本

```bash
#!/bin/bash
# check-ports.sh - 检查端口是否可用

PORTS=(4100 5500 6400 8100 8500)

echo "检查端口可用性..."
for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ 端口 $port 已被占用"
        lsof -i :$port
    else
        echo "✅ 端口 $port 可用"
    fi
done
```

---

## 📝 容器命名规范建议

为避免容器名称冲突，建议使用以下命名规范：

```
格式: {项目名}-{服务名}

示例:
- roomease-postgres     (RoomEase 项目)
- roomease-redis
- roomease-api-gateway
- roomease-nginx

- projectx-postgres     (新项目)
- projectx-redis
- projectx-api
- projectx-nginx
```

---

## 🛡️ 防火墙和安全组配置

### 腾讯云安全组规则

确保在腾讯云控制台配置正确的入站规则：

| 协议 | 端口 | 来源 | 说明 |
|-----|------|------|------|
| TCP | 22 | 您的IP | SSH 访问 |
| TCP | 80 | 0.0.0.0/0 | HTTP (如需要) |
| TCP | 443 | 0.0.0.0/0 | HTTPS (如需要) |
| TCP | 4000 | 0.0.0.0/0 | RoomEase API |
| TCP | 4100 | 0.0.0.0/0 | ProjectX API (新项目) |
| TCP | 8080 | 0.0.0.0/0 | RoomEase Nginx |
| TCP | 8100 | 0.0.0.0/0 | ProjectX Nginx (新项目) |

**重要提示：**
- 数据库端口 (5433, 5500) 不应对外开放
- Redis 端口 (6380, 6400) 不应对外开放
- 仅开放必要的应用端口和 Web 端口

### Ubuntu 防火墙 (UFW) 配置

```bash
# 启用防火墙
sudo ufw enable

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 RoomEase 端口
sudo ufw allow 4000/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 8443/tcp

# 允许新项目端口
sudo ufw allow 4100/tcp
sudo ufw allow 8100/tcp
sudo ufw allow 8500/tcp

# 查看规则
sudo ufw status numbered
```

---

## 📊 监控和日志

### 查看端口监听状态

```bash
# 实时监控端口
watch -n 2 'sudo netstat -tlnp | grep -E "(4000|4100|5433|5500|6380|6400|8080|8100)"'
```

### Docker 资源使用情况

```bash
# 查看所有容器的资源使用
docker stats

# 查看特定项目的容器
docker stats roomease-api-gateway roomease-postgres roomease-redis
```

---

## 🔄 部署清单

在部署新项目前，请完成以下检查：

- [ ] 确认所有端口号不与现有项目冲突
- [ ] 使用独立的 Docker 网络名称
- [ ] 使用独立的容器名称前缀
- [ ] 配置独立的数据卷名称
- [ ] 更新防火墙和安全组规则
- [ ] 测试端口可用性
- [ ] 准备独立的 .env 配置文件
- [ ] 文档记录新项目的端口使用情况

---

## 📞 故障排查

### 端口冲突问题

如果遇到端口冲突错误：

```bash
Error: bind: address already in use
```

解决方法：

```bash
# 1. 查找占用端口的进程
sudo lsof -i :端口号

# 2. 停止占用进程
sudo kill -9 进程ID

# 或停止相关的 Docker 容器
docker stop 容器名称

# 3. 修改新项目的端口配置
vim docker-compose.yml
```

### 容器名称冲突

如果遇到容器名称冲突：

```bash
Error: container name already in use
```

解决方法：

```bash
# 1. 查看所有容器
docker ps -a

# 2. 重命名或删除旧容器
docker rename 旧名称 新名称
# 或
docker rm 容器名称

# 3. 修改 docker-compose.yml 中的 container_name
```

---

## 📚 相关文档

- [完整部署指南](./DEPLOYMENT_GUIDE.md)
- [服务器部署指令](./SERVER_DEPLOYMENT_INSTRUCTIONS.md)
- [快速部署指南](./QUICK_DEPLOY.md)

---

## 📋 版本历史

| 版本 | 日期 | 说明 |
|-----|------|------|
| 1.0 | 2025-11-29 | 初始版本，整理 RoomEase 项目端口占用情况 |

---

**注意事项：**
1. 本文档基于当前部署配置，如有变更请及时更新
2. 部署新项目前务必检查端口可用性
3. 建议为每个项目维护独立的端口文档
4. 定期审查和清理不再使用的端口

**祝您部署顺利！** 🚀

