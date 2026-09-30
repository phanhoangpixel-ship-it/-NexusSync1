# NEXUSSYNC ERP — CHANGE LOG ENTRY: M01 NEXUSFLOW OBSERVABILITY (PHASES 1–6)

**Document Reference:** `docs/CHANGE_LOG_ENTRY_M01_OBSERVABILITY.md`  
**Parent Change Log:** `docs/CHANGE_LOG.md`  
**Execution Date:** 2026-09-27  
**Module:** M01 — Workspace Hub & Global Orchestration (`M01ObservabilityPanel.tsx`)  
**Scope Status:** Phases 1–6 ĐÃ ĐÓNG (Phase 1 PASS, Phase 2 PASS có điều kiện, Phase 3 PASS, Phase 4 PASS, Phase 5 PASS, Phase 6 PASS).

---

## 1. Step 0 Pre-Check & Code Slot Verification
- **Code Slot Verification**: Xác nhận **M01 = Workspace Hub & Global Orchestration** vẫn là authority hiện hữu duy nhất cho session navigation và WorkQueue SLA orchestration (Workspace: `WS01_HUB`, Route: `/workspace`, Component: `WorkspaceHub.tsx`). 
- **Sub-domain mới**: NexusFlow Observability được tích hợp dưới dạng bảng điều khiển quan sát toàn cục (`M01ObservabilityPanel.tsx`) gắn kèm trong `WorkspaceHub.tsx`.
- **Bảo toàn Core**: Tuyệt đối không can thiệp vào `src/App.tsx`, `config/moduleRegistry.ts`, hay các engine đơn quyền M17, M30, M41, M42.

---

## 2. Single-Writer Authority Boundaries & Non-Authority Protection
- **M01 Observability KHÔNG PHẢI Domain Authority mới**: `ObservabilityProjectorService` chỉ đọc dữ liệu từ `audit_logs` (M02) và `outbox_events` (M05) để chiếu sang 2 bảng read-model dẫn xuất riêng biệt (`flow_spans`, `module_kpi_snapshots`).
- **Zero Cross-Domain Mutation**: Không ghi trực tiếp vào `stock_ledger` (M17), `accounting_entries` (M30), `pricing_rules` (M41), hay `cost_layers` (M42).
- **Remediation Boundary (Phase 2)**: Hành động khắc phục lỗi chỉ được phép kích hoạt đối với các sự kiện nguồn `EVENT` (M05 EventBus), ủy thác retry về chính consumer của domain gốc. Span nguồn `AUDIT` bị từ chối 400 có kiểm soát (không cho phép retry audit trail thuần túy).

---

## 3. Architecture & Database Schema
- **Read-Model Tables** (`/db/schema.m01-observability.ts`):
  - `flow_spans`: Chuẩn hóa vết thực thi phân tán, unique `(sourceType, sourceRefId)`, đánh index `correlationId`, `(moduleCode, status)`, `occurredAt`.
  - `module_kpi_snapshots`: Lưu vết chỉ số tổng hợp theo ngày `(moduleCode, snapshotDate, branchKey)`.
- **Rule-Based Trend Thresholds & State**:
  - `HEALTH_THRESHOLDS`: Green $\ge$ 90%, Yellow $\ge$ 70%, Red < 70%.
  - `TREND_THRESHOLDS`: Tối thiểu 3 điểm snapshot (`MIN_DATA_POINTS: 3`), độ lệch có ý nghĩa $\Delta \ge 10$ điểm (`DELTA_SIGNIFICANT: 10`). Trạng thái xu hướng: `IMPROVING`, `DEGRADING`, `STABLE`, `INSUFFICIENT_DATA`, `NO_DATA`.

---

## 4. Service Layer & Cross-Module Integrations
- `ObservabilityProjectorService` (`/engines/observabilityProjectorService.ts`):
  - `projectAuditLogs()` / `projectOutboxEvents()`: Cơ chế checkpoint tự động qua `COALESCE(MAX(sourceRefId), 0)`, chiếu idempotent vào `flow_spans`.
  - `computeDailySnapshots()`: Tổng hợp chỉ số khả dụng hàng ngày theo từng phân hệ.
  - `listSpans()`, `getRootCauseChain()`, `remediateSpan()`: Động cơ khảo sát luồng phân tán và phân tích nguyên nhân gốc dựa trên chuỗi `correlationId`.
  - `getModuleTrends()`, `getModuleTrendDetail()`: Tính toán xu hướng hiệu quả vận hành và chuỗi lịch sử 30 ngày cho từng module.
  - `getHealthSummary()`, `getTopology()`: Cung cấp chỉ số sức khỏe hệ thống và bản đồ topology 43 phân hệ, tích hợp cờ `snapshotComputed: boolean` và thông điệp cảnh báo trung thực khi ngày truy vấn chưa có bản ghi tổng hợp.

---

## 5. UI/UX Compliance (Rule #19 & Rule #20)
- Tích hợp liền mạch trong `WorkspaceHub.tsx` qua `M01ObservabilityPanel.tsx`.
- **Time-Travel Date Selector**: Cho phép chọn ngày trong quá khứ, tự động hiển thị banner cảnh báo amber khi ngày được chọn chưa có snapshot, tránh ngộ nhận 100% khả dụng.
- **Sparkline Card (Recharts)**: Vẽ biểu đồ đường xu hướng 30 ngày với `ResponsiveContainer`, `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`.
- **Span Explorer & RCA**: Bảng tra cứu span phân trang, panel phân tích root cause, hộp thoại `ConfirmDialog.tsx` chuẩn mực trước khi tái kích hoạt remediation.

---

## 6. Phase 2 — Span Explorer, RCA & Remediation (PASS có điều kiện)
- **Đã kiểm chứng**:
  - `GET /api/workspace/observability/spans?pageSize=5`: Trả về dữ liệu phân trang thực tế từ `flow_spans`.
  - `GET /api/workspace/observability/rca/:correlationId`: Xác định đúng chuỗi span và đánh dấu root cause span bị lỗi.
  - `POST /api/workspace/observability/remediate/:id`: Đã xác thực trả về HTTP 400 chuẩn mực khi gọi trên span nguồn `AUDIT` (`INVALID_SOURCE`).
- **ĐIỀU KIỆN CHỨNG NHẬN CÒN TREO**:
  > *Remediation mới verified được nhánh từ chối (`sourceType=AUDIT` → 400) bằng dữ liệu thật. Nhánh thành công (retry một span `EVENT` bị lỗi thật) chưa từng chạy được vì `outbox_events` rỗng tại mọi thời điểm QA — không phải lỗi code, là giới hạn dữ liệu môi trường. Cần test bổ sung khi hệ thống có `outbox_events` thật phát sinh, trước khi coi tính năng "Remediation" là certified đầy đủ 100%.*

---

## 7. Phase 3 — Trend Detection, Time-Travel Viewer & Fix snapshotComputed (PASS)
- **Đã kiểm chứng**:
  - `GET /api/workspace/observability/trends?days=7`: Trả về trạng thái xu hướng cho 43 phân hệ theo đúng ngưỡng thống kê rule-based.
  - `GET /api/workspace/observability/trends/:moduleCode?days=30`: Trả về mảng điểm khả dụng lịch sử để dựng biểu đồ Sparkline.
  - Xử lý mâu thuẫn dữ liệu lịch sử ngày `2026-09-25`: Thêm `snapshotComputed: false` và `warning` vào API `getHealthSummary()` / `getTopology()`, banner amber và KPI Card 1 (`---` / `CHƯA TÍNH`) trên UI.
  - Hoàn toàn read-only, 0 mutation mới, 0 bảng mới, 0 permission mới, 0 dependency mới.
  - Typecheck `npm run lint` (`tsc --noEmit`): 0 lỗi trên toàn bộ các file Observability M01.

---

## 8. Phase 4 — Self-Protective Backpressure (2026-09-27)
- **Phạm vi thu hẹp có chủ đích**: KHÔNG triển khai cơ chế backpressure toàn hệ thống (chặn/giãn SLA module khác) như mô tả ở FSD gốc mục III.2 — chỉ tự bảo vệ chính vòng lặp `runCycle()` của M01, không sửa `inventoryService.ts`/`accountingEngine.ts`/`costingEngine.ts`/`pricingService.ts` hay middleware toàn cục nào (0 file ngoài M01 bị chạm, xác nhận 2 lần độc lập).
- **Nhận diện SQLITE_BUSY**: dựa thực nghiệm thật (`err.code`, `err.rawCode === 5`), không suy đoán.
- **Cơ chế**: `consecutiveBusyErrors >= 3` → kích hoạt (skip chu kỳ, giữ lại probe mỗi 4 lần skip); `consecutiveSuccess >= 3` liên tiếp → tự tắt. State trong bộ nhớ (module-level), mất khi restart — chấp nhận được vì đây là tín hiệu tự điều tiết tạm thời, không phải dữ liệu nghiệp vụ.
- **Giới hạn đã biết**: ngưỡng kích hoạt/phục hồi (3/3/4) là default hợp lý ban đầu, CHƯA calibrate bằng tải thật — tương tự `HEALTH_THRESHOLDS` (Phase 1) và `TREND_THRESHOLDS` (Phase 3). Kịch bản kích hoạt chỉ được verified qua cờ test nội bộ `_testError` (đã xác nhận không lộ ra API công khai), chưa từng quan sát `SQLITE_BUSY` tự nhiên phát sinh trong môi trường QA.
- **API**: `GET /health` bổ sung field `projectorBackpressure` (không đổi field cũ). UI hiện banner amber khi `active: true`, không cần ConfirmDialog (chỉ hiển thị trạng thái).
- **Status**: [PHASE 4 PASS — CLOSED 2026-09-27]

---

## 9. Phase 5 — Statistical Forecast Projection (2026-09-27)
- **Phạm vi**: hoàn thiện hạng mục "AI dự báo điểm nghẽn sớm" của FSD gốc dưới dạng THỐNG KÊ THUẦN TUÝ (hồi quy tuyến tính bình phương tối thiểu — OLS), không gọi Gemini/AI dù `@google/genai` đã có sẵn trong dự án cho M06/M31 — quyết định kiến trúc có chủ đích, không phải thiếu sót.
- **Thuật toán**: `ratePerDay` = độ dốc OLS trên `(ngày, efficiencyScore)` trong cửa sổ trượt N ngày; `projectedBreachDate` chỉ tính khi `ratePerDay < 0`, giới hạn chiếu xa tối đa 365 ngày (`MAX_BREACH_PROJECTION_DAYS`). Tái dùng `TREND_THRESHOLDS.MIN_DATA_POINTS` (Phase 3) làm ngưỡng tối thiểu, không tạo ngưỡng riêng trùng lặp (Rule #02).
- **Bug phát hiện & vá trong chính Phase 5**: `getModuleForecasts()` (danh sách 43 module) ban đầu neo cửa sổ trượt theo giờ hệ thống hiện tại ("bây giờ"), trong khi `getModuleForecastDetail()` (tái dùng `getModuleTrendDetail()` từ Phase 3) neo theo ngày snapshot mới nhất của TỪNG module — 2 mốc neo khác nhau có thể khiến cùng 1 module trả `forecastStatus` khác nhau giữa 2 endpoint một khi module đó ngừng hoạt động vài ngày (chưa lộ ra khi QA vì mọi dữ liệu đều trong cùng 1 ngày). Đã sửa `getModuleForecasts()` neo theo snapshot mới nhất của từng module, khớp 100% với `getModuleForecastDetail()` — xác minh bằng đối chiếu JSON cho M02 và M36, mọi field khớp tuyệt đối.
- **API**: `GET /forecast` (danh sách), `GET /forecast/:moduleCode` (chi tiết + dữ liệu gốc dùng hồi quy) — chỉ thêm route, không sửa route cũ.
- **UI**: banner cảnh báo sớm (chỉ hiện khi có module `DEGRADING_TREND` sắp chạm ngưỡng trong `NEAR_TERM_WARNING_DAYS=3`, văn phong trung tính, ghi rõ "hồi quy tuyến tính đơn giản, không phải dự đoán AI"); dòng trạng thái dự báo trong khu vực chi tiết module (Phase 3 Sparkline), luôn hiện trạng thái thật kể cả khi INSUFFICIENT_DATA.
- **Giới hạn đã biết — QUAN TRỌNG**: tại thời điểm certification (2026-09-27), toàn bộ 43/43 module trả `NO_DATA` (41 module) hoặc `INSUFFICIENT_DATA` (M02, M36 vì mới có 1 ngày dữ liệu). Chưa có module nào đủ dữ liệu để phát huy tác dụng thật. Dự báo sẽ tự kích hoạt sau tối thiểu 3 ngày dữ liệu thật tích luỹ tự nhiên qua `computeDailySnapshots()` (Phase 3).
- **Status**: [PHASE 5 PASS — CLOSED 2026-09-27]

---

## 10. Phase 6 — Automated Regression Test Suite (2026-09-27)
- **Phạm vi**: đóng gói toàn bộ quy trình kiểm thử thủ công (curl) của Phase 1-5 thành `scripts/test-m01-observability.ts` (37 assertion, `npm run test:m01`), lấp khoảng trống đã ghi nhận từ Report A8 ("M01 Dedicated Automated Tests: NOT FOUND").
- **Thiết kế**: dual-mode (kết nối live server `localhost:3000` nếu có, tự dựng in-process router tạm nếu không — cả 2 chế độ đều đọc/ghi `nexus_erp.db` thật, KHÔNG mock data). Nguyên tắc "zero fake data": test success-path Remediation (`T06.2`) tự SKIP có ghi log rõ ràng khi `outbox_events` rỗng, không tự tạo dữ liệu giả để ép xanh.
- **Bổ sung ngoài phạm vi prompt gốc, được giữ lại có chủ đích**: khối `T14.1-T14.4` — quét tĩnh bằng regex trên chính source code (`observabilityProjectorService.ts`, `workspaceObservability.routes.ts`) để chứng minh 0 câu lệnh ghi trực tiếp vào 4 bảng Single-Writer Authority (`stock_ledger`, `accounting_entries`, `cost_layers`, `pricing_rules`) — bằng chứng máy tính khách quan cho invariant đã nói bằng lời suốt Phase 1-5.
- **Bug thật phát hiện & vá trong chính Phase 6 (minh chứng giá trị của audit chéo)**: `T11.2` ban đầu dùng sai enum `["IMPROVING_TREND", "DEGRADING_TREND", "STABLE_TREND", ...]` — không khớp interface thật `ModuleForecastItem` của Phase 5 (`'DEGRADING_TREND' | 'STABLE_OR_IMPROVING' | 'INSUFFICIENT_DATA' | 'NO_DATA'`). Lỗi này PASS giả tại thời điểm QA chỉ vì toàn bộ 43 module đang là `NO_DATA`/`INSUFFICIENT_DATA` — sẽ FAIL SAI ngay khi hệ thống tích luỹ đủ dữ liệu và có module đạt trạng thái `STABLE_OR_IMPROVING` thật. Đã sửa khớp 100% với interface thật, xác nhận lại bằng chạy lại suite sau vá (kết quả PASS không đổi, đúng như kỳ vọng — bug là "sai logic vô hại tạm thời", không phải "đang che giấu lỗi thật").
- **Cải tiến phụ**: `T09.1` đổi từ ngày hardcode `2026-09-25` sang ngày tương đối (hôm qua theo `Date.now()`), tránh test tự vỡ vô cớ khi chạy lại vào thời điểm khác.
- **Kết quả cuối**: 37 test case — 36 PASS, 0 FAIL, 1 SKIPPED hợp lệ (T06.2, chờ `outbox_events` có dữ liệu thật).
- **Status**: `[PHASE 6 — VERIFIED, 0 unauthorized mutations]`


