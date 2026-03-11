import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, AlertCircle } from 'lucide-react';

export default function Scan() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [0] // 0 = Html5QrcodeScanType.SCAN_TYPE_CAMERA
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        scanner.clear();

        // Handle the scanned URL or ID
        try {
          // Room QR: /room/subject/room
          if (decodedText.includes('/room/')) {
            const parts = decodedText.split('/room/');
            if (parts.length > 1) {
              const roomPath = parts[1].trim();
              navigate(`/room/${roomPath}`);
              return;
            }
          }
          // Device QR: /device/TBXXX
          if (decodedText.includes('/device/')) {
            const parts = decodedText.split('/device/');
            if (parts.length > 1) {
              const id = parts[1].trim().toUpperCase();
              navigate(`/device/${id}`);
              return;
            }
          }
          // If it's just an ID
          navigate(`/device/${decodedText.trim().toUpperCase()}`);
        } catch (e) {
          setError('Mã QR không hợp lệ');
        }
      },
      (errorMessage) => {
        // Ignore normal scanning errors (like no QR found in frame)
        // console.warn(errorMessage);
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Quét mã thiết bị</h1>
        <p className="mt-2 text-sm text-slate-600">
          Đưa mã QR của thiết bị vào khung hình để quét
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div id="reader" className="w-full rounded-lg overflow-hidden"></div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 flex items-center">
          <Camera className="h-4 w-4 mr-2" />
          Hướng dẫn
        </h3>
        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>Cho phép trình duyệt sử dụng camera</li>
          <li>Giữ điện thoại ổn định</li>
          <li>Đảm bảo đủ ánh sáng</li>
        </ul>
      </div>
    </div>
  );
}
