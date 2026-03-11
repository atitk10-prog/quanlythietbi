import { useAuth } from '../store/auth';
import { useData } from '../context/DataContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { MonitorSmartphone, ArrowRightLeft, AlertTriangle, Wrench } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { devices, rooms, borrowHistory, isLoading } = useData();

  // Filter devices by managed_rooms for equipment staff
  const visibleDevices = (() => {
    if (user?.role === 'equipment' && user.managed_rooms) {
      const managedIds = user.managed_rooms.split(',').map(s => s.trim()).filter(Boolean);
      if (managedIds.length > 0) {
        const managedRooms = rooms.filter(r => managedIds.includes(r.id));
        return devices.filter(d => managedRooms.some(r => r.name === d.room && r.subject === d.subject));
      }
    }
    return devices;
  })();

  // Calculate stats from visible devices
  const stats = {
    total: visibleDevices.length,
    borrowing: visibleDevices.filter(d => d.status === 'Đang mượn').length,
    broken: visibleDevices.filter(d => d.status === 'Hỏng' || d.status === 'Hỏng nhẹ').length,
    maintenance: visibleDevices.filter(d => d.status === 'Cần bảo trì').length
  };

  // Calculate real weekly usage from borrowHistory
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const weeklyStats = dayNames.map(name => ({ name, borrow: 0, return: 0 }));

  borrowHistory.forEach(record => {
    if (record.borrow_date) {
      try {
        const borrowDay = new Date(record.borrow_date).getDay();
        weeklyStats[borrowDay].borrow++;
      } catch (_) {}
    }
    if (record.return_date) {
      try {
        const returnDay = new Date(record.return_date).getDay();
        weeklyStats[returnDay].return++;
      } catch (_) {}
    }
  });

  // T2-CN order
  const chartData = [...weeklyStats.slice(1), weeklyStats[0]].map(d => ({
    name: d.name,
    'Mượn': d.borrow,
    'Trả': d.return
  }));

  const statCards = [
    { name: 'Tổng thiết bị', value: stats.total, icon: MonitorSmartphone, color: 'bg-blue-500/10', textColor: 'text-blue-600' },
    { name: 'Đang mượn', value: stats.borrowing, icon: ArrowRightLeft, color: 'bg-emerald-500/10', textColor: 'text-emerald-600' },
    { name: 'Hỏng', value: stats.broken, icon: AlertTriangle, color: 'bg-red-500/10', textColor: 'text-red-600' },
    { name: 'Cần bảo trì', value: stats.maintenance, icon: Wrench, color: 'bg-amber-500/10', textColor: 'text-amber-600' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-40 animate-pulse"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
                <div className="ml-5 space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-20"></div>
                  <div className="h-8 bg-slate-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-6 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-60 mb-4"></div>
          <div className="h-80 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard {user?.role === 'leader' && <span className="text-lg font-normal text-slate-500 ml-2">(Bộ môn: {user.department})</span>}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-lg ${item.color}`}>
                  <item.icon className={`h-6 w-6 ${item.textColor}`} aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">{item.name}</dt>
                  <dd>
                    <div className="text-3xl font-bold text-slate-900">{item.value}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-medium leading-6 text-slate-900 mb-4">Biểu đồ sử dụng thiết bị (Tuần này)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
              <Tooltip
                cursor={{ fill: '#F1F5F9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" />
              <Bar dataKey="Mượn" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="Trả" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
