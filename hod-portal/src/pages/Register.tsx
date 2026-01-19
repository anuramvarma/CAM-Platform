import { useEffect, useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import {
    Calendar,
    Users,
    FileText,
    ArrowRightCircle,
    Download,
    FileSpreadsheet,
    Printer,
    Search,
    ChevronDown,
    Filter,
    LayoutDashboard,
    UserCheck,
    CalendarDays,
    X
} from 'lucide-react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';

// MUI Calendar Imports
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { } from '@mui/x-date-pickers/themeAugmentation';
import dayjs, { Dayjs } from 'dayjs';

export const Register = () => {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [date, setDate] = useState<Dayjs | null>(dayjs());
    const [showCalendar, setShowCalendar] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Detect if system is in dark mode for MUI theme
    const isDarkMode = document.documentElement.classList.contains('dark');

    const muiTheme = useMemo(() => createTheme({
        palette: {
            mode: isDarkMode ? 'dark' : 'light',
            primary: {
                main: '#4f46e5', // indigo-600
            },
            background: {
                paper: isDarkMode ? '#0f172a' : '#ffffff', // slate-900 or white
            },
        },
        typography: {
            fontFamily: '"Inter", sans-serif',
        },
        components: {
            MuiDateCalendar: {
                styleOverrides: {
                    root: {
                        backgroundColor: isDarkMode ? 'transparent' : '#ffffff',
                    }
                }
            },
            MuiPickersDay: {
                styleOverrides: {
                    root: {
                        '&.Mui-selected': {
                            backgroundColor: '#4f46e5 !important',
                        },
                        '&:hover': {
                            backgroundColor: isDarkMode ? 'rgba(79, 70, 229, 0.2) !important' : 'rgba(79, 70, 229, 0.1) !important',
                        }
                    }
                }
            }
        }
    }), [isDarkMode]);

    const toRoman = (n: any) => {
        const num = parseInt(n);
        if (num === 1) return 'I';
        if (num === 2) return 'II';
        if (num === 3) return 'III';
        if (num === 4) return 'IV';
        return n;
    };

    const formatClassName = (name: string) => {
        if (!name) return '';
        const parts = name.split('-');
        if (parts.length >= 3) {
            return `${toRoman(parts[0])}.${parts.slice(1).join('-')}`;
        }
        return name;
    };

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

    const handleLoadRegister = async () => {
        if (!selectedClassId || !date) {
            toast.warning('Please select class and date');
            return;
        }

        setLoading(true);
        try {
            const res = await api.hod.getRegister({
                date: date.format('YYYY-MM-DD'),
                classId: selectedClassId
            });
            setData(res);
        } catch (err: any) {
            toast.error(err.error || 'Failed to fetch register data');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!data || !date) return;

        const fileName = `Attendance_Register_${data.classInfo.name}_${date.format('DD-MM-YYYY')}.xlsx`;
        const exportData = data.register.map((s: any) => ({
            'S.No': s.sNo,
            'Roll Number': s.rollNumber,
            'Period 1': s.attendance[1],
            'Period 2': s.attendance[2],
            'Period 3': s.attendance[3],
            'Period 4': s.attendance[4],
            'Lunch': 'LUNCH BREAK',
            'Period 5': s.attendance[5],
            'Period 6': s.attendance[6],
            'Period 7': s.attendance[7],
            'Period 8': s.attendance[8],
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Register");
        XLSX.writeFile(wb, fileName);
    };

    const handleExportPDF = () => {
        if (!data || !date) return;
        const doc = new jsPDF('l', 'mm', 'a4');

        const className = formatClassName(data.classInfo.name);
        const formattedDate = date.format('DD-MM-YYYY');

        doc.setFontSize(14);
        doc.text(`Class Name : ${className}`, 14, 15);
        doc.text(`Date : ${formattedDate}`, 14, 22);

        const tableData = data.register.map((s: any) => [
            s.sNo,
            s.rollNumber,
            s.attendance[1],
            s.attendance[2],
            s.attendance[3],
            s.attendance[4],
            'LUNCH',
            s.attendance[5],
            s.attendance[6],
            s.attendance[7],
            s.attendance[8],
        ]);

        autoTable(doc, {
            startY: 30,
            head: [['S.No', 'Roll No', 'P1', 'P2', 'P3', 'P4', 'Lunch', 'P5', 'P6', 'P7', 'P8']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 40 },
                6: { fillColor: [240, 240, 240] }
            },
            didParseCell: (hookData) => {
                if (hookData.section === 'body' && hookData.column.index >= 2 && hookData.column.index !== 6) {
                    const text = hookData.cell.text[0];
                    if (text === 'P') hookData.cell.styles.textColor = [0, 128, 0];
                    if (text === 'A') hookData.cell.styles.textColor = [200, 0, 0];
                }
            }
        });

        doc.save(`Register_${className}_${formattedDate}.pdf`);
    };

    return (
        <div className="space-y-8 fade-in pb-16 px-4 md:px-0">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                        <LayoutDashboard size={14} />
                        Attendance Intelligence
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Department <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Register</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl">
                        Comprehensive daily audit of period-wise student attendance for precise verification and monitoring.
                    </p>
                </div>
                {data && (
                    <div className="flex flex-wrap gap-3">
                        <Button variant="secondary" size="sm" onClick={handleExportExcel} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300">
                            <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Excel</span>
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleExportPDF} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300">
                            <Download size={16} /> <span className="hidden sm:inline">PDF</span>
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => window.print()} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300">
                            <Printer size={16} /> <span className="hidden sm:inline">Print</span>
                        </Button>
                    </div>
                )}
            </header>

            {/* Controls Card */}
            <Card className="p-1 overflow-visible bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-2xl relative z-40">
                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-4 space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 ml-1">
                            <Users size={16} className="text-indigo-500" /> Target Class
                        </label>
                        <div className="relative group">
                            <select
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all group-hover:border-indigo-400"
                            >
                                <option value="">Target Class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {formatClassName(`${cls.yearOfStudy}-${cls.dept}-${cls.section}`)}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-indigo-500 transition-colors" size={18} />
                        </div>
                    </div>

                    <div className="md:col-span-4 space-y-2 relative">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 ml-1">
                            <CalendarDays size={16} className="text-indigo-500" /> Registry Date
                        </label>
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all hover:border-indigo-400 font-medium"
                        >
                            <div className="flex items-center gap-3">
                                <Calendar size={18} className="text-indigo-400" />
                                <span>{date ? date.format('DD MMM, YYYY') : 'Select Date'}</span>
                            </div>
                            <ChevronDown className={`text-gray-400 transition-transform duration-300 ${showCalendar ? 'rotate-180' : ''}`} size={16} />
                        </button>

                        <AnimatePresence>
                            {showCalendar && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                >
                                    <div className="flex justify-between items-center px-4 pt-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Audit Date</span>
                                        <button onClick={() => setShowCalendar(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                            <X size={14} className="text-gray-500" />
                                        </button>
                                    </div>
                                    <ThemeProvider theme={muiTheme}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DateCalendar
                                                value={date}
                                                onChange={(newValue) => {
                                                    setDate(newValue);
                                                    setShowCalendar(false);
                                                }}
                                                disableFuture
                                                sx={{
                                                    width: '100%',
                                                    '& .MuiPickersFadeTransitionGroup-root': {
                                                        maxHeight: '280px',
                                                    }
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </ThemeProvider>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="md:col-span-4">
                        <Button
                            onClick={handleLoadRegister}
                            disabled={loading}
                            className="w-full h-[50px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Analyzing...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Filter size={18} />
                                    Fetch Registry
                                    <ArrowRightCircle size={18} />
                                </div>
                            )}
                        </Button>
                    </div>
                </div>

                {data && (
                    <div className="px-6 pb-6 animate-in slide-in-from-top-2">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent mb-6" />
                        <div className="relative group max-w-xl mx-auto">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by student roll number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-100/50 dark:bg-gray-800/30 border border-transparent focus:border-indigo-500/50 rounded-2xl dark:text-white outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                            />
                        </div>
                    </div>
                )}
            </Card>

            {data ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-6">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            label="Class"
                            value={formatClassName(data.classInfo.name)}
                            icon={<Users className="text-indigo-500" size={20} />}
                            gradient="from-indigo-500/10 to-purple-500/10"
                        />
                        <MetricCard
                            label="Total Students"
                            value={data.classInfo.totalStudents}
                            icon={<UserCheck className="text-emerald-500" size={20} />}
                            gradient="from-emerald-500/10 to-teal-500/10"
                        />
                        <MetricCard
                            label="Record Date"
                            value={date?.format('DD MMM, YYYY')}
                            icon={<Calendar className="text-blue-500" size={20} />}
                            gradient="from-blue-500/10 to-cyan-500/10"
                        />
                        <MetricCard
                            label="Audit Status"
                            value={`${Object.values(data.summary).filter(v => v !== null).length} / 8 Periods`}
                            icon={<FileText className="text-amber-500" size={20} />}
                            gradient="from-amber-500/10 to-orange-500/10"
                        />
                    </div>

                    {/* Registry Table Card */}
                    <Card className="border-none shadow-2xl overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <div className="overflow-x-auto relative">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-black/40 border-b border-gray-200 dark:border-gray-800">
                                        <th className="px-6 py-5 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs sticky left-0 z-30 bg-gray-100 dark:bg-gray-950 w-20">S.No</th>
                                        <th className="px-6 py-5 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs sticky left-20 z-30 bg-gray-100 dark:bg-gray-950 w-44 shadow-xl shadow-black/5 dark:shadow-white/5">Roll Numbers</th>
                                        {[1, 2, 3, 4].map(p => (
                                            <th key={p} className="px-4 py-5 font-bold text-center text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs border-l border-gray-200 dark:border-gray-800">P{p}</th>
                                        ))}
                                        <th className="px-2 py-5 font-black text-center text-gray-300 dark:text-gray-700 bg-gray-200/50 dark:bg-gray-800/30 uppercase tracking-[0.2em] text-[10px] transform -rotate-180 [writing-mode:vertical-lr]">LUNCH</th>
                                        {[5, 6, 7, 8].map(p => (
                                            <th key={p} className="px-4 py-5 font-bold text-center text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs border-l border-gray-200 dark:border-gray-800">P{p}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                                    {(() => {
                                        const filteredStudents = data.register.filter((s: any) => s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));
                                        return filteredStudents.map((student: any, index: number) => (
                                            <tr key={student.rollNumber} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                                <td className="px-6 py-4 text-gray-500 font-medium sticky left-0 z-10 bg-white dark:bg-gray-950 group-hover:bg-transparent transition-colors">{student.sNo}</td>
                                                <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-white sticky left-20 z-10 bg-white dark:bg-gray-950 shadow-xl shadow-black/5 dark:shadow-white/5 group-hover:bg-transparent transition-colors">
                                                    {student.rollNumber}
                                                </td>
                                                {[1, 2, 3, 4].map(p => (
                                                    <td key={p} className="px-4 py-4 text-center border-l border-gray-100 dark:border-gray-800/30">
                                                        <StatusBadge status={student.attendance[p]} />
                                                    </td>
                                                ))}
                                                {index === 0 && (
                                                    <td
                                                        rowSpan={filteredStudents.length}
                                                        className="
    bg-red-50/80 dark:bg-red-900/20
    border-l border-r border-red-200 dark:border-red-800/50
    w-12 relative overflow-hidden
  "
                                                    >
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="[writing-mode:vertical-lr] rotate-180 flex items-center gap-4">
                                                                <span className="
        text-[11px] font-black tracking-[0.5em]
        text-red-500 dark:text-red-400
        uppercase whitespace-nowrap
      ">
                                                                    LUNCH BREAK
                                                                </span>

                                                                <div className="
        w-px h-12
        bg-gradient-to-b
        from-transparent via-red-300 dark:via-red-700 to-transparent
      " />

                                                                <span className="
        text-[11px] font-black tracking-[0.5em]
        text-red-500 dark:text-red-400
        uppercase whitespace-nowrap
      ">
                                                                    1hr
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                )}
                                                {[5, 6, 7, 8].map(p => (
                                                    <td key={p} className="px-4 py-4 text-center border-l border-gray-100 dark:border-gray-800/30">
                                                        <StatusBadge status={student.attendance[p]} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                                <tfoot className="bg-gray-50 dark:bg-black/30 backdrop-blur-md">
                                    <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                                        <td colSpan={2} className="px-6 py-5 text-right font-black uppercase text-gray-400 dark:text-gray-500 text-[10px] tracking-widest pl-20">Period Present Count</td>
                                        {[1, 2, 3, 4].map(p => (
                                            <td key={p} className="px-4 py-5 text-center font-black text-indigo-600 dark:text-indigo-400 text-lg">
                                                {data.summary[p] !== null ? data.summary[p] : '—'}
                                            </td>
                                        ))}
                                        <td className="bg-gray-100/80 dark:bg-gray-800/50 border-l border-r border-gray-200 dark:border-gray-800"></td>
                                        {[5, 6, 7, 8].map(p => (
                                            <td key={p} className="px-4 py-5 text-center font-black text-indigo-600 dark:text-indigo-400 text-lg">
                                                {data.summary[p] !== null ? data.summary[p] : '—'}
                                            </td>
                                        ))}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center group">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 group-hover:bg-indigo-500/30 transition-all duration-500" />
                        <div className="relative w-32 h-32 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-center text-gray-200 dark:text-gray-800 shadow-2xl overflow-hidden">
                            <FileText size={56} />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-indigo-500/10" />
                        </div>
                    </div>
                    <div className="space-y-3 relative z-10">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Ready for Observation?</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium">
                            Select a class and date from the dashboard filters above to generate a complete attendance audit.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ label, value, icon, gradient }: { label: string, value: any, icon: any, gradient: string }) => (
    <Card className="relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        <div className="p-5 flex items-start justify-between relative z-10">
            <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest">{label}</p>
                <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</h4>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                {icon}
            </div>
        </div>
    </Card>
);

const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'P') {
        return (
            <div className="relative inline-flex group/badge">
                <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-black border border-emerald-100 dark:border-emerald-500/20 shadow-sm group-hover/badge:scale-110 group-hover/badge:bg-emerald-100 dark:group-hover/badge:bg-emerald-500/20 transition-all duration-200">
                    P
                </span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
            </div>
        );
    }
    if (status === 'A') {
        return (
            <div className="relative inline-flex group/badge">
                <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-black border border-rose-100 dark:border-rose-500/20 shadow-sm group-hover/badge:scale-110 group-hover/badge:bg-rose-100 dark:group-hover/badge:bg-rose-500/20 transition-all duration-200">
                    A
                </span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
        );
    }
    return (
        <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800/30 text-gray-300 dark:text-gray-700 text-xs font-bold border border-gray-100 dark:border-gray-800/50">
            •
        </span>
    );
};
