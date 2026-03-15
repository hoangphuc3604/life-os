# PRODUCT REQUIREMENTS DOCUMENT (PRD)

- **Project Name**: LifeOS - Personal Knowledge & Resource Planning System
- **Architecture**: Microservices
- **Target User**: Developer, Lifelong Learner

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)
Ứng dụng là một nền tảng web tập trung giúp người dùng quản lý tri thức, tài chính cá nhân, lịch trình và cập nhật thông tin. Hệ thống sử dụng kiến trúc Microservices để đảm bảo tính module hóa, dễ dàng mở rộng.

## 2. CHI TIẾT TÍNH NĂNG (FUNCTIONAL REQUIREMENTS)

### A. Module Knowledge (Ghi chú & Tri thức)
- **Cấu trúc dữ liệu**:
  - Quản lý theo cây thư mục (Recursive Folder Structure).
  - Hỗ trợ Drag & Drop để di chuyển ghi chú/thư mục giữa các cấp.
- **Editor (Trình soạn thảo)**:
  - Rich-text Editor hỗ trợ Markdown.
  - Block-based: Tương tự Notion (mỗi đoạn văn, ảnh, code block là một block) để dễ tùy biến.
  - Hỗ trợ nhúng: Ảnh (upload/paste), Code snippet (syntax highlighting), Link preview, Note con.
- **Tìm kiếm**: Full-text search (Postgres Full-text search).

### B. Module Feed & Media (Tổng hợp tin tức & Read Later)
- **Aggregator (Bộ tổng hợp)**:
  - Cho phép config nguồn tin (RSS Feeds, Website URL).
  - Job chạy ngầm (Background Worker) định kỳ quét tin mới.
- **AI Processing**:
  - Tự động tóm tắt bài viết/tin tức theo format: N gạch đầu dòng + Phân tích Ưu/Nhược điểm (Nếu là về một phương pháp).
- **YouTube Integration**:
  - **Input**: Dán link YouTube.
  - **Process**: Lấy Transcript -> Gửi cho AI -> Tóm tắt nội dung chính.
  - **Lưu trữ**: Chỉ lưu Metadata (Title, Thumbnail, URL, Summary) để tiết kiệm DB.
- Lưu trữ các link, ảnh, … để xem sau, có phân loại theo từng loại
- Ví dụ như các link tuyển dụng, bài viết hay từ mạng xã hội hoặc trang web

### C. Module Finance (Tài chính cá nhân)
- **Nhập liệu đa phương thức**:
  - **Manual**: Form nhập tay (Amount, Category, Date, Note).
  - **Scan (OCR)**: Upload ảnh hóa đơn -> Trích xuất số tiền và ngày tháng, mục đích sử dụng tiền dựa trên nội dung (Dùng Tesseract OCR hoặc Google Cloud Vision API).
  - **Voice**: Ghi âm câu nói (vd: "Hôm nay ăn sáng 30 nghìn") -> Speech-to-Text (OpenAI Whisper) -> Phân tích ý định (Intent Parsing) -> Lưu vào DB.
- **Dashboard**: Biểu đồ tròn (Chi tiêu theo danh mục), Biểu đồ cột (Chi tiêu theo tháng), và các loại phân tích khác dựa trên mục đích chi tiêu.

### D. Module Planner (Lịch & Task)
- **Giao diện chính**: Calendar View (Xem theo Tuần/Tháng).
- **Cơ chế**: Time-blocking (Task gắn liền với khung giờ cụ thể).
- **Thao tác**: Kéo thả task trực tiếp trên lịch để đổi giờ.
- **Thông báo**:
  - Gửi Email (SMTP).
  - Web Push Notification (Service Workers).

### E. Module Assistant (Chatbot & Tiện ích)
- **Chat RAG (Retrieval-Augmented Generation)**:
  - Chat với dữ liệu của tôi: Bot có thể trả lời câu hỏi dựa trên dữ liệu từ Module Knowledge, Finance, và Planner.
- **Focus Mode**:
  - Bấm nút "Focus": Ẩn các module News/Feed, chặn thông báo không quan trọng.
  - Tích hợp đồng hồ Pomodoro (Có thể cấu hình thời gian làm - nghỉ) trên thanh điều hướng.

## 3. KIẾN TRÚC KỸ THUẬT (TECHNICAL ARCHITECTURE) - Dành cho Microservices
Đây là phần quan trọng nhất để bạn thực hành. Tôi đề xuất tách thành các Service sau:

### 3.1. Frontend (Single Page Application)
- **Tech**: React (Vite), TypeScript.
- **State Management**: TanStack Query + Zustand (khuyên dùng).
- **UI Lib**: ShadcnUI.

### 3.2. Backend Services (Microservices Map)
Bạn có thể mix giữa Python và Node.js để học cả hai:

| Service Name | Vai trò | Tech Stack đề xuất | Database |
| :--- | :--- | :--- | :--- |
| **API Gateway** | Cổng vào duy nhất, định tuyến request, Rate Limit | Nginx hoặc Kong (hoặc tự viết bằng Express/Go) | - |
| **Auth Service** | Quản lý User, Login/Logout, cấp JWT Token | Node.js (Express/NestJS) | PostgreSQL (User table) |
| **Knowledge Service** | CRUD ghi chú, quản lý cây thư mục | Node.js (Tối ưu I/O) | PostgreSQL (JSONB cho block content) |
| **Planner Service** | Quản lý lịch, task, cron job gửi mail | Node.js | MongoDB (Linh hoạt cho task schema) |
| **Finance Service** | Ghi chép thu chi, xử lý OCR hóa đơn | Python (FastAPI) (Mạnh về xử lý dữ liệu) | PostgreSQL |
| **Intelligence Service** | Wrapper cho AI (LLM), Xử lý Transcript, Crawl tin, Speech-to-text | Python (FastAPI) (Hệ sinh thái AI tốt nhất) | Vector DB (ChromaDB) cho RAG |

### 3.3. Communication (Giao tiếp giữa các Service)
- **Sync (Đồng bộ)**: REST API (Service này gọi Service kia qua HTTP).
- **Async (Bất đồng bộ - Quan trọng)**: Sử dụng Message Queue (RabbitMQ hoặc Redis Pub/Sub).
  - *Ví dụ*: Khi user paste link YouTube vào Knowledge Service -> Bắn 1 message vào Queue -> Intelligence Service nhận message, bắt đầu tải transcript và tóm tắt -> Khi xong bắn ngược lại kết quả để lưu.

### 3.4. Deployment (DevOps)
- **Container**: Docker cho từng service.
- **Orchestration**: Docker Compose (local) -> Chuyển lên Kubernetes (K8s).

## 4. LUỒNG DỮ LIỆU ĐIỂN HÌNH (USE CASE FLOW)

### Use Case: "User scan hóa đơn siêu thị"
1. **Frontend**: User chụp ảnh hóa đơn, gửi request POST /api/finance/scan.
2. **API Gateway**: Route request đến Finance Service.
3. **Finance Service (Python)**:
   - Nhận ảnh.
   - Gọi thư viện OCR để lấy text thô.
   - (Optional) Gọi sang Intelligence Service (qua gRPC hoặc nội bộ) để nhờ AI parse text thô thành JSON `{item: "Coffee", amount: 50000, date: "2023-10-27"}`.
   - Lưu transaction vào DB PostgreSQL.
   - Trả kết quả về Frontend.

## 5. LỘ TRÌNH PHÁT TRIỂN (ROADMAP)
Vì làm một mình (Solo Developer), bạn không nên làm tất cả cùng lúc. Hãy chia giai đoạn:

### Phase 1 (Core Foundation):
- Dựng API Gateway + Auth Service.
- Dựng Knowledge Service (chỉ cần CRUD note markdown cơ bản).
- Frontend cơ bản kết nối được 2 cái trên.

### Phase 2 (Productivity):
- Dựng Planner Service (Lịch + Task).
- Tích hợp Focus Mode (Pomodoro) ở Frontend.

### Phase 3 (Data & AI - Thú vị nhất):
- Dựng Finance Service + Intelligence Service.
- Làm tính năng Scan hóa đơn, Crawl tin tức, Tóm tắt YouTube.

### Phase 4 (Integration):
- Hoàn thiện Chatbot (RAG).
- Deploy lên Cloud (AWS/VPS) với Docker Compose/K8s.
