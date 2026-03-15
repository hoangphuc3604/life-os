---
phase: testing
title: Module Knowledge - Testing Strategy
description: Chiến lược kiểm thử cho Module Knowledge
---

# Testing Strategy

## Test Coverage Goals
**Mục tiêu bao phủ test:**

- [x] Unit test coverage target: 100% cho new/changed code
- [x] Integration test scope: Critical paths + error handling
- [x] End-to-end test scenarios: Key user journeys
- [x] Alignment với requirements/design acceptance criteria

## Unit Tests
**Các component cần test:**

### FolderService
- [x] createFolder: Test tạo folder mới (root và subfolder)
- [x] getFolderTree: Test lấy tree với nested folders
- [x] updateFolder: Test rename folder
- [x] deleteFolder: Test xóa folder (có và không có children)
- [x] moveFolder: Test di chuyển folder

### NoteService
- [x] createNote: Test tạo note mới
- [x] getNoteById: Test lấy note với blocks
- [x] updateNote: Test cập nhật metadata
- [x] deleteNote: Test xóa note và blocks liên quan
- [x] moveNote: Test di chuyển note sang folder khác

### BlockService
- [x] createBlock: Test thêm block mới
- [x] updateBlock: Test cập nhật block content
- [x] deleteBlock: Test xóa block
- [x] reorderBlocks: Test sắp xếp lại blocks

### SearchService
- [x] searchNotes: Test full-text search với keywords

## Integration Tests
**Các scenarios cần test:**

- [ ] Folder CRUD lifecycle
- [ ] Note CRUD lifecycle
- [ ] Block CRUD lifecycle
- [ ] Move folder với nested content
- [ ] Move note giữa các folders
- [ ] Search với multiple results
- [ ] Upload image và hiển thị trong note

## End-to-End Tests
**Các user flows cần test:**

- [ ] Tạo folder hierarchy (3 cấp)
- [ ] Tạo note với multiple blocks
- [ ] Edit block content và save
- [ ] Drag & drop folder
- [ ] Drag & drop note  
- [ ] Search và click vào kết quả
- [ ] Upload image vào note

## Manual Testing
**Các checklist cần test:**

- [ ] UI/UX: Responsive trên mobile, tablet, desktop
- [ ] UI/UX: Folder tree hiển thị đúng hierarchy
- [ ] UI/UX: Drag & drop feedback rõ ràng
- [ ] UI/UX: Editor toolbar đầy đủ
- [ ] UI/UX: Search results highlighting
- [ ] Accessibility: Keyboard navigation
- [ ] Browser: Chrome, Firefox, Safari
