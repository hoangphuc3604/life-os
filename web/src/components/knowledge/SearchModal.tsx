import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useSearch } from '@/hooks/useKnowledge'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { Search, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Kbd } from '@/components/ui/kbd'

export const SearchModal = () => {
  const { searchOpen, setSearchOpen, setSelectedNote } = useKnowledgeStore()
  const { query, setQuery, results, isSearching } = useSearch()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSearchOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  const handleSelect = useCallback(
    (noteId: string) => {
      setSelectedNote(noteId)
      setSearchOpen(false)
      setQuery('')
    },
    [setSelectedNote, setSearchOpen, setQuery],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = results[selectedIndex]
      if (item) handleSelect(item.id)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setSearchOpen(open)
    if (!open) setQuery('')
  }

  const isEmpty = !query && (!results || results.length === 0)
  const noResults = query.length > 1 && !isSearching && results?.length === 0

  return (
    <Dialog open={searchOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-12 border-b">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            autoFocus
          />
          {isSearching && (
            <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
          )}
        </div>

        <div ref={listRef} className="max-h-[360px] overflow-y-auto knowledge-scrollbar">
          {isEmpty && (
            <div className="p-4 text-center">
              <Search className="size-8 mx-auto mb-2 text-border" />
              <p className="text-sm text-muted-foreground">Type to search your notes</p>
            </div>
          )}

          {noResults && (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No results for "{query}"</p>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="py-1">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-accent'
                      : 'hover:bg-muted',
                  )}
                  onClick={() => handleSelect(result.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <FileText className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {result.icon} {result.title}
                    </p>
                    {result.highlight && (
                      <p
                        className="text-xs text-muted-foreground truncate mt-0.5"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-4 py-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Kbd>↑↓</Kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd>
              open
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Esc</Kbd>
              close
            </span>
          </div>
          <span className="text-xs text-muted-foreground">⌘K</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
