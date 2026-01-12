import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { Users, Lock, Unlock, TrendingUp, Grid, X, Plus, Edit2 } from 'lucide-react';

interface Class {
    id: string;
    yearOfStudy: number;
    degree: string;
    dept: string;
    section: string;
    admissionYear: string;
    studentCount: number;
    todayPermissionsCount?: number;
    regularCount?: number;
    lateralCount?: number;
    userId?: {
        name: string;
        email: string;
    };
}

export const Classes = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchClasses = async () => {
        try {
            const data = await api.hod.getClasses();
            setClasses(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || JSON.stringify(err) || 'Failed to load classes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const groupedClasses = classes.reduce((acc, cls) => {
        const year = cls.yearOfStudy;
        if (!acc[year]) acc[year] = [];
        acc[year].push(cls);
        return acc;
    }, {} as Record<number, Class[]>);

    const handleDeleteClass = async (id: string) => {
        try {
            await api.hod.deleteClass(id);
            setClasses(classes.filter(c => c.id !== id));
        } catch (err: any) {
            console.error(err);
            alert(`Failed to delete class: ${err.message || 'Unknown error'}`);
        }
    };

    const handleEditClass = async (id: string, updates: any) => {
        try {
            await api.hod.editClass(id, updates);
            setClasses(classes.map(c => c.id === id ? { ...c, ...updates } : c));
            setSelectedClass(null); // Close modal
        } catch (err: any) {
            console.error(err);
            alert(`Failed to update class: ${err.message}`);
        }
    };

    const handleCreateSuccess = () => {
        setIsCreateOpen(false);
        fetchClasses(); // Refresh list
    };

    const [selectedClass, setSelectedClass] = useState<Class | null>(null);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading classes...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-8 fade-in pb-10">
            <header className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Classes</h1>
                    <p className="text-gray-500 dark:text-gray-400">Monitor and create department classes</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-5 h-5 mr-2" /> Create New Class
                </Button>
            </header>

            {Object.keys(groupedClasses).map((year) => (
                <section key={year} className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Grid className="w-5 h-5 text-indigo-500" />
                        Year {year}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupedClasses[parseInt(year)].map((cls) => (
                            <ClassCard
                                key={cls.id}
                                cls={cls}
                                onDelete={handleDeleteClass}
                                onClick={() => setSelectedClass(cls)}
                            />
                        ))}
                    </div>
                </section>
            ))}

            {classes.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
                    <p className="mb-4">No classes found.</p>
                    <Button variant="secondary" onClick={() => setIsCreateOpen(true)}>Create Your First Class</Button>
                </div>
            )}

            {selectedClass && (
                <SummaryModal
                    cls={selectedClass}
                    onClose={() => setSelectedClass(null)}
                    onEdit={handleEditClass}
                />
            )}

            {isCreateOpen && (
                <CreateClassModal onClose={() => setIsCreateOpen(false)} onSuccess={handleCreateSuccess} />
            )}
        </div>
    );
};

// ... ClassCard and SummaryModal components remain unchanged ...
// Duplicating them briefly to ensure context is kept, but modifying mainly CreateClassModal addition

const CreateClassModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        yearOfStudy: '1',
        degree: 'B.TECH',
        dept: 'CSE',
        section: 'A',
        admissionYear: '23',
        collegeCode: 'PA',
        startRoll: '',
        endRoll: '',
        lateralEnabled: false,
        lateralStart: '',
        lateralEnd: '',
        crEmail: '',
        crPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        // @ts-ignore
        const checked = e.target.checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                lateralDetails: formData.lateralEnabled ? {
                    enabled: true,
                    startRoll: formData.lateralStart,
                    endRoll: formData.lateralEnd
                } : null
            };
            await api.hod.createClass(payload);
            onSuccess();
        } catch (err: any) {
            alert(err.message || 'Failed to create class');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
            <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create a New Class</h2>
                        <p className="text-sm text-gray-500">Setup class details, students, and CR</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Grid className="w-4 h-4" /> Class Information
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1">Year of Study</label>
                                <select name="yearOfStudy" value={formData.yearOfStudy} onChange={handleChange} className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:border-gray-700">
                                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Degree</label>
                                <select name="degree" value={formData.degree} onChange={handleChange} className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:border-gray-700">
                                    <option value="B.TECH">B.TECH</option>
                                    <option value="M.TECH">M.TECH</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Department</label>
                                <select name="dept" value={formData.dept} onChange={handleChange} className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:border-gray-700">
                                    <option value="CSE">CSE</option>
                                    <option value="IT">IT</option>
                                    <option value="CSBS">CSBS</option>
                                    <option value="AIDS">AIDS</option>
                                    <option value="AIML">AIML</option>
                                    <option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option>
                                    <option value="MECH">MECH</option>
                                    <option value="CIVIL">CIVIL</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Choose Section</label>

                                <select
                                    name="section"
                                    value={formData.section}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:border-gray-700 uppercase"
                                >
                                    <option value="" disabled>
                                        Select Section
                                    </option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">Batch (YY)</label>
                                <input type="number" name="admissionYear" value={formData.admissionYear} onChange={handleChange} className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:border-gray-700" placeholder="23" required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">College Code</label>
                                <input type="text" name="collegeCode" value={formData.collegeCode} onChange={handleChange} className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:border-gray-700 uppercase" placeholder="PA" required />
                            </div>
                        </div>
                    </div>

                    {/* Students */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4" /> Student Data Setup
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold mb-2">Regular Students Roll Range</label>
                                <div className="flex gap-4 items-center">
                                    <input type="text" name="startRoll" placeholder="Start Roll (e.g. 23PA1A0501)" value={formData.startRoll} onChange={handleChange} className="flex-1 p-2 border rounded bg-white dark:bg-gray-950 dark:border-gray-700 uppercase font-mono text-sm" required />
                                    <span className="text-gray-400">to</span>
                                    <input type="text" name="endRoll" placeholder="End Roll (e.g. 23PA1A0560)" value={formData.endRoll} onChange={handleChange} className="flex-1 p-2 border rounded bg-white dark:bg-gray-950 dark:border-gray-700 uppercase font-mono text-sm" required />
                                </div>
                            </div>

                            {parseInt(formData.yearOfStudy) > 1 && (
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                                        <input type="checkbox" name="lateralEnabled" checked={formData.lateralEnabled} onChange={handleChange} className="rounded text-indigo-600" />
                                        <span className="text-xs font-semibold">Enable Lateral Entry Students</span>
                                    </label>
                                    {formData.lateralEnabled && (
                                        <div className="flex gap-4 items-center animate-in slide-in-from-top-2">
                                            <input type="text" name="lateralStart" placeholder="Lateral Start Roll" value={formData.lateralStart} onChange={handleChange} className="flex-1 p-2 border rounded bg-white dark:bg-gray-950 dark:border-gray-700 uppercase font-mono text-sm" required />
                                            <span className="text-gray-400">to</span>
                                            <input type="text" name="lateralEnd" placeholder="Lateral End Roll" value={formData.lateralEnd} onChange={handleChange} className="flex-1 p-2 border rounded bg-white dark:bg-gray-950 dark:border-gray-700 uppercase font-mono text-sm" required />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Class Representative */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Assign Class Representative
                        </h3>
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1">CR Email</label>
                                <input type="email" name="crEmail" value={formData.crEmail} onChange={handleChange} className="w-full p-2 border rounded bg-white dark:bg-gray-950 dark:border-gray-700" placeholder="cr@college.edu" required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">CR Password</label>
                                <input type="text" name="crPassword" value={formData.crPassword} onChange={handleChange} className="w-full p-2 border rounded bg-white dark:bg-gray-900 dark:border-gray-700 font-mono" placeholder="Set Password" required />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating Class...' : 'Create Class & Assign CR'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ... ClassCard and SummaryModal code must follow ...
const ClassCard = ({ cls, onDelete, onClick }: { cls: Class, onDelete: (id: string) => void, onClick: () => void }) => {
    const [locked, setLocked] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <Card className="hover:shadow-md transition-shadow duration-300 border-t-4 border-t-indigo-500 relative overflow-hidden group cursor-pointer" onClick={onClick}>
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {cls.degree} - {cls.dept}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Section {cls.section}
                        </p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-full text-xs font-semibold">
                        Batch '{cls.admissionYear}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">{cls.studentCount || 0} Students</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-xs text-gray-400">
                        CR: <span className="text-gray-600 dark:text-gray-300 font-medium">{cls.userId?.name || cls.userId?.email || 'Unknown'}</span>
                    </div>
                </div>

                {/* Actions Overlay - stopPropagation to prevent modal open */}
                <div className="flex justify-between items-center mt-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                        {/* Existing buttons */}
                        <Button size="sm" variant="secondary" className="h-8 w-8 pk-0" title="Promote Class">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                            size="sm" variant="secondary" className={`h-8 w-8 pk-0 ${locked ? 'bg-red-50 text-red-600' : ''}`}
                            onClick={() => setLocked(!locked)}
                            title={locked ? "Unlock Attendance" : "Lock Attendance"}
                        >
                            {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 text-gray-500" />}
                        </Button>
                    </div>
                    <div>
                        {!confirmDelete ? (
                            <Button
                                size="sm" variant="secondary" className="h-8 w-8 text-red-500 hover:bg-red-50"
                                onClick={() => setConfirmDelete(true)}
                                title="Delete Class"
                            >
                                <Users className="w-4 h-4" />
                            </Button>
                        ) : (
                            <div className="flex gap-1 items-center animate-in slide-in-from-right-4">
                                <span className="text-[10px] text-red-600 font-bold mr-1">Sure?</span>
                                <Button size="sm" variant="primary" className="h-6 px-2 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={() => onDelete(cls.id)}>Yes</Button>
                                <Button size="sm" variant="secondary" className="h-6 px-2 text-xs" onClick={() => setConfirmDelete(false)}>No</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

const SummaryModal = ({ cls, onClose, onEdit }: { cls: Class, onClose: () => void, onEdit: (id: string, updates: any) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        yearOfStudy: cls.yearOfStudy,
        dept: cls.dept,
        section: cls.section,
        admissionYear: cls.admissionYear
    });

    if (!cls) return null;

    const handleSave = () => {
        onEdit(cls.id, editData);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800 slide-in-from-top-2">
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600">
                    <div className="flex justify-between items-start text-white">
                        <div>
                            {isEditing ? (
                                <div className="space-y-2 text-gray-900">
                                    <select
                                        value={editData.dept}
                                        onChange={e => setEditData({ ...editData, dept: e.target.value })}
                                        className="block w-full p-1 rounded-md text-sm"
                                    >
                                        {['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML', 'CSBS'].map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold">{cls.degree} - {cls.dept}</h2>
                                    <p className="opacity-90">Section {cls.section} • Batch '{cls.admissionYear}</p>
                                </>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(!isEditing)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1">Section</label>
                                <input
                                    value={editData.section}
                                    onChange={e => setEditData({ ...editData, section: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Year</label>
                                <select
                                    value={editData.yearOfStudy}
                                    onChange={e => setEditData({ ...editData, yearOfStudy: parseInt(e.target.value) })}
                                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                                >
                                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Batch</label>
                                <input
                                    value={editData.admissionYear}
                                    onChange={e => setEditData({ ...editData, admissionYear: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                            <Button onClick={handleSave} className="w-full">Save Changes</Button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{cls.studentCount || 0}</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Students</div>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{cls.todayPermissionsCount || 0}</div>
                                    <div className="text-xs font-semibold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider">Permissions Today</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <span className="text-gray-600 dark:text-gray-400">Regular Students</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{cls.regularCount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <span className="text-gray-600 dark:text-gray-400">Lateral Entry</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{cls.lateralCount || 0}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Class Representative</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                        {cls.userId?.name ? cls.userId.name.charAt(0) : 'CR'}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{cls.userId?.name || 'Not Assigned'}</div>
                                        <div className="text-sm text-gray-500">{cls.userId?.email || 'No email contact'}</div>
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full mt-2" onClick={onClose}>Close</Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
