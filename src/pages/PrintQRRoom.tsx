import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ChevronLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrintQRRoom() {
  const { rooms, devices } = useData();
  const navigate = useNavigate();

  // Use rooms from management, with device counts
  const roomsWithCounts = useMemo(() => {
    return rooms.map(r => {
      const roomDevices = devices.filter(d => d.room === r.name && d.subject === r.subject);
      return {
        ...r,
        count: roomDevices.length,
        available: roomDevices.filter(d => d.status === 'Tốt').length
      };
    });
  }, [rooms, devices]);

  const getQRValue = (subject: string, room: string) => {
    return `${window.location.origin}/room/${encodeURIComponent(subject)}/${encodeURIComponent(room)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 print:bg-white print:p-0">
      {/* Tool Bar - Hidden when printing */}
      <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/devices')}
          className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Quay lại danh sách
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">In QR Phòng bộ môn</h1>
          <p className="text-sm text-slate-500">{roomsWithCounts.length} phòng</p>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Printer className="h-5 w-5 mr-2" />
          Bắt đầu in (A4)
        </button>
      </div>

      {/* Printable Area */}
      <div className="max-w-5xl mx-auto bg-white shadow-sm p-8 rounded-xl print:shadow-none print:p-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 print:gap-4">
          {roomsWithCounts.map((r) => (
            <div
              key={r.id}
              className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl print:border print:rounded-lg"
            >
              <div className="mb-2 flex items-center text-indigo-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Phòng</span>
              </div>
              <QRCodeSVG
                value={getQRValue(r.subject, r.name)}
                size={120}
                level="M"
                includeMargin={true}
              />
              <div className="mt-2 text-center">
                <div className="font-bold text-sm text-slate-900">{r.name}</div>
                <div className="text-xs text-slate-500">{r.subject}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{r.count} thiết bị • {r.available} sẵn sàng</div>
              </div>
            </div>
          ))}
        </div>

        {roomsWithCounts.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <p>Chưa có phòng nào. Vào mục <strong>"Phòng"</strong> để tạo phòng trước.</p>
          </div>
        )}
      </div>
    </div>
  );
}
