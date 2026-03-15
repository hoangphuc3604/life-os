import { apiClient } from '../api/client';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
  children: Folder[];
  notes: NoteSummary[];
}

export interface NoteSummary {
  id: string;
  title: string;
  icon: string | null;
  position: number;
}

export interface Note {
  id: string;
  title: string;
  icon: string | null;
  cover: string | null;
  isArchived: boolean;
  isPublished: boolean;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
  blocks: Block[];
}

export interface Block {
  id: string;
  type: string;
  content: Record<string, any>;
  properties: Record<string, any>;
  position: number;
  parentId: string | null;
}

export interface CreateFolderDto {
  name: string;
  parentId?: string;
}

export interface UpdateFolderDto {
  name?: string;
}

export interface MoveFolderDto {
  parentId?: string;
  position?: number;
}

export interface CreateNoteDto {
  title?: string;
  folderId?: string;
  icon?: string;
  cover?: string;
  addFirstBlock?: boolean;
}

export interface UpdateNoteDto {
  title?: string;
  icon?: string;
  cover?: string;
  isArchived?: boolean;
  isPublished?: boolean;
}

export interface MoveNoteDto {
  folderId?: string;
  position?: number;
}

export interface CreateBlockDto {
  type?: string;
  content?: Record<string, any>;
  properties?: Record<string, any>;
  parentId?: string;
}

export interface UpdateBlockDto {
  type?: string;
  content?: Record<string, any>;
  properties?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  title: string;
  icon: string | null;
  cover: string | null;
  highlight: string;
  updatedAt: string;
}

export const knowledgeApi = {
  folders: {
    getAll: () => apiClient.get<Folder[]>('/knowledge/folders'),
    getById: (id: string) => apiClient.get<Folder>(`/knowledge/folders/${id}`),
    create: (data: CreateFolderDto) => apiClient.post<Folder>('/knowledge/folders', data),
    update: (id: string, data: UpdateFolderDto) => apiClient.patch<Folder>(`/knowledge/folders/${id}`, data),
    delete: (id: string) => apiClient.delete<void>(`/knowledge/folders/${id}`),
    move: (id: string, data: MoveFolderDto) => apiClient.patch<Folder>(`/knowledge/folders/${id}/move`, data),
  },
  notes: {
    getAll: (folderId?: string) => apiClient.get<Note[]>('/knowledge/notes', { folderId }),
    getById: (id: string) => apiClient.get<Note>(`/knowledge/notes/${id}`),
    create: (data: CreateNoteDto) => apiClient.post<Note>('/knowledge/notes', data),
    update: (id: string, data: UpdateNoteDto) => apiClient.patch<Note>(`/knowledge/notes/${id}`, data),
    delete: (id: string) => apiClient.delete<void>(`/knowledge/notes/${id}`),
    move: (id: string, data: MoveNoteDto) => apiClient.patch<Note>(`/knowledge/notes/${id}/move`, data),
  },
  blocks: {
    getByNoteId: (noteId: string) => apiClient.get<Block[]>(`/knowledge/notes/${noteId}/blocks`),
    create: (noteId: string, data: CreateBlockDto) => apiClient.post<Block>(`/knowledge/notes/${noteId}/blocks`, data),
    update: (id: string, data: UpdateBlockDto) => apiClient.patch<Block>(`/knowledge/blocks/${id}`, data),
    delete: (id: string) => apiClient.delete<void>(`/knowledge/blocks/${id}`),
    reorder: (noteId: string, blockIds: string[]) => 
      apiClient.patch<void>(`/knowledge/notes/${noteId}/blocks/reorder`, { blocks: blockIds.map(id => ({ id })) }),
  },
  search: (query: string, limit = 20, offset = 0) => 
    apiClient.get<SearchResult[]>('/knowledge/search', { q: query, limit, offset }),
  upload: {
    image: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.rawPost<{ url: string }>('/knowledge/upload', formData);
      return response;
    }
  }
};
