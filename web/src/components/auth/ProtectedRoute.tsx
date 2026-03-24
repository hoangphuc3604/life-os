import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useProfileQuery } from '@/hooks/useAuthQuery'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)
  const { data: profile, isPending, isError } = useProfileQuery()

  useEffect(() => {
    if (profile) setUser(profile)
  }, [profile, setUser])

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
