import { useKnowledgeStore } from '@/stores/knowledge.store'
import { FolderTree } from './FolderTree'
import { NoteEditor } from './NoteEditor'
import { useNotes } from '@/hooks/useKnowledge'
import { Button } from '@/components/ui/button'
import { Plus, Search, PanelLeft, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

function EmptyState() {
  const { setSelectedNote, selectedFolderId } = useKnowledgeStore()
  const { createNote } = useNotes(selectedFolderId ?? undefined)

  const handleCreate = () => {
    createNote.mutate(
      { title: 'Untitled', folderId: selectedFolderId ?? undefined },
      { onSuccess: (note) => setSelectedNote(note.id) },
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center max-w-sm px-6">
        <div className="mb-6 flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-[var(--accent-bg)]">
            <BookOpen className="size-10 text-[var(--accent)]" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-h)] mb-2">No note selected</h2>
        <p className="text-sm text-[var(--text)] mb-6">
          Choose a note from the sidebar or create a new one to start writing.
        </p>
        <Button onClick={handleCreate} disabled={createNote.isPending}>
          <Plus className="size-4 mr-2" />
          New Note
        </Button>
      </div>
    </div>
  )
}

export const KnowledgeLayout = () => {
  const { selectedNoteId, sidebarOpen, setSidebarOpen, setSearchOpen } = useKnowledgeStore()

  return (
    <div className="flex h-full relative">
      <div
        className={cn(
          'border-r border-[var(--border)] bg-[var(--bg)] transition-[width] duration-200 overflow-hidden shrink-0 flex flex-col',
          sidebarOpen ? 'w-[260px]' : 'w-0',
        )}
      >
        <div className="w-[260px] flex flex-col h-full">
          <div className="flex items-center gap-1 px-3 h-12 border-b border-[var(--border)] shrink-0">
            <BookOpen className="size-4 text-[var(--accent)] shrink-0" />
            <span className="flex-1 text-sm font-semibold text-[var(--text-h)]">Knowledge</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setSearchOpen(true)}
              aria-label="Search notes"
            >
              <Search className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <PanelLeft className="size-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto knowledge-scrollbar">
            <FolderTree />
          </div>
        </div>
      </div>

      {!sidebarOpen && (
        <button
          type="button"
          className="absolute left-0 top-3 z-10 flex size-7 items-center justify-center rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:text-[var(--text-h)] shadow-sm transition-colors"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <PanelLeft className="size-4 rotate-180" />
        </button>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {selectedNoteId ? <NoteEditor noteId={selectedNoteId} /> : <EmptyState />}
      </div>
    </div>
  )
}
