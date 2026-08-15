# TKB Giáo viên V2

## Tính năng mới
- Tự động ẩn mọi cột lớp không có tiết của giáo viên đang tìm.
- Có tùy chọn "Hiện buổi tối".
- Khi bật/tắt buổi tối, các cột lớp được tính lại ngay mà không cần tải lại Google Sheets.
- Giữ nguyên Thứ/ngày, Buổi, Tiết và chỉ hiện các lớp thực sự có lịch.
- Có In / Lưu PDF.

## Deploy Vercel
1. Giải nén ZIP.
2. Upload toàn bộ file bên trong lên root GitHub repository.
3. Import repository vào Vercel.
4. Framework Preset: Other.
5. Build Command: để trống.
6. Output Directory: để trống.
7. Deploy.

Google Sheet phải bật:
Bất kỳ ai có đường liên kết đều có thể xem.


## In 1 trang A4
- Nút "In 1 trang / Lưu PDF" tự đo kích thước bảng.
- Tự thu nhỏ theo cả chiều rộng và chiều cao.
- Khổ in: A4 ngang, lề 4 mm.
- Tự ẩn toàn bộ phần nhập liệu và tùy chọn khi in.
- Nên chọn Scale = Default/100% trong hộp thoại in vì app đã tự scale.


## V4
- In A4 theo chiều dọc (Portrait).
- Nội dung ô hiển thị dạng một dòng: `Toán - T. Tuấn`.
- Vẫn tự thu nhỏ để ưu tiên nằm trên 1 trang.


## V5 - In chắc chắn 1 trang A4 dọc
- Tự đếm số hàng thực tế trước khi in.
- Co/dãn chiều cao từng hàng dựa theo số hàng.
- Sau đó mới scale toàn bảng để khớp cả chiều rộng và chiều cao A4.
- Không còn giới hạn scale cũ gây tràn sang trang 2.
- Ô lịch hiển thị một dòng, ví dụ: `Toán - T. Tuấn`.
- Khi in từ Chrome, nên tắt Headers and footers để có thêm diện tích.


## V6
- Thêm checkbox `Hiện Chủ nhật`.
- Bỏ chọn để loại toàn bộ Chủ nhật khỏi bảng và khỏi bản in.
- Các cột lớp sẽ tự tính lại sau khi ẩn Chủ nhật.


## V7
- Toàn bộ giao diện và bản in dùng font Times New Roman.


## V8 - In 1 trang theo nội dung, không ép A4 dọc
- Bỏ ép khổ A4 Portrait.
- Không ép chiều giấy; người dùng có thể chọn khổ/chiều trong hộp thoại in.
- App tự co vừa toàn bộ phần thời khóa biểu đang hiển thị vào 1 trang.
- Ưu tiên thẩm mỹ: chiều cao dòng, cỡ chữ và độ rộng cột được chọn theo số dòng/cột trước khi scale.
- Giữ font Times New Roman và màu nền giống bảng/PDF mẫu.
