import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { X, User, Lock, Save, AlertCircle } from 'lucide-react';

interface ProfileModalProps {
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
    const [profile, setProfile] = useState<{ email: string } | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Status State
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await api.auth.getProfile();
            setProfile(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setSubmitting(true);
        try {
            await api.auth.changePassword({
                currentPassword,
                newPassword
            });
            setSuccess('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden relative">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                        <User size={20} className="text-indigo-600" />
                        My Profile
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* User Info */}
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 block">Registered Email</label>
                        <div className="text-indigo-900 font-medium">{profile?.email}</div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm border-b pb-2 mb-4">
                            <Lock size={16} /> Change Password
                        </h3>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                                <Save size={16} />
                                {success}
                            </div>
                        )}

                        <div className="space-y-4">
                            <Input
                                label="Current Password"
                                type="password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                required
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="New Password"
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                />
                                <Input
                                    label="Confirm New"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-2"
                            disabled={submitting}
                        >
                            {submitting ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};
