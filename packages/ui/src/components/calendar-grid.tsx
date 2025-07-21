import * as React from 'react'
import { cn, formatDate, formatPrice } from '../lib/utils'
import { CalendarDay } from '@roomease/shared'

interface CalendarGridProps {
  days: CalendarDay[]
  onDateClick?: (date: Date) => void
  onDateDoubleClick?: (date: Date) => void
  selectedDates?: Date[]
  className?: string
}

export function CalendarGrid({
  days,
  onDateClick,
  onDateDoubleClick,
  selectedDates = [],
  className
}: CalendarGridProps) {
  const getDayCellClass = (day: CalendarDay) => {
    const baseClass = 'calendar-cell border border-gray-200 p-2 min-h-[80px] cursor-pointer transition-colors'
    const isSelected = selectedDates.some(date => 
      date.toDateString() === day.date.toDateString()
    )
    
    if (isSelected) return cn(baseClass, 'bg-blue-100 ring-2 ring-blue-500')
    if (day.isBlocked) return cn(baseClass, 'bg-red-50 hover:bg-red-100')
    if (day.reservations.length > 0) return cn(baseClass, 'bg-blue-50 hover:bg-blue-100')
    if (!day.isAvailable) return cn(baseClass, 'bg-gray-50 hover:bg-gray-100')
    
    return cn(baseClass, 'bg-white hover:bg-gray-50')
  }

  const handleCellClick = (day: CalendarDay) => {
    onDateClick?.(day.date)
  }

  const handleCellDoubleClick = (day: CalendarDay) => {
    onDateDoubleClick?.(day.date)
  }

  return (
    <div className={cn('calendar-grid', className)}>
      {/* 日历头部 - 星期 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            key={day.date.toISOString()}
            className={getDayCellClass(day)}
            onClick={() => handleCellClick(day)}
            onDoubleClick={() => handleCellDoubleClick(day)}
          >
            {/* 日期 */}
            <div className="text-sm font-medium mb-1">
              {day.date.getDate()}
            </div>

            {/* 价格 */}
            <div className="text-xs text-gray-600 mb-1">
              {formatPrice(day.price)}
            </div>

            {/* 预订信息 */}
            {day.reservations.length > 0 && (
              <div className="space-y-1">
                {day.reservations.slice(0, 2).map((reservation) => (
                  <div
                    key={reservation.id}
                    className={cn(
                      'text-xs px-1 py-0.5 rounded truncate',
                      reservation.status === 'CONFIRMED' && 'bg-blue-200 text-blue-800',
                      reservation.status === 'PENDING' && 'bg-orange-200 text-orange-800',
                      reservation.status === 'CHECKED_IN' && 'bg-green-200 text-green-800'
                    )}
                  >
                    {reservation.guestName}
                  </div>
                ))}
                {day.reservations.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{day.reservations.length - 2} 更多
                  </div>
                )}
              </div>
            )}

            {/* 限制信息 */}
            {(day.minStay || day.maxStay) && (
              <div className="text-xs text-gray-500 mt-1">
                {day.minStay && `最少${day.minStay}晚`}
                {day.maxStay && ` 最多${day.maxStay}晚`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 