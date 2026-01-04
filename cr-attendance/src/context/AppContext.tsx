import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { Student, Subject, AttendanceRecord, Permission, AppSettings } from '../types';

interface AppContextType {
    settings: AppSettings;
    isAuthenticated: boolean;
    login: (credentials: any) => Promise<void>;
    logout: () => void;
    resetApp: () => void;
    completeSetup: (data: any) => Promise<void>;

    // Data
    students: Student[];
    subjects: Subject[];
    permissions: Permission[];
    history: AttendanceRecord[];

    // Actions
    addSubject: (name: string, code?: string) => Promise<void>;
    deleteSubject: (id: string) => Promise<void>;
    addStudent: (student: any) => Promise<void>;
    deleteStudent: (id: string) => Promise<void>;
    addPermission: (perm: Omit<Permission, 'id'>) => Promise<void>;
    updatePermission: (id: string, perm: Partial<Permission>) => Promise<void>;
    deletePermission: (id: string) => Promise<void>;
    markAttendance: (record: AttendanceRecord) => Promise<void>;

    // Loaders
    fetchData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({ isSetupComplete: false });

    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);

    // Check auth on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const setupState = localStorage.getItem('setupComplete') === 'true';
        if (token) {
            setIsAuthenticated(true);
            setSettings({ isSetupComplete: setupState });
            fetchData();
        }
    }, []);

    const fetchData = async () => {
        try {
            const [sts, subs, perms, hist] = await Promise.all([
                api.students.getAll(),
                api.subjects.getAll(),
                api.permissions.getAll(),
                api.attendance.history()
            ]);
            setStudents(sts);
            setSubjects(subs);
            setPermissions(perms);
            setHistory(hist);
        } catch (err) {
            console.error('Failed to load data', err);
        }
    };

    const login = async (creds: any) => {
        const res = await api.auth.login(creds);
        localStorage.setItem('token', res.token);
        localStorage.setItem('setupComplete', res.classConfigured);

        setIsAuthenticated(true);
        setSettings({ isSetupComplete: res.classConfigured });

        if (res.classConfigured) {
            fetchData();
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('setupComplete');
        setIsAuthenticated(false);
        setStudents([]);
        setSubjects([]);
        setPermissions([]);
    };

    const resetApp = async () => {
        // Placeholder for reset functionality if backend supports it, otherwise just local logout/clear
        // Ideally this should call a backend endpoint to wipe data if that's the intention
        // For now, mirroring logout but deeper clean if needed
        logout();
    };

    const completeSetup = async (data: any) => {
        const res = await api.class.setup(data);

        // Critical: Update token with new permissions (classId)
        if (res.token) {
            localStorage.setItem('token', res.token);
            // If using axios interceptors, update defaults here. 
            // Since we read from localStorage in api.ts helper, this should be enough for next specific calls.
        }

        localStorage.setItem('setupComplete', 'true');
        setSettings({ isSetupComplete: true });

        // Slight delay to ensure token persistence before fetch
        setTimeout(() => fetchData(), 100);
    };

    const addSubject = async (name: string, code?: string) => {
        await api.subjects.add({ name, code });
        // Refresh
        const subs = await api.subjects.getAll();
        setSubjects(subs);
    };

    const deleteSubject = async (id: string) => {
        await api.subjects.delete(id);
        const subs = await api.subjects.getAll();
        setSubjects(subs);
    };

    const addPermission = async (perm: any) => {
        await api.permissions.add(perm);
        const perms = await api.permissions.getAll();
        setPermissions(perms);
    };

    const updatePermission = async (id: string, perm: any) => {
        await api.permissions.update(id, perm);
        const perms = await api.permissions.getAll();
        setPermissions(perms);
    };

    const deletePermission = async (id: string) => {
        await api.permissions.delete(id);
        const perms = await api.permissions.getAll();
        setPermissions(perms);
    };

    const markAttendance = async (record: any) => {
        await api.attendance.mark(record);
        // Optimistically update history or just append
        // Since record structure matches what's needed for history list
        setHistory(prev => [record, ...prev]);

        // Also Trigger fetch to be safe and get updated db state (ids etc)
        fetchData();
    };

    const addStudent = async (student: any) => {
        await api.students.add(student);
        const sts = await api.students.getAll();
        setStudents(sts);
    };

    const deleteStudent = async (id: string) => {
        await api.students.delete(id);
        const sts = await api.students.getAll();
        setStudents(sts);
    };

    return (
        <AppContext.Provider value={{
            isAuthenticated,
            settings,
            login,
            logout,
            resetApp,
            completeSetup,
            students,
            subjects,
            permissions,
            history,
            addSubject,
            deleteSubject,
            addStudent,
            deleteStudent,
            addPermission,
            updatePermission,
            deletePermission,
            markAttendance,
            fetchData
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
