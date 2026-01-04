import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { format, parseISO } from 'date-fns';
import { ChevronRight, Copy, X, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const History: React.FC = () => {
    const { history, subjects, fetchData } = useApp();
    const [filterDate, setFilterDate] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    // Create a safe copy and sort it
    const filteredHistory = (filterDate
        ? history.filter(h => h.date === filterDate)
        : [...history]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log('DEBUG: History Records:', history);
    console.log('DEBUG: Available Subjects:', subjects);
    if (history.length > 0) console.log('DEBUG: Custom Check History[0]:', JSON.stringify(history[0]));
    if (subjects.length > 0) console.log('DEBUG: Custom Check Subject[0]:', JSON.stringify(subjects[0]));

    const getShortRoll = (roll: string) => roll.slice(-2);

    const generateSummary = (record: any) => {
        const subjectName = subjects.find(s => s.id === record.subjectId || (s as any)._id === record.subjectId)?.name || 'Unknown Subject';
        const formattedDate = format(parseISO(record.date), 'dd-MM-yyyy');
        const shortAbsentees = record.absentees.map(getShortRoll).sort();

        return `Date: ${formattedDate}\nPeriod: ${record.period}\nSubject: ${subjectName}\n\nAbsentees : ${shortAbsentees.length > 0 ? shortAbsentees.join(',') : 'Nil'}.`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance History</h1>
                <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                <Input
                    type="date"
                    label="Filter by Date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                />
            </div>

            <div className="space-y-3">
                {filteredHistory.map(record => {
                    const subjectName = subjects.find(s => s.id === record.subjectId || (s as any)._id === record.subjectId)?.name || 'Unknown';
                    const dateLabel = format(parseISO(record.date), 'EEE, MMM d');

                    return (
                        <Card
                            key={record.id}
                            className="p-4 active:scale-[0.99] transition-transform cursor-pointer hover:shadow-md dark:bg-gray-900 dark:border-gray-800"
                            onClick={() => setSelectedRecord(record)}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded uppercase tracking-wider">
                                            {dateLabel}
                                        </span>
                                        <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded">
                                            Period {record.period}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{subjectName}</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Absentees</div>
                                        <div className={`font-bold text-xl ${record.absentees.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {record.absentees.length}
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-300 dark:text-gray-600" size={20} />
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {filteredHistory.length === 0 && (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        No history records found.
                    </div>
                )}
            </div>

            {/* Detailed View Modal */}
            {selectedRecord && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-bottom-10 sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Attendance Details</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {format(parseISO(selectedRecord.date), 'dd MMM yyyy')} • Period {selectedRecord.period}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 overflow-y-auto space-y-6">

                            {/* Subject Info */}
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Subject</label>
                                <div className="text-xl font-bold text-indigo-900 dark:text-indigo-300">
                                    {subjects.find(s => s.id === selectedRecord.subjectId || (s as any)._id === selectedRecord.subjectId)?.name || 'Unknown'}
                                </div>
                            </div>

                            {/* Absentees List */}
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Absentees ({selectedRecord.absentees.length})</label>
                                </div>

                                {selectedRecord.absentees.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {[...selectedRecord.absentees].sort().map((roll: string) => (
                                            <span key={roll} className="px-3 py-1.5 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-sm font-mono font-medium border border-red-100 dark:border-red-900/50">
                                                {roll}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg text-center font-medium border border-emerald-100 dark:border-emerald-900/50">
                                        🎉 No Absentees! Everyone present.
                                    </div>
                                )}
                            </div>

                            {/* Copy Section */}
                            <div className="pt-2">
                                <Button
                                    onClick={() => copyToClipboard(generateSummary(selectedRecord))}
                                    className="w-full flex items-center justify-center gap-2 h-12 text-base shadow-lg shadow-indigo-100 dark:shadow-none"
                                >
                                    <Copy size={18} />
                                    Copy Summary
                                </Button>
                                <p className="text-center text-xs text-gray-400 mt-3">
                                    Copies formatted summary for WhatsApp
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
