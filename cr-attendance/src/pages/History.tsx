import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { format, parseISO } from 'date-fns';
import { ChevronRight, Copy, X, RefreshCw, Edit, Calendar, Clock, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const History: React.FC = () => {
    const { history, subjects, students, fetchData } = useApp();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [filterDate, setFilterDate] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const filteredHistory = (filterDate
        ? history.filter(h => h.date === filterDate)
        : [...history]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log('DEBUG: History Records:', history);
    console.log('DEBUG: Available Subjects:', subjects);
    if (history.length > 0) console.log('DEBUG: Custom Check History[0]:', JSON.stringify(history[0]));
    if (subjects.length > 0) console.log('DEBUG: Custom Check Subject[0]:', JSON.stringify(subjects[0]));

    const getShortRoll = (roll: string) => roll.slice(-2);

    const generateSummary = (record: any) => {
        const subjectName =
            subjects.find(
                s => s.id === record.subjectId || (s as any)._id === record.subjectId
            )?.name || 'Unknown';

        const formattedDate = format(parseISO(record.date), 'dd/MM/yyyy');
        const absentees = record.absentees || [];

        const regulars = absentees.filter((roll: string) => {
            const student = students.find(s => s.rollNumber === roll);
            if (student) return student.type !== 'LATERAL';
            return !/^24PA5A05\d+$/.test(roll);
        }).map(getShortRoll).sort();

        const laterals = absentees.filter((roll: string) => {
            const student = students.find(s => s.rollNumber === roll);
            if (student) return student.type === 'LATERAL';
            return /^24PA5A05\d+$/.test(roll);
        }).map(getShortRoll).sort();

        return (
            `Date: ${formattedDate}
Subject: ${subjectName}
Period: ${record.period}

Absentees: ${regulars.length ? regulars.join(', ') : 'Nil'}
LE : ${laterals.length ? laterals.join(', ') : 'Nil'}`
        );
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
    };

    // Group records by date for timeline display
    const groupedHistory = filteredHistory.reduce((acc: Record<string, any[]>, record) => {
        const dateKey = record.date;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(record);
        return acc;
    }, {});

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

                .history-root {
                    font-family: 'DM Sans', sans-serif;
                }

                .glass-card {
                    background: rgba(255,255,255,0.85);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.6);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06);
                }

                .dark .glass-card {
                    background: rgba(17,24,39,0.85);
                    border: 1px solid rgba(255,255,255,0.06);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.3);
                }

                .record-card {
                    transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s ease, border-color 0.15s ease;
                    cursor: pointer;
                    border: 1px solid rgba(0,0,0,0.06);
                    border-radius: 16px;
                    background: #fff;
                    overflow: hidden;
                    position: relative;
                }

                .dark .record-card {
                    background: #111827;
                    border: 1px solid rgba(255,255,255,0.07);
                }

                .record-card:hover {
                    transform: translateY(-2px) scale(1.005);
                    box-shadow: 0 8px 32px rgba(79,70,229,0.1), 0 2px 8px rgba(0,0,0,0.06);
                    border-color: rgba(79,70,229,0.2);
                }

                .record-card:active {
                    transform: scale(0.98);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                }

                .dark .record-card:hover {
                    box-shadow: 0 8px 32px rgba(79,70,229,0.2);
                    border-color: rgba(79,70,229,0.3);
                }

                .accent-bar {
                    position: absolute;
                    left: 0; top: 0; bottom: 0;
                    width: 3px;
                    background: linear-gradient(to bottom, #6366f1, #8b5cf6);
                    border-radius: 3px 0 0 3px;
                }

                .accent-bar.green {
                    background: linear-gradient(to bottom, #10b981, #059669);
                }

                .period-badge {
                    font-family: 'DM Mono', monospace;
                    font-size: 10px;
                    font-weight: 500;
                    letter-spacing: 0.08em;
                    padding: 3px 8px;
                    border-radius: 6px;
                    background: rgba(79,70,229,0.08);
                    color: #4f46e5;
                    border: 1px solid rgba(79,70,229,0.12);
                }

                .dark .period-badge {
                    background: rgba(99,102,241,0.15);
                    color: #818cf8;
                    border-color: rgba(99,102,241,0.2);
                }

                .absent-count {
                    font-family: 'DM Mono', monospace;
                    font-variant-numeric: tabular-nums;
                }

                .date-divider {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 20px 0 10px;
                }

                .date-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: linear-gradient(to right, rgba(0,0,0,0.08), transparent);
                }

                .dark .date-divider::after {
                    background: linear-gradient(to right, rgba(255,255,255,0.08), transparent);
                }

                .date-chip {
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: #9ca3af;
                    padding: 4px 10px;
                    border-radius: 20px;
                    background: #f3f4f6;
                    border: 1px solid #e5e7eb;
                    white-space: nowrap;
                }

                .dark .date-chip {
                    background: #1f2937;
                    border-color: #374151;
                    color: #6b7280;
                }

                /* Modal */
                .modal-backdrop {
                    animation: fadeIn 0.2s ease;
                }

                .modal-sheet {
                    animation: slideUp 0.3s cubic-bezier(.16,1,.3,1);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .roll-chip {
                    font-family: 'DM Mono', monospace;
                    font-size: 13px;
                    font-weight: 500;
                    padding: 6px 12px;
                    border-radius: 8px;
                    transition: transform 0.12s ease;
                }

                .roll-chip:hover { transform: scale(1.05); }

                .roll-chip.regular {
                    background: #fef2f2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                }

                .dark .roll-chip.regular {
                    background: rgba(220,38,38,0.12);
                    color: #f87171;
                    border-color: rgba(248,113,113,0.2);
                }

                .roll-chip.lateral {
                    background: #fff7ed;
                    color: #ea580c;
                    border: 1px solid #fed7aa;
                }

                .dark .roll-chip.lateral {
                    background: rgba(234,88,12,0.12);
                    color: #fb923c;
                    border-color: rgba(251,146,60,0.2);
                }

                .copy-btn {
                    position: relative;
                    overflow: hidden;
                    background: linear-gradient(135deg, #4f46e5, #6366f1);
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                    box-shadow: 0 4px 16px rgba(79,70,229,0.3);
                }

                .copy-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(79,70,229,0.4);
                }

                .copy-btn:active { transform: translateY(0); }

                .copy-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, rgba(255,255,255,0.1), transparent);
                    pointer-events: none;
                }

                .edit-btn {
                    transition: transform 0.15s ease, background 0.15s ease;
                }

                .edit-btn:hover {
                    transform: translateY(-1px);
                    background: rgba(79,70,229,0.06);
                }

                .refresh-btn {
                    transition: all 0.15s ease;
                }

                .refresh-btn:hover { transform: translateY(-1px); }

                .filter-section {
                    background: #fafafa;
                    border: 1px solid #e5e7eb;
                    border-radius: 14px;
                    padding: 16px;
                }

                .dark .filter-section {
                    background: #111827;
                    border-color: #1f2937;
                }

                .empty-state {
                    animation: fadeIn 0.4s ease;
                }

                .header-gradient {
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .dark .header-gradient {
                    background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .section-label {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #9ca3af;
                }

                .dark .section-label { color: #4b5563; }

                .modal-header {
                    background: linear-gradient(to bottom, #fafafa, #fff);
                }

                .dark .modal-header {
                    background: linear-gradient(to bottom, #1f2937, #111827);
                }
            `}</style>

            <div className="history-root space-y-5">
                {/* Page Header */}
                <div className="flex items-center justify-between pt-1">
                    <div>
                        <h1 className="text-2xl font-semibold header-gradient">Attendance History</h1>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-light">
                            {history.length} records total
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="refresh-btn flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Filter */}
                <div className="filter-section">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <Calendar size={13} className="text-indigo-400" />
                        <span className="section-label">Filter by date</span>
                    </div>
                    <Input
                        type="date"
                        label=""
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                    />
                    {filterDate && (
                        <button
                            onClick={() => setFilterDate('')}
                            className="mt-2 text-xs text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                            <X size={11} /> Clear filter
                        </button>
                    )}
                </div>

                {/* Timeline */}
                <div className="space-y-1 pb-6">
                    {Object.keys(groupedHistory).length > 0 ? (
                        Object.entries(groupedHistory).map(([dateKey, records]) => (
                            <div key={dateKey}>
                                {/* Date divider */}
                                <div className="date-divider">
                                    <span className="date-chip">
                                        {format(parseISO(dateKey), 'EEE, MMM d, yyyy')}
                                    </span>
                                </div>

                                {/* Records for this date */}
                                <div className="space-y-2.5">
                                    {records.map(record => {
                                        const subjectName = subjects.find(s => s.id === record.subjectId || (s as any)._id === record.subjectId)?.name || 'Unknown';
                                        const hasAbsentees = record.absentees.length > 0;

                                        return (
                                            <div
                                                key={record.id}
                                                className="record-card"
                                                onClick={() => setSelectedRecord(record)}
                                            >
                                                <div className={`accent-bar ${hasAbsentees ? '' : 'green'}`} />
                                                <div className="pl-5 pr-4 py-3.5 flex items-center justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="period-badge">
                                                                P{record.period}
                                                            </span>
                                                        </div>
                                                        <p className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 truncate leading-tight">
                                                            {subjectName}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                                                        <div className="text-right">
                                                            <div className="section-label mb-0.5">Absent</div>
                                                            <div className={`absent-count text-2xl font-bold leading-none ${hasAbsentees ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                                                {record.absentees.length}
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-700">
                                <BookOpen size={22} className="text-gray-300 dark:text-gray-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No records found</p>
                            {filterDate && <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Try clearing the date filter</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed View Modal */}
            {selectedRecord && (
                <div
                    className="modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={(e) => e.target === e.currentTarget && setSelectedRecord(null)}
                >
                    <div className="modal-sheet w-full sm:max-w-md bg-white dark:bg-gray-900 shadow-2xl sm:rounded-2xl rounded-t-3xl flex flex-col max-h-[92vh]">

                        {/* Drag handle (mobile) */}
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        </div>

                        {/* Modal Header */}
                        <div className="modal-header px-5 pt-3 pb-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start rounded-t-3xl sm:rounded-t-2xl">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white leading-tight">Attendance Details</h3>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                                        <Calendar size={11} />
                                        <span>{format(parseISO(selectedRecord.date), 'dd MMM yyyy')}</span>
                                    </div>
                                    <span className="text-gray-200 dark:text-gray-700">·</span>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                                        <Clock size={11} />
                                        <span>Period {selectedRecord.period}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors mt-0.5"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-5 overflow-y-auto space-y-5 flex-1">

                            {/* Subject */}
                            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                                    <BookOpen size={16} className="text-indigo-500 dark:text-indigo-400" />
                                </div>
                                <div className="min-w-0">
                                    <div className="section-label mb-0.5">Subject</div>
                                    <div className="text-[15px] font-semibold text-indigo-900 dark:text-indigo-200 truncate">
                                        {subjects.find(s => s.id === selectedRecord.subjectId || (s as any)._id === selectedRecord.subjectId)?.name || 'Unknown'}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                                    <div className="section-label mb-1">Regular</div>
                                    <div className="absent-count text-2xl font-bold text-red-500 dark:text-red-400">
                                        {selectedRecord.absentees.filter((roll: string) => {
                                            const s = students.find(st => st.rollNumber === roll);
                                            return s ? s.type !== 'LATERAL' : !/^24PA5A05\d+$/.test(roll);
                                        }).length}
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                                    <div className="section-label mb-1">Lateral Entry</div>
                                    <div className="absent-count text-2xl font-bold text-orange-500 dark:text-orange-400">
                                        {selectedRecord.absentees.filter((roll: string) => {
                                            const s = students.find(st => st.rollNumber === roll);
                                            return s ? s.type === 'LATERAL' : /^24PA5A05\d+$/.test(roll);
                                        }).length}
                                    </div>
                                </div>
                            </div>

                            {/* Regular Absentees */}
                            <div>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <Users size={12} className="text-red-400" />
                                    <span className="section-label">Regular Absentees</span>
                                </div>
                                {selectedRecord.absentees.filter((roll: string) => {
                                    const s = students.find(st => st.rollNumber === roll);
                                    return s ? s.type !== 'LATERAL' : !/^24PA5A05\d+$/.test(roll);
                                }).length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedRecord.absentees
                                            .filter((roll: string) => {
                                                const s = students.find(st => st.rollNumber === roll);
                                                return s ? s.type !== 'LATERAL' : !/^24PA5A05\d+$/.test(roll);
                                            })
                                            .sort()
                                            .map((roll: string) => (
                                                <span key={roll} className="roll-chip regular">
                                                    {getShortRoll(roll)}
                                                </span>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">All Present</span>
                                    </div>
                                )}
                            </div>

                            {/* LE Absentees */}
                            <div>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <Users size={12} className="text-orange-400" />
                                    <span className="section-label">Lateral Entry Absentees</span>
                                </div>
                                {selectedRecord.absentees.filter((roll: string) => {
                                    const s = students.find(st => st.rollNumber === roll);
                                    return s ? s.type === 'LATERAL' : /^24PA5A05\d+$/.test(roll);
                                }).length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedRecord.absentees
                                            .filter((roll: string) => {
                                                const s = students.find(st => st.rollNumber === roll);
                                                return s ? s.type === 'LATERAL' : /^24PA5A05\d+$/.test(roll);
                                            })
                                            .sort()
                                            .map((roll: string) => (
                                                <span key={roll} className="roll-chip lateral">
                                                    {getShortRoll(roll)}
                                                </span>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                        <span className="text-xs text-gray-400 font-medium">None absent</span>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100 dark:border-gray-800" />

                            {/* Actions */}
                            <div className="space-y-2.5 pb-1">
                                <button
                                    onClick={() => copyToClipboard(generateSummary(selectedRecord))}
                                    className="copy-btn w-full flex items-center justify-center gap-2.5 h-12 text-white font-semibold text-sm rounded-2xl"
                                >
                                    <Copy size={16} />
                                    Copy Summary
                                </button>
                                <button
                                    onClick={() => navigate('/mark', { state: { editRecord: selectedRecord } })}
                                    className="edit-btn w-full flex items-center justify-center gap-2.5 h-12 text-indigo-600 dark:text-indigo-400 font-semibold text-sm rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/50"
                                >
                                    <Edit size={16} />
                                    Edit Absentees
                                </button>
                                <p className="text-center text-[11px] text-gray-300 dark:text-gray-600 font-light">
                                    Summary formatted for WhatsApp
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
};