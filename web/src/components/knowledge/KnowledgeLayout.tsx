import { useKnowledgeStore } from '@/stores/knowledge.store';
import { FolderTree } from './FolderTree';
import { NoteEditor } from './NoteEditor';
import { SearchModal } from './SearchModal';
import { useNotes, useFolders } from '@/hooks/useKnowledge';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, Menu, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export const KnowledgeLayout = () => {
  const { selectedFolderId, selectedNoteId, sidebarOpen, setSidebarOpen, setSearchOpen } = useKnowledgeStore();
  const { notes, createNote } = useNotes(selectedFolderId || undefined);
  const { createFolder } = useFolders();
  const [creatingNote, setCreatingNote] = useState(false);
  
  const handleCreateNote = () => {
    createNote.mutate({
      title: 'Untitled',
      folderId: selectedFolderId || undefined,
      addFirstBlock: true,
    });
  };
  
  const handleCreateFolder = () => {
    createFolder.mutate({
      name: 'New Folder',
      parentId: selectedFolderId || undefined,
    });
  };
  
  return (
    <div className="flex h-full">
      <div className={cn(
        "border-r bg-card transition-all duration-200",
        sidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="w-64 h-full flex flex-col">
          <div className="p-2 border-b flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm">Knowledge</span>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-2 border-b flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleCreateNote}
            >
              <Plus className="h-3 w-3 mr-1" />
              Note
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleCreateFolder}
            >
              <Plus className="h-3 w-3 mr-1" />
              Folder
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto">
            <FolderTree />
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        {selectedNoteId ? (
          <NoteEditor noteId={selectedNoteId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">No note selected</p>
              <p className="text-sm mb-4">Select a note from the sidebar or create a new one</p>
              <Button onClick={handleCreateNote}>
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <SearchModal />
    </div>
  );
};
