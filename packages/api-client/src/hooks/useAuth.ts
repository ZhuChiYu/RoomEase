import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  name: string
  phone: string
}

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: string
  tenant: {
    id: string
    name: string
    slug: string
  }
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading, error } = useQuery<User>('auth/profile', 
    () => apiClient.getCurrentUser().then(res => res.data),
    {
      retry: false,
      staleTime: Infinity,
    }
  )

  const loginMutation = useMutation<any, Error, LoginData>(
    (data) => apiClient.login(data.email, data.password),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('auth/profile')
      },
    }
  )

  const logoutMutation = useMutation(
    () => apiClient.logout(),
    {
      onSuccess: () => {
        queryClient.clear()
      },
    }
  )

  const registerMutation = useMutation<any, Error, RegisterData>(
    (data) => apiClient.post('/auth/register', data)
  )

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    loginLoading: loginMutation.isLoading,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
    logoutLoading: logoutMutation.isLoading,
    register: registerMutation.mutate,
    registerLoading: registerMutation.isLoading,
    registerError: registerMutation.error,
  }
} 