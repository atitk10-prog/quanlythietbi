# Hướng Dẫn Vận Hành Hệ Thống Quản Lý Thiết Bị

Để ứng dụng hoạt động ổn định và đạt hiệu suất cao nhất, vui lòng tuân thủ các bước và quy tắc sau đây:

## 1. Triển Khai Backend (Google Apps Script)
> [!IMPORTANT]
> Mỗi khi bạn thay đổi code trong `Code.gs`, bạn **BẮT BUỘC** phải thực hiện bước này để thay đổi có hiệu lực.

1.  Mở trình soạn thảo **Google Apps Script**.
2.  Dán code mới từ file `Code.gs` vào.
3.  Bấm nút **Triển khai (Deploy)** -> **Quản lý phiên triển khai (Manage deployments)**.
4.  Chọn phiên bản hiện tại (thường là Web App) và bấm **Chỉnh sửa (Edit)**.
5.  Tại mục "Phiên bản" (Version), chọn **Phiên bản mới (New version)**.
6.  Bấm **Triển khai (Deploy)**.
7.  Copy link Web App URL mới và dán vào file `.env` (mục `VITE_GAS_URL`) nếu URL có thay đổi.

## 2. Quản Lý Dữ Liệu (Google Sheets)
- **Không tự ý đổi tên Sheet**: Tên các sheet phải giữ nguyên là `devices`, `borrow_history`, `maintenance`, `users`.
- **Hàng Header (Hàng 1)**: Bạn có thể thay đổi thứ tự các cột, nhưng **không được đổi tên** các tiêu đề cột (ví dụ: `email`, `password`, `id`...). Hệ thống của tôi đã được tối ưu để tự tìm cột theo tên, bất kể vị trí.
- **Dữ liệu mượn/trả**: Nếu bạn xóa dữ liệu trực tiếp trong Sheet, hãy đảm bảo không để lại hàng trống ở giữa dải dữ liệu.

## 3. Quản Lý Tài Khoản
- **Admin & Ban Giám Hiệu**: Có toàn quyền quản lý thiết bị, tài khoản, kiểm kê và bảo trì.
- **Cán bộ Thiết bị**: Quản lý thiết bị và bảo trì, nhưng không thể quản lý tài khoản người dùng khác.
- **Tổ trưởng**: Xem Dashboard và Thiết bị lọc theo bộ môn của mình.
- **Giáo viên**: Chỉ có quyền Quét QR (Mượn/Trả), xem Lịch sử cá nhân và sửa hồ sơ.

## 4. Bảo Trì Hệ Thống
- **Clear Cache**: Nếu thấy dữ liệu cũ vẫn hiển thị (do hệ thống Cache mới), hãy nhấn `Ctrl + F5` để làm mới hoàn toàn.
- **Reset Mật khẩu**: Nếu giáo viên quên mật khẩu, Admin có thể vào mục "Tài khoản" và nhấn nút "Reset" để đưa mật khẩu về mặc định `123456`.
- **Tự động sửa lỗi**: Tôi đã tích hợp tính năng **Auto-Repair** vào hệ thống Đăng nhập. Nếu dữ liệu bị đảo cột (do lỗi ở phiên bản cũ), hệ thống sẽ tự động phát hiện và sửa lại cho đúng ngay khi bạn đăng nhập.

## 5. Phương Án Nâng Cấp Tương Lai
- **Hóa mật khẩu (Hashing)**: Hiện tại mật khẩu đang lưu dạng văn bản thuần túy trong Google Sheets. Để an toàn tuyệt đối, nên nâng cấp hệ thống mã hóa mật khẩu ở cả Frontend và Backend.
- **Thông báo Email**: Tự động gửi email nhắc nhở giáo viên khi thiết bị quá hạn trả.
