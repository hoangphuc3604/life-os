import { Search, PanelLeft } from 'lucide-react'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { useSidebar } from '@/components/ui/sidebar'

export function TopBar() {
  const location = useLocation()
  const isKnowledge = location.pathname.startsWith('/knowledge')
  const setSearchOpen = useKnowledgeStore((s) => s.setSearchOpen)
  const { state, toggleSidebar } = useSidebar()
  const isSidebarCollapsed = state === 'collapsed'

  const handleSearchClick = () => {
    if (isKnowledge) {
      setSearchOpen(true)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      {isSidebarCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
        >
          <PanelLeft className="size-4" />
        </Button>
      )}
      <Button
        variant="outline"
        className="flex h-9 w-full max-w-sm justify-start gap-2 font-normal text-muted-foreground"
        onClick={handleSearchClick}
        aria-label="Search"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        {isKnowledge && (
          <Kbd>
            <span>⌘K</span>
          </Kbd>
        )}
      </Button>
    </header>
  )
}
