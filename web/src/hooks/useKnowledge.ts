import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  knowledgeApi,
  type CreateFolderDto,
  type UpdateFolderDto,
  type MoveFolderDto,
  type CreateNoteDto,
  type UpdateNoteDto,
  type MoveNoteDto,
  type CreateBlockDto,
  type UpdateBlockDto,
} from '../lib/api/knowledge.api'

export const useFolders = () => {
  const queryClient = useQueryClient()

  const foldersQuery = useQuery({
    queryKey: ['folders'],
    queryFn: () => knowledgeApi.folders.getAll(),
  })

  const createFolder = useMutation({
    mutationFn: (data: CreateFolderDto) => knowledgeApi.folders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  const updateFolder = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFolderDto }) =>
      knowledgeApi.folders.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  const deleteFolder = useMutation({
    mutationFn: (id: string) => knowledgeApi.folders.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  const moveFolder = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveFolderDto }) =>
      knowledgeApi.folders.move(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  return {
    folders: foldersQuery.data,
    isLoading: foldersQuery.isLoading,
    error: foldersQuery.error,
    createFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
    refetch: foldersQuery.refetch,
  }
}

export const useNotes = (folderId?: string) => {
  const queryClient = useQueryClient()

  const notesQuery = useQuery({
    queryKey: ['notes', folderId ?? 'all'],
    queryFn: () => knowledgeApi.notes.getAll(folderId),
  })

  const createNote = useMutation({
    mutationFn: (data: CreateNoteDto) => knowledgeApi.notes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  const updateNote = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteDto }) =>
      knowledgeApi.notes.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  const deleteNote = useMutation({
    mutationFn: (id: string) => knowledgeApi.notes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  const moveNote = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveNoteDto }) =>
      knowledgeApi.notes.move(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  return {
    notes: notesQuery.data,
    isLoading: notesQuery.isLoading,
    error: notesQuery.error,
    createNote,
    updateNote,
    deleteNote,
    moveNote,
    refetch: notesQuery.refetch,
  }
}

export const useNote = (noteId: string | null) => {
  const queryClient = useQueryClient()

  const noteQuery = useQuery({
    queryKey: ['note', noteId],
    queryFn: () => (noteId ? knowledgeApi.notes.getById(noteId) : null),
    enabled: !!noteId,
  })

  const updateNote = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteDto }) =>
      knowledgeApi.notes.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['note', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  const createBlock = useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: CreateBlockDto }) =>
      knowledgeApi.blocks.create(noteId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['note', variables.noteId] })
    },
  })

  const updateBlock = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBlockDto }) =>
      knowledgeApi.blocks.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', noteId] })
    },
  })

  const deleteBlock = useMutation({
    mutationFn: (id: string) => knowledgeApi.blocks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', noteId] })
    },
  })

  const reorderBlocks = useMutation({
    mutationFn: ({ noteId, blockIds }: { noteId: string; blockIds: string[] }) =>
      knowledgeApi.blocks.reorder(noteId, blockIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['note', variables.noteId] })
    },
  })

  return {
    note: noteQuery.data,
    isLoading: noteQuery.isLoading,
    error: noteQuery.error,
    updateNote,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    refetch: noteQuery.refetch,
  }
}

export const useSearch = () => {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  const searchQuery = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => knowledgeApi.search(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  })

  return {
    query,
    setQuery,
    results: searchQuery.data,
    isSearching: searchQuery.isFetching,
    error: searchQuery.error,
  }
}

export const useUpload = () => {
  const uploadMutation = useMutation({
    mutationFn: (file: File) => knowledgeApi.upload.image(file),
  })

  return {
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    error: uploadMutation.error,
  }
}
