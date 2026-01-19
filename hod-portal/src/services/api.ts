//const API_URL = 'http://localhost:5001/api';
const API_URL = 'https://cam-platform.onrender.com/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// Helper to map MongoDB _id to frontend id
const mapId = (item: any) => ({ ...item, id: item._id || item.id });

// Helper to handle requests and Auth errors
const request = async (endpoint: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers
        }
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown Error' }));
        // Auto-logout on Invalid Token (400) or Access Denied (401)
        if (res.status === 401 || (res.status === 400 && error.message === 'Invalid Token')) {
            localStorage.removeItem('token');
            window.location.href = '/login'; // Force redirect
        }
        throw error;
    }
    return res.json();
};

export const api = {
    auth: {
        login: async (credentials: any) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        getProfile: async () => {
            return request('/auth/me');
        },
        changePassword: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        }
    },
    // Add HoD specific endpoints here as we build them
    // Reusing existing ones where applicable
    class: {
        getAll: async () => {
            // HoD needs ALL classes, not just "me". 
            // We might need a new endpoint `/class/all` or assume HoD can see all.
            // Currently `class/me` returns the class of the logged in user. 
            // If HoD checks `class/me`, it might return nothing or a special HoD class?
            // HoD manages the department.
            const res = await fetch(`${API_URL}/class/all`, { headers: getHeaders() }); // Hypothetical endpoint
            if (!res.ok) {
                // Fallback or error handling
                // If endpoint doesn't exist, we need to create it in backend.
                console.warn("API /class/all might not exist yet");
                throw await res.json();
            }
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapId) : [];
        },
        // Using existing manual fetch for now to minimize changes in less critical parts
    },
    students: {
        getAll: async () => {
            const data = await request('/students');
            return Array.isArray(data) ? data.map(mapId) : [];
        },
        // HoD needs to manage all students.
    },
    permissions: {
        getAll: async () => {
            const data = await request('/permissions/all');
            return Array.isArray(data) ? data.map(mapId) : [];
        }
    },
    hod: {
        // Specific HoD actions
        getStats: async (period?: string) => {
            return request(`/hod/stats${period ? `?period=${period}` : ''}`);
        },
        getComparison: async (params: { date: string, classId: string, periodA: string, periodB: string }) => {
            const query = new URLSearchParams(params).toString();
            return request(`/hod/comparison?${query}`);
        },
        getRegister: async (params: { date: string, classId: string }) => {
            const query = new URLSearchParams(params).toString();
            return request(`/hod/register?${query}`);
        },
        getAnalyticsHistory: async (date: string) => {
            return request(`/hod/stats/history?date=${date}`);
        },
        getClasses: async () => {
            const res = await fetch(`${API_URL}/hod/classes`, { headers: getHeaders() });
            if (!res.ok) throw await res.json();
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapId) : [];
        },
        createClass: async (data: any) => {
            const res = await fetch(`${API_URL}/hod/classes`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        editClass: async (classId: string, data: any) => {
            const res = await fetch(`${API_URL}/hod/classes/${classId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return mapId(await res.json());
        },
        deleteClass: async (classId: string) => {
            const res = await fetch(`${API_URL}/hod/classes/${classId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        getStudentsByClass: async (classId: string) => {
            const res = await fetch(`${API_URL}/hod/students/${classId}`, { headers: getHeaders() });
            if (!res.ok) throw await res.json();
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapId) : [];
        },
        addStudent: async (data: any) => {
            const res = await fetch(`${API_URL}/hod/students`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return mapId(await res.json());
        },
        deleteStudent: async (id: string) => {
            const res = await fetch(`${API_URL}/hod/students/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        getPermissionsByClass: async (classId: string) => {
            const res = await fetch(`${API_URL}/hod/permissions/${classId}`, { headers: getHeaders() });
            if (!res.ok) throw await res.json();
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapId) : [];
        },
        addPermission: async (data: any) => {
            const res = await fetch(`${API_URL}/hod/permissions`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return mapId(await res.json());
        },
        deletePermission: async (id: string) => {
            const res = await fetch(`${API_URL}/hod/permissions/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        getCRs: async () => {
            const res = await fetch(`${API_URL}/hod/crs`, { headers: getHeaders() });
            if (!res.ok) throw await res.json();
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapId) : [];
        },
        approveCR: async (userId: string) => {
            const res = await fetch(`${API_URL}/hod/crs/approve`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ userId })
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        deleteUser: async (id: string) => {
            const res = await fetch(`${API_URL}/hod/crs/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        promoteClasses: async () => {
            const res = await fetch(`${API_URL}/hod/classes/promote`, {
                method: 'POST',
                headers: getHeaders()
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        undoPromoteClasses: async () => {
            const res = await fetch(`${API_URL}/hod/classes/promote/undo`, {
                method: 'POST',
                headers: getHeaders()
            });
            if (!res.ok) throw await res.json();
            return res.json();
        }
    }
};
