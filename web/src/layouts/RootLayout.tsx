import { Outlet } from 'react-router-dom'

export function RootLayout() {
  return (
    <div className="min-h-svh w-full bg-background text-foreground">
      <Outlet />
    </div>
  )
}
