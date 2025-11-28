#!/bin/bash

# ngrok HTTPS 隧道启动脚本
# 用于解决 Expo Go 不支持 HTTP 连接的问题

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🚀 启动 ngrok HTTPS 隧道                                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 检查 ngrok 是否安装
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ 未找到 ngrok${NC}"
    echo ""
    echo "请先安装 ngrok:"
    echo "  brew install ngrok"
    echo ""
    echo "或访问: https://ngrok.com/download"
    exit 1
fi

echo -e "${GREEN}✓ ngrok 已安装${NC}"
echo ""

# 目标服务器
TARGET_SERVER="http://111.230.110.95:8080"

echo -e "${BLUE}目标服务器:${NC} ${YELLOW}${TARGET_SERVER}${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 测试目标服务器是否可访问
echo -e "${CYAN}测试目标服务器连接...${NC}"
if curl -s --max-time 5 "${TARGET_SERVER}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 目标服务器可访问${NC}"
else
    echo -e "${YELLOW}⚠️  无法连接到目标服务器，但仍会启动隧道${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🚀 正在启动 ngrok 隧道...${NC}"
echo ""
echo -e "${CYAN}请注意:${NC}"
echo "  1. 记下生成的 HTTPS URL（例如: https://xxxx.ngrok-free.app）"
echo "  2. 在 App 的"开发者"页面点击"自定义服务器地址""
echo "  3. 输入 ngrok 生成的 HTTPS URL"
echo "  4. 保持此终端窗口打开"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}按 Ctrl+C 可以停止隧道${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 启动 ngrok
ngrok http "${TARGET_SERVER}"

# 如果 ngrok 退出
echo ""
echo -e "${YELLOW}ngrok 已停止${NC}"

