#!/bin/bash

# 检查生产数据库是否有 sortOrder 和 isVisible 字段

echo "🔍 检查生产数据库 rooms 表结构..."

ssh root@47.236.101.143 << 'ENDSSH'
cd /opt/RoomEase

# 通过 docker 连接到数据库容器并检查表结构
docker exec roomease-postgres psql -U postgres -d roomease -c "\d rooms"

ENDSSH

