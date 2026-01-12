import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

import { api } from '../services/api';
import { Trash2, Search, FileSignature, Filter, Calendar, CheckCircle, RefreshCw } from 'lucide-react';

export const Permissions = () => {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [permissions, setPermissions] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]); // For dropdown
    const [loading, setLoading] = useState(false);

    // New Permission Form
    const [isAdding, setIsAdding] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState('FULL_DAY');
    const [customPeriods, setCustomPeriods] = useState<number[]>([]);
    const [reason, setReason] = useState('');

    // Filters
    const [filterDate, setFilterDate] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterReason, setFilterReason] = useState('');

    const uniqueReasons = Array.from(new Set((permissions || []).map(p => p.reason).filter(Boolean)));

    const [selectedRolls, setSelectedRolls] = useState<string[]>([]);
    const [studentSearch, setStudentSearch] = useState('');

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

    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshPermissions = async () => {
        if (!selectedClassId) return;
        setIsRefreshing(true);
        try {
            const [permsData, studentsData] = await Promise.all([
                api.hod.getPermissionsByClass(selectedClassId),
                api.hod.getStudentsByClass(selectedClassId)
            ]);
            setPermissions(permsData);
            setStudents(studentsData);
        } catch (err) {
            console.error(err);
        } finally {
            setIsRefreshing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedClassId) {
            setLoading(true);
            refreshPermissions();
        }
    }, [selectedClassId]);

    const filteredStudents = React.useMemo(() => {
        if (!Array.isArray(students)) return [];
        return students.filter(s => {
            if (!s) return false;
            const name = s.name || '';
            const roll = s.rollNumber || '';
            const search = studentSearch.toLowerCase();
            return name.toLowerCase().includes(search) || roll.toLowerCase().includes(search);
        });
    }, [students, studentSearch]);

    const filteredPermissions = React.useMemo(() => {
        if (!Array.isArray(permissions)) return [];
        return permissions.filter(perm => {
            if (!perm) return false;
            const matchesDate = filterDate ? (perm.startDate && perm.endDate && perm.startDate <= filterDate && perm.endDate >= filterDate) : true;
            const matchesType = filterType ? perm.type === filterType : true;
            const matchesReason = filterReason ? perm.reason === filterReason : true;
            return matchesDate && matchesType && matchesReason;
        });
    }, [permissions, filterDate, filterType, filterReason]);

    const toggleStudent = (roll: string) => {
        if (selectedRolls.includes(roll)) {
            setSelectedRolls(selectedRolls.filter(r => r !== roll));
        } else {
            setSelectedRolls([...selectedRolls, roll]);
        }
    };

    const toggleAll = () => {
        if (selectedRolls.length === filteredStudents.length) {
            setSelectedRolls([]);
        } else {
            setSelectedRolls(filteredStudents.map(s => s.rollNumber));
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRolls.length === 0) {
            alert('Please select at least one student');
            return;
        }

        if (type === 'CUSTOM' && customPeriods.length === 0) {
            alert('Please select at least one period for Custom permission');
            return;
        }

        try {
            // Backend now supports array of rolls
            await api.hod.addPermission({
                classId: selectedClassId,
                studentRoll: selectedRolls,
                startDate,
                endDate,
                type,
                customPeriods,
                reason
            });

            // Refresh permissions
            const permsData = await api.hod.getPermissionsByClass(selectedClassId);
            setPermissions(permsData);

            setIsAdding(false);
            // Reset
            setSelectedRolls([]);
            setStudentSearch('');
            setStartDate('');
            setEndDate('');
            setReason('');
            setCustomPeriods([]);
            setType('FULL_DAY');
        } catch (err) {
            alert('Failed to grant permissions');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Revoke this permission?')) return;
        try {
            await api.hod.deletePermission(id);
            setPermissions(permissions.filter(p => p.id !== id));
        } catch (err) {
            alert('Failed to revoke permission');
        }
    };

    if (!Array.isArray(classes)) {
        return <div>Crash before render</div>;
    }

    return (
        <div className="space-y-6 fade-in pb-10">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Permissions</h1>
                    <p className="text-gray-500 dark:text-gray-400">Grant and revoke student permissions</p>
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
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={refreshPermissions} disabled={isRefreshing}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button onClick={() => setIsAdding(!isAdding)}>
                            <FileSignature className="w-4 h-4 mr-2" />
                            {isAdding ? 'Cancel' : 'Grant Permission'}
                        </Button>
                    </div>

                    {isAdding && (
                        <Card className="p-6 bg-indigo-50 dark:bg-indigo-900/20 animate-in slide-in-from-top-2">
                            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">New Permission</h3>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-medium mb-1">Select Students ({selectedRolls.length})</label>
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                                            <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-2">
                                                <div className="relative flex-1">
                                                    <Search className="absolute left-2 top-2.5 w-3 h-3 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search name/roll..."
                                                        className="w-full pl-7 pr-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 outline-none"
                                                        value={studentSearch}
                                                        onChange={(e) => setStudentSearch(e.target.value)}
                                                    />
                                                </div>
                                                <Button type="button" size="sm" variant="secondary" className="px-2 text-xs h-8" onClick={toggleAll}>
                                                    {selectedRolls.length === filteredStudents.length ? 'None' : 'All'}
                                                </Button>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                                                {filteredStudents.map(s => (
                                                    <div
                                                        key={s.id}
                                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedRolls.includes(s.rollNumber) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                        onClick={() => toggleStudent(s.rollNumber)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRolls.includes(s.rollNumber)}
                                                            onChange={() => { }} // handled by div click
                                                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                                                        />
                                                        <div className="text-sm">
                                                            <span className="font-mono font-medium text-gray-700 dark:text-gray-300 mr-2">{s.rollNumber}</span>
                                                            <span className="text-gray-600 dark:text-gray-400 truncate">{s.name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {filteredStudents.length === 0 && (
                                                    <div className="p-4 text-center text-xs text-gray-400">No students found</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Type</label>
                                            <select
                                                value={type}
                                                onChange={(e) => setType(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                            >
                                                <option value="FULL_DAY">Full Day</option>
                                                <option value="MORNING">Morning Session</option>
                                                <option value="AFTERNOON">Afternoon Session</option>
                                                <option value="CUSTOM">Custom Periods</option>
                                            </select>
                                        </div>
                                        {type === 'CUSTOM' && (
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Select Periods</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                                                        <label key={p} className={`flex items-center justify-center w-8 h-8 rounded border cursor-pointer select-none transition-colors ${customPeriods.includes(p) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400'}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={customPeriods.includes(p)}
                                                                onChange={() => {
                                                                    if (customPeriods.includes(p)) {
                                                                        setCustomPeriods(customPeriods.filter(cp => cp !== p));
                                                                    } else {
                                                                        setCustomPeriods([...customPeriods, p].sort());
                                                                    }
                                                                }}
                                                            />
                                                            {p}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                required
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">End Date</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                required
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Reason</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sports Event, Medical..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit">
                                        Grant Permission to {selectedRolls.length} Student{selectedRolls.length !== 1 ? 's' : ''}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading permissions...</div>
                    ) : (
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Values Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                                            <input
                                                type="date"
                                                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={filterDate}
                                                onChange={(e) => setFilterDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Type</label>
                                        <select
                                            className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                        >
                                            <option value="">All Types</option>
                                            <option value="FULL_DAY">Full Day</option>
                                            <option value="MORNING">Morning Only</option>
                                            <option value="AFTERNOON">Afternoon Only</option>
                                            <option value="CUSTOM">Custom Periods</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Reason</label>
                                        <select
                                            className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={filterReason}
                                            onChange={(e) => setFilterReason(e.target.value)}
                                        >
                                            <option value="">All Reasons</option>
                                            {uniqueReasons.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end pb-0.5">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => {
                                                setFilterDate('');
                                                setFilterType('');
                                                setFilterReason('');
                                            }}
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Student</th>
                                            <th className="px-6 py-4 font-medium">Dates</th>
                                            <th className="px-6 py-4 font-medium">Type</th>
                                            <th className="px-6 py-4 font-medium">Reason</th>
                                            <th className="px-6 py-4 font-medium">Approved By</th>
                                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {filteredPermissions.map(perm => (
                                            <tr key={perm.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 font-mono font-medium text-gray-900 dark:text-white">
                                                    {Array.isArray(perm.studentRoll) ? perm.studentRoll.join(', ') : perm.studentRoll}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        {perm.startDate && perm.endDate ? (
                                                            <>
                                                                {perm.startDate.split('-').reverse().join('-')} to {perm.endDate.split('-').reverse().join('-')}
                                                            </>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${perm.type === 'FULL_DAY' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                        perm.type === 'MORNING' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                                            perm.type === 'AFTERNOON' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' :
                                                                'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                                        }`}>
                                                        {perm.type === 'CUSTOM' ? `Periods: ${perm.customPeriods?.join(', ')}` : perm.type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                                    {perm.reason}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {perm.approvedBy === 'HOD' ? (
                                                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium text-xs">
                                                            <CheckCircle className="w-3 h-3" /> HoD
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">CR</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(perm.id)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Revoke Permission"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredPermissions.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                    No permissions match your filters.
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
                    <p className="text-gray-500">Please select a class to view permissions</p>
                </div>
            )}
        </div>
    );
};
