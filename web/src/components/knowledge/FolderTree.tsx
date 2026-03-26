import { useState, useRef, useCallback } from 'react'
import { useFolders, useNotes } from '@/hooks/useKnowledge'
import { knowledgeApi } from '@/lib/api/knowledge.api'
import { useQueryClient } from '@tanstack/react-query'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { type Folder, type Note } from '@/lib/api/knowledge.api'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
  FolderPlus,
  FileText,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  FilePlus,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

function SkeletonItem({ indent = 0 }: { indent?: number }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5" style={{ paddingLeft: `${indent + 8}px` }}>
      <div className="size-4 rounded bg-muted animate-pulse" />
      <div className="h-3 w-24 rounded bg-muted animate-pulse" />
    </div>
  )
}

interface NoteItemProps {
  note: Pick<Note, 'id' | 'title'> & { icon?: string | null }
  indent: number
}

function NoteItem({ note, indent }: NoteItemProps) {
  const { selectedNoteId, setSelectedNote } = useKnowledgeStore()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(note.title || 'Untitled')
  const inputRef = useRef<HTMLInputElement>(null)

  const isSelected = selectedNoteId === note.id

  const commitRename = useCallback(() => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== note.title) {
      const oldTitle = note.title

      // Update folders cache (used by FolderTree for rendering note titles)
      queryClient.setQueryData<(Folder & { notes?: { title: string }[] })[]>(['folders'], (old) => {
        if (!old) return old
        return old.map((folder) => ({
          ...folder,
          notes: folder.notes?.map((n) =>
            n.id === note.id ? { ...n, title: trimmed } : n,
          ),
        }))
      })

      // Update note detail cache (used by NoteEditor)
      queryClient.setQueryData(['note', note.id], (old: any) =>
        old ? { ...old, title: trimmed } : old,
      )

      knowledgeApi.notes.update(note.id, { title: trimmed }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['notes'] })
        queryClient.invalidateQueries({ queryKey: ['folders'] })
        queryClient.invalidateQueries({ queryKey: ['note', note.id] })
      }).catch(() => {
        // Revert on failure
        queryClient.setQueryData<(Folder & { notes?: { title: string }[] })[]>(['folders'], (old) => {
          if (!old) return old
          return old.map((folder) => ({
            ...folder,
            notes: folder.notes?.map((n) =>
              n.id === note.id ? { ...n, title: oldTitle } : n,
            ),
          }))
        })
        queryClient.setQueryData(['note', note.id], (old: any) =>
          old ? { ...old, title: oldTitle } : old,
        )
      })
    } else {
      setEditName(note.title || 'Untitled')
    }
    setIsEditing(false)
  }, [editName, note.id, note.title, queryClient])

  const handleDelete = () => {
    if (confirm(`Delete "${note.title || 'Untitled'}"?`)) {
      knowledgeApi.notes.delete(note.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['notes'] })
        queryClient.invalidateQueries({ queryKey: ['folders'] })
        queryClient.invalidateQueries({ queryKey: ['note', note.id] })
      })
    }
  }

  return (
    <div className="group flex items-center gap-1 rounded-lg py-1.5 cursor-pointer transition-colors"
      style={{ paddingLeft: `${indent}px`, paddingRight: '4px' }}
      onClick={() => setSelectedNote(note.id)}
    >
      <FileText className="size-4 shrink-0 opacity-60" />

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') {
              setEditName(note.title || 'Untitled')
              setIsEditing(false)
            }
          }}
          className="flex-1 min-w-0 bg-transparent border border-primary rounded px-1 text-sm text-foreground outline-none"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className={cn(
            'flex-1 truncate text-sm',
            isSelected ? 'text-foreground font-medium' : 'text-muted-foreground',
          )}
          onDoubleClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
        >
          {note.icon ? `${note.icon} ${note.title}` : note.title || 'Untitled'}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
          >
            <Pencil className="size-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
          >
            <Trash2 className="size-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface FolderItemProps {
  folder: Folder
  level: number
}

function FolderItem({ folder, level }: FolderItemProps) {
  const {
    selectedFolderId,
    expandedFolders,
    setSelectedFolder,
    setSelectedNote,
    toggleFolderExpanded,
  } = useKnowledgeStore()
  const { updateFolder, deleteFolder, createFolder } = useFolders()
  const { createNote } = useNotes(folder.id)

  const isExpanded = expandedFolders.has(folder.id)
  const isSelected = selectedFolderId === folder.id

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(folder.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const indent = level * 12 + 8

  const commitRename = useCallback(() => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== folder.name) {
      updateFolder.mutate({ id: folder.id, data: { name: trimmed } })
    } else {
      setEditName(folder.name)
    }
    setIsEditing(false)
  }, [editName, folder.id, folder.name, updateFolder])

  const handleDelete = () => {
    if (confirm(`Delete "${folder.name}" and all its contents?`)) {
      deleteFolder.mutate(folder.id)
    }
  }

  const handleAddNote = () => {
    createNote.mutate(
      { title: 'Untitled', folderId: folder.id },
      { onSuccess: (note: Note) => setSelectedNote(note.id) },
    )
    if (!isExpanded) toggleFolderExpanded(folder.id)
  }

  const handleAddFolder = () => {
    createFolder.mutate({ name: 'Untitled', parentId: folder.id })
    if (!isExpanded) toggleFolderExpanded(folder.id)
  }

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-lg py-1.5 cursor-pointer transition-colors',
          isSelected
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
        style={{ paddingLeft: `${indent}px`, paddingRight: '4px' }}
        onClick={() => {
          setSelectedFolder(folder.id)
          toggleFolderExpanded(folder.id)
        }}
      >
        <span className="size-4 flex items-center justify-center shrink-0">
          {folder.children.length > 0 || (folder.notes && folder.notes.length > 0) ? (
            isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )
          ) : null}
        </span>

        <FolderIcon className="size-4 shrink-0 text-yellow-500" />

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') {
                setEditName(folder.name)
                setIsEditing(false)
              }
            }}
            className="flex-1 min-w-0 bg-transparent border border-primary rounded px-1 text-sm outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-sm truncate"
            onDoubleClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
          >
            {folder.name}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={handleAddNote}>
              <FilePlus className="size-4 mr-2" />
              New note
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddFolder}>
              <FolderPlus className="size-4 mr-2" />
              New folder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
            >
              <Pencil className="size-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500"
              onClick={handleDelete}
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && (
        <div>
          {folder.notes?.map((note) => (
            <NoteItem key={note.id} note={note} indent={indent + 20} />
          ))}
          {folder.children.map((child) => (
            <FolderItem key={child.id} folder={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function AllNotesSection() {
  const { selectedFolderId, setSelectedFolder, activeView } = useKnowledgeStore()
  const { notes } = useNotes(undefined)
  const isSelected = activeView === 'all' && !selectedFolderId

  return (
    <div className="mb-1">
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
          isSelected
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
        onClick={() => setSelectedFolder(null)}
      >
        <FileText className="size-4 shrink-0" />
        <span>All Notes</span>
        {notes && (
          <span className="ml-auto text-xs text-muted-foreground">{notes.length}</span>
        )}
      </button>
    </div>
  )
}

export const FolderTree = () => {
  const { folders, isLoading, createFolder } = useFolders()
  const { selectedFolderId } = useKnowledgeStore()
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const handleCreateFolder = () => {
    const name = newFolderName.trim()
    if (name) {
      createFolder.mutate({
        name,
        parentId: selectedFolderId ?? undefined,
      })
    }
    setNewFolderName('')
    setIsCreating(false)
  }

  return (
    <div className="p-2">
      <AllNotesSection />

      <div className="flex items-center justify-between px-2 py-1 mt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Folders
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => setIsCreating(true)}
          aria-label="New folder"
        >
          <Plus className="size-3.5" />
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
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') setIsCreating(false)
            }}
            className="w-full rounded-lg border border-primary bg-background px-2 py-1.5 text-sm outline-none"
            autoFocus
          />
        </div>
      )}

      {isLoading ? (
        <>
          <SkeletonItem />
          <SkeletonItem indent={4} />
          <SkeletonItem />
        </>
      ) : (
        <>
          {folders?.map((folder) => (
            <FolderItem key={folder.id} folder={folder} level={0} />
          ))}
          {(!folders || folders.length === 0) && !isCreating && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No folders yet
            </p>
          )}
        </>
      )}
    </div>
  )
}
