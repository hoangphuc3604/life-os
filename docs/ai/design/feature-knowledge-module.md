---
phase: design
title: Module Knowledge - System Design
description: Thiết kế kiến trúc kỹ thuật cho Module Knowledge với cấu trúc cây thư mục, block-based editor và full-text search
---

# System Design & Architecture

## Architecture Overview
**Cấu trúc hệ thống cấp cao:**

- **Microservices Architecture:** Module Knowledge sẽ là một service riêng biệt trong hệ thống LifeOS
- **Diagram:**
  ```mermaid
  graph TD
    Client[Web Client] -->|HTTPS/JSON| Gateway[API Gateway]
    Gateway -->|/knowledge/*| Knowledge[Knowledge Service]
    Knowledge --> Postgres[(PostgreSQL)]
    Knowledge -->|Upload| Storage[Local/S3 Storage]
    Client -->|WebSocket| Knowledge
  ```
- **Key Components:**
  - **API Gateway:** Định tuyến request đến Knowledge Service, validate JWT
  - **Knowledge Service:** Xử lý CRUD notes/folders, quản lý tree structure, block content, search
  - **PostgreSQL:** Lưu trữ folders, notes, blocks với JSONB content
  - **Storage:** Lưu trữ images upload (local filesystem hoặc S3)
- **Technology Stack:**
  - **Runtime:** Node.js
  - **Language:** TypeScript
  - **Framework:** NestJS
  - **Database:** PostgreSQL với Prisma ORM
  - **Editor:** Tiptap (React-based block editor)
  - **Drag & Drop:** @dnd-kit/core

## Data Models
**Dữ liệu cần quản lý:**

### Folder Table
Lưu trữ cấu trúc cây thư mục.
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `userId` | UUID | Foreign Key -> User.id |
| `name` | VARCHAR(255) | Tên thư mục |
| `parentId` | UUID | Null nếu là root folder |
| `position` | INTEGER | Thứ tự sắp xếp trong cùng cấp |
| `createdAt` | TIMESTAMP | |
| `updatedAt` | TIMESTAMP | |

### Note Table
Lưu trữ ghi chú với metadata.
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `userId` | UUID | Foreign Key -> User.id |
| `folderId` | UUID | Foreign Key -> Folder.id, có thể null |
| `title` | VARCHAR(255) | Tiêu đề ghi chú |
| `icon` | VARCHAR(50) | Emoji icon (notion style) |
| `cover` | VARCHAR(500) | URL cover image |
| `isArchived` | BOOLEAN | Default: false |
| `isPublished` | BOOLEAN | Default: false |
| `position` | INTEGER | Thứ tự sắp xếp |
| `createdAt` | TIMESTAMP | |
| `updatedAt` | TIMESTAMP | |

### Block Table
Lưu trữ nội dung block-based (mỗi note có nhiều blocks).
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `noteId` | UUID | Foreign Key -> Note.id |
| `type` | VARCHAR(50) | paragraph, heading, image, code, link, nestedNote |
| `content` | JSONB | Nội dung block (text, src, language, url, noteId...) |
| `properties` | JSONB | Các thuộc tính bổ sung (bold, italic, color...) |
| `position` | INTEGER | Thứ tự trong note |
| `parentId` | UUID | Block cha (cho nested blocks) |
| `createdAt` | TIMESTAMP | |
| `updatedAt` | TIMESTAMP | |

### Note Search Index
PostgreSQL Full-text search index.
| Column | Type | Description |
|---|---|---|
| `noteId` | UUID | Primary Key, Foreign Key -> Note.id |
| `searchVector` | TSVECTOR | Tổng hợp từ title + block content |

## API Design
**Cách các component giao tiếp:**

### REST Endpoints:

#### Folders
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/folders | Lấy danh sách folders (tree structure) |
| GET | /api/folders/:id | Lấy chi tiết folder |
| POST | /api/folders | Tạo folder mới |
| PATCH | /api/folders/:id | Cập nhật folder |
| DELETE | /api/folders/:id | Xóa folder |
| PATCH | /api/folders/:id/move | Di chuyển folder (drag & drop) |

#### Notes
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/notes | Lấy danh sách notes (có filter by folder) |
| GET | /api/notes/:id | Lấy chi tiết note với blocks |
| POST | /api/notes | Tạo note mới |
| PATCH | /api/notes/:id | Cập nhật note metadata |
| DELETE | /api/notes/:id | Xóa note |
| PATCH | /api/notes/:id/move | Di chuyển note (drag & drop) |

#### Blocks
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/notes/:noteId/blocks | Thêm block mới |
| PATCH | /api/blocks/:id | Cập nhật block |
| DELETE | /api/blocks/:id | Xóa block |
| PATCH | /api/blocks/reorder | Sắp xếp lại blocks |

#### Search
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/search?q=keyword | Full-text search notes |

#### Media
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/upload | Upload image |

### Request/Response Formats:

**GET /api/folders Response:**
```json
{
  "folders": [
    {
      "id": "uuid",
      "name": "Work",
      "parentId": null,
      "position": 0,
      "children": [
        {
          "id": "uuid",
          "name": "Projects",
          "parentId": "parent-uuid",
          "position": 0,
          "children": []
        }
      ],
      "notes": [
        {
          "id": "uuid",
          "title": "Project A",
          "icon": "📁",
          "position": 0
        }
      ]
    }
  ]
}
```

**GET /api/notes/:id Response:**
```json
{
  "note": {
    "id": "uuid",
    "title": "My Note",
    "icon": "📝",
    "cover": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "blocks": [
      {
        "id": "uuid",
        "type": "heading",
        "content": { "level": 1, "text": "Title" },
        "position": 0
      },
      {
        "id": "uuid",
        "type": "paragraph",
        "content": { "text": "Content here" },
        "position": 1
      },
      {
        "id": "uuid",
        "type": "code",
        "content": { "language": "typescript", "code": "const x = 1;" },
        "position": 2
      }
    ]
  }
}
```

**Search Response:**
```json
{
  "results": [
    {
      "noteId": "uuid",
      "title": "Found Note",
      "highlight": "<mark>keyword</mark> in context...",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Component Breakdown
**Các khối chính:**

### Backend (NestJS)
- `controllers/folder.controller.ts`: Xử lý folder CRUD
- `controllers/note.controller.ts`: Xử lý note CRUD  
- `controllers/block.controller.ts`: Xử lý block CRUD
- `controllers/search.controller.ts`: Xử lý search
- `services/folder.service.ts`: Business logic cho folders
- `services/note.service.ts`: Business logic cho notes
- `services/block.service.ts`: Business logic cho blocks
- `services/search.service.ts`: Full-text search logic
- `prisma/schema.prisma`: Database schema

### Frontend (React)
- `components/knowledge/Sidebar.tsx`: Folder tree navigation
- `components/knowledge/NoteList.tsx`: Danh sách notes trong folder
- `components/knowledge/Editor.tsx`: Block-based editor (Tiptap)
- `components/knowledge/BlockRenderer.tsx`: Render các loại block
- `components/knowledge/BlockEditor.tsx`: Edit các loại block
- `components/knowledge/SearchModal.tsx`: Modal tìm kiếm
- `components/knowledge/DragOverlay.tsx`: Drag & drop UI
- `hooks/useKnowledge.ts`: TanStack Query hooks
- `stores/knowledge.store.ts`: Zustand store

## Design Decisions
**Tại sao chọn cách này:**

1. **JSONB cho Block Content**: Linh hoạt cho các loại block khác nhau, dễ mở rộng thêm block types mới
2. **Recursive Folder Structure**: Thư mục tự reference qua parentId, cho phép độ sâu không giới hạn
3. **Tiptap Editor**: Block-based, có sẵn Markdown support, React integration tốt, extensible
4. **PostgreSQL Full-text Search**: Không cần thêm Elasticsearch, đủ hiệu quả cho use case cá nhân
5. **Position Field**: Dùng integer cho order, đơn giản hơn so với floating-point hoặc adjacent-list
6. **@dnd-kit**: Modern, accessible drag & drop library cho React

## Non-Functional Requirements
**Yêu cầu phi chức năng:**

- **Security:**
  - Tất cả endpoints yêu cầu authentication (JWT)
  - User chỉ có thể access notes/folders của mình
  - Image upload validate type và size
- **Performance:**
  - Folder tree load recursive, có thể cache
  - Block content lazy load khi mở note
  - Search với pagination
- **Scalability:**
  - Block nhỏ, có thể load động
  - Search index tự động update qua PostgreSQL triggers hoặc application-level
