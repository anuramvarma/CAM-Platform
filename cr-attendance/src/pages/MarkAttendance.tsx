import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Share2, Search, Copy, X, RotateCcw, ShieldCheck, CheckCircle2, XCircle, CalendarDays, BookOpen, Clock } from 'lucide-react';

export const MarkAttendance: React.FC = () => {
    const { subjects, students, permissions, markAttendance, updateAttendance } = useApp();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const editRecord = location.state?.editRecord;

    console.log('DEBUG: MarkAttendance - editRecord from state:', editRecord);

    const [showPreview, setShowPreview] = useState(false);
    const [showCount, setShowCount] = useState(false);
    const [showPresentees, setShowPresentees] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [subjectId, setSubjectId] = useState('');
    const [period, setPeriod] = useState('1');
    const [markingMode, setMarkingMode] = useState<'MARK_ABSENTEES' | 'MARK_PRESENTEES'>('MARK_ABSENTEES');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRolls, setSelectedRolls] = useState<Set<string>>(new Set());

    React.useEffect(() => {
        if (editRecord) {
            console.log('DEBUG: Initializing Edit Mode with:', editRecord);
            if (editRecord.date) setDate(editRecord.date);
            const subId = editRecord.subjectId?._id || editRecord.subjectId;
            if (subId) setSubjectId(subId);
            if (editRecord.period) setPeriod(editRecord.period.toString());
            if (Array.isArray(editRecord.absentees)) {
                setSelectedRolls(new Set(editRecord.absentees));
            }
            setMarkingMode('MARK_ABSENTEES');
        }
    }, [editRecord]);

    const getActivePermission = (permissions: any[], studentRoll: string, date: string, period: number) => {
        return permissions.find(p => {
            const pStart = new Date(p.startDate);
            const pEnd = new Date(p.endDate);
            const curr = new Date(date);
            const isDateMatch = curr >= pStart && curr <= pEnd;
            const isRollMatch = p.studentRoll === studentRoll;
            const isMorning = period <= 4;
            let isSessionMatch = true;
            if (p.type === 'MORNING' && !isMorning) isSessionMatch = false;
            if (p.type === 'AFTERNOON' && isMorning) isSessionMatch = false;
            if (p.type === 'CUSTOM' && !p.customPeriods?.includes(period)) isSessionMatch = false;
            return isDateMatch && isRollMatch && isSessionMatch;
        });
    };

    const getStudentStatus = (roll: string): 'PRESENT' | 'ABSENT' | 'PERMISSION' => {
        const activePerm = getActivePermission(permissions, roll, date, parseInt(period));
        if (activePerm) return 'PERMISSION';
        const isSelected = selectedRolls.has(roll);
        if (markingMode === 'MARK_ABSENTEES') return isSelected ? 'ABSENT' : 'PRESENT';
        else return isSelected ? 'PRESENT' : 'ABSENT';
    };

    const toggleStatus = (roll: string) => {
        const currentStatus = getStudentStatus(roll);
        if (currentStatus === 'PERMISSION') return;
        setSelectedRolls(prev => {
            const next = new Set(prev);
            if (next.has(roll)) next.delete(roll);
            else next.add(roll);
            return next;
        });
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to reset all selections?')) {
            setSelectedRolls(new Set());
        }
    };

    const getAbsentees = () => students.filter(s => getStudentStatus(s.rollNumber) === 'ABSENT').map(s => s.rollNumber).sort();
    const getShortRoll = (roll: string) => roll.slice(-2);

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [students, searchTerm]);

    const absentCount = getAbsentees().length;
    const presentCount = students.length - absentCount;
    const permCount = students.filter(s => getStudentStatus(s.rollNumber) === 'PERMISSION').length;

    const generateSummary = () => {
        const isPresenteesMode = showPresentees;
        const targetRolls = isPresenteesMode
            ? students.filter(s => getStudentStatus(s.rollNumber) === 'PRESENT').map(s => s.rollNumber).sort()
            : getAbsentees();
        const regulars = targetRolls.filter(roll => { const s = students.find(st => st.rollNumber === roll); return s && s.type !== 'LATERAL'; }).map(getShortRoll).sort();
        const laterals = targetRolls.filter(roll => { const s = students.find(st => st.rollNumber === roll); return s && s.type === 'LATERAL'; }).map(getShortRoll).sort();
        const subjectName = subjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';
        const [y, m, d] = date.split('-');
        const formattedDate = `${d}/${m}/${y}`;
        const label = isPresenteesMode ? 'Presentees' : 'Absentees';
        let summary = `Date: ${formattedDate}\nSubject: ${subjectName}\nPeriod: ${period}\n\n`;
        summary += `${label}: ${regulars.length > 0 ? regulars.join(', ') : 'Nil'}\n`;
        summary += `LE : ${laterals.length > 0 ? laterals.join(', ') : 'Nil'}`;
        return summary;
    };

    const handleSave = async () => {
        if (!subjectId) return showToast('Select a subject!', 'error');
        const absentees = getAbsentees();
        try {
            if (editRecord) {
                const recordId = editRecord.id || editRecord._id;
                console.log('DEBUG: Editing record ID:', recordId);
                await updateAttendance(recordId, absentees);
                showToast('Attendance updated successfully', 'success');
            } else {
                const perms = students.filter(s => getStudentStatus(s.rollNumber) === 'PERMISSION').map(s => s.rollNumber);
                await markAttendance({
                    id: crypto.randomUUID(),
                    date,
                    subjectId,
                    period,
                    session: parseInt(period) <= 4 ? 'MORNING' : 'AFTERNOON',
                    absentees,
                    permissions: perms
                });
                showToast('Attendance marked successfully', 'success');
            }
            navigate('/history');
        } catch (err: any) {
            showToast(err.message || 'Failed to save attendance', 'error');
        }
    };

    const copyToClipboard = () => { navigator.clipboard.writeText(generateSummary()); showToast('Copied to clipboard!', 'success'); };
    const shareWhatsApp = () => { const text = generateSummary(); const url = `https://wa.me/?text=${encodeURIComponent(text)}`; window.open(url, '_blank'); };

    if (subjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <BookOpen size={28} className="text-slate-400" />
                </div>
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">No Subjects Found</h2>
                    <p className="text-sm text-slate-400 mt-1">Add subjects to start marking attendance</p>
                </div>
                <button
                    onClick={() => navigate('/subjects')}
                    className="mt-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                    Add Subjects
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0a0a0f]">

            {/* Edit Banner */}
            {editRecord && (
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[11px] font-semibold tracking-widest uppercase text-amber-600 dark:text-amber-400">
                        Editing · {editRecord.date} · Period {editRecord.period}
                    </span>
                </div>
            )}

            {/* Header Controls */}
            <div className="shrink-0 bg-white dark:bg-[#111118] border-b border-slate-100 dark:border-white/5 px-4 pt-4 pb-3 space-y-3">

                {/* Title */}
                <div className="flex items-center justify-between">
                    <h1 className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
                        {editRecord ? 'Edit Attendance' : 'Mark Attendance'}
                    </h1>
                    <button
                        onClick={handleReset}
                        title="Reset Selections"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-xs font-medium"
                    >
                        <RotateCcw size={13} />
                        Reset
                    </button>
                </div>

                {/* Date + Period + Subject */}
                <div className={`grid grid-cols-3 gap-2 ${editRecord ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="col-span-1 flex flex-col gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <CalendarDays size={10} /> Date
                        </span>
                        <input
                            type="date"
                            value={date}
                            min={editRecord ? undefined : new Date().toISOString().split('T')[0]}
                            onChange={e => setDate(e.target.value)}
                            className="w-full text-xs font-medium px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </label>

                    <label className="col-span-1 flex flex-col gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> Period
                        </span>
                        <select
                            value={period}
                            onChange={e => setPeriod(e.target.value)}
                            className="w-full text-xs font-medium px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                                <option key={p} value={p}>P{p}</option>
                            ))}
                        </select>
                    </label>

                    <label className="col-span-1 flex flex-col gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <BookOpen size={10} /> Subject
                        </span>
                        <select
                            value={subjectId}
                            onChange={e => setSubjectId(e.target.value)}
                            className="w-full text-xs font-medium px-2.5 py-2 rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 text-violet-800 dark:text-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none"
                        >
                            <option value="">Select</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </label>
                </div>

                {/* Live Stats Bar */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-none">{presentCount}</span>
                        <span className="text-[10px] font-medium text-emerald-500/80 mt-0.5">Present</span>
                    </div>
                    <div className="flex flex-col items-center py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                        <span className="text-lg font-bold text-red-500 dark:text-red-400 leading-none">{absentCount}</span>
                        <span className="text-[10px] font-medium text-red-400/80 mt-0.5">Absent</span>
                    </div>
                    <div className="flex flex-col items-center py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                        <span className="text-lg font-bold text-amber-600 dark:text-amber-400 leading-none">{permCount}</span>
                        <span className="text-[10px] font-medium text-amber-500/80 mt-0.5">Permissions</span>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setMarkingMode('MARK_ABSENTEES')}
                        className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 ${markingMode === 'MARK_ABSENTEES'
                                ? 'bg-white dark:bg-white/10 text-red-600 dark:text-red-400 shadow-sm'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                    >
                        Mark Absent
                    </button>
                    <button
                        onClick={() => setMarkingMode('MARK_PRESENTEES')}
                        className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 ${markingMode === 'MARK_PRESENTEES'
                                ? 'bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                    >
                        Mark Present
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search roll number..."
                        className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Student List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                        <Search size={28} className="text-slate-300 dark:text-slate-700" />
                        <p className="text-sm text-slate-400">No students matching<br /><span className="font-medium text-slate-500">"{searchTerm}"</span></p>
                    </div>
                ) : (
                    filteredStudents.map(student => {
                        const status = getStudentStatus(student.rollNumber);
                        const isPerm = status === 'PERMISSION';
                        const isAbsent = status === 'ABSENT';
                        const isPresent = status === 'PRESENT';

                        let permReason = '';
                        if (isPerm) {
                            const activePerm = getActivePermission(permissions, student.rollNumber, date, parseInt(period));
                            if (activePerm) {
                                permReason = activePerm.reason;
                                (student as any).activePermSource = activePerm.approvedBy || 'By CR';
                            }
                        }

                        const isHighlighted = (isAbsent && markingMode === 'MARK_ABSENTEES') || (isPresent && markingMode === 'MARK_PRESENTEES');

                        return (
                            <button
                                key={student.id}
                                onClick={() => toggleStatus(student.rollNumber)}
                                disabled={isPerm}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-150 active:scale-[0.98] text-left
                                    ${isPerm
                                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200/60 dark:border-amber-500/20 cursor-default'
                                        : isAbsent && markingMode === 'MARK_ABSENTEES'
                                            ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 ring-1 ring-red-300 dark:ring-red-500/30'
                                            : isPresent && markingMode === 'MARK_PRESENTEES'
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 ring-1 ring-emerald-300 dark:ring-emerald-500/30'
                                                : 'bg-white dark:bg-white/[0.03] border-slate-100 dark:border-white/[0.06] hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-50/80 dark:hover:bg-white/5'
                                    }
                                `}
                            >
                                {/* Avatar */}
                                <div className={`
                                    w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0
                                    ${isPerm
                                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                        : isAbsent && markingMode === 'MARK_ABSENTEES'
                                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300'
                                            : isPresent && markingMode === 'MARK_PRESENTEES'
                                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                    }
                                `}>
                                    {getShortRoll(student.rollNumber)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                                        {student.rollNumber}
                                    </div>
                                    {isPerm && permReason ? (
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            {(student as any).activePermSource === 'HOD' ? (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded-full">
                                                    <ShieldCheck size={9} /> HOD Approved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-1.5 py-0.5 rounded-full">
                                                    CR Approved
                                                </span>
                                            )}
                                            <span className="text-[11px] text-amber-600 dark:text-amber-400 italic truncate">"{permReason}"</span>
                                        </div>
                                    ) : (
                                        <div className="text-[11px] text-slate-400 mt-0.5">{student.type}</div>
                                    )}
                                </div>

                                {/* Status Icon */}
                                <div className="shrink-0">
                                    {isPerm ? (
                                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                                            <Lock size={13} className="text-amber-600 dark:text-amber-400" />
                                        </div>
                                    ) : isAbsent && markingMode === 'MARK_ABSENTEES' ? (
                                        <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                                            <XCircle size={16} className="text-red-500 dark:text-red-400" />
                                        </div>
                                    ) : isPresent && markingMode === 'MARK_PRESENTEES' ? (
                                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400" />
                                        </div>
                                    ) : (
                                        <div className="w-7 h-7 rounded-lg border-2 border-slate-200 dark:border-white/10" />
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
                <div className="h-2" />
            </div>

            {/* Fixed Bottom CTA */}
            <div className="shrink-0 px-4 py-3 bg-white dark:bg-[#111118] border-t border-slate-100 dark:border-white/5">
                <button
                    onClick={() => setShowPreview(true)}
                    className="w-full h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold text-[15px] transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
                >
                    Review & Save
                    <span className="text-xs font-normal bg-violet-500/50 px-2 py-0.5 rounded-full">
                        {absentCount} absent
                    </span>
                </button>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-6"
                    onClick={e => { if (e.target === e.currentTarget) setShowPreview(false); }}
                >
                    <div className="w-full sm:max-w-md bg-white dark:bg-[#16161f] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Confirm Attendance</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{date} · Period {period}</p>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto p-5 space-y-4">

                            {/* Toggle Options */}
                            <div className="space-y-2">
                                <ToggleRow
                                    label="Show Count"
                                    description="Total present / strength"
                                    checked={showCount}
                                    onChange={() => setShowCount(!showCount)}
                                    color="violet"
                                />
                                <ToggleRow
                                    label="Show Presentees"
                                    description="Switch to presentee list"
                                    checked={showPresentees}
                                    onChange={() => setShowPresentees(!showPresentees)}
                                    color="emerald"
                                />
                            </div>

                            {/* Count Display */}
                            {showCount && (
                                <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-500">Present / Total</p>
                                        <p className="text-2xl font-bold text-violet-700 dark:text-violet-300 font-mono mt-0.5">
                                            {presentCount}
                                            <span className="text-base font-normal text-violet-400">/{students.length}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-500">Rate</p>
                                        <p className="text-2xl font-bold text-violet-700 dark:text-violet-300 font-mono mt-0.5">
                                            {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Summary Preview */}
                            <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Summary</span>
                                    <span className="text-[11px] text-slate-400">{showPresentees ? 'Presentees' : 'Absentees'}</span>
                                </div>
                                <pre className="px-4 py-3.5 text-[13px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                                    {generateSummary()}
                                </pre>
                            </div>

                            {/* Share Actions */}
                            <div className="flex gap-2.5">
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <Copy size={15} /> Copy
                                </button>
                                <button
                                    onClick={shareWhatsApp}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                                >
                                    <Share2 size={15} /> WhatsApp
                                </button>
                            </div>

                            {/* Save */}
                            <button
                                onClick={handleSave}
                                className="w-full h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold transition-all shadow-lg shadow-violet-500/20"
                            >
                                {editRecord ? 'Update Attendance' : 'Save Attendance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper: Toggle Row Component
const ToggleRow: React.FC<{
    label: string;
    description: string;
    checked: boolean;
    onChange: () => void;
    color: 'violet' | 'emerald';
}> = ({ label, description, checked, onChange, color }) => {
    const activeColor = color === 'violet' ? 'bg-violet-600' : 'bg-emerald-500';

    return (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
            <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
            </div>
            <button
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? activeColor : 'bg-slate-200 dark:bg-white/10'}`}
            >
                <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200`} />
            </button>
        </div>
    );
};