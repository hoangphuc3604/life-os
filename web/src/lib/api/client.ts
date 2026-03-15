const API_BASE = import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:8000'

export type ApiError = { message?: string; statusCode?: number }

export async function apiClient<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err: ApiError = { message: (body as { message?: string }).message ?? res.statusText, statusCode: res.status }
    throw err
  }
  return res.json() as Promise<T>
}
