import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../services/api';
import { Trash2, Search, UserPlus, Filter } from 'lucide-react';

export const Students = () => {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // New student form
    // New student form
    const [mode, setMode] = useState<'SINGLE' | 'BULK'>('SINGLE');
    const [newRoll, setNewRoll] = useState('');
    const [startRoll, setStartRoll] = useState('');
    const [endRoll, setEndRoll] = useState('');
    const [newType, setNewType] = useState<'REGULAR' | 'LATERAL'>('REGULAR');
    const [newName, setNewName] = useState('');

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const data = await api.hod.getClasses();
                // Sort classes: Year asc, Dept asc, Section asc
                data.sort((a: any, b: any) => {
                    if (a.yearOfStudy !== b.yearOfStudy) {
                        return Number(a.yearOfStudy) - Number(b.yearOfStudy);
                    }
                    if (a.dept !== b.dept) {
                        return a.dept.localeCompare(b.dept);
                    }
                    return a.section.localeCompare(b.section);
                });
                setClasses(data);
                if (data.length > 0) setSelectedClassId(data[0].id);
            } catch (err) {
                console.error(err);
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (!selectedClassId) return;
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const data = await api.hod.getStudentsByClass(selectedClassId);
                setStudents(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [selectedClassId]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (mode === 'SINGLE') {
                const newStudent = await api.hod.addStudent({
                    classId: selectedClassId,
                    rollNumber: newRoll,
                    name: newName,
                    type: newType
                });
                setStudents([...students, newStudent]);
            } else {
                // Bulk
                await api.hod.addStudent({
                    classId: selectedClassId,
                    startRoll,
                    endRoll,
                    type: newType
                });
                alert('Students added successfully (duplicates skipped). Refreshing list...');
                // Reload list
                const data = await api.hod.getStudentsByClass(selectedClassId);
                setStudents(data);
            }

            setNewRoll('');
            setStartRoll('');
            setEndRoll('');
            setNewName('');
            setIsAdding(false);
        } catch (err: any) {
            console.error(err);
            alert('Failed to add student(s): ' + (err.error || err.message || JSON.stringify(err)));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.hod.deleteStudent(id);
            setStudents(students.filter(s => s.id !== id));
        } catch (err) {
            alert('Failed to delete student');
        }
    };

    const filteredStudents = students.filter(s =>
        s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 fade-in pb-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">Manage Students</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View and edit student records by class</p>
                </div>
            </header>

            {/* Class Selector */}
            <Card className="p-4 flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-gray-900 sticky top-0 md:top-20 z-10 shadow-sm md:shadow-none border md:border max-w-4xl">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 min-w-max">
                    <Filter className="w-5 h-5" />
                    <span className="font-medium">Select Class:</span>
                </div>
                <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full md:max-w-xs px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    <option value="" disabled>Select a Class</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.yearOfStudy}-{cls.dept}-{cls.section} (Batch '{cls.admissionYear})
                        </option>
                    ))}
                </select>
            </Card>

            {selectedClassId ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                className="pl-10"
                                placeholder="Search roll number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => setIsAdding(!isAdding)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            {isAdding ? 'Cancel' : 'Add Student'}
                        </Button>
                    </div>

                    {isAdding && (
                        <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/20 animate-in slide-in-from-top-2">
                            <div className="flex gap-4 mb-4 border-b border-indigo-100 dark:border-indigo-800 pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="addMode"
                                        className="accent-indigo-600"
                                        checked={mode === 'SINGLE'}
                                        onChange={() => setMode('SINGLE')}
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Single Student</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="addMode"
                                        className="accent-indigo-600"
                                        checked={mode === 'BULK'}
                                        onChange={() => setMode('BULK')}
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bulk Add (Range)</span>
                                </label>
                            </div>

                            <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 align-end items-end">
                                {mode === 'SINGLE' ? (
                                    <>
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-medium mb-1 pl-1 text-gray-500">Roll Number</label>
                                            <Input
                                                placeholder="e.g. 23PA1A0501"
                                                value={newRoll}
                                                onChange={(e) => setNewRoll(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-medium mb-1 pl-1 text-gray-500">Name (Optional)</label>
                                            <Input
                                                placeholder="Student Name"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-medium mb-1 pl-1 text-gray-500">Start Roll</label>
                                            <Input
                                                placeholder="e.g. 23PA1A0501"
                                                value={startRoll}
                                                onChange={(e) => setStartRoll(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-medium mb-1 pl-1 text-gray-500">End Roll</label>
                                            <Input
                                                placeholder="e.g. 23PA1A0560"
                                                value={endRoll}
                                                onChange={(e) => setEndRoll(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex-1 min-w-[150px] w-full">
                                    <label className="block text-xs font-medium mb-1 pl-1 text-gray-500">Type</label>
                                    <select
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white h-[42px] outline-none"
                                    >
                                        <option value="REGULAR">Regular</option>
                                        <option value="LATERAL">Lateral</option>
                                    </select>
                                </div>
                                <Button type="submit" className="w-full md:w-auto">
                                    {mode === 'SINGLE' ? 'Add Student' : 'Generate Students'}
                                </Button>
                            </form>
                        </Card>
                    )}

                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading students...</div>
                    ) : (
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Roll Number</th>
                                            <th className="px-6 py-4 font-medium">Name</th>
                                            <th className="px-6 py-4 font-medium">Type</th>
                                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {filteredStudents.map(student => (
                                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 font-mono font-medium text-gray-900 dark:text-white">
                                                    {student.rollNumber}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                    {student.name || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                        ${student.type === 'LATERAL'
                                                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}
                                                    `}>
                                                        {student.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(student.id)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                    No students found matching your search.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500">Please select a class to view students</p>
                </div>
            )}
        </div>
    );
};
