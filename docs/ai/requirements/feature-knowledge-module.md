---
phase: requirements
title: Module Knowledge - Requirements
description: Quản lý ghi chú và tri thức với cấu trúc cây thư mục, rich-text editor, và full-text search
---

# Requirements & Problem Understanding

## Problem Statement
**Module Knowledge giải quyết vấn đề gì?**

- Người dùng cần một nơi để lưu trữ và tổ chức ghi chú, tri thức cá nhân một cách có hệ thống
- Hiện tại không có công cụ tập trung để quản lý ghi chú theo cấu trúc phân cấp (folder tree)
- Không thể dễ dàng di chuyển ghi chú/thư mục giữa các cấp
- Thiếu rich-text editor với Markdown support và block-based editing như Notion
- Không có khả năng tìm kiếm toàn văn bản hiệu quả

## Goals & Objectives
**Mục tiêu đạt được:**

- **Mục tiêu chính**: Xây dựng hệ thống quản lý ghi chú với cấu trúc cây thư mục đệ quy, hỗ trợ drag & drop
- **Mục tiêu chính**: Tích hợp block-based rich-text editor với Markdown support
- **Mục tiêu chính**: Hỗ trợ embedded content (ảnh, code snippet, link preview, note con)
- **Mục tiêu chính**: Triển khai full-text search sử dụng PostgreSQL
- **Mục tiêu phụ**: UI/UX mượt mà, responsive
- **Non-goals**: Không xây dựng tính năng collaboration (chia sẻ ghi chú), offline mode

## User Stories & Use Cases
**Các user stories:**

1. **Tạo thư mục gốc**: Người dùng có thể tạo thư mục mới ở cấp gốc để bắt đầu tổ chức ghi chú
2. **Tạo thư mục con**: Người dùng có thể tạo thư mục con bên trong bất kỳ thư mục nào
3. **Tạo ghi chú**: Người dùng có thể tạo ghi chú mới trong bất kỳ thư mục nào
4. **Drag & drop di chuyển**: Người dùng có thể kéo thả ghi chú/thư mục giữa các cấp thư mục
5. **Soạn thảo rich-text**: Người dùng có thể viết nội dung với Markdown, xem trước real-time
6. **Thêm block**: Người dùng có thể thêm các loại block: paragraph, heading, image, code, link
7. **Upload/paste ảnh**: Người dùng có thể upload hoặc paste ảnh trực tiếp vào ghi chú
8. **Code snippet**: Người dùng có thể chèn code với syntax highlighting
9. **Link preview**: Người dùng có thể dán link và hiển thị preview
10. **Note con (sub-note)**: Người dùng có thể nhúng ghi chú con vào trong ghi chú cha
11. **Tìm kiếm**: Người dùng có thể tìm kiếm ghi chú theo nội dung với full-text search
12. **CRUD đầy đủ**: Người dùng có thể xem, sửa, xóa ghi chú và thư mục

## Success Criteria
**Tiêu chí thành công:**

- [x] Tạo/sửa/xóa thư mục hoạt động đúng
- [x] Tạo/sửa/xóa ghi chú hoạt động đúng
- [x] Drag & drop di chuyển giữa các cấp thư mục hoạt động mượt mà
- [x] Block-based editor hiển thị và chỉnh sửa được các loại block
- [x] Markdown preview hoạt động real-time
- [x] Upload/paste ảnh lưu trữ và hiển thị đúng
- [x] Code block hiển thị syntax highlighting
- [x] Link preview hiển thị thông tin cơ bản
- [x] Sub-note embed hiển thị và navigate được
- [x] Full-text search trả về kết quả chính xác theo nội dung
- [x] API endpoints trả về đúng format
- [x] Frontend responsive trên các kích thước màn hình

## Constraints & Assumptions
**Ràng buộc và giả định:**

- **Technical constraints**:
  - Backend: NestJS với PostgreSQL (đã có từ auth-service)
  - Frontend: React + Vite + TypeScript + ShadcnUI + TanStack Query
  - Database: PostgreSQL với JSONB cho block content
  - Editor: Tiptap (block-based, Markdown support)
- **Assumptions**:
  - User đã authenticated trước khi sử dụng Module Knowledge
  - Image upload được lưu trữ local hoặc cloud storage
  - Search index được update real-time khi có thay đổi

## Questions & Open Items
**Các câu hỏi cần giải đáp:**

- [ ] Cần xác định cơ chế lưu trữ images: local filesystem hay cloud (AWS S3, Cloudinary)?
- [ ] Cần xác định cách xử lý link preview: service bên ngoài hay tự build?
- [ ] Cần xác định giới hạn độ sâu của cây thư mục (max depth)?
- [ ] Cần xác định cách xử lý khi xóa thư mục có chứa ghi chú/thư mục con?
- [ ] Cần xác định cơ chế versioning cho ghi chú?
