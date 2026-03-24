import { Search } from 'lucide-react'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { useLocation } from 'react-router-dom'

export function TopBar() {
  const location = useLocation()
  const isKnowledge = location.pathname.startsWith('/knowledge')
  const setSearchOpen = useKnowledgeStore((s) => s.setSearchOpen)

  const handleSearchClick = () => {
    if (isKnowledge) {
      setSearchOpen(true)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)] px-4">
      <button
        type="button"
        className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--code-bg)] px-3 py-2 text-sm text-[var(--text)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--text-h)] max-w-sm"
        onClick={handleSearchClick}
        aria-label="Search"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        {isKnowledge && (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[var(--border)] px-1.5 py-0.5 text-xs font-mono text-[var(--text)]">
            <span>⌘K</span>
          </kbd>
        )}
      </button>
    </header>
  )
}
