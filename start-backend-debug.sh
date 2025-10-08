#!/bin/bash

echo "🛑 清理旧进程..."
pkill -9 -f "nest.js" 2>/dev/null
pkill -9 -f "pnpm run dev" 2>/dev/null
sleep 2

echo "🚀 启动后端服务 (监听所有网络接口)..."
echo "📱 移动设备可通过 http://192.168.31.221:4000 访问"
echo ""

cd /Users/zhuchiyu/Project/RoomEasy/RoomEase/services/api-gateway

export DATABASE_URL="postgresql://postgres:postgres123@localhost:5434/roomease?schema=public"
export JWT_SECRET="your-super-secret-jwt-key-change-in-production"
export JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
export NODE_ENV="development"
export PORT="4000"

pnpm run dev

