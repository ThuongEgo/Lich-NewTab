# Lịch Âm Dương Việt Nam - Tab Mới

Tiện ích Tab Mới (Chrome Extension Manifest V3) hiển thị lịch **Âm Dương Việt Nam** gồm:
- Ngày dương hôm nay (kèm thứ)
- Ngày âm + tháng âm
- Can Chi (năm/tháng/ngày)
- Tiết khí (theo lịch mặt trời)
- **Giờ Hoàng Đạo** (tính offline)
- Câu trích dẫn ngẫu nhiên khi mở tab

Ngoài ra, tab có thể **đổi ảnh nền** và lưu cục bộ bằng `chrome.storage.local` (offline).

## Cài đặt

1. Mở `chrome://extensions`
2. Bật **Developer mode**
3. Nhấn **Load unpacked**
4. Chọn thư mục dự án `LichNewTab`

## Các file chính

- `manifest.json`: khai báo tên/phiên bản và trang `newtab.html`
- `newtab.html`: giao diện trang tab mới
- `newtab.js`: logic hiển thị và lưu ảnh nền
- `newtab.css`: giao diện/bố cục
- `vendor/amlich.js`: thư viện offline để tính âm lịch & giờ Hoàng Đạo (có ghi chú bản quyền riêng ở đầu file)

## Bản quyền

- Code và tài nguyên do `thuongdq` tạo cho dự án: xem trong `LICENSE`
- `vendor/amlich.js` thuộc bản quyền của **Ho Ngoc Duc** và giữ nguyên giấy phép/ghi chú bản quyền gốc đi kèm trong chính file đó

