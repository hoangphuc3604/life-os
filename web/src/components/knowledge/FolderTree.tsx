import { useState } from 'react';
import { Folder, NoteSummary } from '@/lib/api/knowledge.api';
import { useFolders, useNotes } from '@/hooks/useKnowledge';
import { useKnowledgeStore } from '@/stores/knowledge.store';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Folder as FolderIcon, FileText, MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface FolderTreeItemProps {
  folder: Folder;
  level: number;
}

const FolderTreeItem = ({ folder, level }: FolderTreeItemProps) => {
  const { selectedFolderId, selectedNoteId, expandedFolders, setSelectedFolder, setSelectedNote, toggleFolderExpanded } = useKnowledgeStore();
  const { updateFolder, deleteFolder, moveFolder } = useFolders();
  const { notes } = useNotes(folder.id);
  
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  
  const handleRename = () => {
    if (editName.trim() && editName !== folder.name) {
      updateFolder.mutate({ id: folder.id, data: { name: editName.trim() } });
    }
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    if (confirm(`Delete folder "${folder.name}" and all its contents?`)) {
      deleteFolder.mutate(folder.id);
    }
  };
  
  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent group',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          setSelectedFolder(folder.id);
          toggleFolderExpanded(folder.id);
        }}
      >
        <button className="p-0.5 hover:bg-accent rounded">
          {folder.children.length > 0 ? (
            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <span className="w-4" />
          )}
        </button>
        
        <FolderIcon className="h-4 w-4 text-yellow-500" />
        
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            className="flex-1 bg-background border rounded px-1 text-sm"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate">{folder.name}</span>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {isExpanded && (
        <div>
          {folder.notes?.map((note) => (
            <div
              key={note.id}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent',
                selectedNoteId === note.id && 'bg-accent'
              )}
              style={{ paddingLeft: `${level * 12 + 32}px` }}
              onClick={() => setSelectedNote(note.id)}
            >
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm truncate">{note.icon} {note.title}</span>
            </div>
          ))}
          
          {folder.children.map((child) => (
            <FolderTreeItem key={child.id} folder={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree = () => {
  const { folders, isLoading, createFolder } = useFolders();
  const { selectedFolderId } = useKnowledgeStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder.mutate({ 
        name: newFolderName.trim(), 
        parentId: selectedFolderId || undefined 
      });
      setNewFolderName('');
      setIsCreating(false);
    }
  };
  
  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading...</div>;
  }
  
  return (
    <div className="p-2">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-muted-foreground uppercase">Folders</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {isCreating && (
        <div className="px-2 py-1">
          <input
            type="text"
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={handleCreateFolder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') setIsCreating(false);
            }}
            className="w-full bg-background border rounded px-2 py-1 text-sm"
            autoFocus
          />
        </div>
      )}
      
      {folders?.map((folder) => (
        <FolderTreeItem key={folder.id} folder={folder} level={0} />
      ))}
      
      {(!folders || folders.length === 0) && !isCreating && (
        <p className="px-2 py-4 text-sm text-muted-foreground text-center">
          No folders yet. Click + to create one.
        </p>
      )}
    </div>
  );
};
