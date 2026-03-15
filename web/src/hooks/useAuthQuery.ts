import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi, type LoginPayload, type RegisterPayload } from '@/lib/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'

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
      const profile = await authApi.getProfile(data.access_token)
      setUser(profile)
      queryClient.setQueryData(authKeys.profile, profile)
      navigate('/', { replace: true })
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
      const profile = await authApi.getProfile(data.access_token)
      setUser(profile)
      queryClient.setQueryData(authKeys.profile, profile)
      navigate('/', { replace: true })
    },
  })
}

export function useProfileQuery() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const setTokens = useAuthStore((s) => s.setTokens)
  const logout = useAuthStore((s) => s.logout)

  return useQuery({
    queryKey: authKeys.profile,
    queryFn: async () => {
      if (!accessToken) return null
      try {
        return await authApi.getProfile(accessToken)
      } catch {
        if (!refreshToken) {
          logout()
          throw new Error('Unauthorized')
        }
        try {
          const data = await authApi.refresh(refreshToken)
          setTokens(data.access_token, data.refresh_token)
          return await authApi.getProfile(data.access_token)
        } catch {
          logout()
          throw new Error('Unauthorized')
        }
      }
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
      navigate('/login', { replace: true })
    },
  })
}
