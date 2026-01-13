import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Trash2, Search, UserPlus, RefreshCw } from 'lucide-react';
/* import { Student } from '../types'; // Unused */

export const Students: React.FC = () => {
    const { students, addStudent, deleteStudent, fetchData } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // New student form state
    const [newRoll, setNewRoll] = useState('');
    const [newType, setNewType] = useState<'REGULAR' | 'LATERAL'>('REGULAR');

    const filteredStudents = students.filter(s =>
        s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRoll.trim()) {
            addStudent({
                id: newRoll.trim(),
                rollNumber: newRoll.trim(),
                name: '',
                type: newType
            });
            setNewRoll('');
            setIsAdding(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Students</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{students.length} Students Enrolled</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleRefresh} variant="ghost" disabled={isRefreshing}>
                        <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''} mr-2`} />
                        Refresh data
                    </Button>
                    <Button onClick={() => setIsAdding(!isAdding)} variant="secondary">
                        <UserPlus size={18} className="mr-2" />
                        {isAdding ? 'Cancel' : 'Add Student'}
                    </Button>
                </div>
            </div>

            {isAdding && (
                <Card className="p-4 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 animate-in slide-in-from-top-2">
                    <h3 className="font-semibold mb-3 dark:text-gray-100">Add New Student</h3>
                    <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
                        <Input
                            placeholder="Roll Number"
                            value={newRoll}
                            onChange={(e) => setNewRoll(e.target.value)}
                        />
                        <select
                            value={newType}
                            onChange={(e) => setNewType(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                            <option value="REGULAR">Regular</option>
                            <option value="LATERAL">Lateral</option>
                        </select>
                        <Button type="submit">Add</Button>
                    </form>
                </Card>
            )}

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                    className="pl-10"
                    placeholder="Search number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 max-h-[500px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {filteredStudents.length === 0 ? (
                    <p className="text-center text-gray-400 py-10">No students found</p>
                ) : (
                    filteredStudents.map(student => (
                        <div
                            key={student.id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            {/* LEFT: Roll Number */}
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-2.5 h-2.5 rounded-full
              ${student.type === 'LATERAL' ? 'bg-orange-400' : 'bg-blue-500'}
            `}
                                />
                                <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {student.rollNumber}
                                </span>
                            </div>

                            {/* RIGHT: Type + Delete */}
                            <div className="flex items-center gap-3">
                                <span
                                    className={`text-xs font-semibold px-2 py-1 rounded-full
              ${student.type === 'LATERAL'
                                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}
            `}
                                >
                                    {student.type}
                                </span>

                                <button
                                    onClick={() => deleteStudent(student.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
};
