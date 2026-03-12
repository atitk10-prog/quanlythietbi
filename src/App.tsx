import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/auth';
import { DataProvider } from './context/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Scan from './pages/Scan';
import DeviceAction from './pages/DeviceAction';
import History from './pages/History';
import Maintenance from './pages/Maintenance';
import Inventory from './pages/Inventory';
import PrintQRs from './pages/PrintQRs';
import Users from './pages/Users';
import Profile from './pages/Profile';
import RoomAction from './pages/RoomAction';
import PrintQRRoom from './pages/PrintQRRoom';
import Rooms from './pages/Rooms';
import ReturnByTeacher from './pages/ReturnByTeacher';

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Users with managed_rooms can access device management pages
    if (!user.managed_rooms) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="devices" element={<ProtectedRoute allowedRoles={['equipment', 'vice_principal', 'admin']}><Devices /></ProtectedRoute>} />
                <Route path="scan" element={<Scan />} />
                <Route path="device/:id" element={<DeviceAction />} />
                <Route path="room/:subject/:room" element={<RoomAction />} />
                <Route path="history" element={<History />} />
                <Route path="return/:teacher" element={<ReturnByTeacher />} />
                <Route path="inventory" element={<ProtectedRoute allowedRoles={['equipment', 'vice_principal', 'admin']}><Inventory /></ProtectedRoute>} />
                <Route path="maintenance" element={<ProtectedRoute allowedRoles={['equipment', 'vice_principal', 'admin']}><Maintenance /></ProtectedRoute>} />
                <Route path="print-qr" element={<ProtectedRoute allowedRoles={['equipment', 'vice_principal', 'admin']}><PrintQRs /></ProtectedRoute>} />
                <Route path="print-qr-room" element={<ProtectedRoute allowedRoles={['equipment', 'vice_principal', 'admin']}><PrintQRRoom /></ProtectedRoute>} />
                <Route path="rooms" element={<ProtectedRoute allowedRoles={['equipment', 'vice_principal', 'admin']}><Rooms /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute allowedRoles={['admin', 'vice_principal']}><Users /></ProtectedRoute>} />
                <Route path="profile" element={<Profile />} />

                {/* Fallback for unimplemented routes */}
                <Route path="*" element={
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-6xl mb-4">🚧</div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Tính năng đang phát triển</h2>
                    <p className="text-slate-500 text-sm">Chức năng này sẽ sớm được hoàn thiện.</p>
                  </div>
                } />
              </Route>
            </Routes>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
