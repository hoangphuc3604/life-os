import { Outlet } from 'react-router-dom'

export function RootLayout() {
  return (
    <div className="min-h-svh w-full bg-[var(--bg)] text-[var(--text)]">
      <Outlet />
    </div>
  )
}
