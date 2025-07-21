import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { cn, formatDate, formatPrice } from '../lib/utils'
import { RESERVATION_STATUS } from '@roomease/shared'

interface ReservationCardProps {
  reservation: {
    id: string
    checkInDate: Date
    checkOutDate: Date
    guestName: string
    guestPhone?: string
    guestEmail?: string
    roomRate: number
    totalAmount: number
    status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
    room: {
      name: string
      code: string
    }
    property: {
      name: string
    }
  }
  onEdit?: (id: string) => void
  onCancel?: (id: string) => void
  onCheckIn?: (id: string) => void
  onCheckOut?: (id: string) => void
  className?: string
}

export function ReservationCard({
  reservation,
  onEdit,
  onCancel,
  onCheckIn,
  onCheckOut,
  className
}: ReservationCardProps) {
  const statusConfig = RESERVATION_STATUS[reservation.status]
  
  const getActionButtons = () => {
    const buttons = []

    if (reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') {
      buttons.push(
        <Button key="edit" variant="outline" size="sm" onClick={() => onEdit?.(reservation.id)}>
          编辑
        </Button>
      )
      buttons.push(
        <Button key="cancel" variant="destructive" size="sm" onClick={() => onCancel?.(reservation.id)}>
          取消
        </Button>
      )
    }

    if (reservation.status === 'CONFIRMED') {
      buttons.push(
        <Button key="checkin" size="sm" onClick={() => onCheckIn?.(reservation.id)}>
          入住
        </Button>
      )
    }

    if (reservation.status === 'CHECKED_IN') {
      buttons.push(
        <Button key="checkout" size="sm" onClick={() => onCheckOut?.(reservation.id)}>
          退房
        </Button>
      )
    }

    return buttons
  }

  return (
    <Card className={cn('reservation-card', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{reservation.guestName}</CardTitle>
          <span
            className={cn(
              'reservation-status',
              `status-${reservation.status.toLowerCase().replace('_', '-')}`
            )}
          >
            {statusConfig.label}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          预订号: {reservation.id}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 入住信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-700">入住日期</div>
            <div className="text-sm">{formatDate(reservation.checkInDate)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">退房日期</div>
            <div className="text-sm">{formatDate(reservation.checkOutDate)}</div>
          </div>
        </div>

        {/* 房间信息 */}
        <div>
          <div className="text-sm font-medium text-gray-700">房间</div>
          <div className="text-sm">
            {reservation.property.name} - {reservation.room.name} ({reservation.room.code})
          </div>
        </div>

        {/* 联系信息 */}
        {reservation.guestPhone && (
          <div>
            <div className="text-sm font-medium text-gray-700">手机号</div>
            <div className="text-sm">{reservation.guestPhone}</div>
          </div>
        )}

        {reservation.guestEmail && (
          <div>
            <div className="text-sm font-medium text-gray-700">邮箱</div>
            <div className="text-sm">{reservation.guestEmail}</div>
          </div>
        )}

        {/* 价格信息 */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">房费/晚</span>
            <span className="text-sm">{formatPrice(reservation.roomRate)}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="font-medium">总金额</span>
            <span className="font-medium text-lg">{formatPrice(reservation.totalAmount)}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        {getActionButtons().length > 0 && (
          <div className="flex gap-2 pt-2">
            {getActionButtons()}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 