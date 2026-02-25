import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, Users, BookOpen, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';
import { AttendanceRecord } from '../types';

export const Home: React.FC = () => {
    const { students, subjects } = useApp();
    const [history, setHistory] = React.useState<AttendanceRecord[]>([]);

    React.useEffect(() => {
        api.attendance.history().then(setHistory).catch(console.error);
    }, []);

    const totalStudents = students.length;
    const todayRaw = new Date().toISOString().split('T')[0];
    const todayCount = history.filter(h => h.date === todayRaw).length;

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const sessionLabel = (s: string) => {
        if (s === 'MORNING') return { label: 'Morning', color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' };
        if (s === 'AFTERNOON') return { label: 'Afternoon', color: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400' };
        return { label: s, color: 'text-slate-500 bg-slate-100 dark:bg-white/10 dark:text-slate-400' };
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#08080f] pb-24">
            <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

                {/* ── Hero Header ── */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-6 shadow-2xl shadow-violet-500/20">
                    {/* Decorative blobs */}
                    <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />
                    {/* Dot grid */}
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <p className="text-violet-200 text-xs font-semibold uppercase tracking-widest mb-1">
                                    {dayName} · {dateStr}
                                </p>
                                <h1 className="text-2xl font-bold text-white leading-tight">
                                    {greeting}, CR 👋
                                </h1>
                                <p className="text-violet-300 text-sm mt-1">Ready to mark today's attendance?</p>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Zap size={20} className="text-violet-200" />
                            </div>
                        </div>

                        {/* CTA Button */}
                        <Link
                            to="/mark"
                            className="group inline-flex items-center gap-2.5 px-5 py-3 bg-white hover:bg-violet-50 rounded-2xl text-violet-700 font-bold text-sm transition-all shadow-lg shadow-black/10 active:scale-[0.97]"
                        >
                            <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <PlusCircle size={15} className="text-white" />
                            </div>
                            Mark Attendance
                            <ArrowRight size={15} className="text-violet-400 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-3 gap-3">

                    <div className="flex flex-col gap-2 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-4">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                            <Users size={15} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Students</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-0.5">{totalStudents}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-4">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                            <Clock size={15} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Today</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-0.5">{todayCount}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-4">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                            <BookOpen size={15} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Subjects</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-0.5">{subjects.length}</p>
                        </div>
                    </div>
                </div>

                {/* ── Recent Activity ── */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={15} className="text-slate-400" />
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Recent Activity</h2>
                        </div>
                        {history.length > 5 && (
                            <Link to="/history" className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                                View all <ArrowRight size={11} />
                            </Link>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 gap-3 bg-white dark:bg-white/[0.03] border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                <Clock size={22} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No records yet</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Mark your first attendance to see it here</p>
                            </div>
                            <Link
                                to="/mark"
                                className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors"
                            >
                                <PlusCircle size={13} /> Mark Now
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.slice(0, 5).map((record, idx) => {
                                const subject = subjects.find(s => s.id === record.subjectId)?.name || 'Unknown Subject';
                                const sess = sessionLabel(record.session);
                                const absentCount = record.absentees.length;

                                return (
                                    <div
                                        key={record.id}
                                        className="group flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-2xl hover:border-slate-200 dark:hover:border-white/10 transition-all"
                                    >
                                        {/* Index badge */}
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{idx + 1}</span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{subject}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-slate-400">{record.date}</span>
                                                <span className="text-slate-300 dark:text-slate-700">·</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${sess.color}`}>
                                                    {sess.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Absent badge */}
                                        <div className={`shrink-0 px-2.5 py-1.5 rounded-xl text-center
                                            ${absentCount === 0
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20'
                                                : 'bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20'
                                            }`}>
                                            <p className={`text-base font-bold leading-none ${absentCount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                                {absentCount}
                                            </p>
                                            <p className={`text-[9px] font-semibold uppercase tracking-wide mt-0.5 ${absentCount === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                absent
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};