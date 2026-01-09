import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { Lock, Share2, Search, Copy, X, RotateCcw } from 'lucide-react';

/* ======================================================
   ✅ PERMISSION MATCHING HELPER (SINGLE SOURCE OF TRUTH)
====================================================== */
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

export const MarkAttendance: React.FC = () => {
    const { subjects, students, permissions, markAttendance } = useApp();
    const navigate = useNavigate();

    // Popup State
    const [showPreview, setShowPreview] = useState(false);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [subjectId, setSubjectId] = useState('');
    const [period, setPeriod] = useState('1');
    const [markingMode, setMarkingMode] = useState<'MARK_ABSENTEES' | 'MARK_PRESENTEES'>('MARK_ABSENTEES');
    const [searchTerm, setSearchTerm] = useState('');

    // Selection State
    const [selectedRolls, setSelectedRolls] = useState<Set<string>>(new Set());

    /* ======================================================
       ✅ STATUS CALCULATION (FIXED)
    ====================================================== */
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

    const toggleStatus = (roll: string) => {
        if (getStudentStatus(roll) === 'PERMISSION') return;

        setSelectedRolls(prev => {
            const next = new Set(prev);
            next.has(roll) ? next.delete(roll) : next.add(roll);
            return next;
        });
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to reset all selections?')) {
            setSelectedRolls(new Set());
        }
    };

    const getAbsentees = () =>
        students
            .filter(s => getStudentStatus(s.rollNumber) === 'ABSENT')
            .map(s => s.rollNumber)
            .sort();

    const getShortRoll = (roll: string) => roll.slice(-2);

    const filteredStudents = useMemo(() => {
        return students.filter(s =>
            s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const generateSummary = () => {
        const absentees = getAbsentees();

        const regulars = absentees
            .filter(r => students.find(s => s.rollNumber === r)?.type !== 'LATERAL')
            .map(getShortRoll);

        const laterals = absentees
            .filter(r => students.find(s => s.rollNumber === r)?.type === 'LATERAL')
            .map(getShortRoll);

        const subjectName = subjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';

        const [y, m, d] = date.split('-');
        const formattedDate = `${d}-${m}-${y}`;

        let summary = `Date: ${formattedDate}\nPeriod: ${period}\nSubject: ${subjectName}\n\n`;
        summary += `Absentees : ${regulars.length ? regulars.join(', ') : 'No Absentees'}.\n\n`;
        summary += `LE : ${laterals.length ? laterals.join(', ') : 'No Absentees.'}`;

        return summary;
    };

    const handleSave = () => {
        if (!subjectId) return alert('Select a subject!');

        markAttendance({
            id: crypto.randomUUID(),
            date,
            subjectId,
            period,
            session: parseInt(period) <= 4 ? 'MORNING' : 'AFTERNOON',
            absentees: getAbsentees(),
            permissions: students
                .filter(s => getStudentStatus(s.rollNumber) === 'PERMISSION')
                .map(s => s.rollNumber)
        });

        navigate('/history');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateSummary());
        alert('Copied to clipboard!');
    };

    const shareWhatsApp = () => {
        const text = generateSummary();
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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

            {/* HEADER */}
            <div className="p-4 bg-white dark:bg-gray-900 shadow-sm z-10 space-y-3 shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mark Attendance</h1>

                <div className="grid grid-cols-2 gap-3">
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="h-10 rounded-lg">
                        {[1,2,3,4,5,6,7,8].map(p => <option key={p}>{p}</option>)}
                    </select>
                </div>

                <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full h-10 rounded-lg">
                    <option value="">-- Select Subject --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <div className="flex gap-2">
                    <button onClick={() => setMarkingMode('MARK_ABSENTEES')}>Mark Absentees</button>
                    <button onClick={() => setMarkingMode('MARK_PRESENTEES')}>Mark Presentees</button>
                    <Button variant="secondary" onClick={handleReset}><RotateCcw size={16} /></Button>
                </div>

                <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search Roll No..." />
            </div>

            {/* STUDENT LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredStudents.map(student => {
                    const status = getStudentStatus(student.rollNumber);
                    const isPerm = status === 'PERMISSION';

                    let permReason = '';
                    if (isPerm) {
                        const p = getActivePermission(
                            permissions,
                            student.rollNumber,
                            date,
                            parseInt(period)
                        );
                        if (p) permReason = p.reason;
                    }

                    return (
                        <button
                            key={student.id}
                            onClick={() => toggleStatus(student.rollNumber)}
                            disabled={isPerm}
                            className="w-full flex items-center justify-between p-4 rounded-xl border shadow-sm"
                        >
                            <div>
                                <div className="font-bold">{student.rollNumber}</div>
                                {isPerm && <div className="text-xs text-amber-600">Reason: "{permReason}"</div>}
                            </div>
                            {isPerm && <Lock size={16} />}
                        </button>
                    );
                })}
            </div>

            {/* SAVE */}
            <div className="p-4 border-t">
                <Button onClick={() => setShowPreview(true)} className="w-full h-12">Review & Save</Button>
            </div>

            {/* PREVIEW */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
                    <Card className="p-6 max-w-md w-full">
                        <pre className="mb-4">{generateSummary()}</pre>
                        <Button onClick={handleSave} className="w-full">Save Attendance</Button>
                        <Button variant="secondary" onClick={() => setShowPreview(false)} className="w-full mt-2">Cancel</Button>
                    </Card>
                </div>
            )}
        </div>
    );
};