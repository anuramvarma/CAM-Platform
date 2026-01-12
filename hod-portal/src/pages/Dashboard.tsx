import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';
import { Users, UserCheck, UserX, FileText, RefreshCw, GraduationCap, UserPlus, ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '../components/ui/Button';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Dashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [showDetailed, setShowDetailed] = useState(false);

    const handleExportExcel = () => {
        if (!stats?.classSummary) return;

        const date = new Date().toISOString().split('T')[0];

        // Prepare Data
        const data = stats.classSummary.map((cls: any) => ({
            'Class Name': cls.className,
            'Total Strength': cls.totalStudents || 0,
            'Total Presentees': cls.present || 0,
            'Total Absentees': cls.absent || 0,
            'Total Permissions': cls.permissionsCount || 0
        }));

        // Add Total Row
        data.push({
            'Class Name': 'TOTAL',
            'Total Strength': stats.totalStudents,
            'Total Presentees': stats.presentToday,
            'Total Absentees': stats.absentToday,
            'Total Permissions': stats.activePermissions
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `Daily_Attendance_${date}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!stats?.classSummary) return;
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text('Daily Attendance Report', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Date: ${date}`, 14, 32);
        doc.text('Department: Computer Science', 14, 38);

        // Summary
        doc.setFillColor(245, 247, 250);
        doc.setDrawColor(200, 200, 200);
        doc.rect(14, 45, 182, 25, 'FD'); // Fill and Draw

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Present:`, 20, 58);
        doc.setFontSize(12);
        doc.setTextColor(0, 128, 0); // Green
        doc.text(`${stats.presentToday}`, 20, 64);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Absent:`, 80, 58);
        doc.setFontSize(12);
        doc.setTextColor(200, 0, 0); // Red
        doc.text(`${stats.absentToday}`, 80, 64);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Active Permissions:`, 140, 58);
        doc.setFontSize(12);
        doc.setTextColor(200, 150, 0); // Orange
        doc.text(`${stats.activePermissions}`, 140, 64);

        // Table
        const tableData = stats.classSummary.map((cls: any) => [
            cls.className,
            cls.totalStudents,
            cls.present,
            cls.absent,
            cls.permissionsCount || 0
        ]);

        // Add Total Row
        tableData.push([
            'TOTAL',
            stats.totalStudents,
            stats.presentToday,
            stats.absentToday,
            stats.activePermissions
        ]);

        autoTable(doc, {
            startY: 80,
            head: [['Class Name', 'Total Strength', 'Present', 'Absent', 'Permissions']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 10 }, // Indigo-600
            alternateRowStyles: { fillColor: [249, 250, 251] },
            styles: { fontSize: 10, cellPadding: 4, valign: 'middle' },
            columnStyles: {
                0: { fontStyle: 'bold' } // Class Name bold
            },
            didParseCell: (data) => {
                if (data.row.index === tableData.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [240, 240, 240];
                }
            }
        });

        doc.save(`Daily_Attendance_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const [viewMode, setViewMode] = useState<'DAILY' | 'STATS'>('DAILY');
    const [selectedStatYear, setSelectedStatYear] = useState<number | null>(null);

    const fetchStats = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const data = await api.hod.getStats();
            if (data && data.classSummary) {
                data.classSummary.sort((a: any, b: any) => {
                    // Assuming className format: "Year-Dept-Section" e.g., "1-CSE-A"
                    const partsA = a.className.split('-');
                    const partsB = b.className.split('-');

                    const yearA = parseInt(partsA[0]) || 0;
                    const yearB = parseInt(partsB[0]) || 0;
                    if (yearA !== yearB) return yearA - yearB;

                    const deptA = partsA[1] || '';
                    const deptB = partsB[1] || '';
                    if (deptA !== deptB) return deptA.localeCompare(deptB);

                    const secA = partsA[2] || '';
                    const secB = partsB[2] || '';
                    return secA.localeCompare(secB);
                });
            }
            setStats(data);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const cards = [
        { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'text-blue-500', border: 'border-blue-500' },
        { label: 'Present Today', value: stats?.presentToday || 0, icon: UserCheck, color: 'text-green-500', border: 'border-green-500' },
        { label: 'Absent Today', value: stats?.absentToday || 0, icon: UserX, color: 'text-red-500', border: 'border-red-500' },
        { label: 'Active Permissions', value: stats?.activePermissions || 0, icon: FileText, color: 'text-yellow-500', border: 'border-yellow-500' },
    ];

    // Compute Year-wise Stats for Daily View
    const yearStats: Record<number, { total: number, present: number, absent: number, permissions: number }> = {};
    // Compute Year-wise Stats for Statistics View (Strategic)
    const yearStrategicStats: Record<number, { total: number, regular: number, lateral: number }> = {};

    if (stats?.classSummary) {
        stats.classSummary.forEach((cls: any) => {
            const year = cls.year || parseInt(cls.className.split('-')[0]) || 0;

            // Daily Stats
            if (!yearStats[year]) {
                yearStats[year] = { total: 0, present: 0, absent: 0, permissions: 0 };
            }
            yearStats[year].total += cls.totalStudents || 0;
            yearStats[year].present += cls.present || 0;
            yearStats[year].absent += cls.absent || 0;
            yearStats[year].permissions += cls.permissionsCount || 0;

            // Strategic Stats
            if (!yearStrategicStats[year]) {
                yearStrategicStats[year] = { total: 0, regular: 0, lateral: 0 };
            }
            yearStrategicStats[year].total += cls.totalStudents || 0;
            yearStrategicStats[year].regular += cls.regularCount || 0;
            yearStrategicStats[year].lateral += cls.lateralCount || 0;
        });
    }



    return (
        <div className="space-y-6 fade-in pb-10">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {viewMode === 'DAILY' ? 'Overview and Analytics' : 'Department Statistics'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {viewMode === 'DAILY' ? "Today's overall department status" : "Strategic academic analytics"}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white text-green-700 border border-green-200 hover:bg-green-50 shadow-sm"
                            onClick={handleExportExcel}
                            disabled={!stats}
                        >
                            <FileSpreadsheet size={16} className="mr-2" />
                            Excel
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white text-red-700 border border-red-200 hover:bg-red-50 shadow-sm"
                            onClick={handleExportPDF}
                            disabled={!stats}
                        >
                            <Download size={16} className="mr-2" />
                            PDF
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                            onClick={() => fetchStats(true)}
                            disabled={refreshing}
                        >
                            <RefreshCw size={14} className={`${refreshing ? 'animate-spin' : ''} mr-1.5`} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('DAILY')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'DAILY' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Daily Dashboard
                        </button>
                        <button
                            onClick={() => setViewMode('STATS')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'STATS' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Statistics
                        </button>
                    </div>

                    {viewMode === 'DAILY' && (
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${!showDetailed ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>Overall</span>
                            <button
                                onClick={() => setShowDetailed(!showDetailed)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${showDetailed ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showDetailed ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                            <span className={`text-sm font-medium ${showDetailed ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>Year-wise</span>
                        </div>
                    )}
                </div>
            </header>

            {viewMode === 'DAILY' ? (
                <>
                    {!showDetailed ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {cards.map((card, idx) => (
                                <Card key={idx} className={`p-6 border-l-4 ${card.border} hover:shadow-lg transition-all`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</h3>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{card.value}</p>
                                        </div>
                                        <card.icon className={`w-6 h-6 ${card.color}`} />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.keys(yearStats).sort().map((yearStr) => {
                                const year = parseInt(yearStr);
                                const data = yearStats[year];
                                return (
                                    <div key={year} className="space-y-3 animate-in slide-in-from-left-2">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800 pb-2">
                                            {year === 1 ? '1st' : year === 2 ? '2nd' : year === 3 ? '3rd' : `${year}th`} Year
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50">
                                                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Total Strength</div>
                                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{data.total}</div>
                                            </Card>
                                            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50">
                                                <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Presentees</div>
                                                <div className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{data.present}</div>
                                            </Card>
                                            <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50">
                                                <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Absentees</div>
                                                <div className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{data.absent}</div>
                                            </Card>
                                            <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/50">
                                                <div className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase">Permissions</div>
                                                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{data.permissions}</div>
                                            </Card>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Class-wise Strength Summary</h2>
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Class Name</th>
                                            <th className="px-6 py-4 font-medium">Total Strength</th>
                                            <th className="px-6 py-4 font-medium text-green-600 dark:text-green-400">Presentees</th>
                                            <th className="px-6 py-4 font-medium text-red-600 dark:text-red-400">Absentees</th>
                                            <th className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">Active Permissions</th>
                                            <th className="px-6 py-4 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {stats?.classSummary?.map((cls: any) => (
                                            <tr key={cls.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{cls.className}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{cls.totalStudents}</td>
                                                <td className="px-6 py-4 text-green-600 dark:text-green-400 font-medium">{cls.present}</td>
                                                <td className="px-6 py-4 text-red-600 dark:text-red-400 font-medium">{cls.absent}</td>
                                                <td className="px-6 py-4 text-blue-600 dark:text-blue-400 font-medium">{cls.permissionsCount || 0}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls.status === 'Marked'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        }`}>
                                                        {cls.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {stats?.classSummary?.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                    No classes found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </>
            ) : (
                <div className="space-y-8 animate-in fade-in zoom-in-95">
                    {/* Department Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="p-6 border-l-4 border-blue-500 bg-white dark:bg-gray-800">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Department Strength</h3>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{stats?.totalStudents || 0}</p>
                            <Users className="w-8 h-8 text-blue-500 absolute top-6 right-6 opacity-20" />
                        </Card>
                        <Card className="p-6 border-l-4 border-indigo-500 bg-white dark:bg-gray-800">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Regular Students</h3>
                            <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{stats?.regularTotal || 0}</p>
                            <GraduationCap className="w-8 h-8 text-indigo-500 absolute top-6 right-6 opacity-20" />
                        </Card>
                        <Card className="p-6 border-l-4 border-orange-500 bg-white dark:bg-gray-800">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Lateral Entry</h3>
                            <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mt-2">{stats?.lateralTotal || 0}</p>
                            <UserPlus className="w-8 h-8 text-orange-500 absolute top-6 right-6 opacity-20" />
                        </Card>
                        <Card className="p-6 border-l-4 border-teal-500 bg-white dark:bg-gray-800">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Classes</h3>
                            <p className="text-4xl font-bold text-teal-600 dark:text-teal-400 mt-2">{stats?.totalClasses || 0}</p>
                            <FileText className="w-8 h-8 text-teal-500 absolute top-6 right-6 opacity-20" />
                        </Card>
                    </div>

                    {/* Year-wise Strength Breakdown or Drill Down */}
                    <Card className="p-6">
                        {selectedStatYear ? (
                            <div className="space-y-6 animate-in slide-in-from-right-2">
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedStatYear(null)}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Overview
                                    </Button>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {selectedStatYear === 1 ? '1st' : selectedStatYear === 2 ? '2nd' : selectedStatYear === 3 ? '3rd' : `${selectedStatYear}th`} Year Detailed Section Analysis
                                    </h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 rounded-l-lg">Class Name</th>
                                                <th className="px-6 py-4">Total Regular</th>
                                                <th className="px-6 py-4">Total Lateral</th>
                                                <th className="px-6 py-4 rounded-r-lg">Total Strength</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {stats?.classSummary
                                                ?.filter((c: any) => (c.year || parseInt(c.className.split('-')[0])) === selectedStatYear)
                                                .map((cls: any) => (
                                                    <tr key={cls.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                            {cls.className}
                                                        </td>
                                                        <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-medium">
                                                            {cls.regularCount || 0}
                                                        </td>
                                                        <td className="px-6 py-4 text-orange-600 dark:text-orange-400 font-medium">
                                                            {cls.lateralCount || 0}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                            {cls.totalStudents || 0}
                                                        </td>
                                                    </tr>
                                                ))}
                                            {stats?.classSummary?.filter((c: any) => (c.year || parseInt(c.className.split('-')[0])) === selectedStatYear).length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                        No classes found for this year.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Overall Strength by Year (Click to Expand)</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 rounded-l-lg">Year</th>
                                                <th className="px-6 py-4">Total Strength</th>
                                                <th className="px-6 py-4">Regular Students</th>
                                                <th className="px-6 py-4 rounded-r-lg">Lateral Entry</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {Object.keys(yearStrategicStats).sort().map((yearStr) => {
                                                const year = parseInt(yearStr);
                                                const data = yearStrategicStats[year];
                                                return (
                                                    <tr
                                                        key={year}
                                                        onClick={() => setSelectedStatYear(year)}
                                                        className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                                    >
                                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                            {year === 1 ? '1st' : year === 2 ? '2nd' : year === 3 ? '3rd' : `${year}th`} Year
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-bold text-gray-800 dark:text-gray-200 w-8">{data.total}</span>
                                                                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden max-w-[100px]">
                                                                    <div style={{ width: '100%' }} className="h-full bg-gray-400/50" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-bold text-indigo-600 dark:text-indigo-400 w-8">{data.regular}</span>
                                                                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden max-w-[100px]">
                                                                    <div style={{ width: `${(data.regular / data.total) * 100}%` }} className="h-full bg-indigo-500" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-bold text-orange-600 dark:text-orange-400 w-8">{data.lateral}</span>
                                                                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden max-w-[100px]">
                                                                    <div style={{ width: `${(data.lateral / data.total) * 100}%` }} className="h-full bg-orange-500" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};
