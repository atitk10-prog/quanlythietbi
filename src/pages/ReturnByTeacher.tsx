import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { api } from '../services/api';
import { format } from 'date-fns';
import { ArrowLeft, Package, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ReturnByTeacher() {
  const { teacher } = useParams<{ teacher: string }>();
  const teacherName = decodeURIComponent(teacher || '');
  const navigate = useNavigate();
  const { borrowHistory, devices, refreshHistory, refreshDevices } = useData();
  const [returningId, setReturningId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    refreshHistory?.();
  }, []);

  const activeBorrows = borrowHistory.filter(
    b => b.teacher === teacherName && b.status === 'Đang mượn'
  );

  const getDeviceName = (deviceId: string) => {
    const d = devices.find(dev => dev.id === deviceId);
    return d ? d.name : deviceId;
  };

  const handleReturn = async (borrowId: string, deviceId: string, quantity: number) => {
    setReturningId(borrowId);
    try {
      await api.returnDevice({
        borrow_id: borrowId,
        device_id: deviceId,
        teacher: teacherName,
        returned_qty: quantity,
        missing_qty: 0,
        missing_note: '',
        status: 'Đã trả',
        note: ''
      });
      showToast('Trả thiết bị thành công!');
      refreshHistory?.();
      refreshDevices?.();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi trả thiết bị', 'error');
    } finally {
      setReturningId(null);
    }
  };

  const handleReturnAll = async () => {
    if (activeBorrows.length === 0) return;
    setReturningId('all');
    try {
      for (const b of activeBorrows) {
        await api.returnDevice({
          borrow_id: b.id,
          device_id: b.device_id,
          teacher: teacherName,
          returned_qty: b.quantity || 1,
          missing_qty: 0,
          missing_note: '',
          status: 'Đã trả',
          note: ''
        });
      }
      showToast(`Đã trả tất cả ${activeBorrows.length} thiết bị!`);
      refreshHistory?.();
      refreshDevices?.();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi trả thiết bị', 'error');
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Trả thiết bị</h1>
          <p className="text-sm text-slate-500">Giáo viên: <span className="font-semibold text-indigo-600">{teacherName}</span></p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-blue-800 flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Đang mượn ({activeBorrows.length} thiết bị)
          </h3>
          {activeBorrows.length > 1 && (
            <button
              onClick={handleReturnAll}
              disabled={returningId !== null}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 active:scale-95 transition-all"
            >
              {returningId === 'all' ? 'Đang trả...' : 'Trả tất cả'}
            </button>
          )}
        </div>

        {activeBorrows.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Không có thiết bị đang mượn</p>
            <p className="text-xs text-slate-500 mt-1">Giáo viên {teacherName} đã trả hết thiết bị</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeBorrows.map(b => (
              <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-900">{getDeviceName(b.device_id)}</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-semibold">
                      SL: {b.quantity || 1}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    <span className="font-mono text-indigo-500">{b.device_id}</span>
                    {b.class && <span> • Lớp {b.class}</span>}
                    {b.period && <span> - T{b.period}</span>}
                    {b.borrow_date && (
                      <span> • Mượn: {format(new Date(b.borrow_date), 'dd/MM HH:mm')}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleReturn(b.id, b.device_id, b.quantity || 1)}
                  disabled={returningId !== null}
                  className="ml-3 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 active:scale-95 transition-all flex-shrink-0"
                >
                  {returningId === b.id ? 'Đang trả...' : 'Trả'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 md:bottom-6 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
