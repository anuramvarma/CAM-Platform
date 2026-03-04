import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { PaymentRecord } from '../types';
import {
    DollarSign,
    Search,
    Trash2,
    CheckCircle2,
    Zap,
    TrendingUp,
    Calendar,
    ArrowRight,
    CircleDashed,
    Plus
} from 'lucide-react';

export default function Payments() {
    const { paymentEvents, createPaymentEvent, deletePaymentEvent, updatePaymentRecord } = useApp();
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({ eventName: '', amountPerHead: '', description: '' });
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [records, setRecords] = useState<PaymentRecord[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

    const selectedEvent = paymentEvents.find(e => e.id === selectedEventId);

    useEffect(() => {
        if (selectedEventId) {
            fetchRecords(selectedEventId);
        } else {
            setRecords([]);
        }
    }, [selectedEventId]);

    const fetchRecords = async (eventId: string) => {
        setLoadingRecords(true);
        try {
            const data = await api.payments.getRecords(eventId);
            setRecords(data);
        } catch (err) {
            console.error('Failed to fetch records', err);
        } finally {
            setLoadingRecords(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createPaymentEvent({
                eventName: newEvent.eventName,
                amountPerHead: Number(newEvent.amountPerHead),
                description: newEvent.description
            });
            setNewEvent({ eventName: '', amountPerHead: '', description: '' });
            setIsAddingEvent(false);
        } catch (err) {
            alert('Failed to create event');
        }
    };

    const togglePaid = async (record: PaymentRecord) => {
        try {
            const newIsPaid = !record.isPaid;
            const amount = newIsPaid ? (selectedEvent?.amountPerHead || 0) : 0;

            // Optimistic update
            setRecords(prev => prev.map(r => r.id === record.id ? { ...r, isPaid: newIsPaid, paidAmount: amount } : r));

            await updatePaymentRecord(record.id, newIsPaid, amount);
        } catch (err) {
            // Revert on failure
            fetchRecords(selectedEventId!);
            alert('Failed to update payment status');
        }
    };

    const markAllPaid = async () => {
        if (!confirm('Mark all currently visible students as paid?')) return;

        const studentsToUpdate = filteredRecords.filter(r => !r.isPaid);
        if (studentsToUpdate.length === 0) return;

        try {
            // This is a bit heavy on API calls if many, but safe for small classes
            // Ideally backend should have a bulk update endpoint
            await Promise.all(studentsToUpdate.map(r =>
                updatePaymentRecord(r.id, true, selectedEvent?.amountPerHead || 0)
            ));
            fetchRecords(selectedEventId!);
        } catch (err) {
            alert('Bulk update partially failed');
        }
    };

    const filteredRecords = records.filter(r => {
        const matchesSearch = r.studentRoll.toLowerCase().includes(searchTerm.toLowerCase());
        if (filterType === 'PAID') return matchesSearch && r.isPaid;
        if (filterType === 'PENDING') return matchesSearch && !r.isPaid;
        return matchesSearch;
    });

    const paidCount = records.filter(r => r.isPaid).length;
    const pendingCount = records.length - paidCount;
    const collectionPercentage = records.length > 0 ? Math.round((paidCount / records.length) * 100) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.03] p-8 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-violet-600 rounded-3xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Payments & Collections</h1>
                        <p className="text-slate-400 mt-1 font-medium italic">Track event funds and student contributions</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddingEvent(true)}
                    className="group flex items-center gap-3 bg-violet-600 hover:bg-violet-500 text-white pl-5 pr-6 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-violet-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    New Collection
                </button>
            </header>

            {isAddingEvent && (
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-violet-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Setup New Payment Event</h2>
                    </div>
                    <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Event Title</label>
                            <input
                                type="text"
                                value={newEvent.eventName}
                                onChange={e => setNewEvent({ ...newEvent, eventName: e.target.value })}
                                placeholder="e.g. Annual Trip 2024"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Amount (₹)</label>
                            <input
                                type="number"
                                value={newEvent.amountPerHead}
                                onChange={e => setNewEvent({ ...newEvent, amountPerHead: e.target.value })}
                                placeholder="Per head amount"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-slate-600 font-mono"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Description</label>
                            <input
                                type="text"
                                value={newEvent.description}
                                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                placeholder="Brief reason for collection"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
                            />
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAddingEvent(false)}
                                className="px-6 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-white text-black hover:bg-slate-200 px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-white/5 active:scale-95"
                            >
                                Launch Event
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Left Sidebar: Events List */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Collections</h3>
                        <span className="bg-white/5 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold border border-white/10">{paymentEvents.length} Active</span>
                    </div>

                    <div className="space-y-4">
                        {paymentEvents.length === 0 ? (
                            <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] p-12 text-center group hover:border-violet-500/30 transition-all">
                                <CircleDashed className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-spin-slow" />
                                <p className="text-slate-500 font-bold mb-2">No Active Collections</p>
                                <p className="text-slate-600 text-xs px-4">Create your first payment event to start tracking class funds.</p>
                            </div>
                        ) : (
                            paymentEvents.map(event => (
                                <button
                                    key={event.id}
                                    onClick={() => setSelectedEventId(event.id)}
                                    className={`w-full text-left p-6 rounded-[2rem] border transition-all relative overflow-hidden group
                                        ${selectedEventId === event.id
                                            ? 'bg-violet-600/10 border-violet-500/50 shadow-2xl shadow-violet-500/10'
                                            : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="pr-4">
                                            <h4 className="font-black text-white text-lg group-hover:text-violet-300 transition-colors leading-snug">{event.eventName}</h4>
                                            <p className="text-slate-500 text-xs font-medium mt-1 truncate max-w-[200px]">{event.description || 'No description'}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-emerald-400">₹{event.amountPerHead}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">Per Head</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[11px] font-bold">
                                            <span className="text-slate-400 uppercase tracking-widest">{event.paidCount} Collected</span>
                                            <span className="text-emerald-400">₹{event.totalCollected} Total</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                                                style={{ width: `${Math.min(100, (event.totalCollected / (event.amountPerHead * (event.paidCount || 1) * 2)) * 100)}%` }} // Fixed calc for better visual
                                            />
                                        </div>
                                    </div>

                                    {selectedEventId === event.id && (
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Content: Student Grid */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    {selectedEvent ? (
                        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl flex flex-col h-full shadow-2xl">
                            {/* Detailed Header */}
                            <div className="p-8 border-b border-white/10 bg-white/5 relative">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-violet-400" />
                                            <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em]">Event Management</span>
                                        </div>
                                        <h2 className="text-3xl font-black text-white">{selectedEvent.eventName}</h2>
                                        <p className="text-slate-400 font-medium max-w-xl">{selectedEvent.description || 'Managing collections for this event.'}</p>
                                    </div>
                                    <button
                                        onClick={() => { if (confirm('Permanently delete this event and all payment records?')) { deletePaymentEvent(selectedEvent.id); setSelectedEventId(null); } }}
                                        className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 group"
                                        title="Delete Event"
                                    >
                                        <Trash2 className="w-5 h-5 group-hover:rotate-12" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                                            <DollarSign size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Target Amount</span>
                                        </div>
                                        <p className="text-xl font-mono font-black text-white">₹{selectedEvent.amountPerHead}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                                        <div className="flex items-center gap-2 text-emerald-500 mb-1">
                                            <CheckCircle2 size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Paid</span>
                                        </div>
                                        <p className="text-xl font-black text-emerald-400">{paidCount} Students</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                                        <div className="flex items-center gap-2 text-rose-500 mb-1">
                                            <CircleDashed size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                                        </div>
                                        <p className="text-xl font-black text-rose-400">{pendingCount} Students</p>
                                    </div>
                                    <div className="bg-violet-600 p-4 rounded-3xl shadow-lg shadow-violet-500/20">
                                        <div className="flex items-center gap-2 text-white/60 mb-1">
                                            <TrendingUp size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Collected</span>
                                        </div>
                                        <p className="text-xl font-black text-white">₹{selectedEvent.totalCollected}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Filters & Actions */}
                            <div className="p-6 bg-white/[0.02] border-b border-white/10 flex flex-col lg:flex-row gap-4 justify-between items-center">
                                <div className="flex items-center bg-black/30 p-1 rounded-2xl border border-white/10 w-full lg:w-auto">
                                    {(['ALL', 'PENDING', 'PAID'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFilterType(type)}
                                            className={`flex-1 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                                ${filterType === type
                                                    ? 'bg-white text-black shadow-lg shadow-white/10'
                                                    : 'text-slate-500 hover:text-white'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex w-full lg:w-auto gap-3">
                                    <div className="relative flex-1 lg:w-64">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="Find Roll No..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all font-mono"
                                        />
                                    </div>
                                    <button
                                        onClick={markAllPaid}
                                        className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all active:scale-95 whitespace-nowrap"
                                    >
                                        Mark All Paid
                                    </button>
                                </div>
                            </div>

                            {/* Roll Number Grid */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/10">
                                {loadingRecords ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="relative w-16 h-16">
                                            <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full" />
                                            <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 rounded-full animate-spin" />
                                        </div>
                                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Syncing Records...</p>
                                    </div>
                                ) : filteredRecords.length === 0 ? (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10">
                                            <Search className="w-8 h-8 text-slate-600" />
                                        </div>
                                        <p className="text-slate-500 font-black text-lg">No Results Found</p>
                                        <p className="text-slate-600 text-sm mt-1">Try adjusting your filters or search term.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {filteredRecords.map(record => (
                                            <button
                                                key={record.id}
                                                onClick={() => togglePaid(record)}
                                                className={`
                                                    group relative flex flex-col items-center p-5 rounded-[2rem] border transition-all duration-300 active:scale-90
                                                    ${record.isPaid
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                                                        : 'bg-white/5 border-white/10 hover:border-violet-500/50 hover:bg-violet-600/5'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm mb-3 transition-transform duration-300 group-hover:scale-110
                                                    ${record.isPaid
                                                        ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                                        : 'bg-white/10 text-slate-400 group-hover:text-white group-hover:bg-violet-600'
                                                    }
                                                `}>
                                                    {record.studentRoll.slice(-2)}
                                                </div>
                                                <p className={`font-mono font-bold text-xs tracking-tighter ${record.isPaid ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}`}>
                                                    {record.studentRoll}
                                                </p>

                                                {record.isPaid && (
                                                    <div className="absolute top-2 right-2">
                                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                                    </div>
                                                )}

                                                <div className={`mt-2 h-1 w-8 rounded-full transition-all duration-300 ${record.isPaid ? 'bg-emerald-500 scale-x-100' : 'bg-slate-700 scale-x-50 group-hover:bg-violet-500'}`} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer Breakdown */}
                            <div className="p-8 bg-white/[0.05] border-t border-white/10">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Current Status</p>
                                            <p className="text-2xl font-black text-white">{collectionPercentage}% <span className="text-sm font-bold text-emerald-400 ml-1">Complete</span></p>
                                        </div>
                                        <div className="w-32 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                            <div
                                                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000"
                                                style={{ width: `${collectionPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Value</p>
                                            <p className="text-2xl font-black text-white font-mono">₹{selectedEvent.totalCollected}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                            <ArrowRight className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/[0.03] border border-white/10 border-dashed rounded-[3rem] h-full min-h-[600px] flex flex-col items-center justify-center text-center p-16 animate-pulse-slow">
                            <div className="w-32 h-32 bg-violet-600/10 rounded-[2.5rem] flex items-center justify-center mb-10 border-2 border-dashed border-violet-500/30 group">
                                <DollarSign className="w-16 h-16 text-violet-500/40 group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-4">Launch Command Center</h2>
                            <p className="text-slate-500 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                                Select an active collection from the sidebar to manage payments, view roll numbers, and track growth.
                            </p>
                            <div className="mt-12 flex flex-col items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
                                <span className="flex items-center gap-3">
                                    <CheckCircle2 size={12} className="text-emerald-500/40" />
                                    Real-time Sync
                                </span>
                                <span className="flex items-center gap-3">
                                    <CheckCircle2 size={12} className="text-emerald-500/40" />
                                    Bulk Actions
                                </span>
                                <span className="flex items-center gap-3">
                                    <CheckCircle2 size={12} className="text-emerald-500/40" />
                                    Fund Breakdown
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
