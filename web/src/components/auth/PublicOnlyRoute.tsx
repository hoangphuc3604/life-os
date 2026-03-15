import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

interface PublicOnlyRouteProps {
  children: React.ReactNode
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}
