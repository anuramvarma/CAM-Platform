import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import {
    Trash2, Calendar, Edit2, Info, Users, Copy, RefreshCw,
    ListChecks, Type, ShieldCheck, X, Plus, ChevronRight,
    Search, Clock, CheckCircle2, Bell, Check, XCircle, FileText,
    ExternalLink, Eye
} from 'lucide-react';
import { Permission, PendingPermission } from '../types';
import { useToast } from '../context/ToastContext';

interface PermissionGroup {
    key: string;
    reason: string;
    startDate: string;
    endDate: string;
    type: string;
    customPeriods: number[];
    permissions: Permission[];
    studentCount: number;
    approvedBy?: string;
    letterFileUrl?: string | null;
}

const isImageUrl = (url: string | null | undefined) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png)$/) != null || url.startsWith('data:image');
};

const getAllowedPeriods = (type: string, customPeriods: number[] = []): number[] => {
    switch (type) {
        case 'FULL_DAY': return [1, 2, 3, 4, 5, 6, 7, 8];
        case 'MORNING': return [1, 2, 3, 4];
        case 'AFTERNOON': return [5, 6, 7, 8];
        case 'CUSTOM': return customPeriods;
        default: return [];
    }
};

const fmtDate = (d: string) => d.split('-').reverse().join('/');

const TypeBadge: React.FC<{ type: string; customPeriods?: number[] }> = ({ type, customPeriods }) => {
    const labels: Record<string, string> = { FULL_DAY: 'Full Day', MORNING: 'Morning', AFTERNOON: 'Afternoon', CUSTOM: 'Custom' };
    const colors: Record<string, string> = {
        FULL_DAY: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
        MORNING: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
        AFTERNOON: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300',
        CUSTOM: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
    };
    const label = type === 'CUSTOM' && customPeriods?.length ? `P: ${customPeriods.join(',')}` : labels[type] || type;
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${colors[type] || 'bg-gray-100 text-gray-600'}`}>
            {label}
        </span>
    );
};

export const Permissions: React.FC = () => {
    const {
        permissions, addPermission, updatePermission, deletePermission,
        students, fetchData,
        pendingPermissions, approvePendingPermission, rejectPendingPermission,
        deletePendingPermission, fetchPendingPermissions
    } = useApp();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'CREATE' | 'VIEW' | 'PENDING'>('CREATE');
    const [viewingGroup, setViewingGroup] = useState<PermissionGroup | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [editingOriginals, setEditingOriginals] = useState<Permission[] | null>(null);

    const todayStr = new Date().toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);
    const [reason, setReason] = useState('');
    const [type, setType] = useState<'FULL_DAY' | 'MORNING' | 'AFTERNOON' | 'CUSTOM'>('FULL_DAY');
    const [customPeriods, setCustomPeriods] = useState<number[]>([]);
    const [selectedRolls, setSelectedRolls] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectionMode, setSelectionMode] = useState<'LIST' | 'MANUAL'>('LIST');
    const [manualEntry, setManualEntry] = useState('');
    const [filterDate, setFilterDate] = useState(todayStr);
    const [saveCountdown, setSaveCountdown] = useState(0);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchData(), fetchPendingPermissions()]);
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleApprovePending = async (req: PendingPermission) => {
        try {
            showToast('Approving request…', 'info');
            await approvePendingPermission(req.id);
            showToast(`Approved! Permission created for ${req.studentRoll}`, 'success');
        } catch (err: any) {
            showToast('Failed to approve: ' + (err.error || err.message || 'Unknown error'), 'error');
        }
    };

    const handleRejectPending = async (req: PendingPermission) => {
        if (!confirm(`Reject permission request from ${req.studentRoll}?`)) return;
        try {
            await rejectPendingPermission(req.id);
            showToast('Request rejected', 'success');
        } catch (err: any) {
            showToast('Failed to reject: ' + (err.error || err.message || 'Unknown error'), 'error');
        }
    };

    const handleDeletePending = async (id: string) => {
        if (!confirm('Delete this request permanently?')) return;
        try {
            await deletePendingPermission(id);
            showToast('Request deleted', 'success');
        } catch (err: any) {
            showToast('Failed to delete: ' + (err.error || err.message || 'Unknown error'), 'error');
        }
    };

    useEffect(() => {
        if (saveCountdown > 0) {
            const timer = setTimeout(() => setSaveCountdown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [saveCountdown]);

    const filteredStudents = students.filter(s =>
        s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedPermissions = useMemo(() => {
        const groups: Record<string, PermissionGroup> = {};
        const targetDate = filterDate ? new Date(filterDate) : null;
        if (targetDate) targetDate.setHours(0, 0, 0, 0);

        permissions.forEach(perm => {
            if (targetDate) {
                const start = new Date(perm.startDate);
                const end = new Date(perm.endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                if (targetDate < start || targetDate > end) return;
            }
            const key = `${perm.startDate}|${perm.endDate}|${perm.type}|${perm.reason}|${(perm.customPeriods || []).sort().join(',')}|${perm.approvedBy || 'CR'}|${perm.letterFileUrl || ''}`;
            if (!groups[key]) {
                groups[key] = { key, reason: perm.reason, startDate: perm.startDate, endDate: perm.endDate, type: perm.type, customPeriods: perm.customPeriods || [], permissions: [], studentCount: 0, approvedBy: perm.approvedBy || 'CR', letterFileUrl: perm.letterFileUrl };
            }
            groups[key].permissions.push(perm);
            groups[key].studentCount++;
        });

        return Object.values(groups).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [permissions, filterDate]);

    const loadGroupForEdit = (group: PermissionGroup) => {
        setStartDate(group.startDate); setEndDate(group.endDate); setReason(group.reason);
        setType(group.type as any); setCustomPeriods(group.customPeriods);
        const rolls = group.permissions.map(p => p.studentRoll);
        setSelectedRolls(rolls); setManualEntry(rolls.join(', '));
        setEditingOriginals(group.permissions); setActiveTab('CREATE'); setViewingGroup(null);
    };

    const togglePeriod = (p: number) => setCustomPeriods(prev => prev.includes(p) ? prev.filter(id => id !== p) : [...prev, p].sort());
    const toggleStudent = (roll: string) => setSelectedRolls(prev => prev.includes(roll) ? prev.filter(r => r !== roll) : [...prev, roll]);
    const selectAllFiltered = () => setSelectedRolls(prev => [...new Set([...prev, ...filteredStudents.map(s => s.rollNumber)])]);
    const clearSelection = () => { setSelectedRolls([]); setManualEntry(''); };
    const resetForm = () => { setStartDate(todayStr); setEndDate(todayStr); setReason(''); setType('FULL_DAY'); setCustomPeriods([]); setSelectedRolls([]); setManualEntry(''); setEditingOriginals(null); };

    const handleModeSwitch = (mode: 'LIST' | 'MANUAL') => {
        if (mode === 'MANUAL') setManualEntry(selectedRolls.join(', '));
        setSelectionMode(mode);
    };

    const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setManualEntry(val);
        setSelectedRolls(val.split(',').map(s => s.trim()).filter(Boolean));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate || !reason) return alert('Fill all required fields');
        if (selectedRolls.length === 0) return alert('Select at least one student');
        if (type === 'CUSTOM' && customPeriods.length === 0) return alert('Select at least one period for Custom type');

        showToast('Saving permission to Database...', 'info');
        setSaveCountdown(15);
        const payloadBase = { startDate, endDate, type, reason, customPeriods: type === 'CUSTOM' ? customPeriods : [] };

        try {
            if (editingOriginals) {
                const originalRolls = editingOriginals.map(p => p.studentRoll);
                const toUpdate = editingOriginals.filter(p => selectedRolls.includes(p.studentRoll));
                const toDelete = editingOriginals.filter(p => !selectedRolls.includes(p.studentRoll));
                const toAddRolls = selectedRolls.filter(r => !originalRolls.includes(r));

                for (const perm of toUpdate) await updatePermission(perm.id, payloadBase);
                for (const perm of toDelete) await deletePermission(perm.id);
                for (const roll of toAddRolls) await addPermission({ ...payloadBase, studentRoll: roll });

                alert(`Updated Group: ${toUpdate.length} updated, ${toDelete.length} removed, ${toAddRolls.length} added.`);
                setEditingOriginals(null);
            } else {
                for (const roll of selectedRolls) await addPermission({ studentRoll: roll, ...payloadBase });
                showToast(`Permissions updated for ${selectedRolls.length} students.`, 'success');
            }
            resetForm(); setActiveTab('VIEW');
        } catch (error: any) {
            showToast('Failed to save permission: ' + (error.message || error.error || 'Unknown error'), 'error');
        }
    };

    const deleteGroup = async (group: PermissionGroup) => {
        if (!confirm(`Delete "${group.reason}" and revoke permissions for all ${group.studentCount} students?`)) return;
        for (const perm of group.permissions) await deletePermission(perm.id);
        showToast('Permissions deleted successfully', 'success');
        setViewingGroup(null);
    };

    const handleCopyAll = () => {
        if (groupedPermissions.length === 0) { showToast('No permissions to copy', 'info'); return; }
        const displayDate = (filterDate || todayStr).split('-').reverse().join('-');
        let text = `Dear Faculty,\n\nToday's Permissions : ${displayDate}\n\n`;
        groupedPermissions.forEach(group => {
            const regRolls: string[] = []; const leRolls: string[] = [];
            [...group.permissions].sort((a, b) => a.studentRoll.localeCompare(b.studentRoll)).forEach(p => {
                const s = students.find(st => st.rollNumber === p.studentRoll);
                const shortRoll = p.studentRoll.slice(-2);
                if (s && s.type === 'LATERAL') leRolls.push(shortRoll); else regRolls.push(shortRoll);
            });
            const typeLabel = group.type === 'CUSTOM' ? `Custom Periods: ${group.customPeriods.join(',')}` : group.type.replace('_', ' ').split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
            text += `Reason: ${group.reason} (${typeLabel})\n\nStudents :  ${regRolls.length ? regRolls.join(', ') : 'None'}.\nLE: ${leRolls.length ? leRolls.join(', ') : 'None'}\n\n`;
        });
        navigator.clipboard.writeText(text.trim());
        showToast('Copied all visible permissions to clipboard', 'success');
    };

    const typeOptions = [
        { value: 'FULL_DAY', label: 'Full Day', sub: 'P 1–8' },
        { value: 'MORNING', label: 'Morning', sub: 'P 1–4' },
        { value: 'AFTERNOON', label: 'Afternoon', sub: 'P 5–8' },
        { value: 'CUSTOM', label: 'Custom', sub: 'Pick periods' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] pb-20">
            <div className="max-w-6xl mx-auto px-4 pt-6 space-y-5">

                {/* ── Page Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Permissions</h1>
                        <p className="text-xs text-slate-400 mt-0.5">{permissions.length} active · {pendingPermissions.length} pending</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-medium transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* ── Tab Bar ── */}
                <div className="flex bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] p-1 rounded-2xl gap-1">
                    <button
                        onClick={() => { setActiveTab('CREATE'); resetForm(); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200
                            ${activeTab === 'CREATE'
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        <Plus size={14} />
                        {editingOriginals ? 'Edit Permission' : 'Create New'}
                    </button>
                    <button
                        onClick={() => { setActiveTab('VIEW'); setEditingOriginals(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200
                            ${activeTab === 'VIEW'
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        <ListChecks size={14} />
                        Active
                        {permissions.length > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'VIEW' ? 'bg-white/20 text-white' : 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'}`}>
                                {permissions.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setActiveTab('PENDING'); setEditingOriginals(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200
                            ${activeTab === 'PENDING'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        <Bell size={14} />
                        Pending
                        {pendingPermissions.length > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'PENDING' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                                {pendingPermissions.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* ═══════════════════════════════════════════ */}
                {/* TAB: CREATE / EDIT                          */}
                {/* ═══════════════════════════════════════════ */}
                {activeTab === 'CREATE' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                        {/* ── Left: Details Panel ── */}
                        <div className="lg:col-span-2 space-y-3">
                            <div className="bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Permission Details</h3>
                                    {editingOriginals && (
                                        <button onClick={resetForm} className="text-[11px] text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                                            <X size={11} /> Cancel Edit
                                        </button>
                                    )}
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                                            <Calendar size={9} /> From
                                        </label>
                                        <input
                                            type="date" value={startDate} min={todayStr}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full text-xs font-medium px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                                            <Calendar size={9} /> To
                                        </label>
                                        <input
                                            type="date" value={endDate} min={todayStr}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="w-full text-xs font-medium px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                                        Reason / Event Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Hackathon, Sports Meet…"
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                    />
                                </div>

                                {/* Type */}
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                                        <Clock size={9} /> Duration Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {typeOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setType(opt.value as any)}
                                                className={`flex flex-col items-start px-3 py-2.5 rounded-xl border transition-all text-left
                                                    ${type === opt.value
                                                        ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/20'
                                                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                                                    }`}
                                            >
                                                <span className="text-xs font-bold">{opt.label}</span>
                                                <span className={`text-[10px] mt-0.5 ${type === opt.value ? 'text-violet-200' : 'text-slate-400'}`}>{opt.sub}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Periods */}
                                {type === 'CUSTOM' && (
                                    <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2 block">Select Periods</label>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => togglePeriod(p)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border transition-all
                                                        ${customPeriods.includes(p)
                                                            ? 'bg-violet-600 text-white border-violet-600'
                                                            : 'bg-white dark:bg-white/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-violet-300'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Right: Student Selection ── */}
                        <div className="lg:col-span-3 flex flex-col bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-2xl overflow-hidden" style={{ minHeight: 520, maxHeight: 580 }}>

                            {/* Header */}
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <Users size={15} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Select Students</span>
                                    <span className="text-xs bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full font-semibold">
                                        {new Set(selectedRolls).size} selected
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectionMode === 'LIST' && (
                                        <button onClick={selectAllFiltered} className="text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline">
                                            Select All
                                        </button>
                                    )}
                                    <button onClick={clearSelection} className="text-[11px] font-medium text-red-500 hover:underline">
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Mode Toggle */}
                            <div className="px-4 py-3 border-b border-slate-50 dark:border-white/5 shrink-0">
                                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                                    <button
                                        onClick={() => handleModeSwitch('LIST')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200
                                            ${selectionMode === 'LIST' ? 'bg-white dark:bg-white/10 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                                    >
                                        <ListChecks size={12} /> From List
                                    </button>
                                    <button
                                        onClick={() => handleModeSwitch('MANUAL')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200
                                            ${selectionMode === 'MANUAL' ? 'bg-white dark:bg-white/10 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                                    >
                                        <Type size={12} /> Manual Entry
                                    </button>
                                </div>
                            </div>

                            {selectionMode === 'LIST' ? (
                                <>
                                    {/* Search */}
                                    <div className="px-4 py-3 border-b border-slate-50 dark:border-white/5 shrink-0">
                                        <div className="relative">
                                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                placeholder="Search roll number…"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                            />
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-white/[0.03]">
                                        {filteredStudents.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                                                <Search size={24} className="text-slate-300 dark:text-slate-700" />
                                                <p className="text-sm text-slate-400">No students found</p>
                                            </div>
                                        ) : filteredStudents.map(s => {
                                            const isSelected = selectedRolls.includes(s.rollNumber);
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => toggleStudent(s.rollNumber)}
                                                    className={`w-full flex items-center justify-between px-5 py-3 transition-colors text-left
                                                        ${isSelected
                                                            ? 'bg-violet-50 dark:bg-violet-500/10'
                                                            : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                                                        }`}
                                                >
                                                    <span className={`font-mono text-sm ${isSelected ? 'font-semibold text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                                        {s.rollNumber}
                                                    </span>
                                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all
                                                        ${isSelected ? 'bg-violet-600 border-violet-600' : 'border-slate-300 dark:border-white/20'}`}>
                                                        {isSelected && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col p-4 gap-3">
                                    <textarea
                                        className="flex-1 w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white font-mono text-sm focus:ring-2 focus:ring-violet-500/50 focus:outline-none resize-none placeholder-slate-400"
                                        placeholder="Enter roll numbers separated by commas…&#10;e.g. 23PA1A05C8, 23PA1A05C9"
                                        value={manualEntry}
                                        onChange={handleManualChange}
                                    />
                                    <p className="text-[11px] text-slate-400">Values sync automatically. Paste a comma-separated list.</p>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="px-4 py-4 border-t border-slate-100 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-white/[0.01]">
                                <button
                                    onClick={handleSave}
                                    disabled={saveCountdown > 0}
                                    className={`w-full h-11 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60
                                        ${editingOriginals
                                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                            : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20'
                                        }`}
                                >
                                    {saveCountdown > 0
                                        ? `Please wait… ${saveCountdown}s`
                                        : editingOriginals
                                            ? `Update Event & Students`
                                            : `Grant Permission to ${new Set(selectedRolls).size} Students`
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/* TAB: VIEW                                   */}
                {/* ═══════════════════════════════════════════ */}
                {/* ═══════════════════════════════════════════ */}
                {/* TAB: PENDING PERMISSIONS                     */}
                {/* ═══════════════════════════════════════════ */}
                {activeTab === 'PENDING' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-400 px-1">
                                <span className="font-semibold text-amber-600 dark:text-amber-400">{pendingPermissions.length}</span> request{pendingPermissions.length !== 1 ? 's' : ''} awaiting approval
                            </p>
                            <button
                                onClick={fetchPendingPermissions}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 transition-colors"
                            >
                                <RefreshCw size={11} /> Refresh
                            </button>
                        </div>

                        {pendingPermissions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                                    <Bell size={28} className="text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">No pending requests</h3>
                                    <p className="text-sm text-slate-400 mt-1">Students can submit requests via the permission form.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {pendingPermissions.map(req => (
                                    <div
                                        key={req.id}
                                        className="relative flex flex-col p-4 rounded-2xl border bg-white dark:bg-white/[0.03] border-amber-200 dark:border-amber-500/30 overflow-hidden"
                                    >
                                        {/* Accent stripe */}
                                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400" />

                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-2 mb-3 mt-1">
                                            <div>
                                                <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg">
                                                    {req.studentRoll}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDeletePending(req.id)}
                                                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>

                                        {/* Reason */}
                                        <h3 className="font-bold text-[14px] text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">
                                            {req.reason}
                                        </h3>

                                        {/* Badges */}
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            <TypeBadge type={req.type} customPeriods={req.customPeriods} />
                                            {req.hasPermissionLetter && req.letterFileUrl && (
                                                <div className="mt-2 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                                            <FileText size={9} /> Permission Letter
                                                        </span>
                                                        <a
                                                            href={req.letterFileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline"
                                                        >
                                                            <ExternalLink size={9} /> Full View
                                                        </a>
                                                    </div>

                                                    {isImageUrl(req.letterFileUrl) ? (
                                                        <div className="relative aspect-video rounded-xl border border-slate-100 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-white/5 group">
                                                            <img
                                                                src={req.letterFileUrl}
                                                                alt="Letter Preview"
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <Eye className="text-white" size={20} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                                                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
                                                                <FileText size={16} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Document (PDF)</p>
                                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate truncate">View in Drive</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Date */}
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
                                            <Calendar size={12} className="text-slate-400 shrink-0" />
                                            <span className="font-medium">
                                                {fmtDate(req.startDate)}
                                                {req.startDate !== req.endDate && <span className="text-slate-400"> → {fmtDate(req.endDate)}</span>}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-2 mt-auto">
                                            <button
                                                onClick={() => handleRejectPending(req)}
                                                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-semibold transition-colors"
                                            >
                                                <XCircle size={13} /> Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprovePending(req)}
                                                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors shadow-sm shadow-emerald-500/20"
                                            >
                                                <Check size={13} /> Approve
                                            </button>
                                        </div>

                                        {/* Submitted time */}
                                        <p className="text-[10px] text-slate-400 text-center mt-2">
                                            Submitted {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'VIEW' && (
                    <div className="space-y-4">
                        {permissions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                    <Info size={28} className="text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">No active permissions</h3>
                                    <p className="text-sm text-slate-400 mt-1">Create one to see it here.</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('CREATE')}
                                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
                                >
                                    Create Permission
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Filter Bar */}
                                <div className="flex gap-2 items-end flex-wrap bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-4">
                                    <div className="flex-1 min-w-[160px]">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                                            <Calendar size={9} /> Filter by Date
                                        </label>
                                        <input
                                            type="date"
                                            value={filterDate}
                                            onChange={e => setFilterDate(e.target.value)}
                                            className="w-full text-xs font-medium px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {filterDate && (
                                            <button
                                                onClick={() => setFilterDate('')}
                                                className="px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                                            >
                                                Clear
                                            </button>
                                        )}
                                        <button
                                            onClick={handleCopyAll}
                                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm shadow-violet-500/20"
                                        >
                                            <Copy size={13} /> Copy All
                                        </button>
                                    </div>
                                </div>

                                {/* Results count */}
                                <p className="text-xs text-slate-400 px-1">
                                    Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{groupedPermissions.length}</span> permission groups
                                    {filterDate && <span> for <span className="font-medium text-violet-600 dark:text-violet-400">{fmtDate(filterDate)}</span></span>}
                                </p>

                                {/* Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {groupedPermissions.map(group => {
                                        const isRange = group.startDate !== group.endDate;
                                        const isHod = group.approvedBy === 'HOD';

                                        return (
                                            <button
                                                key={group.key}
                                                onClick={() => setViewingGroup(group)}
                                                className={`relative text-left flex flex-col p-4 rounded-2xl border transition-all hover:shadow-md active:scale-[0.98] overflow-hidden
                                                    ${isHod
                                                        ? 'bg-white dark:bg-white/[0.03] border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-300 dark:hover:border-emerald-500/50'
                                                        : 'bg-white dark:bg-white/[0.03] border-blue-200 dark:border-blue-500/30 hover:border-blue-300 dark:hover:border-blue-500/50'
                                                    }`}
                                            >
                                                {/* Top accent stripe */}
                                                <div className={`absolute top-0 left-0 right-0 h-0.5 ${isHod ? 'bg-emerald-500' : 'bg-blue-400'}`} />

                                                {/* Header */}
                                                <div className="flex items-start justify-between gap-2 mb-3 mt-1">
                                                    <h3 className="font-bold text-[15px] text-slate-900 dark:text-slate-100 line-clamp-1 flex-1">
                                                        {group.reason}
                                                    </h3>
                                                    <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                                                </div>

                                                {/* Badges */}
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    <TypeBadge type={group.type} customPeriods={group.customPeriods} />
                                                    {isHod ? (
                                                        <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                                            <ShieldCheck size={9} /> HOD
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                                                            CR
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Date */}
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                                                    <Calendar size={12} className="text-slate-400 shrink-0" />
                                                    <span className="font-medium">
                                                        {fmtDate(group.startDate)}
                                                        {isRange && <span className="text-slate-400"> → {fmtDate(group.endDate)}</span>}
                                                    </span>
                                                </div>

                                                {/* Student count */}
                                                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border
                                                    ${isHod
                                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
                                                        : 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20'
                                                    }`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users size={13} className={isHod ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'} />
                                                        <span className={`text-xs font-bold ${isHod ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'}`}>
                                                            {group.studentCount} students
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">Tap for details</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* DETAIL MODAL                               */}
            {/* ═══════════════════════════════════════════ */}
            {viewingGroup && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-6"
                    onClick={e => { if (e.target === e.currentTarget) setViewingGroup(null); }}
                >
                    <div className="w-full sm:max-w-sm bg-white dark:bg-[#16161f] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

                        {/* Modal Header */}
                        <div className={`px-5 py-4 border-b border-slate-100 dark:border-white/5 relative shrink-0 ${viewingGroup.approvedBy === 'HOD' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-blue-50 dark:bg-blue-500/10'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {viewingGroup.approvedBy === 'HOD'
                                        ? <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                                        : <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" />
                                    }
                                    <span className={`text-xs font-bold uppercase tracking-wider ${viewingGroup.approvedBy === 'HOD' ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'}`}>
                                        {viewingGroup.approvedBy === 'HOD' ? 'Approved by HOD' : 'Approved by CR'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setViewingGroup(null)}
                                    className="w-7 h-7 rounded-lg bg-white/60 dark:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{viewingGroup.reason}</h3>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto p-5 space-y-4 flex-1">

                            {/* Meta */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Date Range</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        {fmtDate(viewingGroup.startDate)}
                                        {viewingGroup.startDate !== viewingGroup.endDate && (
                                            <span className="block text-xs font-medium text-slate-400 mt-0.5">→ {fmtDate(viewingGroup.endDate)}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Duration</p>
                                    <TypeBadge type={viewingGroup.type} customPeriods={viewingGroup.customPeriods} />
                                </div>
                            </div>

                            {/* Allowed Periods */}
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Allowed Periods</p>
                                <div className="flex gap-1.5 flex-wrap">
                                    {getAllowedPeriods(viewingGroup.type, viewingGroup.customPeriods).map(p => (
                                        <span key={p} className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Students */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Students</p>
                                    <span className="text-xs bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">{viewingGroup.studentCount}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                    {viewingGroup.permissions.map(p => (
                                        <span key={p.id} className={`text-[11px] font-mono border px-2 py-1 rounded-lg
                                            ${p.approvedBy === 'HOD'
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300'
                                            }`}>
                                            {p.studentRoll.slice(-2)}
                                            {p.approvedBy === 'HOD' && ' ✓'}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Letter Section (if available) */}
                            {viewingGroup.letterFileUrl && (
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Permission Letter</p>
                                        <a
                                            href={viewingGroup.letterFileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-400"
                                        >
                                            <ExternalLink size={10} /> Full View
                                        </a>
                                    </div>

                                    {isImageUrl(viewingGroup.letterFileUrl) ? (
                                        <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 group">
                                            <img
                                                src={viewingGroup.letterFileUrl}
                                                alt="Letter"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Eye className="text-white" size={20} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
                                                <FileText size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Document (PDF)</p>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate truncate truncate">Stored in Cloud Drive</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Actions */}
                        <div className="px-5 py-4 border-t border-slate-100 dark:border-white/5 space-y-2.5 shrink-0 bg-slate-50/60 dark:bg-white/[0.01]">
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => {
                                        const regRolls: string[] = []; const leRolls: string[] = [];
                                        [...viewingGroup.permissions].sort((a, b) => a.studentRoll.localeCompare(b.studentRoll)).forEach(p => {
                                            const s = students.find(st => st.rollNumber === p.studentRoll);
                                            const shortRoll = p.studentRoll.slice(-2);
                                            if (s && s.type === 'LATERAL') leRolls.push(shortRoll); else regRolls.push(shortRoll);
                                        });
                                        const details = `Permissions details:\nFrom : ${fmtDate(viewingGroup.startDate)} to ${fmtDate(viewingGroup.endDate)}\nReason: ${viewingGroup.reason}\n\nRoll Numbers : ${regRolls.length ? regRolls.join(', ') + '.' : 'None.'}\nLE : ${leRolls.length ? leRolls.join(', ') + '.' : 'None.'}`;
                                        navigator.clipboard.writeText(details);
                                        showToast('Copied to clipboard', 'info');
                                    }}
                                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-xs font-medium"
                                >
                                    <Copy size={14} /> Copy
                                </button>
                                <button
                                    onClick={() => loadGroupForEdit(viewingGroup)}
                                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors text-xs font-medium"
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => deleteGroup(viewingGroup)}
                                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-xs font-medium"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                            <button
                                onClick={() => setViewingGroup(null)}
                                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};