// This is a mock API service that simulates the Google Apps Script backend.
// In a real deployment, you would replace these functions with fetch calls to your GAS Web App URL.
// ⚠️ WARNING: Passwords below are plain-text for DEMO purposes only.
// In production, use a proper authentication system with hashed passwords.

const GAS_URL = import.meta.env.VITE_GAS_URL || '';

// --- Types ---
export type Device = {
  id: string;
  name: string;
  subject: string;
  room: string;
  status: string;
  purchase_date: string;
  value: number;
  qr_code?: string;
  quantity: number;
  created_by: string;
};

export type BorrowRecord = {
  id: string;
  device_id: string;
  teacher: string;
  class: string;
  period: string;
  borrow_date: string;
  return_date: string | null;
  status: string;
  note: string;
  quantity: number;
  returned_qty: number;
  missing_qty: number;
  missing_note: string;
};

export type MaintenanceRecord = {
  id: string;
  device_id: string;
  date: string;
  content: string;
  technician: string;
  result: string;
  room?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  managed_rooms?: string;
};

export type DashboardStats = {
  total: number;
  borrowing: number;
  broken: number;
  maintenance: number;
};

export type Room = {
  id: string;
  name: string;
  subject: string;
  description: string;
};

// Helper function to call the GAS backend
const callApi = async (action: string, data: any = {}) => {
  if (!GAS_URL) {
    throw new Error('VITE_GAS_URL is not defined in .env file');
  }

  const url = `${GAS_URL}?action=${encodeURIComponent(action)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
};

// --- Mappers to handle backend column names ---
const mapDevice = (row: any): Device => ({
  id: row.device_id || row.id || '',
  name: row.device_name || row.name || '',
  subject: row.subject || '',
  room: row.room || '',
  status: row.status || '',
  purchase_date: row.purchase_date || '',
  value: Number(row.value) || 0,
  qr_code: row.qr_code || '',
  quantity: parseInt(row.quantity) || 1,
  created_by: row.created_by || '',
});

const mapBorrow = (row: any): BorrowRecord => ({
  id: row.borrow_id || row.id || '',
  device_id: row.device_id || '',
  teacher: row.teacher || '',
  class: row.class || '',
  period: row.period || '',
  borrow_date: row.borrow_date || '',
  return_date: row.return_date || null,
  status: row.status || '',
  note: row.note || '',
  quantity: parseInt(row.quantity) || 1,
  returned_qty: parseInt(row.returned_qty) || 0,
  missing_qty: parseInt(row.missing_qty) || 0,
  missing_note: row.missing_note || '',
});

const mapMaintenance = (row: any): MaintenanceRecord => ({
  id: row.maintenance_id || row.id || '',
  device_id: row.device_id || '',
  date: row.date || '',
  content: row.content || '',
  technician: row.technician || '',
  result: row.result || '',
});

const mapUser = (row: any): User => ({
  id: String(row.user_id || row.id || ''),
  name: row.name || '',
  email: row.email || '',
  password: row.password || '',
  role: row.role || '',
  department: row.department || '',
  managed_rooms: row.managed_rooms || '',
});

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    return await callApi('login', { email, password });
  },

  // Devices
  getDevices: async (): Promise<Device[]> => {
    const data = await callApi('getDevices');
    return data.map(mapDevice);
  },

  getDevice: async (id: string): Promise<Device> => {
    const data = await callApi('getDevice', { id });
    return mapDevice(data);
  },

  addDevice: async (device: Omit<Device, 'id' | 'purchase_date' | 'value'>): Promise<{ success: boolean, id: string }> => {
    return await callApi('addDevice', device);
  },

  updateDevice: async (id: string, updates: Partial<Device>): Promise<{ success: boolean }> => {
    return await callApi('updateDevice', { id, ...updates });
  },

  deleteDevice: async (id: string): Promise<{ success: boolean }> => {
    return await callApi('deleteDevice', { id });
  },

  // Borrow
  borrowDevice: async (data: { device_id: string; teacher: string; class: string; period: string; note: string; quantity?: number }): Promise<{ success: boolean, id: string, available: number }> => {
    return await callApi('borrowDevice', data);
  },

  returnDevice: async (data: { device_id: string; borrow_id: string; teacher: string; returned_qty?: number; missing_qty?: number; missing_note?: string; status: string; note: string }): Promise<{ success: boolean }> => {
    return await callApi('returnDevice', data);
  },

  getActiveBorrows: async (device_id: string): Promise<BorrowRecord[]> => {
    const data = await callApi('getActiveBorrows', { device_id });
    return data.map(mapBorrow);
  },

  returnMissing: async (data: { borrow_id: string; teacher: string; returned_qty: number; note?: string }): Promise<{ success: boolean }> => {
    return await callApi('returnMissing', data);
  },

  getBorrowHistory: async (): Promise<BorrowRecord[]> => {
    const data = await callApi('getBorrowHistory');
    return data.map(mapBorrow);
  },

  // Maintenance
  getMaintenanceHistory: async (): Promise<MaintenanceRecord[]> => {
    const data = await callApi('getMaintenanceHistory');
    return data.map(mapMaintenance);
  },

  addMaintenance: async (data: Omit<MaintenanceRecord, 'id'>): Promise<{ success: boolean, id: string }> => {
    return await callApi('addMaintenance', data);
  },

  // Dashboard Stats
  getDashboardStats: async (department?: string): Promise<DashboardStats> => {
    // If not leader, backend can calculate naturally. Else we fetch and filter locally.
    const devices = await api.getDevices();
    const filteredDevices = department ? devices.filter(d => d.subject === department) : devices;

    const total = filteredDevices.length;
    const borrowing = filteredDevices.filter(d => d.status === 'Đang mượn').length;
    const broken = filteredDevices.filter(d => d.status === 'Hỏng' || d.status === 'Hỏng nhẹ').length;
    const maintenance = filteredDevices.filter(d => d.status === 'Cần bảo trì').length;

    return { total, borrowing, broken, maintenance };
  },

  // Weekly usage stats for chart
  getWeeklyUsageStats: async (department?: string): Promise<{ name: string; borrow: number; return: number }[]> => {
    const [devices, borrowHistory] = await Promise.all([
      api.getDevices(),
      api.getBorrowHistory()
    ]);

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const stats = dayNames.map(name => ({ name, borrow: 0, return: 0 }));

    const filteredHistory = department
      ? borrowHistory.filter(h => {
        const device = devices.find(d => d.id === h.device_id);
        return device?.subject === department;
      })
      : borrowHistory;

    filteredHistory.forEach(record => {
      if (record.borrow_date) {
        const borrowDay = new Date(record.borrow_date).getDay();
        stats[borrowDay].borrow++;
      }
      if (record.return_date) {
        const returnDay = new Date(record.return_date).getDay();
        stats[returnDay].return++;
      }
    });

    // Return Mon-Sat
    return stats.slice(1);
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const data = await callApi('getUsers');
    return data.map(mapUser);
  },

  addUser: async (user: Omit<User, 'id'> & { password?: string }): Promise<{ success: boolean, id: string }> => {
    return await callApi('addUser', user);
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<{ success: boolean }> => {
    return await callApi('updateUser', { id, user_id: id, ...updates });
  },

  deleteUser: async (id: string): Promise<{ success: boolean }> => {
    return await callApi('deleteUser', { id, user_id: id });
  },

  changePassword: async (id: string, currentPassword: string, newPassword: string): Promise<{ success: boolean }> => {
    return await callApi('changePassword', { id, user_id: id, currentPassword, newPassword });
  },

  // Rooms
  getRooms: async (): Promise<Room[]> => {
    return await callApi('getRooms');
  },

  addRoom: async (room: Omit<Room, 'id'>): Promise<{ success: boolean; id: string }> => {
    return await callApi('addRoom', room);
  },

  updateRoom: async (id: string, updates: Partial<Room>): Promise<{ success: boolean }> => {
    return await callApi('updateRoom', { id, ...updates });
  },

  deleteRoom: async (id: string): Promise<{ success: boolean }> => {
    return await callApi('deleteRoom', { id });
  },
};
