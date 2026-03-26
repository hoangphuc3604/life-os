import { Outlet, useMatches } from 'react-router-dom'
import { useEffect } from 'react'

type HandleProps = { title?: string }

export function RootLayout() {
  const matches = useMatches()

  useEffect(() => {
    const match = [...matches].reverse().find((m) => (m.handle as HandleProps)?.title)
    const title = (match?.handle as HandleProps)?.title
    document.title = title ? `${title} | LIFEOS` : 'LIFEOS'
  }, [matches])

  return (
    <div className="min-h-svh w-full bg-background text-foreground">
      <Outlet />
    </div>
  )
}
