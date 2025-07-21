import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import type { CalendarDay } from '@roomease/shared'

interface CalendarFilters {
  roomId?: string
  startDate: Date
  endDate: Date
}

interface CalendarUpdateData {
  roomId: string
  date: Date
  price?: number
  minStay?: number
  maxStay?: number
  isBlocked?: boolean
  reason?: string
}

interface BatchUpdateData {
  roomId: string
  startDate: Date
  endDate: Date
  updates: {
    price?: number
    minStay?: number
    maxStay?: number
    isBlocked?: boolean
    reason?: string
  }
}

export function useCalendar(filters: CalendarFilters) {
  const queryClient = useQueryClient()

  const queryKey = ['calendar', filters]

  const { data, isLoading, error, refetch } = useQuery<CalendarDay[]>(
    queryKey,
    () => apiClient.get('/calendar', { params: filters }).then(res => res.data),
    {
      enabled: !!(filters.startDate && filters.endDate),
      keepPreviousData: true,
    }
  )

  const updateMutation = useMutation<void, Error, CalendarUpdateData>(
    (data) => apiClient.post('/calendar/update', data).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendar'])
      },
    }
  )

  const batchUpdateMutation = useMutation<void, Error, BatchUpdateData>(
    (data) => apiClient.post('/calendar/batch-update', data).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendar'])
      },
    }
  )

  return {
    calendarDays: data || [],
    isLoading,
    error,
    refetch,
    update: updateMutation.mutate,
    updateLoading: updateMutation.isLoading,
    updateError: updateMutation.error,
    batchUpdate: batchUpdateMutation.mutate,
    batchUpdateLoading: batchUpdateMutation.isLoading,
    batchUpdateError: batchUpdateMutation.error,
  }
} 