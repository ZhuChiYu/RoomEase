#!/bin/bash

echo "🔍 RoomEase 启动检查..."
echo ""

# 1. 检查Docker
echo "1️⃣ 检查 Docker..."
if docker ps > /dev/null 2>&1; then
    echo "   ✅ Docker 正在运行"
else
    echo "   ❌ Docker 未运行！"
    echo "   👉 请先启动 Docker Desktop"
    echo "   👉 等待Docker图标变为绿色后，再运行此脚本"
    exit 1
fi

echo ""

# 2. 启动数据库容器
echo "2️⃣ 启动数据库容器..."
cd /Users/zhuchiyu/Project/RoomEasy/RoomEase

# 检查容器是否已运行
if docker compose ps | grep -q "postgres.*Up"; then
    echo "   ✅ 数据库容器已在运行"
else
    echo "   🚀 启动数据库容器..."
    docker compose up -d postgres
    sleep 5
    echo "   ✅ 数据库容器已启动"
fi

echo ""

# 3. 检查数据库连接
echo "3️⃣ 检查数据库连接..."
if docker exec roomease-postgres-1 pg_isready -U postgres > /dev/null 2>&1; then
    echo "   ✅ 数据库连接正常"
else
    echo "   ⏳ 等待数据库启动..."
    sleep 3
    if docker exec roomease-postgres-1 pg_isready -U postgres > /dev/null 2>&1; then
        echo "   ✅ 数据库连接正常"
    else
        echo "   ❌ 数据库连接失败"
        exit 1
    fi
fi

echo ""

# 4. 清理旧的后端进程
echo "4️⃣ 清理旧进程..."
pkill -9 -f "nest.js" 2>/dev/null && echo "   🧹 已清理旧的后端进程" || echo "   ✅ 无旧进程需要清理"

echo ""

# 5. 启动后端
echo "5️⃣ 启动后端服务..."
echo "   📱 移动设备访问地址: http://192.168.31.221:4000"
echo "   💻 本地访问地址: http://localhost:4000"
echo ""
echo "   ⚠️  请在新终端窗口查看后端日志"
echo ""
echo "按 Ctrl+C 可以停止后端服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /Users/zhuchiyu/Project/RoomEasy/RoomEase/services/api-gateway

export DATABASE_URL="postgresql://postgres:postgres123@localhost:5434/roomease?schema=public"
export JWT_SECRET="your-super-secret-jwt-key-change-in-production"
export JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
export NODE_ENV="development"
export PORT="4000"

pnpm run dev

