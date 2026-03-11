import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { api, type Device } from '../services/api';

export default function Inventory() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState('Có mặt');
  const [isScanning, setIsScanning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isScanning) return;

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      'reader-inventory',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [0] // 0 = Html5QrcodeScanType.SCAN_TYPE_CAMERA
      },
      /* verbose= */ false
    );

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        setIsScanning(false);

        try {
          let deviceId = '';
          if (decodedText.includes('/device/')) {
            const parts = decodedText.split('/device/');
            if (parts.length > 1) {
              deviceId = parts[1].trim().toUpperCase();
            }
          } else {
            deviceId = decodedText.trim().toUpperCase();
          }

          setScanResult(deviceId);
          const deviceData = await api.getDevice(deviceId);
          setDevice(deviceData);
          setError(null);
        } catch (e: any) {
          setError(e.message || 'Không tìm thấy thiết bị');
          setDevice(null);
        }
      },
      (errorMessage) => {
        // Ignore normal scanning errors
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isScanning]);

  const handleUpdateStatus = async () => {
    if (!device) return;
    setIsLoading(true);

    try {
      // In a real app, this would be a specific inventory API call
      // For now, we update the device status if it's marked as broken/missing
      let newDeviceStatus = device.status;
      if (status === 'Hỏng') newDeviceStatus = 'Hỏng';
      if (status === 'Thiếu') newDeviceStatus = 'Mất';

      await api.updateDevice(device.id, { status: newDeviceStatus });

      setSuccess('Đã cập nhật trạng thái kiểm kê');
      setTimeout(() => {
        setSuccess(null);
        setDevice(null);
        setScanResult(null);
        setIsScanning(true);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Kiểm kê thiết bị</h1>
        <p className="mt-2 text-sm text-slate-600">
          Quét mã QR để đánh dấu tình trạng thiết bị
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

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center text-emerald-700">
          <CheckCircle className="h-5 w-5 mr-3" />
          {success}
        </div>
      )}

      {isScanning ? (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div id="reader-inventory" className="w-full rounded-lg overflow-hidden"></div>
        </div>
      ) : device ? (
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-slate-50 border-b border-slate-200">
            <h3 className="text-lg leading-6 font-medium text-slate-900">
              Thiết bị: {device.name}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 font-mono">
              ID: {device.id} | Phòng: {device.room}
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Trạng thái kiểm kê</label>
              <div className="space-y-3">
                {['Có mặt', 'Thiếu', 'Hỏng'].map((s) => (
                  <div key={s} className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50" onClick={() => setStatus(s)}>
                    <input
                      id={`inv-status-${s}`}
                      name="inv-status"
                      type="radio"
                      checked={status === s}
                      onChange={() => setStatus(s)}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-slate-300"
                    />
                    <label htmlFor={`inv-status-${s}`} className="ml-3 block text-sm font-medium text-slate-900 cursor-pointer w-full">
                      {s}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => {
                  setDevice(null);
                  setIsScanning(true);
                  setError(null);
                }}
                className="flex-1 bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Quét lại
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={isLoading}
                className="flex-1 bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={() => setIsScanning(true)}
            className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Bật lại Camera
          </button>
        </div>
      )}
    </div>
  );
}
