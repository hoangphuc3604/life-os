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

export interface SendOtpPayload {
  email: string
  type?: 'register' | 'reset_password'
}

export interface VerifyOtpPayload {
  email: string
  code: string
  type: string
}

export interface ResetPasswordPayload {
  email: string
  code: string
  newPassword: string
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<TokensResponse>('/auth/login', payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<UserProfile & { message: string }>('/auth/register', payload),

  refresh: (refreshToken: string) =>
    apiClient.post<TokensResponse>('/auth/refresh', { refresh_token: refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post<{ message: string }>('/auth/logout', { refresh_token: refreshToken }),

  getProfile: () =>
    apiClient.get<UserProfile>('/auth/profile'),

  sendOtp: (payload: SendOtpPayload) =>
    apiClient.post<{ message: string }>('/auth/otp/send', payload),

  verifyOtp: (payload: VerifyOtpPayload) =>
    apiClient.post<{ valid: boolean }>('/auth/otp/verify', payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<{ message: string }>('/auth/reset-password', payload),
}
