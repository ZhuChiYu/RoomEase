import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dataService as api } from '../services/dataService'

// 打印当前使用的数据源
console.log('📊 数据源: 云服务API (带缓存)')

// Query Keys
export const QUERY_KEYS = {
  ROOMS: 'rooms',
  RESERVATIONS: 'reservations',
  RESERVATION: 'reservation',
  ROOM_STATUS: 'roomStatus',
  STATISTICS: 'statistics',
  DASHBOARD: 'dashboard',
  USER: 'user',
}

// 房间相关Hooks
export const useRooms = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.ROOMS],
    queryFn: api.rooms.getAll,
    staleTime: Infinity, // 本地数据不过期
  })
}

export const useRoom = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ROOMS, id],
    queryFn: () => api.rooms.getById(id),
    enabled: !!id,
  })
}

export const useCreateRoom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.rooms.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOMS] })
    },
  })
}

export const useUpdateRoom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.rooms.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOMS] })
    },
  })
}

export const useDeleteRoom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.rooms.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOMS] })
    },
  })
}

// 预订相关Hooks
export const useReservations = (params?: { startDate?: string; endDate?: string; status?: string }) => {
  return useQuery({
    queryKey: [QUERY_KEYS.RESERVATIONS, params],
    queryFn: () => api.reservations.getAll(params),
    staleTime: Infinity, // 本地数据不过期
  })
}

export const useReservation = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.RESERVATION, id],
    queryFn: () => api.reservations.getById(id),
    enabled: !!id,
  })
}

export const useCreateReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.reservations.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESERVATIONS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATUS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD] })
    },
  })
}

export const useUpdateReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.reservations.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESERVATIONS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATUS] })
    },
  })
}

export const useCancelReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.reservations.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESERVATIONS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATUS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD] })
    },
  })
}

export const useCheckIn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.reservations.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESERVATIONS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATUS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD] })
    },
  })
}

export const useCheckOut = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.reservations.checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESERVATIONS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATUS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD] })
    },
  })
}

// 房态相关Hooks
export const useRoomStatus = (startDate: string, endDate: string, propertyId: string = 'demo-property') => {
  return useQuery({
    queryKey: [QUERY_KEYS.ROOM_STATUS, startDate, endDate, propertyId],
    queryFn: () => api.roomStatus.getByDateRange(startDate, endDate, propertyId),
    staleTime: Infinity, // 本地数据不过期
    enabled: !!startDate && !!endDate,
  })
}

export const useSetRoomDirty = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, date }: { roomId: string; date: string }) =>
      api.roomStatus.setDirty(roomId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATUS] })
    },
  })
}

export const useSetRoomClean = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, date }: { roomId: string; date: string }) =>
      api.roomStatus.setClean(roomId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATUS] })
    },
  })
}

export const useCloseRoom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      roomId,
      startDate,
      endDate,
      note,
    }: {
      roomId: string
      startDate: string
      endDate: string
      note?: string
    }) => api.roomStatus.closeRoom(roomId, startDate, endDate, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROOM_STATUS] })
    },
  })
}

// 统计相关Hooks
export const useDashboard = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD],
    queryFn: api.statistics.getDashboard,
    staleTime: 30 * 1000, // 本地数据30秒刷新一次
    refetchInterval: 30 * 1000, // 每30秒自动刷新
  })
}

export const useOccupancyRate = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.STATISTICS, 'occupancy', startDate, endDate],
    queryFn: () => api.statistics.getOccupancyRate(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })
}

export const useRevenue = (year: number, month: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.STATISTICS, 'revenue', year, month],
    queryFn: () => api.statistics.getRevenue(year, month),
    enabled: !!year && !!month,
  })
}

// 用户相关Hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.USER],
    queryFn: api.auth.getCurrentUser,
    staleTime: 10 * 60 * 1000, // 10分钟
  })
}

