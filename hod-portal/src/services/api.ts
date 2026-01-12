// const API_URL = 'http://localhost:5001/api';
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
            const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
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
        }
    },
    students: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/students`, { headers: getHeaders() });
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapId) : [];
        },
        // HoD needs to manage all students.
    },
    permissions: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/permissions/all`, { headers: getHeaders() }); // HoD needs ALL permissions
            if (!res.ok) throw await res.json();
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapId) : [];
        }
    },
    hod: {
        // Specific HoD actions
        getStats: async () => {
            const res = await fetch(`${API_URL}/hod/stats`, { headers: getHeaders() });
            if (!res.ok) throw await res.json();
            return res.json();
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
        }
    }
};
