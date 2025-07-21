-- 创建数据库
CREATE DATABASE IF NOT EXISTS roomease_analytics;

-- 切换到分析数据库
USE roomease_analytics;

-- 预订事实表
CREATE TABLE IF NOT EXISTS fact_reservation (
    id String,
    tenant_id String,
    property_id String,
    room_id String,
    user_id String,
    check_in_date Date,
    check_out_date Date,
    guest_count UInt8,
    room_rate Decimal64(2),
    total_amount Decimal64(2),
    paid_amount Decimal64(2),
    currency String,
    status String,
    source String,
    created_at DateTime,
    updated_at DateTime
) ENGINE = MergeTree()
ORDER BY (tenant_id, created_at, id);

-- 日度KPI物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_kpi
TO daily_kpi
AS SELECT
    tenant_id,
    property_id,
    toDate(created_at) as date,
    count() as total_reservations,
    countIf(status = 'CONFIRMED') as confirmed_reservations,
    countIf(status = 'CANCELLED') as cancelled_reservations,
    sum(total_amount) as total_revenue,
    sum(paid_amount) as paid_revenue,
    avg(total_amount) as avg_booking_value,
    uniq(room_id) as unique_rooms_booked
FROM fact_reservation
GROUP BY tenant_id, property_id, date;

-- 日度KPI目标表
CREATE TABLE IF NOT EXISTS daily_kpi (
    tenant_id String,
    property_id String,
    date Date,
    total_reservations UInt32,
    confirmed_reservations UInt32,
    cancelled_reservations UInt32,
    total_revenue Decimal64(2),
    paid_revenue Decimal64(2),
    avg_booking_value Decimal64(2),
    unique_rooms_booked UInt32
) ENGINE = MergeTree()
ORDER BY (tenant_id, property_id, date); 