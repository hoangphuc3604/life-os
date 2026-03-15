const API_BASE = import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8080/api'

export type ApiError = { message?: string; statusCode?: number }

const getToken = () => {
  try {
    return localStorage.getItem('access_token')
  } catch {
    return null
  }
}

const baseFetch = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err: ApiError = { 
      message: (body as { message?: string }).message ?? res.statusText, 
      statusCode: res.status 
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
