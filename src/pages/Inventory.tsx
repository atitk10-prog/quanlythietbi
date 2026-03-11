import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, AlertCircle, CheckCircle, ImagePlus, RefreshCw, FlipHorizontal } from 'lucide-react';
import { api, type Device } from '../services/api';

export default function Inventory() {
  const [device, setDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState('Có mặt');
  const [isScanning, setIsScanning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);

  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const hasScanned = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const handleScanResult = useCallback(async (decodedText: string) => {
    if (hasScanned.current || !mountedRef.current) return;
    hasScanned.current = true;

    // Stop scanner
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
      }
    } catch { /* ignore */ }

    setCameraReady(false);
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

      const deviceData = await api.getDevice(deviceId);
      setDevice(deviceData);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Không tìm thấy thiết bị');
      setDevice(null);
    }
  }, []);

  const startScanner = useCallback(async (facing: 'environment' | 'user') => {
    if (!mountedRef.current) return;

    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* ignore */ }
      scannerRef.current = null;
    }

    setCameraStarting(true);
    setError(null);
    setCameraReady(false);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      await new Promise(resolve => setTimeout(resolve, 300));
      if (!mountedRef.current) return;

      const el = document.getElementById('reader-inventory');
      if (!el) {
        setError('Không thể khởi tạo scanner.');
        setCameraStarting(false);
        return;
      }

      const scanner = new Html5Qrcode('reader-inventory');
      scannerRef.current = scanner;

      const containerWidth = containerRef.current?.offsetWidth || 300;
      const qrboxSize = Math.min(Math.floor(containerWidth * 0.65), 250);

      await scanner.start(
        { facingMode: facing },
        { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize }, aspectRatio: 1 },
        (decodedText: string) => handleScanResult(decodedText),
        () => {}
      );

      if (mountedRef.current) {
        setCameraReady(true);
        setCameraStarting(false);
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      setCameraStarting(false);
      const errStr = String(err);
      if (errStr.includes('NotAllowedError') || errStr.includes('Permission')) {
        setError('Vui lòng cho phép truy cập camera.');
      } else if (errStr.includes('NotFoundError')) {
        setError('Không tìm thấy camera. Hãy thử chọn ảnh QR.');
      } else {
        setError('Không thể bật camera. Hãy thử nút "Chọn ảnh QR".');
      }
    }
  }, [handleScanResult]);

  useEffect(() => {
    mountedRef.current = true;
    hasScanned.current = false;

    if (!isScanning) return;

    const timer = setTimeout(() => {
      startScanner(facingMode);
    }, 500);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      try {
        if (scannerRef.current) {
          scannerRef.current.stop().catch(() => {});
          scannerRef.current = null;
        }
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  const handleSwitchCamera = async () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    await startScanner(newFacing);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    try {
      if (scannerRef.current && cameraReady) {
        try { await scannerRef.current.stop(); } catch { /* ignore */ }
        setCameraReady(false);
      }

      const { Html5Qrcode } = await import('html5-qrcode');
      const tempEl = document.getElementById('reader-inventory-file');
      if (!tempEl) return;

      const scanner = new Html5Qrcode('reader-inventory-file');
      const result = await scanner.scanFile(file, true);
      handleScanResult(result);
    } catch {
      setError('Không tìm thấy mã QR trong ảnh.');
      startScanner(facingMode);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScanAgain = () => {
    setDevice(null);
    setError(null);
    setSuccess(null);
    setStatus('Có mặt');
    hasScanned.current = false;
    setIsScanning(true);
  };

  const handleUpdateStatus = async () => {
    if (!device) return;
    setIsLoading(true);

    try {
      let newDeviceStatus = device.status;
      if (status === 'Hỏng') newDeviceStatus = 'Hỏng';
      if (status === 'Thiếu') newDeviceStatus = 'Mất';

      await api.updateDevice(device.id, { status: newDeviceStatus });

      setSuccess('Đã cập nhật trạng thái kiểm kê');
      setTimeout(() => {
        handleScanAgain();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Kiểm kê thiết bị</h1>
        <p className="mt-1 text-sm text-slate-600">
          Quét mã QR để đánh dấu tình trạng thiết bị
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
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
        <>
          {/* Camera Scanner */}
          <div
            ref={containerRef}
            className="bg-black rounded-xl overflow-hidden relative"
            style={{ minHeight: '280px' }}
          >
            <div id="reader-inventory" className="w-full" />
            {cameraStarting && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white mb-3" />
                <p className="text-white text-sm">Đang khởi động camera...</p>
              </div>
            )}
          </div>

          <div id="reader-inventory-file" style={{ display: 'none' }} />

          {/* Buttons */}
          <div className="flex gap-2">
            {cameraReady && (
              <button onClick={handleSwitchCamera}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 active:scale-[0.98] transition-all">
                <FlipHorizontal className="h-4 w-4" />
                Đổi camera
              </button>
            )}
            {(error || !cameraReady) && !cameraStarting && (
              <button onClick={() => { hasScanned.current = false; startScanner(facingMode); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all">
                <RefreshCw className="h-4 w-4" />
                Thử lại
              </button>
            )}
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer">
              <ImagePlus className="h-4 w-4" />
              Chọn ảnh QR
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </>
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
                  <div key={s}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${status === s ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}
                    onClick={() => setStatus(s)}
                  >
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
                onClick={handleScanAgain}
                className="flex-1 bg-white py-3 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                Quét lại
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={isLoading}
                className="flex-1 bg-indigo-600 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {isLoading ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <button
            onClick={handleScanAgain}
            className="bg-indigo-600 py-3 px-6 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            <Camera className="h-4 w-4 inline mr-2" />
            Bật Camera Quét QR
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 flex items-center">
          <Camera className="h-4 w-4 mr-2" />
          Hướng dẫn kiểm kê
        </h3>
        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>Quét QR từng thiết bị cần kiểm kê</li>
          <li>Chọn trạng thái: Có mặt / Thiếu / Hỏng</li>
          <li>Bấm "Xác nhận" để cập nhật</li>
        </ul>
      </div>
    </div>
  );
}
