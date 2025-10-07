import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { CalendarState, Room, Reservation, RoomStatusData, RoomType } from './types'

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

const initialState: CalendarState = {
  rooms: initialRooms,
  reservations: [],
  roomStatuses: [],
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
      const { roomId, checkInDate, checkOutDate, id } = action.payload
      const startDate = new Date(checkInDate)
      const endDate = new Date(checkOutDate)
      
      console.log('🔄 [Redux] 添加房态记录:', { roomId, checkInDate, checkOutDate })
      
      // 为预订期间的每一天创建房态记录
      let addedCount = 0
      for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0]
        state.roomStatuses.push({
          roomId,
          date: dateStr,
          status: 'occupied',
          reservationId: id,
        })
        addedCount++
        console.log(`  ✅ [Redux] 添加房态: ${dateStr} - 房间${roomId}`)
      }
      
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
      }
    },

    // 关房
    closeRoom: (state, action: PayloadAction<{ roomId: string; startDate: string; endDate: string; note?: string }>) => {
      const { roomId, startDate, endDate, note } = action.payload
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // 为关房期间的每一天创建房态记录
      for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0]
        
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

    // 添加房型
    addRoomType: (state, action: PayloadAction<{ rooms: Room[] }>) => {
      state.rooms.push(...action.payload.rooms)
    },

    // 删除房型（删除所有该类型的房间）
    deleteRoomType: (state, action: PayloadAction<RoomType>) => {
      state.rooms = state.rooms.filter(room => room.type !== action.payload)
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

    // 恢复持久化状态
    restoreState: (state, action: PayloadAction<CalendarState>) => {
      console.log('✅ [Redux] 恢复持久化状态:', action.payload)
      return action.payload
    },
  },
})

export const {
  addReservation,
  cancelReservation,
  closeRoom,
  openRoom,
  addRoomType,
  deleteRoomType,
  updateRooms,
  setRoomDirty,
  clearRoomDirty,
  restoreState,
} = calendarSlice.actions

export default calendarSlice.reducer

