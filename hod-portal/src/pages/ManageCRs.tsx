import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { Users, Check, X, Trash2, Mail, Clock } from 'lucide-react';

export const ManageCRs = () => {
    const [crs, setCrs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCRs();
    }, []);

    const fetchCRs = async () => {
        try {
            const data = await api.hod.getCRs();
            setCrs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.hod.approveCR(id);
            fetchCRs(); // Refresh
        } catch (err) {
            alert('Failed to approve');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this account?')) return;
        try {
            await api.hod.deleteUser(id);
            setCrs(crs.filter(c => c.id !== id));
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const pendingCRs = crs.filter(c => !c.isApproved);
    const activeCRs = crs.filter(c => c.isApproved);

    if (loading) return <div className="text-center py-12 text-gray-500">Loading CRs...</div>;

    return (
        <div className="space-y-8 fade-in pb-10">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage CRs</h1>
                <p className="text-gray-500 dark:text-gray-400">Approve new class representatives and manage existing accounts</p>
            </header>

            {/* Pending Requests */}
            {pendingCRs.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-orange-600 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Pending Approval
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pendingCRs.map(cr => (
                            <Card key={cr.id} className="p-6 border-l-4 border-l-orange-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate" title={cr.email}>{cr.email}</h3>
                                        <div className="text-xs text-gray-500 mt-1">Requested {new Date(cr.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleApprove(cr.id)}
                                    >
                                        <Check className="w-4 h-4 mr-2" /> Approve
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="flex-1 text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(cr.id)}
                                    >
                                        <X className="w-4 h-4 mr-2" /> Reject
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Active CRs */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    Active Representatives
                </h2>
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Email / Contact</th>
                                    <th className="px-6 py-4 font-medium">Class Status</th>
                                    <th className="px-6 py-4 font-medium">Joined</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {activeCRs.map(cr => (
                                    <tr key={cr.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                {cr.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {cr.classId ? (
                                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                                    {cr.classId.yearOfStudy}-{cr.classId.dept}-{cr.classId.section}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">No Class Assigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {new Date(cr.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(cr.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title="Remove CR"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {activeCRs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            No active CRs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
};
