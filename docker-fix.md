# Docker 网络问题修复指南

如果遇到 Docker 镜像拉取失败的问题，请尝试以下解决方案：

## 方案一：修改 Docker 镜像源
```bash
# 创建或编辑 Docker daemon 配置
sudo vim /etc/docker/daemon.json

# 添加国内镜像源
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://registry.docker-cn.com"
  ]
}

# 重启 Docker 服务
sudo systemctl restart docker
```

## 方案二：使用 Docker Desktop 设置
1. 打开 Docker Desktop
2. 进入 Settings → Docker Engine
3. 添加镜像源配置：
```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
```
4. 点击 "Apply & Restart"

## 方案三：移除代理设置
```bash
# 清除 Docker 认证配置
rm -f ~/.docker/config.json

# 或编辑配置文件，移除 credsStore
echo '{}' > ~/.docker/config.json
```

## 方案四：单独拉取镜像
```bash
# 手动拉取需要的镜像
docker pull postgres:15-alpine
docker pull redis:7-alpine
docker pull rabbitmq:3-management-alpine
docker pull minio/minio:latest
docker pull clickhouse/clickhouse-server:23.8-alpine
docker pull prom/prometheus:latest
docker pull grafana/grafana:latest

# 然后启动服务
docker compose up -d
```

## 方案五：使用替代镜像
如果某些镜像无法拉取，可以修改 `docker-compose.yml` 使用替代镜像：

```yaml
# 例如，将 clickhouse 替换为：
clickhouse:
  image: yandex/clickhouse-server:latest
  # 其他配置保持不变
```

## 检查网络连接
```bash
# 测试网络连接
ping registry-1.docker.io
nslookup registry-1.docker.io

# 检查代理设置
echo $HTTP_PROXY
echo $HTTPS_PROXY
```

完成修复后，重新运行：
```bash
docker compose up -d
``` 