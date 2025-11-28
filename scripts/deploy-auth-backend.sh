#!/bin/bash

# 后端认证接口部署脚本
# 在服务器上执行

set -e

echo "🚀 开始部署后端认证接口..."
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 拉取最新代码
echo -e "${BLUE}📥 拉取最新代码...${NC}"
cd /opt/RoomEase
git pull origin main

# 2. 生成 Prisma Client
echo -e "${BLUE}🔧 生成 Prisma Client...${NC}"
cd /opt/RoomEase/packages/database
npx prisma generate

# 3. 构建 API Gateway
echo -e "${BLUE}🏗️  构建 API Gateway...${NC}"
cd /opt/RoomEase/services/api-gateway
npm run build

# 4. 重启 Docker 容器
echo -e "${BLUE}🔄 重启 Docker 容器...${NC}"
cd /opt/RoomEase
docker-compose restart api-gateway

# 5. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动（30秒）...${NC}"
sleep 30

# 6. 测试认证接口
echo -e "${BLUE}🧪 测试认证接口...${NC}"

# 测试注册接口
echo -e "${YELLOW}测试注册接口...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST https://www.englishpartner.cn/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "测试用户",
    "hotelName": "测试酒店"
  }' || echo "ERROR")

if echo "$REGISTER_RESPONSE" | grep -q "token\|accessToken"; then
  echo -e "${GREEN}✅ 注册接口测试成功${NC}"
else
  if echo "$REGISTER_RESPONSE" | grep -q "已被注册"; then
    echo -e "${GREEN}✅ 注册接口正常（邮箱已存在）${NC}"
  else
    echo -e "${RED}❌ 注册接口测试失败${NC}"
    echo "$REGISTER_RESPONSE"
  fi
fi

# 测试登录接口
echo -e "${YELLOW}测试登录接口...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST https://www.englishpartner.cn/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }' || echo "ERROR")

if echo "$LOGIN_RESPONSE" | grep -q "token\|accessToken"; then
  echo -e "${GREEN}✅ 登录接口测试成功${NC}"
  
  # 提取 token
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//' | head -1)
  if [ -z "$TOKEN" ]; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
  fi
  
  if [ -n "$TOKEN" ]; then
    echo -e "${BLUE}Token: ${TOKEN:0:30}...${NC}"
    
    # 测试 /auth/me 接口
    echo -e "${YELLOW}测试 /auth/me 接口...${NC}"
    ME_RESPONSE=$(curl -s -X GET https://www.englishpartner.cn/auth/me \
      -H "Authorization: Bearer $TOKEN" || echo "ERROR")
    
    if echo "$ME_RESPONSE" | grep -q "email\|id"; then
      echo -e "${GREEN}✅ /auth/me 接口测试成功${NC}"
    else
      echo -e "${RED}❌ /auth/me 接口测试失败${NC}"
      echo "$ME_RESPONSE"
    fi
  fi
else
  echo -e "${RED}❌ 登录接口测试失败${NC}"
  echo "$LOGIN_RESPONSE"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "📝 接口地址："
echo "  - 注册: POST https://www.englishpartner.cn/auth/register"
echo "  - 登录: POST https://www.englishpartner.cn/auth/login"
echo "  - 获取用户信息: GET https://www.englishpartner.cn/auth/me"
echo "  - 刷新Token: POST https://www.englishpartner.cn/auth/refresh"
echo "  - 登出: POST https://www.englishpartner.cn/auth/logout"
echo ""
echo "🔍 查看日志："
echo "  docker logs -f roomease-api-gateway"
echo ""

