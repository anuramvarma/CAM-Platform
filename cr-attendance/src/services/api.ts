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
        register: async (credentials: any) => {
            const res = await fetch(`${API_URL}/auth/register`, {
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
        },
        changePassword: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        checkEmail: async (email: string) => {
            const res = await fetch(`${API_URL}/auth/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        resetPassword: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        }
    },
    class: {
        setup: async (data: any) => {
            const res = await fetch(`${API_URL}/class/setup`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        }
    },
    students: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/students`, { headers: getHeaders() });
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapId) : [];
        },
        add: async (data: any) => {
            const res = await fetch(`${API_URL}/students`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return mapId(await res.json());
        },
        delete: async (id: string) => {
            await fetch(`${API_URL}/students/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
        }
    },
    subjects: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/subjects`, { headers: getHeaders() });
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapId) : [];
        },
        add: async (data: any) => {
            const res = await fetch(`${API_URL}/subjects`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return mapId(await res.json());
        },
        delete: async (id: string) => {
            await fetch(`${API_URL}/subjects/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
        }
    },
    attendance: {
        mark: async (data: any) => {
            const res = await fetch(`${API_URL}/attendance`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
        history: async (date?: string) => {
            const url = date ? `${API_URL}/history?date=${date}` : `${API_URL}/history`;
            const res = await fetch(url, { headers: getHeaders() });
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapId) : [];
        }
    },
    permissions: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/permissions`, { headers: getHeaders() });
            const data = await res.json();
            return Array.isArray(data) ? data.map(mapId) : [];
        },
        add: async (data: any) => {
            const res = await fetch(`${API_URL}/permissions`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return mapId(await res.json());
        },
        update: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/permissions/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return mapId(await res.json());
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_URL}/permissions/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!res.ok) throw await res.json();
            return res.json(); // Or handle as needed, e.g., no return for successful delete
        }
    },

    misc: {
        getRequests: async () => {
            const res = await fetch(`${API_URL}/misc/requests`, { headers: getHeaders() });
            if (!res.ok) throw await res.json();
            return await res.json();
        },
        approve: async (targetUserId: string) => {
            const res = await fetch(`${API_URL}/misc/approve`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ targetUserId })
            });
            if (!res.ok) throw await res.json();
            return await res.json();
        },
        reject: async (targetUserId: string) => {
            const res = await fetch(`${API_URL}/misc/reject`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ targetUserId })
            });
            if (!res.ok) throw await res.json();
            return await res.json();
        },
        createGuest: async (data: any) => {
            const res = await fetch(`${API_URL}/misc/guest`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw await res.json();
            return await res.json();
        }
    }
};
