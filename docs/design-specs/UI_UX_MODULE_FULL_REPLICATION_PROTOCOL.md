# LỆNH TRỌNG TÂM — QUY TRÌNH SAO CHÉP TOÀN BỘ THIẾT KẾ GIAO DIỆN CỦA 1 MODULE
## (Đầy đủ mọi Tab, không thiếu bất kỳ chi tiết thiết kế nào)

**Document Reference:** `/docs/design-specs/UI_UX_MODULE_FULL_REPLICATION_PROTOCOL.md`  
**Governing Standard:** Rule #19 & Rule #20 trong `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`

> **Nhiệm vụ cốt lõi:** Trích xuất và tái tạo TOÀN BỘ đặc tả thiết kế giao diện của module nguồn `{TÊN_MODULE_NGUỒN}` (bao gồm mọi tab chức năng bên trong) thành 1 tài liệu đặc tả đầy đủ, sau đó áp dụng/sao chép chính xác sang module đích `{TÊN_MODULE_ĐÍCH}`. TUYỆT ĐỐI KHÔNG được bỏ sót, rút gọn, hay "tóm tắt lại cho gọn" bất kỳ chi tiết thiết kế nào — kể cả những chi tiết nhỏ như định dạng số thập phân, ký hiệu tiền tệ, hay khoảng cách margin.

---

## PHASE 0 — KIỂM KÊ TOÀN BỘ TAB TRONG MODULE NGUỒN (BẮT BUỘC TRƯỚC TIÊN)

Trước khi trích xuất thiết kế, phải liệt kê đầy đủ:

1. Module `{TÊN_MODULE_NGUỒN}` gồm CHÍNH XÁC bao nhiêu tab/màn hình con?  
   (Liệt kê tên từng tab, đường dẫn file component tương ứng — dựa vào code thật trong repo, KHÔNG đoán hay suy diễn từ tên module.)
2. Với mỗi tab, xác định: đây là loại màn hình gì?  
   (Master/List view dạng bảng | Dashboard/KPI overview | Form nhập liệu | Detail/Drawer view | Wizard nhiều bước | Modal/Dialog | Report/Print view...)
3. Báo cáo đầy đủ danh sách này TRƯỚC KHI trích xuất bất kỳ chi tiết thiết kế nào — nếu bỏ sót 1 tab ở bước này, toàn bộ phần sau sẽ thiếu sót theo.

---

## PHASE 1 — TRÍCH XUẤT ĐẶC TẢ THIẾT KẾ CHO TỪNG TAB (LẶP LẠI CHO MỖI TAB)

Với MỖI tab đã liệt kê ở Phase 0, trích xuất đầy đủ theo đúng cấu trúc sau — không được gộp tắt hay lược bớt mục nào:

### 1.1 Cấu trúc bố cục (Layout Architecture)
- Vẽ lại sơ đồ phân tầng của tab (tương tự L0–L4 nếu là master tab, hoặc cấu trúc tương ứng nếu là form/dashboard/drawer).
- Kích thước, breakpoint responsive (mobile/tablet/desktop) nếu có khác biệt.
- Vị trí cố định (`sticky`/`fixed`) của từng khối, nếu có.

### 1.2 Typography — CHI TIẾT TUYỆT ĐỐI, KHÔNG TÓM TẮT
- Font-family áp dụng cho từng loại nội dung (heading, body text, số liệu, mã định danh).
- Font-size, font-weight, line-height CHÍNH XÁC theo class Tailwind (hoặc CSS thật) đang dùng trong code — copy nguyên class, không diễn giải ("chữ đậm vừa" là không đủ, phải là `font-semibold text-sm`).
- Letter-spacing, text-transform (uppercase/capitalize) nếu có.

### 1.3 Định dạng số liệu & tiền tệ — BẮT BUỘC CHI TIẾT TUYỆT ĐỐI
- Với MỖI loại số liệu hiển thị trong tab (số lượng, phần trăm, đơn giá, thành tiền, tổng tiền...), ghi rõ:
  - Hàm/thư viện format đang dùng (vd `Intl.NumberFormat('vi-VN')`, hay hàm tự viết `formatVNDCurrency()`, `toLocaleString('vi-VN')`).
  - Số chữ số thập phân (0, 2 chữ số...).
  - Ký hiệu đơn vị/tiền tệ đặt trước hay sau số (vd `"1.500.000 ₫"` hay `"₫1.500.000"` hay chỉ số thuần không ký hiệu).
  - Dấu phân cách hàng nghìn (dấu chấm `.` theo chuẩn Việt Nam, không phải dấu phẩy kiểu Mỹ).
  - Cách hiển thị số âm (dấu `-` hay ngoặc đơn `(1.000.000)`, có màu đỏ hay không).
  - Căn lề: số liệu luôn căn phải (`text-right`) trong bảng, có dùng `font-mono`/`tabular-nums` để thẳng cột không.
- Với mỗi loại timestamp/ngày giờ hiển thị: định dạng chính xác (`dd/MM/yyyy`, `dd/MM/yyyy HH:mm`, tương đối kiểu "2 giờ trước"...), và có convert timezone hiển thị theo `Asia/Ho_Chi_Minh` hay không.

### 1.4 Hệ thống màu sắc trạng thái (Status Color Tokens)
- Liệt kê ĐẦY ĐỦ mọi trạng thái nghiệp vụ xuất hiện trong tab (không chỉ liệt kê ví dụ) và class màu tương ứng CHÍNH XÁC (nền, chữ, viền).
- Bao gồm cả màu cho: badge trạng thái, hàng bảng được highlight (vd hàng quá hạn tô đỏ nhạt), icon cảnh báo, nút hành động theo mức độ nghiêm trọng (primary/danger/warning/ghost).

### 1.5 Component & Interaction chi tiết
- Toàn bộ input, dropdown, checkbox, toggle, date picker... đang dùng — component nào (custom hay thư viện), props/config chính.
- Debounce timing cho search (nếu có), animation/transition (duration, easing) khi mở modal/drawer, khi hover row, khi loading.
- Toàn bộ Row Actions / Context Menu trên mỗi dòng dữ liệu (liệt kê từng action, icon dùng, điều kiện hiện/ẩn theo permission).
- Toàn bộ modal/dialog xác nhận — xác nhận dùng `ConfirmDialog.tsx`, không dùng `window.alert/confirm` (Rule #19) — với mỗi hành động nhạy cảm, ghi rõ nội dung message cảnh báo hiển thị.

### 1.6 Trạng thái hệ thống (System States)
- Loading state: skeleton hay spinner? Bố cục skeleton cụ thể ra sao?
- Error state: nội dung message, có nút "Thử lại" không, style ra sao?
- Empty state: nội dung message, icon minh họa, có CTA (call-to-action) button không?

### 1.7 Bằng chứng trích xuất
- Với mỗi mục 1.1–1.6, DÁN NGUYÊN VĂN đoạn code/class thật (không diễn giải bằng lời) làm bằng chứng — đây là điều kiện bắt buộc để tránh bỏ sót chi tiết khi áp dụng sang module đích.

---

## PHASE 2 — TỔNG HỢP THÀNH TÀI LIỆU ĐẶC TẢ HOÀN CHỈNH

Sau khi hoàn tất Phase 1 cho TẤT CẢ các tab, tổng hợp thành 1 file:

```
docs/design-specs/{TÊN_MODULE_NGUỒN}_FULL_UI_DESIGN_SPEC.md
```

Cấu trúc file: 1 mục lớn cho mỗi tab (theo đúng thứ tự đã kiểm kê ở Phase 0), mỗi mục chứa đầy đủ 7 tiểu mục (1.1–1.7) đã trích xuất.

File này đóng vai trò là NGUỒN CHÂN LÝ DUY NHẤT (single source of truth) cho thiết kế — mọi bước sao chép ở Phase 3 phải đối chiếu với đúng file này, không được tự nhớ lại hay suy diễn thêm.

---

## PHASE 3 — ÁP DỤNG SAO CHÉP SANG MODULE ĐÍCH

Với module đích `{TÊN_MODULE_ĐÍCH}`:

1. Với MỖI tab trong module nguồn đã đặc tả ở Phase 2, xác định tab tương ứng (hoặc tab cần tạo mới) trong module đích có cùng vai trò chức năng (vd: Master/List view của nguồn ↔ Master/List view của đích).
2. Áp dụng NGUYÊN VẸN mọi chi tiết từ 1.1 đến 1.6 đã đặc tả — chỉ được thay đổi:
   - Tên field/dữ liệu nghiệp vụ (đổi theo đúng field thật của module đích — không bịa field không tồn tại trong schema/API đích).
   - Nội dung text (label, message) — dịch/đổi theo đúng ngữ cảnh nghiệp vụ đích.
   - Icon minh họa phù hợp ngữ cảnh đích (nếu icon nguồn không phù hợp ngữ nghĩa).  
   TUYỆT ĐỐI KHÔNG được thay đổi: cấu trúc layout, typography, định dạng số/tiền tệ, hệ màu trạng thái, timing animation, cấu trúc loading/error/empty state — những thứ này phải giống 100% bản gốc.
3. Nếu module đích có tab mà module nguồn KHÔNG có tab tương ứng (vd 1 wizard đặc thù chỉ tồn tại ở đích), áp dụng NGUYÊN TẮC THIẾT KẾ chung (Phase 1.2–1.4: typography, số liệu, màu sắc) nhưng cấu trúc bố cục có thể linh hoạt theo đúng loại màn hình đó — báo cáo rõ đây là trường hợp không có bản đối chiếu trực tiếp.

---

## BẰNG CHỨNG BẮT BUỘC KHI BÁO CÁO HOÀN THÀNH

1. File `{TÊN_MODULE_NGUỒN}_FULL_UI_DESIGN_SPEC.md` đầy đủ (Phase 2) — gửi kèm toàn văn, không tóm tắt.
2. Bảng đối chiếu tab-nguồn ↔ tab-đích (Phase 3 mục 1) — liệt kê đủ, không thiếu tab nào ở cả 2 phía.
3. Với MỖI tab đã áp dụng ở module đích: dán code thật của component sau khi sửa, kèm:
   - Kết quả `grep -n "window.alert\|window.confirm"` → phải rỗng.
   - Kết quả `grep -n "font-mono\|Intl.NumberFormat\|toLocaleString"` → đối chiếu đủ số lượng chỗ dùng so với bản nguồn tương ứng.
   - Screenshot hoặc HTML export thật của cả 2 bên (nguồn và đích) đặt cạnh nhau để đối chiếu trực quan — không chấp nhận chỉ mô tả bằng lời "đã giống hệt".
4. Danh sách CHÊNH LỆCH CÒN LẠI (nếu có) — phải tự nêu rõ những điểm chưa áp dụng được giống 100% và lý do (vd: module đích không có dữ liệu tương đương), KHÔNG được im lặng bỏ qua.

> ⛔ **KHÔNG CHẤP NHẬN BÁO CÁO "ĐÃ SAO CHÉP ĐẦY ĐỦ 100%" NẾU KHÔNG KÈM BẢNG ĐỐI CHIẾU TAB-THEO-TAB VÀ BẰNG CHỨNG THÔ NHƯ TRÊN CHO TỪNG TAB.**
