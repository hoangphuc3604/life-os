import { create } from 'zustand'

type ActiveView = 'all' | 'folder'

interface KnowledgeState {
  selectedFolderId: string | null
  selectedNoteId: string | null
  expandedFolders: Set<string>
  searchOpen: boolean
  sidebarOpen: boolean
  isDirty: boolean
  activeView: ActiveView

  setSelectedFolder: (folderId: string | null) => void
  setSelectedNote: (noteId: string | null) => void
  toggleFolderExpanded: (folderId: string) => void
  setSearchOpen: (open: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setDirty: (dirty: boolean) => void
  setActiveView: (view: ActiveView) => void
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  selectedFolderId: null,
  selectedNoteId: null,
  expandedFolders: new Set<string>(),
  searchOpen: false,
  sidebarOpen: true,
  isDirty: false,
  activeView: 'all',

  setSelectedFolder: (folderId) =>
    set({ selectedFolderId: folderId, selectedNoteId: null, activeView: folderId ? 'folder' : 'all' }),
  setSelectedNote: (noteId) => set({ selectedNoteId: noteId }),
  toggleFolderExpanded: (folderId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders)
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId)
      } else {
        newExpanded.add(folderId)
      }
      return { expandedFolders: newExpanded }
    }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setActiveView: (view) => set({ activeView: view }),
}))
