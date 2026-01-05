import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { UserCheck, UserX, Clock, RefreshCw, UserPlus } from 'lucide-react';

interface RequestUser {
    _id: string;
    email: string;
    createdAt: string;
}

export const Misc: React.FC = () => {
    const [requests, setRequests] = useState<RequestUser[]>([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await api.misc.getRequests();
            setRequests(data);
        } catch (err) {
            console.error(err);
            showToast('Failed to load requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (id: string, email: string) => {
        if (!confirm(`Approve access for ${email}?`)) return;
        try {
            await api.misc.approve(id);
            showToast(`Approved ${email}`, 'success');
            setRequests(prev => prev.filter(r => r._id !== id));
        } catch (err) {
            showToast('Failed to approve', 'error');
        }
    };

    const handleReject = async (id: string, email: string) => {
        if (!confirm(`Reject access for ${email}?`)) return;
        try {
            await api.misc.reject(id);
            showToast(`Rejected ${email}`, 'error'); // Using error type for red color, but it's a success action
            setRequests(prev => prev.filter(r => r._id !== id));
        } catch (err) {
            showToast('Failed to reject', 'error');
        }
    };

    const [guestEmail, setGuestEmail] = useState('');
    const [guestPassword, setGuestPassword] = useState('');
    const [expiry, setExpiry] = useState(24); // 24 hours default
    const [creatingGuest, setCreatingGuest] = useState(false);

    const handleCreateGuest = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingGuest(true);
        try {
            await api.misc.createGuest({ email: guestEmail, password: guestPassword, expiresInHours: expiry });
            showToast('Guest credentials created successfully!', 'success');
            setGuestEmail('');
            setGuestPassword('');
        } catch (error: any) {
            showToast(error.message || 'Failed to create guest', 'error');
        } finally {
            setCreatingGuest(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Approvals</h1>
                <Button variant="secondary" onClick={fetchRequests} disabled={loading}>
                    <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''} mr-2`} />
                    Refresh
                </Button>
            </div>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Pending Requests ({requests.length})</h3>

                {loading && requests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                        <UserCheck size={48} className="mx-auto mb-2 opacity-50" />
                        <p>No pending requests.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map(req => (
                            <div key={req._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div className="mb-3 sm:mb-0">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{req.email}</div>
                                    <div className="flex items-center text-xs text-gray-500 pt-1">
                                        <Clock size={12} className="mr-1" />
                                        Requested: {new Date(req.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none h-9 text-sm"
                                        onClick={() => handleApprove(req._id, req.email)}
                                    >
                                        <UserCheck size={16} className="mr-2" /> Approve
                                    </Button>
                                    <Button
                                        className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none h-9 text-sm"
                                        onClick={() => handleReject(req._id, req.email)}
                                    >
                                        <UserX size={16} className="mr-2" /> Reject
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                <h4 className="font-bold flex items-center mb-1">
                    <Clock size={16} className="mr-2" />
                    How this works
                </h4>
                <p>
                    When a new Class Representative (CR2) tries to join this class using the setup code, they will be placed in a pending state.
                    As the primary Admin (CR1), you must approve them here before they can access the dashboard.
                </p>
            </div>

            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4 text-indigo-700 dark:text-indigo-400">
                    <UserPlus size={24} />
                    <h3 className="text-lg font-bold">Create Guest Access (temporary)</h3>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                    Create temporary credentials for a guest or substitute CR. These credentials will automatically expire after the set duration.
                </p>

                <form onSubmit={handleCreateGuest} className="space-y-4 max-w-md">
                    <Input
                        label="Guest Email"
                        type="email"
                        placeholder="guest@example.com"
                        value={guestEmail}
                        onChange={e => setGuestEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Guest Password"
                        type="password"
                        placeholder="Set a password"
                        value={guestPassword}
                        onChange={e => setGuestPassword(e.target.value)}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Expires In
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            value={expiry}
                            onChange={(e) => setExpiry(Number(e.target.value))}
                        >
                            <option value={1}>1 Hour</option>
                            <option value={3}>3 Hours</option>
                            <option value={12}>12 Hours</option>
                            <option value={24}>24 Hours</option>
                            <option value={48}>2 Days</option>
                            <option value={168}>1 Week</option>
                        </select>
                    </div>

                    <Button type="submit" disabled={creatingGuest || !guestEmail || !guestPassword} className="w-full">
                        {creatingGuest ? 'Creating...' : 'Create Guest Credentials'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};
