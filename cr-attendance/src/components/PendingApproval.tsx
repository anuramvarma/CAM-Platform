import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export const PendingApproval: React.FC = () => {
    const { logout, checkApprovalStatus } = useApp();
    const [loading, setLoading] = useState(false);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            await checkApprovalStatus();
        } finally {
            setTimeout(() => setLoading(false), 500); // Visual delay
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-500">
                    <Clock size={40} />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approval Pending</h1>

                <p className="text-gray-600 dark:text-gray-300">
                    Your request to join the class is currently pending approval from the Class Admin (CR1).
                </p>
                <p className="text-sm text-gray-500">
                    Please contact your Class Representative or check back later.
                </p>

                <div className="space-y-3 pt-6 w-full">
                    <Button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-10"
                    >
                        <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Checking...' : 'Refresh Status'}
                    </Button>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="secondary" onClick={logout} className="w-full text-red-600 hover:bg-red-50 h-10">
                            <LogOut size={16} className="mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
