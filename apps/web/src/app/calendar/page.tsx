'use client'

import React, { useState } from 'react'
import { CalendarGrid } from '@roomease/ui'
import type { CalendarDay } from '@roomease/shared'

export default function CalendarPage() {
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // 模拟房态数据
  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = []
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    
    // 添加上个月的尾部日期以填满第一周
    const firstDayOfWeek = startDate.getDay()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(startDate)
      date.setDate(date.getDate() - (i + 1))
      days.push({
        date,
        price: 199,
        isAvailable: true,
        isBlocked: false,
        reservations: []
      })
    }

    // 添加当月所有日期
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const date = new Date(d)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      
      days.push({
        date: new Date(date),
        price: isWeekend ? 299 : 199,
        isAvailable: Math.random() > 0.3,
        isBlocked: Math.random() > 0.9,
        reservations: Math.random() > 0.7 ? [
          {
            id: `res_${date.getTime()}`,
            checkIn: date,
            checkOut: new Date(date.getTime() + 24 * 60 * 60 * 1000),
            guestName: '张三',
            status: 'CONFIRMED' as const
          }
        ] : []
      })
    }

    // 添加下个月的开始日期以填满最后一周
    const lastDay = days[days.length - 1]
    const daysToAdd = 42 - days.length // 6周 * 7天
    for (let i = 1; i <= daysToAdd; i++) {
      const date = new Date(lastDay.date)
      date.setDate(date.getDate() + i)
      days.push({
        date,
        price: 199,
        isAvailable: true,
        isBlocked: false,
        reservations: []
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  const handleDateClick = (date: Date) => {
    setSelectedDates(prev => {
      const dateString = date.toDateString()
      const exists = prev.some(d => d.toDateString() === dateString)
      
      if (exists) {
        return prev.filter(d => d.toDateString() !== dateString)
      } else {
        return [...prev, date]
      }
    })
  }

  const handleDateDoubleClick = (date: Date) => {
    // 双击可以打开编辑弹窗
    console.log('Double clicked date:', date)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">房态日历</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={goToToday}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            今天
          </button>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            批量操作
          </button>
        </div>
      </div>

      {/* 月份导航 */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={goToPreviousMonth}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
          >
            ‹
          </button>
          <h3 className="text-xl font-semibold">
            {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
          </h3>
          <button 
            onClick={goToNextMonth}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
          >
            ›
          </button>
        </div>

        {/* 房间选择器 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">房间:</span>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-[200px]">
            <option value="">所有房间</option>
            <option value="A101">A101 - 豪华大床房</option>
            <option value="A102">A102 - 标准双人房</option>
            <option value="B201">B201 - 家庭套房</option>
          </select>
        </div>
      </div>

      {/* 日历网格 */}
      <div className="bg-white rounded-lg border shadow-sm">
        <CalendarGrid
          days={calendarDays}
          onDateClick={handleDateClick}
          onDateDoubleClick={handleDateDoubleClick}
          selectedDates={selectedDates}
          className="p-4"
        />
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center space-x-8 py-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white border rounded"></div>
          <span>可预订</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 border rounded"></div>
          <span>已预订</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border rounded"></div>
          <span>已锁定</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 border rounded"></div>
          <span>不可用</span>
        </div>
      </div>

      {/* 选中日期信息 */}
      {selectedDates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            已选择 {selectedDates.length} 个日期
            {selectedDates.length > 0 && (
              <span className="ml-2">
                ({selectedDates[0].toLocaleDateString('zh-CN')}
                {selectedDates.length > 1 && ` 等 ${selectedDates.length} 天`})
              </span>
            )}
          </p>
          <div className="flex space-x-2 mt-2">
            <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
              批量设置价格
            </button>
            <button className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
              批量锁定
            </button>
            <button 
              onClick={() => setSelectedDates([])}
              className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
            >
              清除选择
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 