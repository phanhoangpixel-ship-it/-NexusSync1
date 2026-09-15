# QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP) - PHÂN HỆ QUẢN LÝ GIÁ M41
*Tập đoàn Công nghệ & Quản trị Doanh nghiệp NexusSync ERP*

**Mã tài liệu:** SOP-ERP-M41  
**Phạm vi áp dụng:** Bộ phận Kinh doanh, Phòng Kế toán giá, Giám đốc Tài chính (CFO)  
**Phiên bản:** v1.2 (Cập nhật ngày 28/08/2026)  

---

## 1. MỤC TIÊU QUY TRÌNH
Quy trình này hướng dẫn chi tiết cách thức xây dựng, điều chỉnh giá bán thương mại, quản lý quy định chiết khấu, giám sát biên an toàn lợi nhuận sàn (Margin Guard), và cách duyệt các thay đổi đơn giá bán hàng thuộc phân hệ M41 nhằm đảm bảo:
*   Mức giá bán ra tuân thủ biên lợi nhuận mục tiêu của tập đoàn.
*   Kiểm soát chặt chẽ giá thành, giảm tối đa sai sót thủ công của nhân viên bán hàng.
*   Phê duyệt giá bán diễn ra nhanh chóng, có nhật ký kiểm toán (Audit Trail) rõ ràng.

---

## 2. QUY TRÌNH KHỞI TẠO BẢNG GIÁ MỚI
Mỗi khi có chiến dịch kinh doanh mới hoặc phân khúc đại lý mới được mở rộng:
1.  **Bước 1:** Nhân viên Kế toán giá truy cập vào Tab **Bảng giá thương mại**, nhấn nút **"Tạo bảng giá"**.
2.  **Bước 2:** Nhập các thông số bắt buộc:
    *   *Tên bảng giá:* Mô tả rõ phân khúc (Ví dụ: "Bảng giá Thầu Đại lý Miền Tây").
    *   *Mã bảng giá:* Viết hoa không dấu, viết liền (Ví dụ: `CONTRACT-WEST`).
    *   *Đối tượng áp dụng:* Chọn phân khúc (All - Đại trà, Group - Nhóm VIP/Đại lý, Customer - Chỉ định cụ thể mã đối tượng).
3.  **Bước 3:** Nhấn **"Khởi tạo"**. 
    *   *Lưu ý:* Hệ thống sẽ tự động sao chép (auto-clone) danh mục sản phẩm mẫu từ Bảng giá bán lẻ tiêu chuẩn `PL-001` sang bảng giá mới để kế thừa cấu trúc giá nền, tiết kiệm thời gian nhập liệu thủ công.

---

## 3. THÊM MỚI VÀ ĐIỀU CHỈNH SẢN PHẨM TRONG BẢNG GIÁ
Khi muốn đưa sản phẩm mới vào một bảng giá đang hoạt động:
1.  **Bước 1:** Chọn bảng giá mục tiêu trên thanh công cụ lọc.
2.  **Bước 2:** Nhấn nút **"+ Thêm SP"**.
3.  **Bước 3:** Chọn sản phẩm thương mại mong muốn từ **Danh mục Master** trong hộp thoại xổ xuống.
4.  **Bước 4:** Nhập Đơn giá bán đề xuất, cấu hình Markup % và Biên lợi nhuận mục tiêu.
5.  **Bước 5:** Nhấn **"Thêm sản phẩm"**. 
    *   *Lưu ý kiểm soát biên lợi nhuận:* Hệ thống tự động truy vấn giá vốn tham chiếu từ phân hệ Costing và tính toán biên lợi nhuận thực tế bán ra. Nếu biên lợi nhuận thực tế thấp hơn mức tối thiểu quy định, hệ thống sẽ dán nhãn ⚠️ **WARNING** hoặc 🛑 **BELOW_MIN_MARGIN**.

---

## 4. QUY TRÌNH PHÊ DUYỆT ĐIỀU CHỈNH GIÁ (AUDIT FLOW)
Mọi hành động điều chỉnh đơn giá niêm yết tăng/giảm đột biến từ nhân viên kinh doanh đều phải đi qua quy trình kiểm tra bảo mật:
1.  **Hồ sơ chờ duyệt:** Yêu cầu thay đổi giá sẽ được gửi về Tab **Kiểm duyệt & Nhật ký**.
2.  **Đánh giá rủi ro (CFO):** CFO tiến hành rà soát:
    *   Xem xét mức chênh lệch giữa Giá cũ và Giá mới đề xuất.
    *   Đối chiếu với Biên lợi nhuận của sản phẩm để tránh bán dưới giá vốn.
3.  **Ra quyết định:** Nhấn nút **Phê duyệt (Approve)** hoặc **Từ chối (Reject)** để cập nhật trực tiếp bảng giá kinh doanh.

---

## 5. XUẤT BẢN VÀ IN ẤN BẢNG GIÁ QUY CHUẨN
Khi bàn giao bảng giá cho đại lý hoặc đối tác thầu:
1.  **Bước 1:** Chọn bảng giá cần kết xuất, nhấn nút **In ấn (Printer)**.
2.  **Bước 2:** Một màn hình **Bản xem trước in chuẩn A4** được tạo lập nội bộ hiển thị đầy đủ thông tin pháp lý của doanh nghiệp và chữ ký số xác thực.
3.  **Bước 3:** Nhấn **In ngay / Lưu PDF** để gửi trực tiếp cho đại lý hoặc tải về dưới dạng tệp tin mềm PDF để lưu trữ nội bộ.
