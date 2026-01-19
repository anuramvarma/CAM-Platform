import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import {
    Calendar,
    Clock,
    ArrowRightLeft,
    UserMinus,
    UserPlus,
    AlertCircle,
    Users,
    ClipboardCheck
} from 'lucide-react';
import { toast } from 'react-toastify';

export const Comparison = () => {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [periodA, setPeriodA] = useState('1');
    const [periodB, setPeriodB] = useState('2');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await api.hod.getClasses();
                setClasses(res);
                if (res.length > 0) setSelectedClassId(res[0].id);
            } catch (err) {
                toast.error('Failed to load classes');
            }
        };
        fetchClasses();
    }, []);

    const handleCompare = async () => {
        if (!selectedClassId || !periodA || !periodB) {
            toast.warning('Please select class and periods');
            return;
        }
        if (periodA === periodB) {
            toast.warning('Please select different periods');
            return;
        }

        setLoading(true);
        try {
            const res = await api.hod.getComparison({
                date,
                classId: selectedClassId,
                periodA,
                periodB
            });
            setData(res);
        } catch (err: any) {
            toast.error(err.error || 'Failed to fetch comparison data');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const setQuickComparison = (a: string, b: string) => {
        setPeriodA(a);
        setPeriodB(b);
    };

    return (
        <div className="space-y-6 fade-in pb-10">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Period-wise Attendance Comparison</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Track student movement and identify mid-day absenteeism.
                </p>
            </header>

            {/* Filters */}
            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <Calendar size={14} /> Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <Users size={14} /> Class
                        </label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select a class</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.yearOfStudy}-{cls.dept}-{cls.section}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                <Clock size={14} /> Period A
                            </label>
                            <select
                                value={periodA}
                                onChange={(e) => setPeriodA(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                                    <option key={p} value={p.toString()}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                <Clock size={14} /> Period B
                            </label>
                            <select
                                value={periodB}
                                onChange={(e) => setPeriodB(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                                    <option key={p} value={p.toString()}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <Button onClick={handleCompare} disabled={loading} className="w-full h-11">
                        {loading ? 'Comparing...' : 'Run Analysis'}
                    </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider self-center mr-2">Quick Compare:</span>
                    <button
                        onClick={() => setQuickComparison('1', '4')}
                        className="px-3 py-1 text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                        Morning (1 vs 4)
                    </button>
                    <button
                        onClick={() => setQuickComparison('4', '5')}
                        className="px-3 py-1 text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full hover:bg-orange-100 transition-colors"
                    >
                        Lunch Break (4 vs 5)
                    </button>
                    <button
                        onClick={() => setQuickComparison('1', '8')}
                        className="px-3 py-1 text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full hover:bg-purple-100 transition-colors"
                    >
                        Full Day (1 vs 8)
                    </button>
                </div>
            </Card>

            {data && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    {/* Summary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-4 border-l-4 border-gray-400">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Strength</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.classInfo.total}</p>
                        </Card>
                        <Card className="p-4 border-l-4 border-blue-500">
                            <p className="text-xs font-semibold text-blue-600 uppercase">Period {periodA} Presentees</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                                {data.periodA.marked ? data.periodA.count : 'N/A'}
                                <span className="text-sm font-normal text-gray-400 ml-1">/ {data.classInfo.total}</span>
                            </p>
                            {!data.periodA.marked && <p className="text-[10px] text-red-500 font-medium">Not marked yet</p>}
                        </Card>
                        <Card className="p-4 border-l-4 border-indigo-500">
                            <p className="text-xs font-semibold text-indigo-600 uppercase">Period {periodB} Presentees</p>
                            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">
                                {data.periodB.marked ? data.periodB.count : 'N/A'}
                                <span className="text-sm font-normal text-gray-400 ml-1">/ {data.classInfo.total}</span>
                            </p>
                            {!data.periodB.marked && <p className="text-[10px] text-red-500 font-medium">Not marked yet</p>}
                        </Card>
                        <Card className={`p-4 border-l-4 ${data.periodB.count < data.periodA.count ? 'border-red-500 bg-red-50/50' : 'border-green-500 bg-green-50/50'}`}>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Net Stability</p>
                            <p className={`text-2xl font-bold mt-1 ${data.periodB.count < data.periodA.count ? 'text-red-600' : 'text-green-600'}`}>
                                {data.periodB.count - data.periodA.count > 0 ? '+' : ''}{data.periodB.count - data.periodA.count} Students
                            </p>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Students (Discipline Cases) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                                    <UserMinus size={18} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Left early (Present → Absent)
                                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                        {data.leftStudents.length}
                                    </span>
                                </h3>
                            </div>
                            <Card className="overflow-hidden border-red-100 dark:border-red-900/30">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Roll Number</th>
                                            <th className="px-4 py-3 font-semibold">Name</th>
                                            <th className="px-4 py-3 font-semibold text-center">Period {periodA}</th>
                                            <th className="px-4 py-3 font-semibold text-center">Period {periodB}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {data.leftStudents.map((s: any) => (
                                            <tr key={s.roll} className="hover:bg-red-50/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">{s.roll}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.name}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Present</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">Absent</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {data.leftStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 flex flex-col items-center gap-2">
                                                    <ClipboardCheck size={24} className="opacity-20" />
                                                    No students left early between these periods.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </Card>
                        </div>

                        {/* Came Students */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <UserPlus size={18} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Came later (Absent → Present)
                                    <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                        {data.cameStudents.length}
                                    </span>
                                </h3>
                            </div>
                            <Card className="overflow-hidden border-emerald-100 dark:border-emerald-900/30">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Roll Number</th>
                                            <th className="px-4 py-3 font-semibold">Name</th>
                                            <th className="px-4 py-3 font-semibold text-center">Period {periodA}</th>
                                            <th className="px-4 py-3 font-semibold text-center">Period {periodB}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {data.cameStudents.map((s: any) => (
                                            <tr key={s.roll} className="hover:bg-emerald-50/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">{s.roll}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.name}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">Absent</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Present</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {data.cameStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 flex flex-col items-center gap-2">
                                                    <ClipboardCheck size={24} className="opacity-20" />
                                                    No students came late between these periods.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </Card>
                        </div>
                    </div>

                    {!data.periodA.marked || !data.periodB.marked ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-bold text-amber-800">Incomplete Data</h4>
                                <p className="text-sm text-amber-700">
                                    One or both of the selected periods have not been marked for this class on this date.
                                    The comparison might be inaccurate or incomplete.
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {!data && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-300">
                        <ArrowRightLeft size={40} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Run Analysis</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">
                            Select a class and two periods to see student attendance transitions.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
