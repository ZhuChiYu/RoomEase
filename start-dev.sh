#!/bin/bash

# RoomEase 开发环境启动脚本

echo "🚀 启动 RoomEase 开发环境..."

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install
fi

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
cd packages/database && pnpm prisma generate && cd ../..

# 启动服务
echo "🌐 启动 Web 端 (Next.js)..."
cd apps/web && pnpm dev &
WEB_PID=$!

echo "📱 启动移动端 (Expo)..."
cd ../mobile && pnpm start &
MOBILE_PID=$!

echo "⚡ 启动后端 API (NestJS)..."
cd ../../services/api-gateway && pnpm dev &
API_PID=$!

# 等待服务启动
sleep 10

echo ""
echo "✅ 服务启动完成！"
echo ""
echo "📊 访问地址:"
echo "  🌐 Web端:     http://localhost:3000"
echo "  📱 移动端:    http://localhost:8081 (Expo DevTools)"
echo "  ⚡ API文档:   http://localhost:3001/api"
echo ""
echo "🛠️  开发工具:"
echo "  📊 Prometheus: http://localhost:9090"
echo "  📈 Grafana:   http://localhost:3001"
echo "  💾 MinIO:     http://localhost:9001"
echo "  🐰 RabbitMQ:  http://localhost:15672"
echo ""
echo "Press Ctrl+C to stop all services"

# 等待中断信号
trap 'echo "🛑 停止所有服务..."; kill $WEB_PID $MOBILE_PID $API_PID; exit 0' INT TERM

# 保持脚本运行
wait 