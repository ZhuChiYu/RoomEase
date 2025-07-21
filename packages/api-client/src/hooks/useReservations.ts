import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import type { PaginatedResponse } from '@roomease/shared'

interface Reservation {
  id: string
  checkInDate: Date
  checkOutDate: Date
  guestName: string
  guestPhone?: string
  guestEmail?: string
  guestCount: number
  childCount: number
  roomRate: number
  totalAmount: number
  paidAmount: number
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
  source?: string
  room: {
    id: string
    name: string
    code: string
  }
  property: {
    id: string
    name: string
  }
  createdAt: Date
  updatedAt: Date
}

interface ReservationFilters {
  page?: number
  limit?: number
  status?: string
  roomId?: string
  startDate?: Date
  endDate?: Date
  search?: string
}

interface CreateReservationData {
  roomId: string
  checkInDate: Date
  checkOutDate: Date
  guestName: string
  guestPhone?: string
  guestEmail?: string
  guestCount: number
  childCount?: number
  specialRequests?: string
  notes?: string
}

export function useReservations(filters: ReservationFilters = {}) {
  const queryClient = useQueryClient()

  const queryKey = ['reservations', filters]

  const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<Reservation>>(
    queryKey,
    () => apiClient.get('/reservations', { params: filters }).then(res => res.data),
    {
      keepPreviousData: true,
    }
  )

  const createMutation = useMutation<Reservation, Error, CreateReservationData>(
    (data) => apiClient.post('/reservations', data).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reservations'])
        queryClient.invalidateQueries(['calendar'])
      },
    }
  )

  const updateMutation = useMutation<Reservation, Error, { id: string; data: Partial<CreateReservationData> }>(
    ({ id, data }) => apiClient.put(`/reservations/${id}`, data).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reservations'])
        queryClient.invalidateQueries(['calendar'])
      },
    }
  )

  const deleteMutation = useMutation<void, Error, string>(
    (id) => apiClient.delete(`/reservations/${id}`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reservations'])
        queryClient.invalidateQueries(['calendar'])
      },
    }
  )

  const checkInMutation = useMutation<Reservation, Error, string>(
    (id) => apiClient.post(`/reservations/${id}/check-in`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reservations'])
      },
    }
  )

  const checkOutMutation = useMutation<Reservation, Error, string>(
    (id) => apiClient.post(`/reservations/${id}/check-out`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reservations'])
      },
    }
  )

  return {
    reservations: data?.data || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.page || 1,
    isLoading,
    error,
    refetch,
    create: createMutation.mutate,
    createLoading: createMutation.isLoading,
    createError: createMutation.error,
    update: updateMutation.mutate,
    updateLoading: updateMutation.isLoading,
    updateError: updateMutation.error,
    delete: deleteMutation.mutate,
    deleteLoading: deleteMutation.isLoading,
    deleteError: deleteMutation.error,
    checkIn: checkInMutation.mutate,
    checkInLoading: checkInMutation.isLoading,
    checkInError: checkInMutation.error,
    checkOut: checkOutMutation.mutate,
    checkOutLoading: checkOutMutation.isLoading,
    checkOutError: checkOutMutation.error,
  }
}

export function useReservation(id: string) {
  const { data, isLoading, error } = useQuery<Reservation>(
    ['reservations', id],
    () => apiClient.get(`/reservations/${id}`).then(res => res.data),
    {
      enabled: !!id,
    }
  )

  return {
    reservation: data,
    isLoading,
    error,
  }
} 