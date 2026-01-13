import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Trash2, Calendar, Edit2, Info, Users, Copy, RefreshCw, ListChecks, Type, ShieldCheck } from 'lucide-react';
import { Permission } from '../types';
import { useToast } from '../context/ToastContext';

interface PermissionGroup {
    key: string;
    reason: string;
    startDate: string;
    endDate: string;
    type: string;
    customPeriods: number[];
    permissions: Permission[]; // All raw permissions in this group
    studentCount: number;
}


const getAllowedPeriods = (
    type: string,
    customPeriods: number[] = []
): number[] => {
    switch (type) {
        case 'FULL_DAY':
            return [1, 2, 3, 4, 5, 6, 7, 8];
        case 'MORNING':
            return [1, 2, 3, 4];
        case 'AFTERNOON':
            return [5, 6, 7, 8];
        case 'CUSTOM':
            return customPeriods;
        default:
            return [];
    }
};

export const Permissions: React.FC = () => {
    const { permissions, addPermission, updatePermission, deletePermission, students, fetchData } = useApp();
    const { showToast } = useToast();

    // UI State
    const [activeTab, setActiveTab] = useState<'CREATE' | 'VIEW'>('CREATE');
    // const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
    const [viewingGroup, setViewingGroup] = useState<PermissionGroup | null>(null); // For Popup
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Edit State: If non-null, we are editing this existing group of permissions
    const [editingOriginals, setEditingOriginals] = useState<Permission[] | null>(null);

    // Form State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [type, setType] = useState<'FULL_DAY' | 'MORNING' | 'AFTERNOON' | 'CUSTOM'>('FULL_DAY');
    const [customPeriods, setCustomPeriods] = useState<number[]>([]);

    // Multi-Select Students State
    const [selectedRolls, setSelectedRolls] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectionMode, setSelectionMode] = useState<'LIST' | 'MANUAL'>('LIST');
    const [manualEntry, setManualEntry] = useState('');

    const filteredStudents = students.filter(s =>
        s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Date Filter State
    const [filterDate, setFilterDate] = useState('');

    // Save Button Timer State
    const [saveCountdown, setSaveCountdown] = useState(0);

    useEffect(() => {
        if (saveCountdown > 0) {
            const timer = setTimeout(() => setSaveCountdown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [saveCountdown]);

    // --- GROUPING LOGIC ---
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, PermissionGroup> = {};

        // If filter date is active, check if it falls within range
        const targetDate = filterDate ? new Date(filterDate) : null;
        if (targetDate) targetDate.setHours(0, 0, 0, 0);

        permissions.forEach(perm => {
            // Date filtering
            if (targetDate) {
                const start = new Date(perm.startDate);
                const end = new Date(perm.endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);

                if (targetDate < start || targetDate > end) return;
            }

            // Create a unique key for the "Event"
            const key = `${perm.startDate}|${perm.endDate}|${perm.type}|${perm.reason}|${(perm.customPeriods || []).sort().join(',')}`;

            if (!groups[key]) {
                groups[key] = {
                    key,
                    reason: perm.reason,
                    startDate: perm.startDate,
                    endDate: perm.endDate,
                    type: perm.type,
                    customPeriods: perm.customPeriods || [],
                    permissions: [],
                    studentCount: 0
                };
            }
            groups[key].permissions.push(perm);
            groups[key].studentCount++;
        });

        // Convert to array and sort by date descending (newest first)
        return Object.values(groups).sort((a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
    }, [permissions, filterDate]);

    // --- ACTIONS ---

    const loadGroupForEdit = (group: PermissionGroup) => {
        setStartDate(group.startDate);
        setEndDate(group.endDate);
        setReason(group.reason);
        setType(group.type as any);
        setCustomPeriods(group.customPeriods);

        // Pre-select all students in this group
        const rolls = group.permissions.map(p => p.studentRoll);
        setSelectedRolls(rolls);
        setManualEntry(rolls.join(', '));

        setEditingOriginals(group.permissions);
        setActiveTab('CREATE');
        setViewingGroup(null); // Close popup
    };

    const togglePeriod = (p: number) => {
        setCustomPeriods(prev =>
            prev.includes(p) ? prev.filter(id => id !== p) : [...prev, p].sort()
        );
    };

    const toggleStudent = (roll: string) => {
        setSelectedRolls(prev =>
            prev.includes(roll) ? prev.filter(r => r !== roll) : [...prev, roll]
        );
    };

    const selectAllFiltered = () => {
        const rolls = filteredStudents.map(s => s.rollNumber);
        setSelectedRolls(prev => [...new Set([...prev, ...rolls])]);
    };

    const clearSelection = () => {
        setSelectedRolls([]);
        setManualEntry('');
    };

    const resetForm = () => {
        setStartDate('');
        setEndDate('');
        setReason('');
        setType('FULL_DAY');
        setCustomPeriods([]);
        setSelectedRolls([]);
        setManualEntry('');
        setEditingOriginals(null);
    };

    const handleModeSwitch = (mode: 'LIST' | 'MANUAL') => {
        if (mode === 'MANUAL') {
            setManualEntry(selectedRolls.join(', '));
        }
        setSelectionMode(mode);
    };

    const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setManualEntry(val);
        const rolls = val.split(',')
            .map(s => s.trim())
            .filter(Boolean);
        setSelectedRolls(rolls);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate || !reason) return alert('Fill all required fields');
        if (selectedRolls.length === 0) return alert('Select at least one student');
        if (type === 'CUSTOM' && customPeriods.length === 0) return alert('Select at least one period for Custom type');



        // Ack user and start timer
        showToast('Saving permission to Database...', 'info');
        setSaveCountdown(15);

        const payloadBase = { startDate, endDate, type, reason, customPeriods: type === 'CUSTOM' ? customPeriods : [] };

        try {
            if (editingOriginals) {
                // --- EDIT MODE (DIFFING) ---
                const originalRolls = editingOriginals.map(p => p.studentRoll);

                // 1. Identify Updates (Intersection): Students still selected -> Update their existing permission ID
                const toUpdate = editingOriginals.filter(p => selectedRolls.includes(p.studentRoll));

                // 2. Identify Deletes (Removed): Students in original but NOT in selected -> Delete their permission ID
                const toDelete = editingOriginals.filter(p => !selectedRolls.includes(p.studentRoll));

                // 3. Identify Adds (New): Students selected but NOT in original -> Create new permission
                const toAddRolls = selectedRolls.filter(r => !originalRolls.includes(r));

                // Execute Sequentially for safety/clarity (could be Promise.all)
                let processed = 0;

                // Updates
                for (const perm of toUpdate) {
                    await updatePermission(perm.id, payloadBase);
                    processed++;
                }
                // Deletes
                for (const perm of toDelete) {
                    await deletePermission(perm.id);
                    processed++;
                }
                // Adds
                for (const roll of toAddRolls) {
                    await addPermission({ ...payloadBase, studentRoll: roll });
                    processed++;
                }

                alert(`Updated Group: ${toUpdate.length} updated, ${toDelete.length} removed, ${toAddRolls.length} added.`);
                setEditingOriginals(null);
            } else {
                // --- CREATE MODE ---
                for (const roll of selectedRolls) {
                    await addPermission({
                        studentRoll: roll,
                        ...payloadBase
                    });
                }
                showToast(`Permissions updated for ${selectedRolls.length} students.`, 'success');
            }

            resetForm();
            setActiveTab('VIEW');
        } catch (error: any) {
            console.error('Save failed:', error);
            showToast('Failed to save permission: ' + (error.message || error.error || 'Unknown error'), 'error');
        }
    };

    const deleteGroup = async (group: PermissionGroup) => {
        if (!confirm(`Are you sure you want to delete this Event ("${group.reason}") and revoke permissions for all ${group.studentCount} students?`)) return;

        for (const perm of group.permissions) {
            await deletePermission(perm.id);
        }
        showToast('Permissions deleted successfully', 'success');
        setViewingGroup(null);
    };

    return (
        <div className="space-y-6 pb-20 relative">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Permissions</h1>
                <Button onClick={handleRefresh} variant="ghost" size="sm" disabled={isRefreshing}>
                    <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''} mr-2`} />
                    Refresh data
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full max-w-md">
                <button
                    onClick={() => { setActiveTab('CREATE'); resetForm(); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'CREATE' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    {editingOriginals ? 'Edit Information' : 'Create new Permission'}
                </button>
                <button
                    onClick={() => { setActiveTab('VIEW'); setEditingOriginals(null); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'VIEW' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    Active Permissions
                </button>
            </div>

            {/* TAB CONTENT: CREATE / EDIT */}
            {activeTab === 'CREATE' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                    {/* Left Column: Criteria */}
                    <Card className="p-6 lg:col-span-1 h-fit space-y-6">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="font-semibold text-lg">{editingOriginals ? 'Edit Permission Details' : 'Permission Details'}</h3>
                            {editingOriginals && <button onClick={resetForm} className="text-xs text-red-500 underline">Cancel Edit</button>}
                        </div>

                        <div className="space-y-3">
                            <Input
                                type="date"
                                label="Starting from"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                            <Input
                                type="date"
                                label="Ends on"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>

                        <Input
                            label="Reason / Event Name"
                            placeholder="e.g. Hackathon, Sports Meet, Medical"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'FULL_DAY', label: 'FULL_DAY(1-8)' },
                                    { value: 'MORNING', label: 'MORNING(1-4)' },
                                    { value: 'AFTERNOON', label: 'AFTERNOON(5-8)' },
                                    { value: 'CUSTOM', label: 'CUSTOM' }
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setType(opt.value as any)}
                                        className={`
                                            py-2 px-2 text-xs font-medium rounded-lg border transition-all
                                            ${type === opt.value ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
                                        `}
                                    >
                                        {opt.label.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {type === 'CUSTOM' && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Select Periods</label>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => togglePeriod(p)}
                                            className={`
                                                w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all
                                                ${customPeriods.includes(p)
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300'}
                                            `}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Right Column: Student Selection */}
                    <Card className="p-6 lg:col-span-2 flex flex-col h-[600px]">
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h3 className="font-semibold text-lg">Select Students ({new Set(selectedRolls).size})</h3>
                            <div className="flex gap-2">
                                {selectionMode === 'LIST' && <button onClick={selectAllFiltered} className="text-xs text-indigo-600 hover:underline">Select All</button>}
                                <span className="text-gray-300">|</span>
                                <button onClick={clearSelection} className="text-xs text-red-500 hover:underline">Clear</button>
                            </div>
                        </div>

                        {/* Toggle Mode */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-4">
                            <button
                                onClick={() => handleModeSwitch('LIST')}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${selectionMode === 'LIST' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                <ListChecks size={14} /> From List
                            </button>
                            <button
                                onClick={() => handleModeSwitch('MANUAL')}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${selectionMode === 'MANUAL' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                <Type size={14} /> Manual Entry
                            </button>
                        </div>

                        {selectionMode === 'LIST' ? (
                            <>
                                <div className="mb-4">
                                    <Input
                                        placeholder="Search Roll Number..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredStudents.length === 0 ? (
                                        <p className="text-center text-gray-400 py-10">No students found..</p>
                                    ) : (
                                        filteredStudents.map(s => {
                                            const isSelected = selectedRolls.includes(s.rollNumber);
                                            return (
                                                <label
                                                    key={s.id}
                                                    className={`
                                                        flex items-center justify-between px-4 py-3 cursor-pointer
                                                        transition
                                                        ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}
                                                    `}
                                                >
                                                    <span className={`font-mono text-sm ${isSelected ? 'font-semibold text-indigo-800 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {s.rollNumber}
                                                    </span>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleStudent(s.rollNumber)}
                                                        className="w-4 h-4 accent-indigo-600"
                                                    />
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                <textarea
                                    className="flex-1 w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                    placeholder="Enter Roll Numbers separated by commas (e.g., 23PA1A05C8, 23PA1A05C9)..."
                                    value={manualEntry}
                                    onChange={handleManualChange}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Values are automatically synced. You can paste a comma-separated list here.
                                </p>
                            </div>
                        )}



                        <div className="mt-4 pt-2 border-t">
                            <Button
                                onClick={handleSave}
                                disabled={saveCountdown > 0}
                                className={`w-full text-lg h-12 shadow-lg ${editingOriginals ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600'}`}
                            >
                                {saveCountdown > 0
                                    ? `Please wait... ${saveCountdown}s`
                                    : (editingOriginals ? 'Update Event & Students' : `Set Permissions to ${selectedRolls.length} Students`)
                                }
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* TAB CONTENT: VIEW GROUPS */}
            {activeTab === 'VIEW' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    {permissions.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <Info className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No active permissions currently</h3>
                            <p className="text-gray-500 dark:text-gray-400">Create one to see it here.</p>
                            <div className="flex justify-center mt-4">
                                <Button variant="secondary" onClick={() => setActiveTab('CREATE')}>Create Permission</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Filter by Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                    />
                                </div>
                                {filterDate && (
                                    <Button variant="ghost" size="sm" onClick={() => setFilterDate('')} className="text-red-500 h-[42px] mt-5">
                                        Clear
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupedPermissions.map(group => {
                                    const isRange = group.startDate !== group.endDate;
                                    let typeLabel = group.type.replace('_', ' ');
                                    if (group.type === 'CUSTOM' && group.customPeriods?.length) {
                                        typeLabel = `P: ${group.customPeriods.join(',')}`;
                                    }

                                    const isHodApproved = group.permissions.some(p => p.approvedBy === 'HOD');

                                    return (
                                        <div
                                            key={group.key}
                                            onClick={() => setViewingGroup(group)}
                                            className={`bg-white dark:bg-gray-900 p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${isHodApproved ? 'border-indigo-200 dark:border-indigo-800' : 'border-gray-200 dark:border-gray-800'}`}
                                        >
                                            <div className={`w-full absolute top-0 left-0 h-1 ${isHodApproved ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gray-100 dark:bg-gray-800'}`} />

                                            <div className="flex justify-between items-start mb-2 mt-2">
                                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-1" title={group.reason}>{group.reason}</h3>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide shrink-0 ${group.type === 'CUSTOM' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                        {typeLabel}
                                                    </span>
                                                    {isHodApproved && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                                                            <ShieldCheck size={10} /> HOD
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{group.startDate} {isRange && `➔ ${group.endDate}`}</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                                                    <Users size={14} className="text-indigo-500 dark:text-indigo-400" />
                                                    <span className="font-semibold text-indigo-700 dark:text-indigo-400">{group.studentCount} Students</span>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">Click for more details</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* DETAILS POPUP (GROUP VIEW) */}
            {viewingGroup && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <Card className="w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-hidden rounded-xl">

                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0 relative">
                            <h3 className="font-bold text-center text-lg text-gray-900 dark:text-white">Permission Details</h3>
                            {viewingGroup.permissions.some(p => p.approvedBy === 'HOD') && (
                                <div className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400" title="Approved by HOD">
                                    <ShieldCheck size={20} />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 overflow-y-auto text-center">

                            {/* Date Range */}
                            <div className="text-gray-900 dark:text-gray-100 font-medium">
                                From {viewingGroup.startDate.split('-').reverse().join('-')} to {viewingGroup.endDate.split('-').reverse().join('-')}
                            </div>

                            {/* Type */}
                            <div className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wide text-sm">
                                {viewingGroup.type.replace('_', ' ')}
                            </div>

                            {/* Reason */}
                            <div className="text-gray-800 dark:text-gray-200">
                                <span className="font-semibold text-gray-500 dark:text-gray-400">Reason : </span>
                                {viewingGroup.reason}
                            </div>

                            {/* Allowed Periods */}
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Allowed Periods</div>
                                <div className="text-gray-900 dark:text-gray-100 font-mono text-lg tracking-widest">
                                    {getAllowedPeriods(
                                        viewingGroup.type,
                                        viewingGroup.customPeriods
                                    ).join(' ')}
                                </div>
                            </div>

                            {/* Students */}
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    Students <span className="text-xs ml-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{viewingGroup.studentCount}</span>
                                </div>
                                <div className="flex flex-wrap justify-center gap-1.5 max-h-40 overflow-y-auto">
                                    {viewingGroup.permissions.map(p => (
                                        <span key={p.id} className={`text-xs border px-2 py-1 rounded ${p.approvedBy === 'HOD' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                            {p.studentRoll}
                                            {p.approvedBy === 'HOD' && '*'}
                                        </span>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2 shrink-0 bg-gray-50/50 dark:bg-gray-900">
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        const regRolls: string[] = [];
                                        const leRolls: string[] = [];

                                        // Sort permissions by roll number
                                        const sortedPerms = [...viewingGroup.permissions].sort((a, b) => a.studentRoll.localeCompare(b.studentRoll));

                                        sortedPerms.forEach(p => {
                                            const s = students.find(st => st.rollNumber === p.studentRoll);
                                            const shortRoll = p.studentRoll.slice(-2);
                                            if (s && s.type === 'LATERAL') leRolls.push(shortRoll);
                                            else regRolls.push(shortRoll);
                                        });

                                        const formattedStart = viewingGroup.startDate.split('-').reverse().join('-');
                                        const formattedEnd = viewingGroup.endDate.split('-').reverse().join('-');

                                        const details = `Permissions details:
From : ${formattedStart} to ${formattedEnd}
Reason: ${viewingGroup.reason}

Roll Numbers : ${regRolls.length ? regRolls.join(', ') + '.' : 'None.'}
LE : ${leRolls.length ? leRolls.join(', ') + '.' : 'None.'}`;

                                        navigator.clipboard.writeText(details);
                                        showToast('Copied permission to clipboard', 'info');
                                    }}
                                    className="flex-1 text-xs"
                                >
                                    <Copy size={16} className="mr-2" /> Copy
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => loadGroupForEdit(viewingGroup)}
                                    className="flex-1 text-xs"
                                >
                                    <Edit2 size={16} className="mr-2" /> Edit
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => deleteGroup(viewingGroup)}
                                    className="flex-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900"
                                >
                                    <Trash2 size={16} className="mr-2" /> Delete
                                </Button>
                            </div>

                            <Button onClick={() => setViewingGroup(null)} className="w-full">
                                Close
                            </Button>
                        </div>

                    </Card>
                </div>
            )}

        </div>
    );
};
