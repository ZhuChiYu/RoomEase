-- 创建 RoomEase 数据库
CREATE DATABASE roomease;

-- 创建测试数据库
CREATE DATABASE roomease_test;

-- 创建扩展
\c roomease;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c roomease_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; 