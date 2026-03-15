import { apiClient } from './client'

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
}

export interface TokensResponse {
  access_token: string
  refresh_token: string
}

export interface UserProfile {
  id: string
  username: string
  email: string
  roles: string[]
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient<TokensResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  register: (payload: RegisterPayload) =>
    apiClient<UserProfile>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  refresh: (refreshToken: string) =>
    apiClient<TokensResponse>('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  logout: (refreshToken: string) =>
    apiClient<{ message: string }>('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  getProfile: (accessToken: string) =>
    apiClient<UserProfile>('/auth/profile', { token: accessToken }),
}
