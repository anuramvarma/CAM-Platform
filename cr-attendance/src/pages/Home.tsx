import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, Users, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';

import { api } from '../services/api';
import { AttendanceRecord } from '../types';

export const Home: React.FC = () => {
    const { students, subjects } = useApp();
    const [history, setHistory] = React.useState<AttendanceRecord[]>([]);

    React.useEffect(() => {
        api.attendance.history().then(setHistory).catch(console.error);
    }, []);

    // Quick stats
    const totalStudents = students.length;
    const todayRaw = new Date().toISOString().split('T')[0];
    const todayCount = history.filter(h => h.date === todayRaw).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">Welcome back CR! We are ready to take attendance </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/mark" className="group">
                    <Card className="p-6 border-indigo-100 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors h-full flex flex-col items-center justify-center text-center cursor-pointer">
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white mb-3 shadow-lg group-hover:scale-110 transition-transform">
                            <PlusCircle size={24} />
                        </div>
                        <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Mark Attendance</h3>
                        <p className="text-sm text-indigo-600 dark:text-indigo-300 mt-1"> </p>
                    </Card>
                </Link>

                <Card className="p-6 flex flex-col justify-between h-full">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalStudents}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Users size={20} />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 flex flex-col justify-between h-full">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's attendances </p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{todayCount}</h3>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 flex flex-col justify-between h-full">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Subjects</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{subjects.length}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <BookOpen size={20} />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="pt-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                {history.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">No attendance records found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.slice(0, 5).map((record) => { // Get last 5
                            const subject = subjects.find(s => s.id === record.subjectId)?.name || 'Unknown Subject';
                            return (
                                <Card key={record.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{subject}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{record.date} • {record.session}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                            {record.absentees.length} Absent
                                        </span>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
