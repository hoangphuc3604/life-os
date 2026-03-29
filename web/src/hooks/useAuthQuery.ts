import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi, type LoginPayload, type RegisterPayload } from '@/lib/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { appToast } from '@/lib/toast'

export const authKeys = {
  profile: ['auth', 'profile'] as const,
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: async (data) => {
      setTokens(data.access_token, data.refresh_token)
      const profile = await authApi.getProfile()
      setUser(profile)
      queryClient.setQueryData(authKeys.profile, profile)
      appToast.success('Welcome back!')
      navigate('/', { replace: true })
    },
    onError: () => {
      appToast.error('Invalid username or password')
    },
  })
}

export function useRegisterMutation() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: async (_, variables) => {
      const data = await authApi.login({ username: variables.username, password: variables.password })
      setTokens(data.access_token, data.refresh_token)
      const profile = await authApi.getProfile()
      setUser(profile)
      queryClient.setQueryData(authKeys.profile, profile)
      appToast.success('Account created successfully!')
      navigate('/', { replace: true })
    },
    onError: () => {
      appToast.error('Registration failed. Please try again.')
    },
  })
}

export function useProfileQuery() {
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: authKeys.profile,
    queryFn: async () => {
      return await authApi.getProfile()
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  return useMutation({
    mutationFn: () => (refreshToken ? authApi.logout(refreshToken) : Promise.resolve({ message: 'OK' })),
    onSuccess: () => {
      logout()
      queryClient.removeQueries({ queryKey: authKeys.profile })
      appToast.success('Logged out successfully')
      navigate('/login', { replace: true })
    },
    onError: () => {
      appToast.error('Logout failed')
      logout()
      navigate('/login', { replace: true })
    },
  })
}
