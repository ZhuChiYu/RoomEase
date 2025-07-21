'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@roomease/ui'

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

function KPICard({ title, value, description, trend }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend && (
          <div className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <CardDescription className="text-xs text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  // 模拟数据，实际应该从 API 获取
  const kpiData = [
    {
      title: '今日入住',
      value: 12,
      description: '计划入住 15 间',
      trend: { value: 8.2, isPositive: true }
    },
    {
      title: '今日退房',
      value: 8,
      description: '计划退房 10 间',
      trend: { value: -2.1, isPositive: false }
    },
    {
      title: '当前在住',
      value: 45,
      description: '入住率 78%',
      trend: { value: 12.5, isPositive: true }
    },
    {
      title: '本月收入',
      value: '¥156,847',
      description: '较上月增长',
      trend: { value: 15.3, isPositive: true }
    }
  ]

  const recentReservations = [
    {
      id: '1',
      guestName: '张三',
      room: 'A101',
      checkIn: '2024-01-15',
      status: 'confirmed'
    },
    {
      id: '2',
      guestName: '李四',
      room: 'A102',
      checkIn: '2024-01-15',
      status: 'pending'
    },
    {
      id: '3',
      guestName: '王五',
      room: 'B201',
      checkIn: '2024-01-16',
      status: 'confirmed'
    }
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            导出报表
          </button>
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 收入趋势图 */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>收入趋势</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              收入趋势图 (待接入 Recharts)
            </div>
          </CardContent>
        </Card>

        {/* 最近预订 */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>最近预订</CardTitle>
            <CardDescription>
              最新的预订记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {reservation.guestName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reservation.room} • {reservation.checkIn}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      reservation.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reservation.status === 'confirmed' ? '已确认' : '待确认'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 