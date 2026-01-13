import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { Lock, Share2, Search, Copy, X, RotateCcw } from 'lucide-react';

export const MarkAttendance: React.FC = () => {
    const { subjects, students, permissions, markAttendance } = useApp();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Popup State
    const [showPreview, setShowPreview] = useState(false);
    const [showCount, setShowCount] = useState(false);
    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [subjectId, setSubjectId] = useState('');
    const [period, setPeriod] = useState('1');
    const [markingMode, setMarkingMode] = useState<'MARK_ABSENTEES' | 'MARK_PRESENTEES'>('MARK_ABSENTEES');
    const [searchTerm, setSearchTerm] = useState('');

    // State: Selection-based logic
    // We store who is "Selected". 
    // If Mode == ABSENTIES, Selected = ABSENT.
    // If Mode == PRESENTEES, Selected = PRESENT.
    const [selectedRolls, setSelectedRolls] = useState<Set<string>>(new Set());

    // Compute status on the fly
    const getStudentStatus = (roll: string): 'PRESENT' | 'ABSENT' | 'PERMISSION' => {
        const activePerm = getActivePermission(
            permissions,
            roll,
            date,
            parseInt(period)
        );

        if (activePerm) return 'PERMISSION';

        const isSelected = selectedRolls.has(roll);

        if (markingMode === 'MARK_ABSENTEES') {
            return isSelected ? 'ABSENT' : 'PRESENT';
        } else {
            return isSelected ? 'PRESENT' : 'ABSENT';
        }
    };

    const getActivePermission = (
        permissions: any[],
        studentRoll: string,
        date: string,
        period: number
    ) => {
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
            if (p.type === 'CUSTOM' && !p.customPeriods?.includes(period)) {
                isSessionMatch = false;
            }

            return isDateMatch && isRollMatch && isSessionMatch;
        });
    };

    const toggleStatus = (roll: string) => {
        const currentStatus = getStudentStatus(roll);
        if (currentStatus === 'PERMISSION') return;

        setSelectedRolls(prev => {
            const next = new Set(prev);
            if (next.has(roll)) {
                next.delete(roll);
            } else {
                next.add(roll);
            }
            return next;
        });
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to reset all selections?')) {
            setSelectedRolls(new Set());
        }
    };

    const getAbsentees = () => {
        return students
            .filter(s => getStudentStatus(s.rollNumber) === 'ABSENT')
            .map(s => s.rollNumber)
            .sort();
    };

    const getShortRoll = (roll: string) => roll.slice(-2);

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [students, searchTerm]);

    const generateSummary = () => {
        const absentees = getAbsentees(); // List of Roll Numbers

        const regulars = absentees.filter(roll => {
            const s = students.find(st => st.rollNumber === roll);
            return s && s.type !== 'LATERAL';
        }).map(getShortRoll);

        const laterals = absentees.filter(roll => {
            const s = students.find(st => st.rollNumber === roll);
            return s && s.type === 'LATERAL';
        }).map(getShortRoll);

        const subjectName = subjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';

        // Date Format: DD-MM-YYYY
        const [y, m, d] = date.split('-');
        const formattedDate = `${d}-${m}-${y}`;

        let summary = `Date: ${formattedDate}\nPeriod: ${period}\nSubject: ${subjectName}\n\n`;

        summary += `Absentees : ${regulars.length > 0 ? regulars.join(', ') : 'No Absentees'}.\n\n`;

        if (laterals.length > 0) {
            summary += `LE : ${laterals.join(', ')}.`;
        } else {
            summary += `LE : No Absentees.`;
        }

        return summary;
    };

    const handleSave = () => {
        if (!subjectId) return showToast('Select a subject!', 'error');

        const absentees = getAbsentees();
        const perms = students
            .filter(s => getStudentStatus(s.rollNumber) === 'PERMISSION')
            .map(s => s.rollNumber);

        markAttendance({
            id: crypto.randomUUID(),
            date,
            subjectId,
            period, // Add period to payload
            session: parseInt(period) <= 4 ? 'MORNING' : 'AFTERNOON',
            absentees,
            permissions: perms
        });

        navigate('/history');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateSummary());
        showToast('Copied to clipboard!', 'success');
    };

    const shareWhatsApp = () => {
        const text = generateSummary();
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    if (subjects.length === 0) {
        return (
            <div className="text-center py-10">
                <h2 className="text-xl font-bold">No Subjects Found</h2>
                <Button onClick={() => navigate('/subjects')} className="mt-4">Add Subjects</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-black">
            {/* Header / Controls - Fixed at Top */}
            <div className="p-4 bg-white dark:bg-gray-900 shadow-sm z-10 space-y-3 shrink-0">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mark Attendance</h1>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Input
                        type="date"
                        value={date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setDate(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    />
                    <div className="relative">
                        <select
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg h-10 bg-gray-50 dark:bg-gray-800 dark:text-white appearance-none"
                            value={period}
                            onChange={e => setPeriod(e.target.value)}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                                <option key={p} value={p}>Period {p}</option>
                            ))}
                        </select>
                        {/* Custom arrow could go here */}
                    </div>
                </div>

                <select
                    className="w-full px-3 py-2 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 font-medium text-indigo-900 dark:text-indigo-300"
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                >
                    <option value="">-- Select Subject --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <div className="flex gap-2">
                    <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex-1">
                        <button
                            onClick={() => setMarkingMode('MARK_ABSENTEES')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${markingMode === 'MARK_ABSENTEES' ? 'bg-white dark:bg-gray-700 shadow text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Mark Absentees
                        </button>
                        <button
                            onClick={() => setMarkingMode('MARK_PRESENTEES')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${markingMode === 'MARK_PRESENTEES' ? 'bg-white dark:bg-gray-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Mark Presentees
                        </button>
                    </div>
                    <Button variant="secondary" onClick={handleReset} className="h-full px-3 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="Reset Selections">
                        <RotateCcw size={18} />
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search Roll No..."
                        className="pl-9 h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                </div>
            </div>

            {/* Scrollable List Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredStudents.length === 0 ? (
                    <div className="text-center w-full mt-10">
                        <p className="text-gray-400">No students found matching "{searchTerm}"</p>
                    </div>
                ) : (
                    filteredStudents.map(student => {
                        const status = getStudentStatus(student.rollNumber);
                        const isPerm = status === 'PERMISSION';
                        const isAbsent = status === 'ABSENT';
                        const isPresent = status === 'PRESENT';

                        // Check for Permission Reason if locked
                        let permReason = '';

                        if (isPerm) {
                            const activePerm = getActivePermission(
                                permissions,
                                student.rollNumber,
                                date,
                                parseInt(period)
                            );

                            if (activePerm) permReason = activePerm.reason;
                        }

                        // Active check based on mode
                        const isChecked = markingMode === 'MARK_ABSENTEES' ? isAbsent : isPresent;

                        // Row Styling
                        let rowClass = "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800";
                        let statusIcon = null;

                        if (isPerm) {
                            rowClass = "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 opacity-90";
                            statusIcon = <Lock size={16} className="text-amber-600 dark:text-amber-400" />;
                        } else if (isChecked) {
                            if (markingMode === 'MARK_ABSENTEES') {
                                rowClass = "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 ring-1 ring-red-400 dark:ring-red-900";
                                statusIcon = <div className="text-red-600 dark:text-red-300 font-bold text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded">ABSENT</div>;
                            } else {
                                rowClass = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-400 dark:ring-emerald-900";
                                statusIcon = <div className="text-emerald-600 dark:text-emerald-300 font-bold text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded">PRESENT</div>;
                            }
                        }

                        return (
                            <button
                                key={student.id}
                                onClick={() => toggleStatus(student.rollNumber)}
                                disabled={isPerm}
                                className={`
                                    w-full flex items-center justify-between p-4 rounded-xl border shadow-sm transition-all active:scale-[0.98]
                                    ${rowClass}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                        ${isPerm ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-100' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}
                                    `}>
                                        {getShortRoll(student.rollNumber)}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-800 dark:text-gray-200 text-lg">{student.rollNumber}</div>
                                        {isPerm && permReason ? (
                                            <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mt-0.5 flex items-center gap-1">
                                                <span>Reason:</span>
                                                <span className="italic">"{permReason}"</span>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{student.type}</div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    {statusIcon}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Fixed Bottom Button */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <Button
                    onClick={() => setShowPreview(true)}
                    className="w-full h-12 text-lg font-semibold shadow-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl"
                >
                    Review & Save
                </Button>
            </div>

            {/* Preview Modal (Same as before) */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4">
                    <Card className="w-full sm:max-w-md bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-bottom-10 sm:rounded-2xl rounded-t-2xl rounded-b-none p-0 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-lg">Confirm Attendance</h3>
                            <button onClick={() => setShowPreview(false)} className="text-white/80 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            {/* Toggle Display Count */}
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 dark:text-white">Display Count</span>
                                <button
                                    onClick={() => setShowCount(!showCount)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${showCount ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                >
                                    <span
                                        className={`${showCount ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
                                    />
                                </button>
                            </div>

                            {showCount && (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 text-center animate-in fade-in zoom-in-95 duration-200">
                                    <p className="text-xs text-indigo-800 dark:text-indigo-200 font-medium uppercase tracking-wide mb-1">Total Present / Total Strength</p>
                                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                        {students.length - getAbsentees().length}/{students.length}
                                    </p>
                                </div>
                            )}

                            <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words border border-gray-200 dark:border-gray-700">
                                {generateSummary()}
                            </pre>

                            <div className="flex gap-2 pt-2">
                                <Button variant="secondary" onClick={copyToClipboard} className="flex-1 text-xs h-10">
                                    <Copy size={16} /> Copy
                                </Button>
                                <Button variant="secondary" onClick={shareWhatsApp} className="flex-1 text-xs h-10 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50">
                                    <Share2 size={16} /> WhatsApp
                                </Button>
                            </div>

                            <Button onClick={handleSave} className="w-full mt-2 h-12 text-lg">
                                Save Attendance
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
