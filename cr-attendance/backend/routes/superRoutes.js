const express = require('express');
const router = express.Router();
const DailyAnalytics = require('../models/DailyAnalytics');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Permission = require('../models/Permission');

const getTodayDate = () => new Date().toISOString().split('T')[0];

const getRomanYear = (year) => {
    if (year == 1) return 'I';
    if (year == 2) return 'II';
    if (year == 3) return 'III';
    if (year == 4) return 'IV';
    return year;
};

// GET /overview/live - Today's live snapshot
router.get('/overview/live', async (req, res) => {
    try {
        const today = getTodayDate();
        const classes = await Class.find({});

        let totalStrength = 0;
        let totalPresent = 0;
        let totalAbsent = 0;

        const deptStats = {};

        // Count students per class
        const students = await Student.aggregate([
            { $group: { _id: "$classId", count: { $sum: 1 } } }
        ]);
        const studentMap = {};
        students.forEach(s => studentMap[s._id.toString()] = s.count);

        // Get attendance for today
        const attendances = await Attendance.find({ date: today });
        const attendanceMap = {};
        attendances.forEach(a => attendanceMap[a.classId.toString()] = a);

        for (const cls of classes) {
            const clsId = cls._id.toString();
            const stuCount = studentMap[clsId] || 0;
            const att = attendanceMap[clsId];

            const present = att && att.records ? att.records.filter(r => r.status === 'Present').length : 0;
            const absent = att && att.records ? att.records.filter(r => r.status === 'Absent').length : 0;

            if (!deptStats[cls.dept]) {
                deptStats[cls.dept] = {
                    name: cls.dept,
                    y1: 0, y2: 0, y3: 0, y4: 0,
                    totalStrength: 0,
                    present: 0,
                    absent: 0
                };
            }
            const d = deptStats[cls.dept];
            d.totalStrength += stuCount;
            if (cls.yearOfStudy === 1) d.y1 += stuCount;
            if (cls.yearOfStudy === 2) d.y2 += stuCount;
            if (cls.yearOfStudy === 3) d.y3 += stuCount;
            if (cls.yearOfStudy === 4) d.y4 += stuCount;

            d.present += present;
            d.absent += absent;

            totalStrength += stuCount;
            totalPresent += present;
            totalAbsent += absent;
        }

        const summary = Object.values(deptStats).map(d => {
            const percentage = d.totalStrength > 0 ? ((d.present / d.totalStrength) * 100).toFixed(1) : 0;
            return { ...d, percentage };
        });

        res.json({
            kpi: { totalStrength, totalPresent, totalAbsent },
            summary
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// GET /stats - Fixed stats
router.get('/stats', async (req, res) => {
    try {
        const classes = await Class.find({});
        const students = await Student.find({}, 'type classId');

        const depts = new Set(classes.map(c => c.dept));

        let totalSections = classes.length;
        let totalStrength = students.length;
        let regular = students.filter(s => s.type === 'Regular').length;
        let lateral = students.filter(s => s.type === 'Lateral').length;

        const yearStats = { 1: { sections: 0, strength: 0, reg: 0, lat: 0 }, 2: { sections: 0, strength: 0, reg: 0, lat: 0 }, 3: { sections: 0, strength: 0, reg: 0, lat: 0 }, 4: { sections: 0, strength: 0, reg: 0, lat: 0 } };
        const deptStats = {};

        const stuByClass = {};
        students.forEach(s => {
            if (!stuByClass[s.classId]) stuByClass[s.classId] = [];
            stuByClass[s.classId].push(s);
        });

        for (const cls of classes) {
            const y = cls.yearOfStudy;
            const d = cls.dept;

            if (yearStats[y]) {
                yearStats[y].sections++;
                const stus = stuByClass[cls._id] || [];
                yearStats[y].strength += stus.length;
                yearStats[y].reg += stus.filter(s => s.type === 'Regular').length;
                yearStats[y].lat += stus.filter(s => s.type === 'Lateral').length;
            }

            if (!deptStats[d]) deptStats[d] = { sections: 0, strength: 0, reg: 0, lat: 0 };
            deptStats[d].sections++;
            const stus = stuByClass[cls._id] || [];
            deptStats[d].strength += stus.length;
            deptStats[d].reg += stus.filter(s => s.type === 'Regular').length;
            deptStats[d].lat += stus.filter(s => s.type === 'Lateral').length;
        }

        res.json({
            fixed: {
                totalDepts: depts.size,
                totalSections,
                totalStrength,
                totalRegular: regular,
                totalLateral: lateral
            },
            yearWise: yearStats,
            deptWise: deptStats
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// GET /reports/live - Full report data needed for PDF
router.get('/reports/live', async (req, res) => {
    try {
        const today = getTodayDate();
        const classes = await Class.find({});
        const studentDocs = await Student.find({}, 'classId type'); // Only need classId and type if needed
        const attendances = await Attendance.find({ date: today });

        // Maps
        const attMap = {};
        attendances.forEach(a => attMap[a.classId.toString()] = a);

        const stuMap = {};
        studentDocs.forEach(s => {
            if (!stuMap[s.classId]) stuMap[s.classId] = 0;
            stuMap[s.classId]++;
        });

        // Group by Dept
        const deptMap = {};

        for (const cls of classes) {
            const cid = cls._id.toString();
            const d = cls.dept;
            const strength = stuMap[cid] || 0;
            const att = attMap[cid];
            const present = att && att.records ? att.records.filter(r => r.status === 'Present').length : 0;
            const absent = att && att.records ? att.records.filter(r => r.status === 'Absent').length : 0;
            const percentage = strength > 0 ? ((present / strength) * 100).toFixed(1) : 0;

            if (!deptMap[d]) {
                deptMap[d] = {
                    name: d,
                    totalStrength: 0,
                    present: 0,
                    absent: 0,
                    classes: []
                };
            }

            // Update Dept Summary
            deptMap[d].totalStrength += strength;
            deptMap[d].present += present;
            deptMap[d].absent += absent;

            // Add class detail
            deptMap[d].classes.push({
                year: cls.yearOfStudy,
                section: cls.section,
                strength,
                present,
                absent,
                percentage
            });
        }

        const reportData = Object.values(deptMap).map(dept => {
            // Sort classes: Year asc, then Section asc
            dept.classes.sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.section.localeCompare(b.section);
            });
            // Final summary percentage
            dept.percentage = dept.totalStrength > 0
                ? ((dept.present / dept.totalStrength) * 100).toFixed(1)
                : 0;

            return dept;
        });

        res.json(reportData);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// GET /year/:year/live - Year specific stats
router.get('/year/:year/live', async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const today = getTodayDate();

        const classes = await Class.find({ yearOfStudy: year });
        const classIds = classes.map(c => c._id);

        const students = await Student.find({ classId: { $in: classIds } });
        const attendances = await Attendance.find({ classId: { $in: classIds }, date: today });
        const permissions = await Permission.find({
            classId: { $in: classIds },
            startDate: { $lte: today },
            endDate: { $gte: today }
        });

        const totalStrength = students.length;
        let totalPresent = 0;
        let totalAbsent = 0;

        const deptDetail = {};

        const attMap = {};
        attendances.forEach(a => attMap[a.classId.toString()] = a);

        const stuMap = {};
        students.forEach(s => {
            if (!stuMap[s.classId]) stuMap[s.classId] = [];
            stuMap[s.classId].push(s);
        });

        for (const cls of classes) {
            const cid = cls._id.toString();
            const d = cls.dept;

            const stus = stuMap[cid] || [];
            const att = attMap[cid];
            const pres = att && att.records ? att.records.filter(r => r.status === 'Present').length : 0;
            const abs = att && att.records ? att.records.filter(r => r.status === 'Absent').length : 0;
            const clsPerms = permissions.filter(p => p.classId.toString() === cid).length;
            const percentage = stus.length > 0 ? ((pres / stus.length) * 100).toFixed(1) : 0;

            if (!deptDetail[d]) deptDetail[d] = {
                sections: 0,
                strength: 0,
                present: 0,
                absent: 0,
                perms: 0,
                sectionsList: [] // Add list to store individual class details
            };

            deptDetail[d].sections++;
            deptDetail[d].strength += stus.length;
            deptDetail[d].present += pres;
            deptDetail[d].absent += abs;
            deptDetail[d].perms += clsPerms;

            const name = `${getRomanYear(cls.yearOfStudy)}.${cls.dept}-${cls.section}`;

            // Push class details
            deptDetail[d].sectionsList.push({
                id: cid,
                name: name,
                strength: stus.length,
                present: pres,
                absent: abs,
                perms: clsPerms,
                percentage: percentage
            });

            totalPresent += pres;
            totalAbsent += abs;
        }

        const deptTable = Object.entries(deptDetail).map(([dept, data]) => {
            data.sectionsList.sort((a, b) => a.name.localeCompare(b.name));
            return {
                dept,
                ...data,
                percentage: data.strength > 0 ? ((data.present / data.strength) * 100).toFixed(1) : 0
            };
        });

        res.json({
            cards: {
                totalStrength,
                present: totalPresent,
                absent: totalAbsent,
                permissions: permissions.length
            },
            table: deptTable
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// GET /year/:year/history
router.get('/year/:year/history', async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const { date } = req.query; // YYYY-MM-DD

        if (!date) return res.status(400).json({ error: 'Date is required' });

        const analytics = await DailyAnalytics.find({ date });

        if (!analytics || analytics.length === 0) {
            return res.json({
                cards: { totalStrength: 0, present: 0, absent: 0, permissions: 0 },
                table: []
            });
        }

        let totalStrength = 0;
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalPerms = 0;

        const deptDetail = {};

        for (const deptDoc of analytics) {
            const d = deptDoc.department;
            const classes = deptDoc.classWise.filter(c => c.year === year);

            if (classes.length > 0) {
                if (!deptDetail[d]) deptDetail[d] = {
                    sections: 0, strength: 0, present: 0, absent: 0, perms: 0, sectionsList: []
                };

                for (const c of classes) {
                    deptDetail[d].sections++;
                    deptDetail[d].strength += c.totalStudents || 0;
                    deptDetail[d].present += c.present || 0;
                    deptDetail[d].absent += c.absent || 0;
                    deptDetail[d].perms += c.permissionsCount || 0;

                    const percentage = c.totalStudents > 0 ? ((c.present / c.totalStudents) * 100).toFixed(1) : 0;

                    deptDetail[d].sectionsList.push({
                        id: c.id || c.className, // Fallback if id missing
                        name: c.className,
                        strength: c.totalStudents || 0,
                        present: c.present || 0,
                        absent: c.absent || 0,
                        perms: c.permissionsCount || 0,
                        percentage: percentage
                    });

                    totalStrength += c.totalStudents || 0;
                    totalPresent += c.present || 0;
                    totalAbsent += c.absent || 0;
                    totalPerms += c.permissionsCount || 0;
                }
            }
        }

        const deptTable = Object.entries(deptDetail).map(([dept, data]) => {
            data.sectionsList.sort((a, b) => a.name.localeCompare(b.name));
            return {
                dept,
                ...data,
                percentage: data.strength > 0 ? ((data.present / data.strength) * 100).toFixed(1) : 0
            };
        });

        res.json({
            cards: {
                totalStrength,
                present: totalPresent,
                absent: totalAbsent,
                permissions: totalPerms
            },
            table: deptTable
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
