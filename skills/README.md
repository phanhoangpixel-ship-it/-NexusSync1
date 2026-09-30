# NEXUSSYNC ERP — TỔNG HỢP TOÀN BỘ SKILL HỆ THỐNG (MASTER SKILLS DIRECTORY)

Thư mục `/skills/` là **nguồn lưu trữ duy nhất** tập hợp toàn bộ các kỹ năng (Skills) của hệ thống NexusSync ERP và nền tảng AI Studio.

---

## 1. BỘ SKILL NGHIỆP VỤ & QUẢN TRỊ KIẾN TRÚC ERP (`/skills/erp_skills/`)

Dành riêng cho việc phát triển, kiểm thử, quản trị dữ liệu và chuẩn hoá giao diện NexusSync ERP:

| Mã Skill | Đường dẫn | Trách nhiệm chính |
|---|---|---|
| **SKILL-01** | [`/skills/erp_skills/skill-01-architecture-gate/SKILL.md`](./erp_skills/skill-01-architecture-gate/SKILL.md) | **Architecture Gate & Step 0**: Kiểm tra xung đột trước khi code, 10 rules cốt lõi, Impact Analysis |
| **SKILL-02** | [`/skills/erp_skills/skill-02-cross-module-delegation/SKILL.md`](./erp_skills/skill-02-cross-module-delegation/SKILL.md) | **Cross-Module Delegation Map**: Thẩm quyền đơn nhất (4 Single-Writers: M17, M30, M41, M42) |
| **SKILL-03** | [`/skills/erp_skills/skill-03-live-data-testing/SKILL.md`](./erp_skills/skill-03-live-data-testing/SKILL.md) | **Live Data Testing Protocol**: Kiểm thử bằng dữ liệu thật, chống Fake/Mock data |
| **SKILL-04** | [`/skills/erp_skills/skill-04-doc-sync-cleanup/SKILL.md`](./erp_skills/skill-04-doc-sync-cleanup/SKILL.md) | **Doc Sync & Cleanup**: Dọn dẹp dữ liệu test an toàn, đồng bộ 5 tài liệu chuẩn |
| **SKILL-05** | [`/skills/erp_skills/skill-05-upgrade-prompt-template/SKILL.md`](./erp_skills/skill-05-upgrade-prompt-template/SKILL.md) | **Upgrade Prompt Templates**: Mẫu lệnh giao việc tinh gọn, tiết kiệm token |
| **SKILL-06** | [`/skills/erp_skills/skill-06-ui-formatting-color/SKILL.md`](./erp_skills/skill-06-ui-formatting-color/SKILL.md) | **UI/UX, Tiền tệ & Bảng màu**: Chống tràn tab bar, `font-mono tabular-nums`, màu semantic WCAG AA |

---

## 2. BỘ SKILL HỆ THỐNG & TÍCH HỢP NỀN TẢNG (`/skills/system_skills/`)

Kỹ năng tích hợp công nghệ, cơ sở dữ liệu và dịch vụ đám mây:

- **`frontend_design`**: Chuẩn thiết kế frontend, typography, layout math, anti-slop.
- **`erp_ui_formatting_color`**: Chuẩn định dạng tiền tệ Việt Nam, bảng màu nghiệp vụ và responsive tab bar.
- **`cloudsql-setup` & `cloudsql-update-schema` & `cloudsql-execute-sql`**: Quản trị Drizzle ORM và PostgreSQL.
- **`firebase-skill`**: Đồng bộ Firestore và Firebase Authentication.
- **`gemini_api` & `gemini_interactions_api`**: Tích hợp mô hình AI Gemini.
- **`pwa_integration`**: Cấu hình Offline PWA & Service Worker.
- **`workspace_integration` & `oauth`**: Tích hợp Google Workspace và 3P OAuth.
- **`realtime_guidelines`**: Realtime WebSocket và EventBus.
- **`shadcn`**: Chuẩn hoá linh kiện giao diện Shadcn UI.
- **`image_generation`**: Khởi tạo asset hình ảnh.
- **`applet_seo`**: Tối ưu SEO và OpenGraph metadata.
