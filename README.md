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
