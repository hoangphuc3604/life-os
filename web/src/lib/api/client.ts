const API_BASE = import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8080/api'
const AUTH_STORAGE_KEY = 'auth-storage'

export type ApiError = { message?: string; statusCode?: number }

interface PersistedAuthState {
  state: {
    accessToken: string | null
    refreshToken: string | null
  }
}

const readPersistedAuth = (): PersistedAuthState['state'] => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return { accessToken: null, refreshToken: null }
    return (JSON.parse(raw) as PersistedAuthState).state
  } catch {
    return { accessToken: null, refreshToken: null }
  }
}

const writePersistedAuth = (accessToken: string, refreshToken: string) => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    const current: PersistedAuthState = raw
      ? (JSON.parse(raw) as PersistedAuthState)
      : { state: { accessToken: null, refreshToken: null } }
    current.state.accessToken = accessToken
    current.state.refreshToken = refreshToken
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(current))
  } catch {
  }
}

const clearPersistedAuth = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
  }
}

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb)
}

const attemptTokenRefresh = async (): Promise<string | null> => {
  const { refreshToken } = readPersistedAuth()
  if (!refreshToken) return null

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    clearPersistedAuth()
    window.location.href = '/login'
    return null
  }

  const data = await res.json() as { access_token: string; refresh_token: string }
  writePersistedAuth(data.access_token, data.refresh_token)
  return data.access_token
}

const baseFetch = async <T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> => {
  const { accessToken } = readPersistedAuth()
  const headers = new Headers(options.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401 && retry) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        addRefreshSubscriber(async (newToken) => {
          try {
            const retryHeaders = new Headers(options.headers)
            retryHeaders.set('Authorization', `Bearer ${newToken}`)
            const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers: retryHeaders })
            if (!retryRes.ok) {
              const body = await retryRes.json().catch(() => ({}))
              reject({ message: (body as { message?: string }).message ?? retryRes.statusText, statusCode: retryRes.status } as ApiError)
            } else {
              const text = await retryRes.text()
              resolve((text ? JSON.parse(text) : undefined) as T)
            }
          } catch (e) {
            reject(e)
          }
        })
      })
    }

    isRefreshing = true
    const newToken = await attemptTokenRefresh()
    isRefreshing = false

    if (!newToken) {
      throw { message: 'Unauthorized', statusCode: 401 } as ApiError
    }

    onTokenRefreshed(newToken)
    return baseFetch<T>(path, options, false)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err: ApiError = {
      message: (body as { message?: string }).message ?? res.statusText,
      statusCode: res.status,
    }
    throw err
  }

  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export const apiClient = {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    let url = path
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) url += `?${queryString}`
    }
    return baseFetch<T>(url, { method: 'GET' })
  },

  post<T>(path: string, data?: unknown): Promise<T> {
    return baseFetch<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  patch<T>(path: string, data?: unknown): Promise<T> {
    return baseFetch<T>(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  delete<T>(path: string): Promise<T> {
    return baseFetch<T>(path, { method: 'DELETE' })
  },

  rawPost<T>(path: string, body: FormData | unknown): Promise<T> {
    const isFormData = body instanceof FormData
    return baseFetch<T>(path, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: body as BodyInit,
    })
  },
}
