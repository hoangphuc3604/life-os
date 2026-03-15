---
phase: planning
title: Module Knowledge - Planning
description: Lịch triển khai và phân chia công việc cho Module Knowledge
---

# Project Planning & Task Breakdown

## Milestones
**Các mốc quan trọng:**

- [x] Milestone 1: Setup Knowledge Service (NestJS + Prisma)
- [x] Milestone 2: Database Schema & Migration
- [x] Milestone 3: Backend API - Folders CRUD
- [x] Milestone 4: Backend API - Notes CRUD  
- [x] Milestone 5: Backend API - Blocks CRUD
- [x] Milestone 6: Backend API - Search & Upload
- [x] Milestone 7: Frontend - Knowledge Layout & Routing
- [x] Milestone 8: Frontend - Sidebar với Folder Tree + DnD
- [x] Milestone 9: Frontend - Note Editor với Tiptap
- [x] Milestone 10: Frontend - Search Modal
- [x] Milestone 11: Integration Testing

## Task Breakdown
**Công việc cụ thể:**

### Phase 1: Foundation (Backend)
- [x] Task 1.1: Create knowledge-service trong services/ folder
- [x] Task 1.2: Setup NestJS project structure
- [x] Task 1.3: Configure Prisma với PostgreSQL connection
- [x] Task 1.4: Tạo database schema (Folder, Note, Block models)
- [x] Task 1.5: Setup JWT authentication guard

### Phase 2: Backend API - Folders
- [x] Task 2.1: Implement FolderService với CRUD operations
- [x] Task 2.2: Implement FolderController với REST endpoints  
- [x] Task 2.3: Implement folder tree với recursive query
- [x] Task 2.4: Implement move folder (drag & drop backend)

### Phase 3: Backend API - Notes
- [x] Task 3.1: Implement NoteService với CRUD operations
- [x] Task 3.2: Implement NoteController với REST endpoints
- [x] Task 3.3: Implement move note (drag & drop backend)

### Phase 4: Backend API - Blocks
- [x] Task 4.1: Implement BlockService với CRUD operations
- [x] Task 4.2: Implement BlockController với REST endpoints
- [x] Task 4.3: Implement reorder blocks

### Phase 5: Backend API - Search & Upload
- [x] Task 5.1: Setup PostgreSQL full-text search
- [x] Task 5.2: Implement SearchService
- [x] Task 5.3: Implement file upload (image)

### Phase 6: Frontend Setup
- [x] Task 6.1: Add Tiptap editor dependencies
- [x] Task 6.2: Add dnd-kit dependencies
- [x] Task 6.3: Create knowledge routes
- [x] Task 6.4: Create API client for knowledge

### Phase 7: Frontend - Folder Tree
- [x] Task 7.1: Create FolderTree component
- [x] Task 7.2: Implement folder CRUD UI
- [x] Task 7.3: Implement drag & drop folder

### Phase 8: Frontend - Note Management
- [x] Task 8.1: Create NoteList component
- [x] Task 8.2: Create NoteEditor component với Tiptap
- [x] Task 8.3: Implement block rendering/editing
- [x] Task 8.4: Implement image upload/paste

### Phase 9: Frontend - Search
- [x] Task 9.1: Create SearchModal component
- [x] Task 9.2: Integrate full-text search UI

### Phase 10: Polish
- [x] Task 10.1: Add keyboard shortcuts
- [x] Task 10.2: Add loading states
- [x] Task 10.3: Fix edge cases

## Dependencies
**Thứ tự phụ thuộc:**

- Backend tasks phải hoàn thành trước khi Frontend bắt đầu
- Folder API cần hoàn thành trước Note API
- Block API cần hoàn thành trước Editor UI
- Search API cần hoàn thành trước Search Modal

## Timeline & Estimates
**Ước tính thời gian:**

- Phase 1: 2-3 giờ
- Phase 2-4: 4-5 giờ
- Phase 5: 2 giờ
- Phase 6: 1 giờ
- Phase 7-8: 5-6 giờ
- Phase 9-10: 2-3 giờ
- **Total: ~18-20 giờ**

## Risks & Mitigation
**Rủi ro và cách giảm thiểu:**

- **Risk**: Tiptap integration complexity
  - **Mitigation**: Sử dụng stable Tiptap version, follow official docs
- **Risk**: Drag & drop edge cases (cross-folder)
  - **Mitigation**: Test kỹ các scenarios, handle errors gracefully
- **Risk**: Full-text search performance
  - **Mitigation**: Add indexes properly, consider caching

## Resources Needed
**Tài nguyên cần thiết:**

- Node.js 18+, PostgreSQL 14+
- NestJS, Prisma, Tiptap, @dnd-kit
- Docker cho deployment
