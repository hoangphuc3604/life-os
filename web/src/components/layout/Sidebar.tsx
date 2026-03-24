import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Settings, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'
import { useLogoutMutation } from '@/hooks/useAuthQuery'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home', icon: LayoutDashboard, href: '/' },
  { label: 'Knowledge', icon: BookOpen, href: '/knowledge' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logoutMutation = useLogoutMutation()

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-[var(--border)] bg-[var(--bg)] transition-[width] duration-200 shrink-0',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--border)] px-4">
        {!collapsed && (
          <>
            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white shrink-0">
              <span className="text-sm font-bold">L</span>
            </div>
            <span className="font-semibold text-[var(--text-h)] truncate">Life OS</span>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('ml-auto shrink-0', collapsed && 'mx-auto')}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                  : 'text-[var(--text)] hover:bg-[var(--code-bg)] hover:text-[var(--text-h)]',
                collapsed && 'justify-center px-2',
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="size-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={cn('border-t border-[var(--border)] p-2', collapsed && 'flex justify-center')}>
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="flex size-8 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[var(--accent)] text-sm font-semibold shrink-0">
              {(user?.username ?? 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-h)] truncate">{user?.username ?? 'User'}</p>
              <p className="text-xs text-[var(--text)] truncate">{user?.email ?? ''}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={() => logoutMutation.mutate()}
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => logoutMutation.mutate()}
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        )}
      </div>
    </aside>
  )
}
