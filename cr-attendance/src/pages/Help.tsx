import React, { useState } from 'react';
import {
    Calendar,
    Users,
    BookOpen,
    ShieldCheck,
    HelpCircle,
    ArrowRight,
    LayoutDashboard,
    History as HistoryIcon,
    MoreHorizontal,
    ChevronDown,
    CheckCircle2,
    Sparkles,
    Lock,
    Copy,
    Filter,
    UserPlus,
    Key,
    Search
} from 'lucide-react';

interface Section {
    id: number;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    color: string;
    accent: string;
    content: React.ReactNode;
}

const AccordionItem: React.FC<{ section: Section }> = ({ section }) => {
    const [open, setOpen] = useState(section.id === 1);

    return (
        <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${open ? `${section.accent} shadow-sm` : 'border-slate-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]'}`}>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
            >
                {/* Number + Icon */}
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${section.color}`}>
                    {section.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Step {section.id}</span>
                    </div>
                    <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate">{section.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{section.subtitle}</p>
                </div>

                <ChevronDown
                    size={16}
                    className={`shrink-0 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="px-5 pb-5 border-t border-slate-100 dark:border-white/5 pt-4">
                    {section.content}
                </div>
            )}
        </div>
    );
};

const Step: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex gap-3 items-start">
        <CheckCircle2 size={15} className="text-violet-500 shrink-0 mt-0.5" />
        <span className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{children}</span>
    </li>
);

const InfoChip: React.FC<{ icon: React.ReactNode; label: string; desc: string; color: string }> = ({ icon, label, desc, color }) => (
    <div className={`flex gap-3 p-3.5 rounded-xl border ${color}`}>
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{label}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
        </div>
    </div>
);

export const Help: React.FC = () => {

    const sections: Section[] = [
        {
            id: 1,
            icon: <LayoutDashboard size={18} className="text-violet-600 dark:text-violet-300" />,
            title: 'Home & Attendance Marking',
            subtitle: 'Your daily command center',
            color: 'bg-violet-100 dark:bg-violet-500/20',
            accent: 'border-violet-200 dark:border-violet-500/30 bg-violet-50/40 dark:bg-violet-500/5',
            content: (
                <div className="space-y-4">
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        The Home page shows your daily cockpit — quick stats, recent activity, and a direct link to mark attendance.
                    </p>
                    <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-violet-100 dark:border-violet-500/20 space-y-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">Steps to mark attendance</p>
                        <ul className="space-y-2.5">
                            <Step>Tap <strong className="text-slate-700 dark:text-slate-200">"Mark Attendance"</strong> from the Home screen or sidebar.</Step>
                            <Step>Verify the <strong className="text-slate-700 dark:text-slate-200">Date</strong>, select a <strong className="text-slate-700 dark:text-slate-200">Period (1–8)</strong>, and choose your <strong className="text-slate-700 dark:text-slate-200">Subject</strong>.</Step>
                            <Step>Toggle between <strong className="text-slate-700 dark:text-slate-200">"Mark Absentees"</strong> (default) or <strong className="text-slate-700 dark:text-slate-200">"Mark Presentees"</strong> mode.</Step>
                            <Step>Tap student cards to toggle their status. Students on approved leave are <strong className="text-slate-700 dark:text-slate-200">locked</strong> and cannot be marked absent.</Step>
                            <Step>Tap <strong className="text-slate-700 dark:text-slate-200">"Review & Save"</strong> to preview the summary, copy for WhatsApp, and save the record.</Step>
                        </ul>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {['Date & Period', 'Subject Select', 'Toggle Mode', 'Review & Save'].map(t => (
                            <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">{t}</span>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 2,
            icon: <BookOpen size={18} className="text-blue-600 dark:text-blue-300" />,
            title: 'Our Subjects',
            subtitle: 'Manage your semester subjects',
            color: 'bg-blue-100 dark:bg-blue-500/20',
            accent: 'border-blue-200 dark:border-blue-500/30 bg-blue-50/40 dark:bg-blue-500/5',
            content: (
                <div className="space-y-3">
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Properly managing subjects is essential for clean reporting. Subjects appear in the attendance marking dropdown.
                    </p>
                    <div className="space-y-2">
                        <InfoChip
                            icon={<BookOpen size={14} className="text-blue-500" />}
                            label="Add New Subjects"
                            desc="Type the subject name and tap Add. It immediately appears in the marking dropdown."
                            color="bg-white dark:bg-white/5 border-slate-100 dark:border-white/5"
                        />
                        <InfoChip
                            icon={<Search size={14} className="text-slate-400" />}
                            label="Remove Subjects"
                            desc="Use the trash icon to remove subjects no longer part of your current semester."
                            color="bg-white dark:bg-white/5 border-slate-100 dark:border-white/5"
                        />
                        <InfoChip
                            icon={<ArrowRight size={14} className="text-emerald-500" />}
                            label="Sync with Co-CR"
                            desc="Tap Refresh to pull in subjects added by other CRs of the same class."
                            color="bg-white dark:bg-white/5 border-slate-100 dark:border-white/5"
                        />
                    </div>
                </div>
            )
        },
        {
            id: 3,
            icon: <Users size={18} className="text-amber-600 dark:text-amber-300" />,
            title: 'Students Info',
            subtitle: 'Manage your class roster',
            color: 'bg-amber-100 dark:bg-amber-500/20',
            accent: 'border-amber-200 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/5',
            content: (
                <div className="space-y-3">
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Keep your class roster accurate. This page manages your entire student database.
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                        <InfoChip
                            icon={<UserPlus size={14} className="text-amber-500" />}
                            label="Add Students"
                            desc="Add individual students and specify if they are Regular or Lateral Entry. Both types are tracked separately in reports."
                            color="bg-white dark:bg-white/5 border-slate-100 dark:border-white/5"
                        />
                        <InfoChip
                            icon={<Search size={14} className="text-amber-400" />}
                            label="Smart Search"
                            desc="Instantly find students by typing their roll number. Real-time filtering with no delay."
                            color="bg-white dark:bg-white/5 border-slate-100 dark:border-white/5"
                        />
                    </div>
                </div>
            )
        },
        {
            id: 4,
            icon: <Calendar size={18} className="text-purple-600 dark:text-purple-300" />,
            title: 'Permissions',
            subtitle: 'Leave, duty, events & exemptions',
            color: 'bg-purple-100 dark:bg-purple-500/20',
            accent: 'border-purple-200 dark:border-purple-500/30 bg-purple-50/40 dark:bg-purple-500/5',
            content: (
                <div className="space-y-3">
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Permissions prevent accidental absent-marking for students on duty, hackathons, or medical leave.
                    </p>
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Duration types</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {[
                                { label: 'Full Day', desc: 'Periods 1–8' },
                                { label: 'Morning', desc: 'Periods 1–4' },
                                { label: 'Afternoon', desc: 'Periods 5–8' },
                                { label: 'Custom', desc: 'Pick specific periods' },
                            ].map(t => (
                                <div key={t.label} className="px-3 py-2 rounded-lg bg-white dark:bg-white/10 border border-purple-100 dark:border-purple-500/20">
                                    <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300">{t.label}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                        <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-[12px] text-emerald-700 dark:text-emerald-300">
                            Permissions approved by your <strong>HOD</strong> show a shield icon and are automatically synced across all CRs.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 5,
            icon: <HistoryIcon size={18} className="text-emerald-600 dark:text-emerald-300" />,
            title: 'History',
            subtitle: 'Audit trail of all attendance records',
            color: 'bg-emerald-100 dark:bg-emerald-500/20',
            accent: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/5',
            content: (
                <div className="space-y-3">
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Review and verify all past attendance entries. Your complete audit trail.
                    </p>
                    <div className="space-y-2">
                        <InfoChip
                            icon={<ArrowRight size={14} className="text-emerald-500" />}
                            label="View Details"
                            desc="Tap any record to see exactly who was absent for that period, with full absentee list."
                            color="bg-white dark:bg-white/5 border-slate-100 dark:border-white/5"
                        />
                        <InfoChip
                            icon={<Copy size={14} className="text-slate-400" />}
                            label="Copy Summary"
                            desc="Resend a formatted summary to faculty anytime using the Copy Summary button inside the record."
                            color="bg-white dark:bg-white/5 border-slate-100 dark:border-white/5"
                        />
                        <InfoChip
                            icon={<Filter size={14} className="text-slate-400" />}
                            label="Date Filter"
                            desc="Use the date picker at the top to instantly find records from any specific day."
                            color="bg-white dark:bg-white/5 border-slate-100 dark:border-white/5"
                        />
                    </div>
                </div>
            )
        },
        {
            id: 6,
            icon: <MoreHorizontal size={18} className="text-rose-600 dark:text-rose-300" />,
            title: 'Misc (Admin Controls)',
            subtitle: 'Sensitive tools for the primary CR',
            color: 'bg-rose-100 dark:bg-rose-500/20',
            accent: 'border-rose-200 dark:border-rose-500/30 bg-rose-50/40 dark:bg-rose-500/5',
            content: (
                <div className="space-y-3">
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Administrative tools reserved for the primary CR. Use with care.
                    </p>
                    <div className="space-y-2">
                        <InfoChip
                            icon={<Lock size={14} className="text-rose-500" />}
                            label="CR Approvals"
                            desc="When a new CR requests to join your class, you must approve them here before they can access any data."
                            color="bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20"
                        />
                        <InfoChip
                            icon={<Key size={14} className="text-indigo-500" />}
                            label="Guest Access"
                            desc="Create temporary credentials for substitute CRs. They auto-expire after 24 hours for security."
                            color="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20"
                        />
                    </div>
                </div>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#08080f] pb-20">
            <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

                {/* ── Hero Header ── */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 dark:from-slate-900 dark:via-[#0f0f1a] dark:to-[#08080f] p-6 shadow-2xl">
                    {/* Dot grid */}
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    {/* Glow */}
                    <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 backdrop-blur-sm">
                            <HelpCircle size={22} className="text-violet-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={12} className="text-violet-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Guide</span>
                            </div>
                            <h1 className="text-xl font-bold text-white leading-tight">How to use CR-Attendance</h1>
                            <p className="text-sm text-slate-400 mt-1">Everything you need to manage your class like a pro.</p>
                        </div>
                    </div>

                    {/* Quick badges */}
                    <div className="relative z-10 flex gap-2 flex-wrap mt-5">
                        {['6 Sections', 'Step-by-step', 'Always updated'].map(b => (
                            <span key={b} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10">
                                {b}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Quick Nav Chips ── */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {[
                        { label: 'Mark', color: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300' },
                        { label: 'Subjects', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' },
                        { label: 'Students', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' },
                        { label: 'Permissions', color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300' },
                        { label: 'History', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' },
                        { label: 'Admin', color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300' },
                    ].map(chip => (
                        <span key={chip.label} className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full cursor-default ${chip.color}`}>
                            {chip.label}
                        </span>
                    ))}
                </div>

                {/* ── Accordion Sections ── */}
                <div className="space-y-2.5">
                    {sections.map(section => (
                        <AccordionItem key={section.id} section={section} />
                    ))}
                </div>

                {/* ── Footer ── */}
                <div className="flex flex-col items-center gap-2 py-6 border-t border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                        <Sparkles size={14} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <p className="text-xs text-slate-400 text-center">Designed for excellence · Part of the CAM-Platform Ecosystem</p>
                </div>
            </div>
        </div>
    );
};