#!/bin/bash

# KemanCloud Mobile（客满云）快速启动脚本

set -e

echo "🚀 KemanCloud Mobile 启动脚本"
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查Node.js
echo -e "${BLUE}📦 检查环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未找到Node.js，请先安装Node.js${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js: $(node -v)${NC}"

# 检查npm
if command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    echo -e "${GREEN}✓ 使用npm${NC}"
else
    echo -e "${RED}❌ 未找到npm${NC}"
    exit 1
fi

# 进入mobile目录
cd "$(dirname "$0")"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 安装依赖...${NC}"
    $PKG_MANAGER install
else
    echo -e "${GREEN}✓ 依赖已安装${NC}"
fi

# 检查Expo CLI
if ! command -v expo &> /dev/null; then
    echo -e "${YELLOW}📥 安装Expo CLI...${NC}"
    npm install -g expo-cli
fi

echo -e "${GREEN}✓ Expo CLI已安装${NC}"

# 获取本地IP
echo ""
echo -e "${BLUE}🌐 网络信息:${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "未找到")
else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}' || echo "未找到")
fi

echo -e "本地IP: ${GREEN}$LOCAL_IP${NC}"
echo -e "API地址: ${GREEN}http://$LOCAL_IP:4000${NC}"
echo ""

# 显示启动选项
echo -e "${BLUE}📱 启动模式:${NC}"
echo "1. Expo Go (推荐，需要安装Expo Go App)"
echo "2. iOS模拟器 (需要Xcode)"
echo "3. Android模拟器 (需要Android Studio)"
echo "4. 仅启动开发服务器"
echo ""

read -p "请选择 (1-4): " choice

case $choice in
    1)
        echo -e "${GREEN}🚀 启动Expo Go模式...${NC}"
        echo ""
        echo -e "${YELLOW}请在手机上:${NC}"
        echo "1. 安装Expo Go App (App Store/Google Play)"
        echo "2. 确保手机和电脑在同一WiFi网络"
        echo "3. 扫描下方二维码"
        echo ""
        $PKG_MANAGER start
        ;;
    2)
        echo -e "${GREEN}🚀 启动iOS模拟器...${NC}"
        if [[ "$OSTYPE" != "darwin"* ]]; then
            echo -e "${RED}❌ iOS模拟器仅支持macOS${NC}"
            exit 1
        fi
        $PKG_MANAGER run ios
        ;;
    3)
        echo -e "${GREEN}🚀 启动Android模拟器...${NC}"
        $PKG_MANAGER run android
        ;;
    4)
        echo -e "${GREEN}🚀 启动开发服务器...${NC}"
        $PKG_MANAGER start
        ;;
    *)
        echo -e "${RED}❌ 无效选择${NC}"
        exit 1
        ;;
esac

