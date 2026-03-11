import qrcode
import os
import csv
from datetime import datetime

# Cấu hình
BASE_URL = "https://school-device.app/device/"
OUTPUT_DIR = "generated_qrs"
CSV_FILE = "devices_list.csv" # File CSV chứa danh sách ID thiết bị

def generate_bulk_qr(device_ids=None):
    """
    Sinh mã QR hàng loạt cho danh sách ID thiết bị.
    Nếu không có danh sách, sẽ sinh mẫu cho 500 thiết bị (TB001 -> TB500).
    """
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Đã tạo thư mục: {OUTPUT_DIR}")

    # Nếu không có danh sách đầu vào, tạo mẫu 500 thiết bị
    if not device_ids:
        device_ids = [f"TB{str(i).zfill(3)}" for i in range(1, 501)]

    print(f"Bắt đầu sinh {len(device_ids)} mã QR...")

    for device_id in device_ids:
        # Đường dẫn URL của thiết bị (Khi quét sẽ mở trang mượn/trả)
        data = f"{BASE_URL}{device_id}"
        
        # Cấu hình QR
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        # Lưu file ảnh
        img = qr.make_image(fill_color="black", back_color="white")
        file_path = os.path.join(OUTPUT_DIR, f"{device_id}.png")
        img.save(file_path)

    print(f"Hoàn tất! Tất cả mã QR đã được lưu tại thư mục: {OUTPUT_DIR}")

if __name__ == "__main__":
    # Bạn có thể chuẩn bị file CSV hoặc chạy mẫu mặc định
    try:
        if os.path.exists(CSV_FILE):
            with open(CSV_FILE, mode='r', encoding='utf-8') as f:
                reader = csv.reader(f)
                ids = [row[0] for row in reader if row]
                generate_bulk_qr(ids)
        else:
            print(f"Không tìm thấy {CSV_FILE}, đang sinh mẫu 500 mã (TB001 - TB500)...")
            generate_bulk_qr()
    except Exception as e:
        print(f"Lỗi: {e}")
