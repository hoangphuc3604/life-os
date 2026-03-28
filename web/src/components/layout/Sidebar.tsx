import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useLogoutMutation } from '@/hooks/useAuthQuery'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'

const navItems = [
  { label: 'Home', icon: LayoutDashboard, href: '/' },
  { label: 'Knowledge', icon: BookOpen, href: '/knowledge' },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logoutMutation = useLogoutMutation()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <SidebarUI>
      <SidebarHeader className="h-16 border-b flex flex-row items-center px-4 gap-3">
        <NavLink to="/" replace className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-border/60 cursor-pointer">
          <img
            src="/logo-removebg-preview.png"
            alt="LIFEOS"
            className="h-full w-full object-cover object-center"
          />
        </NavLink>
        {!isCollapsed && (
          <NavLink to="/" replace className="font-bold text-lg text-foreground truncate cursor-pointer hover:opacity-80 transition-opacity">
            LIFEOS
          </NavLink>
        )}
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu className="space-y-1">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                tooltip={item.label}
                className="h-10"
              >
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                >
                  <item.icon className="size-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            {!isCollapsed ? (
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl h-12 w-full overflow-hidden">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {(user?.username ?? 'U').slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate leading-tight">
                    {user?.username ?? 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate leading-tight">
                    {user?.email ?? ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 hover:text-destructive"
                  onClick={() => logoutMutation.mutate()}
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            ) : (
              <SidebarMenuButton
                tooltip="Sign out"
                className="mx-auto"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="size-4" />
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarUI>
  )
}
