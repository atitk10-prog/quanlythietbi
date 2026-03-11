import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, type Device, type User, type BorrowRecord, type MaintenanceRecord, type Room } from '../services/api';

interface DataContextType {
    devices: Device[];
    users: User[];
    borrowHistory: BorrowRecord[];
    maintenanceHistory: MaintenanceRecord[];
    rooms: Room[];
    isLoading: boolean;
    refreshDevices: () => Promise<void>;
    refreshUsers: () => Promise<void>;
    refreshHistory: () => Promise<void>;
    refreshMaintenance: () => Promise<void>;
    refreshRooms: () => Promise<void>;
    refreshAll: () => Promise<void>;

    // Optimistic Update Helpers
    setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [devices, setDevices] = useState<Device[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [borrowHistory, setBorrowHistory] = useState<BorrowRecord[]>([]);
    const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

    const refreshDevices = useCallback(async () => {
        try {
            const data = await api.getDevices();
            setDevices(data);
        } catch (error) {
            console.error('Failed to refresh devices', error);
        }
    }, []);

    const refreshUsers = useCallback(async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to refresh users', error);
        }
    }, []);

    const refreshHistory = useCallback(async () => {
        try {
            const data = await api.getBorrowHistory();
            setBorrowHistory(data);
        } catch (error) {
            console.error('Failed to refresh history', error);
        }
    }, []);

    const refreshMaintenance = useCallback(async () => {
        try {
            const data = await api.getMaintenanceHistory();
            setMaintenanceHistory(data);
        } catch (error) {
            console.error('Failed to refresh maintenance', error);
        }
    }, []);

    const refreshRooms = useCallback(async () => {
        try {
            const data = await api.getRooms();
            setRooms(data);
        } catch (error) {
            console.error('Failed to refresh rooms', error);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        if (!hasInitialLoaded) setIsLoading(true);
        await Promise.all([
            refreshDevices(),
            refreshUsers(),
            refreshHistory(),
            refreshMaintenance(),
            refreshRooms()
        ]);
        setIsLoading(false);
        setHasInitialLoaded(true);
    }, [hasInitialLoaded, refreshDevices, refreshUsers, refreshHistory, refreshMaintenance, refreshRooms]);

    // Initial load — only if user is logged in
    useEffect(() => {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
            refreshAll();
        } else {
            setIsLoading(false);
        }
    }, []);

    return (
        <DataContext.Provider value={{
            devices,
            users,
            borrowHistory,
            maintenanceHistory,
            rooms,
            isLoading,
            refreshDevices,
            refreshUsers,
            refreshHistory,
            refreshMaintenance,
            refreshRooms,
            refreshAll,
            setDevices,
            setUsers,
            setRooms
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
