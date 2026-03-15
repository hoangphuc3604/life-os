import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth.store'
import { useLogoutMutation } from '@/hooks/useAuthQuery'

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  const navItems: { label: string; icon: 'grid' | 'message' | 'settings'; active?: boolean }[] = [
    { label: 'Home', icon: 'grid', active: true },
    { label: 'Messages', icon: 'message' },
    { label: 'Settings', icon: 'settings' },
  ]

  const iconMap = {
    grid: (
      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    message: (
      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    settings: (
      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  }

  return (
    <aside
      className={`flex flex-col border-r border-[var(--border)] bg-[var(--bg)] transition-[width] ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--border)] px-4">
        {!collapsed && (
          <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
            <span className="text-lg font-semibold">P</span>
          </div>
        )}
        {collapsed && <div className="size-9" />}
        {!collapsed && (
          <span className="font-semibold text-[var(--text-h)]">Life OS</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className="size-5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
            style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto space-y-1 p-3">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              item.active === true
                ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                : 'text-[var(--text)] hover:bg-[var(--code-bg)]'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="size-5 shrink-0" aria-hidden>
              {iconMap[item.icon]}
            </span>
            {!collapsed && item.label}
          </button>
        ))}
        {!collapsed && (
          <>
            <div className="pt-4">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text)]">
                My projects
              </p>
              <div className="mt-2 space-y-0.5">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl bg-[var(--accent-bg)] px-3 py-2 text-left text-sm font-medium text-[var(--accent)]"
                >
                  <span className="size-2 rounded-full bg-[var(--accent)]" />
                  Mobile App
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--code-bg)]"
                >
                  <span className="size-2 rounded-full bg-orange-400" />
                  Website Redesign
                </button>
              </div>
            </div>
            <Card className="mt-4 border-[var(--border)] bg-[var(--social-bg)]">
              <CardContent className="p-4">
                <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74C19 5.14 15.86 2 12 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[var(--text-h)]">Thoughts Time</p>
                <p className="mt-0.5 text-xs text-[var(--text)]">Capture ideas quickly</p>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  Write a message
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </nav>
    </aside>
  )
}

function TopBar() {
  const user = useAuthStore((s) => s.user)
  const logoutMutation = useLogoutMutation()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="flex h-14 items-center gap-4 border-b border-[var(--border)] bg-[var(--bg)] px-6">
      <div className="flex flex-1 items-center rounded-xl border border-[var(--border)] bg-[var(--code-bg)] px-3 py-2">
        <svg className="mr-2 size-5 shrink-0 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search for anything..."
          className="w-full bg-transparent text-sm text-[var(--text-h)] outline-none placeholder:text-[var(--text)]"
          aria-label="Search"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Calendar">
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Help">
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </Button>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowUserMenu((v) => !v)}
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-[var(--code-bg)]"
          aria-expanded={showUserMenu}
          aria-haspopup="true"
        >
          <div className="flex flex-col items-end text-sm">
            <span className="font-medium text-[var(--text-h)]">{user?.username ?? 'User'}</span>
            <span className="text-xs text-[var(--text)]">{user?.email ?? ''}</span>
          </div>
          <div className="size-9 rounded-full bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent)] font-semibold">
            {(user?.username ?? 'U').slice(0, 1).toUpperCase()}
          </div>
          <svg className="size-4 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showUserMenu && (
          <>
            <div className="fixed inset-0 z-10" aria-hidden onClick={() => setShowUserMenu(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-[var(--border)] bg-[var(--bg)] py-1 shadow-[var(--shadow)]">
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-[var(--text-h)] hover:bg-[var(--code-bg)]"
                onClick={() => {
                  setShowUserMenu(false)
                  logoutMutation.mutate()
                }}
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

export function HomePage() {
  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-[var(--text-h)]">Mobile App</h1>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                Filter
              </Button>
              <Button variant="secondary" size="sm">
                Today
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[var(--accent)]" />
                  <span className="font-medium text-[var(--text-h)]">To Do</span>
                  <span className="text-sm text-[var(--text)]">0</span>
                </div>
                <p className="text-sm text-[var(--text)]">No tasks yet. Add one to get started.</p>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  +
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-orange-400" />
                  <span className="font-medium text-[var(--text-h)]">On Progress</span>
                  <span className="text-sm text-[var(--text)]">0</span>
                </div>
                <p className="text-sm text-[var(--text)]">Tasks in progress appear here.</p>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  +
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-blue-500" />
                  <span className="font-medium text-[var(--text-h)]">Done</span>
                  <span className="text-sm text-[var(--text)]">0</span>
                </div>
                <p className="text-sm text-[var(--text)]">Completed tasks.</p>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  +
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
