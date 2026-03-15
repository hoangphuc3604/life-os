---
phase: implementation
title: Module Knowledge - Implementation Guide
description: Hướng dẫn triển khai kỹ thuật cho Module Knowledge
---

# Implementation Guide

## Development Setup
**Cách thiết lập môi trường:**

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/knowledge
JWT_SECRET=your-jwt-secret
PORT=3001
UPLOAD_DIR=./uploads
```

## Code Structure
**Tổ chức code:**

```
services/knowledge-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── folders/
│   │   ├── folders.module.ts
│   │   ├── folders.controller.ts
│   │   ├── folders.service.ts
│   │   ├── dto/
│   │   │   ├── create-folder.dto.ts
│   │   │   ├── update-folder.dto.ts
│   │   │   └── move-folder.dto.ts
│   ├── notes/
│   │   ├── notes.module.ts
│   │   ├── notes.controller.ts
│   │   ├── notes.service.ts
│   │   ├── dto/
│   │   │   ├── create-note.dto.ts
│   │   │   ├── update-note.dto.ts
│   │   │   └── move-note.dto.ts
│   ├── blocks/
│   │   ├── blocks.module.ts
│   │   ├── blocks.controller.ts
│   │   ├── blocks.service.ts
│   │   ├── dto/
│   │   │   ├── create-block.dto.ts
│   │   │   ├── update-block.dto.ts
│   │   │   └── reorder-blocks.dto.ts
│   ├── search/
│   │   ├── search.module.ts
│   │   ├── search.controller.ts
│   │   └── search.service.ts
│   ├── upload/
│   │   ├── upload.module.ts
│   │   ├── upload.controller.ts
│   │   └── upload.service.ts
│   └── auth/
│       ├── jwt.strategy.ts
│       └── jwt-auth.guard.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

## Implementation Notes
**Chi tiết kỹ thuật:**

### Folder Tree Structure
Sử dụng recursive query để lấy folder tree. Mỗi folder có parentId để tạo hierarchy.

### Block Content Format
```typescript
// Block content types
type BlockContent = 
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'code'; code: string; language: string }
  | { type: 'link'; url: string; title?: string }
  | { type: 'nestedNote'; noteId: string };

// Block properties
type BlockProperties = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
};
```

### Drag & Drop Logic
- Frontend sử dụng @dnd-kit để handle UI drag & drop
- Backend nhận move request với target folder ID và position
- Cập nhật position của tất cả items trong cùng level

### Full-text Search
Sử dụng PostgreSQL tsvector và tsquery:
```sql
-- Index
CREATE INDEX notes_search_idx ON notes USING GIN (search_vector);

-- Search query
SELECT * FROM notes 
WHERE search_vector @@ plainto_tsquery('english', 'keyword');
```

## Integration Points
**Các điểm tích hợp:**

- API Gateway: Route /knowledge/* requests đến Knowledge Service
- Auth Service: Validate JWT token
- Storage: Local filesystem hoặc S3 cho images

## Error Handling
**Xử lý lỗi:**

- Folder not found: 404
- Note not found: 404
- Unauthorized: 401
- Invalid move (circular reference): 400
- Upload error: 413 (file too large), 415 (unsupported type)

## Performance Considerations
**Tối ưu hiệu năng:**

- Folder tree: Cache on startup, invalidate on change
- Blocks: Lazy load when opening note
- Search: Pagination (20 results per page)
- Upload: Limit file size to 5MB

## Security Notes
**Bảo mật:**

- Validate JWT on all endpoints
- Check user ownership of notes/folders
- Sanitize uploaded files
- Validate URLs in link blocks
