import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { CalendarState, Room, Reservation, RoomStatusData, RoomType, OperationLog, RoomTypeConfig, Payment } from './types'

// 获取本地日期字符串（YYYY-MM-DD），避免时区问题
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 初始化示例数据
const initialRooms: Room[] = [
  { id: '1202', name: '1202', type: '大床房' },
  { id: '1203', name: '1203', type: '大床房' },
  { id: '1204', name: '1204', type: '大床房' },
  { id: '12345', name: '12345', type: '双人房' },
  { id: '1301', name: '1301', type: '豪华房' },
  { id: '1302', name: '1302', type: '豪华房' },
  { id: '1401', name: '1401', type: '套房' },
]

const initialRoomTypes: RoomTypeConfig[] = [
  { id: '1', name: '大床房', shortName: '大床房', defaultPrice: 1000 },
  { id: '2', name: '双人房', shortName: '双人房', defaultPrice: 1200 },
  { id: '3', name: '豪华房', shortName: '豪华房', defaultPrice: 1500 },
  { id: '4', name: '套房', shortName: '套房', defaultPrice: 2000 },
]

const initialState: CalendarState = {
  rooms: initialRooms,
  roomTypes: initialRoomTypes,
  reservations: [],
  roomStatuses: [],
  operationLogs: [],
  payments: [],
}

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    // 添加预订
    addReservation: (state, action: PayloadAction<Reservation>) => {
      console.log('🔄 [Redux] addReservation:', action.payload)
      state.reservations.push(action.payload)
      
      // 自动添加房态数据
      const { roomId, checkInDate, checkOutDate, id, orderId, guestName, guestPhone, channel, roomType } = action.payload
      const startDate = new Date(checkInDate)
      const endDate = new Date(checkOutDate)
      
      console.log('🔄 [Redux] 添加房态记录:', { roomId, checkInDate, checkOutDate })
      
      // 为预订期间的每一天创建房态记录
      let addedCount = 0
      for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = getLocalDateString(date)
        state.roomStatuses.push({
          roomId,
          date: dateStr,
          status: 'occupied',
          reservationId: id,
        })
        addedCount++
        console.log(`  ✅ [Redux] 添加房态: ${dateStr} - 房间${roomId}`)
      }
      
      // 添加操作日志
      const log: OperationLog = {
        id: `${Date.now()}-create`,
        orderId: orderId,
        action: '创建订单',
        operator: channel || '系统',
        time: new Date().toLocaleString('zh-CN'),
        details: `预订人：${guestName}\n手机：${guestPhone}\n房间：${roomType}\n入住日期：${checkInDate}\n离店日期：${checkOutDate}`,
      }
      state.operationLogs.push(log)
      
      console.log(`✅ [Redux] 预订添加完成，共添加 ${addedCount} 天房态记录`)
      console.log('📊 [Redux] 当前状态:', {
        reservations: state.reservations.length,
        roomStatuses: state.roomStatuses.length
      })
    },

    // 取消预订
    cancelReservation: (state, action: PayloadAction<string>) => {
      const reservationId = action.payload
      const reservation = state.reservations.find(r => r.id === reservationId)
      
      if (reservation) {
        // 更新预订状态
        reservation.status = 'cancelled'
        
        // 删除相关的房态记录
        state.roomStatuses = state.roomStatuses.filter(
          rs => rs.reservationId !== reservationId
        )
        
        // 添加操作日志
        const log: OperationLog = {
          id: `${Date.now()}-cancel`,
          orderId: reservation.orderId,
          action: '取消预订',
          operator: '用户',
          time: new Date().toLocaleString('zh-CN'),
          details: `订单号：${reservation.orderId}\n客人：${reservation.guestName}\n房间：${reservation.roomType}`,
        }
        state.operationLogs.push(log)
      }
    },

    // 关房
    closeRoom: (state, action: PayloadAction<{ roomId: string; startDate: string; endDate: string; note?: string }>) => {
      const { roomId, startDate, endDate, note } = action.payload
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // 为关房期间的每一天创建房态记录
      for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
        const dateStr = getLocalDateString(date)
        
        // 检查是否已存在该日期的房态
        const existingIndex = state.roomStatuses.findIndex(
          rs => rs.roomId === roomId && rs.date === dateStr
        )
        
        if (existingIndex >= 0) {
          state.roomStatuses[existingIndex] = {
            roomId,
            date: dateStr,
            status: 'closed',
            note,
          }
        } else {
          state.roomStatuses.push({
            roomId,
            date: dateStr,
            status: 'closed',
            note,
          })
        }
      }
    },

    // 开房（取消关房状态）
    openRoom: (state, action: PayloadAction<{ roomId: string; date: string }>) => {
      const { roomId, date } = action.payload
      state.roomStatuses = state.roomStatuses.filter(
        rs => !(rs.roomId === roomId && rs.date === date && rs.status === 'closed')
      )
    },

    // 添加房型（废弃，使用saveRoomType）
    addRoomType: (state, action: PayloadAction<{ rooms: Room[] }>) => {
      state.rooms.push(...action.payload.rooms)
    },

    // 更新房间列表
    updateRooms: (state, action: PayloadAction<Room[]>) => {
      state.rooms = action.payload
    },

    // 设置脏房状态
    setRoomDirty: (state, action: PayloadAction<{ roomId: string; date: string }>) => {
      const { roomId, date } = action.payload
      const existingIndex = state.roomStatuses.findIndex(
        rs => rs.roomId === roomId && rs.date === date
      )
      
      if (existingIndex >= 0) {
        state.roomStatuses[existingIndex].status = 'dirty'
      } else {
        state.roomStatuses.push({
          roomId,
          date,
          status: 'dirty',
        })
      }
    },

    // 清理脏房状态
    clearRoomDirty: (state, action: PayloadAction<{ roomId: string; date: string }>) => {
      const { roomId, date } = action.payload
      const existingIndex = state.roomStatuses.findIndex(
        rs => rs.roomId === roomId && rs.date === date && rs.status === 'dirty'
      )
      
      if (existingIndex >= 0) {
        state.roomStatuses.splice(existingIndex, 1)
      }
    },

    // 添加操作日志
    addOperationLog: (state, action: PayloadAction<OperationLog>) => {
      state.operationLogs.push(action.payload)
    },

    // 添加或更新房型
    saveRoomType: (state, action: PayloadAction<RoomTypeConfig>) => {
      const index = state.roomTypes.findIndex(rt => rt.id === action.payload.id)
      if (index >= 0) {
        state.roomTypes[index] = action.payload
      } else {
        state.roomTypes.push(action.payload)
      }
    },

    // 删除房型
    deleteRoomType: (state, action: PayloadAction<string>) => {
      const roomTypeId = action.payload
      const roomType = state.roomTypes.find(rt => rt.id === roomTypeId)
      if (roomType) {
        // 同时删除该房型下的所有房间
        state.rooms = state.rooms.filter(room => room.type !== roomType.name)
        state.roomTypes = state.roomTypes.filter(rt => rt.id !== roomTypeId)
      }
    },

    // 为房型添加房间
    addRoomsToType: (state, action: PayloadAction<{ roomTypeName: string; roomNames: string[] }>) => {
      const { roomTypeName, roomNames } = action.payload
      console.log('🔄 [Redux] 添加房间到房型:', { roomTypeName, roomNames })
      
      const newRooms: Room[] = roomNames.map(name => ({
        id: name,
        name,
        type: roomTypeName as RoomType
      }))
      state.rooms.push(...newRooms)
      
      console.log('✅ [Redux] 房间已添加，当前总房间数:', state.rooms.length)
      console.log('📋 [Redux] 新增的房间:', newRooms)
    },

    // 删除房间
    deleteRoom: (state, action: PayloadAction<string>) => {
      state.rooms = state.rooms.filter(room => room.id !== action.payload)
    },

    // 添加支付记录
    addPayment: (state, action: PayloadAction<Payment>) => {
      state.payments.push(action.payload)
      
      // 更新对应预订的支付金额和其他费用
      const reservation = state.reservations.find(r => r.orderId === action.payload.orderId)
      if (reservation) {
        if (!reservation.payments) {
          reservation.payments = []
        }
        reservation.payments.push(action.payload)
        
        // 重新计算已支付金额和其他费用
        const paidAmount = reservation.payments
          .filter((p: Payment) => p.type === 'payment')
          .reduce((sum: number, p: Payment) => sum + p.amount, 0)
        const refundAmount = reservation.payments
          .filter((p: Payment) => p.type === 'refund')
          .reduce((sum: number, p: Payment) => sum + p.amount, 0)
        const otherFees = reservation.payments
          .filter((p: Payment) => p.type === 'otherFee')
          .reduce((sum: number, p: Payment) => sum + p.amount, 0)
        
        reservation.paidAmount = paidAmount - refundAmount
        reservation.otherFees = otherFees
      }
    },

    // 更新预订支付信息
    updateReservationPayment: (state, action: PayloadAction<{ orderId: string; paidAmount: number; otherFees?: number }>) => {
      const reservation = state.reservations.find(r => r.orderId === action.payload.orderId)
      if (reservation) {
        reservation.paidAmount = action.payload.paidAmount
        if (action.payload.otherFees !== undefined) {
          reservation.otherFees = action.payload.otherFees
        }
      }
    },

    // 恢复持久化状态
    restoreState: (state, action: PayloadAction<CalendarState>) => {
      console.log('✅ [Redux] 恢复持久化状态:', action.payload)
      // 确保所有必需字段都存在（兼容旧版本数据）
      return {
        ...action.payload,
        payments: action.payload.payments || [],
        operationLogs: action.payload.operationLogs || [],
        roomTypes: action.payload.roomTypes || initialRoomTypes,
      }
    },
  },
})

export const {
  addReservation,
  cancelReservation,
  closeRoom,
  openRoom,
  addRoomType,
  updateRooms,
  setRoomDirty,
  clearRoomDirty,
  addOperationLog,
  saveRoomType,
  deleteRoomType,
  addRoomsToType,
  deleteRoom,
  addPayment,
  updateReservationPayment,
  restoreState,
} = calendarSlice.actions

export default calendarSlice.reducer

