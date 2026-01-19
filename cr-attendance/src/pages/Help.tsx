import React from 'react';
import { Card } from '../components/ui/Card';
import {
    Calendar,
    Users,
    BookOpen,
    ShieldCheck,
    HelpCircle,
    ArrowRight,
    LayoutDashboard,
    History as HistoryIcon,
    MoreHorizontal
} from 'lucide-react';

export const Help: React.FC = () => {
    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-2">
                    <HelpCircle size={32} />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    How to use CR-Attendance
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    A comprehensive guide to managing your classroom attendance like a pro.
                </p>
            </div>

            {/* Main Content Sections */}
            <div className="space-y-12 max-w-4xl mx-auto pt-4">

                {/* 1. Home / Attendance marking */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                            <LayoutDashboard size={24} className="text-indigo-600" /> Home & Attendance Marking
                        </h2>
                    </div>
                    <Card className="p-0 overflow-hidden border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                The **Home** page is your daily cockpit. It shows quick stats like total strength and today's attendance count.
                            </p>
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 mb-4">
                                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">Steps to Mark Attendance:</h4>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex gap-2">
                                        <ArrowRight size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                                        <span>Click <strong>"Mark Attendance"</strong> from the Home screen or Sidebar.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <ArrowRight size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                                        <span>Verify the <strong>Date</strong>, select the <strong>Period (1-8)</strong>, and choose the <strong>Subject</strong>.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <ArrowRight size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                                        <span>Toggle between <strong>"Mark Absentees"</strong> (default) or "Mark Presentees".</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <ArrowRight size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                                        <span>Click student cards to toggle status. Students on leave are <strong>Locked (Shield icon)</strong> and cannot be marked absent.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <ArrowRight size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                                        <span>Click <strong>Review & Save</strong> to copy the summary for WhatsApp and finalize the record.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* 2. Our Subjects */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                            <BookOpen size={24} className="text-blue-600" /> Our Subjects
                        </h2>
                    </div>
                    <Card className="p-6 border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="space-y-4 text-gray-600 dark:text-gray-400">
                            <p>Properly managing subjects is crucial for clean reporting. On this page, you can:</p>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                                <li><strong>Add New Subjects:</strong> Type the name and click add. These will appear in the marking dropdown.</li>
                                <li><strong>Remove Subjects:</strong> Use the trash icon for subjects no longer in your current semester.</li>
                                <li><strong>Refresh:</strong> Tap refresh to sync any subjects added by other CRs of the same class.</li>
                            </ul>
                        </div>
                    </Card>
                </section>

                {/* 3. Students Info */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                            <Users size={24} className="text-orange-600" /> Students Info
                        </h2>
                    </div>
                    <Card className="p-6 border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="space-y-4 text-gray-600 dark:text-gray-400">
                            <p>Keep your class roster up to date. This page handles your student database:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Roster Management</h4>
                                    <p className="text-xs">Add individual students and specify if they are <strong>Regular</strong> or <strong>Lateral</strong> entry.</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Smart Search</h4>
                                    <p className="text-xs">Instantly find students by typing their roll number in the search bar. Real-time filtering!</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* 4. Permissions */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                            <Calendar size={24} className="text-purple-600" /> Permissions
                        </h2>
                    </div>
                    <Card className="p-6 border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="space-y-4 text-gray-600 dark:text-gray-400">
                            <p>Used for students on duty, hackathons, or medical leaves. Permissions **prevent** accidental "Absent" marking.</p>
                            <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/10">
                                <h4 className="font-bold text-purple-900 dark:text-purple-300">Defining Duration:</h4>
                                <p className="text-sm">You can set permissions for <strong>Full Day</strong>, only <strong>Morning (Periods 1-4)</strong>, only <strong>Afternoon (Periods 5-8)</strong>, or a <strong>Custom</strong> range of specific periods.</p>
                            </div>
                            <p className="text-sm">Permissions approved by your HOD will show a <ShieldCheck size={16} className="inline text-indigo-600" /> Shield icon and are automatically synced.</p>
                        </div>
                    </Card>
                </section>

                {/* 5. History */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
                        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                            <HistoryIcon size={24} className="text-emerald-600" /> History
                        </h2>
                    </div>
                    <Card className="p-6 border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="space-y-4 text-gray-600 dark:text-gray-400">
                            <p>Review and verify all past attendance entries. This is your audit trail.</p>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                                <li><strong>Details:</strong> Click any record to see exactly who was absent during that period.</li>
                                <li><strong>Copy Summary:</strong> Need to resend a summary to a faculty member? Use the <strong>"Copy Summary"</strong> button inside the history record.</li>
                                <li><strong>Filter:</strong> Use the date picker at the top to find records from a specific day.</li>
                            </ul>
                        </div>
                    </Card>
                </section>

                {/* 6. Misc */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center font-bold">6</div>
                        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                            <MoreHorizontal size={24} className="text-rose-600" /> Misc (Admin Controls)
                        </h2>
                    </div>
                    <Card className="p-6 border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="space-y-4 text-gray-600 dark:text-gray-400 text-sm">
                            <p>The **Misc** page contains sensitive administrative tools for the primary CR:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-800">
                                    <h4 className="font-bold text-rose-900 dark:text-rose-300 mb-1">CR Approvals</h4>
                                    <p>When a new CR tries to join your class, you must <strong>Approve</strong> them here before they see any data.</p>
                                </div>
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">Guest Access</h4>
                                    <p>Working with a substitute CR? Create <strong>Temporary Credentials</strong> that automatically expire after 24 hours.</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </section>

            </div>

            {/* Footer */}
            <div className="pt-8 border-t dark:border-gray-800 text-center text-gray-400 text-sm">
                <p>Designed for excellence. Part of the CAM-Platform Ecosystem.</p>
            </div>
        </div>
    );
};
