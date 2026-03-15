import { create } from 'zustand';
import { Folder, Note } from '../lib/api/knowledge.api';

interface KnowledgeState {
  selectedFolderId: string | null;
  selectedNoteId: string | null;
  expandedFolders: Set<string>;
  searchOpen: boolean;
  sidebarOpen: boolean;
  
  setSelectedFolder: (folderId: string | null) => void;
  setSelectedNote: (noteId: string | null) => void;
  toggleFolderExpanded: (folderId: string) => void;
  setSearchOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  selectedFolderId: null,
  selectedNoteId: null,
  expandedFolders: new Set<string>(),
  searchOpen: false,
  sidebarOpen: true,
  
  setSelectedFolder: (folderId) => set({ selectedFolderId: folderId, selectedNoteId: null }),
  setSelectedNote: (noteId) => set({ selectedNoteId: noteId }),
  toggleFolderExpanded: (folderId) => set((state) => {
    const newExpanded = new Set(state.expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    return { expandedFolders: newExpanded };
  }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
